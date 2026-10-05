import "server-only";
import { addMinutes } from "date-fns";
import { getSql } from "@/lib/db";
import { BUFFER_MINUTES, getDateRange, validateRequestedWindow } from "@/lib/scheduling";
import type { AdminFilters, AppointmentInput } from "@/lib/validation";
import type { AdminAppointment, AppointmentHistoryItem, AppointmentStatus, PublicAppointment } from "@/types/appointments";

type AppointmentRow = {
  id: string;
  requester_name: string;
  department: string;
  email: string;
  phone: string;
  starts_at: Date;
  ends_at: Date;
  purpose: string;
  notes: string | null;
  status: AppointmentStatus;
  created_at: Date;
  updated_at: Date;
  approved_at: Date | null;
  rejected_at: Date | null;
  approved_by: string | null;
};

type HistoryRow = {
  id: string;
  appointment_id: string;
  action: string;
  actor: string;
  note: string | null;
  created_at: Date;
};

const appointmentColumns = `
  id, requester_name, department, email, phone, starts_at, ends_at, purpose, notes, status,
  created_at, updated_at, approved_at, rejected_at, approved_by
`;

function toPublic(row: AppointmentRow): PublicAppointment {
  return {
    id: row.id,
    startsAt: row.starts_at.toISOString(),
    endsAt: row.ends_at.toISOString(),
    purpose: row.purpose,
    department: row.department,
    status: row.status
  };
}

function toAdmin(row: AppointmentRow): AdminAppointment {
  return {
    ...toPublic(row),
    requesterName: row.requester_name,
    email: row.email,
    phone: row.phone,
    notes: row.notes,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    approvedAt: row.approved_at?.toISOString() ?? null,
    rejectedAt: row.rejected_at?.toISOString() ?? null,
    approvedBy: row.approved_by
  };
}

function toHistory(row: HistoryRow): AppointmentHistoryItem {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    action: row.action,
    actor: row.actor,
    note: row.note,
    createdAt: row.created_at.toISOString()
  };
}

export async function listPublicAppointments(from: Date, to: Date) {
  const sql = getSql();
  const rows = await sql<AppointmentRow[]>`
    SELECT ${sql.unsafe(appointmentColumns)}
    FROM appointments
    WHERE status IN ('PENDING', 'APPROVED')
      AND starts_at < ${to}
      AND ends_at > ${from}
    ORDER BY starts_at ASC
  `;
  return rows.map(toPublic);
}

export async function listAppointmentsForDay(date: string) {
  const { start, end } = getDateRange(date);
  return listPublicAppointments(start, end);
}

export async function createAppointment(input: AppointmentInput) {
  const sql = getSql();
  const { startsAt, endsAt } = validateRequestedWindow(input.date, input.startTime, input.endTime);

  const created = await sql.begin(async (transaction) => {
    const rows = await transaction<AppointmentRow[]>`
      INSERT INTO appointments (
        requester_name, department, email, phone, starts_at, ends_at, purpose, notes, status
      ) VALUES (
        ${input.requesterName}, ${input.department}, ${input.email}, ${input.phone},
        ${startsAt}, ${endsAt}, ${input.purpose}, ${input.notes ?? null}, 'PENDING'
      )
      RETURNING ${transaction.unsafe(appointmentColumns)}
    `;

    const appointment = rows[0];
    await transaction`
      INSERT INTO appointment_history (appointment_id, action, actor, note)
      VALUES (${appointment.id}, 'CREATED', 'SOLICITANTE', 'Solicitação criada e reservada preventivamente.')
    `;
    return appointment;
  });

  return toAdmin(created);
}

export async function listAdminAppointments(filters: AdminFilters) {
  const sql = getSql();
  const from = filters.from ? getDateRange(filters.from).start : null;
  const to = filters.to ? getDateRange(filters.to).end : null;
  const requester = filters.requester ? `%${filters.requester}%` : null;
  const department = filters.department ? `%${filters.department}%` : null;
  const purpose = filters.purpose ? `%${filters.purpose}%` : null;

  const rows = await sql<AppointmentRow[]>`
    SELECT ${sql.unsafe(appointmentColumns)}
    FROM appointments
    WHERE (${filters.status ?? null}::appointment_status IS NULL OR status = ${filters.status ?? null}::appointment_status)
      AND (${from}::timestamptz IS NULL OR starts_at >= ${from}::timestamptz)
      AND (${to}::timestamptz IS NULL OR starts_at < ${to}::timestamptz)
      AND (${requester}::text IS NULL OR requester_name ILIKE ${requester})
      AND (${department}::text IS NULL OR department ILIKE ${department})
      AND (${purpose}::text IS NULL OR purpose ILIKE ${purpose})
    ORDER BY starts_at ASC
  `;

  return rows.map(toAdmin);
}

