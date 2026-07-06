import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { 
  Calendar, MapPin, Sparkles, ArrowLeft, ShieldCheck, Ticket, Users, 
  Clock, Flame, Shirt, ShieldAlert, Navigation, ChevronRight, Heart,
  Info, Image as ImageIcon, Volume2, UserCheck, MessageSquare, HelpCircle,
  Sofa, Star
} from "lucide-react";
import Link from "next/link";
import { EventDetailActions } from "@/components/events/EventDetailActions";
import { EventCountdown } from "@/components/events/EventCountdown";
import { EventClientInteractive } from "@/components/events/EventClientInteractive";
import { slugify, getEventImage, getEventBadges } from "@/lib/event-utils";
import { EventTabs } from "@/components/events/EventTabs";
import { EventAttendeeSidebar } from "@/components/events/EventAttendeeSidebar";
import { EventGallery } from "@/components/events/EventGallery";
import { getEventAttendees, getEventLineup } from "@/app/events/actions";

export const revalidate = 0; // Dynamic route

interface EventDetailPageProps {
  params: Promise<{
    id: string; // Resolves UUID or slugified title from URL
  }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id: identifier } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Try parsing identifier as UUID or fallback to text slugs
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);

  let event = null;

  if (isUUID) {
    const { data } = await supabase
      .from("events")
      .select(`
        *,
        creator:profiles!events_creator_id_fkey (
          id,
          full_name,
          city,
          bio,
          avatar_url,
          social_instagram,
          social_tiktok
        )
      `)
      .eq("id", identifier)
      .single();
    event = data;
  }

  // If not found by UUID, scan all events and match by slugified title
  if (!event) {
    const { data: allEvents } = await supabase
      .from("events")
      .select(`
        *,
        creator:profiles!events_creator_id_fkey (
          id,
          full_name,
          city,
          bio,
          avatar_url,
          social_instagram,
          social_tiktok
        )
      `);

    if (allEvents) {
      event = allEvents.find((e) => slugify(e.title) === identifier) || null;
    }
  }

  if (!event) {
    console.error("Could not find event with identifier:", identifier);
    notFound();
  }

  // Fetch confirmed bookings count for this event to get the actual attendee count
  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event.id);

  const attendeeCount = count || 0;
  
  // Use event capacity if configured, fallback to 350
  const capacity = (event as any).capacity ?? 350;
  const percentSold = Math.min(Math.round((attendeeCount / capacity) * 100), 100);
  const remainingTickets = Math.max(capacity - attendeeCount, 0);

  // Fetch total events count for this organizer
  let organizerEventsCount = 1;
  try {
    const { count: orgCount } = await supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", event.creator_id);
    organizerEventsCount = orgCount || 1;
  } catch (e) {
    organizerEventsCount = 3;
  }

  // Fetch attendees list dynamically
  const attendeesRes = await getEventAttendees(event.id);
  const attendeeList = attendeesRes.success ? attendeesRes.attendees : [];

  // Fetch event lineup dynamically
  const lineupRes = await getEventLineup(event.id);
  const lineupList = lineupRes.success ? lineupRes.lineup : [];

  // ==========================================
  // HANGOVER CONNECT ACCESS VALIDATION
  // ==========================================
  let hasConnectAccess = false;
  let connectBookingId = null;
  if (user) {
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
    const { data: validatedBookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("event_id", event.id)
      .eq("user_id", user.id)
      .in("status", ["COMPLETED", "completed"])
      .eq("qr_status", "used")
      .gt("qr_validated_at", eightHoursAgo);
    
    if (validatedBookings && validatedBookings.length > 0) {
      hasConnectAccess = true;
      connectBookingId = validatedBookings[0].id;
    }
  }

  // Parse date formatting
  const eventDateObj = new Date(event.event_date);
  const formattedDate = eventDateObj.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const openTime = event.opening_time 
    ? `${event.opening_time} HS` 
    : eventDateObj.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) + " HS";
  
  const closeTime = event.closing_time 
    ? `${event.closing_time} HS` 
    : new Date(eventDateObj.getTime() + 6 * 60 * 60 * 1000).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) + " HS";

  const dressCode = event.dress_code || "Casual Premium";
  
  const minAge = event.min_age !== undefined && event.min_age !== null
    ? (event.min_age === 0 ? "Todo Público" : `Exclusivo +${event.min_age} años (DNI Requerido)`)
    : "Mayores de 18 años (+18)";

  const category = event.category || "Fiesta";

  const creator = event.creator;
  const creatorName = (Array.isArray(creator) ? creator[0]?.full_name : (creator as any)?.full_name) || "Organizador Hangover";
  const city = (Array.isArray(creator) ? creator[0]?.city : (creator as any)?.city) || "Barranquilla";
  const creatorBio = (Array.isArray(creator) ? creator[0]?.bio : (creator as any)?.bio) || "Organizador oficial registrado en Hangover. Comprometidos con traer la mejor experiencia nocturna y festivales.";
  const creatorAvatar = (Array.isArray(creator) ? creator[0]?.avatar_url : (creator as any)?.avatar_url) || null;
  const creatorInstagram = (Array.isArray(creator) ? creator[0]?.social_instagram : (creator as any)?.social_instagram) || null;
  const creatorTiktok = (Array.isArray(creator) ? creator[0]?.social_tiktok : (creator as any)?.social_tiktok) || null;

  // Get dynamic badges
  (event as any).attendeeCount = attendeeCount;
  const badges = getEventBadges(event as any, 0);
  if (percentSold >= 90) {
    badges.unshift({
      text: "💯 Casi Agotado",
      className: "bg-gradient-to-r from-red-500 via-rose-600 to-pink-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)] border-none"
    });
  } else if (percentSold >= 70) {
    badges.unshift({
      text: "⭐ Muy Popular",
      className: "bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.5)] border-none"
    });
  } else if (new Date(event.created_at).getTime() > Date.now() - 3 * 24 * 60 * 60 * 1000) {
    badges.unshift({
      text: "🚀 Nuevo",
      className: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)] border-none"
    });
  } else {
    badges.unshift({
      text: "🎉 Destacado",
      className: "bg-gradient-to-r from-purple-600 via-primary-600 to-pink-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)] border-none"
    });
  }

  // Fetch ticket batches safely
  let ticketBatches: any[] = [];
  try {
    const { data: batchesData, error: batchesError } = await supabase
      .from("event_ticket_batches")
      .select("*")
      .eq("event_id", event.id)
      .order("price", { ascending: true });
    
    if (!batchesError && batchesData && batchesData.length > 0) {
      ticketBatches = batchesData;
    } else {
      ticketBatches = [
        {
          id: "early-bird",
          name: "🎟️ Preventa Early Bird",
          price: Math.round(event.ticket_price * 0.8) || 35000,
          capacity: Math.round(capacity * 0.15),
          sold_count: Math.round(capacity * 0.15),
          status: "sold_out"
        },
        {
          id: "general-stage-1",
          name: "⚡ General - Etapa 1",
          price: event.ticket_price || 45000,
          capacity: Math.round(capacity * 0.55),
          sold_count: Math.min(attendeeCount, Math.round(capacity * 0.55)),
          status: attendeeCount >= Math.round(capacity * 0.55) ? "sold_out" : "active"
        },
        {
          id: "vip-stage-1",
          name: "👑 VIP Zone & Exclusive Lounge",
          price: Math.round(event.ticket_price * 2.2) || 95000,
          capacity: Math.round(capacity * 0.3),
          sold_count: Math.min(Math.max(0, attendeeCount - Math.round(capacity * 0.55)), Math.round(capacity * 0.3)),
          status: "active"
        }
      ];
    }
  } catch (err) {
    ticketBatches = [
      {
        id: "early-bird",
        name: "🎟️ Preventa Early Bird",
        price: Math.round(event.ticket_price * 0.8) || 35000,
        capacity: Math.round(capacity * 0.15),
        sold_count: Math.round(capacity * 0.15),
        status: "sold_out"
      },
      {
        id: "general-stage-1",
        name: "⚡ General - Etapa 1",
        price: event.ticket_price || 45000,
        capacity: Math.round(capacity * 0.55),
        sold_count: Math.min(attendeeCount, Math.round(capacity * 0.55)),
        status: attendeeCount >= Math.round(capacity * 0.55) ? "sold_out" : "active"
      },
      {
        id: "vip-stage-1",
        name: "👑 VIP Zone & Exclusive Lounge",
        price: Math.round(event.ticket_price * 2.2) || 95000,
        capacity: Math.round(capacity * 0.3),
        sold_count: Math.min(Math.max(0, attendeeCount - Math.round(capacity * 0.55)), Math.round(capacity * 0.3)),
        status: "active"
      }
    ];
  }

  // Fetch active events from the same organizer
  const activeThreshold = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  let organizerEvents: any[] = [];
  try {
    const { data: orgEvents } = await supabase
      .from("events")
      .select(`
        *,
        creator:profiles!events_creator_id_fkey (
          full_name,
          city
        )
      `)
      .eq("creator_id", event.creator_id)
      .neq("id", event.id)
      .gte("event_date", activeThreshold)
      .limit(3);
    organizerEvents = orgEvents || [];
  } catch (err) {
    console.error("Failed to query organizer events:", err);
  }

  // Fetch related events (3 events, excluding current)
  const { data: relatedEventsData } = await supabase
    .from("events")
    .select(`
      *,
      creator:profiles!events_creator_id_fkey (
        full_name,
        city
      )
    `)
    .neq("id", event.id)
    .gte("event_date", activeThreshold)
    .order("event_date", { ascending: true })
    .limit(3);

  const relatedEventsIds = (relatedEventsData || []).map(e => e.id);
  const relatedBookingCounts: Record<string, number> = {};
  
  if (relatedEventsIds.length > 0) {
    const { data: relatedBookings } = await supabase
      .from("bookings")
      .select("event_id")
      .in("event_id", relatedEventsIds);
    if (relatedBookings) {
      relatedBookings.forEach((b) => {
        if (b.event_id) {
          relatedBookingCounts[b.event_id] = (relatedBookingCounts[b.event_id] || 0) + 1;
        }
      });
    }
  }

  const relatedEvents = (relatedEventsData || []).map(e => ({
    ...e,
    attendeeCount: relatedBookingCounts[e.id] || 0
  }));

  // Fetch event gallery items safely
  let galleryItems = [];
  try {
    const { data: galleryData, error: galleryError } = await supabase
      .from("event_gallery_items")
      .select("*")
      .eq("event_id", event.id)
      .order("display_order", { ascending: true });
    
    if (!galleryError && galleryData) {
      galleryItems = galleryData;
    }
  } catch (err) {
    console.error("Failed to query event_gallery_items:", err);
  }

  // Fetch event tables safely
  let eventTables: any[] = [];
  try {
    const { data: tablesData } = await supabase
      .from("event_tables")
      .select("*")
      .eq("event_id", event.id);
    eventTables = tablesData || [];
  } catch (err) {
    console.error("Failed to query event_tables:", err);
  }

  // Increment page views via RPC
  try {
    await supabase.rpc("increment_event_views", { event_id: event.id });
    (event as any).views = ((event as any).views || 0) + 1;
  } catch (err) {
    console.warn("Could not increment event views:", err);
  }

  // Fetch reviews for this event
  let eventReviews: any[] = [];
  try {
    const { data: reviewsData } = await supabase
      .from("event_reviews")
      .select(`
        *,
        user:profiles (
          full_name,
          avatar_url
        )
      `)
      .eq("event_id", event.id)
      .order("created_at", { ascending: false });
    eventReviews = reviewsData || [];
  } catch (err) {
    console.error("Failed to query event reviews:", err);
  }

  // Dynamic Popularity & Views calculation
  const viewsCount = (event as any).views ?? 0;
  const bookingsCount = attendeeCount || 0;
  const popularityScore = viewsCount + (bookingsCount * 10);
  
  let popularityLabel = "📈 Regular";
  if (popularityScore >= 150 || percentSold >= 70) {
    popularityLabel = "🔥 Trending";
  } else if (popularityScore >= 50 || percentSold >= 30) {
    popularityLabel = "⚡ Alta";
  } else if (popularityScore >= 15 || percentSold >= 10) {
    popularityLabel = "✨ Creciente";
  }

  const formattedViews = viewsCount >= 1000 
    ? `${(viewsCount / 1000).toFixed(1)}K Vistas` 
    : `${viewsCount} Vistas`;

  // Static FAQ items
  const faqs = [
    { q: "¿Hay parqueadero disponible?", a: "Sí, el establecimiento cuenta con parqueadero privado vigilado y servicio de Valet Parking en la entrada principal." },
    { q: "¿Aceptan tarjetas de crédito y pagos digitales?", a: "Sí, se aceptan todas las tarjetas de crédito (Visa, MasterCard, Amex) y métodos de pago digital (Apple Pay, transferencias locales)." },
    { q: "¿Hay zonas exclusivas VIP?", a: "Sí, contamos con palcos VIP y zonas Lounge elevadas con servicio de mesero personalizado, botellas premium y acceso a baños exclusivos." },
    { q: "¿Existe restricción de edad para este evento?", a: "El evento es de ingreso exclusivo para mayores de edad (+18). Es obligatorio presentar documento de identidad físico (Cédula de Ciudadanía, pasaporte o licencia)." },
    { q: "¿Se permite el reingreso al recinto?", a: "Por políticas de seguridad del local, una vez valides tu código QR de entrada y salgas del establecimiento, no se permitirá el reingreso con el mismo ticket." }
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#020205] text-zinc-100 pb-28 md:pb-20 overflow-hidden font-sans">
      {/* Background Neon Ambient Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-10 w-[600px] h-[600px] bg-primary-950/15 rounded-full blur-[180px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-1/4 right-10 w-[600px] h-[600px] bg-accent-950/15 rounded-full blur-[180px] mix-blend-screen" />
      </div>

      {/* 1. HERO DE DETALLES */}
      <section className="relative h-[45vh] md:h-[55vh] w-full bg-zinc-950 overflow-hidden">
        <img
          src={getEventImage(event.image_url, event.id)}
          alt={event.title}
          className="w-full h-full object-cover scale-105 filter blur-[8px] opacity-35 absolute inset-0 z-0 select-none"
        />
        <div className="w-full h-full relative z-10 max-w-7xl mx-auto flex items-end px-4 sm:px-6 md:px-8 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[340px_1fr] gap-6 items-end w-full">
            {/* Poster Card */}
            <div className="hidden md:block rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.85)] aspect-[3/4]">
              <img
                src={getEventImage(event.image_url, event.id)}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Title / Meta */}
            <div className="space-y-4 text-left">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-500/20 border border-primary-500/35 text-[9px] font-extrabold uppercase tracking-wider text-primary-300">
                  <Sparkles className="w-3.5 h-3.5" /> {category}
                </span>
                {badges.map((badge, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${badge.className}`}
                  >
                    {badge.text}
                  </span>
                ))}
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white font-outfit leading-none bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-100 to-zinc-300">
                {event.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-400">
                <span className="font-semibold text-zinc-350">Organizado por {creatorName}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 hidden sm:inline" />
                <span className="capitalize">{formattedDate}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 hidden sm:inline" />
                <span>📍 {city}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dark overlay masks */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-black/60 z-1 pointer-events-none" />
        
        {/* Floating Back Navigation Button */}
        <div className="absolute top-6 left-4 md:left-8 z-30">
          <Link
            href="/events"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/70 backdrop-blur-md border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white transition-all shadow-lg hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Main Container Layout */}
      <div className="container mx-auto px-4 sm:px-6 md:px-8 mt-10 relative z-30">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,440px)] gap-8 items-start">
          
          {/* COLUMNA IZQUIERDA: CONTENIDOS DE LA LANDING PAGE */}
          <div className="space-y-12">
            
            {/* 2. CONTADOR REGRESIVO */}
            {((event as any).show_countdown ?? true) && (
              <div className="bg-zinc-950/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md shadow-xl text-center space-y-4">
                <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-extrabold block">La venta de tickets cierra en</span>
                <EventCountdown targetDate={event.event_date} variant="detailed" />
              </div>
            )}

            {/* REAL-TIME STATS GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {((event as any).show_statistics ?? true) && (
                <div className="bg-zinc-950/40 border border-white/5 p-4 rounded-2xl backdrop-blur-md flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400 shrink-0">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Popularidad</span>
                    <span className="text-xs sm:text-sm font-black text-white block">{popularityLabel}</span>
                  </div>
                </div>
              )}

              {((event as any).show_capacity ?? true) && (
                <div className="bg-zinc-950/40 border border-white/5 p-4 rounded-2xl backdrop-blur-md flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider block">Confirmados</span>
                    <span className="text-xs sm:text-sm font-black text-white block">{attendeeCount} Asistentes</span>
                  </div>
                </div>
              )}

              {((event as any).show_sales_progress ?? true) && (
                <div className="bg-zinc-950/40 border border-white/5 p-4 rounded-2xl backdrop-blur-md flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Ocupación</span>
                    <span className="text-xs sm:text-sm font-black text-white block">{percentSold}% Reservado</span>
                  </div>
                </div>
              )}

              {((event as any).show_statistics ?? true) && (
                <div className="bg-zinc-950/40 border border-white/5 p-4 rounded-2xl backdrop-blur-md flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Vistas</span>
                    <span className="text-xs sm:text-sm font-black text-white block">{formattedViews}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 3. GALERÍA DE FOTOS Y VIDEOS */}
            <div className="bg-zinc-950/30 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md">
              <EventGallery items={galleryItems} />
            </div>

            {/* 4. DESCRIPCIÓN COMPLETA */}
            <div className="bg-zinc-950/30 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-4">
              <h3 className="text-xs font-black text-primary-400 font-outfit uppercase tracking-widest flex items-center gap-1.5">
                <Info className="w-4.5 h-4.5" /> Sobre la Experiencia
              </h3>
              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed whitespace-pre-line font-medium">
                {event.description || "Prepárate para una producción de primer nivel. Este evento reúne los mejores espectáculos visuales y auditivos en un ambiente premium diseñado para complacer a los oídos más exigentes."}
              </p>
            </div>

            {/* 5. LINE-UP / ARTISTAS */}
            {lineupList.length > 0 && (
              <div className="bg-zinc-950/30 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6">
                <h3 className="text-xs font-black text-primary-400 font-outfit uppercase tracking-widest flex items-center gap-1.5">
                  <Users className="w-4.5 h-4.5" /> Line-Up & DJs Invitados
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {lineupList.map((artist: any) => (
                    <div key={artist.id} className="flex gap-4 p-4 bg-[#07070c]/80 border border-white/5 rounded-2xl">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
                        <img src={artist.image_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150"} alt={artist.artist_name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-white text-sm font-outfit truncate">{artist.artist_name}</h4>
                        <p className="text-[10px] text-primary-400 font-bold mt-0.5">{artist.performance_time}</p>
                        {artist.description && <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed mt-1">{artist.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. LUGAR Y 7. MAPA */}
            <div className="bg-zinc-950/30 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6">
              <h3 className="text-xs font-black text-primary-400 font-outfit uppercase tracking-widest flex items-center gap-1.5">
                <MapPin className="w-4.5 h-4.5" /> Ubicación del Recinto
              </h3>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-base font-outfit">{event.location}</h4>
                <p className="text-xs text-zinc-400">Lugar confirmado oficialmente. Revisa las coordenadas GPS para llegar directamente.</p>
              </div>

              {/* Satelital Map Preview */}
              <div className="relative h-48 w-full rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 flex items-center justify-center">
                <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:20px_20px]" />
                <div className="absolute w-3/4 h-0.5 bg-gradient-to-r from-primary-500/0 via-primary-500 to-rose-500/0 rotate-[25deg] blur-[1px]" />
                <div className="absolute flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-primary-650/30 border border-primary-500 flex items-center justify-center animate-ping absolute" />
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-500 to-primary-600 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.8)] relative z-10">
                    <MapPin className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/80 border border-white/5 rounded-lg text-[9px] font-bold text-zinc-400 uppercase tracking-wide">
                  Vista Satelital Nocturna
                </div>
              </div>

              <div className="flex gap-4">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center py-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/[0.07] hover:border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Navigation className="w-4 h-4" /> Google Maps
                </a>
                <a
                  href={`https://waze.com/ul?q=${encodeURIComponent(event.location)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center py-3 rounded-xl bg-primary-600/10 border border-primary-500/20 text-xs font-bold text-primary-300 hover:bg-primary-600/20 hover:border-primary-500/35 transition-all flex items-center justify-center gap-1.5"
                >
                  Waze GPS
                </a>
              </div>
            </div>

            {/* 8. ORGANIZADOR */}
            <div className="bg-zinc-950/30 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-5">
              <h3 className="text-xs font-black text-primary-400 font-outfit uppercase tracking-widest block">Anfitrión Autorizado</h3>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl border border-white/10 overflow-hidden bg-zinc-900 shrink-0 flex items-center justify-center">
                  {creatorAvatar ? (
                    <img src={creatorAvatar} alt={creatorName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-primary-600 to-rose-500 flex items-center justify-center text-white font-extrabold text-lg">
                      {creatorName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-white text-base truncate font-outfit">{creatorName}</h4>
                  <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                    <span>📍 {city}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span className="text-amber-400 font-bold">⭐ 4.9 ({organizerEventsCount} eventos)</span>
                  </p>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed italic">
                "{creatorBio}"
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                {creatorInstagram && (
                  <a
                    href={`https://instagram.com/${creatorInstagram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-center py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] font-bold text-zinc-300 hover:text-white hover:bg-white/[0.07] hover:border-white/10 transition-all cursor-pointer"
                  >
                    Instagram
                  </a>
                )}
                {creatorTiktok && (
                  <a
                    href={`https://tiktok.com/@${creatorTiktok.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-center py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] font-bold text-zinc-300 hover:text-white hover:bg-white/[0.07] hover:border-white/10 transition-all cursor-pointer"
                  >
                    TikTok
                  </a>
                )}
                <Link
                  href={`/services?provider=${encodeURIComponent(creatorName)}`}
                  className="flex-[1.5] text-center py-2.5 rounded-xl bg-primary-600/10 border border-primary-500/20 text-[11px] font-bold text-primary-300 hover:bg-primary-600/20 hover:border-primary-500/35 transition-all text-center"
                >
                  Ver Perfil y Servicios
                </Link>
              </div>
            </div>

            {/* 9. SERVICIOS Y AMENIDADES */}
            <div className="bg-zinc-950/30 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6">
              <h3 className="text-xs font-black text-primary-400 font-outfit uppercase tracking-widest block">Servicios y Restricciones</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex gap-3.5 p-4 rounded-2xl bg-[#07070c]/70 border border-white/5">
                  <Clock className="w-5 h-5 text-primary-450 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="text-zinc-500 font-bold uppercase tracking-wider">Horario de Ingreso</p>
                    <p className="font-semibold text-zinc-200 mt-0.5">{openTime} - {closeTime}</p>
                  </div>
                </div>

                <div className="flex gap-3.5 p-4 rounded-2xl bg-[#07070c]/70 border border-white/5">
                  <Shirt className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="text-zinc-500 font-bold uppercase tracking-wider">Código de Vestimenta</p>
                    <p className="font-semibold text-zinc-200 mt-0.5">{dressCode}</p>
                  </div>
                </div>

                <div className="flex gap-3.5 p-4 rounded-2xl bg-[#07070c]/70 border border-white/5">
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="text-zinc-500 font-bold uppercase tracking-wider">Límite de Edad</p>
                    <p className="font-semibold text-zinc-200 mt-0.5">{minAge}</p>
                  </div>
                </div>

                <div className="flex gap-3.5 p-4 rounded-2xl bg-[#07070c]/70 border border-white/5">
                  <ShieldCheck className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="text-zinc-500 font-bold uppercase tracking-wider">Políticas Generales</p>
                    <p className="font-semibold text-zinc-200 mt-0.5">Ingreso con DNI Físico Requerido</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-2">
                {event.is_free_entry && (
                  <div className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
                    <span>🆓</span> Entrada Libre
                  </div>
                )}
                {event.is_adults_only && (
                  <div className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400">
                    <span>🔞</span> Solo Adultos (+18)
                  </div>
                )}
                {event.has_parking && (
                  <div className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs font-bold text-sky-450">
                    <span>🚗</span> Parqueadero Vigilado
                  </div>
                )}
                {event.has_vip_zone && (
                  <div className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs font-bold text-violet-400">
                    <span>👑</span> Palcos y Mesas VIP
                  </div>
                )}
                {event.has_tables_module && (
                  <div className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400">
                    <span>🍾</span> Servicio de Botellas
                  </div>
                )}
              </div>
            </div>

            {/* 10. COMUNIDAD Y CHAT EN VIVO */}
            {(hasConnectAccess || user) && (
              <div className="bg-zinc-950/30 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6">
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-primary-400 font-outfit uppercase tracking-widest block">Comunidad y Chat en Vivo</h3>
                  <p className="text-xs text-zinc-400">Interactúa con otros asistentes de la fiesta en tiempo real.</p>
                </div>
                <EventTabs
                  eventId={event.id}
                  eventDescription={event.description}
                  eventLocation={event.location}
                  openTime={openTime}
                  closeTime={closeTime}
                  dressCode={dressCode}
                  minAge={minAge}
                  hasConnectAccess={hasConnectAccess}
                  connectBookingId={connectBookingId}
                  currentUser={user}
                  galleryItems={galleryItems}
                  creatorId={event.creator_id}
                  eventDate={event.event_date}
                  showChat={event.show_event_chat}
                  showCommunity={event.show_event_community}
                  variant="community-only"
                />
              </div>
            )}

            {/* 11. PREGUNTAS FRECUENTES (FAQs) */}
            <div className="bg-zinc-950/30 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6">
              <h3 className="text-xs font-black text-primary-400 font-outfit uppercase tracking-widest block">Preguntas Frecuentes</h3>
              <div className="space-y-3.5">
                {faqs.map((faq, idx) => (
                  <details key={idx} className="group border border-white/5 bg-[#07070c]/50 rounded-2xl overflow-hidden transition-all duration-300">
                    <summary className="flex items-center justify-between p-4 text-xs font-bold text-white cursor-pointer select-none list-none outline-none focus:text-primary-400">
                      <span>{faq.q}</span>
                      <ChevronRight className="w-4 h-4 text-zinc-500 group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="p-4 pt-0 text-xs text-zinc-400 leading-relaxed border-t border-white/[0.03]">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>

            {/* 12. COMENTARIOS Y RESEÑAS */}
            <div className="bg-zinc-950/30 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6">
              <h3 className="text-xs font-black text-primary-400 font-outfit uppercase tracking-widest block">Comentarios de la Comunidad</h3>
              
              {eventReviews.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-white/5 rounded-2xl text-xs text-zinc-500">
                  Aún no hay calificaciones o comentarios para este evento. ¡Sé el primero en dejar una reseña al asistir!
                </div>
              ) : (
                <div className="space-y-4">
                  {eventReviews.map((rev) => (
                    <div key={rev.id} className="p-4 bg-[#07070c]/70 border border-white/5 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden border border-white/10 shrink-0">
                            {rev.user?.avatar_url ? (
                              <img src={rev.user.avatar_url} alt={rev.user.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-zinc-400">U</div>
                            )}
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-white">{rev.user?.full_name || "Asistente Hangover"}</p>
                            <p className="text-[9px] text-zinc-500">{new Date(rev.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span className="text-[11px] font-bold">{rev.rating || 5.0}</span>
                        </div>
                      </div>
                      {rev.comment && <p className="text-xs text-zinc-350 leading-relaxed font-medium pl-10">"{rev.comment}"</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 13. EVENTOS DEL MISMO ORGANIZADOR */}
            {organizerEvents.length > 0 && (
              <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-white uppercase tracking-wider font-outfit">Más eventos de {creatorName}</h3>
                  <div className="h-px bg-white/10 flex-grow ml-4" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {organizerEvents.map((e) => (
                    <div key={e.id} className="glass-card overflow-hidden hover:border-white/20 transition-all duration-300 flex flex-col h-full bg-[#07070c]/90 group">
                      <div className="relative h-36 w-full bg-zinc-900 overflow-hidden">
                        <img
                          src={getEventImage(e.image_url, e.id)}
                          alt={e.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute top-3 right-3 bg-black/80 border border-white/10 px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-400">
                          {e.ticket_price > 0 ? `$${e.ticket_price.toLocaleString("es-CO")}` : "Gratis"}
                        </span>
                      </div>
                      <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                        <div>
                          <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-primary-400 transition-colors font-outfit">
                            <Link href={`/events/${slugify(e.title)}`}>{e.title}</Link>
                          </h4>
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5">📍 {e.location}</p>
                        </div>
                        <Link
                          href={`/events/${slugify(e.title)}`}
                          className="text-[10px] text-primary-400 font-bold shrink-0 hover:underline flex items-center justify-end gap-0.5"
                        >
                          Ver Detalles <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECCIÓN 14: FAVORITOS E INTERACTIVOS */}
            {((event as any).show_favorites ?? true) && (
              <EventClientInteractive
                eventId={event.id}
                eventTitle={event.title}
                eventDescription={event.description || ""}
              />
            )}

          </div>

          {/* COLUMNA DERECHA: SIDEBAR DE COMPRA STICKY (DESKTOP) */}
          <div className="sticky top-24 space-y-6">
            
            {/* PANEL DE COMPRA SIDEBAR CARD */}
            <EventAttendeeSidebar
              eventId={event.id}
              ticketPrice={event.ticket_price}
              initialAttendeeCount={attendeeCount}
              capacity={capacity}
              ticketBatches={ticketBatches}
              attendeeList={attendeeList}
              user={user}
              eventTables={eventTables}
              ticketCardTitle={(event as any).ticket_card_title ?? "Adquiere tus accesos"}
              ticketCardDescription={(event as any).ticket_card_description ?? "Tickets 100% autorizados del organizador directos al cliente."}
              showSalesProgress={(event as any).show_sales_progress ?? true}
              showCapacity={(event as any).show_capacity ?? true}
              showAttendees={(event as any).show_attendees ?? "all"}
              showTicketBatches={(event as any).show_ticket_batches ?? true}
              showRemainingTickets={(event as any).show_remaining_tickets ?? true}
              showWhoIsGoing={(event as any).show_who_is_going ?? true}
              eventType={(event as any).event_type ?? "tickets"}
              ticketingEnabled={(event as any).ticketing_enabled ?? true}
              showFavorites={(event as any).show_favorites ?? true}
            />

            {/* PRICE & ACTION CARD (COMPATIBILIDAD CON RESERVA/COMPRA DIRECTA) */}
            {event.ticketing_enabled && (
              <div className="glass-card w-full rounded-3xl border border-white/10 bg-[#09090f]/90 p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400 font-medium">Precio Total (Base)</span>
                  <span className="text-2xl font-black text-emerald-400 font-outfit">
                    {event.ticket_price > 0 ? `$${event.ticket_price.toLocaleString("es-CO")} COP` : "Gratis"}
                  </span>
                </div>
                <EventDetailActions
                  eventId={event.id}
                  eventDate={event.event_date}
                  ticketPrice={event.ticket_price}
                  isAuthenticated={Boolean(user)}
                  variant="default"
                />
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN 7: EVENTOS RELACIONADOS (TAMBIÉN TE PUEDE INTERESAR) */}
        {relatedEvents.length > 0 && (
          <div className="pt-16 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white uppercase tracking-wider font-outfit">También te puede interesar</h3>
              <div className="h-px bg-white/10 flex-grow ml-4" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedEvents.map((e) => {
                const eCreatorName = e.creator?.full_name || "Organizador Hangover";
                
                return (
                  <div key={e.id} className="glass-card overflow-hidden hover:border-white/20 transition-all duration-300 flex flex-col h-full bg-[#07070c]/90 group">
                    <div className="relative h-44 w-full bg-zinc-900 overflow-hidden">
                      <img
                        src={getEventImage(e.image_url, e.id)}
                        alt={e.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 right-3 bg-black/80 border border-white/10 px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-400">
                        {e.ticket_price > 0 ? `$${e.ticket_price.toLocaleString("es-CO")}` : "Gratis"}
                      </span>
                    </div>
                    <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                      <div className="space-y-1">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium block">Por {eCreatorName}</span>
                        <h4 className="font-bold text-white text-base line-clamp-1 group-hover:text-primary-400 transition-colors font-outfit">
                          <Link href={`/events/${slugify(e.title)}`}>{e.title}</Link>
                        </h4>
                        <p className="text-zinc-400 text-xs line-clamp-2 min-h-[32px]">
                          {e.description || "Prepárate para una noche de primer nivel en el mejor ambiente."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[10px] text-zinc-450">
                        <span className="truncate">📍 {e.location}</span>
                        <Link
                          href={`/events/${slugify(e.title)}`}
                          className="text-primary-400 font-bold shrink-0 hover:underline flex items-center gap-0.5"
                        >
                          Ver
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MOBILE FLOATING CTA BAR (MOBILE BOTTOM STICKY BAR) */}
      {event.ticketing_enabled && (
        <EventDetailActions
          eventId={event.id}
          eventDate={event.event_date}
          ticketPrice={event.ticket_price}
          isAuthenticated={Boolean(user)}
          variant="sticky-bar"
        />
      )}
    </div>
  );
}
