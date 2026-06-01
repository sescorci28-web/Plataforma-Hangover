"use client";

import { useState, useTransition } from "react";
import { createEvent } from "@/app/services/actions";
import { Sparkles, DollarSign, MapPin, AlignLeft, Calendar, FileText, Loader2, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function NewEventForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!title.trim()) {
      setError("El título del evento es requerido.");
      return;
    }

    if (!eventDate) {
      setError("La fecha y hora del evento son requeridas.");
      return;
    }

    if (!location.trim()) {
      setError("La ubicación del evento es requerida.");
      return;
    }

    const priceNum = Number(ticketPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setError("El precio de la entrada debe ser un número válido mayor o igual a cero.");
      return;
    }

    startTransition(async () => {
      const result = await createEvent(
        title,
        description,
        eventDate,
        location,
        priceNum,
        imageUrl || undefined
      );

      if (result.error) {
        setError(result.error);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          router.push("/dashboard/provider");
          router.refresh();
        }, 2000);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>{error}</div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>¡Evento publicado con éxito! Redirigiendo al panel...</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {/* Título */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-300 ml-1">Título del Evento</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Sparkles className="h-5 w-5 text-zinc-500" />
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending || success}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-all text-sm"
              placeholder="Ej. Fiesta de Fin de Año VIP"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fecha */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-300 ml-1">Fecha y Hora</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-zinc-500" />
              </div>
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                disabled={isPending || success}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-all text-sm cursor-pointer"
                required
              />
            </div>
          </div>

          {/* Precio de entrada */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-300 ml-1">Precio de la Entrada ($)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-zinc-500" />
              </div>
              <input
                type="number"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(e.target.value)}
                disabled={isPending || success}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-all text-sm"
                placeholder="Ej. 15 (0 para evento gratuito)"
                min="0"
                required
              />
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-300 ml-1">Ubicación / Lugar</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-zinc-500" />
            </div>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isPending || success}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-all text-sm"
              placeholder="Ej. Calle Falsa 123, Hangover Club"
              required
            />
          </div>
        </div>

        {/* URL de Imagen */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-300 ml-1">URL de la Imagen (Opcional)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FileText className="h-5 w-5 text-zinc-500" />
            </div>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={isPending || success}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-all text-sm"
              placeholder="https://ejemplo.com/flyer-evento.jpg"
            />
          </div>
        </div>

        {/* Descripción */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-300 ml-1">Descripción del Evento</label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none">
              <AlignLeft className="h-5 w-5 text-zinc-500" />
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending || success}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-all text-sm min-h-[140px] resize-y"
              placeholder="Detalla las actividades, line-up de DJs, condiciones de entrada, código de vestimenta, etc."
              required
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-between items-center border-t border-white/5">
        <Link 
          href="/dashboard/provider"
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Panel
        </Link>

        <button
          type="submit"
          disabled={isPending || success}
          className="w-full sm:w-auto min-w-[200px] bg-accent-600 hover:bg-accent-500 text-white rounded-xl py-3 px-6 font-semibold text-sm transition-all glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Publicando...
            </>
          ) : (
            "Publicar Evento"
          )}
        </button>
      </div>
    </form>
  );
}
