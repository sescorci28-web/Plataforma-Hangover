"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { 
  validateQRCodeAndLog, 
  confirmQRAdmissionAndLog, 
  getGateStats, 
  getLastAccesses 
} from "@/app/services/actions";
import { 
  QrCode, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  User, 
  Ticket, 
  Calendar, 
  Users, 
  DollarSign, 
  Camera, 
  RotateCcw, 
  Keyboard,
  Sun,
  SwitchCamera,
  Volume2,
  VolumeX,
  CheckCircle,
  Clock,
  Smartphone,
  ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { QRValidatorForm } from "./QRValidatorForm";

interface CameraDevice {
  id: string;
  label: string;
}

export function QrScanner() {
  // Mode selection: "standard" vs "operator" (default: "operator" for speed)
  const [mode, setMode] = useState<"standard" | "operator">("operator");
  
  // Scanner state
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanStatus, setScanStatus] = useState<"valid" | "used" | "cancelled" | "invalid" | "scanning" | "error" | "processing" | "confirmed_success">("scanning");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [activeMode, setActiveMode] = useState<"camera" | "manual">("camera");
  const [manualCode, setManualCode] = useState("");
  
  // Gate operator configurations
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [deviceDetails, setDeviceDetails] = useState("Escáner de Acceso");
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Real-time statistics & Access logs
  const [stats, setStats] = useState({
    valid: 0,
    rejected: 0,
    covers: 0,
    reservations: 0,
    totalToday: 0
  });
  const [recentAccesses, setRecentAccesses] = useState<any[]>([]);

  // Camera settings
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [cameraStartError, setCameraStartError] = useState(false);
  
  const scannerRef = useRef<any>(null);
  const [isPending, startTransition] = useTransition();

  // Web Audio Context for feedback sound generation
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtx) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (Ctx) {
        setAudioCtx(new Ctx());
      }
    } else if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  };

  // Sound generator
  const playFeedbackSound = (type: 'success' | 'warning' | 'error') => {
    if (!soundEnabled) return;
    try {
      const ctx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioCtx) setAudioCtx(ctx);
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      
      if (type === "success") {
        // High upbeat C5-E5 double-chime arpeggio
        const freqs = [523.25, 659.25];
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          osc.type = "sine";
          osc.frequency.setValueAtTime(f, now + idx * 0.08);
          
          gainNode.gain.setValueAtTime(0.0, now + idx * 0.08);
          gainNode.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.25);
          
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.3);
        });
      } else if (type === "warning") {
        // Rapid double triangle beep at 380 Hz
        const times = [0, 0.15];
        times.forEach((t) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          osc.type = "triangle";
          osc.frequency.setValueAtTime(380, now + t);
          
          gainNode.gain.setValueAtTime(0.0, now + t);
          gainNode.gain.linearRampToValueAtTime(0.12, now + t + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.12);
          
          osc.start(now + t);
          osc.stop(now + t + 0.15);
        });
      } else {
        // Low saw buzzer with a frequency slide down
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.35);
        
        gainNode.gain.setValueAtTime(0.0, now);
        gainNode.gain.linearRampToValueAtTime(0.18, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        
        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch (err) {
      console.error("Failed to play dynamic audio feedback:", err);
    }
  };

  // Get user-agent details for audit logging
  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent;
      let platform = "Web Operator";
      if (/android/i.test(ua)) platform = "Android device";
      else if (/iphone|ipad/i.test(ua)) platform = "iOS device";
      else if (/windows/i.test(ua)) platform = "Windows PC";
      else if (/mac/i.test(ua)) platform = "macOS device";
      setDeviceDetails(`${platform} (${window.navigator.appName || "Navegador"})`);
    }
  }, []);

  // Fetch stats and recent accesses
  const refreshStatsAndAccesses = async () => {
    try {
      const statsRes = await getGateStats();
      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
      }
      
      const accessesRes = await getLastAccesses();
      if (accessesRes.success && accessesRes.accesses) {
        setRecentAccesses(accessesRes.accesses);
      }
    } catch (err) {
      console.error("Error refreshing dashboard data:", err);
    }
  };

  // Connect database real-time subscription
  useEffect(() => {
    refreshStatsAndAccesses();

    const supabase = createClient();
    const channel = supabase
      .channel("gate-operator-stats-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admission_logs" },
        () => {
          refreshStatsAndAccesses();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          refreshStatsAndAccesses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Stop active camera scan
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.warn("Error stopping camera scanner:", err);
      }
    }
  };

  // Start/restart scanner
  const startScanner = () => {
    setScanResult(null);
    setErrorMsg(null);
    setScanStatus("scanning");
    setIsConfirming(false);
    setTorchEnabled(false);

    import("html5-qrcode").then((module) => {
      setTimeout(async () => {
        const qrReaderElem = document.getElementById("qr-reader");
        if (!qrReaderElem) return;

        let html5Qrcode = scannerRef.current;

        // Cleanup or reuse html5-qrcode instance
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

        // List available cameras on start
        try {
          const cameras = await module.Html5Qrcode.getCameras();
          const mappedDevices = cameras.map(c => ({ id: c.id, label: c.label }));
          setDevices(mappedDevices);
          if (mappedDevices.length > 0 && !activeCameraId) {
            // Prefer rear camera
            const environmentCamera = mappedDevices.find(
              c => c.label.toLowerCase().includes("back") || 
                   c.label.toLowerCase().includes("rear") || 
                   c.label.toLowerCase().includes("trasera") || 
                   c.label.toLowerCase().includes("environment")
            );
            setActiveCameraId(environmentCamera ? environmentCamera.id : mappedDevices[0].id);
            return; // let useEffect start with the correct cameraId
          }
        } catch (err) {
          console.warn("Could not retrieve camera list:", err);
        }

        const onScanSuccess = async (decodedText: string) => {
          console.log(`Scan success: ${decodedText}`);
          
          try {
            if (html5Qrcode.isScanning) {
              await html5Qrcode.stop();
            }
          } catch (err) {
            console.error("Error stopping scanner on success:", err);
          }

          setScanStatus("processing");

          try {
            const res = await validateQRCodeAndLog(decodedText, deviceDetails, autoConfirm);
            if (res.error) {
              // Handle specific warning vs reject
              if (res.status === "used") {
                setScanStatus("used");
                setScanResult(res.bookingDetails);
                playFeedbackSound("warning");
                
                // Gate Operator speed: auto-dismiss used warnings after 1.8s
                if (mode === "operator") {
                  setTimeout(() => {
                    startScanner();
                  }, 1800);
                }
              } else {
                setScanStatus("invalid");
                setErrorMsg(res.error);
                setScanResult(res.bookingDetails || null);
                playFeedbackSound("error");
                
                if (mode === "operator") {
                  setTimeout(() => {
                    startScanner();
                  }, 1800);
                }
              }
            } else {
              setScanResult(res.bookingDetails);
              setScanStatus(autoConfirm ? "confirmed_success" : "valid");
              playFeedbackSound("success");

              // Gate Operator speed: auto-dismiss successes after 1.8s
              if (mode === "operator" && autoConfirm) {
                setTimeout(() => {
                  startScanner();
                }, 1800);
              }
            }
          } catch (err: any) {
            setScanStatus("error");
            setErrorMsg(err.message || "Error al procesar el código QR.");
            playFeedbackSound("error");
            
            if (mode === "operator") {
              setTimeout(() => {
                startScanner();
              }, 1800);
            }
          }
        };

        const onScanFailure = () => {
          // Continuous quiet scan failures
        };

        // Select camera constraint: specific camera ID, or facingMode fallback
        const cameraConstraint = activeCameraId ? activeCameraId : { facingMode };

        try {
          await html5Qrcode.start(
            cameraConstraint,
            {
              fps: 15, // High frame rate for faster, high-speed validation
              qrbox: { width: 260, height: 260 },
              aspectRatio: 1.0,
            },
            onScanSuccess,
            onScanFailure
          );
          setRetryCount(0);
          setCameraStartError(false);
        } catch (err: any) {
          console.error("Error starting camera:", err);
          setCameraStartError(true);
          
          // Auto retry constraint
          if (retryCount < 3) {
            setRetryCount(prev => prev + 1);
            setTimeout(() => {
              startScanner();
            }, 1200);
          } else {
            setScanStatus("error");
            setErrorMsg("No se pudo iniciar la cámara. Revisa los permisos e intenta recargar la cámara.");
          }
        }
      }, 150);
    }).catch(err => {
      console.error("Failed to load html5-qrcode library:", err);
      setScanStatus("error");
      setErrorMsg("No fue posible cargar el escáner.");
    });
  };

  useEffect(() => {
    if (activeMode === "camera") {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [activeMode, activeCameraId, facingMode]);

  // Flashlight trigger
  const handleToggleTorch = async () => {
    if (!scannerRef.current || !scannerRef.current.isScanning) return;
    try {
      const track = scannerRef.current.getActiveTrack();
      if (track && typeof track.getCapabilities === "function") {
        const capabilities = track.getCapabilities();
        if (capabilities.torch) {
          const nextState = !torchEnabled;
          await track.applyConstraints({
            advanced: [{ torch: nextState }]
          });
          setTorchEnabled(nextState);
        } else {
          alert("Linterna no disponible en este dispositivo/cámara.");
        }
      } else {
        alert("Propiedades de cámara no accesibles.");
      }
    } catch (err) {
      console.warn("Linterna error:", err);
    }
  };

  // Cycle camera
  const handleCycleCamera = () => {
    if (devices.length <= 1) return;
    const currentIndex = devices.findIndex(d => d.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % devices.length;
    setActiveCameraId(devices[nextIndex].id);
  };

  // Front vs Rear toggle
  const handleToggleFacingMode = () => {
    setActiveCameraId(""); // Clear custom camera ID
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  const handleReset = () => {
    startScanner();
  };

  // Manual code submit
  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    
    initAudio();
    stopScanner();
    setScanStatus("processing");
    
    startTransition(async () => {
      try {
        const res = await validateQRCodeAndLog(manualCode.trim(), deviceDetails, autoConfirm);
        setManualCode(""); // clear input
        
        if (res.error) {
          if (res.status === "used") {
            setScanStatus("used");
            setScanResult(res.bookingDetails);
            playFeedbackSound("warning");
            
            if (mode === "operator") {
              setTimeout(() => {
                startScanner();
              }, 2500);
            }
          } else {
            setScanStatus("invalid");
            setErrorMsg(res.error);
            setScanResult(res.bookingDetails || null);
            playFeedbackSound("error");
            
            if (mode === "operator") {
              setTimeout(() => {
                startScanner();
              }, 2500);
            }
          }
        } else {
          setScanResult(res.bookingDetails);
          setScanStatus(autoConfirm ? "confirmed_success" : "valid");
          playFeedbackSound("success");
          
          if (mode === "operator" && autoConfirm) {
            setTimeout(() => {
              startScanner();
            }, 2500);
          }
        }
      } catch (err: any) {
        setScanStatus("error");
        setErrorMsg(err.message || "Error al procesar el código manual.");
        playFeedbackSound("error");
      }
    });
  };

  // Manual confirm action
  const handleConfirmAdmission = async () => {
    if (!scanResult || !scanResult.id) return;
    setIsConfirming(true);
    initAudio();
    
    try {
      const res = await confirmQRAdmissionAndLog(scanResult.id, deviceDetails);
      if (res.error) {
        setScanStatus("error");
        setErrorMsg(res.error);
        playFeedbackSound("error");
      } else {
        setScanStatus("confirmed_success");
        playFeedbackSound("success");
        
        // Update local booking validation time
        setScanResult((prev: any) => ({
          ...prev,
          qrValidatedAt: res.qrValidatedAt
        }));

        // In operator mode, auto return to camera after 2 seconds
        if (mode === "operator") {
          setTimeout(() => {
            startScanner();
          }, 1800);
        }
      }
    } catch (err: any) {
      setScanStatus("error");
      setErrorMsg(err.message || "Error al confirmar el ingreso.");
      playFeedbackSound("error");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="space-y-6" onClick={initAudio}>
      
      {/* Dynamic sound and mode selector toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-zinc-950/60 border border-white/5 rounded-2xl">
        <div className="flex gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => {
              initAudio();
              setSoundEnabled(!soundEnabled);
            }}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              soundEnabled
                ? "bg-primary-500/10 border-primary-500/20 text-primary-400"
                : "bg-zinc-800/40 border-white/5 text-zinc-500"
            }`}
            title={soundEnabled ? "Silenciar" : "Sonidos Activados"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Mode Switcher Buttons */}
          <div className="flex bg-black/40 border border-white/5 rounded-xl p-0.5">
            <button
              onClick={() => { setMode("operator"); handleReset(); }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                mode === "operator"
                  ? "bg-primary-600 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              ⚡ Modo Operador
            </button>
            <button
              onClick={() => { setMode("standard"); handleReset(); }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                mode === "standard"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Estándar
            </button>
          </div>
        </div>

        {/* Input Toggle (Camera vs Manual) */}
        <div className="flex gap-1 p-0.5 bg-black/40 border border-white/5 rounded-xl">
          <button
            onClick={() => setActiveMode("camera")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
              activeMode === "camera"
                ? "bg-primary-600 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Camera className="w-3 h-3" /> Cámara
          </button>
          <button
            onClick={() => setActiveMode("manual")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
              activeMode === "manual"
                ? "bg-primary-600 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Keyboard className="w-3 h-3" /> Manual
          </button>
        </div>
      </div>

      {/* ==========================================
          GATE OPERATOR DASHBOARD MODE (Default UI)
          ========================================== */}
      {mode === "operator" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Scanner Section (2/3 width on desktop) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Real-time Ingress Counter at the top */}
            <div className="glass-card p-5 bg-gradient-to-r from-primary-950/40 via-zinc-950 to-zinc-950 border border-white/5 rounded-2xl flex items-center justify-between relative overflow-hidden">
              <div className="absolute -top-12 -left-12 w-24 h-24 bg-primary-600/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block">Acceso hoy</span>
                <span className="text-xl font-black text-white font-outfit mt-1 flex items-center gap-2">
                  <span className="animate-pulse">👥</span> {stats.totalToday} ingresos
                </span>
              </div>

              {/* Automatic check-in toggle */}
              <div className="flex flex-col items-end gap-1">
                <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Confirmación</span>
                <button
                  onClick={() => setAutoConfirm(!autoConfirm)}
                  className={`px-2.5 py-1 rounded-lg border text-[10px] font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
                    autoConfirm
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                      : "bg-amber-500/15 border-amber-500/30 text-amber-400"
                  }`}
                >
                  {autoConfirm ? "⚡ Automática" : "👤 Manual"}
                </button>
              </div>
            </div>

            {/* Camera View container */}
            {activeMode === "camera" ? (
              <div className="glass-card p-6 bg-[#0c0c14] border border-white/10 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="space-y-4 text-center">
                  
                  {/* Neon camera square container */}
                  <div className="max-w-sm mx-auto overflow-hidden rounded-2xl border-2 border-primary-500/20 hover:border-primary-500/40 bg-black/60 relative p-1 shadow-[0_0_25px_rgba(217,70,239,0.05)] transition-all">
                    
                    {/* Laser line effect */}
                    {scanStatus === "scanning" && (
                      <div className="absolute left-0 right-0 h-0.5 bg-primary-500 shadow-[0_0_8px_#d946ef] z-10 animate-[bounce_3s_infinite]" />
                    )}

                    <div id="qr-reader" className="w-full h-full" />
                    
                    {cameraStartError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/95 text-center space-y-4 z-20">
                        <ShieldAlert className="w-12 h-12 text-red-500 animate-bounce" />
                        <h4 className="text-white font-bold text-sm">Error de Cámara</h4>
                        <p className="text-xs text-zinc-400">La cámara está bloqueada o en uso por otra aplicación.</p>
                        <button
                          onClick={startScanner}
                          className="bg-primary-600 hover:bg-primary-500 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg cursor-pointer"
                        >
                          Reintentar Cámara 🔁
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Enhanced Camera Controls Toolbar */}
                  <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
                    {/* Flashlight toggle */}
                    <button
                      onClick={handleToggleTorch}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        torchEnabled
                          ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
                          : "bg-white/5 border-white/5 text-zinc-400 hover:text-white"
                      }`}
                      title="Linterna"
                    >
                      {torchEnabled ? <Sun className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> : <Sun className="w-3.5 h-3.5 opacity-55" />}
                      <span>{torchEnabled ? "Luz On" : "Linterna"}</span>
                    </button>

                    {/* Facing Mode toggle (Front/Rear) */}
                    <button
                      onClick={handleToggleFacingMode}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-white/5 bg-white/5 text-zinc-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
                      title="Frontal / Trasera"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>{facingMode === "environment" ? "Frontal" : "Trasera"}</span>
                    </button>

                    {/* Cycle Camera device */}
                    {devices.length > 1 && (
                      <button
                        onClick={handleCycleCamera}
                        className="p-2.5 rounded-xl border border-white/5 bg-white/5 text-zinc-400 hover:text-white transition-all cursor-pointer"
                        title="Cambiar Cámara"
                      >
                        <SwitchCamera className="w-4 h-4" />
                      </button>
                    )}

                    {/* Manual Retry restart scanner */}
                    <button
                      onClick={startScanner}
                      className="p-2.5 rounded-xl border border-white/5 bg-white/5 text-zinc-400 hover:text-white transition-all cursor-pointer"
                      title="Reiniciar Cámara"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                  
                </div>
              </div>
            ) : (
              /* Inline Manual form in gate dashboard */
              <div className="glass-card p-6 bg-[#0c0c14] border border-white/10 rounded-2xl">
                <form onSubmit={handleManualCodeSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                      Validación Manual de Código
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="Ingresa código (Ej: QR-f83h2...)"
                        disabled={isPending}
                        className="w-full bg-black/60 border border-white/10 focus:border-primary-500 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-zinc-600 outline-none transition-all"
                        autoFocus
                      />
                      <QrCode className="w-5 h-5 text-zinc-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending || !manualCode.trim()}
                    className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl py-3 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Validando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Validar Código
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Display validation card for manual confirmation inside dashboard */}
            {scanStatus === "valid" && scanResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Confirmation banner */}
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3.5">
                  <CheckCircle2 className="w-5.5 h-5.5 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h4 className="font-bold text-emerald-300 text-xs">Entrada Encontrada</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                      El ticket es válido. Haz clic en "Confirmar Acceso" para habilitar el ingreso de este cliente.
                    </p>
                  </div>
                </div>

                {/* Ticket card */}
                <div className="glass-card p-5 bg-[#0a0a10]/60 border border-white/5 rounded-2xl grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] text-zinc-500 uppercase font-black">Cliente</p>
                    <p className="text-xs font-bold text-white mt-0.5">{scanResult.buyerName}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-zinc-500 uppercase font-black">Pase</p>
                    <p className="text-xs font-bold text-white mt-0.5">
                      {scanResult.bookingType === "club_cover" ? "🎟️ Cover" : "🍾 Reserva"}
                    </p>
                  </div>
                  <div className="col-span-2 border-t border-white/5 pt-2 flex items-center justify-between">
                    <span className="text-[9px] text-zinc-500 uppercase font-black">Personas:</span>
                    <span className="text-xs font-bold text-primary-400">{scanResult.numberOfPeople} invitados</span>
                  </div>
                </div>

                {/* Action trigger manually */}
                <div className="flex gap-3">
                  <button
                    onClick={handleConfirmAdmission}
                    disabled={isConfirming}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl py-3 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isConfirming ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Confirmando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Confirmar Acceso
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleReset}
                    className="bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-xl px-5 py-3 font-bold text-xs uppercase cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            )}

          </div>

          {/* Right Statistics & History Panel (1/3 width on desktop) */}
          <div className="space-y-6">
            
            {/* Night statistics cards */}
            <div className="glass-card p-5 bg-zinc-950/40 border border-white/5 rounded-2xl space-y-4">
              <div>
                <h4 className="font-extrabold text-white text-xs font-outfit uppercase tracking-widest">Estadísticas de la Noche</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Actualizado en vivo</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Approved */}
                <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
                  <span className="text-[9px] text-zinc-500 uppercase font-extrabold">✅ Válidos</span>
                  <span className="text-sm font-black text-emerald-400 mt-1 font-outfit">{stats.valid}</span>
                </div>

                {/* Rejected */}
                <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
                  <span className="text-[9px] text-zinc-500 uppercase font-extrabold">⚠ Rechazados</span>
                  <span className="text-sm font-black text-red-400 mt-1 font-outfit">{stats.rejected}</span>
                </div>

                {/* Covers used */}
                <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
                  <span className="text-[9px] text-zinc-500 uppercase font-extrabold">🎟 Covers</span>
                  <span className="text-sm font-black text-primary-400 mt-1 font-outfit">{stats.covers}</span>
                </div>

                {/* VIP Used */}
                <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
                  <span className="text-[9px] text-zinc-500 uppercase font-extrabold">🍾 Reservas</span>
                  <span className="text-sm font-black text-white mt-1 font-outfit">{stats.reservations}</span>
                </div>
              </div>
            </div>

            {/* Last 5 accesses list */}
            <div className="glass-card p-5 bg-zinc-950/40 border border-white/5 rounded-2xl space-y-4">
              <div>
                <h4 className="font-extrabold text-white text-xs font-outfit uppercase tracking-widest">Últimos Accesos</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Registros de puerta</p>
              </div>

              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {recentAccesses.length === 0 ? (
                  <p className="text-[10px] text-zinc-600 text-center py-6 italic">Sin ingresos registrados hoy.</p>
                ) : (
                  recentAccesses.map((acc, index) => {
                    const isApproved = acc.status === "approved";
                    const isWarning = acc.status === "warning";
                    
                    let statusColor = "bg-red-500/10 border-red-500/20 text-red-400";
                    let iconText = "❌";
                    if (isApproved) {
                      statusColor = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                      iconText = "✅";
                    } else if (isWarning) {
                      statusColor = "bg-amber-500/10 border-amber-500/20 text-amber-400";
                      iconText = "⚠";
                    }

                    return (
                      <div
                        key={acc.id || index}
                        className={`p-2.5 rounded-xl border text-[11px] space-y-1 ${statusColor}`}
                      >
                        <div className="flex justify-between items-center font-bold">
                          <span className="truncate max-w-[110px] text-white">
                            {iconText} {acc.buyerName}
                          </span>
                          <span className="text-[9px] font-normal text-zinc-400 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> {acc.time}
                          </span>
                        </div>
                        <div className="flex justify-between text-[9px] text-zinc-300">
                          <span className="capitalize">
                            {acc.accessType === "club_cover" ? "Cover Entrada" : acc.accessType === "event" ? "Entrada Evento" : acc.accessType === "club_vip" ? "Mesa VIP" : "Reserva"}
                          </span>
                          {acc.errorReason && (
                            <span className="text-red-300 font-medium max-w-[100px] truncate text-right">
                              {acc.errorReason}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>
      ) : (
        
        /* ==========================================
            STANDARD SCANNER MODE (Legacy UI / Fallback)
            ========================================== */
        <>
          {activeMode === "camera" ? (
            <>
              {/* Scan viewport */}
              <div className={scanStatus === "scanning" ? "block" : "hidden"}>
                <div className="glass-card p-6 bg-[#0c0c14] border border-white/10 rounded-2xl relative overflow-hidden">
                  <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary-600/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="space-y-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-primary-400 font-semibold uppercase tracking-wider text-xs">
                      <Camera className="w-4 h-4 animate-pulse" />
                      <span>Cámara Activa (Estándar)</span>
                    </div>
                    
                    <div className="max-w-sm mx-auto overflow-hidden rounded-2xl border border-white/10 bg-black/40 relative">
                      <div id="qr-reader" className="w-full h-full" />
                    </div>
                    
                    <p className="text-xs text-zinc-400">
                      Apunta tu cámara al código QR de la entrada.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status views */}
              <AnimatePresence mode="wait">
                {scanStatus === "processing" && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="glass-card p-12 bg-[#0c0c14] border border-white/10 rounded-2xl text-center space-y-4"
                  >
                    <Loader2 className="w-12 h-12 text-primary-400 animate-spin mx-auto" />
                    <h3 className="text-white font-bold font-outfit text-lg">Validando Código QR</h3>
                    <p className="text-zinc-400 text-sm">Consultando los detalles de la reserva...</p>
                  </motion.div>
                )}

                {scanStatus === "valid" && scanResult && (
                  <motion.div
                    key="valid"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-4">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-emerald-300 text-sm">✅ Entrada Válida</h4>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          El código QR es válido. Haz clic para confirmar el ingreso.
                        </p>
                      </div>
                    </div>

                    <div className="glass-card p-6 bg-[#0c0c14]/40 border border-white/5 rounded-2xl space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase">Cliente</p>
                          <p className="text-sm font-semibold text-white">{scanResult.buyerName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase">Pase</p>
                          <p className="text-sm font-semibold text-white">{scanResult.title}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase">Personas</p>
                          <p className="text-sm font-semibold text-white">{scanResult.numberOfPeople}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase">Monto</p>
                          <p className="text-sm font-semibold text-white">${scanResult.totalAmount}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleConfirmAdmission}
                        disabled={isConfirming}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl py-3 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isConfirming ? "Confirmando..." : "Confirmar Ingreso"}
                      </button>
                      <button
                        onClick={handleReset}
                        className="bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-xl px-5 py-3 font-semibold text-sm cursor-pointer"
                      >
                        Volver
                      </button>
                    </div>
                  </motion.div>
                )}

                {scanStatus === "confirmed_success" && scanResult && (
                  <motion.div
                    key="confirmed"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-4">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-emerald-300 text-sm">🎉 Ingreso Confirmado</h4>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          Acceso confirmado exitosamente.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleReset}
                      className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Escanear Siguiente
                    </button>
                  </motion.div>
                )}

                {scanStatus === "used" && scanResult && (
                  <motion.div
                    key="used"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4">
                      <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-red-300 text-sm">❌ Código Ya Utilizado</h4>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          Este QR ya fue validado.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleReset}
                      className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Escanear de Nuevo
                    </button>
                  </motion.div>
                )}

                {(scanStatus === "invalid" || scanStatus === "error" || scanStatus === "cancelled") && (
                  <motion.div
                    key="invalid"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4">
                      <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-red-300 text-sm">Acceso Rechazado</h4>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {errorMsg || "Código no válido."}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleReset}
                      className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Escanear de Nuevo
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <QRValidatorForm />
          )}
        </>
      )}

      {/* =======================================================
          HIGH-SPEED FULL-SCREEN OVERLAYS (Visual Experience)
          ======================================================= */}
      <AnimatePresence>
        {mode === "operator" && (
          <>
            {/* Approved - Green Overlay */}
            {scanStatus === "confirmed_success" && scanResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-emerald-600 flex flex-col items-center justify-center text-center p-6"
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.8 }}
                  className="space-y-6"
                >
                  <div className="w-28 h-28 bg-white/20 border-4 border-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
                    <CheckCircle className="w-16 h-16 text-white" />
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-[12px] bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider font-extrabold text-white">
                      {scanResult.bookingType === "club_cover" ? "🎟️ Cover" : "🍾 Reserva"}
                    </span>
                    <h2 className="text-4xl font-black text-white font-outfit leading-tight">
                      {scanResult.buyerName}
                    </h2>
                    <p className="text-white/80 text-lg font-bold">
                      {scanResult.numberOfPeople} Persona{scanResult.numberOfPeople > 1 ? "s" : ""}
                    </p>
                    <h3 className="text-2xl font-black uppercase text-white tracking-widest pt-4">
                      ACCESO AUTORIZADO
                    </h3>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Warning - Yellow Overlay (e.g. used QR) */}
            {scanStatus === "used" && scanResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-amber-500 flex flex-col items-center justify-center text-center p-6"
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.8 }}
                  className="space-y-6"
                >
                  <div className="w-28 h-28 bg-white/20 border-4 border-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
                    <AlertTriangle className="w-16 h-16 text-white" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white font-outfit">
                      {scanResult.buyerName}
                    </h2>
                    <p className="text-white/95 text-sm font-semibold max-w-md mx-auto leading-relaxed">
                      Este código QR ya fue utilizado anteriormente.
                    </p>
                    <h3 className="text-2xl font-black uppercase text-white tracking-widest pt-4">
                      CÓDIGO YA USADO
                    </h3>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Rejected / Error - Red Overlay */}
            {(scanStatus === "invalid" || scanStatus === "error" || scanStatus === "cancelled") && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-rose-600 flex flex-col items-center justify-center text-center p-6"
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.8 }}
                  className="space-y-6"
                >
                  <div className="w-28 h-28 bg-white/20 border-4 border-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
                    <XCircle className="w-16 h-16 text-white" />
                  </div>
                  
                  <div className="space-y-2">
                    {scanResult && (
                      <h2 className="text-3xl font-black text-white font-outfit">
                        {scanResult.buyerName}
                      </h2>
                    )}
                    <p className="text-white/90 text-sm font-bold max-w-md mx-auto leading-relaxed">
                      {errorMsg || "El código ingresado es inválido o no existe en la base de datos."}
                    </p>
                    <h3 className="text-2xl font-black uppercase text-white tracking-widest pt-4">
                      ACCESO DENEGADO
                    </h3>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
