"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
} from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import { EmptyState, LoadingState } from "@/components/ui/feedback";
import {
  getFirstBookableDate,
  isDateBookable,
  isWeekendDate,
} from "@/lib/scheduling";
import type { PublicAppointment } from "@/types/appointments";
const timezone = "America/Rio_Branco";
type ViewMode = "day" | "week";
function toDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}
function eventDateKey(event: PublicAppointment) {
  return formatInTimeZone(new Date(event.startsAt), timezone, "yyyy-MM-dd");
}
export function Calendar({
  initialDate,
  initialEvents,
  compact = false,
}: {
  initialDate: string;
  initialEvents: PublicAppointment[];
  compact?: boolean;
}) {
  const [view, setView] = useState<ViewMode>(compact ? "day" : "week");
  const [cursor, setCursor] = useState(
    () => new Date(`${initialDate}T12:00:00`),
  );
  const [events, setEvents] = useState(initialEvents);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const today = useMemo(
    () => new Date(`${initialDate}T12:00:00`),
    [initialDate],
  );
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
        const response = await fetch(
          `/api/appointments?from=${from}&to=${to}`,
          { cache: "no-store" },
        );
        if (!response.ok) {
          throw new Error("load");
        }
        const data = (await response.json()) as {
          appointments: PublicAppointment[];
        };
        if (active) {
          setEvents(data.appointments);
        }
      } catch {
        if (active) {
          setLoadError(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    refresh();
    return () => {
      active = false;
    };
  }, [range]);
  const move = (direction: -1 | 1) => {
    setCursor((date) =>
      view === "day" ? addDays(date, direction) : addDays(date, direction * 7),
    );
  };
  const heading =
    view === "day"
      ? format(cursor, "EEEE, dd 'de' MMMM", { locale: ptBR })
      : `${format(days[0], "dd MMM", { locale: ptBR })} — ${format(days[6], "dd MMM", { locale: ptBR })}`;
  return (
    <section
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card sm:rounded-4xl"
      aria-label="Agenda de utilização do Studio"
    >
      {" "}
      {/* Header */}{" "}
      <header className="border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
        {" "}
        <div className="flex flex-col gap-4">
          {" "}
          <div className="flex items-start justify-between gap-4">
            {" "}
            <div className="min-w-0">
              {" "}
              <div className="mb-1 flex items-center gap-2">
                {" "}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ieptec-50 text-ieptec-700">
                  {" "}
                  <CalendarDays size={16} />{" "}
                </span>{" "}
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  {" "}
                  Agenda{" "}
                </span>{" "}
              </div>{" "}
              <h2 className="truncate text-lg font-black capitalize tracking-tight text-slate-950 sm:text-xl">
                {" "}
                {heading}{" "}
              </h2>{" "}
            </div>{" "}
            <div className="hidden shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-500 sm:block">
              {" "}
              {view === "day" ? "Visão diária" : "Visão semanal"}{" "}
            </div>{" "}
          </div>{" "}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {" "}
            {/* Navegação */}{" "}
            <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {" "}
              <button
                type="button"
                onClick={() => move(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white hover:text-slate-900"
                aria-label="Período anterior"
              >
                {" "}
                <ChevronLeft size={18} />{" "}
              </button>{" "}
              <button
                type="button"
                onClick={() => setCursor(today)}
                className="h-9 rounded-xl px-3 text-xs font-extrabold text-ieptec-700 transition hover:bg-white"
              >
                {" "}
                Hoje{" "}
              </button>{" "}
              <button
                type="button"
                onClick={() => move(1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white hover:text-slate-900"
                aria-label="Próximo período"
              >
                {" "}
                <ChevronRight size={18} />{" "}
              </button>{" "}
            </div>{" "}
            {/* Ações */}{" "}
            <div className="flex flex-col gap-2 sm:flex-row">
              {" "}
              <div
                className="flex h-11 rounded-xl bg-slate-100 p-1"
                role="group"
                aria-label="Modo de visualização"
              >
                {" "}
                {(["day", "week"] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setView(mode)}
                    className={`rounded-lg px-4 text-xs font-extrabold transition ${view === mode ? "bg-white text-ieptec-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    {" "}
                    {mode === "day" ? "Dia" : "Semana"}{" "}
                  </button>
                ))}{" "}
              </div>{" "}
              {!compact && (
                <Link
                  href={`/agendamento?date=${isDateBookable(toDateKey(cursor)) ? toDateKey(cursor) : getFirstBookableDate()}`}
                  className="button-primary inline-flex h-11 items-center justify-center gap-2 rounded-xl"
                >
                  {" "}
                  <Plus size={16} /> Novo agendamento{" "}
                </Link>
              )}{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </header>{" "}
      {/* Conteúdo */}{" "}
      <div className="p-3 sm:p-5">
        {" "}
        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center">
            {" "}
            <LoadingState label="Atualizando agenda..." />{" "}
          </div>
        ) : (
          <div className={view === "week" ? "overflow-x-auto pb-2" : ""}>
            {" "}
            <div
              className={
                view === "week"
                  ? "grid min-w-[980px] grid-cols-7 gap-3"
                  : "grid grid-cols-1"
              }
            >
              {" "}
              {days.map((day) => {
                const dateKey = toDateKey(day);
                const weekend = isWeekendDate(dateKey);
                const currentDay = isSameDay(day, today);
                const dayEvents = events.filter(
                  (event) => eventDateKey(event) === dateKey,
                );
                return (
                  <div
                    key={dateKey}
                    className={[
                      "flex min-h-[220px] flex-col rounded-2xl border p-3 transition sm:rounded-3xl",
                      weekend
                        ? "border-amber-200 bg-amber-50/60"
                        : currentDay
                          ? "border-ieptec-200 bg-ieptec-50/40 shadow-sm"
                          : "border-slate-100 bg-slate-50/70",
                    ].join(" ")}
                  >
                    {" "}
                    {/* Dia */}{" "}
                    <div className="mb-3 flex items-start justify-between gap-2">
                      {" "}
                      <div>
                        {" "}
                        <p
                          className={`text-[11px] font-black uppercase tracking-wider ${weekend ? "text-amber-700" : currentDay ? "text-ieptec-700" : "text-slate-500"}`}
                        >
                          {" "}
                          {format(day, view === "day" ? "EEEE" : "EEE", {
                            locale: ptBR,
                          })}{" "}
                        </p>{" "}
                        <p
                          className={`mt-0.5 text-lg font-black ${currentDay ? "text-ieptec-800" : "text-slate-900"}`}
                        >
                          {" "}
                          {format(day, "dd/MM")}{" "}
                        </p>{" "}
                      </div>{" "}
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-extrabold ${weekend ? "bg-amber-100 text-amber-800" : currentDay ? "bg-ieptec-100 text-ieptec-700" : "bg-white text-slate-400"}`}
                      >
                        {" "}
                        {dayEvents.length}{" "}
                      </span>{" "}
                    </div>{" "}
                    {/* Eventos */}{" "}
                    <div className="flex flex-1 flex-col gap-2">
                      {" "}
                      {weekend ? (
                        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 px-3 py-5 text-center">
                          {" "}
                          <div>
                            {" "}
                            <p className="text-xs font-extrabold text-amber-800">
                              {" "}
                              Não disponível{" "}
                            </p>{" "}
                            <p className="mt-1 text-[11px] font-medium text-amber-700/70">
                              {" "}
                              Fim de semana{" "}
                            </p>{" "}
                          </div>{" "}
                        </div>
                      ) : dayEvents.length ? (
                        dayEvents.map((event) => (
                          <AppointmentCard key={event.id} appointment={event} />
                        ))
                      ) : (
                        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 px-3 py-5 text-center">
                          {" "}
                          <p className="text-xs font-semibold text-slate-400">
                            {" "}
                            Nenhum horário reservado{" "}
                          </p>{" "}
                        </div>
                      )}{" "}
                    </div>{" "}
                  </div>
                );
              })}{" "}
            </div>{" "}
          </div>
        )}{" "}
      </div>{" "}
      {/* Erro */}{" "}
      {loadError && (
        <div className="mx-3 mb-3 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 sm:mx-5 sm:mb-5">
          {" "}
          <RefreshCw size={17} className="mt-0.5 shrink-0" />{" "}
          <span>
            {" "}
            A agenda será atualizada assim que a conexão estiver
            disponível.{" "}
          </span>{" "}
        </div>
      )}{" "}
      {/* Compact */}{" "}
      {compact && (
        <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
          {" "}
          <Link
            href="/agenda"
            className="inline-flex items-center text-sm font-extrabold text-ieptec-700 transition hover:text-ieptec-900"
          >
            {" "}
            Abrir agenda completa{" "}
            <ChevronRight size={16} className="ml-1" />{" "}
          </Link>{" "}
        </div>
      )}{" "}
    </section>
  );
}
