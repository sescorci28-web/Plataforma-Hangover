"use client";

import { useState, useTransition } from "react";
import { createEventBooking } from "@/app/services/actions";
import { Event } from "@/types/database.types";
import { Calendar, MapPin, DollarSign, Sparkles, X, Loader2, CheckCircle2, AlertTriangle, PartyPopper } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ExtendedEvent extends Event {
  creator: {
    full_name: string | null;
  } | null;
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
      window.location.href = "/login?redirect=/events";
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
        }, 3000);
      }
    });
  };

  return (
    <div className="space-y-8">
      {initialEvents.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-xl mx-auto space-y-4">
          <PartyPopper className="w-12 h-12 text-zinc-500 mx-auto" />
          <h3 className="text-xl font-bold text-white">No hay eventos programados</h3>
          <p className="text-zinc-400 text-sm">
            Aún no se han programado eventos en la plataforma. ¡Mantente al tanto para las próximas fiestas de la ciudad!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialEvents.map((event) => {
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
              <div key={event.id} className="glass-card overflow-hidden hover:border-white/20 transition-all flex flex-col h-full group">
                {/* Event Image Banner */}
                <div className="relative h-48 w-full bg-zinc-950 flex-shrink-0">
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-primary-600 to-rose-600 opacity-60 flex items-center justify-center">
                      <PartyPopper className="w-12 h-12 text-white/30" />
                    </div>
                  )}
                  <span className="absolute top-4 left-4 bg-primary-600 border border-primary-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white glow">
                    {event.ticket_price > 0 ? `$${event.ticket_price}` : "Gratis"}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-xs text-zinc-500">Organizado por {creatorName}</span>
                    
                    <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-primary-400 transition-colors">
                      {event.title}
                    </h3>
                    
                    <p className="text-zinc-400 text-sm line-clamp-3 min-h-[60px]">
                      {event.description || "Sin descripción detallada disponible."}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-white/5 mt-6 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <Calendar className="w-4 h-4 text-primary-400 shrink-0" />
                      <span className="capitalize">{formattedDate}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>

                    <button
                      onClick={() => handleOpenBooking(event)}
                      className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 px-4 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 glow cursor-pointer mt-2"
                    >
                      Comprar Entrada
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Booking Modal */}
      <AnimatePresence>
        {bookingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md overflow-hidden relative border-white/10"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Adquirir Entradas</h3>
                  <p className="text-xs text-zinc-400">Reserva de ticket oficial para evento</p>
                </div>
                <button
                  onClick={handleCloseBooking}
                  disabled={isPending}
                  className="text-zinc-400 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleConfirmBooking} className="p-6 space-y-4">
                {error && (
                  <div className="flex items-center gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>¡Entrada adquirida con éxito! Revisa tu panel para ver tus tickets.</span>
                  </div>
                )}

                {/* Event Summary Card */}
                <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-2 text-sm">
                  <span className="text-[10px] text-primary-400 font-bold uppercase tracking-wider">Evento Seleccionado</span>
                  <h4 className="font-semibold text-white truncate">{bookingEvent.title}</h4>
                  
                  <div className="flex flex-col gap-1 pt-2 border-t border-white/5 mt-2 text-xs text-zinc-400">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-zinc-500" /> {new Date(bookingEvent.event_date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-zinc-500" /> {bookingEvent.location}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-2">
                    <span className="text-xs text-zinc-400">Precio unitario</span>
                    <span className="text-md font-extrabold text-emerald-400">
                      {bookingEvent.ticket_price > 0 ? `$${bookingEvent.ticket_price}` : "Gratis"}
                    </span>
                  </div>
                </div>

                {/* Confirm Button */}
                {!success && (
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 px-4 font-semibold text-sm transition-all flex items-center justify-center gap-2 glow disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Procesando Transacción...
                      </>
                    ) : (
                      bookingEvent.ticket_price > 0 ? "Comprar Ticket" : "Reservar Entrada Gratuita"
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
