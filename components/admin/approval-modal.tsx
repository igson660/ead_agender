"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Toast } from "@/components/ui/feedback";

type Action = "approve" | "reject" | "cancel";

const actionCopy: Record<Action, { title: string; description: string; button: string; tone: string }> = {
  approve: { title: "Aprovar agendamento", description: "Confirme o código administrativo. A disponibilidade será verificada novamente antes da aprovação.", button: "Aprovar agora", tone: "bg-emerald-600 hover:bg-emerald-700" },
  reject: { title: "Rejeitar solicitação", description: "Inclua uma observação opcional e confirme o código administrativo para registrar a decisão.", button: "Rejeitar solicitação", tone: "bg-rose-600 hover:bg-rose-700" },
  cancel: { title: "Cancelar agendamento", description: "A confirmação registra o cancelamento no histórico e libera este horário para novas solicitações.", button: "Cancelar agendamento", tone: "bg-slate-700 hover:bg-slate-800" }
};

export function ApprovalModal({ open, appointmentId, action, onClose, onComplete }: { open: boolean; appointmentId: string; action: Action; onClose: () => void; onComplete: (message: string) => void }) {
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = actionCopy[action];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/admin/appointments/${appointmentId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, code, note }) });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) { setError(data.message ?? "Não foi possível concluir a ação."); return; }
      setCode(""); setNote(""); onComplete(data.message ?? "Ação concluída com sucesso."); onClose();
    } catch { setError("Não foi possível concluir a ação."); } finally { setBusy(false); }
  }

  return <ConfirmationDialog open={open} title={copy.title} description={copy.description} onClose={onClose}><form onSubmit={submit} className="space-y-4"><label className="block text-sm font-bold text-slate-700">Observação <span className="font-medium text-slate-400">(opcional)</span><textarea className="mt-1.5" rows={3} value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="Motivo ou orientação para o solicitante" /></label><label className="block text-sm font-bold text-slate-700">Código administrativo<input className="mt-1.5" type="password" value={code} onChange={(event) => setCode(event.target.value)} required autoComplete="current-password" /></label>{error && <Toast tone="error" message={error} />}<div className="flex gap-3 pt-1"><button type="button" className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-extrabold text-slate-700 hover:bg-slate-50" onClick={onClose}>Voltar</button><button type="submit" disabled={busy} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-extrabold text-white disabled:opacity-60 ${copy.tone}`}>{busy ? <LoaderCircle className="animate-spin" size={17} /> : action === "approve" ? <CheckCircle2 size={17} /> : <XCircle size={17} />}{busy ? "Registrando..." : copy.button}</button></div></form></ConfirmationDialog>;
}
