"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";

export function ConfirmationDialog({ open, title, description, children, onClose }: { open: boolean; title: string; description: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="w-full max-w-md rounded-4xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4"><div><h2 id="dialog-title" className="text-xl font-black text-slate-900">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></div><button type="button" onClick={onClose} className="icon-button" aria-label="Fechar diálogo"><X size={18} /></button></div>
        <div className="mt-5">{children}</div>
      </section>
    </div>
  );
}
