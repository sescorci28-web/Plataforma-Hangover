"use client";

import { useState, useTransition } from "react";
import { validateQRCode } from "@/app/services/actions";
import { QrCode, Loader2, CheckCircle2, XCircle, User, Ticket, Calendar, Users, DollarSign, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function QRValidatorForm() {
  const [qrInput, setQrInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) return;

    setError(null);
    setSuccessData(null);

    startTransition(async () => {
      const res = await validateQRCode(qrInput.trim());
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessData(res.bookingDetails);
        setQrInput(""); // Clear input for next scan
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Form Input Card */}
      <div className="glass-card p-6 bg-[#0c0c14] border border-white/10 rounded-2xl relative overflow-hidden">
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-accent-600/10 rounded-full blur-2xl pointer-events-none" />
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="qr-code" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
              Código de la Entrada / Reserva
            </label>
            <div className="relative">
              <input
                id="qr-code"
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="Pega el código QR (Ej: QR-550e8400...)"
                disabled={isPending}
                className="w-full bg-black/40 border border-white/10 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition-all"
                autoFocus
              />
              <QrCode className="w-5 h-5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || !qrInput.trim()}
            className="w-full bg-accent-600 hover:bg-accent-500 disabled:opacity-50 text-white rounded-xl py-3 font-semibold text-sm transition-all flex items-center justify-center gap-2 glow cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validando...
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4" />
                Validar Acceso
              </>
            )}
          </button>
        </form>
      </div>

      {/* Alert states with framer-motion */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4"
          >
            <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-red-300 text-sm">Entrada Inválida</h4>
              <p className="text-xs text-zinc-300 leading-relaxed">{error}</p>
            </div>
          </motion.div>
        )}

        {successData && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Main success banner */}
            <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-emerald-300 text-sm">¡Acceso Autorizado!</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  La entrada ha sido marcada como **usada** y validada correctamente en el sistema.
                </p>
              </div>
            </div>

            {/* Ticket details summary */}
            <div className="glass-card p-6 bg-[#0c0c14]/40 border border-white/5 rounded-2xl space-y-4">
              <h3 className="text-xs font-semibold text-accent-400 uppercase tracking-wider">Detalles de la Reserva</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-zinc-400 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Cliente</p>
                    <p className="text-sm font-semibold text-white">{successData.buyerName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-zinc-400 shrink-0">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Evento / Discoteca</p>
                    <p className="text-sm font-semibold text-white truncate max-w-[180px]">{successData.title}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-zinc-400 shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Invitados</p>
                    <p className="text-sm font-semibold text-white">{successData.numberOfPeople} personas</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-zinc-400 shrink-0">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Monto Total</p>
                    <p className="text-sm font-semibold text-emerald-400">${successData.totalAmount}</p>
                  </div>
                </div>
              </div>

              {successData.eventDate && (
                <div className="border-t border-white/5 pt-3 flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    Fecha del Evento:
                  </span>
                  <span className="text-zinc-200 capitalize font-medium">
                    {new Date(successData.eventDate).toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long"
                    })}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
