"use client";

import { CheckCircle2, Info, LoaderCircle, TriangleAlert } from "lucide-react";

export function Toast({ tone = "success", message }: { tone?: "success" | "error" | "info"; message: string }) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border-rose-200 bg-rose-50 text-rose-900",
    info: "border-ieptec-100 bg-ieptec-50 text-ieptec-900"
  };
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? TriangleAlert : Info;
  return (
    <div role="status" className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${styles[tone]}`}>
      <Icon size={19} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return <div className="flex min-h-28 items-center justify-center gap-2 text-sm font-bold text-slate-500"><LoaderCircle size={18} className="animate-spin" />{label}</div>;
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
      <p className="font-extrabold text-slate-800">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">{detail}</p>
    </div>
  );
}
