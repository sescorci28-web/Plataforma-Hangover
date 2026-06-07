"use client";

import { useTransition, useState } from "react";
import { createEventBooking } from "@/app/services/actions";
import { Loader2, Ticket, CheckCircle2, AlertTriangle, LogIn, Lock } from "lucide-react";

interface EventDetailActionsProps {
  eventId: string;
  eventDate: string;
  ticketPrice: number;
  isAuthenticated: boolean;
  variant?: "default" | "sticky-bar";
}

export function EventDetailActions({ eventId, eventDate, ticketPrice, isAuthenticated, variant = "default" }: EventDetailActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBooking = () => {
    if (!isAuthenticated) {
      const currentPath = window.location.pathname;
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
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
        setTimeout(() => {
          window.location.reload(); // Reload to refresh page counters
        }, 2500);
      }
    });
  };

  const handleLoginRedirect = () => {
    const currentPath = window.location.pathname;
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
  };

  if (variant === "sticky-bar") {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 border-t border-white/10 p-4 flex items-center justify-between backdrop-blur-xl md:hidden shadow-2xl">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Entrada Oficial</span>
          <span className="text-lg font-black text-emerald-400 font-outfit">
            {ticketPrice > 0 ? `$${ticketPrice}` : "Gratis"}
          </span>
        </div>
        <div className="w-[200px]">
          {success ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] py-2 px-3 rounded-lg text-center font-bold">
              ¡Entrada Reservada!
            </div>
          ) : isAuthenticated ? (
            <button
              onClick={handleBooking}
              disabled={isPending}
              className="w-full cursor-pointer bg-gradient-to-r from-primary-600 to-rose-600 hover:from-primary-500 hover:to-rose-500 text-white rounded-xl py-3 px-4 font-bold text-xs transition-all flex items-center justify-center gap-1.5 glow disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Ticket className="w-3.5 h-3.5" />
              )}
              {ticketPrice > 0 ? "Comprar Ahora" : "Reservar Gratis"}
            </button>
          ) : (
            <button
              onClick={handleLoginRedirect}
              className="w-full cursor-pointer bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-xl py-3 px-4 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <CheckCircle2 className="w-4 h-4 shrink-0 animate-bounce text-emerald-400" />
          <span>¡Reserva confirmada con éxito! Revisa tu panel para ver tus tickets.</span>
        </div>
      )}

      {!success && (
        isAuthenticated ? (
          <div className="space-y-3">
            <button
              onClick={handleBooking}
              disabled={isPending}
              className="w-full cursor-pointer bg-gradient-to-r from-primary-600 to-rose-600 hover:from-primary-500 hover:to-rose-500 text-white rounded-xl py-3.5 px-4 font-bold text-sm transition-all flex items-center justify-center gap-2 glow hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 shadow-lg shadow-primary-600/20"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  Procesando Reserva...
                </>
              ) : (
                <>
                  <Ticket className="w-4.5 h-4.5 shrink-0" />
                  {ticketPrice > 0 ? `Comprar Entrada Ahora - $${ticketPrice}` : "Reservar Entrada Gratuita"}
                </>
              )}
            </button>
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500">
              <Lock className="w-3 h-3 text-zinc-500" />
              <span>Transacción encriptada y segura</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 rounded-2xl border border-white/10 bg-black/40 p-5 text-center">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Inicia sesión o regístrate en Hangover para reservar o comprar tus entradas para este evento.
            </p>
            <button
              onClick={handleLoginRedirect}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 px-4 py-3 text-xs font-bold text-white transition-all w-full cursor-pointer hover:scale-[1.01] active:scale-[0.99] shadow-md"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              Iniciar Sesión para Comprar
            </button>
          </div>
        )
      )}
    </div>
  );
}
