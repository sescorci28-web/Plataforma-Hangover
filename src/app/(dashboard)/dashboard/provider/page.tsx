import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BarChart3, Settings, Calendar, DollarSign, Plus, Bell, MapPin, User, LogOut, AlertTriangle, Building2, QrCode, Camera, ShoppingBag, Sliders, Ticket, Clock, CreditCard, Users, Sparkles, CalendarDays, ArrowRight } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import { BookingActions } from "@/components/provider/BookingActions";
import { ProviderServicesList } from "@/components/provider/ProviderServicesList";
import { UserBookingsTabs } from "@/components/dashboard/UserBookingsTabs";

export const revalidate = 0; // Always dynamic

interface ProviderDashboardProps {
  searchParams: Promise<{
    view?: string;
  }>;
}

export default async function ProviderDashboard({ searchParams }: ProviderDashboardProps) {
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

  // Check if onboarding is completed
  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  // Route security: Ensure user role matches
  if (profile.role !== "provider") {
    redirect(`/dashboard/${profile.role}`);
  }

  const { view = "provider" } = (await searchParams) || {};

  const activeProfile = profile;
  const isProfileError = false;

  // ----------------------------------------------------
  // PROVIDER METRICS & QUERIES
  // ----------------------------------------------------
  // Fetch real services offered by this provider
  let services: any[] = [];
  let isServicesError = false;

  try {
    const { data, error } = await supabase
      .from("services")
      .select("id, title, description, price, category, subcategory, image_url")
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

  // Fetch clubs managed by this provider
  let clubs: any[] = [];
  try {
    const { data } = await supabase
      .from("clubs")
      .select("*")
      .eq("provider_id", user.id)
      .order("created_at", { ascending: false });
    clubs = data || [];
  } catch (err) {
    console.error("Error fetching provider clubs:", err);
  }
  const clubsCount = clubs.length;

  // Fetch events created by this provider
  let providerEvents: any[] = [];
  try {
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("creator_id", user.id)
      .order("event_date", { ascending: false });
    providerEvents = data || [];
  } catch (err) {
    console.error("Error fetching provider events:", err);
  }
  const eventsCount = providerEvents.length;

  // Fetch real bookings requested for this provider
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

  const formattedEarnings = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(monthlyEarnings);

  // ----------------------------------------------------
  // CLIENT/PERSONAL USER METRICS & QUERIES
  // ----------------------------------------------------
  // Fetch personal bookings (bookings where user_id = user.id)
  let personalBookings: any[] = [];
  let isPersonalBookingsError = false;

  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("id, event_date, reservation_date, number_of_people, total_amount, status, notes, club_id, club_slug, qr_code, qr_status, qr_validated_at, booking_type")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      isPersonalBookingsError = true;
    } else {
      personalBookings = data || [];
    }
  } catch (err) {
    isPersonalBookingsError = true;
  }

  const personalClubIds = [...new Set(personalBookings.map((booking: any) => booking.club_id).filter(Boolean))];
  const personalClubNames = new Map<string, string>();

  if (personalClubIds.length > 0) {
    const { data: clubsData } = await supabase
      .from("clubs")
      .select("id, name")
      .in("id", personalClubIds);

    (clubsData || []).forEach((club: any) => {
      personalClubNames.set(club.id, club.name);
    });
  }

  const normalizedPersonalBookings = personalBookings.map((booking: any) => ({
    ...booking,
    title: personalClubNames.get(booking.club_id) || booking.club_slug || "Reserva de discoteca",
    displayDate: booking.reservation_date || booking.event_date,
  }));

  const personalBookingsCount = normalizedPersonalBookings.length;
  const personalActiveBookingsCount = normalizedPersonalBookings.filter(
    (b) => b.status === "pending" || b.status === "confirmed"
  ).length;

  // Calculate total spent on completed/confirmed bookings
  const totalSpent = normalizedPersonalBookings
    .filter((b: any) => b.status === "confirmed" || b.status === "completed")
    .reduce((sum: number, b: any) => sum + Number(b.total_amount), 0);

  const formattedTotalSpent = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(totalSpent);

  const initials = activeProfile.full_name
    ? activeProfile.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "P";

  const displayUsername = activeProfile.username || activeProfile.full_name?.toLowerCase().replace(/\s+/g, "_") || "proveedor";

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
                <p className="text-xs text-zinc-400">@{displayUsername}</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              <Link 
                href="/dashboard/provider?view=provider" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${
                  view === "provider" || ["events", "tickets", "attendees", "sales", "services", "requests", "bookings", "calendar"].includes(view)
                    ? "bg-white/10 text-primary-400"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <BarChart3 className="w-5 h-5 text-primary-400" />
                Panel de Negocio
              </Link>
              <Link 
                href="/dashboard/provider?view=client" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${
                  view === "client"
                    ? "bg-white/10 text-primary-400"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Ticket className="w-5 h-5" />
                Mi Actividad Cliente
              </Link>

              <div className="h-px bg-white/5 my-4" />

              {/* Secciones según provider_type */}
              {profile.provider_type === "club" && (
                <>
                  <Link href="/dashboard/provider/clubs" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium cursor-pointer">
                    <Building2 className="w-5 h-5 text-primary-400" />
                    Mis Discotecas
                  </Link>
                  <Link href="/dashboard/provider/tables" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium cursor-pointer">
                    <Sliders className="w-5 h-5 text-primary-400" />
                    Control de Mesas
                  </Link>
                  <Link href="/dashboard/provider/orders" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium cursor-pointer">
                    <ShoppingBag className="w-5 h-5 text-primary-400" />
                    Pedidos en Vivo
                  </Link>
                  <Link href="/dashboard/provider/scanner" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium cursor-pointer">
                    <QrCode className="w-5 h-5 text-primary-400" />
                    Validar Accesos
                  </Link>
                  <Link href="/dashboard/provider/new-event" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium cursor-pointer">
                    <Calendar className="w-5 h-5 text-primary-400" />
                    Crear Evento
                  </Link>
                </>
              )}

              {profile.provider_type === "event_organizer" && (
                <>
                  <Link 
                    href="/dashboard/provider?view=events" 
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors cursor-pointer ${
                      view === "events" ? "bg-white/10 text-primary-400" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Calendar className="w-5 h-5 text-primary-400" />
                    Mis Eventos
                  </Link>
                  <Link 
                    href="/dashboard/provider?view=tickets" 
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors cursor-pointer ${
                      view === "tickets" ? "bg-white/10 text-primary-400" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Ticket className="w-5 h-5 text-primary-400" />
                    Entradas
                  </Link>
                  <Link href="/dashboard/provider/scanner" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium cursor-pointer">
                    <QrCode className="w-5 h-5 text-primary-400" />
                    Validar Accesos
                  </Link>
                  <Link 
                    href="/dashboard/provider?view=attendees" 
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors cursor-pointer ${
                      view === "attendees" ? "bg-white/10 text-primary-400" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Users className="w-5 h-5 text-primary-400" />
                    Asistentes
                  </Link>
                  <Link 
                    href="/dashboard/provider?view=sales" 
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors cursor-pointer ${
                      view === "sales" ? "bg-white/10 text-primary-400" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <DollarSign className="w-5 h-5 text-primary-400" />
                    Ventas
                  </Link>
                </>
              )}

              {profile.provider_type === "service_provider" && (
                <>
                  <Link 
                    href="/dashboard/provider?view=services" 
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors cursor-pointer ${
                      view === "services" ? "bg-white/10 text-primary-400" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Sparkles className="w-5 h-5 text-primary-400" />
                    Mis Servicios
                  </Link>
                  <Link 
                    href="/dashboard/provider?view=requests" 
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors cursor-pointer ${
                      view === "requests" ? "bg-white/10 text-primary-400" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Bell className="w-5 h-5 text-primary-400" />
                    Solicitudes
                  </Link>
                  <Link 
                    href="/dashboard/provider?view=bookings" 
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors cursor-pointer ${
                      view === "bookings" ? "bg-white/10 text-primary-400" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Calendar className="w-5 h-5 text-primary-400" />
                    Reservas
                  </Link>
                  <Link 
                    href="/dashboard/provider?view=calendar" 
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors cursor-pointer ${
                      view === "calendar" ? "bg-white/10 text-primary-400" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <CalendarDays className="w-5 h-5 text-primary-400" />
                    Calendario
                  </Link>
                </>
              )}

              <div className="h-px bg-white/5 my-4" />

              <Link 
                href="/dashboard/user" 
                className="flex items-center justify-between gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-all font-medium cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <User className="w-5 h-5" />
                  Vista de Cliente
                </span>
                <ArrowRight className="w-4 h-4 text-zinc-500" />
              </Link>
              <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium cursor-pointer">
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
          {view !== "client" ? (
            // ====================================================
            // BUSINESS VIEWS (PROVIDER PANEL)
            // ====================================================
            <>
              {/* Header dinámico por tipo de proveedor y vista */}
              <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-zinc-950/40 p-6 rounded-2xl border border-white/5">
                <div>
                  <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                    <h1 className="text-2xl font-bold font-outfit text-white">
                      {profile.provider_type === "club" && "Panel de Discoteca"}
                      {profile.provider_type === "event_organizer" && "Panel de Organización"}
                      {profile.provider_type === "service_provider" && "Panel de Servicios"}
                      {!profile.provider_type && "Panel de Proveedor"}
                      {" "}
                      {view === "events" && "• Eventos"}
                      {view === "tickets" && "• Entradas"}
                      {view === "attendees" && "• Asistentes"}
                      {view === "sales" && "• Reporte de Ventas"}
                      {view === "services" && "• Servicios"}
                      {view === "requests" && "• Solicitudes"}
                      {view === "bookings" && "• Reservas"}
                      {view === "calendar" && "• Calendario de Actividades"}
                    </h1>
                    {activeProfile.city && activeProfile.city !== "No especificada" && (
                      <div className="flex items-center gap-1 text-zinc-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-xs font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                        <span>{activeProfile.city}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400">
                    {profile.provider_type === "club" && "Administra tu discoteca, controla mesas, atiende pedidos y valida accesos."}
                    {profile.provider_type === "event_organizer" && "Publica eventos oficiales, vende entradas, gestiona asistentes y analiza ventas."}
                    {profile.provider_type === "service_provider" && "Ofrece servicios de sonido, luces, animación o barra y gestiona reservas de clientes."}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
                  {/* Validar Accesos (solo club y event_organizer) */}
                  {(profile.provider_type === "club" || profile.provider_type === "event_organizer") && (
                    <Link href="/dashboard/provider/scanner" className="bg-primary-600 hover:bg-primary-500 text-white px-4.5 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center gap-1.5 cursor-pointer text-xs justify-center shrink-0 shadow-md hover:shadow-primary-500/15 transform hover:scale-[1.02] active:scale-[0.98]">
                      <QrCode className="w-3.5 h-3.5 shrink-0 text-white" />
                      Validar Accesos
                    </Link>
                  )}

                  {/* Acciones de creación */}
                  <div className="flex gap-2.5">
                    {profile.provider_type === "service_provider" && (
                      <Link href="/dashboard/provider/new-service" className="bg-zinc-900/60 border border-primary-500/20 hover:border-primary-500/50 hover:bg-primary-950/20 text-zinc-300 hover:text-white px-4.5 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center gap-1.5 cursor-pointer text-xs justify-center flex-grow sm:flex-none shadow-md hover:shadow-primary-500/10 transform hover:scale-[1.02] active:scale-[0.98]">
                        <Plus className="w-3.5 h-3.5 shrink-0 text-primary-400" />
                        Nuevo Servicio
                      </Link>
                    )}
                    {(profile.provider_type === "club" || profile.provider_type === "event_organizer") && (
                      <Link href="/dashboard/provider/new-event" className="bg-zinc-900/60 border border-primary-500/20 hover:border-primary-500/50 hover:bg-primary-950/20 text-zinc-300 hover:text-white px-4.5 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center gap-1.5 cursor-pointer text-xs justify-center flex-grow sm:flex-none shadow-md hover:shadow-primary-500/10 transform hover:scale-[1.02] active:scale-[0.98]">
                        <Plus className="w-3.5 h-3.5 shrink-0 text-primary-400" />
                        Crear Evento
                      </Link>
                    )}
                  </div>
                </div>
              </header>

              {/* Profile Summary Card (solo en la vista principal) */}
              {view === "provider" && (
                <div className="glass-card p-6 bg-gradient-to-r from-primary-950/20 to-transparent flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-400">Presentación / Biografía</h3>
                    <div className="text-sm text-zinc-300 space-y-1">
                      <p><span className="text-zinc-500">Nombre de Proveedor:</span> {activeProfile.full_name || "No especificado"}</p>
                      <p><span className="text-zinc-500">Usuario:</span> @{displayUsername}</p>
                      <p><span className="text-zinc-500">Tipo de Negocio:</span> <span className="capitalize text-primary-300 font-semibold">{profile.provider_type === "club" ? "Discoteca / Club" : profile.provider_type === "event_organizer" ? "Organizador de Eventos" : "Proveedor de Servicios"}</span></p>
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
              )}

              {/* CONTENIDO PRINCIPAL SEGÚN LA VISTA SELECCIONADA */}
              
              {/* VISTA GENERAL: PANEL DE NEGOCIO */}
              {view === "provider" && (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="glass-card p-6 border border-primary-500/20 hover:border-primary-500/30 transition-all duration-300 shadow-md hover:shadow-primary-500/5">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-zinc-400 font-medium text-sm">Ingresos Confirmados</h4>
                        <DollarSign className="w-5 h-5 text-primary-400" />
                      </div>
                      <p className="text-3xl font-bold font-outfit text-white">${formattedEarnings} COP</p>
                      <p className="text-xs text-primary-400 mt-2">Recaudado en reservas confirmadas</p>
                    </div>

                    {profile.provider_type === "club" && (
                      <div className="glass-card p-6 border border-white/5 hover:border-primary-500/20 transition-all duration-300 shadow-md hover:shadow-primary-500/5">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-zinc-400 font-medium text-sm">Discotecas Registradas</h4>
                          <Building2 className="w-5 h-5 text-primary-400" />
                        </div>
                        <p className="text-3xl font-bold font-outfit text-white">{clubsCount}</p>
                        <p className="text-xs text-zinc-400 mt-2">Establecimientos activos</p>
                      </div>
                    )}

                    {profile.provider_type === "event_organizer" && (
                      <div className="glass-card p-6 border border-white/5 hover:border-primary-500/20 transition-all duration-300 shadow-md hover:shadow-primary-500/5">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-zinc-400 font-medium text-sm">Eventos Activos</h4>
                          <Calendar className="w-5 h-5 text-primary-400" />
                        </div>
                        <p className="text-3xl font-bold font-outfit text-white">{eventsCount}</p>
                        <p className="text-xs text-zinc-400 mt-2">Publicados en el marketplace</p>
                      </div>
                    )}

                    {profile.provider_type === "service_provider" && (
                      <div className="glass-card p-6 border border-white/5 hover:border-primary-500/20 transition-all duration-300 shadow-md hover:shadow-primary-500/5">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-zinc-400 font-medium text-sm">Servicios Activos</h4>
                          <Settings className="w-5 h-5 text-primary-400" />
                        </div>
                        <p className="text-3xl font-bold font-outfit text-white">{servicesCount}</p>
                        <p className="text-xs text-zinc-400 mt-2">Listados en el catálogo</p>
                      </div>
                    )}

                    <div className="glass-card p-6 border border-white/5 hover:border-primary-500/20 transition-all duration-300 shadow-md hover:shadow-primary-500/5">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-zinc-400 font-medium text-sm">Total Reservas</h4>
                        <Calendar className="w-5 h-5 text-primary-400" />
                      </div>
                      <p className="text-3xl font-bold font-outfit text-white">{bookingsCount}</p>
                      <p className="text-xs text-zinc-400 mt-2">{pendingBookingsCount} pendientes de respuesta</p>
                    </div>
                  </div>

                  {/* Sección intermedia específica */}
                  {profile.provider_type === "club" && (
                    <div className="glass-card p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                          Mis Discotecas
                          <span className="bg-primary-650/20 border border-primary-500/20 text-primary-300 text-xs px-2 py-0.5 rounded-full">
                            {clubsCount}
                          </span>
                        </h2>
                        <Link href="/dashboard/provider/clubs" className="text-xs text-primary-400 hover:text-primary-300 font-semibold transition-colors flex items-center gap-1 cursor-pointer">
                          Ver locales ➔
                        </Link>
                      </div>
                      {clubs.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {clubs.map((club) => (
                            <div key={club.id} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                              <div className="flex items-center gap-3">
                                {club.logo ? (
                                  <img src={club.logo} alt={club.name} className="w-10 h-10 rounded-lg object-cover" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold shrink-0">
                                    {club.name[0]}
                                  </div>
                                )}
                                <div>
                                  <h4 className="font-semibold text-white text-sm">{club.name}</h4>
                                  <p className="text-xs text-zinc-400">{club.city || "Ciudad no especificada"}</p>
                                </div>
                              </div>
                              <Link href={`/dashboard/provider/clubs/${club.id}`} className="text-xs text-primary-400 hover:underline">
                                Gestionar
                              </Link>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-zinc-500 text-sm">
                          No tienes discotecas registradas.
                        </div>
                      )}
                    </div>
                  )}

                  {profile.provider_type === "event_organizer" && (
                    <div className="glass-card p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                          Mis Eventos
                          <span className="bg-primary-650/20 border border-primary-500/20 text-primary-300 text-xs px-2 py-0.5 rounded-full">
                            {eventsCount}
                          </span>
                        </h2>
                        <Link href="/dashboard/provider?view=events" className="text-xs text-primary-400 hover:text-primary-300 font-semibold transition-colors flex items-center gap-1 cursor-pointer">
                          Administrar todos ➔
                        </Link>
                      </div>
                      {providerEvents.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {providerEvents.map((event) => (
                            <div key={event.id} className="flex flex-col p-4 bg-black/40 rounded-xl border border-white/5 justify-between">
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-center gap-3">
                                  {event.image_url ? (
                                    <img src={event.image_url} alt={event.title} className="w-12 h-12 rounded-lg object-cover" />
                                  ) : (
                                    <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold shrink-0">
                                      🎉
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="font-semibold text-white text-sm line-clamp-1">{event.title}</h4>
                                    <p className="text-xs text-zinc-400">{new Date(event.event_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                  </div>
                                </div>
                                <span className="bg-primary-500/10 text-primary-300 border border-primary-500/20 text-[10px] px-2 py-0.5 rounded-full">
                                  ${Number(event.ticket_price).toLocaleString("es-CO")}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{event.city || "Ubicación"}</span>
                                <Link href={`/events/${event.id}`} className="text-xs text-primary-400 hover:underline">
                                  Ver público ➔
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-zinc-500 text-sm">
                          No tienes eventos creados.
                        </div>
                      )}
                    </div>
                  )}

                  {profile.provider_type === "service_provider" && (
                    <div className="glass-card p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                          Mis Servicios
                          <span className="bg-primary-650/20 border border-primary-500/20 text-primary-300 text-xs px-2 py-0.5 rounded-full">
                            {servicesCount}
                          </span>
                        </h2>
                        <Link href="/dashboard/provider?view=services" className="text-xs text-primary-400 hover:text-primary-300 font-semibold transition-colors flex items-center gap-1 cursor-pointer">
                          Administrar todos ➔
                        </Link>
                      </div>
                      <ProviderServicesList services={services} />
                    </div>
                  )}

                  {/* Solicitudes y Reservas de Clientes */}
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                        Solicitudes y Reservas de Clientes
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
                            ? "No se pudieron obtener solicitudes de reserva de la base de datos."
                            : "No tienes solicitudes de reservas pendientes."}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* VISTA ESPECÍFICA: MIS EVENTOS */}
              {view === "events" && (
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                      Listado de Eventos
                      <span className="bg-primary-650/20 border border-primary-500/20 text-primary-300 text-xs px-2 py-0.5 rounded-full">
                        {eventsCount}
                      </span>
                    </h2>
                    <Link href="/dashboard/provider/new-event" className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer">
                      + Publicar Nuevo Evento
                    </Link>
                  </div>
                  {providerEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {providerEvents.map((event) => (
                        <div key={event.id} className="flex flex-col bg-zinc-950/60 rounded-2xl border border-white/5 overflow-hidden">
                          {event.image_url ? (
                            <img src={event.image_url} alt={event.title} className="w-full h-40 object-cover border-b border-white/5" />
                          ) : (
                            <div className="w-full h-40 bg-zinc-900 flex items-center justify-center text-zinc-500 text-3xl font-bold border-b border-white/5">
                              🎉
                            </div>
                          )}
                          <div className="p-5 flex-grow flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="bg-primary-500/10 text-primary-400 border border-primary-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                  {event.city || "Ciudad"}
                                </span>
                                <span className="text-sm font-semibold text-white">
                                  ${Number(event.ticket_price).toLocaleString("es-CO")} COP
                                </span>
                              </div>
                              <h3 className="font-bold text-white text-lg mb-2">{event.title}</h3>
                              {event.description && (
                                <p className="text-xs text-zinc-400 line-clamp-2 mb-4">{event.description}</p>
                              )}
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-zinc-500">
                              <span>📅 {new Date(event.event_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              <Link href={`/events/${event.id}`} className="text-primary-400 hover:text-primary-300 font-bold">
                                Ver público ➔
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-zinc-500">
                      No has creado ningún evento todavía. Haz clic en "Publicar Nuevo Evento" para empezar.
                    </div>
                  )}
                </div>
              )}

              {/* VISTAS ESPECÍFICAS: ENTRADAS / ASISTENTES / VENTAS / SOLICITUDES / RESERVAS */}
              {["tickets", "sales", "attendees", "requests", "bookings", "calendar"].includes(view) && (
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">
                      {view === "tickets" && "Control de Entradas Vendidas"}
                      {view === "sales" && "Registro de Ventas e Ingresos"}
                      {view === "attendees" && "Reporte de Asistentes Confirmados"}
                      {view === "requests" && "Solicitudes Pendientes de Confirmación"}
                      {view === "bookings" && "Listado Histórico de Reservas"}
                      {view === "calendar" && "Calendario / Próximas Fechas"}
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {normalizedBookings.length > 0 ? (
                      normalizedBookings
                        .filter((req: any) => {
                          if (view === "tickets") return !!req.event_id;
                          if (view === "requests") return req.status === "pending";
                          return true;
                        })
                        .map((req: any) => (
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
                                     {req.status === 'confirmed' ? 'confirmada' : req.status === 'completed' ? 'completada' : req.status === 'pending' ? 'pendiente' : 'cancelada'}
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
                      <div className="text-center py-6 text-zinc-500 text-sm">
                        No hay registros disponibles para mostrar en este reporte.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VISTA ESPECÍFICA: SERVICIOS */}
              {view === "services" && (
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                      Mis Servicios Ofrecidos
                      <span className="bg-primary-650/20 border border-primary-500/20 text-primary-300 text-xs px-2 py-0.5 rounded-full">
                        {servicesCount}
                      </span>
                    </h2>
                    <Link href="/dashboard/provider/new-service" className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer">
                      + Crear Servicio
                    </Link>
                  </div>
                  <ProviderServicesList services={services} />
                </div>
              )}
            </>
          ) : (
            // ====================================================
            // VIEW: CLIENT (PERSONAL USER ACTIVITY)
            // ====================================================
            <>
              <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold font-outfit text-white mb-1">Mi Actividad como Cliente</h1>
                  <p className="text-xs text-zinc-400">Tus entradas de eventos y reservas personales para salir de fiesta.</p>
                </div>
                {activeProfile.city && activeProfile.city !== "No especificada" && (
                  <div className="flex items-center gap-1.5 text-zinc-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                    <span>{activeProfile.city}</span>
                  </div>
                )}
              </header>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="glass-card p-6 border border-primary-500/20 hover:border-primary-500/30 transition-all duration-300 shadow-md hover:shadow-primary-500/5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-zinc-400 font-medium text-sm">Reservas Activas</h4>
                    <Calendar className="w-5 h-5 text-primary-400" />
                  </div>
                  <p className="text-3xl font-bold font-outfit text-white">{personalActiveBookingsCount}</p>
                  <p className="text-xs text-primary-400 mt-2">Listas para usar o en espera</p>
                </div>
                <div className="glass-card p-6 border border-white/5 hover:border-primary-500/20 transition-all duration-300 shadow-md hover:shadow-primary-500/5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-zinc-400 font-medium text-sm">Total Compras</h4>
                    <Clock className="w-5 h-5 text-primary-400" />
                  </div>
                  <p className="text-3xl font-bold font-outfit text-white">{personalBookingsCount}</p>
                  <p className="text-xs text-zinc-400 mt-2">Reservas y tickets históricos</p>
                </div>
                <div className="glass-card p-6 border border-white/5 hover:border-primary-500/20 transition-all duration-300 shadow-md hover:shadow-primary-500/5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-zinc-400 font-medium text-sm">Inversión Total</h4>
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-3xl font-bold font-outfit text-white">${formattedTotalSpent} COP</p>
                  <p className="text-xs text-zinc-400 mt-2">Total gastado en covers y eventos</p>
                </div>
              </div>

              {/* User Bookings Tabs */}
              <div className="glass-card p-6">
                <UserBookingsTabs initialBookings={normalizedPersonalBookings} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
