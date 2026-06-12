import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  Calendar, MapPin, Sparkles, ArrowLeft, ShieldCheck, Clock, MessageSquare, 
  CheckCircle2, AlertTriangle, Users, Award, Star, Zap, Image as ImageIcon, ChevronRight, Check, X,
  PhoneCall, Video as VideoIcon, Music, Disc
} from "lucide-react";

import { ServiceGallery } from "@/components/services/ServiceGallery";
import { ServiceBookingWidget } from "@/components/services/ServiceBookingWidget";
import { ServiceStoriesViewer } from "@/components/services/ServiceStoriesViewer";
import { ServiceCalendar } from "@/components/services/ServiceCalendar";
import { ServiceReviewsSection } from "@/components/services/ServiceReviewsSection";
import { ServiceProfileActions } from "@/components/services/ServiceProfileActions";
import { ServicePortfolio } from "@/components/services/ServicePortfolio";
import { slugify } from "@/lib/slugify";

export const revalidate = 0; // Dynamic route

interface ServiceDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Helper to check and parse video URL to embedded format
function getEmbedUrl(url: string) {
  if (!url) return null;
  
  // YouTube regex
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const ytMatch = url.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  
  // Vimeo regex
  const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/i;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  
  return null;
}

// Convert standard spotify share link to embed link
function getSpotifyEmbedUrl(url: string) {
  if (!url) return null;
  const regex = /open\.spotify\.com\/(playlist|track|album|artist)\/([a-zA-Z0-9]+)/i;
  const match = url.match(regex);
  if (match) {
    return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
  }
  return null;
}

