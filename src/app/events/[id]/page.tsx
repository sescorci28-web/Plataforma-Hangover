import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Calendar, MapPin, Sparkles, ArrowLeft, ShieldCheck, Ticket, Users, Clock, Flame, Shirt, ShieldAlert, Navigation, ChevronRight, Heart } from "lucide-react";
import Link from "next/link";
import { EventDetailActions } from "@/components/events/EventDetailActions";
import { EventCountdown } from "@/components/events/EventCountdown";
import { EventClientInteractive } from "@/components/events/EventClientInteractive";
import { slugify, getEventImage, getEventBadges } from "@/lib/event-utils";
import { EventTabs } from "@/components/events/EventTabs";

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
          full_name,
          city
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
          full_name,
          city
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
      .eq("status", "completed")
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

  const openTime = eventDateObj.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) + " HS";
  const closeDateObj = new Date(eventDateObj.getTime() + 6 * 60 * 60 * 1000);
  const closeTime = closeDateObj.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) + " HS";

  // Dynamic content enhancements
  const titleLower = event.title.toLowerCase();
  
  let dressCode = "Casual Premium";
  if (titleLower.includes("vip") || titleLower.includes("gala") || titleLower.includes("premium")) {
    dressCode = "Formal / Elegante";
  } else if (titleLower.includes("electronic") || titleLower.includes("techno") || titleLower.includes("rave") || titleLower.includes("underground")) {
    dressCode = "All Black / Cyberpunk";
  } else if (titleLower.includes("neon") || titleLower.includes("fluo") || titleLower.includes("party")) {
    dressCode = "Neon / Club wear";
  }

  let minAge = "Mayores de 18 años (+18)";
  if (titleLower.includes("vip lounge") || event.ticket_price > 50000 || titleLower.includes("exclusivo")) {
    minAge = "Exclusivo +21 años (DNI Requerido)";
  }

  let category = "Fiesta & Clubbing";
  if (titleLower.includes("concierto") || titleLower.includes("live") || titleLower.includes("festival") || titleLower.includes("banda")) {
    category = "Festival / En Vivo";
  } else if (event.ticket_price === 0) {
    category = "Social / Acceso Libre";
  }

  const creator = event.creator;
  const creatorName = (Array.isArray(creator) ? creator[0]?.full_name : (creator as any)?.full_name) || "Organizador Hangover";
  const city = (Array.isArray(creator) ? creator[0]?.city : (creator as any)?.city) || "Barranquilla";

  // Get dynamic badges
  const badges = getEventBadges(event as any, 0);

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
    .order("event_date", { ascending: true })
    .limit(3);

  // Query bookings for related events to show attendees on their preview cards
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

  return (
    <div className="relative min-h-screen w-full bg-[#05050a] text-zinc-100 pb-28 md:pb-20 overflow-hidden">
      {/* Background Neon Ambient Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-10 w-[500px] h-[500px] bg-primary-950/15 rounded-full blur-[160px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-1/4 right-10 w-[500px] h-[500px] bg-accent-950/15 rounded-full blur-[160px] mix-blend-screen" />
      </div>

      {/* SECCIÓN 1: HERO PREMIUM */}
      <section className="relative h-[45vh] md:h-[55vh] w-full bg-zinc-950 overflow-hidden">
        <img
          src={getEventImage(event.image_url, event.id)}
          alt={event.title}
          className="w-full h-full object-cover scale-105 filter blur-[6px] opacity-25 absolute inset-0 z-0"
        />
        <div className="w-full h-full object-cover relative z-10 max-w-7xl mx-auto flex items-end px-4 sm:px-6 md:px-8 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[340px_1fr] gap-6 items-end w-full">
            {/* Poster Card */}
            <div className="hidden md:block rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] aspect-[3/4]">
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
                <span className="font-semibold text-zinc-300">Organizado por {creatorName}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 hidden sm:inline" />
                <span className="capitalize">{formattedDate}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 hidden sm:inline" />
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
          
          {/* Left Column (Details) */}
          <div className="space-y-10">
            
            {/* SECCIÓN 2: CONTADOR REGRESIVO */}
            <div className="bg-zinc-950/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md shadow-xl text-center space-y-4">
              <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-extrabold block">La venta de tickets cierra en</span>
              <EventCountdown targetDate={event.event_date} variant="detailed" />
            </div>

            {/* TABS SYSTEM */}
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
            />

            {/* SECCIÓN 8: COMPARTIR y SECCIÓN 9: FAVORITOS */}
            <EventClientInteractive
              eventId={event.id}
              eventTitle={event.title}
              eventDescription={event.description || ""}
            />

          </div>

          {/* Right Column (Sidebar Sticky) */}
          <div className="sticky top-24 space-y-6">
            
            {/* Checkout panel (SECCIÓN 5: ENTRADAS, SECCIÓN 6: CONFIANZA, SECCIÓN 10: CTA DE COMPRA) */}
            <div className="glass-card w-full rounded-3xl border border-white/10 bg-[#09090f]/90 p-6 shadow-[0_20px_80px_rgba(217,70,239,0.12)]">
              <div className="space-y-6">
                <div className="space-y-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-300">
                    <Ticket className="w-3.5 h-3.5" />
                    Entrada Oficial
                  </span>
                  <h3 className="text-lg font-bold text-white font-outfit">Adquiere tus accesos</h3>
                  <p className="text-xs text-zinc-400">Tickets 100% autorizados del organizador directos al cliente.</p>
                </div>

                {/* Progress bar and availability */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400 flex items-center gap-1 font-semibold">
                      <strong>{attendeeCount}</strong> reservados
                    </span>
                    <span className="text-primary-400 font-extrabold">{percentSold}% Vendido</span>
                  </div>
                  
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-600 to-rose-500 transition-all duration-500"
                      style={{ width: `${percentSold}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    {remainingTickets <= 80 ? (
                      <span className="text-rose-400 font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
                        ⚠️ ¡Solo quedan {remainingTickets} entradas!
                      </span>
                    ) : (
                      <span>
                        {remainingTickets} entradas restantes
                      </span>
                    )}
                    <span>Aforo: {capacity}</span>
                  </div>
                </div>

                {/* Trust & Guarantee items */}
                <div className="space-y-4 pt-1">
                  <div className="flex items-start gap-3.5 text-xs">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-zinc-200">👥 {attendeeCount} Asistentes Registrados</p>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">
                        Únete a los asistentes que ya reservaron sus accesos para este evento oficial.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 text-xs">
                    <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-400 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-zinc-200">Garantía de Acceso Seguro</p>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">
                        Entradas emitidas al instante en formato QR y guardadas en tu cuenta.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-center border-t border-white/5">
                  <span className="text-xs text-zinc-400 font-medium">Precio Total (Base)</span>
                  <span className="text-2xl font-black text-emerald-400 font-outfit">
                    {event.ticket_price > 0 ? `$${event.ticket_price}` : "Gratis"}
                  </span>
                </div>

                {/* Main Checkout triggers */}
                <EventDetailActions
                  eventId={event.id}
                  eventDate={event.event_date}
                  ticketPrice={event.ticket_price}
                  isAuthenticated={Boolean(user)}
                  variant="default"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 7: EVENTOS RELACIONADOS */}
        {relatedEvents.length > 0 && (
          <div className="pt-16 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white uppercase tracking-wider font-outfit">También te puede interesar</h3>
              <div className="h-px bg-white/10 flex-grow ml-4" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedEvents.map((e, idx) => {
                const eCreatorRaw = e.creator;
                const eCreatorName = (Array.isArray(eCreatorRaw) ? eCreatorRaw[0]?.full_name : (eCreatorRaw as any)?.full_name) || "Organizador Hangover";
                
                return (
                  <div key={e.id} className="glass-card overflow-hidden hover:border-white/20 transition-all duration-300 flex flex-col h-full bg-[#07070c]/90 group">
                    <div className="relative h-44 w-full bg-zinc-900 overflow-hidden">
                      <img
                        src={getEventImage(e.image_url, e.id)}
                        alt={e.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 right-3 bg-black/80 border border-white/10 px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-400">
                        {e.ticket_price > 0 ? `$${e.ticket_price}` : "Gratis"}
                      </span>
                    </div>
                    <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                      <div className="space-y-1">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium block">Por {eCreatorName}</span>
                        <h4 className="font-bold text-white text-base line-clamp-1 group-hover:text-primary-400 transition-colors font-outfit">
                          <Link href={`/events/${slugify(e.title)}`}>
                            {e.title}
                          </Link>
                        </h4>
                        <p className="text-zinc-400 text-xs line-clamp-2 min-h-[32px]">
                          {e.description || "Prepárate para una noche de primer nivel en el mejor ambiente."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[10px] text-zinc-400">
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

      {/* SECCIÓN 10: MOBILE FLOATING CTA */}
      <EventDetailActions
        eventId={event.id}
        eventDate={event.event_date}
        ticketPrice={event.ticket_price}
        isAuthenticated={Boolean(user)}
        variant="sticky-bar"
      />
    </div>
  );
}
