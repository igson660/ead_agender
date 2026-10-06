"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Toast } from "@/components/ui/feedback";

export default function AdminLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true); setMessage(null);
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) { setMessage(data.message ?? "Não foi possível validar o acesso."); return; }
      router.push("/admin"); router.refresh();
    } catch { setMessage("Não foi possível validar o acesso."); } finally { setSubmitting(false); }
  }

  return <main className="min-h-screen bg-[radial-gradient(circle_at_80%_15%,_#dceeff_0,_transparent_28%),_#f8fafc]"><SiteHeader /><section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl place-items-center px-5 py-12"><div className="grid w-full max-w-4xl overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-float md:grid-cols-[1.05fr_0.95fr]"><div className="bg-ieptec-950 p-8 text-white sm:p-12"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10"><ShieldCheck size={25} /></div><p className="mt-8 text-xs font-extrabold uppercase tracking-[0.15em] text-ieptec-200">Área restrita</p><h1 className="mt-3 text-3xl font-black tracking-tight">Gestão do Studio, com controle e rastreabilidade.</h1><p className="mt-5 leading-7 text-ieptec-100">Aprove, rejeite e acompanhe as solicitações com histórico completo. O código administrativo é validado somente no servidor.</p></div><div className="p-8 sm:p-12"><h2 className="text-2xl font-black tracking-tight text-slate-950">Acesso administrativo</h2><p className="mt-2 text-sm leading-6 text-slate-600">Informe seu código para abrir o painel protegido.</p><form onSubmit={submit} className="mt-7 space-y-5"><label className="block text-sm font-bold text-slate-700">Código administrativo<input className="mt-1.5" type="password" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="current-password" required aria-describedby="login-help" /></label><p id="login-help" className="flex gap-2 text-xs leading-5 text-slate-500"><LockKeyhole size={15} className="shrink-0" />Tentativas excessivas são temporariamente bloqueadas.</p>{message && <Toast tone="error" message={message} />}<button type="submit" className="button-primary w-full" disabled={submitting}>{submitting ? "Validando..." : "Acessar painel"}</button></form></div></div></section></main>;
}
