import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { AppointmentForm } from "@/components/appointments/appointment-form";
import { SiteHeader } from "@/components/site-header";
import { getFirstBookableDate, isWeekendDate } from "@/lib/scheduling";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ date?: string }> };

export default async function AgendamentoPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const minimumDate = getFirstBookableDate();
  const validDate = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) && params.date >= minimumDate && !isWeekendDate(params.date) ? params.date : minimumDate;
  return <main className="min-h-screen bg-[linear-gradient(180deg,_#eff7ff_0%,_#f8fafc_45%,_#fff_100%)]"><SiteHeader /><section className="mx-auto max-w-4xl px-5 py-10 lg:px-8"><Link href="/agenda" className="inline-flex items-center gap-2 text-sm font-extrabold text-ieptec-700 hover:text-ieptec-900"><ArrowLeft size={16} />Voltar para a agenda</Link><div className="mt-6 rounded-4xl bg-ieptec-950 px-6 py-8 text-white sm:px-9"><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-ieptec-200">Solicitação de uso</p><h1 className="mt-2 text-3xl font-black tracking-tight">Novo agendamento</h1><p className="mt-3 max-w-2xl leading-7 text-ieptec-100">Preencha os dados abaixo. O horário precisa ser solicitado com no mínimo 48 horas de antecedência e somente de segunda a sexta-feira.</p><div className="mt-5 inline-flex items-start gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs font-semibold text-ieptec-50"><Info size={16} className="shrink-0" />Fuso America/Rio_Branco · mínimo de 48 horas · sábado e domingo bloqueados.</div></div><div className="mt-7"><AppointmentForm initialDate={validDate} /></div></section></main>;
}
