import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Shield, Settings, Users, Briefcase, UserCheck, Calendar, MapPin, LogOut, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import { RoleSelector } from "@/components/admin/RoleSelector";

export const revalidate = 0; // Always dynamic

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Get current user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // Get current profile and check role with try-catch
  let profile = null;
  let isProfileError = false;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !data) {
      isProfileError = true;
    } else {
      profile = data;
    }
  } catch (err) {
    isProfileError = true;
  }

  // Fallback profile if database query fails or is empty
  const activeProfile = profile || {
    id: user.id,
    role: "admin" as const, // Force admin role in admin dashboard fallback
    full_name: user.user_metadata?.name || user.email?.split("@")[0] || "Administrador",
    username: user.email?.split("@")[0] || "admin",
    city: "No especificada",
    bio: "Tu perfil está en modo de recuperación porque no encontramos tu registro en la base de datos.",
    avatar_url: null,
    phone: null,
  };

  // Security: Check if admin (only if profile loaded successfully)
  if (profile && profile.role !== "admin") {
    redirect(`/dashboard/${profile.role}`);
  }

  // Fetch all profiles on the platform with try-catch
  let allProfiles = null;
  let isFetchProfilesError = false;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      isFetchProfilesError = true;
    } else {
      allProfiles = data;
    }
  } catch (err) {
    isFetchProfilesError = true;
  }

  const profilesList = allProfiles || [];
  
  // Calculate statistics
  const totalProfiles = profilesList.length;
  const usersCount = profilesList.filter(p => p.role === 'user').length;
  const providersCount = profilesList.filter(p => p.role === 'provider').length;
  const adminsCount = profilesList.filter(p => p.role === 'admin').length;

  const initials = activeProfile.full_name
    ? activeProfile.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "A";

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="glass-card p-6 sticky top-24">
            <div className="flex items-center gap-4 mb-8">
              {activeProfile.avatar_url ? (
                <img
                  src={activeProfile.avatar_url}
                  alt={activeProfile.full_name || ""}
                  className="w-12 h-12 rounded-full object-cover border border-white/10"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary-700 flex items-center justify-center text-xl font-bold font-outfit text-white shrink-0">
                  {initials}
                </div>
              )}
              <div className="overflow-hidden">
                <h3 className="font-semibold text-white truncate">{activeProfile.full_name || "Admin"}</h3>
                <p className="text-xs text-zinc-400 capitalize">Portal {activeProfile.role}</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              <Link href="/dashboard/admin" className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl text-primary-400 font-medium">
                <Shield className="w-5 h-5" />
                Panel Admin
              </Link>
              <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium">
                <Settings className="w-5 h-5" />
                Editar Perfil
              </Link>
              <form action={logout}>
                <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left font-medium cursor-pointer">
                  <LogOut className="w-5 h-5" />
                  Cerrar Sesión
                </button>
              </form>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow space-y-8">
          {/* Recovery Alert Banner */}
          {isProfileError && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm flex flex-col gap-2">
              <div className="font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Modo de Recuperación (Sin Conexión a Perfil de Base de Datos)</span>
              </div>
              <p className="text-xs text-zinc-300">
                No pudimos obtener tu registro de perfil de Supabase. Esto puede deberse a que el perfil aún no ha sido sincronizado o hay un inconveniente temporal con la base de datos.
                Por favor, intenta actualizar tu perfil manualmente para crearlo.
              </p>
              <div>
                <Link 
                  href="/dashboard/profile" 
                  className="inline-block bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
                >
                  Configurar / Crear mi Perfil ahora
                </Link>
              </div>
            </div>
          )}

          <header>
            <h1 className="text-3xl font-bold font-outfit mb-2 text-white">Consola de Administración</h1>
            <p className="text-zinc-400">Gestiona los perfiles del marketplace y asigna roles administrativos.</p>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-zinc-400 font-medium">Total Cuentas</h4>
                <Users className="w-5 h-5 text-primary-400" />
              </div>
              <p className="text-3xl font-bold">{totalProfiles}</p>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-zinc-400 font-medium">Usuarios</h4>
                <UserCheck className="w-5 h-5 text-sky-400" />
              </div>
              <p className="text-3xl font-bold">{usersCount}</p>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-zinc-400 font-medium">Proveedores</h4>
                <Briefcase className="w-5 h-5 text-accent-400" />
              </div>
              <p className="text-3xl font-bold">{providersCount}</p>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-zinc-400 font-medium">Administradores</h4>
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-3xl font-bold">{adminsCount}</p>
            </div>
          </div>

          {/* Profiles Table */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white">Listado de Perfiles</h2>
              <p className="text-sm text-zinc-400">Administra los roles de los usuarios registrados.</p>
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
                  {isFetchProfilesError && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-red-400 text-sm">
                        Error al cargar perfiles: No se pudo conectar a la base de datos de Supabase.
                      </td>
                    </tr>
                  )}
                  {profilesList.length === 0 && !isFetchProfilesError && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-zinc-500 text-sm">
                        No hay perfiles registrados en el sistema.
                      </td>
                    </tr>
                  )}
                  {profilesList.map((p) => {
                    const memberInitials = p.full_name
                      ? p.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
                      : "U";
                    const joinedDate = new Date(p.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });

                    return (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors text-sm">
                        <td className="py-4 px-6 flex items-center gap-3">
                          {p.avatar_url ? (
                            <img
                              src={p.avatar_url}
                              alt={p.full_name || ""}
                              className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-outfit text-white shrink-0 ${
                              p.role === 'admin' ? 'bg-emerald-600' : p.role === 'provider' ? 'bg-accent-600' : 'bg-primary-600'
                            }`}>
                              {memberInitials}
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <p className="font-semibold text-white truncate max-w-[150px]">
                              {p.full_name || "Sin nombre"}
                            </p>
                            {p.phone && <p className="text-[11px] text-zinc-500">{p.phone}</p>}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-zinc-300">
                          @{p.username || "usuario"}
                        </td>
                        <td className="py-4 px-6 text-zinc-300">
                          {p.city ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                              <span className="truncate max-w-[120px]">{p.city}</span>
                            </span>
                          ) : (
                            <span className="text-zinc-600 italic text-xs">No especificada</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-zinc-400 text-xs">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            {joinedDate}
                          </span>
                        </td>
                        <td className="py-4 px-6 align-middle text-right">
                          <div className="flex justify-end">
                            <RoleSelector
                              userId={p.id}
                              currentRole={p.role}
                              currentAdminId={user.id}
                            />
                          </div>
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
