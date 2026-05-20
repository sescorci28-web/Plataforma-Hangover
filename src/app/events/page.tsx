import { createClient } from "@/lib/supabase/server";
import { EventsList } from "@/components/events/EventsList";
import { Sparkles } from "lucide-react";

export const revalidate = 0; // Always dynamic

export default async function EventsPage() {
  const supabase = await createClient();

  // Get active session user (if logged in, to allow booking tickets)
  const { data: { user } } = await supabase.auth.getUser();

  // Query all events joined with creator profile details
  const { data: events } = await supabase
    .from("events")
    .select(`
      id,
      creator_id,
      title,
      description,
      event_date,
      location,
      image_url,
      ticket_price,
      created_at,
      updated_at,
      creator:profiles!events_creator_id_fkey (
        full_name
      )
    `)
    .order("event_date", { ascending: true });

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 space-y-10">
      <header className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs font-semibold text-primary-400">
          <Sparkles className="w-3.5 h-3.5" />
          Eventos Destacados
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight font-outfit text-white sm:text-5xl">
          Las Mejores Noches Te Esperan
        </h1>
        <p className="text-zinc-400 text-md sm:text-lg">
          Compra tus entradas anticipadas para los mejores clubes, festivales y fiestas temáticas de la ciudad sin intermediarios.
        </p>
      </header>

      <EventsList initialEvents={(events as any) || []} user={user} />
    </div>
  );
}
