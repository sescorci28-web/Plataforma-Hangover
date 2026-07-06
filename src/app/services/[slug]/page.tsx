import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  Calendar, MapPin, Sparkles, ArrowLeft, ShieldCheck, Clock, MessageSquare, 
  CheckCircle2, AlertTriangle, Users, Award, Star, Zap, ChevronRight, Check, X,
  PhoneCall, Video as VideoIcon, Music, Disc, TrendingUp, Globe, Badge,
  Volume2, GlassWater, Camera, UserCheck, Palette, Crown, Utensils, Sofa, Car, Heart
} from "lucide-react";

import { ServiceBookingWidget } from "@/components/services/ServiceBookingWidget";
import { ServiceStoriesViewer } from "@/components/services/ServiceStoriesViewer";
import { ServiceProfileActions } from "@/components/services/ServiceProfileActions";
import { ServiceProfileTabs } from "@/components/services/ServiceProfileTabs";
import { slugify } from "@/lib/slugify";

export const revalidate = 0;

interface ServiceDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function getEmbedUrl(url: string) {
  if (!url) return null;
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const ytMatch = url.match(ytRegex);
  if (ytMatch && ytMatch[1]) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/i;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[1]) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

function getSpotifyEmbedUrl(url: string) {
  if (!url) return null;
  const regex = /open\.spotify\.com\/(playlist|track|album|artist)\/([a-zA-Z0-9]+)/i;
  const match = url.match(regex);
  if (match) return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
  return null;
}

function getSoundCloudEmbedUrl(url: string) {
  if (!url) return null;
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
}

