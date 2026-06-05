"use client";

import { useEffect, useRef, useState } from "react";
import { checkQRCode, confirmQRAdmission } from "@/app/services/actions";
import { QrCode, Loader2, CheckCircle2, XCircle, AlertTriangle, User, Ticket, Calendar, Users, DollarSign, Camera, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function QrScanner() {
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanStatus, setScanStatus] = useState<"valid" | "used" | "cancelled" | "invalid" | "scanning" | "error" | "processing" | "confirmed_success">("scanning");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const scannerRef = useRef<any>(null);

  const startScanner = () => {
    setScanResult(null);
    setErrorMsg(null);
    setScanStatus("scanning");
    setIsConfirming(false);

    // Dynamic import to prevent SSR (Server-Side Rendering) failures in Next.js
    import("html5-qrcode").then((module) => {
      // Small timeout to ensure the DOM element "qr-reader" exists
      setTimeout(async () => {
        const qrReaderElem = document.getElementById("qr-reader");
        if (!qrReaderElem) return;

        let html5Qrcode = scannerRef.current;

        // Clean up or reuse the existing instance
        if (!html5Qrcode) {
          html5Qrcode = new module.Html5Qrcode("qr-reader");
          scannerRef.current = html5Qrcode;
        } else {
          try {
            if (html5Qrcode.isScanning) {
              await html5Qrcode.stop();
            }
          } catch (err) {
            console.warn("Error stopping scanner before reuse:", err);
          }
        }

        const onScanSuccess = async (decodedText: string) => {
          console.log(`Scan success: ${decodedText}`);
          
          // Stop scanner before processing the result
          try {
            if (html5Qrcode.isScanning) {
              await html5Qrcode.stop();
            }
          } catch (err) {
            console.error("Error stopping scanner on success:", err);
          }

          setScanStatus("processing");

          try {
            const res = await checkQRCode(decodedText);
            if (res.error) {
              setScanStatus("invalid");
              setErrorMsg(res.error);
            } else {
              setScanResult(res.bookingDetails);
              setScanStatus(res.status as any);
            }
          } catch (err: any) {
            setScanStatus("error");
            setErrorMsg(err.message || "Error al procesar el código QR.");
          }
        };

        const onScanFailure = (error: any) => {
          // Quietly log scanner failures as they happen continuously
        };

        try {
          await html5Qrcode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            onScanSuccess,
            onScanFailure
          );
        } catch (err: any) {
          console.error("Error starting camera:", err);
          setScanStatus("error");
          setErrorMsg("No se pudo iniciar la cámara. Asegúrate de conceder los permisos correspondientes.");
        }
      }, 100);
    }).catch(err => {
      console.error("Failed to load html5-qrcode library", err);
      setScanStatus("error");
      setErrorMsg("No fue posible cargar el módulo del escáner.");
    });
  };

  useEffect(() => {
    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((err: any) => {
          console.error("Error stopping scanner on unmount:", err);
        });
      }
    };
  }, []);

  const handleReset = () => {
    startScanner();
  };

  const handleConfirmAdmission = async () => {
    if (!scanResult || !scanResult.id) return;
    setIsConfirming(true);
    try {
      const res = await confirmQRAdmission(scanResult.id);
      if (res.error) {
        setScanStatus("error");
        setErrorMsg(res.error);
      } else {
        setScanStatus("confirmed_success");
        // Update local scanResult with the validation timestamp
        setScanResult((prev: any) => ({
          ...prev,
          qrValidatedAt: res.qrValidatedAt
        }));
      }
    } catch (err: any) {
      setScanStatus("error");
      setErrorMsg(err.message || "Error al confirmar el ingreso.");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Scanner View (Always mounted in DOM to prevent race conditions with html5-qrcode and AnimatePresence) */}
      <div className={scanStatus === "scanning" ? "block" : "hidden"}>
        <div className="glass-card p-6 bg-[#0c0c14] border border-white/10 rounded-2xl relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary-600/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center gap-2 text-primary-400 font-semibold uppercase tracking-wider text-xs">
              <Camera className="w-4 h-4 animate-pulse" />
              <span>Cámara Activa</span>
            </div>
            
            <div className="max-w-sm mx-auto overflow-hidden rounded-2xl border border-white/10 bg-black/40 relative">
              <div id="qr-reader" className="w-full h-full" />
            </div>
            
            <p className="text-xs text-zinc-400">
              Apunta tu cámara al código QR de la entrada para escanearlo automáticamente.
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {scanStatus === "processing" && (
          <motion.div
            key="processing-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card p-12 bg-[#0c0c14] border border-white/10 rounded-2xl text-center space-y-4"
          >
            <Loader2 className="w-12 h-12 text-primary-400 animate-spin mx-auto" />
            <h3 className="text-white font-bold font-outfit text-lg">Validando Código QR</h3>
            <p className="text-zinc-400 text-sm">Consultando los detalles de la reserva de forma segura...</p>
          </motion.div>
        )}

        {scanStatus === "valid" && scanResult && (
          <motion.div
            key="valid-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Valid QR Banner */}
            <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-emerald-300 text-sm">✅ Entrada Válida</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  El código QR es válido. Haz clic en "Confirmar Ingreso" para registrar el acceso del cliente.
                </p>
              </div>
            </div>

            {/* Booking Details Card */}
            <BookingDetailsCard details={scanResult} />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleConfirmAdmission}
                disabled={isConfirming}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl py-3 font-semibold text-sm transition-all flex items-center justify-center gap-2 glow cursor-pointer"
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar Ingreso
                  </>
                )}
              </button>
              <button
                onClick={handleReset}
                disabled={isConfirming}
                className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl px-5 py-3 font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-white/5 cursor-pointer font-medium"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}

        {scanStatus === "confirmed_success" && scanResult && (
          <motion.div
            key="success-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Admission Confirmed Success Banner */}
            <div className="p-5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-emerald-300 text-sm">¡Ingreso Confirmado Exitosamente!</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  El ingreso ha sido registrado a las {scanResult.qrValidatedAt ? new Date(scanResult.qrValidatedAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "este momento"}.
                </p>
              </div>
            </div>

            {/* Booking Details Card */}
            <BookingDetailsCard details={scanResult} />

            {/* Reset Button (Scan Next) */}
            <button
              onClick={handleReset}
              className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 font-semibold text-sm transition-all flex items-center justify-center gap-2 glow cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Escanear Siguiente
            </button>
          </motion.div>
        )}

        {scanStatus === "used" && scanResult && (
          <motion.div
            key="used-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Already Used QR Banner */}
            <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4">
              <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-red-300 text-sm">❌ QR YA UTILIZADO</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Este ticket fue validado anteriormente el{" "}
                  <span className="font-semibold text-white">
                    {scanResult.qrValidatedAt
                      ? new Date(scanResult.qrValidatedAt).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        }) +
                        " a las " +
                        new Date(scanResult.qrValidatedAt).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : "fecha desconocida"}
                  </span>.
                  Ingreso bloqueado.
                </p>
              </div>
            </div>

            {/* Booking Details Card */}
            <BookingDetailsCard details={scanResult} />

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 font-semibold text-sm transition-all flex items-center justify-center gap-2 glow cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Escanear de Nuevo
            </button>
          </motion.div>
        )}

        {(scanStatus === "invalid" || scanStatus === "cancelled" || scanStatus === "error") && (
          <motion.div
            key="invalid-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Invalid QR Banner */}
            <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4">
              <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-red-300 text-sm">Entrada Inválida</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {errorMsg || "El código QR ingresado no existe en la base de datos o está cancelado."}
                </p>
              </div>
            </div>

            {/* Booking Details Card if exists */}
            {scanResult && <BookingDetailsCard details={scanResult} />}

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 font-semibold text-sm transition-all flex items-center justify-center gap-2 glow cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Escanear de Nuevo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BookingDetailsCard({ details }: { details: any }) {
  return (
    <div className="glass-card p-6 bg-[#0c0c14]/40 border border-white/5 rounded-2xl space-y-4">
      <h3 className="text-xs font-semibold text-primary-400 uppercase tracking-wider">Detalles de la Reserva</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-zinc-400 shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Cliente</p>
            <p className="text-sm font-semibold text-white">{details.buyerName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-zinc-400 shrink-0">
            <Ticket className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Evento / Discoteca</p>
            <p className="text-sm font-semibold text-white truncate max-w-[180px]">{details.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-zinc-400 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Invitados</p>
            <p className="text-sm font-semibold text-white">{details.numberOfPeople} personas</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-zinc-400 shrink-0">
            <Ticket className="w-4 h-4 text-primary-400" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Tipo de Pase</p>
            <p className="text-sm font-semibold text-white">
              {details.bookingType === "club_cover"
                ? "Cover Entrada"
                : details.bookingType === "event"
                ? "Entrada Evento"
                : details.bookingType === "club_vip"
                ? "Mesa VIP"
                : details.bookingType === "service"
                ? "Servicio"
                : "Reserva"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-zinc-400 shrink-0">
            <DollarSign className="w-4 h-4 text-primary-400" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Monto Total</p>
            <p className="text-sm font-semibold text-white">${details.totalAmount}</p>
          </div>
        </div>
      </div>

      {details.eventDate && (
        <div className="border-t border-white/5 pt-3 flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            Fecha del Evento:
          </span>
          <span className="text-zinc-200 capitalize font-medium">
            {new Date(details.eventDate).toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long"
            })}
          </span>
        </div>
      )}
    </div>
  );
}
