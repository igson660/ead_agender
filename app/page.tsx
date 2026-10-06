import Link from "next/link";

import { addDays } from "date-fns";
import { ArrowRight, CalendarDays, ChevronRight, Clock3 } from "lucide-react";

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

  const endDate = addDays(new Date(`${today}T12:00:00`), 7)
    .toISOString()
    .slice(0, 10);

  const to = getDateRange(endDate).end;

  let events: PublicAppointment[] = [];

  try {
    events = await listPublicAppointments(from, to);
  } catch {
    events = [];
  }

  const upcoming = events
    .filter((event) => new Date(event.endsAt) > new Date())
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />

      <section className="mx-auto max-w-[1400px] px-5 pb-16 pt-8 lg:px-8 lg:pt-10">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">
              Sistema de Agendamento
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Consulte a disponibilidade e agende um horário de forma rápida e
              organizada.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/agendamento?date=${today}`}
              className="button-primary inline-flex items-center gap-2"
            >
              <CalendarDays size={18} />
              Novo agendamento
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/agenda"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-ieptec-200 hover:text-ieptec-700"
            >
              Consultar agenda
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-ieptec-50 text-ieptec-700">
              <CalendarDays size={19} />
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Hoje
            </p>

            <p className="mt-1 text-lg font-black text-slate-900">
              {events.length
                ? `${events.length} horários disponíveis`
                : "Agenda disponível"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Clock3 size={19} />
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Próximos horários
            </p>

            <p className="mt-1 text-lg font-black text-slate-900">
              {upcoming.length} disponíveis
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <CalendarDays size={19} />
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Período
            </p>

            <p className="mt-1 text-lg font-black text-slate-900">
              Próximos 7 dias
            </p>
          </div>
        </div>

        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-950">
                    Agenda
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Selecione uma data para consultar os horários disponíveis.
                  </p>
                </div>

                <div className="hidden rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500 sm:block">
                  Atualizado automaticamente
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <Calendar initialDate={today} initialEvents={events} />
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-950">
                    Próximos horários
                  </h2>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Disponibilidade mais próxima
                  </p>
                </div>

                <Link
                  href="/agenda"
                  className="text-xs font-extrabold text-ieptec-700 transition hover:text-ieptec-800"
                >
                  Ver todos
                </Link>
              </div>

              <div className="space-y-3">
                {upcoming.length ? (
                  upcoming.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      showDate
                    />
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                    <CalendarDays
                      size={24}
                      className="mx-auto mb-3 text-slate-400"
                    />

                    <p className="text-sm font-bold text-slate-600">
                      Nenhum horário reservado
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Ainda não há horários reservados para os próximos dias.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <div className="rounded-3xl bg-slate-900 p-6 text-white">
              <p className="text-sm font-black">
                Precisa realizar um agendamento?
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Escolha uma data e encontre o horário mais conveniente.
              </p>

              <Link
                href={`/agendamento?date=${today}`}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-900 transition hover:bg-slate-100"
              >
                Iniciar agendamento
                <ArrowRight size={16} />
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
