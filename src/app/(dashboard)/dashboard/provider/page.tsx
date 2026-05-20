import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BarChart3, Settings, Calendar, DollarSign, Plus, Bell, MapPin, User, LogOut, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import { BookingActions } from "@/components/provider/BookingActions";

export const revalidate = 0; // Always dynamic

export default async function ProviderDashboard() {
  const supabase = await createClient();

  // Get current user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // Get provider profile with try-catch
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
    role: "provider" as const, // Force provider role in provider dashboard fallback
    full_name: user.user_metadata?.name || user.email?.split("@")[0] || "Proveedor",
    username: user.user_metadata?.username || user.email?.split("@")[0] || "proveedor",
    city: "No especificada",
    bio: "Tu perfil está en modo de recuperación porque no encontramos tu registro en la base de datos.",
    avatar_url: null,
    phone: null,
  };

  // Route security: Ensure user role matches (only if profile loaded successfully)
  if (profile && profile.role !== "provider") {
    redirect(`/dashboard/${profile.role}`);
  }

  // Fetch real services offered by this provider with try-catch
  let services = null;
  let isServicesError = false;

  try {
    const { data, error } = await supabase
      .from("services")
      .select("id")
      .eq("provider_id", user.id);
    
    if (error) {
      isServicesError = true;
    } else {
      services = data;
    }
  } catch (err) {
    isServicesError = true;
  }

  const servicesCount = services ? services.length : 0;

  // Fetch real bookings requested for this provider with try-catch
  let bookings = null;
  let isBookingsError = false;

  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        event_date,
        total_amount,
        status,
        notes,
        user:profiles!bookings_user_id_fkey (
          full_name
        ),
        service:services (
          title
        )
      `)
      .eq("provider_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      isBookingsError = true;
    } else {
      bookings = data;
    }
  } catch (err) {
    isBookingsError = true;
  }

  const bookingsCount = bookings ? bookings.length : 0;
  const pendingBookingsCount = bookings ? bookings.filter((b) => b.status === "pending").length : 0;

  // Calculate monthly earnings from completed/confirmed bookings
  const monthlyEarnings = bookings
    ? bookings
        .filter((b) => b.status === "confirmed" || b.status === "completed")
        .reduce((sum, b) => sum + Number(b.total_amount), 0)
    : 0;

  // Fallback demo requests if no real requests exist yet
  const demoRequests = [
    { id: "demo-1", user: "María G. (Demo)", date: "15 Jun 2026", type: "DJ Set - Boda", status: "Nueva Solicitud", amount: "$800" },
    { id: "demo-2", user: "Carlos R. (Demo)", date: "20 Jun 2026", type: "DJ Set - Cumpleaños", status: "Pendiente", amount: "$450" },
  ];

  const initials = activeProfile.full_name
    ? activeProfile.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "P";

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
                <div className="w-12 h-12 rounded-full bg-accent-600 flex items-center justify-center text-xl font-bold font-outfit text-white shrink-0">
                  {initials}
                </div>
              )}
              <div className="overflow-hidden">
                <h3 className="font-semibold text-white truncate">{activeProfile.full_name || "Proveedor"}</h3>
                <p className="text-xs text-zinc-400">@{activeProfile.username || "proveedor"}</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              <Link href="/dashboard/provider" className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl text-accent-400 font-medium">
                <BarChart3 className="w-5 h-5" />
                Panel de Control
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

          <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-outfit mb-2 text-white">Panel de Proveedor</h1>
              <p className="text-zinc-400">Gestiona tus servicios y solicitudes de reserva.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {activeProfile.city && activeProfile.city !== "No especificada" && (
                <div className="flex items-center gap-1.5 text-zinc-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-sm shrink-0">
                  <MapPin className="w-4 h-4 text-accent-400" />
                  <span>{activeProfile.city}</span>
                </div>
              )}
              <Link href="/dashboard/provider/new-service" className="bg-accent-600 hover:bg-accent-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 glow cursor-pointer text-sm">
                <Plus className="w-5 h-5" />
                Nuevo Servicio
              </Link>
            </div>
          </header>

          {/* Profile Summary Card */}
          <div className="glass-card p-6 bg-gradient-to-r from-accent-950/20 to-transparent flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-accent-400">Presentación / Biografía</h3>
              <div className="text-sm text-zinc-300">
                <p><span className="text-zinc-500">Nombre de Proveedor:</span> {activeProfile.full_name}</p>
                <p><span className="text-zinc-500">Username:</span> @{activeProfile.username}</p>
              </div>
              {activeProfile.bio && (
                <p className="text-sm text-zinc-400 italic mt-2">"{activeProfile.bio}"</p>
              )}
            </div>
            <Link 
              href="/dashboard/profile" 
              className="bg-accent-600 hover:bg-accent-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shrink-0 text-sm glow text-center w-full md:w-auto"
            >
              Editar Perfil completo
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-6 border-accent-500/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-zinc-400 font-medium">Ingresos Confirmados</h4>
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-3xl font-bold">${monthlyEarnings || "0.00"}</p>
              <p className="text-xs text-emerald-400 mt-2">Reservas completadas/confirmadas</p>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-zinc-400 font-medium">Servicios Activos</h4>
                <Settings className="w-5 h-5 text-accent-400" />
              </div>
              <p className="text-3xl font-bold">{servicesCount}</p>
              <p className="text-xs text-zinc-400 mt-2">{isServicesError ? "Error al consultar servicios de BD" : "Publicados en marketplace"}</p>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-zinc-400 font-medium">Total Reservas</h4>
                <Calendar className="w-5 h-5 text-yellow-400" />
              </div>
              <p className="text-3xl font-bold">{bookingsCount}</p>
              <p className="text-xs text-zinc-400 mt-2">{pendingBookingsCount} pendientes de respuesta</p>
            </div>
          </div>
          {/* Solicitudes y Reservas */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                Solicitudes y Reservas
                <span className="bg-accent-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {bookingsCount}
                </span>
              </h2>
            </div>
            
            <div className="space-y-4">
              {bookings && bookings.length > 0 ? (
                bookings.map((req) => (
                  <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-black/40 rounded-xl border border-white/5">
                    <div className="flex items-start gap-4 mb-4 sm:mb-0">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-semibold shrink-0">
                        {req.user ? (req.user as any).full_name.charAt(0) : "U"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-white">{(req.user as any)?.full_name || "Usuario"}</h4>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full border capitalize ${
                            req.status === 'confirmed'
                              ? 'bg-accent-500/10 text-accent-300 border-accent-500/20 border-solid'
                              : req.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 border-solid'
                              : req.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20 border-solid'
                              : 'bg-red-500/10 text-red-300 border-red-500/20 border-solid'
                          }`}>
                            {req.status === 'confirmed'
                              ? 'confirmada'
                              : req.status === 'completed'
                              ? 'completada'
                              : req.status === 'pending'
                              ? 'pendiente'
                              : 'cancelada'}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400">
                          {(req.service as any)?.title || "Servicio solicitado"} • {new Date(req.event_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        {req.notes && <p className="text-xs text-zinc-500 mt-1 italic">Nota: "{req.notes}"</p>}
                        <p className="text-sm font-medium text-emerald-400 mt-1">${req.total_amount}</p>
                      </div>
                    </div>
                    <BookingActions bookingId={req.id} currentStatus={req.status} />
                  </div>
                ))
              ) : (
                <>
                  <div className="text-center py-6 text-zinc-500 text-sm border-b border-white/5 mb-4">
                    {isBookingsError ? "No se pudieron obtener solicitudes de reserva de la base de datos." : "No tienes solicitudes de reservas reales pendientes."} Mostrando demostración:
                  </div>
                  {demoRequests.map((req) => (
                    <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-black/40 rounded-xl border border-white/5 opacity-60">
                      <div className="flex items-start gap-4 mb-4 sm:mb-0">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-semibold shrink-0">
                          {req.user.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-white">{req.user}</h4>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-accent-500/20 text-accent-300">
                              {req.status}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-400">{req.type} • {req.date}</p>
                          <p className="text-sm font-medium text-emerald-400 mt-1">{req.amount}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button className="flex-1 sm:flex-none px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors">
                          Ver Detalles
                        </button>
                        <button className="flex-1 sm:flex-none px-4 py-2 bg-accent-600 hover:bg-accent-500 rounded-lg text-sm font-medium text-white transition-colors">
                          Aceptar
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
