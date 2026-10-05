"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { addDays, format, startOfWeek, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import { EmptyState, LoadingState } from "@/components/ui/feedback";
import type { PublicAppointment } from "@/types/appointments";

const timezone = "America/Rio_Branco";

type ViewMode = "day" | "week";

function toDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function eventDateKey(event: PublicAppointment) {
  return formatInTimeZone(new Date(event.startsAt), timezone, "yyyy-MM-dd");
}

export function Calendar({ initialDate, initialEvents, compact = false }: { initialDate: string; initialEvents: PublicAppointment[]; compact?: boolean }) {
  const [view, setView] = useState<ViewMode>(compact ? "day" : "week");
  const [cursor, setCursor] = useState(() => new Date(`${initialDate}T12:00:00`));
  const [events, setEvents] = useState(initialEvents);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const days = useMemo(() => {
    if (view === "day") return [cursor];
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }, [cursor, view]);

  const range = `${toDateKey(days[0])}:${toDateKey(days[days.length - 1])}`;

  useEffect(() => {
    let active = true;
    async function refresh() {
      setLoading(true);
      setLoadError(false);
      try {
        const [from, to] = range.split(":");
        const response = await fetch(`/api/appointments?from=${from}&to=${to}`, { cache: "no-store" });
        if (!response.ok) throw new Error("load");
        const data = (await response.json()) as { appointments: PublicAppointment[] };
        if (active) setEvents(data.appointments);
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    refresh();
    return () => { active = false; };
  }, [range]);

  const move = (direction: -1 | 1) => {
    setCursor((date) => (view === "day" ? addDays(date, direction) : addDays(date, direction * 7)));
  };

  const heading = view === "day"
    ? format(cursor, "EEEE, dd 'de' MMMM", { locale: ptBR })
    : `${format(days[0], "dd MMM", { locale: ptBR })} — ${format(days[6], "dd MMM", { locale: ptBR })}`;

  return (
    <section className="rounded-4xl border border-slate-200 bg-white p-4 shadow-card sm:p-6" aria-label="Agenda de utilização do Studio">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-ieptec-600">Agenda do Studio</p>
          <h2 className="mt-1 capitalize text-xl font-black tracking-tight text-slate-900">{heading}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 p-1" role="group" aria-label="Modo de visualização">
            {(["day", "week"] as ViewMode[]).map((mode) => (
              <button key={mode} type="button" onClick={() => setView(mode)} className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition ${view === mode ? "bg-white text-ieptec-700 shadow-sm" : "text-slate-500"}`}>
                {mode === "day" ? "Dia" : "Semana"}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => move(-1)} className="icon-button" aria-label="Período anterior"><ChevronLeft size={18} /></button>
          <button type="button" onClick={() => setCursor(new Date(`${initialDate}T12:00:00`))} className="rounded-xl px-2 py-2 text-xs font-bold text-ieptec-700 hover:bg-ieptec-50">Hoje</button>
          <button type="button" onClick={() => move(1)} className="icon-button" aria-label="Próximo período"><ChevronRight size={18} /></button>
          {!compact && <Link href={`/agendamento?date=${toDateKey(cursor)}`} className="button-primary"><Plus size={16} />Novo agendamento</Link>}
        </div>
      </div>

      {loading ? <LoadingState label="Atualizando agenda..." /> : (
        <div className={`mt-5 grid gap-3 ${view === "week" ? "md:grid-cols-7" : "grid-cols-1"}`}>
          {days.map((day) => {
            const dateKey = toDateKey(day);
            const dayEvents = events.filter((event) => eventDateKey(event) === dateKey);
            return (
              <div key={dateKey} className={`min-h-44 rounded-3xl border p-3 ${view === "day" ? "border-ieptec-100 bg-ieptec-50/40" : "border-slate-100 bg-slate-50/70"}`}>
                <div className="mb-3 flex items-baseline justify-between gap-2">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-700">{format(day, view === "day" ? "EEEE, dd/MM" : "EEE dd", { locale: ptBR })}</p>
                  <span className="text-[11px] font-bold text-slate-400">{dayEvents.length} {dayEvents.length === 1 ? "evento" : "eventos"}</span>
                </div>
                <div className="space-y-2">
                  {dayEvents.length ? dayEvents.map((event) => <AppointmentCard key={event.id} appointment={event} />) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-3 py-5 text-center text-xs font-semibold text-slate-400">Sem horários reservados</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {loadError && <div className="mt-4 flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800"><RefreshCw size={16} />A agenda será atualizada assim que a conexão estiver disponível.</div>}
      {compact && <div className="mt-4"><Link href="/agenda" className="inline-flex text-sm font-extrabold text-ieptec-700 hover:text-ieptec-900">Abrir agenda completa →</Link></div>}
    </section>
  );
}
