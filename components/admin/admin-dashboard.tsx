"use client";

import { useEffect, useMemo, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Filter,
  LogOut,
  Search,
  UsersRound,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ApprovalModal } from "@/components/admin/approval-modal";
import { RejectionModal } from "@/components/admin/rejection-modal";
import { EmptyState, LoadingState, Toast } from "@/components/ui/feedback";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  AdminAppointment,
  AppointmentHistoryItem,
  AppointmentStatus,
} from "@/types/appointments";

const tz = "America/Rio_Branco";

type DashboardStats = {
  pending: number;
  approved: number;
  today: number;
  next: { startsAt: string; purpose: string } | null;
};
type Action = "approve" | "reject" | "cancel";

function formatWhen(value: string) {
  return formatInTimeZone(new Date(value), tz, "dd/MM/yyyy · HH:mm");
}

export function AdminDashboard({
  initialAppointments,
  stats,
}: {
  initialAppointments: AdminAppointment[];
  stats: DashboardStats;
}) {
  const router = useRouter();
  const [appointments, setAppointments] = useState(initialAppointments);
  const [filters, setFilters] = useState({
    status: "",
    requester: "",
    department: "",
    purpose: "",
    from: "",
    to: "",
  });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AdminAppointment | null>(null);
  const [history, setHistory] = useState<AppointmentHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function applyFilters(event?: React.FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setNotice(null);
    try {
      const query = new URLSearchParams(
        Object.entries(filters).filter(([, value]) => value),
      );
      const response = await fetch(`/api/admin/appointments?${query}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        appointments?: AdminAppointment[];
        message?: string;
      };
      if (!response.ok) {
        setNotice(data.message ?? "Não foi possível atualizar a lista.");
        return;
      }
      setAppointments(data.appointments ?? []);
    } catch {
      setNotice("Não foi possível atualizar a lista.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selected) {
      setHistory([]);
      return;
    }
    let active = true;
    setHistoryLoading(true);
    fetch(`/api/admin/appointments/${selected.id}/history`, {
      cache: "no-store",
    })
      .then(async (response) => ({
        response,
        data: (await response.json()) as { history?: AppointmentHistoryItem[] },
      }))
      .then(({ response, data }) => {
        if (active && response.ok) setHistory(data.history ?? []);
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selected]);

  const pending = useMemo(
    () => appointments.filter((item) => item.status === "PENDING"),
    [appointments],
  );
  const selectedAction = action;

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function completed(message: string) {
    setNotice(message);
    setSelected(null);
    setAction(null);
    applyFilters();
    router.refresh();
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            Painel administrativo
          </h1>
        </div>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={<Clock3 />}
          label="Aguardando aprovação"
          value={stats.pending}
          color="amber"
        />
        <Metric
          icon={<CheckCircle2 />}
          label="Aprovados"
          value={stats.approved}
          color="emerald"
        />
        <Metric
          icon={<CalendarDays />}
          label="Hoje"
          value={stats.today}
          color="blue"
        />
        <Metric
          icon={<UsersRound />}
          label="Próximo agendamento"
          value={
            stats.next
              ? formatInTimeZone(new Date(stats.next.startsAt), tz, "HH:mm")
              : "—"
          }
          detail={stats.next?.purpose ?? "Sem próximos eventos"}
          color="slate"
        />
      </div>
      {notice && <Toast tone="success" message={notice} />}
      <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-ieptec-600" />
          <h2 className="font-black text-slate-900">Filtros</h2>
        </div>
        <form
          onSubmit={applyFilters}
          className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6"
        >
          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((value) => ({ ...value, status: event.target.value }))
            }
            aria-label="Filtrar por status"
          >
            <option value="">Todos os status</option>
            <option value="PENDING">Aguardando aprovação</option>
            <option value="APPROVED">Aprovados</option>
            <option value="REJECTED">Rejeitados</option>
            <option value="CANCELLED">Cancelados</option>
          </select>
          <input
            value={filters.requester}
            onChange={(event) =>
              setFilters((value) => ({
                ...value,
                requester: event.target.value,
              }))
            }
            placeholder="Solicitante"
            aria-label="Filtrar por solicitante"
          />
          <input
            value={filters.department}
            onChange={(event) =>
              setFilters((value) => ({
                ...value,
                department: event.target.value,
              }))
            }
            placeholder="Setor"
            aria-label="Filtrar por setor"
          />
          <input
            value={filters.purpose}
            onChange={(event) =>
              setFilters((value) => ({ ...value, purpose: event.target.value }))
            }
            placeholder="Finalidade"
            aria-label="Filtrar por finalidade"
          />
          <input
            type="date"
            value={filters.from}
            onChange={(event) =>
              setFilters((value) => ({ ...value, from: event.target.value }))
            }
            aria-label="Data inicial"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(event) =>
              setFilters((value) => ({ ...value, to: event.target.value }))
            }
            aria-label="Data final"
          />
          <button
            type="submit"
            className="button-primary md:col-span-2 xl:col-span-1"
          >
            <Search size={16} />
            {loading ? "Buscando..." : "Aplicar"}
          </button>
        </form>
      </section>
      <section className="rounded-4xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <h2 className="font-black text-slate-900">Solicitações e agenda</h2>
            <p className="mt-1 text-sm text-slate-500">
              {pending.length} pendente{pending.length === 1 ? "" : "s"} nesta
              visualização
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-600">
            {appointments.length} registro{appointments.length === 1 ? "" : "s"}
          </span>
        </div>
        {loading ? (
          <LoadingState label="Atualizando solicitações..." />
        ) : appointments.length ? (
          <div className="divide-y divide-slate-100">
            {appointments.map((appointment) => (
              <button
                key={appointment.id}
                type="button"
                onClick={() => setSelected(appointment)}
                className="grid w-full gap-3 px-5 py-4 text-left transition hover:bg-ieptec-50/50 sm:grid-cols-[1.2fr_1.2fr_0.9fr_auto] sm:items-center sm:px-6"
              >
                <div>
                  <p className="font-extrabold text-slate-900">
                    {appointment.requesterName}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {appointment.department} · {appointment.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-800">
                    {appointment.purpose}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {formatWhen(appointment.startsAt)} —{" "}
                    {formatInTimeZone(
                      new Date(appointment.endsAt),
                      tz,
                      "HH:mm",
                    )}
                  </p>
                </div>
                <StatusBadge status={appointment.status} />
                <span className="text-xs font-extrabold text-ieptec-700">
                  Ver detalhes →
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              title="Nenhuma solicitação encontrada"
              detail="Altere os filtros ou aguarde o recebimento de novas solicitações."
            />
          </div>
        )}
      </section>
      {selected && (
        <aside
          className="fixed inset-0 z-40 flex justify-end bg-slate-950/30"
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Detalhes do agendamento"
            className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-ieptec-600">
                  Solicitação
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {selected.purpose}
                </h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setSelected(null)}
                aria-label="Fechar detalhes"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-5">
              <StatusBadge status={selected.status} />
            </div>
            <div className="mt-6 grid gap-4 rounded-3xl bg-slate-50 p-5 text-sm">
              <Detail label="Solicitante" value={selected.requesterName} />
              <Detail label="Setor / unidade" value={selected.department} />
              <Detail
                label="Contato"
                value={`${selected.email} · ${selected.phone}`}
              />
              <Detail
                label="Utilização"
                value={`${formatWhen(selected.startsAt)} — ${formatInTimeZone(new Date(selected.endsAt), tz, "HH:mm")}`}
              />
              <Detail
                label="Observações"
                value={selected.notes || "Nenhuma observação enviada."}
              />
            </div>
            {selected.status === "PENDING" && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-emerald-700"
                  onClick={() => setAction("approve")}
                >
                  <CheckCircle2 size={17} />
                  Aprovar
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-rose-700"
                  onClick={() => setAction("reject")}
                >
                  Rejeitar
                </button>
              </div>
            )}
            {["PENDING", "APPROVED"].includes(selected.status) && (
              <button
                className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
                onClick={() => setAction("cancel")}
              >
                Cancelar agendamento
              </button>
            )}
            <section className="mt-8">
              <h3 className="text-sm font-black uppercase tracking-[0.13em] text-slate-700">
                Histórico
              </h3>
              {historyLoading ? (
                <LoadingState label="Carregando histórico..." />
              ) : (
                <ol className="mt-4 space-y-3 border-l-2 border-ieptec-100 pl-4">
                  {history.length ? (
                    history.map((item) => (
                      <li key={item.id} className="relative">
                        <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-ieptec-600" />
                        <p className="text-sm font-extrabold text-slate-800">
                          {item.action}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatWhen(item.createdAt)} · {item.actor}
                        </p>
                        {item.note && (
                          <p className="mt-1 text-xs leading-5 text-slate-600">
                            {item.note}
                          </p>
                        )}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-500">
                      Ainda não há registros de histórico.
                    </li>
                  )}
                </ol>
              )}
            </section>
          </section>
        </aside>
      )}
      {selected && selectedAction === "approve" && (
        <ApprovalModal
          open
          appointmentId={selected.id}
          action="approve"
          onClose={() => setAction(null)}
          onComplete={completed}
        />
      )}
      {selected && selectedAction === "reject" && (
        <RejectionModal
          open
          appointmentId={selected.id}
          onClose={() => setAction(null)}
          onComplete={completed}
        />
      )}
      {selected && selectedAction === "cancel" && (
        <ApprovalModal
          open
          appointmentId={selected.id}
          action="cancel"
          onClose={() => setAction(null)}
          onComplete={completed}
        />
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  detail?: string;
  color: "amber" | "emerald" | "blue" | "slate";
}) {
  const colors = {
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-ieptec-50 text-ieptec-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
      <div
        className={`grid h-9 w-9 place-items-center rounded-xl ${colors[color]}`}
      >
        {icon}
      </div>
      <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      {detail && (
        <p className="mt-1 truncate text-xs font-semibold text-slate-500">
          {detail}
        </p>
      )}
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-semibold leading-6 text-slate-800">{value}</p>
    </div>
  );
}
