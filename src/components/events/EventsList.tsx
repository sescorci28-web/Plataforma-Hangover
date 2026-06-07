"use client";

import { useState, useTransition } from "react";
import { createEventBooking } from "@/app/services/actions";
import { Event } from "@/types/database.types";
import { Calendar, MapPin, Sparkles, X, Loader2, CheckCircle2, AlertTriangle, PartyPopper, Users, ArrowRight, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { EventCountdown } from "./EventCountdown";
import { slugify, getEventImage, getEventBadges } from "@/lib/event-utils";

interface ExtendedEvent extends Event {
  creator: { full_name: string | null } | { full_name: string | null }[] | null;
  attendeeCount: number;
  capacity?: number | null;
}

interface EventsListProps {
  initialEvents: ExtendedEvent[];
  user: any;
}

export function EventsList({ initialEvents, user }: EventsListProps) {
  const [bookingEvent, setBookingEvent] = useState<ExtendedEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleOpenBooking = (event: ExtendedEvent) => {
    if (!user) {
      window.location.href = `/login?redirect=/events/${slugify(event.title)}`;
      return;
    }
    setBookingEvent(event);
    setError(null);
    setSuccess(false);
  };

  const handleCloseBooking = () => {
    if (isPending) return;
    setBookingEvent(null);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingEvent) return;
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await createEventBooking(
        bookingEvent.id,
        bookingEvent.event_date,
        bookingEvent.ticket_price
      );

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          setBookingEvent(null);
          setSuccess(false);
          window.location.reload(); // Reload to refresh attendee counts
        }, 2500);
      }
    });
  };

  // Find featured event: most upcoming event in the future
  const now = new Date();
  const upcomingEvents = initialEvents.filter(e => new Date(e.event_date) > now);
  upcomingEvents.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  
  const featuredEvent = upcomingEvents[0] || initialEvents[0];
  const gridEvents = initialEvents.filter(e => e.id !== (featuredEvent?.id || ""));

  const featuredCapacity = (featuredEvent as any)?.capacity ?? 350;

  return (
    <div className="space-y-12">
      {initialEvents.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-xl mx-auto space-y-4">
          <PartyPopper className="w-12 h-12 text-zinc-500 mx-auto" />
          <h3 className="text-xl font-bold text-white">No hay eventos programados</h3>
          <p className="text-zinc-400 text-sm">
            Aún no se han programado eventos en la plataforma. ¡Mantente al tanto para las próximas fiestas de la ciudad!
          </p>
        </div>
      ) : (
        <>
          {/* SECTION: Featured Event Hero */}
          {featuredEvent && (
            <div className="relative rounded-3xl border border-white/10 bg-[#09090f] overflow-hidden shadow-[0_20px_50px_rgba(217,70,239,0.15)]">
              {/* Background cover image with custom positioning */}
              <div className="absolute inset-0 z-0">
                <img
                  src={getEventImage(featuredEvent.image_url, featuredEvent.id)}
                  alt={featuredEvent.title}
                  className="w-full h-full object-cover opacity-35"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#05050a] via-[#05050a]/90 to-transparent md:bg-gradient-to-tr" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05050a] via-transparent to-transparent" />
              </div>

              {/* Immersive layout container */}
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 sm:p-10 lg:p-14 items-center">
                {/* Left: Info */}
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/20 border border-primary-500/30 text-[10px] font-bold uppercase tracking-wider text-primary-300">
                      <Sparkles className="w-3.5 h-3.5" /> Evento Destacado
                    </span>
                    {getEventBadges(featuredEvent, 0).map((badge, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.className}`}
                      >
                        {badge.text}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-outfit leading-tight hover:text-primary-400 transition-colors">
                      <Link href={`/events/${slugify(featuredEvent.title)}`}>
                        {featuredEvent.title}
                      </Link>
                    </h2>
                    <p className="text-zinc-400 text-xs">
                      Organizado por{" "}
                      <span className="text-zinc-300 font-semibold">
                        {(Array.isArray(featuredEvent.creator) ? featuredEvent.creator[0]?.full_name : (featuredEvent.creator as any)?.full_name) || "Organizador Hangover"}
                      </span>
                    </p>
                  </div>

                  <p className="text-zinc-300 text-sm sm:text-base line-clamp-3 leading-relaxed max-w-xl">
                    {featuredEvent.description || "Prepárate para una noche inolvidable. Disfruta de la mejor música, producción premium y sorpresas exclusivas."}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5 max-w-lg">
                    <div className="flex items-center gap-3 text-zinc-300">
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-primary-400 shrink-0">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="text-xs">
                        <p className="text-zinc-500 uppercase font-bold tracking-wider">Fecha</p>
                        <p className="capitalize font-semibold">
                          {new Date(featuredEvent.event_date).toLocaleDateString("es-ES", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-zinc-300">
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-rose-400 shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="text-xs">
                        <p className="text-zinc-500 uppercase font-bold tracking-wider">Ubicación</p>
                        <p className="font-semibold truncate max-w-[160px]">{featuredEvent.location}</p>
                      </div>
                    </div>
                  </div>

                  {/* Social Proof & Urgency */}
                  <div className="space-y-2 pt-2 max-w-lg">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Users className="w-4 h-4 text-zinc-500" />
                        <strong>{featuredEvent.attendeeCount}</strong> asistentes registrados
                      </span>
                      <span className="text-primary-400 font-bold">
                        {Math.min(Math.round((featuredEvent.attendeeCount / featuredCapacity) * 100), 100)}% Vendido
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-white/5 border border-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-600 via-purple-500 to-rose-500 transition-all duration-500"
                        style={{ width: `${Math.min(Math.round((featuredEvent.attendeeCount / featuredCapacity) * 100), 100)}%` }}
                      />
                    </div>
                    {/* Remaining Tickets Badge */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-semibold text-emerald-400">
                        Precio: {featuredEvent.ticket_price > 0 ? `$${featuredEvent.ticket_price}` : "Acceso Libre"}
                      </span>
                      {featuredCapacity - featuredEvent.attendeeCount <= 80 ? (
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider animate-pulse flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          ⚠️ ¡Solo quedan {featuredCapacity - featuredEvent.attendeeCount} entradas!
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-zinc-500">
                          Disponibles: {featuredCapacity - featuredEvent.attendeeCount} tickets
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Countdown & Buying Urgency */}
                <div className="flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl border border-white/15 bg-black/60 backdrop-blur-xl space-y-6 lg:max-w-md lg:ml-auto w-full shadow-2xl">
                  <div className="text-center space-y-1">
                    <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 font-bold">La venta cierra en</p>
                    <p className="text-[10px] text-primary-400 font-semibold uppercase tracking-wider">Asegura tu entrada ahora</p>
                  </div>

                  <EventCountdown targetDate={featuredEvent.event_date} variant="detailed" />

                  <button
                    onClick={() => handleOpenBooking(featuredEvent)}
                    className="w-full cursor-pointer bg-gradient-to-r from-primary-600 to-rose-600 hover:from-primary-500 hover:to-rose-500 text-white rounded-xl py-4 px-6 font-bold text-sm transition-all flex items-center justify-center gap-2 glow hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Comprar Entrada Destacada
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>

                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Garantía Hangover · Sin Cargos Ocultos</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: General Events Grid */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="h-px bg-white/10 flex-grow" />
              <h3 className="text-lg font-bold text-white uppercase tracking-widest font-outfit shrink-0">Próximos Eventos</h3>
              <div className="h-px bg-white/10 flex-grow" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {gridEvents.map((event, index) => {
                const creatorRaw = event.creator;
                const creatorName = (Array.isArray(creatorRaw) ? creatorRaw[0]?.full_name : (creatorRaw as any)?.full_name) || "Organizador Hangover";
                const badges = getEventBadges(event, index + 1);
                const capacity = (event as any).capacity ?? 350;
                const percentSold = Math.min(Math.round((event.attendeeCount / capacity) * 100), 100);
                const remaining = Math.max(capacity - event.attendeeCount, 0);

                return (
                  <div key={event.id} className="glass-card overflow-hidden hover:border-white/20 transition-all duration-300 flex flex-col h-full group relative hover:shadow-[0_10px_30px_rgba(217,70,239,0.08)] bg-[#07070c]/90">
                    {/* Image Header with Countdown Overlay */}
                    <div className="relative h-56 w-full bg-zinc-950 flex-shrink-0 overflow-hidden">
                      <img
                        src={getEventImage(event.image_url, event.id)}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#05050a] via-transparent to-black/35" />

                      {/* Badges Overlay */}
                      <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                        {badges.map((badge, idx) => (
                          <span
                            key={idx}
                            className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${badge.className}`}
                          >
                            {badge.text}
                          </span>
                        ))}
                      </div>

                      {/* Price Tag Overlay */}
                      <span className="absolute top-4 right-4 bg-black/75 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        {event.ticket_price > 0 ? `$${event.ticket_price}` : "Gratis"}
                      </span>

                      {/* Countdown Overlay */}
                      <div className="absolute bottom-4 right-4 z-10">
                        <EventCountdown targetDate={event.event_date} variant="compact" />
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 flex-grow flex flex-col justify-between space-y-5">
                      <div className="space-y-3">
                        <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Organizado por {creatorName}</span>
                        
                        <h3 className="text-xl font-bold text-white line-clamp-1 group-hover:text-primary-400 transition-colors font-outfit">
                          <Link href={`/events/${slugify(event.title)}`}>
                            {event.title}
                          </Link>
                        </h3>
                        
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 min-h-[54px]">
                          {event.description || "Disfruta del mejor ambiente de la ciudad. Compra tu entrada hoy."}
                        </p>
                      </div>

                      {/* Progress bar, registered, and remaining tickets */}
                      <div className="space-y-2.5 pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center text-[10px] text-zinc-400">
                          <span className="flex items-center gap-1 font-semibold">
                            <Users className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            {event.attendeeCount} Asistentes
                          </span>
                          <span className="font-bold text-primary-400">{percentSold}% Vendido</span>
                        </div>
                        
                        <div className="w-full h-1.5 bg-white/5 border border-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all duration-500"
                            style={{ width: `${percentSold}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center">
                          {remaining <= 100 ? (
                            <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider animate-pulse">
                              🔥 ¡Solo quedan {remaining} entradas!
                            </span>
                          ) : (
                            <span className="text-[9px] text-zinc-500">
                              {remaining} entradas restantes
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Date & Location */}
                      <div className="space-y-2 text-xs text-zinc-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary-400 shrink-0" />
                          <span className="capitalize text-[11px] truncate">
                            {new Date(event.event_date).toLocaleDateString("es-ES", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                          <span className="truncate text-[11px]">{event.location}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-2">
                        <button
                          onClick={() => handleOpenBooking(event)}
                          className="w-full cursor-pointer bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 px-4 text-xs font-bold transition-all flex items-center justify-center gap-1.5 glow hover:scale-[1.01] active:scale-[0.99]"
                        >
                          Comprar Entrada
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Ticket Booking Modal */}
      <AnimatePresence>
        {bookingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md overflow-hidden relative border-white/10 bg-[#09090f] shadow-[0_20px_50px_rgba(217,70,239,0.2)]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between relative z-10">
                <div>
                  <h3 className="text-xl font-bold text-white font-outfit">Adquirir Entradas</h3>
                  <p className="text-xs text-zinc-400">Reserva de ticket oficial para evento</p>
                </div>
                <button
                  onClick={handleCloseBooking}
                  disabled={isPending}
                  className="text-zinc-400 hover:text-white disabled:opacity-50 transition-colors p-1 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleConfirmBooking} className="p-6 space-y-5 relative z-10">
                {error && (
                  <div className="flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>¡Entrada adquirida con éxito! Revisa tu panel para ver tus tickets.</span>
                  </div>
                )}

                {/* Event Summary Card */}
                <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-primary-400 font-extrabold uppercase tracking-wider">Evento Seleccionado</span>
                    <h4 className="font-bold text-white truncate text-base font-outfit">{bookingEvent.title}</h4>
                  </div>
                  
                  <div className="flex flex-col gap-2 pt-3 border-t border-white/5 text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-zinc-500" />
                      <span>{new Date(bookingEvent.event_date).toLocaleDateString("es-ES", { dateStyle: "long" })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-zinc-500" />
                      <span className="truncate">{bookingEvent.location}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-white/5">
                    <span className="text-xs text-zinc-400">Precio unitario</span>
                    <span className="text-lg font-extrabold text-emerald-400">
                      {bookingEvent.ticket_price > 0 ? `$${bookingEvent.ticket_price}` : "Gratis"}
                    </span>
                  </div>
                </div>

                {/* Confirm Button */}
                {!success && (
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-gradient-to-r from-primary-600 to-rose-600 hover:from-primary-500 hover:to-rose-500 text-white rounded-xl py-3.5 px-4 font-bold text-sm transition-all flex items-center justify-center gap-2 glow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg hover:scale-[1.01]"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Procesando Transacción...
                      </>
                    ) : (
                      bookingEvent.ticket_price > 0 ? "Confirmar y Pagar" : "Reservar Entrada Gratis"
                    )}
                  </button>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
