import { createClient } from "@/lib/supabase/server";
import { EventsList } from "@/components/events/EventsList";
import { Sparkles } from "lucide-react";

export const revalidate = 0; // Always dynamic

export default async function EventsPage() {
  const supabase = await createClient();

  // Get active session user (if logged in, to allow booking tickets)
  const { data: { user } } = await supabase.auth.getUser();

  // Query only active events (events in the future or that started in the last 6 hours)
  const activeThreshold = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  
  const { data: events } = await supabase
    .from("events")
    .select(`
      *,
      creator:profiles!events_creator_id_fkey (
        full_name,
        city
      )
    `)
    .gte("event_date", activeThreshold)
    .order("event_date", { ascending: true });

  // Fetch all bookings for events to calculate real attendee counts
  const { data: bookings } = await supabase
    .from("bookings")
    .select("event_id, status")
    .not("event_id", "is", null);

  // Fetch all favorites to calculate interest count
  const { data: favorites } = await supabase
    .from("event_favorites")
    .select("event_id");

  // Fetch bookings in the last 24 hours for daily sales velocity
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: bookingsToday } = await supabase
    .from("bookings")
    .select("event_id")
    .gte("created_at", twentyFourHoursAgo)
    .in("status", ["ACCEPTED", "PAID", "IN_PROGRESS", "COMPLETED", "confirmed", "completed"]);

  // Fetch logged in user's city
  let userCity = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("city")
      .eq("id", user.id)
      .maybeSingle();
    if (profile) {
      userCity = profile.city;
    }
  }

  // Map counts
  const bookingCounts: Record<string, number> = {};
  if (bookings) {
    bookings.forEach((b) => {
      if (b.event_id && ["ACCEPTED", "PAID", "IN_PROGRESS", "COMPLETED", "confirmed", "completed"].includes(b.status || "")) {
        bookingCounts[b.event_id] = (bookingCounts[b.event_id] || 0) + 1;
      }
    });
  }

  const favoriteCounts: Record<string, number> = {};
  if (favorites) {
    favorites.forEach((f) => {
      if (f.event_id) {
        favoriteCounts[f.event_id] = (favoriteCounts[f.event_id] || 0) + 1;
      }
    });
  }

  const salesTodayCounts: Record<string, number> = {};
  if (bookingsToday) {
    bookingsToday.forEach((b) => {
      if (b.event_id) {
        salesTodayCounts[b.event_id] = (salesTodayCounts[b.event_id] || 0) + 1;
      }
    });
  }

  // Extend event objects with real counts
  const eventsWithCounts = (events || []).map((event) => ({
    ...event,
    attendeeCount: bookingCounts[event.id] || 0,
    favoritesCount: favoriteCounts[event.id] || 0,
    salesTodayCount: salesTodayCounts[event.id] || 0,
  }));

  return (
    <div className="relative min-h-screen w-full bg-[#020205] text-zinc-100 pb-20">
      {/* Background Neon Ambient Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary-950/10 rounded-full blur-[200px] mix-blend-screen" />
        <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-accent-950/10 rounded-full blur-[200px] mix-blend-screen" />
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
 
        <EventsList initialEvents={(eventsWithCounts as any) || []} user={user} userCity={userCity} />
      </div>
    </div>
  );
}
