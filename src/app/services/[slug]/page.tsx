import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  Calendar, MapPin, Sparkles, ArrowLeft, ShieldCheck, Clock, MessageSquare, 
  CheckCircle2, AlertTriangle, Users, Award, Star, Zap, ChevronRight, Check, X,
  PhoneCall, Video as VideoIcon, Music, Disc, TrendingUp, Globe, Badge
} from "lucide-react";

import { ServiceGallery } from "@/components/services/ServiceGallery";
import { ServiceBookingWidget } from "@/components/services/ServiceBookingWidget";
import { ServiceStoriesViewer } from "@/components/services/ServiceStoriesViewer";
import { ServiceCalendar } from "@/components/services/ServiceCalendar";
import { ServiceReviewsSection } from "@/components/services/ServiceReviewsSection";
import { ServiceProfileActions } from "@/components/services/ServiceProfileActions";
import { ServicePortfolio } from "@/components/services/ServicePortfolio";
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
    const { data } = await supabase.from("bookings").select("event_date").eq("service_id", service.id).in("status", ["confirmed", "completed"]);
    bookedDates = (data || []).map((b: any) => b.event_date);
  } catch (e) {}

  if (user) {
    try {
      const { data: userBookings } = await supabase.from("bookings").select("id").eq("user_id", user.id).eq("service_id", service.id).in("status", ["confirmed", "completed"]);
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
    music:   { label: "🎵 Música y Shows",         gradient: "from-violet-900 via-purple-900 to-indigo-950",   accent: "violet",  icon: "🎵" },
    sound:   { label: "🔊 Sonido e Iluminación",    gradient: "from-sky-900 via-blue-900 to-slate-950",         accent: "sky",     icon: "🔊" },
    bar:     { label: "🍸 Bar y Coctelería",        gradient: "from-rose-900 via-red-900 to-orange-950",        accent: "rose",    icon: "🍸" },
    media:   { label: "📸 Foto y Contenido",        gradient: "from-fuchsia-900 via-pink-900 to-purple-950",    accent: "fuchsia", icon: "📸" },
    staff:   { label: "👥 Staff y Personal",        gradient: "from-teal-900 via-cyan-900 to-slate-950",        accent: "teal",    icon: "👥" },
    decor:   { label: "🎨 Decoración",              gradient: "from-pink-900 via-fuchsia-900 to-violet-950",    accent: "pink",    icon: "🎨" },
    premium: { label: "⭐ Experiencias VIP",        gradient: "from-amber-900 via-yellow-900 to-orange-950",    accent: "amber",   icon: "⭐" },
    security:{ label: "🛡️ Seguridad",              gradient: "from-slate-800 via-zinc-900 to-neutral-950",     accent: "slate",   icon: "🛡️" },
    catering:{ label: "🍽️ Catering",               gradient: "from-emerald-900 via-green-900 to-teal-950",     accent: "emerald", icon: "🍽️" },
    logistics:{ label: "🪑 Mobiliario",             gradient: "from-stone-800 via-neutral-900 to-zinc-950",     accent: "stone",   icon: "🪑" },
    transport:{ label: "🚗 Transporte",             gradient: "from-blue-900 via-indigo-900 to-slate-950",      accent: "blue",    icon: "🚗" },
    social:  { label: "💍 Bodas y Eventos",         gradient: "from-rose-900 via-pink-900 to-fuchsia-950",      accent: "rose",    icon: "💍" },
  };

  const cat = categoryConfig[service.category] || { label: service.subcategory || "Servicio Especializado", gradient: "from-primary-950 via-violet-950 to-indigo-950", accent: "primary", icon: "✨" };
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
    <div className="relative min-h-screen w-full bg-[#05050a] text-zinc-100 overflow-x-hidden">
      
      {/* ── HERO SECTION ─────────────────────────────────────────────── */}
      <div className="relative w-full">
        {/* Background: cover image OR category gradient */}
        {service.cover_url ? (
          <div className="absolute inset-0 h-[520px]">
            <img src={service.cover_url} alt="Portada" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-[#05050a]" />
          </div>
        ) : (
          <div className={`absolute inset-0 h-[480px] bg-gradient-to-br ${cat.gradient} opacity-70`}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.04)_0%,transparent_60%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#05050a]" />
            {/* Decorative grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
          </div>
        )}

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 pt-8 pb-0">
          
          {/* Back Button */}
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white transition-colors group bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 hover:border-white/20 mb-8"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Volver al Marketplace
          </Link>

          {/* Stories */}
          {stories.length > 0 && (
            <div className="mb-6 bg-black/30 backdrop-blur-md border border-white/5 p-4 rounded-3xl">
              <ServiceStoriesViewer
                serviceName={service.title}
                providerName={providerName}
                avatarUrl={providerAvatar}
                coverUrl={service.image_url}
                stories={stories}
              />
            </div>
          )}

          {/* Main Hero Card */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
            {/* Category + Badges Row */}
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-extrabold uppercase tracking-widest text-white/80">
                {finalCategoryLabel}
              </span>
              {service.verified && (
                <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verificado
                </span>
              )}
              {service.badge_status === "top_provider" && (
                <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-[10px] font-extrabold uppercase tracking-widest text-white">
                  🏆 Top Proveedor
                </span>
              )}
              {service.badge_status === "most_booked" && (
                <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-[10px] font-extrabold uppercase tracking-widest text-white">
                  🔥 Más Reservado
                </span>
              )}
              {service.provider_status && service.provider_status !== "active" && (
                <span className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                  ⚠️ {service.provider_status === "vacation" ? "En Vacaciones" : "Ocupado temporalmente"}
                </span>
              )}
            </div>

            {/* Provider info + Title */}
            <div className="flex flex-col md:flex-row md:items-start gap-5">
              {/* Avatar */}
              <div className="shrink-0">
                {providerAvatar ? (
                  <img
                    src={providerAvatar}
                    alt={providerName}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-xl"
                  />
                ) : (
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-3xl border-2 border-white/15 shadow-xl`}>
                    {cat.icon}
                  </div>
                )}
              </div>

              {/* Title block */}
              <div className="flex-grow min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white font-outfit leading-tight mb-2">
                  {service.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-200">por {providerName}</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary-400" />
                    {providerCity}
                  </span>
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {avgStars.toFixed(1)}
                    <span className="text-zinc-500 font-normal">({reviews.length} reseñas)</span>
                  </span>
                  <span className="flex items-center gap-1 text-zinc-400">
                    <Calendar className="w-3.5 h-3.5 text-primary-400" />
                    {service.completed_bookings_count || totalBookings || 0} eventos
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="shrink-0 md:self-start">
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

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {[
              { icon: <Award className="w-4 h-4 text-primary-400" />, label: "Eventos", value: String(service.completed_bookings_count || 0) },
              { icon: <MessageSquare className="w-4 h-4 text-emerald-400" />, label: "Respuesta", value: service.response_time || "< 1 hora" },
              { icon: <Calendar className="w-4 h-4 text-accent-400" />, label: "Miembro desde", value: memberSince },
              { icon: <Star className="w-4 h-4 text-amber-400" />, label: "Calificación", value: avgStars.toFixed(1) + " ★" },
            ].map((stat, i) => (
              <div key={i} className="bg-black/40 backdrop-blur-md border border-white/8 rounded-2xl p-4 text-center space-y-1">
                <div className="flex justify-center">{stat.icon}</div>
                <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">{stat.label}</p>
                <p className="text-sm font-extrabold text-white font-outfit">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 sm:px-6 md:px-8 pt-8 pb-32 relative z-10">
        
        {/* Gallery (only shown if images exist) */}
        {hasImages && (
          <section className="mb-8">
            <ServiceGallery
              mainImageUrl={service.image_url}
              galleryUrls={galleryUrls}
              serviceTitle={service.title}
            />
          </section>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">

          {/* ── LEFT COLUMN ───────────────────────── */}
          <div className="space-y-6">

            {/* Description */}
            <div className="bg-zinc-900/50 border border-white/6 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 border-b border-white/6 pb-4">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary-400 to-accent-500" />
                <h2 className="text-sm font-extrabold text-white uppercase tracking-widest font-outfit">Descripción Profesional</h2>
              </div>
              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {service.description || "Este proveedor aún no ha escrito una descripción. Contáctalo directamente para conocer más sobre su servicio."}
              </p>

              {/* Includes / Excludes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-white/5">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> ¿Qué incluye?
                  </h3>
                  <ul className="space-y-2">
                    {includesArr.map((item: string, idx: number) => (
                      <li key={idx} className="text-xs text-zinc-400 flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> No incluye
                  </h3>
                  <ul className="space-y-2">
                    {excludesArr.map((item: string, idx: number) => (
                      <li key={idx} className="text-xs text-zinc-500 flex items-start gap-2">
                        <X className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Requirements */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4" /> Requisitos técnicos
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {requirementsArr.map((item: string, idx: number) => (
                    <div key={idx} className="flex gap-2.5 p-3 rounded-xl bg-white/3 border border-white/5 text-xs text-zinc-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Experience */}
            {service.experience && (
              <div className="bg-zinc-900/50 border border-white/6 rounded-3xl p-6 sm:p-8 space-y-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 border-b border-white/6 pb-4">
                  <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary-400 to-accent-500" />
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-widest font-outfit">Experiencia Profesional</h2>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">{service.experience}</p>
              </div>
            )}

            {/* Portfolio */}
            {dbGallery.length > 0 && (
              <section className="bg-zinc-900/50 border border-white/6 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
                <div className="flex items-center gap-2 border-b border-white/6 pb-4 mb-6">
                  <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary-400 to-accent-500" />
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-widest font-outfit">Portfolio & Trabajos</h2>
                </div>
                <ServicePortfolio galleryItems={dbGallery} serviceTitle={service.title} />
              </section>
            )}

            {/* Music embeds */}
            {(spotifyEmbedUrl || soundcloudEmbedUrl || youtubeEmbedUrl) && (
              <div className="bg-zinc-900/50 border border-white/6 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-sm">
                <div className="flex items-center gap-2 border-b border-white/6 pb-4">
                  <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary-400 to-accent-500" />
                  <div>
                    <h2 className="text-sm font-extrabold text-white uppercase tracking-widest font-outfit flex items-center gap-2">
                      <Music className="w-4 h-4 text-primary-400" /> Producciones y Sets
                    </h2>
                    <p className="text-zinc-500 text-xs mt-0.5">Escucha muestras del setlist del proveedor.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {spotifyEmbedUrl && (
                    <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                      <iframe src={spotifyEmbedUrl} width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" className="bg-transparent" />
                    </div>
                  )}
                  {soundcloudEmbedUrl && (
                    <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-zinc-900">
                      <iframe width="100%" height="166" scrolling="no" frameBorder="no" allow="autoplay" src={soundcloudEmbedUrl} />
                    </div>
                  )}
                  {youtubeEmbedUrl && (
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                      <iframe src={youtubeEmbedUrl} title="Demo" className="absolute inset-0 w-full h-full border-none" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Video demo legacy */}
            {videoEmbedUrl && !youtubeEmbedUrl && (
              <div className="bg-zinc-900/50 border border-white/6 rounded-3xl p-6 sm:p-8 space-y-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 border-b border-white/6 pb-4">
                  <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary-400 to-accent-500" />
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-widest font-outfit flex items-center gap-2">
                    <VideoIcon className="w-4 h-4 text-rose-500" /> Video de Demostración
                  </h2>
                </div>
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                  <iframe src={videoEmbedUrl} title="Demo" className="absolute inset-0 w-full h-full border-none" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              </div>
            )}

            {/* Geographic Coverage */}
            <div className="bg-zinc-900/50 border border-white/6 rounded-3xl p-6 sm:p-8 space-y-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 border-b border-white/6 pb-4">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary-400 to-accent-500" />
                <h2 className="text-sm font-extrabold text-white uppercase tracking-widest font-outfit flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary-400" /> Cobertura Geográfica
                </h2>
              </div>
              <p className="text-zinc-400 text-xs sm:text-sm">Ciudades y municipios donde este proveedor presta sus servicios.</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {citiesArr.map((city: string) => (
                  <div key={city} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300 hover:bg-white/8 transition-colors">
                    <MapPin className="w-3.5 h-3.5 text-primary-400" />
                    <span>{city}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability Calendar */}
            <div id="disponibilidad-calendario" className="bg-zinc-900/50 border border-white/6 rounded-3xl overflow-hidden backdrop-blur-sm">
              <ServiceCalendar
                serviceId={service.id}
                manualAvailability={manualAvailability}
                bookings={bookedDates}
              />
            </div>

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div className="bg-zinc-900/50 border border-white/6 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-white/6 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary-400 to-accent-500" />
                    <h2 className="text-sm font-extrabold text-white uppercase tracking-widest font-outfit">Historial de Eventos</h2>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{pastEvents.length} trabajos</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pastEvents.map((work: any) => (
                    <div key={work.id} className="bg-zinc-950/60 border border-white/5 rounded-2xl overflow-hidden group hover:border-white/15 transition-all">
                      {work.media_urls && work.media_urls.length > 0 && (
                        <div className="relative h-40 w-full overflow-hidden bg-zinc-900 shrink-0">
                          <img src={work.media_urls[0]} alt={work.title} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" />
                        </div>
                      )}
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between items-start gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-white font-outfit truncate">{work.title}</h4>
                          <span className="bg-white/5 border border-white/8 px-2 py-0.5 rounded text-[9px] font-bold text-zinc-500 uppercase shrink-0">
                            {new Date(work.event_date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        {work.description && <p className="text-[11px] text-zinc-400 leading-relaxed">{work.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-zinc-900/50 border border-white/6 rounded-3xl overflow-hidden backdrop-blur-sm">
              <ServiceReviewsSection
                serviceId={service.id}
                reviews={reviews}
                user={user}
                eligibleBookingId={eligibleBookingId}
              />
            </div>

          </div>

          {/* ── RIGHT SIDEBAR ─────────────────────── */}
          <aside className="sticky top-24 space-y-4">
            
            {/* Booking Widget */}
            <ServiceBookingWidget
              serviceId={service.id}
              providerId={service.provider_id}
              price={service.price}
              serviceTitle={service.title}
              user={user}
              duration={service.duration || "4 horas"}
              responseTime={service.response_time || "Menos de 1 hora"}
              availabilityStatus={service.availability_status || "available"}
            />

            {/* Direct Contact */}
            <div className="bg-zinc-900/80 border border-white/8 rounded-3xl p-5 space-y-4 backdrop-blur-sm">
              <h4 className="text-[10px] uppercase font-extrabold tracking-widest text-zinc-500 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5" /> Contacto Directo
              </h4>

              {whatsappUrl ? (
                <Link
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <PhoneCall className="w-4 h-4 shrink-0" />
                  Escribir por WhatsApp
                </Link>
              ) : (
                <div className="text-center py-3 border border-dashed border-white/8 rounded-2xl text-zinc-600 text-xs">
                  Sin número de WhatsApp guardado
                </div>
              )}

              {(socialMedia.instagram || socialMedia.facebook) && (
                <div className="pt-3 border-t border-white/5 space-y-2">
                  <span className="text-[9px] uppercase font-bold text-zinc-600 tracking-wider block">Redes Sociales</span>
                  <div className="flex flex-wrap gap-2">
                    {socialMedia.instagram && (
                      <Link href={`https://instagram.com/${socialMedia.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-zinc-300 hover:text-white transition-all text-xs">
                        <span className="text-pink-400 font-bold">@</span>
                        <span>{socialMedia.instagram}</span>
                      </Link>
                    )}
                    {socialMedia.facebook && (
                      <Link href={`https://facebook.com/${socialMedia.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-zinc-300 hover:text-white transition-all text-xs">
                        <span className="text-blue-400 font-bold">f</span>
                        <span>Facebook</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Provider card */}
            <div className="bg-zinc-900/80 border border-white/8 rounded-3xl p-5 space-y-4 backdrop-blur-sm">
              <h4 className="text-[10px] uppercase font-extrabold tracking-widest text-zinc-500">Sobre el Proveedor</h4>
              <div className="flex items-center gap-3">
                {providerAvatar ? (
                  <img src={providerAvatar} alt={providerName} className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                ) : (
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-xl border border-white/10`}>
                    {cat.icon}
                  </div>
                )}
                <div>
                  <p className="font-bold text-sm text-white">{providerName}</p>
                  <p className="text-xs text-zinc-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {providerCity}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="text-center p-3 bg-white/3 border border-white/5 rounded-xl">
                  <p className="text-lg font-extrabold text-white font-outfit">{service.completed_bookings_count || 0}</p>
                  <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wide">Eventos</p>
                </div>
                <div className="text-center p-3 bg-white/3 border border-white/5 rounded-xl">
                  <p className="text-lg font-extrabold text-amber-400 font-outfit">{avgStars.toFixed(1)}★</p>
                  <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wide">Rating</p>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 text-center">Miembro desde {memberSince}</p>
            </div>
          </aside>
        </div>

        {/* Related Services */}
        {relatedServices.length > 0 && (
          <div className="pt-16 space-y-6">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-black text-white uppercase tracking-wider font-outfit whitespace-nowrap">Servicios Similares</h3>
              <div className="h-px bg-gradient-to-r from-white/10 to-transparent flex-grow" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedServices.map((item: any) => {
                const iProvName = (Array.isArray(item.provider) ? item.provider[0]?.full_name : (item.provider as any)?.full_name) || "Proveedor Hangover";
                const iCity = item.base_city || (Array.isArray(item.provider) ? item.provider[0]?.city : (item.provider as any)?.city) || providerCity;
                const iCat = categoryConfig[item.category] || cat;
                return (
                  <Link key={item.id} href={`/services/${item.slug || item.id}`} className="bg-zinc-900/60 border border-white/6 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 flex flex-col group">
                    <div className="relative h-36 w-full overflow-hidden shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-tr ${iCat.gradient} opacity-70 flex items-center justify-center text-3xl`}>
                          {iCat.icon}
                        </div>
                      )}
                      <span className="absolute top-3 right-3 bg-black/80 border border-white/10 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-400">
                        ${item.price?.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-4 flex-grow flex flex-col justify-between gap-3">
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium block mb-1">por {iProvName}</span>
                        <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-primary-400 transition-colors font-outfit">{item.title}</h4>
                        <p className="text-zinc-500 text-xs line-clamp-2 mt-1">{item.description || "Servicio premium para tu evento."}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-zinc-500">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-primary-400" />{iCity}</span>
                        <span className="text-primary-400 font-bold flex items-center gap-0.5">
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
