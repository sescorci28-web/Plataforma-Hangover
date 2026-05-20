"use client";

import { useState, useTransition } from "react";
import { createServiceBooking } from "@/app/services/actions";
import { Service, Profile } from "@/types/database.types";
import { Calendar, Clock, DollarSign, MapPin, Sparkles, Filter, X, ArrowRight, Loader2, CheckCircle2, AlertTriangle, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface ExtendedService extends Service {
  provider: {
    full_name: string | null;
    city: string | null;
  } | null;
}

interface ServicesListProps {
  initialServices: ExtendedService[];
  user: any;
}

const CATEGORIES = [
  { id: "all", name: "Todos" },
  { id: "dj", name: "DJs & Música" },
  { id: "bar", name: "Bares & Coctelería" },
  { id: "staff", name: "Personal de Servicio" },
  { id: "security", name: "Seguridad" },
  { id: "catering", name: "Catering & Comida" }
];

export function ServicesList({ initialServices, user }: ServicesListProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [bookingService, setBookingService] = useState<ExtendedService | null>(null);
  const [eventDate, setEventDate] = useState("");
  const [notes, setNotes] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filteredServices = selectedCategory === "all"
    ? initialServices
    : initialServices.filter(s => s.category.toLowerCase() === selectedCategory.toLowerCase());

  const handleOpenBooking = (service: ExtendedService) => {
    if (!user) {
      window.location.href = "/login?redirect=/services";
      return;
    }
    setBookingService(service);
    setEventDate("");
    setNotes("");
    setError(null);
    setSuccess(false);
  };

  const handleCloseBooking = () => {
    if (isPending) return;
    setBookingService(null);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingService) return;
    setError(null);
    setSuccess(false);

    if (!eventDate) {
      setError("La fecha del evento es obligatoria.");
      return;
    }

    startTransition(async () => {
      const result = await createServiceBooking(
        bookingService.id,
        bookingService.provider_id,
        eventDate,
        bookingService.price,
        notes
      );

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          setBookingService(null);
          setSuccess(false);
        }, 3000);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Category Filters */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <Filter className="w-4 h-4 text-zinc-500 mr-1" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-primary-600 border-primary-500 text-white glow"
                  : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-xl mx-auto space-y-4">
          <BookOpen className="w-12 h-12 text-zinc-500 mx-auto" />
          <h3 className="text-xl font-bold text-white">No se encontraron servicios</h3>
          <p className="text-zinc-400 text-sm">
            Aún no hay servicios registrados en la categoría seleccionada. Si eres proveedor, ¡puedes ser el primero en publicar!
          </p>
          <div className="pt-2">
            <Link 
              href="/dashboard/provider" 
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
            >
              Ir a mi panel de Proveedor
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => {
            const displayCity = service.provider?.city || "No especificada";
            const providerName = service.provider?.full_name || "Proveedor Hangover";

            // Fallback gradient colors depending on service category
            let categoryGradient = "from-purple-600 to-indigo-600";
            if (service.category === "bar") categoryGradient = "from-rose-600 to-amber-600";
            if (service.category === "staff") categoryGradient = "from-sky-600 to-teal-600";
            if (service.category === "security") categoryGradient = "from-slate-600 to-zinc-700";
            if (service.category === "catering") categoryGradient = "from-emerald-600 to-lime-600";

            return (
              <div key={service.id} className="glass-card overflow-hidden hover:border-white/20 transition-all flex flex-col h-full group">
                {/* Image / Gradient Header */}
                <div className="relative h-48 w-full bg-zinc-950 flex-shrink-0">
                  {service.image_url ? (
                    <img
                      src={service.image_url}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-tr ${categoryGradient} opacity-60 flex items-center justify-center`}>
                      <Sparkles className="w-12 h-12 text-white/30" />
                    </div>
                  )}
                  <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-primary-400 capitalize">
                    {service.category}
                  </span>
                </div>

                {/* Body Content */}
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 text-xs truncate max-w-[150px]">Por {providerName}</span>
                      <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                        <MapPin className="w-3.5 h-3.5 text-primary-400" />
                        {displayCity}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-primary-400 transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-zinc-400 text-sm line-clamp-3 min-h-[60px]">
                      {service.description || "Sin descripción proporcionada por el proveedor."}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-white/5 mt-6 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Precio</p>
                      <p className="text-xl font-extrabold text-emerald-400 font-outfit">
                        ${service.price}
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenBooking(service)}
                      className="bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-2.5 px-4 text-xs font-semibold transition-all flex items-center gap-1.5 glow cursor-pointer"
                    >
                      Reservar
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Modal */}
      <AnimatePresence>
        {bookingService && (
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
                  <h3 className="text-lg font-bold text-white">Solicitud de Reserva</h3>
                  <p className="text-xs text-zinc-400">Reserva de servicio profesional</p>
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
                    <span>¡Reserva enviada! Esperando respuesta del proveedor.</span>
                  </div>
                )}

                {/* Service Details Card */}
                <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-1">
                  <span className="text-[10px] text-primary-400 font-bold uppercase tracking-wider">Servicio Seleccionado</span>
                  <h4 className="font-semibold text-white truncate">{bookingService.title}</h4>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-zinc-400">Precio Total (Base)</span>
                    <span className="text-md font-extrabold text-emerald-400">${bookingService.price}</span>
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
                    className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 px-4 font-semibold text-sm transition-all flex items-center justify-center gap-2 glow disabled:opacity-50 disabled:cursor-not-allowed mt-2"
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
    </div>
  );
}
