import Link from "next/link";
import { CalendarClock, ShieldCheck } from "lucide-react";

export function SiteHeader({ admin = false }: { admin?: boolean }) {
  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <Link
          href={admin ? "/admin" : "/"}
          className="group flex min-w-0 items-center gap-3"
          aria-label="Studio EAD"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-ieptec-700 text-white shadow-float ring-2 ring-ieptec-gold/75 ring-offset-2 ring-offset-white transition-transform group-hover:-rotate-3">
            {admin ? (
              <ShieldCheck size={21} strokeWidth={2.5} />
            ) : (
              <CalendarClock size={21} strokeWidth={2.5} />
            )}
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-[11px] font-extrabold uppercase tracking-[0.16em] text-ieptec-600">
              Studio
            </span>
            <span className="block truncate text-base font-black tracking-tight text-slate-900">
              EAD
            </span>
          </span>
        </Link>
        <nav
          className="flex items-center gap-1 text-sm font-bold text-slate-600"
          aria-label="Navegação principal"
        >
          {!admin && (
            <Link
              href="/agenda"
              className="rounded-xl px-3 py-2 transition hover:bg-ieptec-50 hover:text-ieptec-700"
            >
              Agenda
            </Link>
          )}
          {admin ? (
            <Link
              href="/"
              className="rounded-xl px-3 py-2 transition hover:bg-ieptec-50 hover:text-ieptec-700"
            >
              Ver agenda pública
            </Link>
          ) : (
            <Link
              href="/admin/login"
              className="rounded-xl px-3 py-2 transition hover:bg-ieptec-50 hover:text-ieptec-700"
            >
              Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
