import { NextRequest, NextResponse } from "next/server";
import { getAppointmentById, isConstraintConflict, transitionAppointment } from "@/lib/repository";
import { hasTrustedRequestOrigin, requireAdmin, verifyAdminCode } from "@/lib/auth";
import { clearRateLimit, enforceRateLimit, getClientKey } from "@/lib/rate-limit";
import { appointmentActionSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, context: Context) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const appointment = await getAppointmentById(id);
    if (!appointment) return NextResponse.json({ message: "Agendamento não encontrado." }, { status: 404 });
    return NextResponse.json({ appointment });
  } catch {
    return NextResponse.json({ message: "Acesso não autorizado." }, { status: 401 });
  }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    if (!hasTrustedRequestOrigin(request)) {
      return NextResponse.json({ message: "Origem da requisição não permitida." }, { status: 403 });
    }
    await requireAdmin();
    const key = `admin-action:${getClientKey(request)}`;
    const limit = enforceRateLimit(key, 5, 10 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { message: `Muitas tentativas. Tente novamente em ${limit.retryAfter} segundos.` },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      );
    }

    const parsed = appointmentActionSchema.safeParse(await request.json());
    if (!parsed.success || !verifyAdminCode(parsed.data.code)) {
      return NextResponse.json({ message: "Código administrativo inválido." }, { status: 401 });
    }

    const { id } = await context.params;
    const appointment = await transitionAppointment(id, parsed.data.action, "Administrador Studio IEPTEC", parsed.data.note);
    clearRateLimit(key);
    const messages = {
      approve: "Agendamento aprovado com sucesso.",
      reject: "Agendamento rejeitado.",
      cancel: "Agendamento cancelado."
    };
    return NextResponse.json({ appointment, message: messages[parsed.data.action] });
  } catch (error) {
    if (isConstraintConflict(error)) {
      return NextResponse.json({ message: "O horário deixou de estar disponível durante a análise." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ message: "Agendamento não encontrado." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "INVALID_TRANSITION") {
      return NextResponse.json({ message: "Esta ação não é válida para o status atual." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Acesso não autorizado." }, { status: 401 });
    }
    return NextResponse.json({ message: "Não foi possível concluir a ação administrativa." }, { status: 500 });
  }
}
