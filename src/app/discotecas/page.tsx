import { createClient } from "@/lib/supabase/server";
import { Sparkles, MapPin, Star, Building2, ArrowRight } from "lucide-react";
import Link from "next/link";

export const revalidate = 0; // Dynamic server component

export default async function DiscotecasPage() {
  const supabase = await createClient();

  // Query all clubs from the database
  const { data: clubs, error } = await supabase
    .from("clubs")
    .select("id, name, city, description, rating, banner_image, slug")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching clubs:", error);
  }

  const hasClubs = clubs && clubs.length > 0;

  return (
    <div className="relative min-h-[80vh] w-full py-12 px-4 md:px-6 container mx-auto space-y-12 overflow-hidden">
      {/* Background Neon Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-12 left-1/4 w-80 h-80 bg-primary-600/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-12 right-1/4 w-80 h-80 bg-accent-600/10 rounded-full blur-[128px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs font-semibold text-primary-400">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          Clubes & Discotecas Exclusivas
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight font-outfit text-white sm:text-5xl">
          Explora los Mejores <span className="text-gradient">Clubes</span>
        </h1>
        <p className="text-zinc-400 text-md sm:text-lg">
          Reserva tus entradas VIP, mesas y accesos exclusivos a los templos de la música y la noche en tu ciudad.
        </p>
      </header>

      {/* Clubs Content */}
      <div className="relative z-10">
        {!hasClubs ? (
          /* Elegant Empty State */
          <div className="glass-card max-w-lg mx-auto p-10 md:p-14 text-center border-white/5 space-y-6 shadow-[0_0_50px_-12px_rgba(217,70,239,0.1)]">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-primary-500/10 border border-primary-500/20 rounded-2xl">
              <Building2 className="w-10 h-10 text-primary-400" />
              <div className="absolute -inset-1.5 bg-primary-500/20 rounded-2xl blur opacity-30" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white font-outfit">No hay discotecas disponibles</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Actualmente no hay clubes listados en la plataforma. Vuelve pronto para descubrir las salas y fiestas más exclusivas de la zona.
              </p>
            </div>
            <div className="pt-2">
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer"
              >
                Volver al Inicio
              </Link>
            </div>
          </div>
        ) : (
          /* Grid of Clubs */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {clubs.map((club) => {
              const ratingVal = club.rating || 0;
              const formattedRating = Number(ratingVal).toFixed(1);

              return (
                <div 
                  key={club.id} 
                  className="glass-card overflow-hidden hover:border-primary-500/30 transition-all duration-300 flex flex-col h-full group hover:shadow-[0_0_25px_-5px_rgba(217,70,239,0.2)]"
                >
                  {/* Banner Image with fallback gradient */}
                  <div className="relative h-52 w-full bg-zinc-950 flex-shrink-0 overflow-hidden">
                    {club.banner_image ? (
                      <img
                        src={club.banner_image}
                        alt={club.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-primary-950 via-zinc-900 to-accent-950 flex items-center justify-center opacity-60">
                        <Building2 className="w-12 h-12 text-white/20" />
                      </div>
                    )}
                    {/* Dark gradient overlay over bottom image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
                    
                    {/* Location Badge (top left) */}
                    <div className="absolute top-4 left-4 flex items-center gap-1 bg-black/70 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs text-zinc-300">
                      <MapPin className="w-3.5 h-3.5 text-accent-400" />
                      <span>{club.city}</span>
                    </div>

                    {/* Rating Badge (top right) */}
                    {ratingVal > 0 && (
                      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/70 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-bold text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{formattedRating}</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors font-outfit line-clamp-1">
                        {club.name}
                      </h3>
                      <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3 min-h-[60px]">
                        {club.description || "Sin descripción disponible."}
                      </p>
                    </div>

                    {/* Action Button */}
                    <div className="pt-4 border-t border-white/5">
                      <Link
                        href={`/discotecas/${club.slug || club.id}`}
                        className="w-full inline-flex justify-center items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 px-4 text-sm font-semibold transition-all duration-300 glow cursor-pointer group-hover:bg-primary-500"
                      >
                        Ver Discoteca
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
