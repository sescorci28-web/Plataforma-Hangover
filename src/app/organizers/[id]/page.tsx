import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Share2, MapPin, Star, Calendar, CheckCircle2, Heart, 
  ExternalLink, Sparkles, Clock, Eye, Video, Image as ImageIcon, Briefcase, Award, User
} from "lucide-react";
import { getOrganizerById, OrganizerProfile } from "@/data/mockOrganizers";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

interface OrganizerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrganizerDetailPage({ params }: OrganizerPageProps) {
  const { id } = await params;
  
  // 1. Intentar obtener organizador estático mock (ej. org-1)
  const mockOrg = getOrganizerById(id);

  let organizer: OrganizerProfile | null = mockOrg;

  // 2. Si no es un mock, consultar public.profiles en Supabase por ID
  if (!organizer && id) {
    try {
      const supabase = await createClient();
      const { data: dbProfile } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, city, role, provider_type, bio, is_verified")
        .eq("id", id)
        .maybeSingle();

      if (dbProfile) {
        const displayName = dbProfile.full_name || (dbProfile.username ? `@${dbProfile.username}` : 'Usuario Hangover');
        const displayCompany = dbProfile.username ? `@${dbProfile.username}` : (dbProfile.provider_type || dbProfile.role || 'Usuario Registrado');
        const userBio = dbProfile.bio || 'Perfil oficial en la plataforma Hangover.';

        organizer = {
          id: dbProfile.id,
          name: displayName,
          companyName: displayCompany,
          bio: userBio,
          fullBio: userBio,
          avatarUrl: dbProfile.avatar_url || '',
          bannerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80',
          rating: 5.0,
          reviewsCount: 0,
          eventsCount: 0,
          followersCount: 0,
          verified: !!dbProfile.is_verified,
          yearsOfExperience: 1,
          city: dbProfile.city || 'Ciudad no especificada',
          eventTypes: [dbProfile.provider_type || dbProfile.role || 'Usuario'],
          socials: {
            instagram: dbProfile.username || undefined,
          },
          pastEvents: [],
          media: [],
          gallery: [],
          upcomingEvents: [],
        };
      }
    } catch (err) {
      console.error("Error cargando perfil desde Supabase:", err);
    }
  }

