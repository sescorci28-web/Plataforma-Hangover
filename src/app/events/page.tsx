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

  // Fetch all bookings for events to calculate real attendee counts
  const { data: bookings } = await supabase
    .from("bookings")
    .select("event_id")
    .not("event_id", "is", null);

  // Map attendee counts
  const bookingCounts: Record<string, number> = {};
  if (bookings) {
    bookings.forEach((b) => {
      if (b.event_id) {
        bookingCounts[b.event_id] = (bookingCounts[b.event_id] || 0) + 1;
      }
    });
  }

  // Extend event objects with real counts
  const eventsWithCounts = (events || []).map((event) => ({
    ...event,
    attendeeCount: bookingCounts[event.id] || 0,
  }));

  return (
    <div className="relative min-h-screen w-full bg-[#05050a] text-zinc-100 pb-20">
      {/* Background Neon Ambient Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-950/10 rounded-full blur-[180px] mix-blend-screen" />
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-accent-950/10 rounded-full blur-[180px] mix-blend-screen" />
      </div>

      <div className="container mx-auto px-4 md:px-6 py-10 space-y-12 relative z-10">
        <header className="text-center max-w-3xl mx-auto space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs font-semibold text-primary-400">
            <Sparkles className="w-3.5 h-3.5 text-primary-400 shrink-0" />
            Experiencia de Eventos Premium
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight font-outfit text-white sm:text-5xl lg:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
            Las Mejores Noches Te Esperan
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Adquiere tus entradas autorizadas para los mejores clubes, eventos VIP y fiestas exclusivas de la ciudad de forma directa y segura.
          </p>
        </header>

        <EventsList initialEvents={(eventsWithCounts as any) || []} user={user} />
      </div>
    </div>
  );
}
