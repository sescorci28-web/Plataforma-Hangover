"use client";

import { useState, useTransition } from "react";
import { createServiceBooking } from "@/app/services/actions";
import { Calendar, Clock, DollarSign, ShieldCheck, MessageSquare, X, Loader2, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ServiceBookingWidgetProps {
  serviceId: string;
  providerId: string;
  price: number;
  serviceTitle: string;
  user: any;
  duration: string;
  responseTime: string;
  availabilityStatus: string;
}

export function ServiceBookingWidget({
  serviceId,
  providerId,
  price,
  serviceTitle,
  user,
  duration,
  responseTime,
  availabilityStatus
}: ServiceBookingWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [eventDate, setEventDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleOpenBooking = () => {
    if (!user) {
      const currentPath = window.location.pathname;
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      return;
    }
    setIsOpen(true);
    setEventDate("");
    setNotes("");
    setError(null);
    setSuccess(false);
  };

  const handleCloseBooking = () => {
    if (isPending) return;
    setIsOpen(false);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!eventDate) {
      setError("La fecha del evento es obligatoria.");
      return;
    }

    startTransition(async () => {
      const result = await createServiceBooking(
        serviceId,
        providerId,
        eventDate,
        price,
        notes
      );

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
        }, 2500);
      }
    });
  };

  const isAvailable = availabilityStatus !== "offline";

  return (
    <>
      {/* Desktop Sticky Widget */}
      <div className="glass-card w-full border border-white/10 bg-[#09090f]/90 p-6 shadow-[0_20px_80px_rgba(217,70,239,0.08)] space-y-6">
        <div className="space-y-2.5">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Precio base</span>
            <span className="text-3xl font-black text-emerald-400 font-outfit">${price}</span>
          </div>
          <p className="text-[11px] text-zinc-400">Impuestos y tasas incluidos. Cotización directa.</p>
        </div>

        {/* Info stats */}
        <div className="divide-y divide-white/5 border-t border-b border-white/5 py-4 space-y-3.5">
          <div className="flex items-center justify-between text-xs pt-3 first:pt-0">
            <span className="text-zinc-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary-400" />
              Duración base
            </span>
            <span className="text-zinc-300 font-semibold">{duration}</span>
          </div>

          <div className="flex items-center justify-between text-xs pt-3">
            <span className="text-zinc-500 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Tiempo de respuesta
            </span>
            <span className="text-zinc-300 font-semibold">{responseTime}</span>
          </div>

          <div className="flex items-center justify-between text-xs pt-3">
            <span className="text-zinc-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-accent-400" />
              Estado operativo
            </span>
            <span className={`font-semibold capitalize flex items-center gap-1 ${
              availabilityStatus === 'available' ? 'text-emerald-400' :
              availabilityStatus === 'busy' ? 'text-amber-400' : 'text-zinc-500'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                availabilityStatus === 'available' ? 'bg-emerald-500 animate-pulse' :
                availabilityStatus === 'busy' ? 'bg-amber-500' : 'bg-zinc-500'
              }`} />
              {availabilityStatus === 'available' ? 'disponible' :
               availabilityStatus === 'busy' ? 'ocupado' : 'no disponible'}
            </span>
          </div>
        </div>

        <button
          onClick={handleOpenBooking}
          disabled={!isAvailable}
          className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-2xl py-4 px-4 font-bold text-sm transition-all flex items-center justify-center gap-2 glow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg active:scale-98"
        >
          {isAvailable ? "Solicitar Reserva" : "No disponible"}
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[10px] text-zinc-500 text-center">
          No se realizará ningún cobro hasta que el proveedor confirme tu solicitud.
        </p>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-zinc-950/90 backdrop-blur-md border-t border-white/10 p-4 flex items-center justify-between md:hidden px-6">
        <div>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Precio</p>
          <p className="text-xl font-extrabold text-emerald-400 font-outfit">${price}</p>
        </div>
        <button
          onClick={handleOpenBooking}
          disabled={!isAvailable}
          className="bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 px-6 text-xs font-bold transition-all glow disabled:opacity-50 cursor-pointer"
        >
          {isAvailable ? "Reservar" : "Offline"}
        </button>
      </div>

      {/* Booking Modal (AnimatePresence) */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md overflow-hidden relative border-white/10"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Solicitud de Reserva</h3>
                  <p className="text-xs text-zinc-400">Reserva de servicio profesional</p>
                </div>
                <button
                  onClick={handleCloseBooking}
                  disabled={isPending}
                  className="text-zinc-400 hover:text-white disabled:opacity-50 transition-colors cursor-pointer"
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
                    <span>¡Reserva enviada! Esperando respuesta del proveedor.</span>
                  </div>
                )}

                {/* Service Details Card */}
                <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-1">
                  <span className="text-[10px] text-primary-400 font-bold uppercase tracking-wider">Servicio Seleccionado</span>
                  <h4 className="font-semibold text-white truncate">{serviceTitle}</h4>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-zinc-400">Precio Total (Base)</span>
                    <span className="text-md font-extrabold text-emerald-400">${price}</span>
                  </div>
                </div>

                {/* Date Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 ml-1">Fecha de la Fiesta / Evento</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                      disabled={isPending || success}
                      className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                    />
                  </div>
                </div>

                {/* Notes Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 ml-1">Notas / Requerimientos Especiales</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe los detalles de tu evento (horario, tipo de música, espacio, etc.)"
                    disabled={isPending || success}
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50 min-h-[80px] resize-none"
                  />
                </div>

                {/* Confirm Button */}
                {!success && (
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 px-4 font-semibold text-sm transition-all flex items-center justify-center gap-2 glow disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Procesando Reserva...
                      </>
                    ) : (
                      "Confirmar y Enviar Solicitud"
                    )}
                  </button>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
