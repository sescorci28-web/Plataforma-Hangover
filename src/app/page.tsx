import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { 
  Calendar, 
  Building2, 
  Sparkles, 
  Users, 
  ArrowRight, 
  ShieldCheck, 
  MapPin, 
  Star, 
  Flame, 
  Clock, 
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { HomeClientInteractive } from "@/components/home/HomeClientInteractive";
import { EventCountdown } from "@/components/events/EventCountdown";
import { slugify, getEventImage } from "@/lib/event-utils";

// Inline SVG components for social media icons to avoid lucide-react version mismatches
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
  </svg>
);

export const revalidate = 0; // Dynamic route

export default async function HomePage() {
  const supabase = await createClient();

  // 1. Fetch Featured Events (next 3 upcoming events)
  const { data: eventsData } = await supabase
    .from("events")
    .select(`
      id,
      title,
      description,
      event_date,
      location,
      image_url,
      ticket_price,
      creator:profiles!events_creator_id_fkey (
        city
      )
    `)
    .order("event_date", { ascending: true })
    .limit(3);

  const featuredEvents = eventsData || [];

  // 2. Fetch Featured Clubs (top 3 highest rated)
  const { data: clubsData } = await supabase
    .from("clubs")
    .select("id, name, city, description, rating, banner_image, slug, opening_hours")
    .order("rating", { ascending: false })
    .limit(3);

  const featuredClubs = clubsData || [];

  // 3. Fetch Featured Services (top 4 services)
  const { data: servicesData } = await supabase
    .from("services")
    .select(`
      id,
      title,
      slug,
      price,
      price_type,
      image_url,
      average_rating,
      category,
      provider:profiles!services_provider_id_fkey (
        full_name,
        city
      )
    `)
    .eq("is_active", true)
    .order("average_rating", { ascending: false })
    .limit(4);

  const featuredServices = servicesData || [];

  // 4. Fetch Real-time Hangover Connect statistics
  const nowStr = new Date().toISOString();
  
  // Active people online count
  const { count: activePeopleCount } = await supabase
    .from("connect_presence")
    .select("id", { count: "exact", head: true })
    .gt("expires_at", nowStr)
    .eq("visibility", "visible");

  // Active events count
  const { data: activeEventsPresences } = await supabase
    .from("connect_presence")
    .select("event_id")
    .gt("expires_at", nowStr)
    .eq("visibility", "visible")
    .not("event_id", "is", null);

  const activeEventsCount = new Set(
    (activeEventsPresences || []).map(p => p.event_id)
  ).size;

  // Active clubs count
  const { data: activeClubsPresences } = await supabase
    .from("connect_presence")
    .select("club_id")
    .gt("expires_at", nowStr)
    .eq("visibility", "visible")
    .not("club_id", "is", null);

  const activeClubsCount = new Set(
    (activeClubsPresences || []).map(p => p.club_id)
  ).size;

  // Fallbacks if data is zero/null (for premium cold-start experience)
  const displayActivePeople = Math.max(activePeopleCount || 0, 142);
  const displayActiveEvents = Math.max(activeEventsCount || 0, 3);
  const displayActiveClubs = Math.max(activeClubsCount || 0, 5);

  return (
    <div className="relative min-h-screen bg-[#020205] text-zinc-100 overflow-hidden font-sans">
      {/* Background Neon Ambient Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary-950/10 rounded-full blur-[180px] mix-blend-screen" />
        <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-indigo-950/10 rounded-full blur-[180px] mix-blend-screen" />
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-accent-950/10 rounded-full blur-[180px] mix-blend-screen" />
      </div>

      {/* SECCIÓN 1: HERO FULLSCREEN */}
      <section className="relative h-[80vh] md:h-[85vh] w-full flex items-center justify-center overflow-hidden bg-black">
        {/* Background Visual (Ambient party image / overlay) */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1800&q=80"
            alt="Hangover Party Background"
            className="w-full h-full object-cover filter brightness-[0.25] saturate-[0.85]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#020205]/40 via-transparent to-[#020205] z-1" />
        </div>

        {/* Hero Content */}
        <div className="container relative z-10 mx-auto px-4 md:px-8 flex flex-col items-center text-center space-y-8 max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/25 text-xs font-bold uppercase tracking-wider text-primary-400">
            <Sparkles className="w-3.5 h-3.5 text-primary-400" />
            VIVE LA MEJOR EXPERIENCIA SOCIAL NOCTURNA
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tight leading-none text-white font-outfit uppercase">
            Eleva tus noches
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-purple-500 to-indigo-500">
              a otro nivel
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-xl text-zinc-400 max-w-2xl leading-relaxed font-medium">
            Descubre eventos únicos, discotecas exclusivas, reserva mesas VIP en caliente y contrata servicios de primer nivel para tus fiestas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full max-w-md">
            <Link
              href="/events"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-primary-500/20 active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              Explorar Eventos
            </Link>
            <Link
              href="/discotecas"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer border border-white/10 hover:border-white/20 active:scale-95"
            >
              <Building2 className="w-4 h-4" />
              Explorar Discotecas
            </Link>
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: BUSCADOR GLOBAL */}
      <section className="relative z-20 -mt-10 px-4">
        <HomeClientInteractive />
      </section>

      <div className="container mx-auto px-4 md:px-8 py-20 space-y-28 relative z-10 max-w-6xl">
        
        {/* SECCIÓN 3: 4 CATEGORÍAS PRINCIPALES */}
        <section className="space-y-6">
          <div className="text-center md:text-left space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-400">¿Qué deseas hacer hoy?</span>
            <h2 className="text-2xl md:text-3xl font-black uppercase text-white font-outfit">Explora la vida nocturna</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/events"
              className="group relative h-48 sm:h-56 rounded-3xl border border-white/5 bg-[#07070c]/50 p-6 flex flex-col justify-between overflow-hidden hover:border-white/15 transition-all shadow-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent group-hover:opacity-100 transition-opacity" />
              <div className="w-10 h-10 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="space-y-1 relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Cartelera en vivo</span>
                <h3 className="font-bold text-white text-base font-outfit uppercase">🎉 Eventos</h3>
              </div>
            </Link>

            <Link
              href="/discotecas"
              className="group relative h-48 sm:h-56 rounded-3xl border border-white/5 bg-[#07070c]/50 p-6 flex flex-col justify-between overflow-hidden hover:border-white/15 transition-all shadow-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent group-hover:opacity-100 transition-opacity" />
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="space-y-1 relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Salas y reservas VIP</span>
                <h3 className="font-bold text-white text-base font-outfit uppercase">🍾 Discotecas</h3>
              </div>
            </Link>

            <Link
              href="/services"
              className="group relative h-48 sm:h-56 rounded-3xl border border-white/5 bg-[#07070c]/50 p-6 flex flex-col justify-between overflow-hidden hover:border-white/15 transition-all shadow-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent group-hover:opacity-100 transition-opacity" />
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1 relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">DJs, barras y sonido</span>
                <h3 className="font-bold text-white text-base font-outfit uppercase">🎧 Servicios</h3>
              </div>
            </Link>

            <Link
              href="/dashboard/user"
              className="group relative h-48 sm:h-56 rounded-3xl border border-white/5 bg-[#07070c]/50 p-6 flex flex-col justify-between overflow-hidden hover:border-white/15 transition-all shadow-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 to-transparent group-hover:opacity-100 transition-opacity" />
              <div className="w-10 h-10 rounded-2xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center text-accent-400 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-1 relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Conecta en vivo</span>
                <h3 className="font-bold text-white text-base font-outfit uppercase">🔥 Connect</h3>
              </div>
            </Link>
          </div>
        </section>

        {/* SECCIÓN 4: EVENTOS DESTACADOS */}
        {featuredEvents.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5 text-left">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-400">Cartelera Exclusiva</span>
                <h2 className="text-2xl md:text-3xl font-black uppercase text-white font-outfit">Eventos Destacados</h2>
              </div>
              <Link
                href="/events"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
              >
                Ver todos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex flex-col gap-6">
              {featuredEvents.map((event) => {
                const eventDate = new Date(event.event_date);
                const formattedDate = eventDate.toLocaleDateString("es-ES", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                });
                const city = (event.creator as any)?.city || "Barranquilla";

                return (
                  <div
                    key={event.id}
                    className="glass-card rounded-[28px] border-white/5 bg-[#06060b]/40 p-5 md:p-6 overflow-hidden transition-all hover:border-white/10 shadow-xl"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 items-center">
                      {/* Image / Countdown Wrapper */}
                      <div className="relative aspect-[16/10] md:aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-950">
                        <img
                          src={getEventImage(event.image_url, event.id)}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-3 left-3">
                          <EventCountdown targetDate={event.event_date} variant="compact" />
                        </div>
                      </div>

                      {/* Content Details */}
                      <div className="flex flex-col justify-between h-full space-y-4 text-left">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-400 font-semibold uppercase">
                            <span className="text-primary-400">{formattedDate}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                            <span>📍 {city}</span>
                          </div>

                          <h3 className="text-xl md:text-2xl font-black text-white font-outfit leading-tight line-clamp-1 uppercase">
                            {event.title}
                          </h3>

                          <p className="text-zinc-400 text-xs md:text-sm line-clamp-2 leading-relaxed">
                            {event.description || "Prepárate para una noche de primer nivel en el mejor ambiente con DJ sets en vivo y coctelería premium."}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <div className="flex flex-col">
                            <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Entradas desde</span>
                            <span className="text-lg font-black text-emerald-400">
                              {event.ticket_price > 0 ? `$${event.ticket_price}` : "Gratis"}
                            </span>
                          </div>

                          <Link
                            href={`/events/${slugify(event.title)}`}
                            className="inline-flex justify-center items-center gap-1.5 bg-white hover:bg-zinc-200 active:scale-95 text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                          >
                            <span>Ver evento</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECCIÓN 5: DISCOTECAS DESTACADAS */}
        {featuredClubs.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5 text-left">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-400">Templos de la Música</span>
                <h2 className="text-2xl md:text-3xl font-black uppercase text-white font-outfit">Discotecas Destacadas</h2>
              </div>
              <Link
                href="/discotecas"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
              >
                Ver todas
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredClubs.map((club) => {
                const cover = club.banner_image || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop";
                const rating = club.rating ? Number(club.rating).toFixed(1) : "5.0";

                return (
                  <div
                    key={club.id}
                    className="glass-card overflow-hidden hover:border-white/10 transition-all flex flex-col h-full bg-[#06060b]/40 rounded-[28px]"
                  >
                    {/* Cover Photo */}
                    <div className="relative h-48 w-full bg-zinc-950">
                      <img src={cover} alt={club.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#020205] via-transparent to-transparent opacity-85" />
                      
                      {/* Rating */}
                      <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/70 border border-white/10 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-400 backdrop-blur-md">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{rating}</span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-6 flex-grow flex flex-col justify-between space-y-4 text-left">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase">
                          <span>📍 {club.city}</span>
                          <span className="text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Abierto hoy
                          </span>
                        </div>
                        <h3 className="font-bold text-white text-lg font-outfit uppercase truncate">{club.name}</h3>
                        <p className="text-zinc-400 text-xs line-clamp-2 min-h-[32px]">
                          {club.description || "Disfruta de la mejor producción acústica e iluminación del sector en un ambiente único."}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/5">
                        <Link
                          href={`/discotecas/${club.slug || club.id}`}
                          className="w-full inline-flex justify-center items-center gap-2 bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 px-4 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border border-white/10 active:scale-95"
                        >
                          Reservar Mesa
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECCIÓN 6: HANGOVER CONNECT */}
        <section className="relative rounded-[32px] border border-white/5 bg-gradient-to-b from-[#090912] to-[#040408]/90 p-8 md:p-12 text-center overflow-hidden shadow-2xl">
          {/* Neon grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-600/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <div className="flex flex-col items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-[10px] font-bold uppercase tracking-wider text-primary-400 animate-pulse">
                <Flame className="w-3.5 h-3.5" /> En Vivo
              </span>
              <h2 className="text-3xl md:text-5xl font-black uppercase text-white font-outfit">Ahora en Hangover Connect</h2>
              <p className="text-zinc-400 text-xs md:text-sm font-medium max-w-md">
                Conéctate con otros asistentes que están en las mismas discotecas y eventos que tú hoy. Chatea en caliente y amplía tu grupo.
              </p>
            </div>

            {/* Connect Stats */}
            <div className="grid grid-cols-3 gap-4 border-y border-white/5 py-8 max-w-lg mx-auto">
              <div className="space-y-1.5">
                <span className="block text-2xl md:text-3xl font-black text-white font-outfit">{displayActivePeople}</span>
                <span className="block text-[8px] sm:text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Personas Activas</span>
              </div>
              <div className="space-y-1.5 border-x border-white/5">
                <span className="block text-2xl md:text-3xl font-black text-white font-outfit">{displayActiveEvents}</span>
                <span className="block text-[8px] sm:text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Eventos Activos</span>
              </div>
              <div className="space-y-1.5">
                <span className="block text-2xl md:text-3xl font-black text-white font-outfit">{displayActiveClubs}</span>
                <span className="block text-[8px] sm:text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Clubes Activos</span>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="/dashboard/user"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-primary-500/10 active:scale-95 font-outfit"
              >
                Entrar a Connect
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* SECCIÓN 7: SERVICIOS DESTACADOS */}
        {featuredServices.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5 text-left">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-400">Arma tu Fiesta</span>
                <h2 className="text-2xl md:text-3xl font-black uppercase text-white font-outfit">Servicios Destacados</h2>
              </div>
              <Link
                href="/services"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
              >
                Ver todos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredServices.map((service) => {
                const cover = service.image_url || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80";
                const rating = service.average_rating ? Number(service.average_rating).toFixed(1) : "5.0";
                const providerName = (service.provider as any)?.full_name || "Proveedor Hangover";

                return (
                  <div
                    key={service.id}
                    className="glass-card overflow-hidden hover:border-white/10 transition-all flex flex-col h-full bg-[#06060b]/40 rounded-3xl"
                  >
                    {/* Photo */}
                    <div className="relative aspect-square w-full bg-zinc-950">
                      <img src={cover} alt={service.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#020205] via-transparent to-transparent opacity-80" />
                      
                      {/* Rating */}
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 border border-white/10 px-2 py-0.5 rounded-full text-[9px] font-bold text-amber-400 backdrop-blur-md">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span>{rating}</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 flex-grow flex flex-col justify-between space-y-3 text-left">
                      <div className="space-y-1">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 block">
                          🎧 {service.category || "General"}
                        </span>
                        <h4 className="font-bold text-white text-sm font-outfit uppercase truncate group-hover:text-primary-400">
                          {service.title}
                        </h4>
                        <p className="text-[10px] text-zinc-400 truncate">Por {providerName}</p>
                      </div>

                      <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[8px] text-zinc-500 uppercase font-semibold">Precio</span>
                          <span className="text-xs font-black text-zinc-200">
                            ${service.price}
                          </span>
                        </div>

                        <Link
                          href={`/services/${service.slug || service.id}`}
                          className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors cursor-pointer"
                        >
                          Ver perfil
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECCIÓN 8: BENEFICIOS */}
        <section className="border-t border-white/5 pt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
            <div className="space-y-2 flex flex-col items-center md:items-start">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm font-outfit uppercase">✓ Reservas seguras</h4>
              <p className="text-zinc-500 text-[11px] leading-relaxed max-w-[200px]">
                Tus pagos y reservas están totalmente encriptados y protegidos.
              </p>
            </div>

            <div className="space-y-2 flex flex-col items-center md:items-start">
              <div className="w-10 h-10 rounded-2xl bg-primary-500/10 border border-primary-500/25 flex items-center justify-center text-primary-400">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm font-outfit uppercase">✓ Proveedores verificados</h4>
              <p className="text-zinc-500 text-[11px] leading-relaxed max-w-[200px]">
                Validamos las credenciales y calidad de cada local y profesional.
              </p>
            </div>

            <div className="space-y-2 flex flex-col items-center md:items-start">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm font-outfit uppercase">✓ Atención rápida</h4>
              <p className="text-zinc-500 text-[11px] leading-relaxed max-w-[200px]">
                Soporte ágil en caso de incidencias con tus reservas de mesa o tickets.
              </p>
            </div>

            <div className="space-y-2 flex flex-col items-center md:items-start">
              <div className="w-10 h-10 rounded-2xl bg-accent-500/10 border border-accent-500/25 flex items-center justify-center text-accent-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm font-outfit uppercase">✓ Experiencias únicas</h4>
              <p className="text-zinc-500 text-[11px] leading-relaxed max-w-[200px]">
                Descubre contenido y fiestas VIP imposibles de encontrar fuera de aquí.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* SECCIÓN 9: FOOTER */}
      <footer className="border-t border-white/5 bg-[#030307] py-16 mt-20 relative z-10">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
            <div className="col-span-2 space-y-4">
              <span className="text-lg font-black tracking-widest text-white font-outfit">HANGOVER</span>
              <p className="text-zinc-500 text-xs leading-relaxed max-w-xs">
                El marketplace líder en vida nocturna y fiestas premium. Construye tu noche perfecta en un solo clic.
              </p>
              <div className="flex gap-4 pt-2">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                  <InstagramIcon className="w-5 h-5" />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                  <FacebookIcon className="w-5 h-5" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                  <TwitterIcon className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div className="space-y-3.5 text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block font-outfit">Plataforma</span>
              <ul className="space-y-2 text-xs">
                <li><Link href="/" className="text-zinc-500 hover:text-white transition-colors">Inicio</Link></li>
                <li><Link href="/dashboard/user" className="text-zinc-500 hover:text-white transition-colors">Mi Cuenta</Link></li>
                <li><Link href="/register?type=provider" className="text-zinc-500 hover:text-white transition-colors">Ser Proveedor</Link></li>
              </ul>
            </div>

            <div className="space-y-3.5 text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block font-outfit">Eventos</span>
              <ul className="space-y-2 text-xs">
                <li><Link href="/events" className="text-zinc-500 hover:text-white transition-colors">Cartelera</Link></li>
                <li><Link href="/events" className="text-zinc-500 hover:text-white transition-colors">Destacados</Link></li>
                <li><Link href="/events" className="text-zinc-500 hover:text-white transition-colors">Comprar Tickets</Link></li>
              </ul>
            </div>

            <div className="space-y-3.5 text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block font-outfit">Discotecas</span>
              <ul className="space-y-2 text-xs">
                <li><Link href="/discotecas" className="text-zinc-500 hover:text-white transition-colors">Salas</Link></li>
                <li><Link href="/discotecas" className="text-zinc-500 hover:text-white transition-colors">Reservas VIP</Link></li>
                <li><Link href="/discotecas" className="text-zinc-500 hover:text-white transition-colors">Zonas y Mesas</Link></li>
              </ul>
            </div>

            <div className="space-y-3.5 text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block font-outfit">Soporte</span>
              <ul className="space-y-2 text-xs">
                <li><Link href="/ayuda" className="text-zinc-500 hover:text-white transition-colors">Centro de Ayuda</Link></li>
                <li><Link href="/terminos" className="text-zinc-500 hover:text-white transition-colors">Términos de Uso</Link></li>
                <li><Link href="/privacidad" className="text-zinc-500 hover:text-white transition-colors">Privacidad</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-zinc-650 uppercase tracking-widest font-semibold font-mono">
            <span>© {new Date().getFullYear()} HANGOVER INC. TODOS LOS DERECHOS RESERVADOS.</span>
            <span>DISEÑADO PARA LA VIDA NOCTURNA.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
