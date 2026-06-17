"use client";

import { useState, useTransition } from "react";
import { createEvent } from "@/app/services/actions";
import { 
  Sparkles, DollarSign, MapPin, AlignLeft, Calendar, FileText, 
  Loader2, CheckCircle2, AlertTriangle, ArrowLeft, Plus, Trash2, 
  Music, Ticket, ChevronRight, ChevronLeft, CalendarDays, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TicketBatch {
  name: string;
  price: number;
  capacity: number;
}

interface LineupItem {
  artist_name: string;
  performance_time: string;
  description: string;
}

export function NewEventForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("Fiesta & Clubbing");

  // Dynamic lists fields
  const [batches, setBatches] = useState<TicketBatch[]>([]);
  const [lineup, setLineup] = useState<LineupItem[]>([]);

  // Input fields for current item addition
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchPrice, setNewBatchPrice] = useState("");
  const [newBatchCapacity, setNewBatchCapacity] = useState("");

  const [newArtistName, setNewArtistName] = useState("");
  const [newArtistTime, setNewArtistTime] = useState("");
  const [newArtistDesc, setNewArtistDesc] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleAddBatch = () => {
    if (!newBatchName.trim()) {
      alert("Por favor ingresa un nombre para el lote.");
      return;
    }
    const priceNum = Number(newBatchPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      alert("Por favor ingresa un precio válido mayor o igual a cero.");
      return;
    }
    const capacityNum = Number(newBatchCapacity);
    if (isNaN(capacityNum) || capacityNum <= 0) {
      alert("Por favor ingresa una capacidad de aforo válida mayor a cero.");
      return;
    }

    setBatches([...batches, { name: newBatchName, price: priceNum, capacity: capacityNum }]);
    setNewBatchName("");
    setNewBatchPrice("");
    setNewBatchCapacity("");
  };

  const handleRemoveBatch = (index: number) => {
    setBatches(batches.filter((_, i) => i !== index));
  };

  const handleAddArtist = () => {
    if (!newArtistName.trim()) {
      alert("Por favor ingresa el nombre del artista.");
      return;
    }
    if (!newArtistTime.trim()) {
      alert("Por favor ingresa el horario (ej: 11:30 PM - 01:30 AM).");
      return;
    }

    setLineup([...lineup, { artist_name: newArtistName, performance_time: newArtistTime, description: newArtistDesc }]);
    setNewArtistName("");
    setNewArtistTime("");
    setNewArtistDesc("");
  };

  const handleRemoveArtist = (index: number) => {
    setLineup(lineup.filter((_, i) => i !== index));
  };

  const validateStep = (currentStep: number): boolean => {
    setError(null);
    if (currentStep === 1) {
      if (!title.trim()) {
        setError("El título del evento es requerido.");
        return false;
      }
      if (!eventDate) {
        setError("La fecha y hora del evento son requeridas.");
        return false;
      }
      if (!description.trim()) {
        setError("La descripción del evento es requerida.");
        return false;
      }
    }
    if (currentStep === 2) {
      if (!location.trim()) {
        setError("La ubicación del evento es requerida.");
        return false;
      }
    }
    if (currentStep === 3) {
      const priceNum = Number(ticketPrice);
      if (isNaN(priceNum) || priceNum < 0 || ticketPrice === "") {
        setError("El precio de la entrada general base debe ser un número válido.");
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    setError(null);
    setStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

    const basePriceNum = Number(ticketPrice);

    startTransition(async () => {
      // Send parameters including dynamic batches & lineup
      const result = await createEvent(
        title,
        description,
        eventDate,
        location,
        basePriceNum,
        imageUrl || undefined,
        batches.length > 0 ? batches : undefined,
        lineup.length > 0 ? lineup : undefined
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

  // Steps definitions labels
  const stepsLabels = ["Datos Básicos", "Lugar & Flyer", "Lotes de Entradas", "Artistas Line-up"];

  return (
    <div className="space-y-6">
      {/* STEPS PROGRESS HEADER */}
      <div className="mb-8">
        <div className="flex justify-between items-center text-xs text-zinc-400 font-bold uppercase tracking-wider mb-3.5">
          <span>Paso {step} de 4</span>
          <span className="text-primary-400">{stepsLabels[step - 1]}</span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i <= step 
                  ? "bg-gradient-to-r from-primary-500 to-rose-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]" 
                  : "bg-white/5"
              }`} 
            />
          ))}
        </div>
      </div>

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
              <div>¡Evento publicado con éxito! Configurando sala de chat y lotes de entradas...</div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="min-h-[300px]">
          {/* STEP 1: BASIC DETAILS */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Título del Evento</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Sparkles className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isPending || success}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-xs"
                    placeholder="Ej. Fiesta de Fin de Año VIP"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Categoría del Evento</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={isPending || success}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-xs cursor-pointer h-[46px]"
                  >
                    <option value="Fiesta & Clubbing">Fiesta & Clubbing</option>
                    <option value="Festival / En Vivo">Festival / En Vivo</option>
                    <option value="Social / Acceso Libre">Social / Acceso Libre</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Fecha y Hora</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      type="datetime-local"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      disabled={isPending || success}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-xs cursor-pointer h-[46px]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Descripción del Evento</label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <AlignLeft className="h-4 w-4 text-zinc-500" />
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isPending || success}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-xs min-h-[140px] resize-y"
                    placeholder="Detalla las actividades, restricciones de ingreso, código de vestimenta (dress code), etc."
                    required
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: LOCATION & FLYER */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Ubicación / Lugar</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={isPending || success}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-xs"
                    placeholder="Ej. Calle 84 #51B - Discoteca Hangover VIP"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">URL de la Imagen de Portada (Flyer)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    disabled={isPending || success}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-xs"
                    placeholder="https://images.unsplash.com/photo-..."
                  />
                </div>
                <p className="text-[10px] text-zinc-500 italic mt-1 ml-1">
                  Si se deja en blanco, la plataforma asignará automáticamente un flyer de alta calidad basado en el género del evento.
                </p>
              </div>

              {imageUrl.startsWith("http") && (
                <div className="mt-4 p-3 rounded-2xl border border-white/5 bg-zinc-950/40 text-center">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 block mb-2">Vista Previa de la Portada</span>
                  <div className="max-h-48 rounded-xl overflow-hidden flex items-center justify-center">
                    <img src={imageUrl} alt="Flyer preview" className="object-cover max-w-full max-h-40 rounded-xl" onError={() => setError("La URL de la imagen de portada no es válida.")} />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: TICKET BATCHES (TIERS) */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Precio General Base ($)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="number"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                    disabled={isPending || success}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-xs"
                    placeholder="Ej. 45000 (0 para evento gratuito)"
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* TICKET BATCHES BUILDER */}
              <div className="border border-white/5 rounded-2xl p-5 bg-white/[0.01] space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white font-outfit flex items-center gap-1.5">
                    <Ticket className="w-4 h-4 text-primary-400" />
                    Lotes de Entradas Adicionales (Opcional)
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                    Define preventas (Early Bird), etapas (Etapa 1, 2) o accesos especiales (VIP, Backstage). La barra de progreso de ventas de la página de detalle sumará estos aforos automáticamente.
                  </p>
                </div>

                {/* Added Batches list */}
                {batches.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">Lotes creados</span>
                    <div className="grid grid-cols-1 gap-2">
                      {batches.map((b, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-white/5 text-xs text-zinc-300">
                          <div>
                            <span className="font-bold text-white block">{b.name}</span>
                            <span className="text-[10px] text-zinc-500">Cupo: {b.capacity} entradas</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-black text-emerald-400">${b.price}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveBatch(idx)}
                              className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Addition Form Row */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">Añadir Lote</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={newBatchName}
                      onChange={(e) => setNewBatchName(e.target.value)}
                      placeholder="Ej. Preventa Early Bird"
                      className="bg-black/60 border border-white/8 rounded-lg px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="number"
                      value={newBatchPrice}
                      onChange={(e) => setNewBatchPrice(e.target.value)}
                      placeholder="Precio ($)"
                      className="bg-black/60 border border-white/8 rounded-lg px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="number"
                      value={newBatchCapacity}
                      onChange={(e) => setNewBatchCapacity(e.target.value)}
                      placeholder="Aforo (Cantidad)"
                      className="bg-black/60 border border-white/8 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddBatch}
                    className="w-full py-2 rounded-lg bg-zinc-900 border border-white/10 hover:border-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Confirmar lote
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: LINEUP OF ARTISTS */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-5"
            >
              <div className="border border-white/5 rounded-2xl p-5 bg-white/[0.01] space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white font-outfit flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-primary-400" />
                    Line-up de Artistas / DJs (Opcional)
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                    Registra los DJs, bandas o actos en vivo de tu evento. Se mostrarán con un diseño de festival premium en la sección principal del evento.
                  </p>
                </div>

                {/* Added Artists list */}
                {lineup.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">Artistas confirmados</span>
                    <div className="grid grid-cols-1 gap-2">
                      {lineup.map((art, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-white/5 text-xs text-zinc-300">
                          <div>
                            <span className="font-bold text-white block">{art.artist_name}</span>
                            <span className="text-[10px] text-zinc-500">⏰ {art.performance_time}</span>
                            {art.description && <p className="text-[9px] text-zinc-650 mt-0.5">{art.description}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveArtist(idx)}
                            className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Artist Form Addition Row */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">Añadir Artista</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newArtistName}
                      onChange={(e) => setNewArtistName(e.target.value)}
                      placeholder="Nombre del DJ / Artista"
                      className="bg-black/60 border border-white/8 rounded-lg px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={newArtistTime}
                      onChange={(e) => setNewArtistTime(e.target.value)}
                      placeholder="Horario (Ej: 12:00 AM - 02:00 AM)"
                      className="bg-black/60 border border-white/8 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <input
                    type="text"
                    value={newArtistDesc}
                    onChange={(e) => setNewArtistDesc(e.target.value)}
                    placeholder="Descripción o género musical (Opcional)"
                    className="w-full bg-black/60 border border-white/8 rounded-lg px-3 py-2 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddArtist}
                    className="w-full py-2 rounded-lg bg-zinc-900 border border-white/10 hover:border-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Confirmar artista
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* STEPPER ACTIONS CONTROL */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-between items-center border-t border-white/5">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-xs py-2 px-4 border border-white/5 hover:border-white/10 rounded-xl cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Atrás
            </button>
          ) : (
            <Link 
              href="/dashboard/provider"
              className="flex items-center justify-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Panel
            </Link>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="w-full sm:w-auto min-w-[150px] bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl py-3 px-6 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isPending || success}
              className="w-full sm:w-auto min-w-[200px] bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 px-6 font-semibold text-xs transition-all glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Publicar Evento Premium
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
