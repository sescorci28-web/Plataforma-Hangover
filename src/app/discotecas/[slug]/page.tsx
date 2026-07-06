import { createClient } from "@/lib/supabase/server";
import { ClubBookingModal } from "@/components/discotecas/ClubBookingModal";
import { Sparkles, MapPin, Clock, ArrowLeft, Building2, Globe, Calendar, ShoppingBag, Eye, Star } from "lucide-react";
import Link from "next/link";
import { ClubTabs } from "@/components/discotecas/ClubTabs";
import { FeaturedProducts } from "@/components/discotecas/FeaturedProducts";
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

  // Find featured video / image fallbacks
  const featuredVideo = 
    clubGalleryItems.find((item) => item.featured && item.media_type === "video") ||
    clubStories.find((item) => item.featured && item.media_type === "video");

  const featuredImage =
    clubGalleryItems.find((item) => item.featured && item.media_type === "image") ||
    clubStories.find((item) => item.featured && item.media_type === "image");

  const heroVideoUrl = featuredVideo?.url || null;
  const heroImageUrl = featuredImage?.url || club.banner_image || null;

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
      .in("status", ["COMPLETED", "completed"])
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

  // ==========================================
  // HANGOVER CONNECT REALTIME SOCIAL METRICS
  // ==========================================
  
  // 1. Usuarios activos en Connect (con presencia no expirada y última conexión en los últimos 15 min)
  const { count: activeConnectCount } = await supabase
    .from("connect_presence")
    .select("id", { count: "exact", head: true })
    .eq("club_id", club.id)
    .gt("expires_at", new Date().toISOString())
    .gt("last_seen_at", new Date(Date.now() - 15 * 60 * 1000).toISOString());

  // 2. Personas visibles en el local (con visibilidad = 'visible')
  const { count: visibleConnectCount } = await supabase
    .from("connect_presence")
    .select("id", { count: "exact", head: true })
    .eq("club_id", club.id)
    .eq("visibility", "visible")
    .gt("expires_at", new Date().toISOString())
    .gt("last_seen_at", new Date(Date.now() - 15 * 60 * 1000).toISOString());

  // 3. Nuevas conexiones hoy (chats creados vinculados a este local hoy)
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const { count: newConnectionsToday } = await supabase
    .from("connect_chats")
    .select("id", { count: "exact", head: true })
    .eq("club_id", club.id)
    .gte("created_at", todayStart.toISOString());

  // 4. Lista de asistentes visibles (los primeros 12 para mostrar sus fotos y estados en la UI)
  const { data: rawAttendees } = await supabase
    .from("connect_presence")
    .select("id, status, check_in_at, user_id, user:profiles(full_name, avatar_url)")
    .eq("club_id", club.id)
    .eq("visibility", "visible")
    .gt("expires_at", new Date().toISOString())
    .gt("last_seen_at", new Date(Date.now() - 15 * 60 * 1000).toISOString())
    .order("check_in_at", { ascending: false })
    .limit(20);

  const connectAttendees = (rawAttendees as any[]) || [];

  // Verificar si hay evento hoy
  const nowColombia = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
  const todayStr = nowColombia.toISOString().split("T")[0]; // YYYY-MM-DD
  const hasEventToday = upcomingEvents.some((evt: any) => evt.event_date === todayStr);

  // Coordinates Google Maps query
  const mapsSearchQuery = encodeURIComponent(`${club.name} ${club.address || ""} ${club.city}`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsSearchQuery}`;
  const instagramUrl = club.instagram ? `https://instagram.com/${club.instagram.replace("@", "")}` : null;
  // Fallback to provider or placeholder website link if none
  const websiteUrl = `https://hangover.co/discotecas/${club.slug}`;

  // Badges array for categorized hero
  const categories = ["🔥 Más Popular", "🎵 Reggaetón", "🍾 Premium Club"];
  const isOpen = !!club.active;

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
        {heroVideoUrl ? (
          <video
            src={heroVideoUrl}
            poster={heroImageUrl || undefined}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover animate-fade-in"
          />
        ) : heroImageUrl ? (
          <img
            src={heroImageUrl}
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
          <div className="max-w-4xl mx-auto space-y-5">
            {/* Title & Info */}
            <div className="space-y-3">
              <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white font-outfit drop-shadow-[0_4px_20px_rgba(0,0,0,0.65)]">
                {club.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-zinc-350 text-sm font-semibold">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4.5 h-4.5 text-accent-400" />
                  <span>{club.city}</span>
                </div>
                {club.address && (
                  <>
                    <span className="text-zinc-650">•</span>
                    <span className="text-zinc-400">{club.address}</span>
                  </>
                )}
              </div>
            </div>

            {/* Estado Principal */}
            <div className="flex flex-wrap items-center gap-2">
              {/* 1. Verificado */}
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest text-blue-400 shadow-sm">
                ⭐ Verificado
              </span>

              {/* 2. Abierto / Cerrado */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                isOpen 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-zinc-800 border-zinc-700 text-zinc-500"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`} />
                <span>{isOpen ? "Abierto ahora" : "Cerrado"}</span>
              </span>
            </div>

            {/* Datos Secundarios */}
            <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-zinc-300 text-sm font-semibold pt-1">
              {/* Calificación */}
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-white font-bold">{Number(club.rating || 5.0).toFixed(1)}</span>
              </div>
              
              <span className="text-zinc-700">•</span>

              {/* Connect Activo */}
              <div className="flex items-center gap-1.5 text-purple-400">
                <span>👥</span>
                <span>Connect activo ({visibleConnectCount || 0})</span>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="pt-3">
              <ClubHeroActions
                clubId={club.id}
                clubSlug={club.slug}
                clubName={club.name}
                instagramUrl={instagramUrl}
                mapsUrl={mapsUrl}
              />
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
            clubStories={clubStories}
            clubLogo={club.logo}
            clubBannerImage={club.banner_image}
            hasConnectAccess={hasConnectAccess}
            connectBookingId={connectBookingId}
            currentUser={user}
            connectStats={{
              activeConnectCount: activeConnectCount || 0,
              visibleConnectCount: visibleConnectCount || 0,
              newConnectionsToday: newConnectionsToday || 0,
              activeSessionsCount: activeSessionsCount || 0,
              activeOrdersCount: activeOrdersCount || 0
            }}
            connectAttendees={connectAttendees}
            clubAmenities={club.amenities || []}
          />
        </div>
      </div>
    </div>
  );
}
