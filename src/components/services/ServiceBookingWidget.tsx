"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { createServiceBooking } from "@/app/services/actions";
import { getOrCreateConnectChat } from "@/app/services/connectActions";
import { createClient } from "@/lib/supabase/client";
import { 
  Calendar, Clock, DollarSign, ShieldCheck, MessageSquare, X, 
  Loader2, CheckCircle2, AlertTriangle, ArrowRight, Upload, 
  MapPin, Users, Globe, Star, Info, Check, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ServiceBookingWidgetProps {
  serviceId: string;
  providerId: string;
  price: number;
  serviceTitle: string;
  user: any;
  duration: string;
  responseTime: string;
  availabilityStatus: string;
  provider?: {
    full_name: string | null;
    avatar_url: string | null;
    city: string | null;
  } | null;
  serviceImageUrl?: string | null;
  bookedDates?: string[];
  manualAvailability?: any[];
  reviewsCount?: number;
  averageRating?: string;
}

export function ServiceBookingWidget({
  serviceId,
  providerId,
  price,
  serviceTitle,
  user,
  duration,
  responseTime,
  availabilityStatus,
  provider,
  serviceImageUrl,
  bookedDates = [],
  manualAvailability = [],
  reviewsCount = 0,
  averageRating = "4.9"
}: ServiceBookingWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form Fields State
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("Fiesta privada");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [bookingCity, setBookingCity] = useState("");
  const [address, setAddress] = useState("");
  const [locationName, setLocationName] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [guestsCount, setGuestsCount] = useState<number>(100);
  const [specialRequirements, setSpecialRequirements] = useState("");
  
  // Attachments State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<Array<{ name: string; size: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirmation step State
  const [isConfirming, setIsConfirming] = useState(false);
  const [understoodCheck, setUnderstoodCheck] = useState(false);

  // Read draft state from localStorage if modal opens
  useEffect(() => {
    if (isOpen) {
      try {
        const cached = localStorage.getItem(`hangover_draft_booking_${serviceId}`);
        if (cached) {
          const data = JSON.parse(cached);
          setEventName(data.eventName || "");
          setEventType(data.eventType || "Fiesta privada");
          setEventDate(data.eventDate || "");
          setStartTime(data.startTime || "");
          setEndTime(data.endTime || "");
          setBookingCity(data.bookingCity || "");
          setAddress(data.address || "");
          setLocationName(data.locationName || "");
          setGoogleMapsUrl(data.googleMapsUrl || "");
          setGuestsCount(data.guestsCount || 100);
          setSpecialRequirements(data.specialRequirements || "");
        }
      } catch (e) {
        console.error("Error reading cached form draft:", e);
      }
    }
  }, [isOpen, serviceId]);

  // Autosave state changes to localStorage
  useEffect(() => {
    if (isOpen) {
      const data = {
        eventName,
        eventType,
        eventDate,
        startTime,
        endTime,
        bookingCity,
        address,
        locationName,
        googleMapsUrl,
        guestsCount,
        specialRequirements
      };
      localStorage.setItem(`hangover_draft_booking_${serviceId}`, JSON.stringify(data));
    }
  }, [
    isOpen, serviceId, eventName, eventType, eventDate, startTime, endTime,
    bookingCity, address, locationName, googleMapsUrl, guestsCount, specialRequirements
  ]);

  const handleOpenBooking = () => {
    if (!user) {
      const currentPath = window.location.pathname;
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      return;
    }
    setIsOpen(true);
    setError(null);
    setIsConfirming(false);
    setUnderstoodCheck(false);
  };

  const handleCloseBooking = () => {
    if (isPending) return;
    setIsOpen(false);
  };

  // Helper date checker
  const isDateBlocked = (dateStr: string) => {
    if (!dateStr) return false;
    if (bookedDates.includes(dateStr)) return true;
    const match = manualAvailability.find(a => a.date === dateStr);
    if (match && (match.status === "busy" || match.status === "offline")) {
      return true;
    }
    return false;
  };

  // Calculate duration
  const getCalculatedDuration = () => {
    if (!startTime || !endTime) return "";
    try {
      const [sH, sM] = startTime.split(":").map(Number);
      const [eH, eM] = endTime.split(":").map(Number);
      let diff = (eH * 60 + eM) - (sH * 60 + sM);
      if (diff < 0) diff += 24 * 60; // overlaps midnight
      const hrs = Math.floor(diff / 60);
      const mins = diff % 60;
      return `${hrs} ${hrs === 1 ? 'hora' : 'horas'}${mins > 0 ? ` y ${mins} min` : ''}`;
    } catch {
      return "";
    }
  };

  // Files handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
      
      const newPreviews = filesArray.map(f => ({
        name: f.name,
        size: (f.size / (1024 * 1024)).toFixed(2) + " MB"
      }));
      setFilePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Direct contact chat redirect
  const handleContactProvider = () => {
    startTransition(async () => {
      try {
        const res = await getOrCreateConnectChat(providerId);
        if (res.error) {
          setError(res.error);
        } else if (res.chatId) {
          window.location.href = `/connect?chatId=${res.chatId}&userId=${providerId}`;
        }
      } catch (err) {
        console.error("Error redirecting to provider chat:", err);
        setError("No se pudo iniciar la conversación.");
      }
    });
  };

  // Perform file uploads to Supabase storage
  const uploadAttachments = async (): Promise<string[]> => {
    const urls: string[] = [];
    const supabase = createClient();
    for (const file of selectedFiles) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const path = `bookings/attachments/${user.id}/${fileName}`;
      
      const { error } = await supabase.storage
        .from("service-gallery")
        .upload(path, file);

      if (!error) {
        const { data } = supabase.storage
          .from("service-gallery")
          .getPublicUrl(path);
        if (data?.publicUrl) {
          urls.push(data.publicUrl);
        }
      } else {
        console.error("File upload error:", error);
      }
    }
    return urls;
  };

  // Submit flow
  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!eventDate) {
      setError("La fecha del evento es obligatoria.");
      return;
    }
    if (isDateBlocked(eventDate)) {
      setError("La fecha seleccionada está bloqueada u ocupada por el proveedor.");
      return;
    }
    if (!startTime || !endTime) {
      setError("Las horas de inicio y fin son obligatorias.");
      return;
    }
    if (!bookingCity || !address || !locationName) {
      setError("La ubicación detallada es obligatoria (Ciudad, dirección y nombre del lugar).");
      return;
    }

    // Go to confirmation step
    setIsConfirming(true);
  };

  const handleFinalSubmit = () => {
    if (!understoodCheck) return;
    setError(null);

    startTransition(async () => {
      try {
        let uploadedUrls: string[] = [];
        if (selectedFiles.length > 0) {
          uploadedUrls = await uploadAttachments();
        }

        const quoteDetails = {
          eventName,
          eventType,
          startTime,
          endTime,
          duration: getCalculatedDuration() || duration,
          bookingCity,
          address,
          locationName,
          googleMapsUrl,
          guestsCount,
          specialRequirements,
          fileUrls: uploadedUrls
        };

        const result = await createServiceBooking(
          serviceId,
          providerId,
          eventDate,
          price,
          specialRequirements, // write notes legacy
          quoteDetails
        );

        if (result.error) {
          setError(result.error);
          setIsConfirming(false);
        } else {
          // Clear localStorage draft
          localStorage.removeItem(`hangover_draft_booking_${serviceId}`);
          
          // Successful redirect to connect chat with success banner URL parameters
          window.location.href = `/connect?chatId=${result.chatId || ""}&userId=${providerId}&bookingSuccess=true`;
        }
      } catch (err: any) {
        console.error("Booking error:", err);
        setError(err.message || "Error al procesar la reserva.");
        setIsConfirming(false);
      }
    });
  };

  const isAvailable = availabilityStatus !== "offline";
  const formattedCOP = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <>
      {/* Desktop Sticky Widget */}
      <div className="glass-card w-full border border-white/10 bg-[#09090f]/90 p-6 shadow-[0_20px_80px_rgba(217,70,239,0.08)] space-y-6">
        <div className="space-y-2.5">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Precio base</span>
            <span className="text-3xl font-black text-emerald-400 font-outfit">{formattedCOP(price)}</span>
          </div>
          <p className="text-[11px] text-zinc-400">Impuestos y tasas incluidos. Cotización directa.</p>
        </div>

        {/* Info stats */}
        <div className="divide-y divide-white/5 border-t border-b border-white/5 py-4 space-y-3.5">
          <div className="flex items-center justify-between text-xs pt-3 first:pt-0">
            <span className="text-zinc-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary-400" />
              Duración base
            </span>
            <span className="text-zinc-300 font-semibold">{duration}</span>
          </div>

          <div className="flex items-center justify-between text-xs pt-3">
            <span className="text-zinc-500 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Tiempo de respuesta
            </span>
            <span className="text-zinc-300 font-semibold">{responseTime}</span>
          </div>

          <div className="flex items-center justify-between text-xs pt-3">
            <span className="text-zinc-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-accent-400" />
              Estado operativo
            </span>
            <span className={`font-semibold capitalize flex items-center gap-1 ${
              availabilityStatus === 'available' ? 'text-emerald-400' :
              availabilityStatus === 'busy' ? 'text-amber-400' : 'text-zinc-500'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                availabilityStatus === 'available' ? 'bg-emerald-500 animate-pulse' :
                availabilityStatus === 'busy' ? 'bg-amber-500' : 'bg-zinc-500'
              }`} />
              {availabilityStatus === 'available' ? 'disponible' :
               availabilityStatus === 'busy' ? 'ocupado' : 'no disponible'}
            </span>
          </div>
        </div>

        <button
          onClick={handleOpenBooking}
          disabled={!isAvailable}
          className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-2xl py-4 px-4 font-bold text-sm transition-all flex items-center justify-center gap-2 glow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg active:scale-98"
        >
          {isAvailable ? "Solicitar Reserva" : "No disponible"}
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[10px] text-zinc-500 text-center">
          No se realizará ningún cobro hasta que el proveedor confirme tu solicitud.
        </p>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-zinc-950/90 backdrop-blur-md border-t border-white/10 p-4 flex items-center justify-between md:hidden px-6">
        <div>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Precio</p>
          <p className="text-xl font-extrabold text-emerald-400 font-outfit">{formattedCOP(price)}</p>
        </div>
        <button
          onClick={handleOpenBooking}
          disabled={!isAvailable}
          className="bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 px-6 text-xs font-bold transition-all glow disabled:opacity-50 cursor-pointer"
        >
          {isAvailable ? "Reservar" : "Offline"}
        </button>
      </div>

      {/* Booking Modal (AnimatePresence) */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="glass-card w-full max-w-4xl bg-[#090911]/98 border border-white/10 rounded-[28px] overflow-hidden shadow-2xl relative flex flex-col md:flex-row h-full max-h-[85vh]"
            >
              
              {/* CLOSE BUTTON */}
              <button
                onClick={handleCloseBooking}
                disabled={isPending}
                className="absolute top-4 right-4 z-20 text-zinc-500 hover:text-white disabled:opacity-50 transition-colors cursor-pointer w-8 h-8 rounded-full border border-white/5 bg-black/40 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>

              {/* COLUMNA IZQUIERDA: FORMULARIO */}
              <div className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto scrollbar-thin">
                <div>
                  <h3 className="text-lg font-black text-white font-outfit uppercase tracking-wider">Solicitud de Reserva</h3>
                  <p className="text-xs text-zinc-500">Completa los detalles de tu evento para iniciar la contratación.</p>
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleConfirmSubmit} className="space-y-5">
                  
                  {/* Event Info fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Nombre del Evento <span className="text-zinc-650">(Opcional)</span></label>
                      <input
                        type="text"
                        value={eventName}
                        onChange={e => setEventName(e.target.value)}
                        placeholder="Ej. Mi Cumpleaños 25"
                        disabled={isPending}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Tipo de Evento <span className="text-red-500">*</span></label>
                      <select
                        value={eventType}
                        onChange={e => setEventType(e.target.value)}
                        disabled={isPending}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a1a1aa%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:8px_8px] bg-[right_1rem_center] bg-no-repeat pr-8"
                      >
                        {["Cumpleaños", "Boda", "Fiesta privada", "Evento corporativo", "Discoteca", "Festival", "Concierto", "Otro"].map(type => (
                          <option key={type} value={type} className="bg-zinc-950">{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Date & Time fields */}
                  <div className="space-y-3.5 bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Fecha del Evento <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <input
                            type="date"
                            value={eventDate}
                            onChange={e => setEventDate(e.target.value)}
                            required
                            disabled={isPending}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        {isDateBlocked(eventDate) && (
                          <p className="text-[10px] font-bold text-red-400">⚠️ Proveedor no disponible en esta fecha.</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Hora de Inicio <span className="text-red-500">*</span></label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={e => setStartTime(e.target.value)}
                          required
                          disabled={isPending}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Hora de Cierre <span className="text-red-500">*</span></label>
                        <input
                          type="time"
                          value={endTime}
                          onChange={e => setEndTime(e.target.value)}
                          required
                          disabled={isPending}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>

                    </div>

                    {startTime && endTime && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary-400">
                        <Info className="w-3.5 h-3.5" />
                        <span>Duración estimada del set: {getCalculatedDuration()}</span>
                      </div>
                    )}
                  </div>

                  {/* Location fields */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-500 border-b border-white/5 pb-1">Ubicación del Evento</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Ciudad <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={bookingCity}
                          onChange={e => setBookingCity(e.target.value)}
                          placeholder="Ej. Barranquilla"
                          required
                          disabled={isPending}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Dirección Exacta <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={address}
                          onChange={e => setAddress(e.target.value)}
                          placeholder="Ej. Calle 79 # 53 - 21"
                          required
                          disabled={isPending}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Nombre del Lugar <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={locationName}
                          onChange={e => setLocationName(e.target.value)}
                          placeholder="Ej. Salón de Eventos o Discoteca"
                          required
                          disabled={isPending}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Google Maps Link <span className="text-zinc-650">(Opcional)</span></label>
                        <input
                          type="url"
                          value={googleMapsUrl}
                          onChange={e => setGoogleMapsUrl(e.target.value)}
                          placeholder="https://maps.google.com/..."
                          disabled={isPending}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                  </div>

                  {/* Guests and special requirements */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Nro Asistentes <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input
                          type="number"
                          value={guestsCount}
                          onChange={e => setGuestsCount(Number(e.target.value))}
                          min={1}
                          required
                          disabled={isPending}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                        <Users className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-3.5" />
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Requerimientos especiales <span className="text-red-500">*</span></label>
                      <textarea
                        value={specialRequirements}
                        onChange={e => setSpecialRequirements(e.target.value)}
                        placeholder="Necesitamos 4 guardias para controlar el acceso principal y una zona VIP desde las 8:00 PM..."
                        required
                        rows={3}
                        disabled={isPending}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none min-h-[70px]"
                      />
                    </div>
                  </div>

                  {/* Attachment zone */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Adjuntar Archivos <span className="text-zinc-650">(Cronogramas, listas, PDF, imágenes)</span></label>
                    
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-white/10 hover:border-primary-500/40 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 bg-white/[0.005] hover:bg-white/[0.015] transition-all cursor-pointer text-center group"
                    >
                      <Upload className="w-6 h-6 text-zinc-500 group-hover:text-primary-400 transition-colors" />
                      <span className="text-[11px] font-bold text-zinc-300">Arrastra archivos aquí o haz clic para explorar</span>
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Límite 10MB por archivo</span>
                      
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        multiple 
                        className="hidden" 
                      />
                    </div>

                    {filePreviews.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {filePreviews.map((file, idx) => (
                          <div key={idx} className="bg-black/50 border border-white/5 rounded-xl p-2.5 flex items-center justify-between text-xs text-zinc-300">
                            <span className="truncate max-w-[200px] font-mono text-[10px]">{file.name}</span>
                            <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 shrink-0 font-bold">
                              <span>{file.size}</span>
                              <button 
                                type="button" 
                                onClick={() => removeFile(idx)} 
                                className="text-zinc-500 hover:text-red-400 p-0.5"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Form Footer Action buttons */}
                  <div className="pt-4 border-t border-white/5 flex flex-col-reverse sm:flex-row gap-3 justify-end">
                    
                    <button
                      type="button"
                      onClick={handleContactProvider}
                      disabled={isPending}
                      className="bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 hover:text-white rounded-xl py-2.5 px-4 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-4 h-4 text-primary-400" />} Contactar Proveedor
                    </button>

                    <button
                      type="submit"
                      disabled={isPending || isDateBlocked(eventDate)}
                      className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl py-2.5 px-5 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-lg hover:shadow-primary-500/10 border border-primary-500/20"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          Enviar Solicitud al Proveedor <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>

                  </div>

                </form>

              </div>

              {/* COLUMNA DERECHA: RESUMEN LATERAL */}
              <div className="w-full md:w-[350px] bg-zinc-950/60 border-t md:border-t-0 md:border-l border-white/5 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto scrollbar-thin">
                
                <div className="space-y-6">
                  
                  {/* Header / Meta summary */}
                  <div className="space-y-4">
                    
                    <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 relative">
                      {serviceImageUrl ? (
                        <img src={serviceImageUrl} alt={serviceTitle} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-650 bg-black/40">
                          Sin Imagen
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                      
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <span className="text-[8px] bg-primary-600 border border-primary-500/20 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                          Servicio Pro
                        </span>
                        <h4 className="text-xs font-extrabold font-outfit mt-1 truncate">{serviceTitle}</h4>
                      </div>
                    </div>

                    {/* Provider mini details */}
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase font-black tracking-wider text-zinc-500">Proveedor</p>
                        <h5 className="text-xs font-bold text-white truncate">{provider?.full_name || "Hangover Artist"}</h5>
                      </div>

                      {/* Stars rating */}
                      <div className="text-right">
                        <div className="flex items-center gap-0.5 text-amber-400 justify-end">
                          <Star className="w-3.5 h-3.5 fill-amber-400 shrink-0" />
                          <span className="text-xs font-bold text-white font-outfit">{averageRating}</span>
                        </div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase">{reviewsCount} reseñas</p>
                      </div>
                    </div>

                    {/* Operation details list */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-zinc-400">
                      <div className="p-2 bg-white/[0.02] border border-white/5 rounded-xl">
                        <p className="text-zinc-600 text-[8px] uppercase tracking-wider">Resuelve en</p>
                        <p className="text-white mt-0.5">⚡ {responseTime}</p>
                      </div>
                      <div className="p-2 bg-white/[0.02] border border-white/5 rounded-xl">
                        <p className="text-zinc-600 text-[8px] uppercase tracking-wider">Completados</p>
                        <p className="text-white mt-0.5">⭐ 256 Gigs</p>
                      </div>
                    </div>

                  </div>

                  {/* Real-time summary strip */}
                  <div className="space-y-2 border-t border-white/5 pt-4">
                    <h5 className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Resumen del Evento</h5>
                    
                    <div className="space-y-1.5 text-xs text-zinc-400">
                      {eventDate && (
                        <div className="flex justify-between">
                          <span className="text-zinc-550">Fecha:</span>
                          <span className="text-white font-bold">{eventDate}</span>
                        </div>
                      )}
                      {startTime && (
                        <div className="flex justify-between">
                          <span className="text-zinc-550">Horario:</span>
                          <span className="text-white font-bold">{startTime} - {endTime || "Fin"}</span>
                        </div>
                      )}
                      {bookingCity && (
                        <div className="flex justify-between">
                          <span className="text-zinc-550">Lugar:</span>
                          <span className="text-white font-bold truncate max-w-[150px]">{locationName || bookingCity}</span>
                        </div>
                      )}
                      {guestsCount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-zinc-550">Asistentes:</span>
                          <span className="text-white font-bold">{guestsCount}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial breakdown */}
                  <div className="space-y-2.5 bg-black/40 border border-white/5 rounded-2xl p-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Precio Base</span>
                      <span className="text-white font-semibold">{formattedCOP(price)}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/10 pt-2">
                      <span className="font-bold text-zinc-300">Precio Estimado</span>
                      <span className="font-black text-emerald-400 text-sm font-outfit">{formattedCOP(price)}</span>
                    </div>
                    <div className="text-[9px] text-zinc-500 leading-normal pt-1 flex gap-1 border-t border-white/5">
                      <Info className="w-3.5 h-3.5 text-primary-400 shrink-0 mt-0.5" />
                      <span>Precio sujeto a confirmación final y cotización del proveedor en el chat de Connect.</span>
                    </div>
                  </div>

                </div>

                {/* Vertical Process Timeline */}
                <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
                  <h5 className="text-[8px] font-black uppercase tracking-wider text-zinc-500">¿Qué sucede después?</h5>
                  
                  <div className="relative flex flex-col gap-2.5 pl-4 before:content-[''] before:absolute before:left-[4px] before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-800">
                    {[
                      "Envías tu solicitud de reserva",
                      "El proveedor la evalúa y revisa",
                      "Se abre chat en Hangover Connect",
                      "Conversan y acuerdan la cotización"
                    ].map((step, idx) => (
                      <div key={idx} className="relative flex items-start text-[9px] text-zinc-400">
                        <span className="absolute left-[-16px] top-1 w-1.5 h-1.5 rounded-full bg-primary-600 border border-black" />
                        <span>{idx + 1}️⃣ {step}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION OVERLAY MODAL */}
      <AnimatePresence>
        {isConfirming && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-[fadeIn_0.15s_ease-out]">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#0a0a14] border border-white/10 rounded-3xl p-6 space-y-6 shadow-2xl relative"
            >
              
              <div>
                <h3 className="text-md font-black text-white font-outfit uppercase tracking-wider">Confirmar solicitud</h3>
                <p className="text-xs text-zinc-500 mt-1">Verifica la información de tu evento antes de enviar la solicitud.</p>
              </div>

              {/* Booking preview summary */}
              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 text-xs space-y-3">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-500">Servicio</span>
                  <span className="text-white font-bold truncate max-w-[200px]">{serviceTitle}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-500">Proveedor</span>
                  <span className="text-white font-bold">{provider?.full_name || "Artista"}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-500">Fecha y Horario</span>
                  <span className="text-white font-bold">{eventDate} ({startTime} - {endTime})</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-500">Ubicación</span>
                  <span className="text-white font-bold truncate max-w-[200px]">{locationName}, {address} ({bookingCity})</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-500">Asistentes</span>
                  <span className="text-white font-bold">{guestsCount} personas</span>
                </div>
                {specialRequirements && (
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-zinc-500 block mb-1">Requerimientos:</span>
                    <p className="text-zinc-400 italic text-[11px] font-mono bg-white/[0.01] p-2 rounded-lg">"{specialRequirements}"</p>
                  </div>
                )}
                {selectedFiles.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Archivos adjuntos</span>
                    <span className="text-white font-bold">{selectedFiles.length} {selectedFiles.length === 1 ? 'archivo' : 'archivos'}</span>
                  </div>
                )}
              </div>

              {/* Mandatory check box */}
              <label className="flex items-start gap-2.5 p-3.5 bg-primary-650/10 border border-primary-500/20 rounded-2xl text-xs text-primary-350 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={understoodCheck}
                  onChange={e => setUnderstoodCheck(e.target.checked)}
                  className="mt-0.5 accent-primary-600 cursor-pointer w-4 h-4"
                />
                <span>Entiendo que esta solicitud deberá ser revisada por el proveedor antes de quedar confirmada.</span>
              </label>

              {/* Action buttons */}
              <div className="flex gap-3 justify-end pt-2">
                
                <button
                  type="button"
                  onClick={() => setIsConfirming(false)}
                  disabled={isPending}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Editar
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={!understoodCheck || isPending}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 hover:shadow-lg hover:shadow-primary-500/10 border border-primary-500/20"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Enviar Solicitud"}
                </button>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
