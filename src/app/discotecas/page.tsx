import { createClient } from "@/lib/supabase/server";
import { Sparkles } from "lucide-react";
import { ClubsCatalog } from "@/components/discotecas/ClubsCatalog";

export const revalidate = 0; // Dynamic server component

export default async function DiscotecasPage() {
  const supabase = await createClient();

  // Query all clubs from the database
  const { data: clubs, error } = await supabase
    .from("clubs")
    .select("id, name, city, description, rating, banner_image, slug, opening_hours, cover_price, amenities, active")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching clubs:", error);
  }

  const initialClubs = clubs || [];

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

      {/* Real-time Filterable Catalog */}
      <ClubsCatalog initialClubs={initialClubs} />
    </div>
  );
}
