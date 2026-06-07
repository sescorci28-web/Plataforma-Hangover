import { createClient } from "@/lib/supabase/server";
import { ClubBookingModal } from "@/components/discotecas/ClubBookingModal";
import { Sparkles, MapPin, Clock, ArrowLeft, Building2, Globe, Calendar, ShoppingBag, Eye, Star } from "lucide-react";
import Link from "next/link";
import { ClubTabs } from "@/components/discotecas/ClubTabs";
import { FeaturedProducts } from "@/components/discotecas/FeaturedProducts";
import { StoriesGallery } from "@/components/discotecas/StoriesGallery";
import { ClubHeroActions } from "@/components/discotecas/ClubHeroActions";

function isClubOpen(openingHours: string | null): boolean {
  if (!openingHours) return false;

  const now = new Date();
  let colombiaDate: Date;
  try {
    const colombiaTime = now.toLocaleString("en-US", { timeZone: "America/Bogota" });
    colombiaDate = new Date(colombiaTime);
  } catch (e) {
    colombiaDate = now;
  }

  const day = colombiaDate.getDay();
  const hour = colombiaDate.getHours();
  const hoursLower = openingHours.toLowerCase();

  let isTargetDay = false;

  if (hoursLower.includes("lunes") || hoursLower.includes("lun")) {
    if (day === 1 || (day === 2 && hour < 6)) isTargetDay = true;
  }
  if (hoursLower.includes("martes") || hoursLower.includes("mar")) {
    if (day === 2 || (day === 3 && hour < 6)) isTargetDay = true;
  }
  if (hoursLower.includes("miércoles") || hoursLower.includes("mier") || hoursLower.includes("mié")) {
    if (day === 3 || (day === 4 && hour < 6)) isTargetDay = true;
  }
  if (hoursLower.includes("jueves") || hoursLower.includes("jue")) {
    if (day === 4 || (day === 5 && hour < 6)) isTargetDay = true;
  }
  if (hoursLower.includes("viernes") || hoursLower.includes("vier") || hoursLower.includes("vi")) {
    if (day === 5 || (day === 6 && hour < 6)) isTargetDay = true;
  }
  if (hoursLower.includes("sábado") || hoursLower.includes("sab") || hoursLower.includes("sáb")) {
    if (day === 6 || (day === 0 && hour < 6)) isTargetDay = true;
  }
  if (hoursLower.includes("domingo") || hoursLower.includes("dom")) {
    if (day === 0 || (day === 1 && hour < 6)) isTargetDay = true;
  }

  if (!isTargetDay && (hoursLower.includes("fin de semana") || hoursLower.includes("weekend"))) {
    if (day === 4 || day === 5 || day === 6 || day === 0 || (day === 1 && hour < 6)) {
      isTargetDay = true;
    }
  }

  if (!isTargetDay && !hoursLower.match(/(lunes|martes|miércoles|jueves|viernes|sábado|domingo|lun|mar|mie|jue|vie|sab|dom)/)) {
    if (day === 4 || day === 5 || day === 6 || (day === 0 && hour < 6)) {
      isTargetDay = true;
    }
  }

  const isNightHour = hour >= 20 || hour < 6;

  return isTargetDay && isNightHour;
}

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

  // Fetch menu items, services, tables, stories and gallery items in parallel
  const [menuItemsRes, clubServicesRes, clubTablesRes, clubStoriesRes, clubGalleryRes] = await Promise.all([
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
    supabase
      .from("club_tables")
      .select("id, table_number, zone, status, active")
      .eq("club_id", club.id)
      .eq("active", true)
      .order("table_number", { ascending: true }),
    supabase
      .from("club_stories")
      .select("*")
      .eq("club_id", club.id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("club_gallery_items")
      .select("*")
      .eq("club_id", club.id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
  ]);

  const menuItems = menuItemsRes.data || [];
  const clubServices = clubServicesRes.data || [];
  const clubTables = clubTablesRes.data || [];
  const clubStories = clubStoriesRes.data || [];
  const clubGalleryItems = clubGalleryRes.data || [];

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
  const isOpen = isClubOpen(club.opening_hours);

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
              {/* Status and Category Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {categories.map((cat, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-[10px] font-bold uppercase tracking-wider text-primary-300 shadow-sm"
                  >
                    {cat}
                  </span>
                ))}

                {/* Open/Closed Status */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border ${
                  isOpen 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                    : "bg-red-500/10 border-red-500/20 text-red-300"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-emerald-400" : "bg-red-400"}`} />
                  <span>{isOpen ? "Abierto" : "Cerrado"}</span>
                </span>

                {/* Rating Badge */}
                <div className="flex items-center gap-1 bg-black/45 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-amber-400 text-xs font-black">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{Number(club.rating || 5.0).toFixed(1)}</span>
                </div>
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

              {/* Action Buttons Row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
                <ClubHeroActions
                  clubId={club.id}
                  clubSlug={club.slug}
                  clubName={club.name}
                />

                <div className="flex flex-wrap gap-2">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 text-[11px] font-bold px-3 py-2 transition-all cursor-pointer backdrop-blur"
                  >
                    📍 Cómo llegar
                  </a>
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 text-[11px] font-bold px-3 py-2 transition-all cursor-pointer backdrop-blur"
                    >
                      <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
                      <span>Instagram</span>
                    </a>
                  )}
                </div>
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
        <div className="w-full max-w-4xl mx-auto space-y-12">
          
          {/* ==========================================
              2. TABS SYSTEM (STICKY)
              ========================================== */}
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
            clubTables={clubTables}
            clubProviderId={club.provider_id ?? null}
            clubCoverPrice={club.cover_price ?? 0.00}
            upcomingEvents={upcomingEvents}
            clubGalleryItems={clubGalleryItems}
            hasConnectAccess={hasConnectAccess}
            connectBookingId={connectBookingId}
            currentUser={user}
          />

          {/* ==========================================
              3. STORIES GALLERY
              ========================================== */}
          <div className="border-t border-white/5 pt-10">
            <StoriesGallery
              logo={club.logo}
              bannerImage={club.banner_image}
              clubName={club.name}
              stories={clubStories}
              isProvider={user?.id === club.provider_id}
            />
          </div>

          {/* ==========================================
              4. CARTA DESTACADA (FEATURED PRODUCTS)
              ========================================== */}
          <div className="border-t border-white/5 pt-10">
            <FeaturedProducts clubId={club.id} menuItems={menuItems} />
          </div>

          {/* ==========================================
              5. METRICAS DE OPERACION REAL (AT THE BOTTOM)
              ========================================== */}
          {(vipReservationsCount || coversSold || reservedTablesCount || totalOrdersCount) ? (
            <div className="border-t border-white/5 pt-10 pb-10">
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
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
