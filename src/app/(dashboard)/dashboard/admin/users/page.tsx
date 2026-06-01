import { requireAdmin } from "@/lib/admin-guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { RoleSelector } from "@/components/admin/RoleSelector";
import { DeleteUserButton } from "@/components/admin/DeleteUserButton";
import { Users, Calendar, MapPin } from "lucide-react";

export const revalidate = 0;

export default async function AdminUsersPage() {
  const { supabase, user, profile } = await requireAdmin();

  const { data: allProfiles, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, username, city, avatar_url, phone, created_at")
    .order("created_at", { ascending: false });

  const profilesList = allProfiles || [];
  const usersCount = profilesList.filter((p) => p.role === "user").length;
  const providersCount = profilesList.filter((p) => p.role === "provider").length;
  const adminsCount = profilesList.filter((p) => p.role === "admin").length;

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        <AdminSidebar profile={profile} />

        <div className="flex-grow space-y-8">
          <header>
            <h1 className="text-3xl font-bold font-outfit text-white mb-1">Gestión de Usuarios</h1>
            <p className="text-zinc-400">Administra roles y cuentas de todos los usuarios registrados.</p>
          </header>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Usuarios", value: usersCount, color: "text-sky-400" },
              { label: "Proveedores", value: providersCount, color: "text-accent-400" },
              { label: "Administradores", value: adminsCount, color: "text-emerald-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-card p-4 text-center">
                <p className={`text-2xl font-bold font-outfit ${color}`}>{value}</p>
                <p className="text-xs text-zinc-400 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Full users table */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-400" />
                Todos los Perfiles ({profilesList.length})
              </h2>
            </div>

            {error && (
              <div className="p-6 text-red-400 text-sm">
                Error al cargar perfiles: {error.message}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-zinc-400 text-xs font-semibold uppercase tracking-wider border-b border-white/5">
                    <th className="py-4 px-5">Perfil</th>
                    <th className="py-4 px-5">Username</th>
                    <th className="py-4 px-5">Ciudad</th>
                    <th className="py-4 px-5">Registro</th>
                    <th className="py-4 px-5">Rol</th>
                    <th className="py-4 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {profilesList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500 text-sm">
                        No hay perfiles registrados.
                      </td>
                    </tr>
                  )}
                  {profilesList.map((p) => {
                    const initials = p.full_name
                      ? p.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
                      : "U";
                    const joinedDate = new Date(p.created_at).toLocaleDateString("es-ES", {
                      day: "numeric", month: "short", year: "numeric",
                    });
                    return (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors text-sm">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            {p.avatar_url ? (
                              <img src={p.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0" />
                            ) : (
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${p.role === "admin" ? "bg-emerald-700" : p.role === "provider" ? "bg-accent-600" : "bg-primary-600"}`}>
                                {initials}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-white truncate max-w-[140px]">{p.full_name || "Sin nombre"}</p>
                              {p.phone && <p className="text-[11px] text-zinc-500">{p.phone}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-zinc-300">@{p.username || "—"}</td>
                        <td className="py-4 px-5 text-zinc-400 text-xs">
                          {p.city ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-zinc-500" />{p.city}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="py-4 px-5 text-zinc-400 text-xs">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-zinc-500" />{joinedDate}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <RoleSelector userId={p.id} currentRole={p.role} currentAdminId={user.id} />
                        </td>
                        <td className="py-4 px-5 text-right">
                          {p.id !== user.id && (
                            <DeleteUserButton userId={p.id} userName={p.full_name || p.username || "este usuario"} />
                          )}
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
