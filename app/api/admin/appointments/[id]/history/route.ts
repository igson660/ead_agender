import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAppointmentHistory } from "@/lib/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, context: Context) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const history = await getAppointmentHistory(id);
    return NextResponse.json({ history });
  } catch {
    return NextResponse.json({ message: "Acesso não autorizado." }, { status: 401 });
  }
}
