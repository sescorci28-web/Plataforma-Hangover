import { createClient } from "@/lib/supabase/server";
import { PlannerClient } from "@/components/services/PlannerClient";
import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const revalidate = 0; // Dynamic route

export default async function PlannerPage() {
  const supabase = await createClient();

  // Get active session user
  const { data: { user } } = await supabase.auth.getUser();

  // Query all active services joined with provider profile details
  const { data: services } = await supabase
    .from("services")
    .select(`
      id,
      provider_id,
      title,
      slug,
      description,
      price,
      price_type,
      category,
      image_url,
      cover_url,
      average_rating,
      base_city,
      is_active,
      provider:profiles!services_provider_id_fkey (
        id,
        full_name,
        city
      )
    `)
    .eq("is_active", true);

  // Fallback to empty array if no services found
  const activeServices = services || [];

  return (
    <div className="min-h-screen bg-[#05050a] py-12">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <header className="mb-10 space-y-4 max-w-3xl">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-widest"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a Servicios
          </Link>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs font-bold text-primary-400">
              <Sparkles className="w-3.5 h-3.5" />
              Planificador Inteligente de Eventos
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-outfit text-white">
              ✨ Hangover Planner
            </h1>
            <p className="text-zinc-400 text-sm md:text-md">
              Construye tu evento ideal según tu presupuesto. Describe qué deseas organizar y nuestro sistema inteligente seleccionará los mejores proveedores en tiempo real.
            </p>
          </div>
        </header>

        <PlannerClient initialServices={activeServices as any} user={user} />
      </div>
    </div>
  );
}
