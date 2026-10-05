import { NextRequest, NextResponse } from "next/server";
import { createAppointment, isConstraintConflict, listPublicAppointments } from "@/lib/repository";
import { getDateRange, getInstitutionDate, SchedulingError } from "@/lib/scheduling";
import { appointmentSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const from = request.nextUrl.searchParams.get("from") || getInstitutionDate();
    const to = request.nextUrl.searchParams.get("to") || from;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return NextResponse.json({ message: "Período inválido." }, { status: 400 });
    }
    const fromRange = getDateRange(from);
    const toRange = getDateRange(to);
    const appointments = await listPublicAppointments(fromRange.start, toRange.end);
    return NextResponse.json({ appointments, timezone: "America/Rio_Branco", bufferMinutes: 15 });
  } catch {
    return NextResponse.json({ message: "Não foi possível carregar a agenda." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = appointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Revise os campos destacados.", issues: parsed.error.flatten() }, { status: 422 });
    }

    const appointment = await createAppointment(parsed.data);
    return NextResponse.json(
      {
        appointment,
        message: "Solicitação enviada com sucesso! Seu agendamento está aguardando aprovação."
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof SchedulingError) {
      return NextResponse.json({ message: error.message, code: error.code }, { status: 409 });
    }
    if (isConstraintConflict(error)) {
      return NextResponse.json(
        { message: "Este horário não está disponível. Escolha outro horário.", code: "CONFLICT" },
        { status: 409 }
      );
    }
    return NextResponse.json({ message: "Não foi possível enviar sua solicitação. Tente novamente." }, { status: 500 });
  }
}
