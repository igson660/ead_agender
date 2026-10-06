"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, Send } from "lucide-react";
import { TimeSlot } from "@/components/calendar/time-slot";
import { Toast } from "@/components/ui/feedback";
import {
  getFirstBookableDate,
  getMinimumBookingTime,
  isAvailable,
  isDateBookable,
  isWithinMinimumAdvance,
  toInstitutionDateTime
} from "@/lib/scheduling";
import { appointmentSchema } from "@/lib/validation";
import type { PublicAppointment } from "@/types/appointments";

const SLOTS = Array.from({ length: 37 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 15;
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
});

type FormState = {
  requesterName: string;
  department: string;
  email: string;
  phone: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  notes: string;
};

function roundUpToQuarterHour(value: string | undefined) {
  if (!value) return "09:00";
  const [hours, minutes] = value.split(":").map(Number);
  const rounded = Math.ceil((hours * 60 + minutes) / 15) * 15;
  return `${String(Math.floor(rounded / 60)).padStart(2, "0")}:${String(rounded % 60).padStart(2, "0")}`;
}

export function AppointmentForm({ initialDate }: { initialDate: string }) {
  const initialStartTime = roundUpToQuarterHour(getMinimumBookingTime(initialDate));
  const initialEndMinutes = Math.min(18 * 60, Number(initialStartTime.slice(0, 2)) * 60 + Number(initialStartTime.slice(3)) + 60);
  const initialEndTime = `${String(Math.floor(initialEndMinutes / 60)).padStart(2, "0")}:${String(initialEndMinutes % 60).padStart(2, "0")}`;
  const [values, setValues] = useState<FormState>({ requesterName: "", department: "", email: "", phone: "", date: initialDate, startTime: initialStartTime, endTime: initialEndTime, purpose: "", notes: "" });
  const [events, setEvents] = useState<PublicAppointment[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ tone: "success" | "error" | "info"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const minimumDate = getFirstBookableDate();
  const minimumTime = getMinimumBookingTime(values.date);
  const dateIsBookable = isDateBookable(values.date);
  const leadTimeSatisfied = dateIsBookable && isWithinMinimumAdvance(values.date, values.startTime);

  useEffect(() => {
    let active = true;
    async function loadAvailability() {
      setAvailabilityLoading(true);
      if (!isDateBookable(values.date)) {
        setEvents([]);
        setAvailabilityLoading(false);
        return;
      }
      setNotice(null);
      try {
        const response = await fetch(`/api/availability?date=${values.date}`, { cache: "no-store" });
        if (!response.ok) throw new Error("availability");
        const data = (await response.json()) as { events: PublicAppointment[] };
        if (active) setEvents(data.events);
      } catch {
        if (active) setNotice({ tone: "info", message: "A disponibilidade detalhada será carregada assim que a agenda estiver conectada." });
      } finally {
        if (active) setAvailabilityLoading(false);
      }
    }
    loadAvailability();
    return () => { active = false; };
  }, [values.date]);

  const blocked = useMemo(() => events.map((event) => ({ startsAt: new Date(event.startsAt), endsAt: new Date(event.endsAt) })), [events]);
  const candidateIsAvailable = (() => {
    if (!dateIsBookable || !leadTimeSatisfied || !values.date || !values.startTime || !values.endTime || values.endTime <= values.startTime) return false;
    return isAvailable({ startsAt: toInstitutionDateTime(values.date, values.startTime), endsAt: toInstitutionDateTime(values.date, values.endTime) }, blocked);
  })();

  function update(name: keyof FormState, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  }

  function handleDateChange(value: string) {
    update("date", value);
    if (value < minimumDate) {
      setNotice({ tone: "info", message: "Escolha uma data com no mínimo 48 horas de antecedência." });
    } else if (!isDateBookable(value)) {
      setNotice({ tone: "info", message: "Sábados e domingos estão bloqueados para agendamento." });
    } else {
      setNotice(null);
    }
  }

  function selectSlot(time: string) {
    const endMinutes = Math.min(18 * 60, Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) + 60);
    update("startTime", time);
    update("endTime", `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    const parsed = appointmentSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) nextErrors[String(issue.path[0])] = issue.message;
      setFieldErrors(nextErrors);
      setNotice({ tone: "error", message: "Revise os campos destacados antes de enviar." });
      return;
    }
    if (!dateIsBookable) {
      setFieldErrors({ date: values.date < minimumDate ? "A data precisa respeitar 48 horas de antecedência." : "Sábados e domingos não estão disponíveis." });
      setNotice({ tone: "error", message: "Escolha um dia útil com no mínimo 48 horas de antecedência." });
      return;
    }
    if (!leadTimeSatisfied) {
      setFieldErrors({ startTime: "O horário inicial precisa respeitar 48 horas de antecedência." });
      setNotice({ tone: "error", message: "Escolha um horário a partir do limite mínimo permitido." });
      return;
    }
    if (!candidateIsAvailable) {
      setFieldErrors({ startTime: "Este período conflita com a agenda ou com o intervalo obrigatório de 15 minutos." });
      setNotice({ tone: "error", message: "Este horário não está disponível. Escolha outro horário." });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const data = (await response.json()) as { appointment?: PublicAppointment; message?: string; issues?: { fieldErrors?: Record<string, string[]> } };
      if (!response.ok) {
        const errors = Object.fromEntries(Object.entries(data.issues?.fieldErrors ?? {}).map(([key, value]) => [key, value?.[0] ?? "Campo inválido."]));
        setFieldErrors(errors);
        setNotice({ tone: "error", message: data.message ?? "Não foi possível enviar a solicitação." });
        return;
      }
      setNotice({ tone: "success", message: data.message ?? "Solicitação enviada com sucesso! Seu agendamento está aguardando aprovação." });
      if (data.appointment) setEvents((current) => [...current, data.appointment as PublicAppointment]);
      setValues((current) => ({ ...current, requesterName: "", department: "", email: "", phone: "", purpose: "", notes: "" }));
    } catch {
      setNotice({ tone: "error", message: "Não foi possível enviar sua solicitação. Tente novamente." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-7" noValidate>
      {notice && <Toast tone={notice.tone} message={notice.message} />}
      <fieldset className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card sm:p-7">
        <legend className="px-2 text-sm font-black text-slate-900">Dados do solicitante</legend>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <Field label="Nome completo" error={fieldErrors.requesterName}><input value={values.requesterName} onChange={(event) => update("requesterName", event.target.value)} autoComplete="name" /></Field>
          <Field label="Setor / unidade" hint="Ex.: EAD" error={fieldErrors.department}><input list="department-options" value={values.department} onChange={(event) => update("department", event.target.value)} placeholder="Informe o setor, como EAD" /><datalist id="department-options"><option value="EAD" /><option value="Diretoria" /><option value="Coordenação" /><option value="Comunicação" /><option value="Administrativo" /></datalist></Field>
          <Field label="E-mail" error={fieldErrors.email}><input type="email" value={values.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" /></Field>
          <Field label="Telefone / WhatsApp" error={fieldErrors.phone}><input inputMode="tel" value={values.phone} onChange={(event) => update("phone", event.target.value)} autoComplete="tel" /></Field>
        </div>
      </fieldset>

      <fieldset className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card sm:p-7">
        <legend className="px-2 text-sm font-black text-slate-900">Dados da utilização</legend>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <Field label="Data" error={fieldErrors.date}><input type="date" min={minimumDate} value={values.date} onChange={(event) => handleDateChange(event.target.value)} /></Field>
          <Field label="Horário inicial" error={fieldErrors.startTime}><input type="time" step="900" min={minimumTime} disabled={!dateIsBookable} value={values.startTime} onChange={(event) => update("startTime", event.target.value)} /></Field>
          <Field label="Horário final" error={fieldErrors.endTime}><input type="time" step="900" min={minimumTime} disabled={!dateIsBookable} value={values.endTime} onChange={(event) => update("endTime", event.target.value)} /></Field>
        </div>
        <p className="mt-3 text-xs font-semibold text-slate-500">Antecedência mínima: 48 horas. Agendamentos disponíveis somente de segunda a sexta-feira.</p>
        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="flex items-center gap-2 text-sm font-extrabold text-slate-800"><Clock3 size={16} className="text-ieptec-600" />Horários de referência</p><span className="text-xs font-semibold text-slate-500">Cada bloco representa 15 min</span></div>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-9">
            {SLOTS.map((slot) => {
              const isStart = slot === values.startTime;
              const state = isStart && dateIsBookable && leadTimeSatisfied ? "selected" : (() => {
                const slotEnd = `${String(Math.floor((Number(slot.slice(0, 2)) * 60 + Number(slot.slice(3)) + 15) / 60)).padStart(2, "0")}:${String((Number(slot.slice(0, 2)) * 60 + Number(slot.slice(3)) + 15) % 60).padStart(2, "0")}`;
                return dateIsBookable && isWithinMinimumAdvance(values.date, slot) && isAvailable({ startsAt: toInstitutionDateTime(values.date, slot), endsAt: toInstitutionDateTime(values.date, slotEnd) }, blocked) ? "available" : "blocked";
              })();
              return <TimeSlot key={slot} time={slot} state={state} onSelect={selectSlot} />;
            })}
          </div>
          {!availabilityLoading && <p className={`mt-3 text-xs font-bold ${candidateIsAvailable ? "text-emerald-700" : "text-rose-700"}`}>{candidateIsAvailable ? "Período disponível respeitando 48 horas de antecedência e a margem de 15 minutos." : !dateIsBookable ? "Selecione um dia útil a partir do limite mínimo de 48 horas." : !leadTimeSatisfied ? "Os horários anteriores ao limite de 48 horas estão bloqueados." : "Selecione um período disponível e mantenha o intervalo obrigatório."}</p>}
        </div>
        <div className="mt-5 grid gap-4">
          <Field label="Finalidade" error={fieldErrors.purpose}><input value={values.purpose} onChange={(event) => update("purpose", event.target.value)} placeholder="Ex.: gravação de aula" /></Field>
          <Field label="Observações (opcional)" error={fieldErrors.notes}><textarea value={values.notes} onChange={(event) => update("notes", event.target.value)} rows={4} placeholder="Compartilhe detalhes que ajudem na análise." /></Field>
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 rounded-3xl bg-ieptec-950 p-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <p className="flex max-w-xl items-start gap-2 text-sm leading-6 text-ieptec-100"><CalendarDays size={18} className="mt-1 shrink-0" />Ao enviar, o horário ficará reservado preventivamente enquanto aguarda análise administrativa.</p>
        <button type="submit" className="button-primary shrink-0 bg-white text-ieptec-800 hover:bg-ieptec-50 disabled:cursor-not-allowed disabled:opacity-60" disabled={submitting || availabilityLoading}>{submitting ? "Enviando..." : <><Send size={17} />Enviar solicitação</>}</button>
      </div>
    </form>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return <label className="block text-sm font-bold text-slate-700"><span className="flex items-center justify-between gap-2"><span>{label}</span>{hint && <span className="rounded-full bg-ieptec-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-ieptec-700">{hint}</span>}</span><span className="mt-1.5 block">{children}</span>{error && <span role="alert" className="mt-1 block text-xs font-semibold text-rose-700">{error}</span>}</label>;
}
