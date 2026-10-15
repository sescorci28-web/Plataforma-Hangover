import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Share2, MapPin, Star, Play, Music, Radio, Tv, Calendar, 
  CheckCircle2, Heart, ExternalLink, Disc, Sparkles, Clock, Eye, Headphones
} from "lucide-react";
import { getArtistById } from "@/data/mockArtists";

export const revalidate = 0;

interface ArtistPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ArtistDetailPage({ params }: ArtistPageProps) {
  const { id } = await params;
  const artist = getArtistById(id);

  if (!artist) {
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
        <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-purple-950/20 rounded-full blur-[180px] mix-blend-screen" />
      </div>

      {/* ── HERO BANNER & HEADER ── */}
      <section className="relative h-[40vh] md:h-[50vh] w-full bg-zinc-950 overflow-hidden">
        <img
          src={artist.bannerUrl}
          alt={artist.name}
          className="w-full h-full object-cover opacity-40 filter blur-[4px] scale-105 select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020205] via-[#020205]/40 to-black/60 z-10" />

        {/* Back Navigation Button */}
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
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-3xl overflow-hidden border-4 border-primary-600/80 shadow-[0_0_30px_rgba(99,102,241,0.5)] shrink-0 bg-zinc-900">
              <img src={artist.avatarUrl} alt={artist.name} className="w-full h-full object-cover" />
            </div>

            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-outfit tracking-tight leading-none">
                  {artist.name}
                </h1>
                {artist.verified && (
                  <CheckCircle2 className="w-6 h-6 text-primary-400 fill-primary-600/30" />
                )}
              </div>
              
              <p className="text-sm sm:text-base font-bold text-primary-400">{artist.role}</p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-zinc-500" /> {artist.location}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                <span className="flex items-center gap-1 font-bold text-amber-400"><Star className="w-3.5 h-3.5 fill-amber-400" /> {artist.rating}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                <span className="font-bold text-emerald-400">{formatNumber(artist.followersCount)} Seguidores</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <button className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-105">
                <Heart className="w-4 h-4" /> Seguir Artista
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTENT CONTAINER ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8 relative z-20 space-y-10">
        
        {/* Genres & Socials */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-950/40 border border-white/5 backdrop-blur-md">
          <div className="flex flex-wrap gap-2">
            {artist.genres.map((g, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-primary-500/10 border border-primary-500/20 text-xs font-bold text-primary-300 uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-primary-400" /> {g}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs">
            {artist.socials.instagram && (
              <a href={`https://instagram.com/${artist.socials.instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/40 text-zinc-300 hover:text-pink-400 transition-all">
                <ExternalLink className="w-3.5 h-3.5" /> @{artist.socials.instagram}
              </a>
            )}
            {artist.socials.spotify && (
              <a href={`https://open.spotify.com/artist/${artist.socials.spotify}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/40 text-zinc-300 hover:text-emerald-400 transition-all">
                <ExternalLink className="w-3.5 h-3.5" /> Spotify
              </a>
            )}
          </div>
        </div>

        {/* Grid Layout: Main & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          
          {/* Main Column: Music, Sets, Videos */}
          <div className="space-y-8">
            
            {/* Tracks Populares */}
            <div className="bg-zinc-950/30 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-primary-400 font-outfit uppercase tracking-widest flex items-center gap-2">
                  <Music className="w-4 h-4" /> Tracks Populares ({artist.tracks.length})
                </h3>
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Audio Preview</span>
              </div>

              {artist.tracks.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No hay sencillos lanzados aún.</p>
              ) : (
                <div className="space-y-3">
                  {artist.tracks.map((track) => (
                    <div key={track.id} className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-[#07070c]/80 border border-white/5 hover:border-white/10 transition-all group">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img src={track.coverUrl} alt={track.title} className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0" />
                        <div className="min-w-0">
                          <h4 className="font-bold text-white text-sm truncate font-outfit group-hover:text-primary-300 transition-colors">{track.title}</h4>
                          <p className="text-[11px] text-zinc-400">{track.album ? `${track.album} · ` : ''}{track.genre}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-xs text-zinc-500 font-mono hidden sm:inline">{track.duration}</span>
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">{formatNumber(track.playsCount)} plays</span>
                        <button className="w-9 h-9 rounded-full bg-primary-600 hover:bg-primary-500 text-white flex items-center justify-center transition-all shadow-md">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DJ Sets & Live Sessions */}
            <div className="bg-zinc-950/30 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-primary-400 font-outfit uppercase tracking-widest flex items-center gap-2">
                  <Radio className="w-4 h-4 text-pink-400" /> Live Sets & Sesiones de Larga Duración ({artist.sets.length})
                </h3>
              </div>

              {artist.sets.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No hay DJ sets grabados aún.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {artist.sets.map((set) => (
                    <div key={set.id} className="p-4 rounded-2xl bg-[#07070c]/80 border border-white/5 space-y-3">
                      <div className="relative h-32 rounded-xl overflow-hidden border border-white/10 bg-zinc-900">
                        <img src={set.coverUrl} alt={set.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-primary-600/90 text-white flex items-center justify-center shadow-lg">
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          </div>
                        </div>
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-pink-500/20 border border-pink-500/30 text-[9px] font-bold text-pink-300 uppercase tracking-wider flex items-center gap-1">
                          <Radio className="w-2.5 h-2.5" /> Live Set
                        </div>
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-mono text-zinc-300">
                          {set.duration}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm line-clamp-1 font-outfit">{set.title}</h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">📍 {set.recordedAt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Promo Architecture Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-primary-950/40 via-purple-950/20 to-zinc-950 border border-primary-500/20 backdrop-blur-md flex items-start gap-4">
              <Headphones className="w-7 h-7 text-primary-400 shrink-0 mt-1" />
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm font-outfit">Plataforma de Promoción de Artistas Hangover</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Arquitectura tipada y preparada para la publicación autónoma de Beats, Tracks sin comprimir, Setlists y Videos en streaming directo para la comunidad nocturna.
                </p>
              </div>
            </div>

          </div>

          {/* Sidebar Column: Próximos Eventos & Bio */}
          <div className="space-y-8">
            
            {/* Próximos Eventos */}
            <div className="bg-zinc-950/30 border border-white/5 p-6 rounded-3xl backdrop-blur-md space-y-4">
              <h3 className="text-xs font-black text-primary-400 font-outfit uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Próximos Eventos en Hangover
              </h3>

              {artist.upcomingEvents.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No hay eventos futuros programados.</p>
              ) : (
                <div className="space-y-4">
                  {artist.upcomingEvents.map((evt) => (
                    <Link
                      key={evt.eventId}
                      href={`/events/${evt.eventId}`}
                      className="block p-4 rounded-2xl bg-[#07070c]/90 border border-white/5 hover:border-primary-500/30 transition-all space-y-3 group"
                    >
                      <div className="relative h-28 rounded-xl overflow-hidden border border-white/10">
                        <img src={evt.imageUrl} alt={evt.eventTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-bold text-primary-300 flex items-center gap-1 border border-white/10">
                          <Clock className="w-3 h-3" /> {evt.performanceTime}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-white text-sm font-outfit group-hover:text-primary-300 transition-colors">{evt.eventTitle}</h4>
                        <p className="text-xs text-emerald-400 font-bold">{evt.date}</p>
                        <p className="text-[11px] text-zinc-400 flex items-center gap-1"><MapPin className="w-3 h-3 text-zinc-500" /> {evt.location}</p>
                      </div>
                      <div className="pt-2 text-center py-2 rounded-xl bg-primary-600/20 border border-primary-500/30 text-xs font-bold text-primary-300 group-hover:bg-primary-600 group-hover:text-white transition-all">
                        Ver Evento & Boletas →
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Bio Info */}
            <div className="bg-zinc-950/30 border border-white/5 p-6 rounded-3xl backdrop-blur-md space-y-4">
              <h3 className="text-xs font-black text-primary-400 font-outfit uppercase tracking-widest block">Biografía</h3>
              <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                {artist.fullBio}
              </p>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