  if (!organizer) {
    notFound();
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="relative min-h-screen w-full bg-[#020205] text-zinc-100 pb-24 font-sans overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-[600px] h-[600px] bg-primary-950/20 rounded-full blur-[180px] mix-blend-screen" />
        <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-indigo-950/20 rounded-full blur-[180px] mix-blend-screen" />
      </div>

      {/* ── HERO BANNER & HEADER ── */}
      <section className="relative h-[40vh] md:h-[50vh] w-full bg-zinc-950 overflow-hidden">
        <img
          src={organizer.bannerUrl}
          alt={organizer.name}
          className="w-full h-full object-cover opacity-40 filter blur-[4px] scale-105 select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020205] via-[#020205]/40 to-black/60 z-10" />

        {/* Back Button */}
        <div className="absolute top-6 left-6 z-30">
          <Link
            href="/events"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-zinc-300 hover:text-white transition-all shadow-lg hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        {/* Hero Meta Info */}
        <div className="absolute bottom-6 left-0 right-0 z-20 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 border-primary-600/80 shadow-[0_0_30px_rgba(99,102,241,0.5)] shrink-0 bg-zinc-900">
              {organizer.avatarUrl ? (
                <img src={organizer.avatarUrl} alt={organizer.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-950/80 text-zinc-400">
                  <User className="w-12 h-12" />
                </div>
              )}
            </div>

            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-outfit tracking-tight leading-none">
                  {organizer.name}
                </h1>
                {organizer.verified && (
                  <CheckCircle2 className="w-6 h-6 text-primary-400 fill-primary-600/30" />
                )}
              </div>
              
              <p className="text-xs sm:text-sm font-bold text-primary-400">{organizer.companyName}</p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-zinc-500" /> {organizer.city}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                <span className="flex items-center gap-1 font-bold text-amber-400"><Star className="w-3.5 h-3.5 fill-amber-400" /> {organizer.rating} ({organizer.reviewsCount} reseñas)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                <span className="font-bold text-emerald-400">{formatNumber(organizer.followersCount)} Seguidores</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <button className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-105">
                <Heart className="w-4 h-4" /> Seguir Productora
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTENT CONTAINER ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8 relative z-20 space-y-10">
        
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-950/40 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Eventos Producidos</span>
            <span className="text-xl font-black text-white block mt-0.5">{organizer.eventsCount} Eventos</span>
          </div>
          <div className="bg-zinc-950/40 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Trayectoria</span>
            <span className="text-xl font-black text-white block mt-0.5">{organizer.yearsOfExperience} Años</span>
          </div>
          <div className="bg-zinc-950/40 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Valoración General</span>
            <span className="text-xl font-black text-amber-400 block mt-0.5">★ {organizer.rating}</span>
          </div>
          <div className="bg-zinc-950/40 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Comunidad</span>
            <span className="text-xl font-black text-emerald-400 block mt-0.5">{formatNumber(organizer.followersCount)} Fans</span>
          </div>
        </div>

        {/* Grid Layout: Main & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          
          {/* Main Column */}
          <div className="space-y-8">
            
            {/* Próximos Eventos */}
            <div className="bg-zinc-950/30 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-primary-400 font-outfit uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Próximos Eventos en Cartelera ({organizer.upcomingEvents.length})
                </h3>
              </div>

              {organizer.upcomingEvents.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No hay eventos futuros agendados en este momento.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {organizer.upcomingEvents.map((evt) => (
                    <Link
                      key={evt.eventId}
                      href={`/events/${evt.eventId}`}
                      className="group block p-4 rounded-2xl bg-[#07070c]/80 border border-white/5 hover:border-primary-500/30 transition-all space-y-3"
                    >
                      <div className="relative h-36 rounded-xl overflow-hidden border border-white/10">
                        <img src={evt.imageUrl} alt={evt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-white text-base font-outfit group-hover:text-primary-300 transition-colors">{evt.title}</h4>
                        <p className="text-xs text-emerald-400 font-bold">{evt.date}</p>
                        <p className="text-[11px] text-zinc-400 flex items-center gap-1"><MapPin className="w-3 h-3 text-zinc-500" /> {evt.location}</p>
                      </div>
                      <div className="pt-2 flex items-center justify-between border-t border-white/5">
                        <span className="text-xs text-zinc-300 font-bold">Desde ${evt.priceFrom.toLocaleString('es-CO')}</span>
                        <span className="text-[11px] font-bold text-primary-400 group-hover:translate-x-1 transition-transform">Ver Evento →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Eventos Realizados / Historial */}
            <div className="bg-zinc-950/30 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-primary-400 font-outfit uppercase tracking-widest flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" /> Historial de Eventos Realizados ({organizer.pastEvents.length})
                </h3>
              </div>

              {organizer.pastEvents.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No hay historial registrado aún.</p>
              ) : (
                <div className="space-y-3">
                  {organizer.pastEvents.map((evt) => (
                    <div key={evt.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#07070c]/80 border border-white/5">
                      <div className="flex items-center gap-4 min-w-0">
                        <img src={evt.imageUrl} alt={evt.title} className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm truncate font-outfit">{evt.title}</h4>
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Finalizado</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5">{evt.date} · 📍 {evt.location}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-amber-400 block">★ {evt.rating}</span>
                        <span className="text-[10px] text-zinc-500 block">{evt.attendeesCount} Asistentes</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Videos y Aftermovies */}
            {organizer.media.length > 0 && (
              <div className="bg-zinc-950/30 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6">
                <h3 className="text-xs font-black text-primary-400 font-outfit uppercase tracking-widest flex items-center gap-2">
                  <Video className="w-4 h-4 text-pink-400" /> Aftermovies & Highlights ({organizer.media.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {organizer.media.map((med) => (
                    <div key={med.id} className="p-4 rounded-2xl bg-[#07070c]/80 border border-white/5 space-y-3">
                      <div className="relative h-32 rounded-xl overflow-hidden border border-white/10 bg-zinc-900">
                        <img src={med.thumbnailUrl} alt={med.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-primary-600/90 text-white flex items-center justify-center shadow-lg">
                            <Video className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-mono text-zinc-300">
                          {med.duration}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm line-clamp-1 font-outfit">{med.title}</h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{formatNumber(med.viewsCount)} reproducciones</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            
            {/* Bio & Trayectoria */}
            <div className="bg-zinc-950/30 border border-white/5 p-6 rounded-3xl backdrop-blur-md space-y-4">
              <h3 className="text-xs font-black text-primary-400 font-outfit uppercase tracking-widest block">Sobre la Productora</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {organizer.fullBio}
              </p>
              <div className="space-y-2 pt-2">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                  <span className="text-zinc-500 font-bold uppercase block text-[9px]">Ciudad Base</span>
                  <span className="font-semibold text-white mt-0.5 block">{organizer.city}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                  <span className="text-zinc-500 font-bold uppercase block text-[9px]">Especialidad</span>
                  <span className="font-semibold text-white mt-0.5 block">{organizer.eventTypes.join(" · ")}</span>
                </div>
              </div>
            </div>

            {/* Redes Sociales */}
            <div className="bg-zinc-950/30 border border-white/5 p-6 rounded-3xl backdrop-blur-md space-y-4">
              <h3 className="text-xs font-black text-primary-400 font-outfit uppercase tracking-widest block">Canales Oficiales</h3>
              <div className="space-y-2">
                {organizer.socials.instagram && (
                  <a href={`https://instagram.com/${organizer.socials.instagram}`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/[0.07] transition-all">
                    <span>Instagram (@{organizer.socials.instagram})</span>
                    <ExternalLink className="w-3.5 h-3.5 text-pink-400" />
                  </a>
                )}
                {organizer.socials.website && (
                  <a href={organizer.socials.website} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/[0.07] transition-all">
                    <span>Sitio Web Oficial</span>
                    <ExternalLink className="w-3.5 h-3.5 text-primary-400" />
                  </a>
                )}
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
