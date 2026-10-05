import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { Calendar } from "@/components/calendar/calendar";
import { SiteHeader } from "@/components/site-header";
import { listAppointmentsForDay } from "@/lib/repository";
import { getInstitutionDate } from "@/lib/scheduling";
import type { PublicAppointment } from "@/types/appointments";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const today = getInstitutionDate();
  let events: PublicAppointment[] = [];
  try { events = await listAppointmentsForDay(today); } catch { events = []; }
  return <main className="min-h-screen bg-slate-50"><SiteHeader /><section className="mx-auto max-w-7xl px-5 py-10 lg:px-8"><Link href="/" className="inline-flex items-center gap-2 text-sm font-extrabold text-ieptec-700 hover:text-ieptec-900"><ArrowLeft size={16} />Voltar ao início</Link><div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-ieptec-600">Disponibilidade</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Agenda do Studio</h1><p className="mt-2 text-slate-600">Visualize horários reservados e encontre a melhor janela para sua atividade.</p></div><Link href={`/agendamento?date=${today}`} className="button-primary"><CalendarDays size={17} />Novo agendamento</Link></div><div className="mt-8"><Calendar initialDate={today} initialEvents={events} /></div></section></main>;
}
