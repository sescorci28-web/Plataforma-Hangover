"use client";

import { useTransition, useState } from "react";
import { updateBookingStatus } from "@/app/services/actions";
import { Loader2, Check, X, CheckSquare } from "lucide-react";

interface BookingActionsProps {
  bookingId: string;
  currentStatus: string;
}

export function BookingActions({ bookingId, currentStatus }: BookingActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [actionType, setActionType] = useState<"confirm" | "reject" | "complete" | null>(null);

  const handleAction = (
    status: "confirmed" | "rejected" | "completed",
    type: "confirm" | "reject" | "complete"
  ) => {
    setActionType(type);
    startTransition(async () => {
      await updateBookingStatus(bookingId, status);
      setActionType(null);
    });
  };

  if (currentStatus === "completed" || currentStatus === "cancelled" || currentStatus === "rejected") {
    return null;
  }

  return (
    <div className="flex items-center gap-2.5 w-full sm:w-auto">
      {currentStatus === "pending" && (
        <>
          <button
            onClick={() => handleAction("rejected", "reject")}
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
            onClick={() => handleAction("confirmed", "confirm")}
            disabled={isPending}
            className="flex-1 sm:flex-none px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 glow border border-primary-500/20"
          >
            {isPending && actionType === "confirm" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Check className="w-3.5 h-3.5 text-white" />
            )}
            Confirmar
          </button>
        </>
      )}

      {currentStatus === "confirmed" && (
        <>
          <button
            onClick={() => handleAction("rejected", "reject")}
            disabled={isPending}
            className="flex-1 sm:flex-none px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 disabled:opacity-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-red-400 hover:text-red-300"
          >
            {isPending && actionType === "reject" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
            ) : (
              <X className="w-3.5 h-3.5" />
            )}
            Rechazar
          </button>

          <button
            onClick={() => handleAction("completed", "complete")}
            disabled={isPending}
            className="flex-1 sm:flex-none px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 glow border border-primary-500/20"
          >
            {isPending && actionType === "complete" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <CheckSquare className="w-3.5 h-3.5" />
            )}
            Completar
          </button>
        </>
      )}
    </div>
  );
}
