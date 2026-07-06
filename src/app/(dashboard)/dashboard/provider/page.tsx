import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BarChart3, Settings, Calendar, DollarSign, Plus, Bell, MapPin, User, LogOut, AlertTriangle, Building2, QrCode, Camera, ShoppingBag, Sliders, Ticket, Clock, CreditCard, Users, Sparkles, CalendarDays, ArrowRight } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import { BookingActions } from "@/components/provider/BookingActions";
import { ProviderServicesList } from "@/components/provider/ProviderServicesList";
import { UserBookingsTabs } from "@/components/dashboard/UserBookingsTabs";
import { EventTicketingManager } from "@/components/provider/EventTicketingManager";
import { ProviderBookingsManager } from "@/components/provider/ProviderBookingsManager";

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
      .select("id, title, description, price, category, subcategory, image_url, spotify_url, soundcloud_url, youtube_url")
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
      .select("id, event_date, event_time, reservation_date, total_amount, status, notes, user_id, club_id, club_slug, number_of_people, event_id, service_id, created_at, updated_at")
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
    const serviceIds = [...new Set(normalizedBookings.map((booking: any) => booking.service_id).filter(Boolean))];

    const [userProfilesResult, clubsResult, eventsResult, servicesResult] = await Promise.all([
      userIds.length
        ? supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", userIds)
        : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null; username: string | null; avatar_url: string | null }> }),
      clubIds.length
        ? supabase.from("clubs").select("id, name").in("id", clubIds)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
      eventIds.length
        ? supabase.from("events").select("id, title").in("id", eventIds)
        : Promise.resolve({ data: [] as Array<{ id: string; title: string }> }),
      serviceIds.length
        ? supabase.from("services").select("id, title").in("id", serviceIds)
        : Promise.resolve({ data: [] as Array<{ id: string; title: string }> }),
    ]);

    const userMap = new Map((userProfilesResult.data || []).map((item) => [item.id, item]));
    const clubMap = new Map((clubsResult.data || []).map((item) => [item.id, item]));
    const eventMap = new Map((eventsResult.data || []).map((item) => [item.id, item]));
    const serviceMap = new Map((servicesResult.data || []).map((item) => [item.id, item]));

    normalizedBookings = normalizedBookings.map((booking: any) => {
      const club = booking.club_id ? clubMap.get(booking.club_id) || null : null;
      const event = booking.event_id ? eventMap.get(booking.event_id) || null : null;
      const serviceObj = booking.service_id ? serviceMap.get(booking.service_id) || null : null;

      return {
        ...booking,
        user: booking.user_id ? userMap.get(booking.user_id) || null : null,
        club,
        event,
        service: serviceObj,
        title: event?.title || serviceObj?.title || club?.name || booking.club_slug || "Reserva de servicio",
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
    <div className="space-y-8 w-full">
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

              {/* VISTA ESPECÍFICA: BOLETERÍA DEL ORGANIZADOR */}
              {view === "tickets" && (
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      🎟️ Control de Boletería y Ventas
                    </h2>
                  </div>
                  <EventTicketingManager events={providerEvents} />
                </div>
              )}

              {/* VISTA ESPECÍFICA: CENTRO DE GESTIÓN DE RESERVAS / SOLICITUDES */}
              {["requests", "bookings"].includes(view) && (
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">
                      {view === "requests" ? "Solicitudes Pendientes de Confirmación" : "Centro de Gestión de Reservas"}
                    </h2>
                  </div>
                  <ProviderBookingsManager 
                    initialBookings={normalizedBookings} 
                    defaultTab={view === "requests" ? "pending" : "all"} 
                  />
                </div>
              )}

              {/* VISTAS ESPECÍFICAS: ASISTENTES / VENTAS / CALENDARIO */}
              {["sales", "attendees", "calendar"].includes(view) && (
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">
                      {view === "sales" && "Registro de Ventas e Ingresos"}
                      {view === "attendees" && "Reporte de Asistentes Confirmados"}
                      {view === "calendar" && "Calendario / Próximas Fechas"}
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {normalizedBookings.length > 0 ? (
                      normalizedBookings
                        .filter((req: any) => {
                          if (view === "tickets") return !!req.event_id;
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
  );
}
