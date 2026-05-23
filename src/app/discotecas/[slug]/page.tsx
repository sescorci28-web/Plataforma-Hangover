import { createClient } from "@/lib/supabase/server";
import { ClubBookingModal } from "@/components/discotecas/ClubBookingModal";
import { Sparkles, MapPin, Star, Clock, ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";

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
      <div className="relative min-h-[75vh] w-full flex items-center justify-center py-12 px-4 md:px-6 container mx-auto">
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

  const ratingVal = club.rating || 0;
  const formattedRating = Number(ratingVal).toFixed(1);

  return (
    <div className="relative min-h-screen w-full bg-[#05050a] text-zinc-100 pb-20 overflow-hidden">
      {/* Background Neon Ambient Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/3 left-10 w-96 h-96 bg-primary-950/20 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-1/3 right-10 w-96 h-96 bg-accent-950/20 rounded-full blur-[150px] mix-blend-screen" />
      </div>

      {/* Hero Banner Section */}
      <section className="relative h-[40vh] md:h-[50vh] w-full bg-zinc-950 overflow-hidden">
        {club.banner_image ? (
          <img
            src={club.banner_image}
            alt={club.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-primary-950 via-zinc-900 to-accent-950 opacity-40" />
        )}
        {/* Dark overlay masks */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-black/40" />
        
        {/* Floating Back Navigation Button */}
        <div className="absolute top-6 left-4 md:left-8 z-20">
          <Link
            href="/discotecas"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Main Info Header (Overlaps the Banner) */}
      <div className="container mx-auto px-4 md:px-8 relative z-10 -mt-20 md:-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-5">
            {/* Logo */}
            <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-zinc-900 border-2 border-white/10 overflow-hidden shadow-2xl p-1 shrink-0 bg-gradient-to-b from-zinc-800 to-zinc-900">
              {club.logo ? (
                <img src={club.logo} alt="Logo" className="w-full h-full object-cover rounded-[20px]" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                  <Building2 className="w-12 h-12 text-zinc-600" />
                </div>
              )}
            </div>

            {/* Title & Location */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-[10px] font-bold uppercase tracking-wider text-primary-400">
                  <Sparkles className="w-3 h-3" /> Discoteca VIP
                </span>
                {!club.active && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-semibold text-zinc-400">
                    Borrador
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white font-outfit">
                {club.name}
              </h1>
              <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
                <MapPin className="w-4 h-4 text-accent-400" />
                <span>{club.city}</span>
              </div>
            </div>
          </div>

          {/* Large Rating Banner */}
          {ratingVal > 0 && (
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 self-start md:self-end">
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Calificación</p>
                <p className="text-xs text-zinc-300">Puntuación general</p>
              </div>
              <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-1 text-xl font-extrabold text-amber-400 font-outfit shrink-0">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400 mr-0.5" />
                <span>{formattedRating}</span>
              </div>
            </div>
          )}
        </div>

        {/* Details Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
          {/* Main Description (Left Side) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white font-outfit">Sobre {club.name}</h2>
              <p className="text-zinc-300 text-base leading-relaxed whitespace-pre-line">
                {club.description || "Esta discoteca no cuenta con una descripción detallada en este momento."}
              </p>
            </div>
            
            {/* Ambient Highlights / Premium Experience Callouts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="p-5 rounded-2xl border border-white/5 bg-gradient-to-tr from-white/5 to-transparent">
                <h4 className="font-bold text-white mb-2 text-sm font-outfit">Servicio de Reservas</h4>
                <p className="text-xs text-zinc-400">Reserva mesas VIP, botellas y accesos rápidos directamente sin comisiones adicionales.</p>
              </div>
              <div className="p-5 rounded-2xl border border-white/5 bg-gradient-to-tr from-white/5 to-transparent">
                <h4 className="font-bold text-white mb-2 text-sm font-outfit">Seguridad Garantizada</h4>
                <p className="text-xs text-zinc-400">Acceso seguro con control digital de entradas. Tu diversión está protegida con Hangover.</p>
              </div>
            </div>
          </div>

          {/* Quick Info & Stats (Right Side) */}
          <div className="space-y-6">
            <div className="glass-card p-6 border-white/10 space-y-6 shadow-xl">
              <h3 className="text-lg font-bold text-white font-outfit pb-3 border-b border-white/5">
                Detalles del Club
              </h3>

              <div className="space-y-5">
                {/* Dirección Física */}
                {club.address && (
                  <div className="flex gap-3">
                    <MapPin className="w-5 h-5 text-accent-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Dirección</p>
                      <p className="text-xs text-zinc-300 leading-relaxed">{club.address}</p>
                    </div>
                  </div>
                )}

                {/* Horario de Apertura */}
                {club.opening_hours && (
                  <div className="flex gap-3">
                    <Clock className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Horario de Apertura</p>
                      <p className="text-xs text-zinc-300 leading-relaxed">{club.opening_hours}</p>
                    </div>
                  </div>
                )}

                {/* Instagram Handle */}
                {club.instagram && (
                  <div className="flex gap-3">
                    <InstagramIcon className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Redes Sociales</p>
                      <a 
                        href={`https://instagram.com/${club.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-400 hover:text-primary-300 transition-colors hover:underline font-semibold"
                      >
                        {club.instagram}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Action VIP Booking Button */}
              <div className="pt-4">
                <ClubBookingModal
                  club={{
                    id: club.id,
                    name: club.name,
                    provider_id: club.provider_id ?? null,
                  }}
                  isAuthenticated={Boolean(user)}
                  defaultClientName={
                    user?.user_metadata?.full_name ||
                    user?.user_metadata?.name ||
                    user?.email?.split("@")[0] ||
                    ""
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
