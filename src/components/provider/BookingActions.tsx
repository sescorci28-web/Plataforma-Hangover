"use client";

import { useTransition, useState } from "react";
import { updateBookingStatus } from "@/app/services/actions";
import { Loader2, Check, X, CheckSquare, Play } from "lucide-react";

interface BookingActionsProps {
  bookingId: string;
  currentStatus: string;
}

export function BookingActions({ bookingId, currentStatus }: BookingActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [actionType, setActionType] = useState<"accept" | "reject" | "start" | "complete" | null>(null);

  const getNormalizedStatus = (s: string) => {
    const val = (s || "").toUpperCase();
    if (val === "CONFIRMED") return "PAID";
    return val;
  };

  const status = getNormalizedStatus(currentStatus);

  const handleAction = (
    nextStatus: "ACCEPTED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED",
    type: "accept" | "reject" | "start" | "complete"
  ) => {
    setActionType(type);
    startTransition(async () => {
      const res = await updateBookingStatus(bookingId, nextStatus);
      if (res?.error) {
        alert(res.error);
      }
      setActionType(null);
    });
  };

  if (["COMPLETED", "CANCELLED", "REJECTED", "REFUNDED", "EXPIRED"].includes(status)) {
    return null;
  }

  return (
    <div className="flex items-center gap-2.5 w-full sm:w-auto">
      {status === "PENDING" && (
        <>
          <button
            onClick={() => handleAction("REJECTED", "reject")}
            disabled={isPending}
            className="flex-1 sm:flex-none px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-zinc-300 hover:text-white border border-white/5"
          >
            {isPending && actionType === "reject" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
            ) : (
              <X className="w-3.5 h-3.5 text-red-400" />
            )}
            Rechazar
          </button>

          <button
            onClick={() => handleAction("ACCEPTED", "accept")}
            disabled={isPending}
            className="flex-1 sm:flex-none px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 glow border border-primary-500/20"
          >
            {isPending && actionType === "accept" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Check className="w-3.5 h-3.5 text-white" />
            )}
            Aceptar
          </button>
        </>
      )}

      {status === "ACCEPTED" && (
        <span className="text-xs text-zinc-400 font-bold bg-white/5 border border-white/5 px-3.5 py-2 rounded-xl uppercase tracking-wider block">
          Espera pago del cliente
        </span>
      )}

      {status === "PAID" && (
        <button
          onClick={() => handleAction("IN_PROGRESS", "start")}
          disabled={isPending}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-blue-500/20"
        >
          {isPending && actionType === "start" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
          ) : (
            <Play className="w-3.5 h-3.5 text-white fill-white" />
          )}
          Iniciar Servicio
        </button>
      )}

      {status === "IN_PROGRESS" && (
        <button
          onClick={() => handleAction("COMPLETED", "complete")}
          disabled={isPending}
          className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-emerald-500/20 animate-pulse"
        >
          {isPending && actionType === "complete" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
          ) : (
            <CheckSquare className="w-3.5 h-3.5 text-white" />
          )}
          Finalizar
        </button>
      )}
    </div>
  );
}
