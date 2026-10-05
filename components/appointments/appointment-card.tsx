import { Clock3, MapPin } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { StatusBadge } from "@/components/ui/status-badge";
import type { PublicAppointment } from "@/types/appointments";

export function AppointmentCard({ appointment, showDate = false }: { appointment: PublicAppointment; showDate?: boolean }) {
  const start = new Date(appointment.startsAt);
  const end = new Date(appointment.endsAt);
  const day = formatInTimeZone(start, "America/Rio_Branco", "dd/MM");
  const times = `${formatInTimeZone(start, "America/Rio_Branco", "HH:mm")} – ${formatInTimeZone(end, "America/Rio_Branco", "HH:mm")}`;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><Clock3 size={14} />{showDate ? `${day} · ` : ""}{times}</div>
          <h3 className="mt-2 truncate text-sm font-extrabold text-slate-900">{appointment.purpose}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-500"><MapPin size={13} />{appointment.department}</p>
        </div>
        <StatusBadge status={appointment.status} compact />
      </div>
    </article>
  );
}
