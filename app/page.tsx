import Link from "next/link";
import { addDays } from "date-fns";
import { ArrowRight, CalendarDays, Clock3, ShieldCheck, Sparkles } from "lucide-react";
import { Calendar } from "@/components/calendar/calendar";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import { SiteHeader } from "@/components/site-header";
import { listPublicAppointments } from "@/lib/repository";
import { getDateRange, getInstitutionDate } from "@/lib/scheduling";
import type { PublicAppointment } from "@/types/appointments";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const today = getInstitutionDate();
  const from = getDateRange(today).start;
  const endDate = addDays(new Date(`${today}T12:00:00`), 7).toISOString().slice(0, 10);
  const to = getDateRange(endDate).end;
  let events: PublicAppointment[] = [];
  try {
    events = await listPublicAppointments(from, to);
  } catch {
    events = [];
  }

  const upcoming = events.filter((event) => new Date(event.endsAt) > new Date()).slice(0, 3);

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_#dbeaff_0,_transparent_32%),linear-gradient(180deg,_#f8fbff_0%,_#f7fafc_38%,_#fff_100%)]">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-5 pb-12 pt-10 lg:px-8 lg:pt-16">
        <div className="grid items-start gap-8 lg:grid-cols-[0.9fr_1.5fr]">
          <div className="lg:sticky lg:top-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-ieptec-gold/70 bg-ieptec-gold/10 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.13em] text-ieptec-800 shadow-sm"><Sparkles size={14} />Organização que inspira</div>
            <h1 className="mt-5 max-w-xl text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl">Studio IEPTEC<br /><span className="text-ieptec-700">Sistema de Agendamento</span></h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">Consulte a disponibilidade do Studio e solicite seu horário de utilização.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={`/agendamento?date=${today}`} className="button-primary"><CalendarDays size={18} />Novo agendamento<ArrowRight size={16} /></Link>
              <Link href="/agenda" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 transition hover:border-ieptec-200 hover:text-ieptec-700">Consultar agenda</Link>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-3">
              <div className="rounded-3xl border border-white bg-white/80 p-4 shadow-card"><Clock3 className="text-ieptec-600" size={21} /><p className="mt-4 text-sm font-black text-slate-900">15 min de margem</p><p className="mt-1 text-xs leading-5 text-slate-500">Entre todas as utilizações.</p></div>
              <div className="rounded-3xl border border-white bg-white/80 p-4 shadow-card"><ShieldCheck className="text-emerald-600" size={21} /><p className="mt-4 text-sm font-black text-slate-900">Reserva segura</p><p className="mt-1 text-xs leading-5 text-slate-500">Sem sobreposição de horários.</p></div>
            </div>
          </div>
          <div className="space-y-6"><Calendar initialDate={today} initialEvents={events} /><section><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black tracking-tight text-slate-900">Próximos horários</h2><span className="text-xs font-bold text-slate-500">Informações pessoais protegidas</span></div><div className="grid gap-3 sm:grid-cols-3">{upcoming.length ? upcoming.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} showDate />) : <div className="col-span-full rounded-3xl border border-dashed border-slate-200 bg-white p-7 text-center text-sm font-semibold text-slate-500">Ainda não há horários reservados para os próximos dias.</div>}</div></section></div>
        </div>
      </section>
    </main>
  );
}
