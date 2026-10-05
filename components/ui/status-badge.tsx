import type { AppointmentStatus } from "@/types/appointments";

const statusMap: Record<AppointmentStatus, { label: string; className: string; dot: string }> = {
  PENDING: { label: "Aguardando aprovação", className: "bg-amber-50 text-amber-800 ring-amber-200", dot: "bg-amber-500" },
  APPROVED: { label: "Aprovado", className: "bg-emerald-50 text-emerald-800 ring-emerald-200", dot: "bg-emerald-500" },
  REJECTED: { label: "Rejeitado", className: "bg-rose-50 text-rose-800 ring-rose-200", dot: "bg-rose-500" },
  CANCELLED: { label: "Cancelado", className: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-500" }
};

export function StatusBadge({ status, compact = false }: { status: AppointmentStatus; compact?: boolean }) {
  const item = statusMap[status];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ring-1 ring-inset ${item.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} aria-hidden="true" />
      {!compact && item.label}
    </span>
  );
}
