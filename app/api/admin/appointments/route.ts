import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listAdminAppointments } from "@/lib/repository";
import { adminFilterSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const parsed = adminFilterSchema.safeParse({
      from: request.nextUrl.searchParams.get("from") || undefined,
      to: request.nextUrl.searchParams.get("to") || undefined,
      status: request.nextUrl.searchParams.get("status") || undefined,
      requester: request.nextUrl.searchParams.get("requester") || undefined,
      department: request.nextUrl.searchParams.get("department") || undefined,
      purpose: request.nextUrl.searchParams.get("purpose") || undefined
    });
    if (!parsed.success) return NextResponse.json({ message: "Filtros inválidos." }, { status: 400 });
    const appointments = await listAdminAppointments(parsed.data);
    return NextResponse.json({ appointments });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ message: "Acesso não autorizado." }, { status: 401 });
    return NextResponse.json({ message: "Não foi possível carregar os agendamentos." }, { status: 500 });
  }
}
