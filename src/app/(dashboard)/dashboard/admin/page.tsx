import { requireAdmin } from "@/lib/admin-guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { RoleSelector } from "@/components/admin/RoleSelector";
import {
  Shield, Users, Briefcase, Calendar, Building2, Ticket,
  LayoutGrid, AlertTriangle
} from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function AdminDashboard() {
  const { supabase, user, profile } = await requireAdmin();

  // Parallel fetch of all platform-wide counts
  const [
    profilesRes,
    servicesRes,
    eventsRes,
    clubsRes,
    bookingsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id, role, full_name, username, city, avatar_url, created_at"),
    supabase.from("services").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase.from("clubs").select("id", { count: "exact", head: true }),
    supabase.from("bookings").select("id", { count: "exact", head: true }),
  ]);

  const profilesList = profilesRes.data || [];
  const totalUsers = profilesList.filter((p) => p.role === "user").length;
  const totalProviders = profilesList.filter((p) => p.role === "provider").length;
  const totalAdmins = profilesList.filter((p) => p.role === "admin").length;
  const totalServices = servicesRes.count ?? 0;
  const totalEvents = eventsRes.count ?? 0;
  const totalClubs = clubsRes.count ?? 0;
  const totalBookings = bookingsRes.count ?? 0;

  const STATS = [
    { label: "Usuarios", value: totalUsers, icon: Users, color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
    { label: "Proveedores", value: totalProviders, icon: Briefcase, color: "text-accent-400", bg: "bg-accent-500/10", border: "border-accent-500/20" },
    { label: "Servicios", value: totalServices, icon: LayoutGrid, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
    { label: "Eventos", value: totalEvents, icon: Calendar, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
    { label: "Discotecas", value: totalClubs, icon: Building2, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { label: "Reservas", value: totalBookings, icon: Ticket, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  ];

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        <AdminSidebar profile={profile} />

        <div className="flex-grow space-y-8">
          {/* Header */}
          <header>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold font-outfit text-white">Consola de Administración</h1>
            </div>
            <p className="text-zinc-400 ml-1">Visión global del marketplace Hangover y gestión de la plataforma.</p>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {STATS.map(({ label, value, icon: Icon, color, bg, border }) => (
              <div key={label} className={`glass-card p-5 border ${border}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-zinc-400 font-medium text-sm">{label}</h4>
                  <div className={`p-2 rounded-lg ${bg}`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                </div>
                <p className={`text-3xl font-bold font-outfit ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Quick navigation cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { href: "/dashboard/admin/users", icon: Users, label: "Gestionar Usuarios", desc: "Listar, asignar roles y eliminar cuentas.", color: "text-sky-400", border: "border-sky-500/20" },
              { href: "/dashboard/admin/providers", icon: Briefcase, label: "Gestionar Proveedores", desc: "Ver servicios, eventos por proveedor.", color: "text-accent-400", border: "border-accent-500/20" },
              { href: "/dashboard/admin/content", icon: LayoutGrid, label: "Gestionar Contenido", desc: "Servicios, eventos y discotecas.", color: "text-violet-400", border: "border-violet-500/20" },
              { href: "/dashboard/admin/bookings", icon: Ticket, label: "Gestionar Reservas", desc: "Todas las reservas del marketplace.", color: "text-emerald-400", border: "border-emerald-500/20" },
            ].map(({ href, icon: Icon, label, desc, color, border }) => (
              <Link
                key={href}
                href={href}
                className={`glass-card p-5 border ${border} hover:border-white/20 transition-all group flex items-start gap-4`}
              >
                <div className="p-3 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors shrink-0">
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <h3 className={`font-bold text-white group-hover:${color} transition-colors`}>{label}</h3>
                  <p className="text-xs text-zinc-400 mt-1">{desc}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Recent profiles table */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Perfiles Recientes</h2>
                <p className="text-sm text-zinc-400">Últimos usuarios registrados en la plataforma.</p>
              </div>
              <Link href="/dashboard/admin/users" className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                Ver todos →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-zinc-400 text-xs font-semibold uppercase tracking-wider border-b border-white/5">
                    <th className="py-4 px-6">Perfil</th>
                    <th className="py-4 px-6">Username</th>
                    <th className="py-4 px-6">Ciudad</th>
                    <th className="py-4 px-6">Registro</th>
                    <th className="py-4 px-6 text-right">Rol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {profilesList.slice(0, 8).map((p) => {
                    const memberInitials = p.full_name
                      ? p.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
                      : "U";
                    const joinedDate = new Date(p.created_at).toLocaleDateString("es-ES", {
                      day: "numeric", month: "short", year: "numeric",
                    });
                    return (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors text-sm">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {p.avatar_url ? (
                              <img src={p.avatar_url} alt={p.full_name || ""} className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0" />
                            ) : (
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${p.role === "admin" ? "bg-emerald-700" : p.role === "provider" ? "bg-accent-600" : "bg-primary-600"}`}>
                                {memberInitials}
                              </div>
                            )}
                            <p className="font-semibold text-white truncate max-w-[140px]">{p.full_name || "Sin nombre"}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-zinc-300">@{p.username || "usuario"}</td>
                        <td className="py-4 px-6 text-zinc-400 text-xs">{p.city || "—"}</td>
                        <td className="py-4 px-6 text-zinc-400 text-xs">{joinedDate}</td>
                        <td className="py-4 px-6 text-right">
                          <RoleSelector userId={p.id} currentRole={p.role} currentAdminId={user.id} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
