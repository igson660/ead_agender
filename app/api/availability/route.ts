import { NextRequest, NextResponse } from "next/server";
import { listAppointmentsForDay } from "@/lib/repository";
import { BUFFER_MINUTES, INSTITUTION_TIMEZONE } from "@/lib/scheduling";
import { availabilityQuerySchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const parsed = availabilityQuerySchema.safeParse({ date: request.nextUrl.searchParams.get("date") });
  if (!parsed.success) {
    return NextResponse.json({ message: "Selecione uma data válida." }, { status: 400 });
  }

  try {
    const events = await listAppointmentsForDay(parsed.data.date);
    return NextResponse.json({
      date: parsed.data.date,
      events,
      timezone: INSTITUTION_TIMEZONE,
      bufferMinutes: BUFFER_MINUTES
    });
  } catch {
    return NextResponse.json({ message: "Não foi possível consultar a disponibilidade." }, { status: 500 });
  }
}
