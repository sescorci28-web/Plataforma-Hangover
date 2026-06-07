import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  Calendar, MapPin, Sparkles, ArrowLeft, ShieldCheck, Clock, MessageSquare, 
  CheckCircle2, AlertTriangle, Users, Award, Star, Zap, Image, ChevronRight, Check, X,
  PhoneCall, Video as VideoIcon
} from "lucide-react";

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

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
import { ServiceGallery } from "@/components/services/ServiceGallery";
import { ServiceBookingWidget } from "@/components/services/ServiceBookingWidget";
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

  // Override with exact subcategory if saved
  const finalCategoryLabel = service.subcategory || categoryLabel;

  // Mock Trabajos Realizados based on category for maximum premium aesthetics
  const completedWorksMock = [
    {
      title: "Pool Party VIP - Hotel del Prado",
      location: "Barranquilla, Atlántico",
      date: "Hace 2 semanas",
      description: "Servicio completo para 150 personas con ambientación musical personalizada y equipamiento de alta fidelidad.",
      image: "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?auto=format&fit=crop&w=600&q=80"
    },
    {
      title: "Matrimonio Campestre - Cabaña Las Palmas",
      location: "Puerto Colombia",
      date: "Hace 1 mes",
      description: "Coordinación y ejecución técnica impecable durante más de 6 horas continuas de servicio premium.",
      image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80"
    },
    {
      title: "Lanzamiento Corporativo - Discoteca Black Box",
      location: "Zona Norte, Barranquilla",
      date: "Hace 2 meses",
      description: "Montaje audiovisual, sonido inmersivo y logística de staff coordinados para evento de marca privada.",
      image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80"
    }
  ];

  // Query related services (max 4, excluding current service, matching category or city)
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
  const whatsappUrl = service.whatsapp_number
    ? `https://wa.me/${service.whatsapp_number}?text=${encodeURIComponent(`Hola, estoy interesado en tu servicio "${service.title}" publicado en Hangover.`)}`
    : null;

  const socialMedia = (service.social_media as any) || {};

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
        <div>
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white transition-colors group bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Volver al Marketplace
          </Link>
        </div>

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

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-outfit leading-none">
                {service.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                <span className="font-semibold text-zinc-300">Ofrecido por {providerName}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 hidden sm:inline" />
                <span className="flex items-center gap-1">📍 {providerCity}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Image Gallery */}
        <section>
          <ServiceGallery 
            mainImageUrl={service.image_url} 
            galleryUrls={galleryUrls} 
            serviceTitle={service.title} 
          />
        </section>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start pt-6">
          {/* Left Details Grid */}
          <div className="space-y-10">
            {/* Description Card */}
            <div className="bg-zinc-950/40 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6">
              <h2 className="text-lg font-bold text-white font-outfit uppercase tracking-widest text-primary-400">Descripción del Servicio</h2>
              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
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
                      <li key={index} className="text-xs text-zinc-400 flex items-start gap-2">
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
                      <li key={index} className="text-xs text-zinc-400 flex items-start gap-2">
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
                <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
                  {service.experience}
                </p>
              </div>
            )}

            {/* VIDEO SECTION */}
            {videoEmbedUrl ? (
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
            ) : service.video_url ? (
              <div className="bg-zinc-950/40 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-4">
                <h2 className="text-lg font-bold text-white font-outfit uppercase tracking-widest text-primary-400 flex items-center gap-2">
                  <VideoIcon className="w-4 h-4 text-rose-500" />
                  Video de Demostración
                </h2>
                <Link
                  href={service.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-4 rounded-xl bg-white/5 border border-white/10 text-primary-400 hover:text-white transition-colors"
                >
                  <YoutubeIcon className="w-6 h-6 text-red-500" />
                  <span className="text-sm font-semibold">Ver Video de Demostración (Enlace Externo)</span>
                </Link>
              </div>
            ) : null}

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
                  <p className="text-xl font-extrabold text-white font-outfit">{(Number(service.average_rating) || 5.0).toFixed(1)}</p>
                </div>
              </div>
            </div>

            {/* SECCIÓN TRABAJOS REALIZADOS */}
            <div className="bg-zinc-950/40 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white font-outfit uppercase tracking-widest text-primary-400">Trabajos Realizados</h2>
                <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Historial Reciente</span>
              </div>
              <p className="text-zinc-400 text-xs sm:text-sm">
                Proyectos y contrataciones completadas de manera exitosa a través de la plataforma Hangover.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {completedWorksMock.map((work, index) => (
                  <div key={index} className="glass-card overflow-hidden bg-[#0a0a14]/60 border border-white/5 flex flex-col h-full group">
                    <div className="relative h-36 w-full overflow-hidden bg-zinc-900 shrink-0">
                      <img
                        src={work.image}
                        alt={work.title}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                      />
                      <span className="absolute bottom-2.5 left-2.5 bg-black/70 border border-white/10 px-2 py-0.5 rounded-md text-[9px] font-bold text-zinc-300">
                        {work.date}
                      </span>
                    </div>
                    <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-white line-clamp-1 group-hover:text-primary-400 transition-colors font-outfit">
                          {work.title}
                        </h4>
                        <p className="text-[10px] text-zinc-500 flex items-center gap-1">📍 {work.location}</p>
                        <p className="text-[11px] text-zinc-400 line-clamp-3 leading-relaxed mt-1">
                          {work.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                  <div className="flex gap-2">
                    {socialMedia.instagram && (
                      <Link
                        href={`https://instagram.com/${socialMedia.instagram.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-350 hover:text-white transition-all text-xs"
                      >
                        <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
                        <span>@{socialMedia.instagram}</span>
                      </Link>
                    )}
                    {socialMedia.facebook && (
                      <Link
                        href={`https://facebook.com/${socialMedia.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-350 hover:text-white transition-all text-xs"
                      >
                        <FacebookIcon className="w-3.5 h-3.5 text-blue-400" />
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

                const subLabel = item.subcategory || item.category;

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
