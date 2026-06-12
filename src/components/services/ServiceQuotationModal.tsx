'use client';

import React, { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { createServiceBooking } from "@/app/services/actions";
import { Calendar, Clock, DollarSign, ShieldCheck, X, Loader2, CheckCircle2, AlertTriangle, ArrowRight, MapPin, Users, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ServiceQuotationModalProps {
  serviceId: string;
  providerId: string;
  serviceTitle: string;
  price: number;
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

const EVENT_TYPES = [
  { id: "Cumpleaños", name: "Cumpleaños" },
  { id: "Fiesta Privada", name: "Fiesta Privada" },
  { id: "Boda / Matrimonio", name: "Boda / Matrimonio" },
  { id: "Evento Corporativo", name: "Evento Corporativo" },
  { id: "Graduación", name: "Graduación" },
  { id: "Concierto", name: "Concierto" },
  { id: "Otro", name: "Otro" }
];

export function ServiceQuotationModal({
  serviceId,
  providerId,
  serviceTitle,
  price,
  user,
  isOpen,
  onClose
}: ServiceQuotationModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const [eventDate, setEventDate] = useState("");
  const [bookingCity, setBookingCity] = useState("");
  const [eventType, setEventType] = useState("Fiesta Privada");
  const [guestsCount, setGuestsCount] = useState(50);
  const [budget, setBudget] = useState(price);
  const [notes, setNotes] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirmQuote = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!user) {
      const currentPath = window.location.pathname;
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      return;
    }

    if (!eventDate) {
      setError("La fecha del evento es obligatoria.");
      return;
    }

    if (!bookingCity.trim()) {
      setError("La ciudad del evento es obligatoria.");
      return;
    }

    startTransition(async () => {
      // Create notes combining message and details
      const structuredNotes = `[COTIZACIÓN] Tipo: ${eventType} | Ciudad: ${bookingCity} | Invitados: ${guestsCount} | Notas: ${notes}`;
      
      const result = await createServiceBooking(
        serviceId,
        providerId,
        eventDate,
        budget, // Budget acts as total amount
        structuredNotes,
        {
          eventType,
          bookingCity,
          budget,
          guestsCount
        }
      );

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2500);
      }
    });
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg overflow-hidden relative border border-white/10 bg-zinc-950/98 backdrop-blur-xl shadow-[0_0_60px_rgba(217,70,239,0.15)] rounded-[28px] max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white font-outfit">Solicitar Cotización</h3>
                <p className="text-xs text-zinc-400">Rellena los datos para recibir una propuesta formal del proveedor.</p>
              </div>
              <button
                onClick={onClose}
                disabled={isPending}
                className="w-8 h-8 rounded-full border border-white/5 bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content scrollable */}
            <form onSubmit={handleConfirmQuote} className="p-6 overflow-y-auto space-y-5 flex-grow scrollbar-thin max-h-[calc(90vh-120px)]">
              {error && (
                <div className="flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-400 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>¡Cotización enviada con éxito! Revisa tu Panel de Actividad.</span>
                </div>
              )}

              {/* Service Details Card */}
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
                <span className="text-[9px] text-primary-400 font-extrabold uppercase tracking-widest block">Servicio a cotizar</span>
                <h4 className="font-bold text-white text-sm truncate font-outfit">{serviceTitle}</h4>
                <div className="flex justify-between items-center pt-2 text-xs">
                  <span className="text-zinc-500">Precio de referencia desde</span>
                  <span className="font-extrabold text-emerald-400 font-outfit">${price.toLocaleString("es-CO")} COP</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 ml-1">Fecha del Evento</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                      disabled={isPending || success}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                    />
                  </div>
                </div>

                {/* City Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 ml-1">Ciudad del Evento</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                    <input
                      type="text"
                      value={bookingCity}
                      onChange={(e) => setBookingCity(e.target.value)}
                      placeholder="Ej. Barranquilla, Pto Colombia"
                      required
                      disabled={isPending || success}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Event Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 ml-1">Tipo de Evento</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    disabled={isPending || success}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-3.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50 cursor-pointer"
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t.id} value={t.id} className="bg-zinc-950 text-white">
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Guests Count */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 ml-1">Invitados Estimados</label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                    <input
                      type="number"
                      min={1}
                      value={guestsCount}
                      onChange={(e) => setGuestsCount(parseInt(e.target.value) || 0)}
                      required
                      disabled={isPending || success}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Budget Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 ml-1">Tu Presupuesto Estimado ($ COP)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="number"
                    min={1}
                    value={budget}
                    onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                    required
                    disabled={isPending || success}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white font-semibold focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                  />
                </div>
              </div>

              {/* Message/Notes Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 ml-1">Mensaje o Requerimientos Adicionales</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalla qué esperas del servicio (duración del show, géneros musicales, espacio disponible, etc.)"
                  disabled={isPending || success}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-xs text-white placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-primary-500/50 min-h-[90px] resize-none font-sans"
                />
              </div>

              {/* Confirm Button */}
              {!success && (
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-primary-600 hover:bg-primary-500 active:scale-[0.98] text-white rounded-xl py-4 px-4 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 glow disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer shadow-lg shadow-primary-500/10"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      Enviando solicitud de cotización...
                    </>
                  ) : (
                    <>
                      <span>Enviar Solicitud de Cotización</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
