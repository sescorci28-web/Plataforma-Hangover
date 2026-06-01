import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Calendar, MapPin, Sparkles, ArrowLeft, ShieldCheck, Ticket } from "lucide-react";
import Link from "next/link";
import { EventDetailActions } from "@/components/events/EventDetailActions";

export const revalidate = 0; // Dynamic route

interface EventDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch specific event by id
  const { data: event, error } = await supabase
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
    .eq("id", id)
    .single();

  if (error || !event) {
    console.error("Error fetching event by id:", error);
    notFound();
  }

  const formattedDate = new Date(event.event_date).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const creatorName = event.creator?.full_name || "Organizador Hangover";

  return (
    <div className="relative min-h-screen w-full bg-[#05050a] text-zinc-100 pb-20 overflow-hidden">
      {/* Background Neon Ambient Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/3 left-10 w-96 h-96 bg-primary-950/20 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-1/3 right-10 w-96 h-96 bg-accent-950/20 rounded-full blur-[150px] mix-blend-screen" />
      </div>

      {/* Hero Banner Section */}
      <section className="relative h-[35vh] md:h-[45vh] w-full bg-zinc-950 overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
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
            href="/events"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Main Info Header (Overlaps the Banner) */}
      <div className="container mx-auto px-4 md:px-8 relative z-10 -mt-16 md:-mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,420px)] gap-8 items-start">
          {/* Left side details */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-[10px] font-bold uppercase tracking-wider text-primary-400">
                <Sparkles className="w-3 h-3" /> Evento Exclusivo
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white font-outfit">
                {event.title}
              </h1>
              <p className="text-sm text-zinc-400">Organizado por <span className="text-zinc-300 font-semibold">{creatorName}</span></p>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <h2 className="text-xl font-bold text-white font-outfit">Descripción del Evento</h2>
              <p className="text-zinc-300 text-base leading-relaxed whitespace-pre-line">
                {event.description || "Este evento no cuenta con una descripción detallada en este momento."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div className="p-5 rounded-2xl border border-white/5 bg-black/30">
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Fecha y Hora</p>
                <div className="flex gap-3">
                  <Calendar className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-zinc-300 leading-relaxed capitalize">{formattedDate}</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-white/5 bg-black/30">
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Ubicación</p>
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-zinc-300 leading-relaxed">{event.location}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side checkout card */}
          <div className="glass-card w-full rounded-[28px] border border-white/10 bg-[#09090f]/85 p-6 shadow-[0_20px_80px_rgba(217,70,239,0.12)]">
            <div className="space-y-5">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary-300">
                  <Ticket className="w-3 h-3" />
                  Ticket Oficial
                </span>
                <h3 className="text-lg font-bold text-white">Adquiere tus entradas</h3>
                <p className="text-xs text-zinc-400">Reserva de accesos verificados y controlados digitalmente para tu comodidad.</p>
              </div>

              <div className="rounded-[24px] border border-primary-500/20 bg-primary-500/10 p-4">
                <div className="flex items-center gap-2 text-primary-200">
                  <ShieldCheck className="w-4 h-4" />
                  <p className="text-sm font-semibold">Garantía Hangover</p>
                </div>
                <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                  Las entradas compradas a través de Hangover son directas del organizador, 100% verificadas y sin comisiones abusivas de reventa.
                </p>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-white/5">
                <span className="text-xs text-zinc-400">Precio Total (Base)</span>
                <span className="text-xl font-extrabold text-emerald-400 font-outfit">
                  {event.ticket_price > 0 ? `$${event.ticket_price}` : "Gratis"}
                </span>
              </div>

              <EventDetailActions
                eventId={event.id}
                eventDate={event.event_date}
                ticketPrice={event.ticket_price}
                isAuthenticated={Boolean(user)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