function CategoryIcon({ name, className = "w-10 h-10 text-white/80" }: { name: string; className?: string }) {
  switch (name) {
    case "music":
      return <Music className={className} />;
    case "sound":
      return <Volume2 className={className} />;
    case "bar":
      return <GlassWater className={className} />;
    case "media":
      return <Camera className={className} />;
    case "staff":
      return <UserCheck className={className} />;
    case "decor":
      return <Palette className={className} />;
    case "premium":
      return <Crown className={className} />;
    case "security":
      return <ShieldCheck className={className} />;
    case "catering":
      return <Utensils className={className} />;
    case "logistics":
      return <Sofa className={className} />;
    case "transport":
      return <Car className={className} />;
    case "social":
      return <Heart className={className} />;
    default:
      return <Sparkles className={className} />;
  }
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { slug: identifier } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);
  let service = null;

  if (isUUID) {
    const { data } = await supabase
      .from("services")
      .select(`*, provider:profiles!services_provider_id_fkey (id, full_name, city, created_at, avatar_url)`)
      .eq("id", identifier)
      .maybeSingle();
    service = data;
  }

  if (!service) {
    const { data } = await supabase
      .from("services")
      .select(`*, provider:profiles!services_provider_id_fkey (id, full_name, city, created_at, avatar_url)`)
      .eq("slug", identifier)
      .maybeSingle();
    service = data;
  }

  if (!service) {
    const { data: allServices } = await supabase
      .from("services")
      .select(`*, provider:profiles!services_provider_id_fkey (id, full_name, city, created_at, avatar_url)`);
    if (allServices) {
      service = allServices.find((s) => s.slug === identifier || slugify(s.title) === identifier) || null;
    }
  }

  if (!service) notFound();

  let stories: any[] = [];
  let dbGallery: any[] = [];
  let pastEvents: any[] = [];
  let reviews: any[] = [];
  let manualAvailability: any[] = [];
  let bookedDates: string[] = [];
  let eligibleBookingId: string | null = null;

  try { const { data } = await supabase.from("service_stories").select("*").eq("service_id", service.id).eq("active", true).order("display_order", { ascending: true }); stories = data || []; } catch (e) {}
  try { const { data } = await supabase.from("service_gallery_items").select("*").eq("service_id", service.id).eq("active", true).order("display_order", { ascending: true }); dbGallery = data || []; } catch (e) {}
  try { const { data } = await supabase.from("service_past_events").select("*").eq("service_id", service.id).order("event_date", { ascending: false }); pastEvents = data || []; } catch (e) {}
  try {
    const { data } = await supabase.from("service_reviews").select(`*, user:profiles!service_reviews_user_id_fkey (full_name, avatar_url)`).eq("service_id", service.id).order("created_at", { ascending: false });
    reviews = data || [];
  } catch (e) {}
  try { const { data } = await supabase.from("service_availability").select("date, status, notes").eq("service_id", service.id); manualAvailability = data || []; } catch (e) {}
  try {
    const { data } = await supabase.from("bookings").select("event_date").eq("service_id", service.id).in("status", ["ACCEPTED", "PAID", "IN_PROGRESS", "COMPLETED", "confirmed", "completed"]);
    bookedDates = (data || []).map((b: any) => b.event_date);
  } catch (e) {}

  if (user) {
    try {
      const { data: userBookings } = await supabase.from("bookings").select("id").eq("user_id", user.id).eq("service_id", service.id).in("status", ["ACCEPTED", "PAID", "IN_PROGRESS", "COMPLETED", "confirmed", "completed"]);
      if (userBookings && userBookings.length > 0) {
        const bookingIds = userBookings.map((b) => b.id);
        const { data: userReviews } = await supabase.from("service_reviews").select("booking_id").in("booking_id", bookingIds);
        const reviewedIds = (userReviews || []).map((r) => r.booking_id);
        const unreviewed = userBookings.find((b) => !reviewedIds.includes(b.id));
        if (unreviewed) eligibleBookingId = unreviewed.id;
      }
    } catch (e) {}
  }

  const { count: bookingsCount } = await supabase.from("bookings").select("id", { count: "exact", head: true }).eq("service_id", service.id);
  const totalBookings = bookingsCount || 0;

  const provider = service.provider;
  const providerName = (Array.isArray(provider) ? provider[0]?.full_name : (provider as any)?.full_name) || "Proveedor Hangover";
  const providerCity = service.base_city || (Array.isArray(provider) ? provider[0]?.city : (provider as any)?.city) || "Barranquilla";
  const providerAvatar = (Array.isArray(provider) ? provider[0]?.avatar_url : (provider as any)?.avatar_url) || null;
  const providerCreatedAt = (Array.isArray(provider) ? provider[0]?.created_at : (provider as any)?.created_at) || service.created_at;

  const memberSince = new Date(providerCreatedAt).toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  const includesArr = Array.isArray(service.includes) && service.includes.length > 0
    ? service.includes
    : ["Equipamiento básico profesional", "Instalación y pruebas de sonido", "Soporte técnico durante el show", "Transporte en zona metropolitana"];

  const excludesArr = Array.isArray(service.excludes) && service.excludes.length > 0
    ? service.excludes
    : ["Equipos de iluminación de gran escala", "Horas extra fuera de contrato", "Alimentación del personal", "Permisos municipales de sonido"];

  const requirementsArr = Array.isArray(service.requirements) && service.requirements.length > 0
    ? service.requirements
    : ["Conexión eléctrica estable de 110V/220V", "Mesa o soporte sólido en cabina", "Espacio techado en caso de exteriores", "Acceso al recinto 2 horas antes para montaje"];

  const citiesArr = Array.isArray(service.cities_coverage) && service.cities_coverage.length > 0
    ? service.cities_coverage
    : [providerCity];

  const galleryUrls = service.gallery_urls || [];
  const hasImages = !!(service.image_url || (galleryUrls && galleryUrls.length > 0));

  // Category config
  const categoryConfig: Record<string, { label: string; gradient: string; accent: string; icon: string }> = {
    music:   { label: "Música y Shows",         gradient: "from-violet-900 via-purple-900 to-indigo-950",   accent: "violet",  icon: "music" },
    sound:   { label: "Sonido e Iluminación",    gradient: "from-sky-900 via-blue-900 to-slate-950",         accent: "sky",     icon: "sound" },
    bar:     { label: "Bar y Coctelería",        gradient: "from-rose-900 via-red-900 to-orange-950",        accent: "rose",    icon: "bar" },
    media:   { label: "Foto y Contenido",        gradient: "from-fuchsia-900 via-pink-900 to-purple-950",    accent: "fuchsia", icon: "media" },
    staff:   { label: "Staff y Personal",        gradient: "from-teal-900 via-cyan-900 to-slate-950",        accent: "teal",    icon: "staff" },
    decor:   { label: "Decoración",              gradient: "from-pink-900 via-fuchsia-900 to-violet-950",    accent: "pink",    icon: "decor" },
    premium: { label: "Experiencias VIP",        gradient: "from-amber-900 via-yellow-900 to-orange-950",    accent: "amber",   icon: "premium" },
    security:{ label: "Seguridad",              gradient: "from-slate-800 via-zinc-900 to-neutral-950",     accent: "slate",   icon: "security" },
    catering:{ label: "Catering",               gradient: "from-emerald-900 via-green-900 to-teal-950",     accent: "emerald", icon: "catering" },
    logistics:{ label: "Mobiliario",             gradient: "from-stone-800 via-neutral-900 to-zinc-950",     accent: "stone",   icon: "logistics" },
    transport:{ label: "Transporte",             gradient: "from-blue-900 via-indigo-900 to-slate-950",      accent: "blue",    icon: "transport" },
    social:  { label: "Bodas y Eventos",         gradient: "from-rose-900 via-pink-900 to-fuchsia-950",      accent: "rose",    icon: "social" },
  };

  const cat = categoryConfig[service.category] || { label: service.subcategory || "Servicio Especializado", gradient: "from-primary-950 via-violet-950 to-indigo-950", accent: "primary", icon: "sparkles" };
  const finalCategoryLabel = service.subcategory || cat.label;

  const avgStars = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length)
    : (Number(service.average_rating) || 5.0);

  const videoEmbedUrl = getEmbedUrl(service.video_url || "");
  const youtubeEmbedUrl = getEmbedUrl(service.youtube_url || "");
  const spotifyEmbedUrl = getSpotifyEmbedUrl(service.spotify_url || "");
  const soundcloudEmbedUrl = getSoundCloudEmbedUrl(service.soundcloud_url || "");

  const whatsappUrl = service.whatsapp_number
    ? `https://wa.me/${service.whatsapp_number}?text=${encodeURIComponent(`Hola, estoy interesado en tu servicio "${service.title}" en Hangover.`)}`
    : null;

  const socialMedia = (service.social_media as any) || {};

  const { data: relatedServicesData } = await supabase
    .from("services")
    .select(`*, provider:profiles!services_provider_id_fkey (full_name, city)`)
    .neq("id", service.id)
    .eq("category", service.category)
    .limit(3);

  const relatedServices = relatedServicesData || [];

  return (
    <div className="relative min-h-screen w-full bg-[#05050a] text-zinc-150 overflow-x-hidden font-sans">
      
      {/* ── BANNER / PORTADA (Instagram Style Banner) ───────────────── */}
      <div className="relative w-full h-[240px] md:h-[350px] overflow-hidden">
        {service.cover_url ? (
          <>
            <img src={service.cover_url} alt="Portada" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-[#05050a]" />
          </>
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${cat.gradient} opacity-80`}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.05)_0%,transparent_60%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#05050a]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
          </div>
        )}

        {/* Back Button floating on cover */}
        <Link
          href="/services"
          className="absolute top-6 left-6 z-20 inline-flex items-center gap-1.5 text-xs font-bold text-zinc-300 hover:text-white transition-all group bg-black/55 backdrop-blur-md px-4.5 py-2.5 rounded-full border border-white/10 hover:border-white/20 active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Volver al Marketplace
        </Link>
      </div>

      {/* ── OVERLAPPING PROFILE CARD & BODY CONTAINER ───────────────── */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 relative -mt-20 md:-mt-28 z-10 pb-32 space-y-8">
        
        {/* Stories Viewer Row */}
        {stories.length > 0 && (
          <div className="py-2 px-1">
            <ServiceStoriesViewer
              serviceName={service.title}
              providerName={providerName}
              avatarUrl={providerAvatar}
              coverUrl={service.image_url}
              stories={stories}
            />
          </div>
        )}

        {/* main profile info header */}
        <div className="bg-zinc-950/65 backdrop-blur-2xl border border-white/8 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            {/* Avatar & Branded Title Block */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full md:w-auto">
              {/* Profile Avatar Squircle with neon light glow */}
              <div className="relative shrink-0">
                {providerAvatar ? (
                  <img
                    src={providerAvatar}
                    alt={providerName}
                    className="w-24 h-24 sm:w-28 sm:w-28 rounded-3xl object-cover border-2 border-primary-500 shadow-[0_0_20px_rgba(217,70,239,0.3)] bg-zinc-900"
                  />
                ) : (
                  <div className={`w-24 h-24 sm:w-28 sm:w-28 rounded-3xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center border-2 border-primary-500 shadow-[0_0_20px_rgba(217,70,239,0.3)]`}>
                    <CategoryIcon name={cat.icon} className="w-10 h-10 text-white/90 animate-pulse" />
                  </div>
                )}
                
                {/* Active Indicator status */}
                {service.availability_status === 'available' && (
                  <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-emerald-500 border-2 border-zinc-950 rounded-full animate-pulse" title="Disponible ahora" />
                )}
              </div>

              {/* Title, Category & Location Badges */}
              <div className="space-y-2.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                    {finalCategoryLabel}
                  </span>
                  {service.verified && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verificado
                    </span>
                  )}
                  {service.badge_status === "top_provider" && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-400" /> Top
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-tight font-outfit truncate">
                  {service.title}
                </h1>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-zinc-400 font-medium">
                  <span className="text-zinc-200">por {providerName}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary-400" />
                    {providerCity}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Action CTAs Row */}
            <div className="flex flex-wrap gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t border-white/5 md:border-t-0">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-emerald-950/20 border border-emerald-500/25"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              )}
              
              <div className="flex-1 sm:flex-initial">
                <ServiceProfileActions
                  serviceId={service.id}
                  providerId={service.provider_id}
                  serviceTitle={service.title}
                  price={service.price}
                  user={user}
                />
              </div>
            </div>

          </div>

          {/* Statistics Strip Row (Instagram metric tags style) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-900/25 border border-white/5 rounded-2xl p-4 divide-y md:divide-y-0 md:divide-x divide-white/5">
            <div className="text-center py-1.5 md:py-0">
              <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Calificación</span>
              <span className="text-sm sm:text-base font-extrabold text-amber-400 font-outfit flex items-center justify-center gap-1">
                <Star className="w-4 h-4 fill-amber-400" />
                {avgStars.toFixed(1)} <span className="text-[10px] text-zinc-500 font-normal">({reviews.length})</span>
              </span>
            </div>
            <div className="text-center py-1.5 md:py-0">
              <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Eventos en Hangover</span>
              <span className="text-sm sm:text-base font-extrabold text-white font-outfit">
                {service.completed_bookings_count || totalBookings || 0}
              </span>
            </div>
            <div className="text-center py-1.5 md:py-0 pt-3 md:pt-0">
              <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Tiempo de Respuesta</span>
              <span className="text-sm sm:text-base font-extrabold text-emerald-400 font-outfit">
                {service.response_time || "< 1 hora"}
              </span>
            </div>
            <div className="text-center py-1.5 md:py-0 pt-3 md:pt-0">
              <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Miembro Desde</span>
              <span className="text-sm sm:text-base font-extrabold text-primary-400 font-outfit">
                {memberSince}
              </span>
            </div>
          </div>
        </div>

        {/* ── TWO COLUMN GRID LAYOUT (Main Tab Content & Booking Sticky Widget) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Feed Column (col-span-2) */}
          <div className="lg:col-span-2 space-y-6">
            <ServiceProfileTabs
              service={service}
              includesArr={includesArr}
              excludesArr={excludesArr}
              requirementsArr={requirementsArr}
              citiesArr={citiesArr}
              galleryUrls={galleryUrls}
              hasImages={hasImages}
              dbGallery={dbGallery}
              pastEvents={pastEvents}
              reviews={reviews}
              user={user}
              eligibleBookingId={eligibleBookingId}
              manualAvailability={manualAvailability}
              bookedDates={bookedDates}
              spotifyEmbedUrl={spotifyEmbedUrl}
              soundcloudEmbedUrl={soundcloudEmbedUrl}
              youtubeEmbedUrl={youtubeEmbedUrl}
              videoEmbedUrl={videoEmbedUrl}
            />
          </div>

          {/* Marketplace Booking Sidebar Column (col-span-1) */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
            
            {/* Booking Card */}
            <ServiceBookingWidget
              serviceId={service.id}
              providerId={service.provider_id}
              price={service.price}
              serviceTitle={service.title}
              user={user}
              duration={service.duration || "4 horas"}
              responseTime={service.response_time || "Menos de 1 hora"}
              availabilityStatus={service.availability_status || "available"}
              provider={service.provider}
              serviceImageUrl={service.image_url}
              bookedDates={bookedDates}
              manualAvailability={manualAvailability}
              reviewsCount={reviews.length}
              averageRating={reviews.length ? (reviews.reduce((sum: any, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1) : "4.9"}
            />

            {/* Geographic Coverage Quick Summary Box */}
            <div className="bg-zinc-950/60 border border-white/8 rounded-3xl p-5 space-y-3.5 backdrop-blur-md">
              <h4 className="text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-zinc-400" /> Municipios Soportados
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {citiesArr.map((city: string) => (
                  <span
                    key={city}
                    className="text-[11px] font-bold text-zinc-350 bg-white/3 border border-white/5 px-2.5 py-1 rounded-xl"
                  >
                    {city}
                  </span>
                ))}
              </div>
            </div>

            {/* Provider mini info card */}
            <div className="bg-zinc-950/60 border border-white/8 rounded-3xl p-5 space-y-4 backdrop-blur-md">
              <h4 className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Acerca del Artista</h4>
              
              <div className="flex items-center gap-3">
                {providerAvatar ? (
                  <img
                    src={providerAvatar}
                    alt={providerName}
                    className="w-12 h-12 rounded-2xl object-cover border border-white/10"
                  />
                ) : (
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center border border-white/10`}>
                    <CategoryIcon name={cat.icon} className="w-5 h-5 text-white/90" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-extrabold text-sm text-white font-outfit truncate">{providerName}</p>
                  <p className="text-xs text-zinc-550 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-primary-400" /> {providerCity}
                  </p>
                </div>
              </div>

              {/* Social profiles linking */}
              {(socialMedia.instagram || socialMedia.facebook) && (
                <div className="pt-3.5 border-t border-white/5 space-y-2">
                  <span className="text-[9px] uppercase font-black text-zinc-550 tracking-wider block">Redes Sociales</span>
                  <div className="flex flex-wrap gap-2">
                    {socialMedia.instagram && (
                      <a
                        href={`https://instagram.com/${socialMedia.instagram.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/3 hover:bg-white/6 border border-white/8 text-zinc-350 hover:text-white transition-all text-xs font-bold"
                      >
                        <span className="text-pink-400 font-extrabold">@</span>
                        <span>{socialMedia.instagram.replace("@", "")}</span>
                      </a>
                    )}
                    {socialMedia.facebook && (
                      <a
                        href={`https://facebook.com/${socialMedia.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/3 hover:bg-white/6 border border-white/8 text-zinc-350 hover:text-white transition-all text-xs font-bold"
                      >
                        <span className="text-blue-500 font-black">f</span>
                        <span>Facebook</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Related Similar Services Section */}
        {relatedServices.length > 0 && (
          <div className="pt-16 space-y-6">
            <div className="flex items-center gap-4">
              <h3 className="text-md font-black text-white uppercase tracking-widest font-outfit whitespace-nowrap">Otros Servicios Similares</h3>
              <div className="h-px bg-gradient-to-r from-white/10 to-transparent flex-grow" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedServices.map((item: any) => {
                const iProvName = (Array.isArray(item.provider) ? item.provider[0]?.full_name : (item.provider as any)?.full_name) || "Proveedor Hangover";
                const iCity = item.base_city || (Array.isArray(item.provider) ? item.provider[0]?.city : (item.provider as any)?.city) || providerCity;
                const iCat = categoryConfig[item.category] || cat;
                return (
                  <Link
                    key={item.id}
                    href={`/services/${item.slug || item.id}`}
                    className="bg-zinc-950/60 border border-white/6 hover:border-white/15 rounded-3xl overflow-hidden transition-all duration-300 flex flex-col group shadow-lg"
                  >
                    <div className="relative h-40 w-full overflow-hidden shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-550" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-tr ${iCat.gradient} opacity-70 flex items-center justify-center`}>
                          <CategoryIcon name={iCat.icon} className="w-10 h-10 text-white/80" />
                        </div>
                      )}
                      <span className="absolute top-3 right-3 bg-black/80 border border-white/15 px-3 py-1 rounded-full text-[10px] font-black text-emerald-405 font-outfit">
                        ${item.price?.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-5 flex-grow flex flex-col justify-between gap-4">
                      <div className="space-y-1.5">
                        <span className="text-[9px] text-zinc-550 uppercase tracking-widest font-black block">por {iProvName}</span>
                        <h4 className="font-extrabold text-white text-base line-clamp-1 group-hover:text-primary-400 transition-colors font-outfit">{item.title}</h4>
                        <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed">{item.description || "Servicio premium para tu evento."}</p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-primary-400" />{iCity}</span>
                        <span className="text-primary-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                          Ver más <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
