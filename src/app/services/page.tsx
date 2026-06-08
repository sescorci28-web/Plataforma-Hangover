import { createClient } from "@/lib/supabase/server";
import { ServicesList } from "@/components/services/ServicesList";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export const revalidate = 0; // Dynamic route

export default async function ServicesPage() {
  const supabase = await createClient();

  // Get active session user (if logged in, to allow bookings)
  const { data: { user } } = await supabase.auth.getUser();

  // Query all services joined with provider profile details
  const { data: services } = await supabase
    .from("services")
    .select(`
      id,
      provider_id,
      title,
      description,
      price,
      category,
      image_url,
      created_at,
      updated_at,
      slug,
      verified,
      badge_status,
      availability_status,
      category_id,
      subcategory_id,
      subcategory,
      base_city,
      cover_url,
      video_url,
      completed_bookings_count,
      average_rating,
      provider_status,
      provider:profiles!services_provider_id_fkey (
        full_name,
        city
      )
    `)
    .order("created_at", { ascending: false });

  // Query all bookings to calculate total bookings count per service
  const { data: bookings } = await supabase
    .from("bookings")
    .select("service_id");

  const bookingsCounts: Record<string, number> = {};
  if (bookings) {
    bookings.forEach((b) => {
      if (b.service_id) {
        bookingsCounts[b.service_id] = (bookingsCounts[b.service_id] || 0) + 1;
      }
    });
  }

  const servicesWithStats = (services || []).map((s) => ({
    ...s,
    bookingsCount: bookingsCounts[s.id] || 0
  }));

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 space-y-10">
      <header className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs font-semibold text-primary-400">
          <Sparkles className="w-3.5 h-3.5" />
          Servicios Premium para Fiestas
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight font-outfit text-white sm:text-5xl">
          Contrata Talento para tu Noche
        </h1>
        <p className="text-zinc-400 text-md sm:text-lg">
          Reserva DJs profesionales, cocteleros, equipos de sonido y seguridad directamente para tu próximo evento privado o discoteca.
        </p>
      </header>

      {/* Banner de Hangover Planner */}
      <div className="glass-card p-6 md:p-8 bg-gradient-to-r from-primary-950/20 via-indigo-950/20 to-transparent border border-primary-500/20 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 max-w-5xl mx-auto">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-500/10 border border-primary-500/25 text-[10px] font-bold uppercase tracking-wider text-primary-400">
            🎉 Nuevo
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-outfit text-white">✨ Hangover Planner</h2>
          <p className="text-sm text-zinc-400 max-w-xl">
            Construye tu evento ideal según tu presupuesto. Cuéntanos cuánto tienes y qué quieres hacer, y te ayudaremos a estructurar tu noche ideal.
          </p>
        </div>
        <Link 
          href="/services/planner" 
          className="bg-primary-600 hover:bg-primary-500 active:scale-95 text-white text-xs font-black uppercase tracking-widest px-6 py-3.5 rounded-2xl transition-all duration-300 shadow-lg shadow-primary-500/10 shrink-0 transform hover:scale-[1.02]"
        >
          Comenzar Planificación
        </Link>
      </div>

      <ServicesList initialServices={(servicesWithStats as any) || []} user={user} />
    </div>
  );
}