export async function getAppointmentById(id: string) {
  const sql = getSql();
  const rows = await sql<AppointmentRow[]>`
    SELECT ${sql.unsafe(appointmentColumns)} FROM appointments WHERE id = ${id} LIMIT 1
  `;
  return rows[0] ? toAdmin(rows[0]) : null;
}

export async function getAppointmentHistory(id: string) {
  const sql = getSql();
  const rows = await sql<HistoryRow[]>`
    SELECT id, appointment_id, action, actor, note, created_at
    FROM appointment_history WHERE appointment_id = ${id} ORDER BY created_at DESC
  `;
  return rows.map(toHistory);
}

export async function transitionAppointment(
  id: string,
  action: "approve" | "reject" | "cancel",
  actor: string,
  note?: string
) {
  const sql = getSql();
  const status: AppointmentStatus = action === "approve" ? "APPROVED" : action === "reject" ? "REJECTED" : "CANCELLED";

  const updated = await sql.begin(async (transaction) => {
    const existingRows = await transaction<AppointmentRow[]>`
      SELECT ${transaction.unsafe(appointmentColumns)} FROM appointments WHERE id = ${id} FOR UPDATE
    `;
    const existing = existingRows[0];
    if (!existing) throw new Error("NOT_FOUND");

    if (action !== "cancel" && existing.status !== "PENDING") {
      throw new Error("INVALID_TRANSITION");
    }
    if (action === "cancel" && ["REJECTED", "CANCELLED"].includes(existing.status)) {
      throw new Error("INVALID_TRANSITION");
    }

    const rows = await transaction<AppointmentRow[]>`
      UPDATE appointments
      SET status = ${status},
          approved_at = ${action === "approve" ? new Date() : null},
          rejected_at = ${action === "reject" ? new Date() : null},
          approved_by = ${action === "approve" ? actor : null},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING ${transaction.unsafe(appointmentColumns)}
    `;

    await transaction`
      INSERT INTO appointment_history (appointment_id, action, actor, note)
      VALUES (${id}, ${action.toUpperCase()}, ${actor}, ${note ?? null})
    `;
    return rows[0];
  });

  return toAdmin(updated);
}

export async function getAdminDashboardStats() {
  const sql = getSql();
  const todayRange = getDateRange(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Rio_Branco" }).format(new Date()));
  const rows = await sql<{ pending: number; approved: number; today: number }[]>`
    SELECT
      COUNT(*) FILTER (WHERE status = 'PENDING')::int AS pending,
      COUNT(*) FILTER (WHERE status = 'APPROVED')::int AS approved,
      COUNT(*) FILTER (WHERE status IN ('PENDING', 'APPROVED') AND starts_at >= ${todayRange.start} AND starts_at < ${todayRange.end})::int AS today
    FROM appointments
  `;
  const next = await sql<Pick<AppointmentRow, "starts_at" | "purpose">[]>`
    SELECT starts_at, purpose FROM appointments
    WHERE status IN ('PENDING', 'APPROVED') AND ends_at > NOW() ORDER BY starts_at ASC LIMIT 1
  `;

  return {
    pending: rows[0]?.pending ?? 0,
    approved: rows[0]?.approved ?? 0,
    today: rows[0]?.today ?? 0,
    next: next[0] ? { startsAt: next[0].starts_at.toISOString(), purpose: next[0].purpose } : null
  };
}

export function isConstraintConflict(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "23P01";
}

export function conflictMessage() {
  return `Este horário não está disponível. É necessário manter um intervalo mínimo de ${BUFFER_MINUTES} minutos entre os agendamentos.`;
}

export function protectedEnd(endsAt: Date) {
  return addMinutes(endsAt, BUFFER_MINUTES);
}
