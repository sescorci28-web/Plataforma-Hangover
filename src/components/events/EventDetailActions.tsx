"use client";

import { useTransition, useState } from "react";
import { createEventBooking } from "@/app/services/actions";
import { Loader2, Ticket, CheckCircle2, AlertTriangle, LogIn } from "lucide-react";
import Link from "next/link";

interface EventDetailActionsProps {
  eventId: string;
  eventDate: string;
  ticketPrice: number;
  isAuthenticated: boolean;
}

export function EventDetailActions({ eventId, eventDate, ticketPrice, isAuthenticated }: EventDetailActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBooking = () => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=/events/${eventId}`;
      return;
    }
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await createEventBooking(eventId, eventDate, ticketPrice);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>¡Reserva confirmada con éxito! Revisa tu panel de usuario para ver tus tickets.</span>
        </div>
      )}

      {!success && (
        isAuthenticated ? (
          <button
            onClick={handleBooking}
            disabled={isPending}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 px-4 font-semibold text-sm transition-all flex items-center justify-center gap-2 glow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Procesando Reserva...
              </>
            ) : (
              <>
                <Ticket className="w-4 h-4" />
                {ticketPrice > 0 ? `Adquirir Entrada - $${ticketPrice}` : "Reservar Entrada Gratuita"}
              </>
            )}
          </button>
        ) : (
          <div className="space-y-3 rounded-xl border border-white/10 bg-black/35 p-4 text-center">
            <p className="text-xs text-zinc-400">Inicia sesión para reservar o comprar tus entradas para este evento.</p>
            <Link
              href={`/login?redirect=/events/${eventId}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 hover:bg-primary-500 px-4 py-2 text-xs font-semibold text-white transition-colors w-full"
            >
              <LogIn className="w-4 h-4" />
              Iniciar Sesión
            </Link>
          </div>
        )
      )}
    </div>
  );
}
