import { createClient } from "@/lib/supabase/server";
import { ClubBookingModal } from "@/components/discotecas/ClubBookingModal";
import { Sparkles, MapPin, Clock, ArrowLeft, Building2, Globe, Calendar, ShoppingBag, Eye } from "lucide-react";
import Link from "next/link";
import { ClubTabs } from "@/components/discotecas/ClubTabs";
import { FeaturedProducts } from "@/components/discotecas/FeaturedProducts";

export const revalidate = 0; // Dynamic route

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Local SVG icon to avoid version mismatch in lucide-react
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export default async function ClubDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch the specific club matching the slug
  const { data: club, error } = await supabase
    .from("clubs")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !club) {
    console.error("Error fetching club by slug:", error);
    
    // Custom Club Not Found page
    return (
      <div className="relative min-h-[75vh] w-full flex items-center justify-center py-12 px-4 md:px-6 container mx-auto bg-[#05050a]">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 glass-card max-w-md w-full p-10 text-center border-white/5 space-y-6 shadow-[0_0_50px_-12px_rgba(217,70,239,0.15)]">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center bg-red-500/10 border border-red-500/20 rounded-2xl">
            <Building2 className="w-8 h-8 text-red-400" />
            <div className="absolute -inset-1.5 bg-red-500/20 rounded-2xl blur opacity-30" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white font-outfit">Discoteca no encontrada</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Lo sentimos, la discoteca que estás buscando no existe o no está activa en nuestra plataforma en este momento.
            </p>
          </div>
          <div className="pt-2">
            <Link 
              href="/discotecas" 
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold px-6 py-3 rounded-xl transition-all glow cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver a Discotecas
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fetch menu items and services in parallel
  const [menuItemsRes, clubServicesRes] = await Promise.all([
    supabase
      .from("club_menu_items")
      .select("*")
      .eq("club_id", club.id)
      .eq("active", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("club_services")
      .select("*")
      .eq("club_id", club.id)
      .eq("active", true)
      .order("created_at", { ascending: true }),
  ]);

  const menuItems = menuItemsRes.data || [];
  const clubServices = clubServicesRes.data || [];

  // ==========================================
  // REAL STATS & METRICS FROM DATABASE
  // ==========================================

  // 1. VIP Reservations Count
  const { count: vipReservationsCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("club_id", club.id)
    .eq("booking_type", "club_vip");

  // 2. Covers Sold Count
  const { data: coverBookings } = await supabase
    .from("bookings")
    .select("number_of_people")
    .eq("club_id", club.id)
    .eq("booking_type", "club_cover");
  const coversSold = coverBookings?.reduce((sum, b) => sum + (b.number_of_people || 0), 0) || 0;

  // 3. Mesas Reservadas Count (Active ones)
  const { count: reservedTablesCount } = await supabase
    .from("club_tables")
    .select("id", { count: "exact", head: true })
    .eq("club_id", club.id)
    .eq("status", "Reservada")
    .eq("active", true);

  // 4. Pedidos Realizados Count
  const { data: sessionsWithOrders } = await supabase
    .from("live_sessions")
    .select(`
      id,
      live_orders (id)
    `)
    .eq("club_id", club.id);
  
  let totalOrdersCount = 0;
  if (sessionsWithOrders) {
    for (const sess of sessionsWithOrders) {
      if (Array.isArray(sess.live_orders)) {
        totalOrdersCount += sess.live_orders.length;
      }
    }
  }

  // ==========================================
  // LIVE OCCUPANCY CALCULATION
  // ==========================================
  const { data: openSessions } = await supabase
    .from("live_sessions")
    .select(`
      id,
      status,
      live_orders (id, status)
    `)
    .eq("club_id", club.id)
    .eq("status", "open");

  const activeSessionsCount = openSessions?.length || 0;
  let activeOrdersCount = 0;
  if (openSessions) {
    for (const sess of openSessions) {
      if (Array.isArray(sess.live_orders)) {
        const activeOrders = sess.live_orders.filter(
          (o: any) => o.status === "pending" || o.status === "preparing" || o.status === "ready"
        );
        activeOrdersCount += activeOrders.length;
      }
    }
  }

  // Determine Occupancy Level
  let occupancyText = "Baja ocupación";
  let occupancyColorClass = "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
  let occupancyDotClass = "bg-emerald-500";

  if (activeSessionsCount >= 3 && activeSessionsCount <= 7) {
    occupancyText = "Ocupación media";
    occupancyColorClass = "text-amber-400 border-amber-500/20 bg-amber-500/10";
    occupancyDotClass = "bg-amber-500";
  } else if (activeSessionsCount >= 8) {
    occupancyText = "Alta ocupación";
    occupancyColorClass = "text-red-400 border-red-500/20 bg-red-500/10";
    occupancyDotClass = "bg-red-500";
  }

  // ==========================================
  // ACTIVE SESSION FOR CURRENT USER
  // ==========================================
  let userActiveSession = null;
  if (user) {
    const { data: sessData } = await supabase
      .from("live_sessions")
      .select(`
        id,
        status,
        total_amount,
        table_id,
        club_tables (table_number),
        live_orders (id, status)
      `)
      .eq("club_id", club.id)
      .eq("user_id", user.id)
      .eq("status", "open")
      .maybeSingle();

    if (sessData) {
      const orders = sessData.live_orders || [];
      const nonCancelledOrders = orders.filter((o: any) => o.status !== "cancelled");
      userActiveSession = {
        id: sessData.id,
        tableNumber: (sessData.club_tables as any)?.table_number || "S/M",
        consumption: sessData.total_amount || 0,
        ordersCount: nonCancelledOrders.length,
      };
    }
  }

  // ==========================================
  // HANGOVER CONNECT ACCESS VALIDATION
  // ==========================================
  let hasConnectAccess = false;
  let connectBookingId = null;
  if (user) {
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
    const { data: validatedBookings } = await supabase
      .from("bookings")
      .select("id, qr_validated_at")
      .eq("club_id", club.id)
      .eq("user_id", user.id)
      .eq("status", "completed")
      .eq("qr_status", "used")
      .gt("qr_validated_at", eightHoursAgo);
    
    if (validatedBookings && validatedBookings.length > 0) {
      const activeBooking = validatedBookings.find(b => {
        if (!b.qr_validated_at) return false;
        const qrValidatedAt = new Date(b.qr_validated_at);
        const eightHoursLater = new Date(qrValidatedAt.getTime() + 8 * 60 * 60 * 1000);
        
        // 6:00 AM boundary logic: if validated after 6 AM, expires at 6 AM tomorrow.
        // If validated before 6 AM, expires at 6 AM today.
        const sixAmTodayOrTomorrow = new Date(qrValidatedAt);
        sixAmTodayOrTomorrow.setHours(6, 0, 0, 0);
        if (qrValidatedAt.getHours() >= 6) {
          sixAmTodayOrTomorrow.setDate(sixAmTodayOrTomorrow.getDate() + 1);
        }
        
        const expiresAt = Math.min(eightHoursLater.getTime(), sixAmTodayOrTomorrow.getTime());
        return Date.now() < expiresAt;
      });

      if (activeBooking) {
        hasConnectAccess = true;
        connectBookingId = activeBooking.id;
      }
    }
  }

  // ==========================================
  // UPCOMING EVENTS FOR THE CLUB
  // ==========================================
  let upcomingEvents = [];
  if (club.provider_id) {
    const todayStr = new Date().toISOString().split("T")[0];
    const { data: eventsData } = await supabase
      .from("events")
      .select("*")
      .eq("creator_id", club.provider_id)
      .gte("event_date", todayStr)
      .order("event_date", { ascending: true });
    upcomingEvents = eventsData || [];
  }

  // Coordinates Google Maps query
  const mapsSearchQuery = encodeURIComponent(`${club.name} ${club.address || ""} ${club.city}`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsSearchQuery}`;
  const instagramUrl = club.instagram ? `https://instagram.com/${club.instagram.replace("@", "")}` : null;
  // Fallback to provider or placeholder website link if none
  const websiteUrl = `https://hangover.co/discotecas/${club.slug}`;

  // Badges array for categorized hero
  const categories = ["🔥 Más Popular", "🎵 Reggaetón", "🍾 Premium Club"];

  return (
    <div className="relative min-h-screen w-full bg-[#05050a] text-zinc-100 pb-20 overflow-hidden">
      {/* Background Neon Ambient Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/3 left-10 w-96 h-96 bg-primary-950/20 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-1/3 right-10 w-96 h-96 bg-accent-950/20 rounded-full blur-[150px] mix-blend-screen" />
      </div>

      {/* ==========================================
          1. HERO PREMIUM
          ========================================== */}
      <section className="relative h-[55vh] md:h-[65vh] w-full bg-zinc-950 overflow-hidden">
        {club.banner_image ? (
          <img
            src={club.banner_image}
            alt={club.name}
            className="w-full h-full object-cover animate-fade-in"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-primary-950 via-zinc-900 to-accent-950 opacity-50" />
        )}
        
        {/* Deep dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#05050a] via-[#05050a]/40 to-black/55 z-10" />

        {/* Back Button */}
        <div className="absolute top-6 left-4 md:left-8 z-30">
          <Link
            href="/discotecas"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white transition-all shadow"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        {/* Hero Info Content Bottom Aligned */}
        <div className="absolute bottom-0 inset-x-0 z-20 pb-8 pt-20 px-4 md:px-8 container mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 max-w-2fr">
              {/* Category Badges */}
              <div className="flex flex-wrap gap-2">
                {categories.map((cat, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-[10px] font-bold uppercase tracking-wider text-primary-300 shadow-sm"
                  >
                    {cat}
                  </span>
                ))}
              </div>

              {/* Title & Info */}
              <div className="space-y-2">
                <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white font-outfit drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                  {club.name}
                </h1>
                <div className="flex items-center gap-2 text-zinc-300 text-sm">
                  <MapPin className="w-4 h-4 text-accent-400" />
                  <span className="font-semibold">{club.city}</span>
                  {club.address && (
                    <>
                      <span className="text-zinc-600">•</span>
                      <span className="text-zinc-400">{club.address}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Direct Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-bold px-4 py-2.5 transition-all cursor-pointer backdrop-blur shadow-md"
                >
                  📍 Cómo llegar
                </a>
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-bold px-4 py-2.5 transition-all cursor-pointer backdrop-blur shadow-md"
                  >
                    <InstagramIcon className="w-4 h-4 text-pink-400" />
                    <span>Instagram</span>
                  </a>
                )}
                {websiteUrl && (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-bold px-4 py-2.5 transition-all cursor-pointer backdrop-blur shadow-md"
                  >
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>Sitio web</span>
                  </a>
                )}
              </div>
            </div>

            {/* Occupancy Indicator Badge */}
            <div className="shrink-0 flex flex-col items-start md:items-end gap-1.5">
              <div className={`inline-flex items-center gap-2 border px-3.5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider ${occupancyColorClass} shadow-md`}>
                <span className={`w-2.5 h-2.5 rounded-full ${occupancyDotClass} animate-pulse`} />
                <span>{occupancyText}</span>
              </div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider text-left md:text-right px-1">
                🔥 {activeSessionsCount} mesas activas y {activeOrdersCount} comandas
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Info Grid */}
      <div className="container mx-auto px-4 md:px-8 relative z-20 mt-10">
        
        {/* ==========================================
            2. REAL STATS METRICS (SUPABASE)
            ========================================== */}
        {(vipReservationsCount || coversSold || reservedTablesCount || totalOrdersCount) ? (
          <section className="mb-12">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-4 font-outfit">Métricas de Operación Real</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* VIP bookings count */}
              {Boolean(vipReservationsCount) && (
                <div className="glass-card p-5 border-white/5 bg-zinc-950/40 hover:border-primary-500/15 transition-all">
                  <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Reservas VIP</span>
                  <span className="text-3xl font-black text-white mt-2 font-outfit block">{vipReservationsCount}</span>
                  <span className="text-[10px] text-zinc-400 mt-1 block">Mesa reservada confirmada</span>
                </div>
              )}
              {/* Covers sold count */}
              {Boolean(coversSold) && (
                <div className="glass-card p-5 border-white/5 bg-zinc-950/40 hover:border-primary-500/15 transition-all">
                  <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Covers vendidos</span>
                  <span className="text-3xl font-black text-emerald-400 mt-2 font-outfit block">{coversSold}</span>
                  <span className="text-[10px] text-zinc-400 mt-1 block">Accesos rápidos despachados</span>
                </div>
              )}
              {/* Mesas reservadas */}
              {Boolean(reservedTablesCount) && (
                <div className="glass-card p-5 border-white/5 bg-zinc-950/40 hover:border-primary-500/15 transition-all">
                  <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Mesas reservadas</span>
                  <span className="text-3xl font-black text-amber-400 mt-2 font-outfit block">{reservedTablesCount}</span>
                  <span className="text-[10px] text-zinc-400 mt-1 block">Espacios reservados en vivo</span>
                </div>
              )}
              {/* Orders count */}
              {Boolean(totalOrdersCount) && (
                <div className="glass-card p-5 border-white/5 bg-zinc-950/40 hover:border-primary-500/15 transition-all">
                  <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Pedidos realizados</span>
                  <span className="text-3xl font-black text-primary-400 mt-2 font-outfit block">{totalOrdersCount}</span>
                  <span className="text-[10px] text-zinc-400 mt-1 block">Consumos procesados</span>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {/* Split Details & Sidebar Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,420px)] gap-10 items-start">
          
          {/* Left Column Content */}
          <div className="space-y-12">
            
            {/* ==========================================
                7. MESA ACTIVA (IF USER HAS OPEN SESSION)
                ========================================== */}
            {userActiveSession && (
              <div className="glass-card p-6 bg-gradient-to-r from-emerald-500/10 via-primary-500/5 to-transparent border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.08)] rounded-[28px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>Sesión de Mesa Activa</span>
                    </div>
                    <h3 className="text-2xl font-black text-white font-outfit">
                      Mesa {userActiveSession.tableNumber}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Consumo acumulado: <span className="text-emerald-400 font-bold font-outfit">${userActiveSession.consumption.toLocaleString("es-CO")} COP</span> • Pedidos despachados: <span className="text-white font-bold">{userActiveSession.ordersCount}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <Link
                      href={`/discotecas/${club.slug}/mi-cuenta`}
                      className="flex-1 sm:flex-none inline-flex justify-center items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver mi cuenta</span>
                    </Link>
                    <Link
                      href={`/discotecas/${club.slug}/mi-cuenta`}
                      className="flex-1 sm:flex-none inline-flex justify-center items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 text-xs font-bold transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Ver pedidos</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                3. GALERÍA DE FOTOS (REAL ONLY)
                ========================================== */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-white font-outfit">📸 Galería de la Discoteca</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Banner - Panoramic left block */}
                <div className="md:col-span-2 relative h-56 md:h-64 rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 group">
                  {club.banner_image ? (
                    <img
                      src={club.banner_image}
                      alt="Banner principal"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-600">
                      <span>No Banner Available</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-3 left-3 text-[10px] text-zinc-300 font-bold uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded-md">
                    Instalaciones
                  </span>
                </div>

                {/* Logo - Right details block */}
                <div className="relative h-56 md:h-64 rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 flex flex-col items-center justify-center p-6 group bg-gradient-to-b from-zinc-900 to-zinc-950">
                  <div className="w-24 h-24 rounded-3xl border border-white/10 bg-zinc-900 p-0.5 overflow-hidden shadow-lg mb-3">
                    {club.logo ? (
                      <img src={club.logo} alt="Logo" className="w-full h-full object-cover rounded-[20px]" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                        <Building2 className="w-10 h-10 text-zinc-700" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-black text-white text-xs uppercase tracking-widest text-center mt-1">
                    {club.name}
                  </h4>
                  <p className="text-[9px] text-zinc-500 font-semibold tracking-wider uppercase mt-0.5">
                    Logo Oficial
                  </p>
                </div>
              </div>
            </section>

            {/* ==========================================
                4. PRODUCTOS DESTACADOS
                ========================================== */}
            <FeaturedProducts clubId={club.id} menuItems={menuItems} />

            {/* ==========================================
                TABS SYSTEM (Left Side)
                ========================================== */}
            <div className="border-t border-white/5 pt-10">
              <ClubTabs
                clubId={club.id}
                clubSlug={club.slug}
                clubName={club.name}
                clubDescription={club.description}
                clubAddress={club.address}
                clubOpeningHours={club.opening_hours}
                clubInstagram={club.instagram}
                menuItems={menuItems}
                clubServices={clubServices}
                hasConnectAccess={hasConnectAccess}
                connectBookingId={connectBookingId}
                currentUser={user}
              />
            </div>

            {/* ==========================================
                5. EVENTOS PRÓXIMOS
                ========================================== */}
            <section className="space-y-6 border-t border-white/5 pt-10">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-400" />
                <h3 className="text-xl font-bold text-white font-outfit">Próximos Eventos</h3>
              </div>

              {upcomingEvents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {upcomingEvents.map((evt: any) => {
                    const formattedPrice = evt.ticket_price && Number(evt.ticket_price) > 0
                      ? `$${Number(evt.ticket_price).toLocaleString("es-CO")} COP`
                      : "Entrada Libre";

                    const evtDate = new Date(evt.event_date).toLocaleDateString("es-ES", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    });

                    return (
                      <div
                        key={evt.id}
                        className="glass-card bg-zinc-950/40 border border-white/5 hover:border-primary-500/10 rounded-2xl overflow-hidden flex flex-col justify-between"
                      >
                        {/* Event banner/image */}
                        <div className="w-full h-36 bg-zinc-900 relative">
                          {evt.image_url ? (
                            <img
                              src={evt.image_url}
                              alt={evt.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700">
                              <Calendar className="w-10 h-10" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-3 left-3 flex flex-col">
                            <span className="text-[9px] text-primary-300 font-bold uppercase tracking-wider">
                              Próximo Evento
                            </span>
                            <span className="text-[10px] text-white font-medium">
                              {evtDate}
                            </span>
                          </div>
                        </div>

                        {/* Event Details */}
                        <div className="p-4 flex-grow flex flex-col justify-between gap-4">
                          <div className="space-y-1">
                            <h4 className="font-bold text-white text-base font-outfit truncate">
                              {evt.title}
                            </h4>
                            {evt.description && (
                              <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                                {evt.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/5 mt-auto">
                            <div className="text-left">
                              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">
                                Ticket Cover
                              </span>
                              <span className="text-xs font-bold text-emerald-400 font-outfit block mt-0.5">
                                {formattedPrice}
                              </span>
                            </div>

                            <Link
                              href={`/events/${evt.id}`}
                              className="bg-primary-600 hover:bg-primary-500 text-white rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-primary-500/10"
                            >
                              Comprar Ticket
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 border border-white/5 bg-zinc-950/20 rounded-2xl">
                  <Calendar className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400 font-medium">No hay eventos programados</p>
                </div>
              )}
            </section>
          </div>

          {/* Right Column (Sidebar Booking Modal Widget) */}
          <div id="booking-widget" className="w-full xl:max-w-md xl:justify-self-end">
            <ClubBookingModal
              club={{
                id: club.id,
                name: club.name,
                provider_id: club.provider_id ?? null,
                cover_price: club.cover_price ?? 0.00,
              }}
              isAuthenticated={Boolean(user)}
              defaultClientName={
                user?.user_metadata?.full_name ||
                user?.user_metadata?.name ||
                user?.email?.split("@")[0] ||
                ""
              }
              menuItems={menuItems}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
