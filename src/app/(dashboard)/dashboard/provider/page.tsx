import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BarChart3, Settings, Calendar, DollarSign, Plus, Bell, MapPin, User, LogOut, AlertTriangle, Building2, QrCode, Camera, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import { BookingActions } from "@/components/provider/BookingActions";
import { ProviderServicesList } from "@/components/provider/ProviderServicesList";

export const revalidate = 0; // Always dynamic

export default async function ProviderDashboard() {
  const supabase = await createClient();

  // Get current user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // Get provider profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login");
  }

  // Route security: Ensure user role matches
  if (profile.role !== "provider") {
    redirect(`/dashboard/${profile.role}`);
  }

  const activeProfile = profile;
  const isProfileError = false;

  // Fetch real services offered by this provider with try-catch
  let services: any[] = [];
  let isServicesError = false;

  try {
    const { data, error } = await supabase
      .from("services")
      .select("id, title, description, price, category, image_url")
      .eq("provider_id", user.id)
      .order("created_at", { ascending: false });
    
    if (error) {
      isServicesError = true;
    } else {
      services = data || [];
    }
  } catch (err) {
    isServicesError = true;
  }

  const servicesCount = services.length;

  // Fetch real bookings requested for this provider with try-catch
  let bookings: any[] = [];
  let isBookingsError = false;

  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("id, event_date, reservation_date, total_amount, status, notes, user_id, club_id, club_slug, number_of_people, event_id")
      .eq("provider_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      isBookingsError = true;
    } else {
      bookings = data || [];
    }
  } catch (err) {
    isBookingsError = true;
  }

  let normalizedBookings = bookings || [];

  if (normalizedBookings.length > 0) {
    const userIds = [...new Set(normalizedBookings.map((booking: any) => booking.user_id).filter(Boolean))];
    const clubIds = [...new Set(normalizedBookings.map((booking: any) => booking.club_id).filter(Boolean))];
    const eventIds = [...new Set(normalizedBookings.map((booking: any) => booking.event_id).filter(Boolean))];

    const [userProfilesResult, clubsResult, eventsResult] = await Promise.all([
      userIds.length
        ? supabase.from("profiles").select("id, full_name").in("id", userIds)
        : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null }> }),
      clubIds.length
        ? supabase.from("clubs").select("id, name").in("id", clubIds)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
      eventIds.length
        ? supabase.from("events").select("id, title").in("id", eventIds)
        : Promise.resolve({ data: [] as Array<{ id: string; title: string }> }),
    ]);

    const userMap = new Map((userProfilesResult.data || []).map((item) => [item.id, item]));
    const clubMap = new Map((clubsResult.data || []).map((item) => [item.id, item]));
    const eventMap = new Map((eventsResult.data || []).map((item) => [item.id, item]));

    normalizedBookings = normalizedBookings.map((booking: any) => {
      const club = booking.club_id ? clubMap.get(booking.club_id) || null : null;
      const event = booking.event_id ? eventMap.get(booking.event_id) || null : null;

      return {
        ...booking,
        user: booking.user_id ? userMap.get(booking.user_id) || null : null,
        club,
        event,
        title: event?.title || club?.name || booking.club_slug || "Entrada de evento",
      };
    });
  }

  const bookingsCount = normalizedBookings.length;
  const pendingBookingsCount = normalizedBookings.filter((b: any) => b.status === "pending").length;

  // Calculate monthly earnings from completed/confirmed bookings
  const monthlyEarnings = bookings
    ? bookings
        .filter((b) => b.status === "confirmed" || b.status === "completed")
        .reduce((sum, b) => sum + Number(b.total_amount), 0)
    : 0;

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
                <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-xl font-bold font-outfit text-white shrink-0">
                  {initials}
                </div>
              )}
              <div className="overflow-hidden">
                <h3 className="font-semibold text-white truncate">{activeProfile.full_name || "Proveedor"}</h3>
                <p className="text-xs text-zinc-400">@{activeProfile.username || "proveedor"}</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              <Link href="/dashboard/provider" className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl text-primary-400 font-medium">
                <BarChart3 className="w-5 h-5 text-primary-400" />
                Panel de Control
              </Link>
              <Link href="/dashboard/provider/clubs" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium">
                <Building2 className="w-5 h-5" />
                Mis Discotecas
              </Link>
              <Link href="/dashboard/provider/orders" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium">
                <ShoppingBag className="w-5 h-5 text-primary-400" />
                Pedidos en Vivo
              </Link>
              <Link href="/dashboard/provider/validate" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium">
                <QrCode className="w-5 h-5 text-primary-400" />
                Validar Entrada
              </Link>
              <Link href="/dashboard/provider/scanner" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium">
                <Camera className="w-5 h-5 text-primary-400" />
                Escáner Cámara
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
                  <MapPin className="w-4 h-4 text-primary-400" />
                  <span>{activeProfile.city}</span>
                </div>
              )}
              <Link href="/dashboard/provider/scanner" className="bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg shadow-primary-600/15 active:scale-98 cursor-pointer text-sm">
                <Camera className="w-4.5 h-4.5 shrink-0" />
                Validar por Cámara
              </Link>
              <Link href="/dashboard/provider/validate" className="bg-primary-900/40 border border-primary-500/20 hover:border-primary-500/40 hover:bg-primary-900/60 text-primary-300 px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 cursor-pointer text-sm">
                <QrCode className="w-4.5 h-4.5 shrink-0" />
                Validar Manual
              </Link>
              <Link href="/dashboard/provider/new-service" className="bg-zinc-900/60 border border-white/5 hover:border-primary-500/30 hover:bg-primary-950/20 text-zinc-300 hover:text-white px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 cursor-pointer text-sm">
                <Plus className="w-4.5 h-4.5 shrink-0" />
                Nuevo Servicio
              </Link>
              <Link href="/dashboard/provider/new-event" className="bg-zinc-900/60 border border-white/5 hover:border-primary-500/30 hover:bg-primary-950/20 text-zinc-300 hover:text-white px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 cursor-pointer text-sm">
                <Plus className="w-4.5 h-4.5 shrink-0" />
                Nuevo Evento
              </Link>
            </div>
          </header>

          {/* Profile Summary Card */}
          <div className="glass-card p-6 bg-gradient-to-r from-primary-950/20 to-transparent flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-400">Presentación / Biografía</h3>
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
              className="bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shrink-0 text-sm glow text-center w-full md:w-auto"
            >
              Editar Perfil completo
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-6 border-primary-500/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-zinc-400 font-medium">Ingresos Confirmados</h4>
                <DollarSign className="w-5 h-5 text-primary-400" />
              </div>
              <p className="text-3xl font-bold font-outfit text-white">${monthlyEarnings || "0.00"}</p>
              <p className="text-xs text-primary-400 mt-2">Reservas completadas/confirmadas</p>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-zinc-400 font-medium">Servicios Activos</h4>
                <Settings className="w-5 h-5 text-primary-400" />
              </div>
              <p className="text-3xl font-bold font-outfit text-white">{servicesCount}</p>
              <p className="text-xs text-zinc-400 mt-2">{isServicesError ? "Error al consultar servicios de BD" : "Publicados en marketplace"}</p>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-zinc-400 font-medium">Total Reservas</h4>
                <Calendar className="w-5 h-5 text-primary-400" />
              </div>
              <p className="text-3xl font-bold font-outfit text-white">{bookingsCount}</p>
              <p className="text-xs text-zinc-400 mt-2">{pendingBookingsCount} pendientes de respuesta</p>
            </div>
          </div>

          {/* Mis Servicios */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                Mis Servicios
                <span className="bg-primary-650/20 border border-primary-500/20 text-primary-300 text-xs px-2 py-0.5 rounded-full">
                  {servicesCount}
                </span>
              </h2>
              <Link href="/dashboard/provider/new-service" className="text-xs text-primary-400 hover:text-primary-300 font-semibold transition-colors flex items-center gap-1 cursor-pointer">
                + Crear Servicio
              </Link>
            </div>
            <ProviderServicesList services={services} />
          </div>

          {/* Solicitudes y Reservas */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                Solicitudes y Reservas
                <span className="bg-primary-650/20 border border-primary-500/20 text-primary-300 text-xs px-2 py-0.5 rounded-full">
                  {bookingsCount}
                </span>
              </h2>
            </div>
            
            <div className="space-y-4">
              {normalizedBookings.length > 0 ? (
                normalizedBookings.map((req: any) => (
                  <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-black/40 rounded-xl border border-white/5">
                    <div className="flex items-start gap-4 mb-4 sm:mb-0">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-semibold shrink-0">
                        {(req.user as any)?.full_name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <h4 className="font-semibold text-white">{(req.user as any)?.full_name || "Usuario"}</h4>
                           <span className={`text-xs px-2.5 py-0.5 rounded-full border capitalize ${
                             req.status === 'confirmed'
                               ? 'bg-primary-500/10 text-primary-300 border-primary-500/20 border-solid'
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
                               : req.status === 'rejected'
                               ? 'rechazada'
                               : 'cancelada'}
                           </span>
                        </div>
                        <p className="text-sm text-zinc-400">
                          {req.title} • {new Date(req.event_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        {req.number_of_people ? (
                          <p className="text-xs text-zinc-500 mt-1">{req.number_of_people} personas</p>
                        ) : null}
                        {req.notes && <p className="text-xs text-zinc-500 mt-1 italic">Nota: "{req.notes}"</p>}
                        <p className="text-sm font-semibold text-white font-outfit mt-1">${Number(req.total_amount).toLocaleString("es-CO")} COP</p>
                      </div>
                    </div>
                    <BookingActions bookingId={req.id} currentStatus={req.status} />
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-zinc-500 text-sm border-b border-white/5 mb-4">
                  {isBookingsError
                    ? "No se pudieron obtener solicitudes de reserva de la base de datos. Revisa las políticas de RLS y ejecuta el script de integración."
                    : "No tienes solicitudes de reservas reales pendientes."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