// SoundCloud embed builder
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
      .select(`
        *,
        provider:profiles!services_provider_id_fkey (
          id,
          full_name,
          city,
          created_at,
          avatar_url
        )
      `)
      .eq("id", identifier)
      .maybeSingle();
    service = data;
  }

  if (!service) {
    const { data } = await supabase
      .from("services")
      .select(`
        *,
        provider:profiles!services_provider_id_fkey (
          id,
          full_name,
          city,
          created_at,
          avatar_url
        )
      `)
      .eq("slug", identifier)
      .maybeSingle();
    
    service = data;
  }

  // Double fallback: slugify check
  if (!service) {
    const { data: allServices } = await supabase
      .from("services")
      .select(`
        *,
        provider:profiles!services_provider_id_fkey (
          id,
          full_name,
          city,
          created_at,
          avatar_url
        )
      `);
    
    if (allServices) {
      service = allServices.find((s) => s.slug === identifier || slugify(s.title) === identifier) || null;
    }
  }

  if (!service) {
    notFound();
  }

  // ----------------------------------------------------------------
  // Fetch Professional Profile details (Graceful Try/Catches)
  // ----------------------------------------------------------------
  let stories: any[] = [];
  let dbGallery: any[] = [];
  let pastEvents: any[] = [];
  let reviews: any[] = [];
  let manualAvailability: any[] = [];
  let bookedDates: string[] = [];
  let eligibleBookingId: string | null = null;

  try {
    const { data } = await supabase
      .from("service_stories")
      .select("*")
      .eq("service_id", service.id)
      .eq("active", true)
      .order("display_order", { ascending: true });
    stories = data || [];
  } catch (e) {
    console.warn("Table service_stories not found/ready:", e);
  }

  try {
    const { data } = await supabase
      .from("service_gallery_items")
      .select("*")
      .eq("service_id", service.id)
      .eq("active", true)
      .order("display_order", { ascending: true });
    dbGallery = data || [];
  } catch (e) {
    console.warn("Table service_gallery_items not found/ready:", e);
  }

  try {
    const { data } = await supabase
      .from("service_past_events")
      .select("*")
      .eq("service_id", service.id)
      .order("event_date", { ascending: false });
    pastEvents = data || [];
  } catch (e) {
    console.warn("Table service_past_events not found/ready:", e);
  }

  try {
    const { data } = await supabase
      .from("service_reviews")
      .select(`
        *,
        user:profiles!service_reviews_user_id_fkey (
          full_name,
          avatar_url
        )
      `)
      .eq("service_id", service.id)
      .order("created_at", { ascending: false });
    reviews = data || [];
  } catch (e) {
    console.warn("Table service_reviews not found/ready:", e);
  }

  try {
    const { data } = await supabase
      .from("service_availability")
      .select("date, status, notes")
      .eq("service_id", service.id);
    manualAvailability = data || [];
  } catch (e) {
    console.warn("Table service_availability not found/ready:", e);
  }

  try {
    const { data } = await supabase
      .from("bookings")
      .select("event_date")
      .eq("service_id", service.id)
      .in("status", ["confirmed", "completed"]);
    bookedDates = (data || []).map((b: any) => b.event_date);
  } catch (e) {
    console.warn("Error querying booked dates from bookings:", e);
  }

  // Check review eligibility
  if (user) {
    try {
      const { data: userBookings } = await supabase
        .from("bookings")
        .select("id")
        .eq("user_id", user.id)
        .eq("service_id", service.id)
        .in("status", ["confirmed", "completed"]);

      if (userBookings && userBookings.length > 0) {
        const bookingIds = userBookings.map((b) => b.id);
        const { data: userReviews } = await supabase
          .from("service_reviews")
          .select("booking_id")
          .in("booking_id", bookingIds);

        const reviewedIds = (userReviews || []).map((r) => r.booking_id);
        const unreviewed = userBookings.find((b) => !reviewedIds.includes(b.id));

        if (unreviewed) {
          eligibleBookingId = unreviewed.id;
        }
      }
    } catch (e) {
      console.warn("Error verifying review eligibility:", e);
    }
  }

  // Query bookings count for this service
  const { count: bookingsCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("service_id", service.id);

  const totalBookings = bookingsCount || 0;

  // Format response details & fallbacks
  const provider = service.provider;
  const providerName = (Array.isArray(provider) ? provider[0]?.full_name : (provider as any)?.full_name) || "Proveedor Hangover";
  const providerCity = service.base_city || (Array.isArray(provider) ? provider[0]?.city : (provider as any)?.city) || "Barranquilla";
  const providerAvatar = (Array.isArray(provider) ? provider[0]?.avatar_url : (provider as any)?.avatar_url) || null;
  const providerCreatedAt = (Array.isArray(provider) ? provider[0]?.created_at : (provider as any)?.created_at) || service.created_at;
  
  const memberSinceDate = new Date(providerCreatedAt);
  const memberSince = memberSinceDate.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric"
  });

  // Safe parse array fields
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

  // Gallery array
  const galleryUrls = service.gallery_urls || [];

  // Badges array based on database fields
  const badges = [];
  if (service.verified) {
    badges.push({
      text: "✓ Verificado",
      className: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
    });
  }
  if (service.badge_status === "top_provider") {
    badges.push({
      text: "🏆 Top Proveedor",
      className: "bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-none shadow-[0_0_12px_rgba(245,158,11,0.2)]"
    });
  } else if (service.badge_status === "most_booked") {
    badges.push({
      text: "🔥 Más Reservado",
      className: "bg-gradient-to-r from-rose-500 to-orange-500 text-white border-none shadow-[0_0_12px_rgba(244,63,94,0.2)]"
    });
  } else if (service.badge_status === "featured") {
    badges.push({
      text: "⭐ Destacado",
      className: "bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white border-none shadow-[0_0_12px_rgba(168,85,247,0.2)]"
    });
  }

  // Generate category label fallback
  let categoryLabel = "Servicio Especializado";
  if (service.category === "music") categoryLabel = "🎵 Música y Entretenimiento";
  else if (service.category === "sound") categoryLabel = "🔊 Sonido e Iluminación";
  else if (service.category === "bar") categoryLabel = "🍸 Bar y Bebidas";
  else if (service.category === "catering") categoryLabel = "🍽️ Catering y Comida";
  else if (service.category === "decor") categoryLabel = "🎈 Decoración y Ambientación";
  else if (service.category === "logistics") categoryLabel = "🪑 Mobiliario y Logística";
  else if (service.category === "staff") categoryLabel = "👨‍🍳 Personal de Servicio";
  else if (service.category === "security") categoryLabel = "🛡️ Seguridad";
  else if (service.category === "media") categoryLabel = "📸 Foto y Video";
  else if (service.category === "transport") categoryLabel = "🚗 Transporte";
  else if (service.category === "social") categoryLabel = "💍 Bodas y Eventos Sociales";
  else if (service.category === "premium") categoryLabel = "⭐ Experiencias Premium";

  const finalCategoryLabel = service.subcategory || categoryLabel;

  // Query related services
  const { data: relatedServicesData } = await supabase
    .from("services")
    .select(`
      *,
      provider:profiles!services_provider_id_fkey (
        full_name,
        city
      )
    `)
    .neq("id", service.id)
    .or(`category.eq.${service.category},provider_id.in.(select id from profiles where city.eq.${providerCity})`)
    .limit(4);

  const relatedServices = relatedServicesData || [];

  const videoEmbedUrl = getEmbedUrl(service.video_url || "");
  const youtubeEmbedUrl = getEmbedUrl(service.youtube_url || "");
  const spotifyEmbedUrl = getSpotifyEmbedUrl(service.spotify_url || "");
  const soundcloudEmbedUrl = getSoundCloudEmbedUrl(service.soundcloud_url || "");

  const whatsappUrl = service.whatsapp_number
    ? `https://wa.me/${service.whatsapp_number}?text=${encodeURIComponent(`Hola, estoy interesado en tu perfil profesional "${service.title}" en Hangover.`)}`
    : null;

  const socialMedia = (service.social_media as any) || {};

  // Custom average rating
  const avgStars = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
    : (Number(service.average_rating) || 5.0);

  return (
    <div className="relative min-h-screen w-full bg-[#05050a] text-zinc-100 pb-28 md:pb-20 overflow-hidden">
      {/* Neon glow grids */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-primary-950/10 rounded-full blur-[140px] mix-blend-screen" />
        <div className="absolute bottom-1/3 right-1/4 w-[450px] h-[450px] bg-accent-950/10 rounded-full blur-[140px] mix-blend-screen" />
      </div>

      {/* Cover Banner (Hero Portada) */}
      {service.cover_url && (
        <div className="relative w-full h-[320px] md:h-[420px] overflow-hidden border-b border-white/5 shrink-0 z-0">
          <img 
            src={service.cover_url} 
            alt="Portada del Servicio"
            className="w-full h-full object-cover scale-[1.01] brightness-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05050a] via-black/30 to-black/10" />
        </div>
      )}

      <div className={`container mx-auto px-4 sm:px-6 md:px-8 py-6 relative z-10 space-y-6 ${service.cover_url ? "-mt-24 md:-mt-36" : ""}`}>
        
        {/* Back Button */}
        <div className="flex justify-between items-center flex-wrap gap-3">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white transition-colors group bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Volver al Marketplace
          </Link>
        </div>

        {/* Stories Section (Horizontal Bubble List) */}
        {stories.length > 0 && (
          <div className="bg-zinc-950/30 border border-white/5 p-4 rounded-3xl backdrop-blur-md">
            <ServiceStoriesViewer
              serviceName={service.title}
              providerName={providerName}
              avatarUrl={providerAvatar}
              coverUrl={service.image_url}
              stories={stories}
            />
          </div>
        )}

        {/* Hero title & badges */}
        <div className="space-y-4 bg-black/45 backdrop-blur-md p-6 rounded-3xl border border-white/5 shadow-2xl">
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full bg-primary-500/20 border border-primary-500/30 text-[9px] font-extrabold uppercase tracking-wider text-primary-400">
              {finalCategoryLabel}
            </span>
            {badges.map((b, idx) => (
              <span
                key={idx}
                className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${b.className}`}
              >
                {b.text}
              </span>
            ))}
            
            {service.provider_status && service.provider_status !== 'active' && (
              <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border bg-amber-500/10 border-amber-500/20 text-amber-400`}>
                ⚠️ {service.provider_status === 'vacation' ? 'En Vacaciones' : service.provider_status === 'busy' ? 'Ocupado' : 'Fuera de Servicio'}
              </span>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 flex items-start gap-4">
              {providerAvatar ? (
                <img src={providerAvatar} alt={providerName} className="w-16 h-16 rounded-full object-cover border-2 border-primary-500/40 shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-650 flex items-center justify-center text-white text-xl font-bold font-outfit shrink-0 border-2 border-primary-500/40">
                  {providerName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white font-outfit leading-none">
                  {service.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400 mt-2">
                  <span className="font-bold text-zinc-300">Ofrecido por {providerName}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700 hidden sm:inline" />
                  <span className="flex items-center gap-0.5">📍 {providerCity}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700 hidden sm:inline" />
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    ★ {avgStars.toFixed(1)} ({reviews.length})
                  </span>
                </div>
              </div>
            </div>

            {/* Public Action Buttons */}
            <div className="shrink-0">
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

        {/* Dynamic Image Gallery Banner (Airbnb format) */}
        <section>
          <ServiceGallery 
            mainImageUrl={service.image_url} 
            galleryUrls={galleryUrls} 
            serviceTitle={service.title} 
          />
        </section>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start pt-4">
          
          {/* Left Details Grid */}
          <div className="space-y-8">
            
            {/* Description Card */}
            <div className="bg-zinc-950/40 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6">
              <h2 className="text-lg font-bold text-white font-outfit uppercase tracking-widest text-primary-400">Descripción Profesional</h2>
              <p className="text-zinc-350 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {service.description || "Este proveedor no ha especificado una descripción detallada de su servicio. Contáctalo directamente para ajustar detalles del show."}
              </p>

              {/* Grid of details: Includes, excludes, requirements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                {/* Includes */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ¿Qué incluye?
                  </h3>
                  <ul className="space-y-2">
                    {includesArr.map((item: string, index: number) => (
                      <li key={index} className="text-xs text-zinc-450 flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Excludes */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    No incluye
                  </h3>
                  <ul className="space-y-2">
                    {excludesArr.map((item: string, index: number) => (
                      <li key={index} className="text-xs text-zinc-455 flex items-start gap-2">
                        <X className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Requirements */}
              <div className="pt-6 border-t border-white/5 space-y-3">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Requisitos técnicos del proveedor
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {requirementsArr.map((item: string, index: number) => (
                    <div key={index} className="flex gap-2.5 p-3 rounded-xl bg-white/3 border border-white/5 text-xs text-zinc-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* EXPERIENCE CARD */}
            {service.experience && (
              <div className="bg-zinc-950/40 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-4">
                <h2 className="text-lg font-bold text-white font-outfit uppercase tracking-widest text-primary-400">Experiencia Profesional</h2>
                <p className="text-zinc-350 text-sm leading-relaxed whitespace-pre-line">
                  {service.experience}
                </p>
              </div>
            )}

            {/* PORTFOLIO MULTIMEDIA (Videos first, then photos) */}
            {dbGallery.length > 0 && (
              <section className="bg-zinc-950/40 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md">
                <ServicePortfolio
                  galleryItems={dbGallery}
                  serviceTitle={service.title}
                />
              </section>
            )}

            {/* PRODUCTIONS & MUSIC (Spotify / SoundCloud / YouTube Embeds) */}
            {(spotifyEmbedUrl || soundcloudEmbedUrl || youtubeEmbedUrl) && (
              <div className="bg-zinc-950/40 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white font-outfit uppercase tracking-widest text-primary-400 flex items-center gap-2">
                    <Music className="w-5 h-5 text-primary-450" />
                    Producciones y Sets
                  </h2>
                  <p className="text-zinc-450 text-xs mt-1">Oye y evalúa muestras del setlist del proveedor.</p>
                </div>

                <div className="space-y-4">
                  {spotifyEmbedUrl && (
                    <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                      <iframe 
                        src={spotifyEmbedUrl}
                        width="100%" 
                        height="152" 
                        frameBorder="0" 
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                        loading="lazy"
                        className="bg-transparent"
                      />
                    </div>
                  )}

                  {soundcloudEmbedUrl && (
                    <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-zinc-900">
                      <iframe 
                        width="100%" 
                        height="166" 
                        scrolling="no" 
                        frameBorder="no" 
                        allow="autoplay" 
                        src={soundcloudEmbedUrl} 
                      />
                    </div>
                  )}

                  {youtubeEmbedUrl && (
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
                        <VideoIcon className="w-3.5 h-3.5 text-red-500" /> Grabación de YouTube / Video Demo
                      </span>
                      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                        <iframe
                          src={youtubeEmbedUrl}
                          title="Demostración de Producción"
                          className="absolute inset-0 w-full h-full border-none"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIDEO DEMO SECTION (LEGACY COVERAGE SUPPORT) */}
            {videoEmbedUrl && !youtubeEmbedUrl && (
              <div className="bg-zinc-950/40 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-4">
                <h2 className="text-lg font-bold text-white font-outfit uppercase tracking-widest text-primary-400 flex items-center gap-2">
                  <VideoIcon className="w-4 h-4 text-rose-500" />
                  Video de Demostración
                </h2>
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                  <iframe
                    src={videoEmbedUrl}
                    title="Demostración del Servicio"
                    className="absolute inset-0 w-full h-full border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* GEOGRAPHIC COVERAGE */}
            <div className="bg-zinc-950/40 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-4">
              <h2 className="text-lg font-bold text-white font-outfit uppercase tracking-widest text-primary-400">Cobertura Geográfica</h2>
              <p className="text-zinc-400 text-xs sm:text-sm">
                Ciudades y municipios donde este proveedor presta sus servicios para eventos.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {citiesArr.map((city: string) => (
                  <div key={city} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300">
                    <MapPin className="w-3.5 h-3.5 text-primary-400" />
                    <span>{city}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistics Dashboard */}
            <div className="bg-zinc-950/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md">
              <h2 className="text-lg font-bold text-white font-outfit uppercase tracking-widest text-primary-400 mb-6">Métricas de Reputación</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white/3 border border-white/5 rounded-2xl text-center space-y-1">
                  <Award className="w-5 h-5 text-primary-400 mx-auto" />
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Eventos Realizados</p>
                  <p className="text-xl font-extrabold text-white font-outfit">{service.completed_bookings_count || 12}</p>
                </div>

                <div className="p-4 bg-white/3 border border-white/5 rounded-2xl text-center space-y-1">
                  <MessageSquare className="w-5 h-5 text-emerald-400 mx-auto" />
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Tiempo Respuesta</p>
                  <p className="text-xl font-extrabold text-white font-outfit">{service.response_time || "Menos de 1 h"}</p>
                </div>

                <div className="p-4 bg-white/3 border border-white/5 rounded-2xl text-center space-y-1">
                  <Calendar className="w-5 h-5 text-accent-400 mx-auto" />
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Miembro Desde</p>
                  <p className="text-sm font-bold text-white font-outfit py-1">{memberSince}</p>
                </div>

                <div className="p-4 bg-white/3 border border-white/5 rounded-2xl text-center space-y-1">
                  <Star className="w-5 h-5 text-amber-400 mx-auto" />
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Calificación Promedio</p>
                  <p className="text-xl font-extrabold text-white font-outfit">{avgStars.toFixed(1)}</p>
                </div>
              </div>
            </div>

            {/* SECCIÓN DISPONIBILIDAD (Calendario Interactivo) */}
            <div id="disponibilidad-calendario">
              <ServiceCalendar
                serviceId={service.id}
                manualAvailability={manualAvailability}
                bookings={bookedDates}
              />
            </div>

            {/* SECCIÓN TRABAJOS REALIZADOS (Historial de Eventos Pasados) */}
            {pastEvents.length > 0 && (
              <div className="bg-zinc-950/40 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h2 className="text-lg font-bold text-white font-outfit uppercase tracking-widest text-primary-400">Historial de Eventos</h2>
                  <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Trabajos realizados</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pastEvents.map((work) => (
                    <div key={work.id} className="glass-card overflow-hidden bg-[#0a0a14]/60 border border-white/5 flex flex-col h-full group">
                      {work.media_urls && work.media_urls.length > 0 && (
                        <div className="relative h-44 w-full overflow-hidden bg-zinc-900 shrink-0">
                          <img
                            src={work.media_urls[0]}
                            alt={work.title}
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between items-start gap-1 flex-wrap">
                            <h4 className="font-bold text-sm text-white font-outfit truncate">{work.title}</h4>
                            <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[8.5px] font-bold text-zinc-450 uppercase">
                              {new Date(work.event_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          {work.description && (
                            <p className="text-[11px] text-zinc-400 leading-relaxed pt-1.5">
                              {work.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECCIÓN RESEÑAS VERIFICADAS */}
            <ServiceReviewsSection
              serviceId={service.id}
              reviews={reviews}
              user={user}
              eligibleBookingId={eligibleBookingId}
            />

          </div>

          {/* Right Sticky Sidebar Widget */}
          <aside className="sticky top-24 space-y-6">
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

            {/* Direct contact and socials sidebar panel */}
            <div className="glass-card p-6 bg-[#09090f]/90 border border-white/10 space-y-4 shadow-xl">
              <h4 className="text-xs uppercase font-extrabold tracking-widest text-zinc-500">Contacto Directo</h4>
              
              {whatsappUrl ? (
                <Link
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <PhoneCall className="w-4 h-4 shrink-0" />
                  Escribir por WhatsApp
                </Link>
              ) : (
                <div className="text-center py-2.5 border border-dashed border-white/5 rounded-xl text-zinc-500 text-xs">
                  Sin número de WhatsApp guardado.
                </div>
              )}

              {/* Social networks section */}
              {(socialMedia.instagram || socialMedia.facebook) && (
                <div className="pt-2.5 border-t border-white/5 space-y-2">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider block">Redes Sociales</span>
                  <div className="flex flex-wrap gap-2">
                    {socialMedia.instagram && (
                      <Link
                        href={`https://instagram.com/${socialMedia.instagram.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-350 hover:text-white transition-all text-xs"
                      >
                        <span className="text-pink-400 font-bold">@</span>
                        <span>{socialMedia.instagram}</span>
                      </Link>
                    )}
                    {socialMedia.facebook && (
                      <Link
                        href={`https://facebook.com/${socialMedia.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-350 hover:text-white transition-all text-xs"
                      >
                        <span className="text-blue-400 font-bold">f</span>
                        <span>Facebook</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* RELATED SERVICES SECTION */}
        {relatedServices.length > 0 && (
          <div className="pt-16 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white uppercase tracking-wider font-outfit">Servicios Recomendados</h3>
              <div className="h-px bg-white/10 flex-grow ml-4" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedServices.map((item) => {
                const itemProviderRaw = item.provider;
                const itemProviderName = (Array.isArray(itemProviderRaw) ? itemProviderRaw[0]?.full_name : (itemProviderRaw as any)?.full_name) || "Proveedor Hangover";
                const itemCity = item.base_city || (Array.isArray(itemProviderRaw) ? itemProviderRaw[0]?.city : (itemProviderRaw as any)?.city) || providerCity;
                
                let cardGradient = "from-purple-600 to-indigo-600";
                if (item.category === "bar") cardGradient = "from-rose-600 to-amber-600";
                if (item.category === "staff") cardGradient = "from-sky-600 to-teal-600";
                if (item.category === "security") cardGradient = "from-slate-600 to-zinc-700";
                if (item.category === "catering") cardGradient = "from-emerald-600 to-lime-600";

                return (
                  <div key={item.id} className="glass-card overflow-hidden hover:border-white/20 transition-all duration-300 flex flex-col h-full bg-[#07070c]/90 group">
                    <div className="relative h-36 w-full bg-zinc-950 overflow-hidden shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-tr ${cardGradient} opacity-60 flex items-center justify-center`}>
                          <Sparkles className="w-10 h-10 text-white/30" />
                        </div>
                      )}
                      <span className="absolute top-3 right-3 bg-black/85 border border-white/10 px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-400">
                        ${item.price}
                      </span>
                    </div>
                    <div className="p-4 flex-grow flex flex-col justify-between space-y-4">
                      <div className="space-y-1">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium block">Por {itemProviderName}</span>
                        <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-primary-400 transition-colors font-outfit">
                          <Link href={`/services/${item.slug || item.id}`}>
                            {item.title}
                          </Link>
                        </h4>
                        <p className="text-zinc-400 text-xs line-clamp-2 min-h-[32px]">
                          {item.description || "Servicio premium garantizado para tu noche perfecta."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[10px] text-zinc-400">
                        <span className="truncate">📍 {itemCity}</span>
                        <Link
                          href={`/services/${item.slug || item.id}`}
                          className="text-primary-400 font-bold shrink-0 hover:underline flex items-center gap-0.5"
                        >
                          Ver Detalles
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
    </div>
  );
}
