import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { SiteHeader } from "@/components/site-header";
import { getAdminSession } from "@/lib/auth";
import { getAdminDashboardStats, listAdminAppointments } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let session = null;
  try { session = await getAdminSession(); } catch { session = null; }
  if (!session) redirect("/admin/login");
  const [stats, appointments] = await Promise.all([
    getAdminDashboardStats().catch(() => ({ pending: 0, approved: 0, today: 0, next: null })),
    listAdminAppointments({}).catch(() => [])
  ]);
  return <main className="min-h-screen bg-slate-50"><SiteHeader admin /><section className="mx-auto max-w-7xl px-5 py-10 lg:px-8"><AdminDashboard initialAppointments={appointments} stats={stats} /></section></main>;
}
