"use client";

import { useState, useTransition, useMemo } from "react";
import { createEvent } from "@/app/services/actions";
import { 
  Sparkles, DollarSign, MapPin, AlignLeft, Calendar, FileText, 
  Loader2, CheckCircle2, AlertTriangle, ArrowLeft, Plus, Trash2, 
  Music, Ticket, ChevronRight, ChevronLeft, CalendarDays, Eye, UploadCloud,
  Shirt, ShieldAlert, Clock, Crown, MessageSquare, Users, Flame, ShieldCheck, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface TicketBatch {
  name: string;
  price: number;
  capacity: number;
}

interface TableItem {
  name: string;
  price: number;
  capacity: number;
  description: string;
}

interface LineupItem {
  artist_name: string;
  performance_time: string;
  description: string;
}

interface GalleryItem {
  id: string;
  file: File;
  previewUrl: string;
  isFeatured: boolean;
}

// Categories list with emojis
const EVENT_CATEGORIES = [
  { id: "Fiesta", name: "Fiesta", icon: "🎉" },
  { id: "Discoteca", name: "Discoteca", icon: "🎧" },
  { id: "Concierto", name: "Concierto", icon: "🎤" },
  { id: "Festival", name: "Festival", icon: "🎪" },
  { id: "Pool Party", name: "Pool Party", icon: "🍹" },
  { id: "Beach Party", name: "Beach Party", icon: "🏖" },
  { id: "Evento Privado", name: "Evento Privado", icon: "🥂" },
  { id: "Networking", name: "Networking", icon: "🤝" },
  { id: "Universitario", name: "Universitario", icon: "🎓" },
  { id: "Otro", name: "Otro", icon: "🔥" }
];

export function NewEventForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // ----------------------------------------------------
  // STEP 1 - BASIC INFO
  // ----------------------------------------------------
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Fiesta");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  // ----------------------------------------------------
  // STEP 2 - EXPERIENCE
  // ----------------------------------------------------
  const [description, setDescription] = useState("");
  const [dressCode, setDressCode] = useState("Casual Premium");
  const [minAge, setMinAge] = useState(18);
  const [openingTime, setOpeningTime] = useState("21:00");
  const [closingTime, setClosingTime] = useState("04:00");
  
  // Checklist toggles
  const [hasParking, setHasParking] = useState(false);
  const [hasVipZone, setHasVipZone] = useState(false);
  const [hasTablesModule, setHasTablesModule] = useState(false);
  const [isAdultsOnly, setIsAdultsOnly] = useState(false);
  const [isFreeEntry, setIsFreeEntry] = useState(false);

  // ----------------------------------------------------
  // STEP 3 - MULTIMEDIA GALLERY
  // ----------------------------------------------------
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  // ----------------------------------------------------
  // STEP 4 - TICKETS & TABLES
  // ----------------------------------------------------
  const [eventType, setEventType] = useState("tickets");
  const [ticketingEnabled, setTicketingEnabled] = useState(true);
  const [ticketPrice, setTicketPrice] = useState("45000");
  const [batches, setBatches] = useState<TicketBatch[]>([]);
  const [tablesList, setTablesList] = useState<TableItem[]>([]);
  
  // Inputs for adding tickets/tables
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchPrice, setNewBatchPrice] = useState("");
  const [newBatchCapacity, setNewBatchCapacity] = useState("");

  const [newTableName, setNewTableName] = useState("");
  const [newTablePrice, setNewTablePrice] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState("");
  const [newTableDesc, setNewTableDesc] = useState("");

  // ----------------------------------------------------
  // STEP 5 - COMMUNITY & CONNECT
  // ----------------------------------------------------
  const [showEventCommunity, setShowEventCommunity] = useState(true);
  const [showEventChat, setShowEventChat] = useState(true);
  const [showAttendees, setShowAttendees] = useState("all");
  const [allowFollowers, setAllowFollowers] = useState(true);
  const [activeCollabAlbum, setActiveCollabAlbum] = useState(true);
  const [showRealtimeAttendees, setShowRealtimeAttendees] = useState(true);

  // Lineup List (Optional)
  const [lineup, setLineup] = useState<LineupItem[]>([]);
  const [newArtistName, setNewArtistName] = useState("");
  const [newArtistTime, setNewArtistTime] = useState("");
  const [newArtistDesc, setNewArtistDesc] = useState("");

  // Submission States
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  // ----------------------------------------------------
  // COMPLETION SCORE LOGIC
  // ----------------------------------------------------
  const completionData = useMemo(() => {
    let score = 0;
    const suggestions = [];

    if (title.trim()) score += 15; else suggestions.push("Agrega un título llamativo");
    if (description.trim()) score += 15; else suggestions.push("Redacta la descripción del evento");
    if (eventDate) score += 10; else suggestions.push("Define la fecha y hora");
    if (location.trim()) score += 10; else suggestions.push("Establece la ubicación del local");
    if (imageFile || imagePreview) score += 20; else suggestions.push("Sube una portada principal (Flyer)");
    
    // Ticketing verification
    if (isFreeEntry || eventType === "free") {
      score += 20;
    } else if ((eventType === "tickets" || eventType === "tickets_and_tables") && (ticketPrice || batches.length > 0)) {
      score += 20;
    } else if ((eventType === "tables" || eventType === "tickets_and_tables") && (tablesList.length > 0)) {
      score += 20;
    } else {
      suggestions.push("Configura la boletería (Lotes o Mesas)");
    }

    if (showEventCommunity || showEventChat) score += 10; else suggestions.push("Activa el Chat o la Comunidad");

    return { score, suggestions };
  }, [
    title, description, eventDate, location, imageFile, imagePreview, 
    isFreeEntry, eventType, ticketPrice, batches, tablesList, 
    showEventCommunity, showEventChat
  ]);

  // Add items functions
  const handleAddBatch = () => {
    if (!newBatchName.trim()) return alert("Nombre de lote requerido");
    const priceNum = Number(newBatchPrice) || 0;
    const capNum = Number(newBatchCapacity) || 100;
    setBatches([...batches, { name: newBatchName, price: priceNum, capacity: capNum }]);
    setNewBatchName("");
    setNewBatchPrice("");
    setNewBatchCapacity("");
  };

  const handleAddTable = () => {
    if (!newTableName.trim()) return alert("Nombre de mesa/lounge requerido");
    const priceNum = Number(newTablePrice) || 0;
    const capNum = Number(newTableCapacity) || 4;
    setTablesList([...tablesList, { name: newTableName, price: priceNum, capacity: capNum, description: newTableDesc }]);
    setNewTableName("");
    setNewTablePrice("");
    setNewTableCapacity("");
    setNewTableDesc("");
  };

  const handleAddArtist = () => {
    if (!newArtistName.trim()) return alert("Nombre de artista requerido");
    if (!newArtistTime.trim()) return alert("Horario de presentación requerido");
    setLineup([...lineup, { artist_name: newArtistName, performance_time: newArtistTime, description: newArtistDesc }]);
    setNewArtistName("");
    setNewArtistTime("");
    setNewArtistDesc("");
  };

  // Gallery Management
  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newItems: GalleryItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        alert("El archivo excede los 10MB permitidos.");
        continue;
      }
      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        previewUrl: URL.createObjectURL(file),
        isFeatured: false
      });
    }

    setGalleryItems([...galleryItems, ...newItems]);
  };

  const handleSetFeatured = (itemId: string) => {
    const updated = galleryItems.map(item => {
      if (item.id === itemId) {
        setImageFile(item.file);
        setImagePreview(item.previewUrl);
        return { ...item, isFeatured: true };
      }
      return { ...item, isFeatured: false };
    });
    setGalleryItems(updated);
  };

  // Step Nav validation
  const validateStep = (currentStep: number): boolean => {
    setError(null);
    if (currentStep === 1) {
      if (!title.trim()) return setError("El título del evento es obligatorio."), false;
      if (!eventDate) return setError("La fecha y hora son obligatorias."), false;
      if (!location.trim()) return setError("La ubicación es obligatoria."), false;
    }
    if (currentStep === 2) {
      if (!description.trim()) return setError("La descripción del evento es obligatoria."), false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    setError(null);
    setStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Form Submit Action
  const handleSubmitForm = (draft: boolean = false) => {
    setError(null);
    setSuccess(false);

    if (!validateStep(1) || !validateStep(2)) return;

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("No estás autenticado.");
          return;
        }

        // 1. Upload Flyer Image if exists
        let flyerUrl = "";
        if (imageFile) {
          const ext = imageFile.name.split(".").pop() || "jpg";
          const path = `${user.id}/flyer-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("event-gallery")
            .upload(path, imageFile, { cacheControl: "3600", upsert: true });

          if (uploadError) throw uploadError;
          const { data } = supabase.storage.from("event-gallery").getPublicUrl(path);
          flyerUrl = data.publicUrl;
        }

        // 2. Submit Base Event Data
        const basePriceNum = Number(ticketPrice) || 0;
        const result = await createEvent(
          title,
          description,
          eventDate,
          location,
          basePriceNum,
          flyerUrl || undefined,
          batches.length > 0 ? batches : undefined,
          lineup.length > 0 ? lineup : undefined,
          {
            category,
            dress_code: dressCode,
            min_age: Number(minAge) || 18,
            opening_time: openingTime,
            closing_time: closingTime,
            has_parking: hasParking,
            has_vip_zone: hasVipZone,
            has_tables_module: hasTablesModule,
            is_adults_only: isAdultsOnly,
            is_free_entry: isFreeEntry || eventType === "free",
            event_type: eventType,
            ticketing_enabled: ticketingEnabled,
            show_event_chat: showEventChat,
            show_event_community: showEventCommunity,
            show_attendees: showAttendees
          }
        );

        if (result.error) {
          setError(result.error);
          return;
        }

        const newEventId = result.eventId;

        if (newEventId) {
          // 3. Upload Gallery items
          for (let i = 0; i < galleryItems.length; i++) {
            const item = galleryItems[i];
            const ext = item.file.name.split(".").pop() || "jpg";
            const path = `${user.id}/gallery-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
            const { error: gUploadErr } = await supabase.storage
              .from("event-gallery")
              .upload(path, item.file, { cacheControl: "3600", upsert: true });

            if (!gUploadErr) {
              const { data } = supabase.storage.from("event-gallery").getPublicUrl(path);
              await supabase.from("event_gallery_items").insert({
                event_id: newEventId,
                url: data.publicUrl,
                media_type: item.file.type.startsWith("video") ? "video" : "image",
                display_order: i,
                featured: item.isFeatured,
                active: true
              });
            }
          }

          // 4. Insert Table configs if module active
          if (hasTablesModule && tablesList.length > 0) {
            const tablesPayload = tablesList.map(t => ({
              event_id: newEventId,
              name: t.name,
              price: t.price,
              capacity: t.capacity,
              description: t.description || null,
              status: "active"
            }));
            await supabase.from("event_tables").insert(tablesPayload);
          }
        }

        setSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => {
          router.push("/dashboard/provider");
          router.refresh();
        }, 2000);

      } catch (err: any) {
        setError(`Error al crear el evento: ${err.message || err}`);
      }
    });
  };

  // Steps indicators
  const stepsNames = [
    "Información General",
    "Experiencia del Evento",
    "Multimedia",
    "Boletería",
    "Comunidad Connect",
    "Previsualización",
    "Publicar"
  ];

  // Helper date formatting for Live Card
  const formattedLiveDate = useMemo(() => {
    if (!eventDate) return "Fecha por definir";
    return new Date(eventDate).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }, [eventDate]);

  const formattedLiveTime = useMemo(() => {
    if (!eventDate) return "Hora por definir";
    return new Date(eventDate).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }, [eventDate]);

  return (
    <div className="space-y-6">
      {/* STEPS PROGRESS HEADER */}
      <div className="mb-8">
        <div className="flex justify-between items-center text-xs text-zinc-400 font-bold uppercase tracking-wider mb-3.5">
          <span>Paso {step} de 7</span>
          <span className="text-primary-400">{stepsNames[step - 1]}</span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div 
              key={i} 
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i <= step 
                  ? "bg-gradient-to-r from-primary-500 to-indigo-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]" 
                  : "bg-white/5"
              }`} 
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm"
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
            className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>¡Evento publicado con éxito! Redirigiendo al panel...</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STEP 6: FULL SIMULATION EXPANDED PAGE */}
      {step === 6 ? (
        <motion.div
          key="step-preview"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="space-y-6"
        >
          {/* Simulated Detail View Banner */}
          <div className="relative h-72 rounded-3xl overflow-hidden bg-black/60 border border-white/5 shadow-2xl">
            {imagePreview ? (
              <img src={imagePreview} className="w-full h-full object-cover opacity-50 filter blur-[1px]" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-zinc-950 via-[#0a0515] to-[#100a20]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-black/30" />
            
            <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row justify-between items-end gap-4">
              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-primary-600 text-white">
                  {category}
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-white font-outfit">{title || "Fiesta Blanca 2026"}</h1>
                <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 font-medium">
                  <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {formattedLiveDate}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formattedLiveTime} HS</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {location || "Barranquilla"}</span>
                </div>
              </div>
              
              <div className="bg-black/60 border border-white/10 p-3.5 rounded-2xl shrink-0 backdrop-blur-md text-right">
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">Acceso General Base</span>
                <span className="text-base font-black text-emerald-400 block">${ticketPrice || "45000"} COP</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Info Detail */}
              <div className="glass-card p-6 bg-zinc-950/40 border border-white/5 rounded-3xl space-y-6">
                <div>
                  <h2 className="text-xs font-black text-primary-400 font-outfit uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-4 h-4" /> Sobre este evento
                  </h2>
                  <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
                    {description || "No se ha ingresado una descripción para el evento aún."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 text-xs">
                  <div className="flex gap-2.5 p-3 rounded-xl bg-white/[0.01] border border-white/5">
                    <Clock className="w-4 h-4 text-primary-400" />
                    <div>
                      <p className="text-zinc-500 font-bold uppercase tracking-wider">Apertura</p>
                      <p className="font-semibold text-zinc-200 mt-0.5">{openingTime || "21:00"} HS</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5 p-3 rounded-xl bg-white/[0.01] border border-white/5">
                    <Clock className="w-4 h-4 text-rose-400" />
                    <div>
                      <p className="text-zinc-500 font-bold uppercase tracking-wider">Cierre</p>
                      <p className="font-semibold text-zinc-200 mt-0.5">{closingTime || "04:00"} HS</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5 p-3 rounded-xl bg-white/[0.01] border border-white/5">
                    <Shirt className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="text-zinc-500 font-bold uppercase tracking-wider">Dress Code</p>
                      <p className="font-semibold text-zinc-200 mt-0.5">{dressCode}</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5 p-3 rounded-xl bg-white/[0.01] border border-white/5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <div>
                      <p className="text-zinc-500 font-bold uppercase tracking-wider">Restricción</p>
                      <p className="font-semibold text-zinc-200 mt-0.5">+{minAge} años</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lineup Mockup */}
              {lineup.length > 0 && (
                <div className="glass-card p-6 bg-zinc-950/40 border border-white/5 rounded-3xl space-y-4">
                  <h2 className="text-xs font-black text-primary-400 font-outfit uppercase tracking-widest flex items-center gap-1.5">
                    <Music className="w-4 h-4" /> Line-Up Confirmado
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {lineup.map((art, idx) => (
                      <div key={idx} className="p-3 bg-black/40 border border-white/5 rounded-xl text-xs flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white">{art.artist_name}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{art.performance_time}</p>
                        </div>
                        <ShieldCheck className="w-4 h-4 text-primary-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gallery Mockup */}
              {galleryItems.length > 0 && (
                <div className="glass-card p-6 bg-zinc-950/40 border border-white/5 rounded-3xl space-y-4">
                  <h2 className="text-xs font-black text-primary-400 font-outfit uppercase tracking-widest flex items-center gap-1.5">
                    <Eye className="w-4 h-4" /> Galería de Imágenes
                  </h2>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {galleryItems.map((item, idx) => (
                      <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-white/5">
                        <img src={item.previewUrl} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Tickets Sidebar Mockup */}
              <div className="glass-card p-6 bg-zinc-950/40 border border-white/5 rounded-3xl space-y-4">
                <h3 className="text-xs font-black text-white font-outfit uppercase tracking-widest">Boletería del Evento</h3>
                
                {eventType === "free" || isFreeEntry ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-center text-xs text-emerald-400">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
                    <p className="font-bold">Ingreso Gratuito</p>
                    <p className="text-[10px] text-zinc-550 mt-1">Los asistentes pueden registrarse de manera libre.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-black/60 border border-white/5 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white">General Base</p>
                        <p className="text-[10px] text-zinc-500">Acceso Estándar</p>
                      </div>
                      <span className="font-black text-emerald-400">${ticketPrice}</span>
                    </div>

                    {batches.map((b, idx) => (
                      <div key={idx} className="p-3 bg-black/60 border border-white/5 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-white">{b.name}</p>
                          <p className="text-[10px] text-zinc-500">Aforo: {b.capacity}</p>
                        </div>
                        <span className="font-black text-emerald-450">${b.price}</span>
                      </div>
                    ))}

                    {hasTablesModule && tablesList.map((t, idx) => (
                      <div key={idx} className="p-3 bg-black/60 border border-white/5 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-white">🛋️ {t.name}</p>
                          <p className="text-[10px] text-zinc-500">Capacidad: {t.capacity} pers.</p>
                        </div>
                        <span className="font-black text-primary-400">${t.price}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Community Mockup */}
              <div className="glass-card p-6 bg-zinc-950/40 border border-white/5 rounded-3xl space-y-4">
                <h3 className="text-xs font-black text-white font-outfit uppercase tracking-widest">Social & Comunidad</h3>
                
                {showEventCommunity ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-950 flex items-center justify-center text-[8px] font-bold text-zinc-400">
                            {i}
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-zinc-400">Ver quién va y conectar</p>
                    </div>
                    {showEventChat && (
                      <div className="p-3 bg-primary-600/10 border border-primary-500/25 rounded-2xl text-[10px] text-primary-400 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 shrink-0" />
                        <span>Chat grupal exclusivo activado</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-550 text-center py-4">Módulos sociales desactivados.</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-white/5">
            <button
              onClick={handlePrevStep}
              className="flex items-center gap-1 text-zinc-400 hover:text-white text-xs px-4 py-2 rounded-xl border border-white/5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Volver y Editar
            </button>
            <button
              onClick={() => setStep(7)}
              className="bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 px-6 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
            >
              Confirmar y Avanzar <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-start">
          {/* LEFT COLUMN: FORM FIELDS */}
          <div className="glass-card p-6 bg-zinc-950/40 border border-white/5 rounded-3xl space-y-6">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              
              {/* STEP 1: GENERAL INFO */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-base font-bold text-white font-outfit uppercase tracking-wide">Paso 1: Información General</h2>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Establece los datos primordiales y la imagen del evento.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 ml-1">Título del Evento *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej: Fiesta Blanca 2026 VIP"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-xs"
                      required
                    />
                  </div>

                  {/* Categories Visual grid */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 ml-1 block">Categoría del Evento</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {EVENT_CATEGORIES.map((cat) => {
                        const isSelected = category === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategory(cat.id)}
                            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                              isSelected 
                                ? "bg-primary-600/15 border-primary-500 text-white shadow-lg shadow-primary-500/10" 
                                : "bg-black/20 border-white/5 text-zinc-450 hover:border-white/10 hover:text-zinc-200"
                            }`}
                          >
                            <span className="text-xl">{cat.icon}</span>
                            <span className="text-[9px] font-extrabold uppercase tracking-wide truncate max-w-full">{cat.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 ml-1">Fecha y Hora *</label>
                      <input
                        type="datetime-local"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-xs cursor-pointer h-[46px]"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 ml-1">Ubicación / Lugar *</label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Ej: Calle 84 #51B, Barranquilla"
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-xs"
                        required
                      />
                    </div>
                  </div>

                  {/* Flyer upload */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 ml-1 block">Flyer del Evento (Portada Principal)</label>
                    <div 
                      className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden group ${
                        imagePreview ? "border-primary-500/50 bg-black/60 min-h-[140px]" : "border-white/10 bg-white/[0.02] hover:border-primary-500/40 hover:bg-primary-950/5 min-h-[120px]"
                      }`}
                      onClick={() => document.getElementById("portada-file-input")?.click()}
                    >
                      {imagePreview ? (
                        <div className="w-full flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img src={imagePreview} className="w-14 h-14 object-cover rounded-lg border border-white/10" />
                            <div className="text-left">
                              <p className="text-xs font-bold text-white">Imagen seleccionada</p>
                              <p className="text-[9px] text-zinc-550">Haz clic en el área para cambiarla</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setImageFile(null);
                              setImagePreview("");
                            }}
                            className="bg-red-500/10 hover:bg-red-500/25 border border-red-500/25 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2.5 py-1.5"
                          >
                            Eliminar
                          </button>
                        </div>
                      ) : (
                        <div className="text-center space-y-2">
                          <UploadCloud className="w-6 h-6 text-zinc-500 mx-auto" />
                          <div>
                            <p className="text-xs font-bold text-white">Sube la Portada Principal</p>
                            <p className="text-[9px] text-zinc-550 mt-0.5">Haz clic para buscar (Soporta horizontal o vertical, Máx 5MB)</p>
                          </div>
                        </div>
                      )}
                      <input
                        id="portada-file-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) return alert("Tamaño excedido. Máx 5MB.");
                            setImageFile(file);
                            setImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: EXPERIENCE */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-base font-bold text-white font-outfit uppercase tracking-wide">Paso 2: Experiencia del Evento</h2>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Detalla las características y servicios del evento.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 ml-1">Descripción del Evento *</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Escribe detalles del lineup, stages, restricciones, etc."
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-xs min-h-[100px]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 ml-1">Código de Vestimenta (Dress Code)</label>
                      <input
                        type="text"
                        value={dressCode}
                        onChange={(e) => setDressCode(e.target.value)}
                        placeholder="Ej: Casual Premium, Elegante, All Black"
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 ml-1">Restricción de Edad Mínima</label>
                      <select
                        value={minAge}
                        onChange={(e) => setMinAge(Number(e.target.value))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-xs h-[46px]"
                      >
                        <option value={18}>Mayores de 18 años (+18)</option>
                        <option value={21}>Mayores de 21 años (+21)</option>
                        <option value={0}>Todo Público (Sin restricciones)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 ml-1">Hora de Apertura</label>
                      <input
                        type="time"
                        value={openingTime}
                        onChange={(e) => setOpeningTime(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-xs h-[46px]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 ml-1">Hora de Cierre Estimado</label>
                      <input
                        type="time"
                        value={closingTime}
                        onChange={(e) => setClosingTime(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-xs h-[46px]"
                      />
                    </div>
                  </div>

                  {/* Checklist options */}
                  <div className="pt-3 border-t border-white/5 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 block ml-1">Configuraciones de la Experiencia</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { state: hasParking, setter: setHasParking, label: "🚗 Parqueadero Disponible" },
                        { state: hasVipZone, setter: setHasVipZone, label: "👑 Zona VIP Exclusiva" },
                        { state: hasTablesModule, setter: setHasTablesModule, label: "🛋️ Módulo de Mesas VIP" },
                        { state: isAdultsOnly, setter: setIsAdultsOnly, label: "🔞 Exclusivo para Mayores" },
                        { state: isFreeEntry, setter: setIsFreeEntry, label: "🆓 Evento de Acceso Libre" },
                      ].map((item, idx) => (
                        <label 
                          key={idx}
                          className="flex items-center gap-2.5 p-2.5 bg-black/30 border border-white/5 rounded-xl cursor-pointer hover:border-white/10 transition-all text-xs font-semibold text-zinc-300"
                        >
                          <input
                            type="checkbox"
                            checked={item.state}
                            onChange={(e) => item.setter(e.target.checked)}
                            className="w-4 h-4 accent-primary-600 rounded"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: MULTIMEDIA GALLERY */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-base font-bold text-white font-outfit uppercase tracking-wide">Paso 3: Galería del Evento</h2>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Sube contenido multimedia adicional y selecciona la portada destacada.</p>
                  </div>

                  <div 
                    className="border-2 border-dashed border-white/10 bg-white/[0.01] hover:border-primary-500/35 rounded-3xl p-8 text-center cursor-pointer transition-all space-y-3"
                    onClick={() => document.getElementById("gallery-files-input")?.click()}
                  >
                    <UploadCloud className="w-8 h-8 text-zinc-500 mx-auto" />
                    <div>
                      <p className="text-xs font-bold text-white">Sube fotos y videos oficiales</p>
                      <p className="text-[10px] text-zinc-550 mt-1">Haz clic para buscar en tus archivos (JPG, PNG, WEBP, MP4 hasta 10MB)</p>
                    </div>
                    <input
                      id="gallery-files-input"
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleGalleryUpload}
                    />
                  </div>

                  {galleryItems.length > 0 && (
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 block ml-1">Archivos subidos</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {galleryItems.map((item) => (
                          <div 
                            key={item.id} 
                            className={`relative aspect-square rounded-2xl overflow-hidden bg-black/60 border group ${
                              item.isFeatured ? "border-primary-500 shadow-lg" : "border-white/5"
                            }`}
                          >
                            <img src={item.previewUrl} className="w-full h-full object-cover" />
                            
                            {/* Overlay Controls */}
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col justify-between p-2.5 transition-all text-xs font-bold">
                              <button
                                type="button"
                                onClick={() => handleSetFeatured(item.id)}
                                className={`w-full py-1 text-[9px] uppercase tracking-wider rounded-lg border text-center ${
                                  item.isFeatured 
                                    ? "bg-primary-600 border-none text-white" 
                                    : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                                }`}
                              >
                                {item.isFeatured ? "⭐ Destacada" : "Hacer Portada"}
                              </button>

                              <button
                                type="button"
                                onClick={() => setGalleryItems(galleryItems.filter(g => g.id !== item.id))}
                                className="w-full py-1 text-[9px] uppercase tracking-wider rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-center"
                              >
                                Eliminar
                              </button>
                            </div>

                            {item.isFeatured && (
                              <div className="absolute top-2 right-2 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center text-white text-[9px]">
                                ★
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 4: TICKETING */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-base font-bold text-white font-outfit uppercase tracking-wide">Paso 4: Boletería Avanzada</h2>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Define tu estrategia comercial de venta de entradas y mesas.</p>
                  </div>

                  {/* Strategy Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 ml-1">Estrategia Comercial</label>
                    <select
                      value={eventType}
                      onChange={(e) => {
                        setEventType(e.target.value);
                        setTicketingEnabled(e.target.value !== "free");
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-xs h-[46px]"
                    >
                      <option value="tickets">Venta de Entradas (Tiers / Preventas)</option>
                      <option value="free">Evento Gratuito (Registro Libre)</option>
                      <option value="tables">Reserva de Mesas VIP / Palcos</option>
                      <option value="tickets_and_tables">Boleto General + Mesa VIP</option>
                      <option value="guestlist">Lista de Invitados (Validación Directa)</option>
                    </select>
                  </div>

                  {/* Dynamic sections based on strategy */}
                  {eventType !== "free" && eventType !== "guestlist" && (
                    <div className="space-y-4">
                      {/* Price input */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 ml-1">Precio General Base (COP) *</label>
                        <input
                          type="number"
                          value={ticketPrice}
                          onChange={(e) => setTicketPrice(e.target.value)}
                          placeholder="Ej: 45000"
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-xs"
                          required
                        />
                      </div>

                      {/* Batches creator */}
                      <div className="border border-white/5 rounded-2xl p-4 bg-white/[0.005] space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Constructor de Lotes Adicionales (Opcional)</span>
                        
                        {batches.length > 0 && (
                          <div className="space-y-1.5">
                            {batches.map((b, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-black/40 border border-white/5 p-2.5 rounded-xl text-xs text-zinc-300">
                                <div>
                                  <span className="font-bold text-white block">{b.name}</span>
                                  <span className="text-[10px] text-zinc-550">Capacidad: {b.capacity}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-extrabold text-emerald-450">${b.price}</span>
                                  <button type="button" onClick={() => setBatches(batches.filter((_, i) => i !== idx))} className="text-zinc-500 hover:text-red-400">✕</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="p-3 bg-black/40 border border-white/5 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                          <label className="block text-[9px] text-zinc-500 font-bold uppercase">
                            Nombre
                            <input type="text" value={newBatchName} onChange={(e) => setNewBatchName(e.target.value)} placeholder="Preventa VIP" className="w-full bg-zinc-950 border border-white/8 rounded-lg px-2.5 py-1.5 text-xs text-white mt-1" />
                          </label>
                          <label className="block text-[9px] text-zinc-500 font-bold uppercase">
                            Precio
                            <input type="number" value={newBatchPrice} onChange={(e) => setNewBatchPrice(e.target.value)} placeholder="90000" className="w-full bg-zinc-950 border border-white/8 rounded-lg px-2.5 py-1.5 text-xs text-white mt-1" />
                          </label>
                          <div className="flex gap-2 items-end">
                            <label className="block text-[9px] text-zinc-500 font-bold uppercase flex-grow">
                              Aforo
                              <input type="number" value={newBatchCapacity} onChange={(e) => setNewBatchCapacity(e.target.value)} placeholder="50" className="w-full bg-zinc-950 border border-white/8 rounded-lg px-2.5 py-1.5 text-xs text-white mt-1" />
                            </label>
                            <button type="button" onClick={handleAddBatch} className="bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg p-2 h-[32px] flex items-center justify-center shrink-0 cursor-pointer"><Plus className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tables builder (If tables selected) */}
                  {(eventType === "tables" || eventType === "tickets_and_tables" || hasTablesModule) && (
                    <div className="border border-white/5 rounded-2xl p-4 bg-white/[0.005] space-y-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Configurar Mesas / Lounges VIP</span>
                      
                      {tablesList.length > 0 && (
                        <div className="space-y-1.5">
                          {tablesList.map((t, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-black/40 border border-white/5 p-2.5 rounded-xl text-xs text-zinc-300">
                              <div>
                                <span className="font-bold text-white block">🛋️ {t.name}</span>
                                <span className="text-[10px] text-zinc-550">Capacidad: {t.capacity} personas</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-extrabold text-primary-400">${t.price}</span>
                                <button type="button" onClick={() => setTablesList(tablesList.filter((_, i) => i !== idx))} className="text-zinc-500 hover:text-red-400">✕</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <label className="block text-[9px] text-zinc-500 font-bold uppercase">
                            Nombre Mesa
                            <input type="text" value={newTableName} onChange={(e) => setNewTableName(e.target.value)} placeholder="Palco Premium A" className="w-full bg-zinc-950 border border-white/8 rounded-lg px-2.5 py-1.5 text-xs text-white mt-1" />
                          </label>
                          <label className="block text-[9px] text-zinc-500 font-bold uppercase">
                            Precio ($)
                            <input type="number" value={newTablePrice} onChange={(e) => setNewTablePrice(e.target.value)} placeholder="1500000" className="w-full bg-zinc-950 border border-white/8 rounded-lg px-2.5 py-1.5 text-xs text-white mt-1" />
                          </label>
                          <label className="block text-[9px] text-zinc-500 font-bold uppercase">
                            Capacidad (Personas)
                            <input type="number" value={newTableCapacity} onChange={(e) => setNewTableCapacity(e.target.value)} placeholder="10" className="w-full bg-zinc-950 border border-white/8 rounded-lg px-2.5 py-1.5 text-xs text-white mt-1" />
                          </label>
                        </div>
                        <div className="flex gap-2 items-center">
                          <input type="text" value={newTableDesc} onChange={(e) => setNewTableDesc(e.target.value)} placeholder="Descripción (Ej: Incluye 2 botellas de licor y 10 entradas)" className="flex-grow bg-zinc-950 border border-white/8 rounded-lg px-2.5 py-1.5 text-xs text-white" />
                          <button type="button" onClick={handleAddTable} className="bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg p-2 h-[32px] shrink-0 cursor-pointer"><Plus className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 5: COMMUNITY & CONNECT */}
              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-base font-bold text-white font-outfit uppercase tracking-wide">Paso 5: Comunidad y Connect</h2>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Activa las herramientas sociales y de fidelización para tus asistentes.</p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { state: showEventCommunity, setter: setShowEventCommunity, label: "🌐 Activar Comunidad (Hangover Connect)", desc: "Permite que los usuarios interactúen, vean quién asistirá y conecten entre sí antes del evento." },
                      { state: showEventChat, setter: setShowEventChat, label: "💬 Activar Chat de la Fiesta", desc: "Habilita un chat temporal grupal exclusivo para los asistentes 24 horas antes del inicio." },
                      { state: allowFollowers, setter: setAllowFollowers, label: "🔔 Permitir Seguimiento", desc: "Los usuarios podrán seguir tu perfil de organizador directamente desde la página del evento." },
                      { state: activeCollabAlbum, setter: setActiveCollabAlbum, label: "📸 Álbum Colaborativo (Recuerdos)", desc: "Permite a los usuarios que validaron su código QR subir fotos y videos del evento en vivo." },
                      { state: showRealtimeAttendees, setter: setShowRealtimeAttendees, label: "📊 Mostrar Asistencia en Vivo", desc: "Muestra cuántas personas ya han escaneado su entrada en tiempo real en la página pública." }
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 bg-black/30 border border-white/5 rounded-2xl flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={item.state}
                          onChange={(e) => item.setter(e.target.checked)}
                          className="w-4.5 h-4.5 accent-primary-600 rounded mt-0.5 shrink-0 cursor-pointer"
                        />
                        <div className="text-xs">
                          <p className="font-bold text-white">{item.label}</p>
                          <p className="text-[10px] text-zinc-550 mt-0.5 leading-normal">{item.desc}</p>
                        </div>
                      </div>
                    ))}

                    <label className="block pt-2">
                      <span className="text-[10px] font-bold text-zinc-450 uppercase block mb-1">Nivel de Privacidad de Asistentes</span>
                      <select 
                        value={showAttendees}
                        onChange={(e) => setShowAttendees(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                      >
                        <option value="all">Mostrar asistentes y sus perfiles de Connect públicamente</option>
                        <option value="count_only">Mostrar únicamente el contador numérico de confirmados</option>
                        <option value="hidden">Ocultar completamente los asistentes (Evento Privado)</option>
                      </select>
                    </label>
                  </div>

                  {/* Lineup Builder (Optional) */}
                  <div className="border border-white/5 rounded-2xl p-4 bg-white/[0.005] space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Line-Up de Artistas / DJs (Opcional)</span>
                    
                    {lineup.length > 0 && (
                      <div className="space-y-1.5">
                        {lineup.map((art, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-black/40 border border-white/5 p-2.5 rounded-xl text-xs text-zinc-300">
                            <div>
                              <span className="font-bold text-white block">{art.artist_name}</span>
                              <span className="text-[10px] text-zinc-550">⏰ {art.performance_time}</span>
                            </div>
                            <button type="button" onClick={() => setLineup(lineup.filter((_, i) => i !== idx))} className="text-zinc-500 hover:text-red-400">✕</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="p-3 bg-black/40 border border-white/5 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-end">
                      <label className="block text-[9px] text-zinc-500 font-bold uppercase">
                        DJ / Banda
                        <input type="text" value={newArtistName} onChange={(e) => setNewArtistName(e.target.value)} placeholder="Ej: DJ Steve" className="w-full bg-zinc-950 border border-white/8 rounded-lg px-2.5 py-1.5 text-xs text-white mt-1" />
                      </label>
                      <div className="flex gap-2 items-end">
                        <label className="block text-[9px] text-zinc-500 font-bold uppercase flex-grow">
                          Horario
                          <input type="text" value={newArtistTime} onChange={(e) => setNewArtistTime(e.target.value)} placeholder="11:30 PM" className="w-full bg-zinc-950 border border-white/8 rounded-lg px-2.5 py-1.5 text-xs text-white mt-1" />
                        </label>
                        <button type="button" onClick={handleAddArtist} className="bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg p-2 h-[32px] shrink-0 cursor-pointer"><Plus className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 7: RESUME & FINISH */}
              {step === 7 && (
                <motion.div
                  key="step7"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-base font-bold text-white font-outfit uppercase tracking-wide">Paso 7: Publicación</h2>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Verifica los datos resumidos de tu evento y publícalo en el marketplace.</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.005] border border-white/5 space-y-3.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-zinc-500">Título</span>
                      <span className="font-bold text-white">{title}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-zinc-500">Categoría</span>
                      <span className="font-bold text-primary-400">{category}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-zinc-500">Fecha</span>
                      <span className="font-bold text-white">{formattedLiveDate} ({formattedLiveTime} HS)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-zinc-500">Ubicación</span>
                      <span className="font-bold text-zinc-200">{location}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-zinc-500">Boletería</span>
                      <span className="font-bold text-emerald-450">
                        {eventType === "free" ? "Gratuito" : `$${ticketPrice}`}
                      </span>
                    </div>
                    {batches.length > 0 && (
                      <div className="flex justify-between py-1.5 border-b border-white/5">
                        <span className="text-zinc-500">Lotes creados</span>
                        <span className="font-bold text-zinc-200">{batches.length} lotes</span>
                      </div>
                    )}
                    {tablesList.length > 0 && (
                      <div className="flex justify-between py-1.5 border-b border-white/5">
                        <span className="text-zinc-500">Mesas VIP configuradas</span>
                        <span className="font-bold text-zinc-200">{tablesList.length} mesas</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1.5">
                      <span className="text-zinc-500">Comunidad / Chat</span>
                      <span className="font-bold text-zinc-200">
                        {showEventCommunity ? "Activada" : "Desactivada"} / {showEventChat ? "Activado" : "Desactivado"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleSubmitForm(false)}
                      disabled={isPending || success}
                      className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-xl py-3.5 font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary-600/10"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Publicar Evento Premium
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleSubmitForm(true)}
                        disabled={isPending || success}
                        className="bg-zinc-900 hover:bg-zinc-850 border border-white/10 hover:border-white/15 text-zinc-300 rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Guardar Borrador
                      </button>
                      <button
                        type="button"
                        onClick={() => alert("El evento se ha programado para publicarse próximamente.")}
                        disabled={isPending || success}
                        className="bg-zinc-900 hover:bg-zinc-850 border border-white/10 hover:border-white/15 text-zinc-300 rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Programar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </form>

            {/* STEP ACTIONS */}
            {step < 6 && (
              <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-between items-center border-t border-white/5">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-xs py-2 px-4 border border-white/5 hover:border-white/10 rounded-xl cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Atrás
                  </button>
                ) : (
                  <Link 
                    href="/dashboard/provider"
                    className="flex items-center justify-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs"
                  >
                    <ArrowLeft className="w-4 h-4" /> Volver al Panel
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full sm:w-auto min-w-[150px] bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl py-3 px-6 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: STICKY LIVE PREVIEW CARD & COMPLETION SCORE */}
          <div className="space-y-6 lg:sticky lg:top-6">
            
            {/* Completion Meter */}
            <div className="glass-card p-5 bg-zinc-950/40 border border-white/5 rounded-3xl space-y-3.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Completitud del Evento</span>
                <span className="text-xs font-black text-white">{completionData.score}%</span>
              </div>
              
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-500 via-indigo-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${completionData.score}%` }}
                />
              </div>

              {completionData.score === 100 ? (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-[10px] font-bold text-yellow-400 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span>🏆 Evento Optimizado. Recibirás más visitas y ventas.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-extrabold block">Recomendaciones</span>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {completionData.suggestions.map((sug, i) => (
                      <p key={i} className="text-[10px] text-zinc-450 flex items-center gap-1.5">
                        <span className="text-amber-500 font-bold">⚠</span> {sug}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Live Feed Card preview */}
            <div className="glass-card p-5 bg-zinc-950/40 border border-white/5 rounded-3xl space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Vista Previa del Feed</span>
              
              {/* Event Card Layout Mockup */}
              <div className="aspect-[4/3] rounded-2xl overflow-hidden relative border border-white/8 group shadow-2xl flex flex-col justify-end bg-zinc-900">
                {imagePreview ? (
                  <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-black" />
                )}
                
                {/* Gradient shade */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent z-10" />

                <div className="absolute top-3 left-3 bg-primary-600/90 text-white font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-full z-20">
                  {category}
                </div>

                <div className="p-4 z-20 space-y-1 text-left">
                  <p className="text-[9px] text-primary-400 font-bold uppercase tracking-wider">{formattedLiveDate} · {formattedLiveTime}</p>
                  <h4 className="font-extrabold text-white text-sm truncate">{title || "Fiesta Blanca 2026"}</h4>
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[9px] text-zinc-450 font-semibold flex items-center gap-0.5"><MapPin className="w-3 h-3 text-zinc-550" /> {location || "Barranquilla"}</span>
                    <span className="text-xs font-black text-emerald-450">
                      {isFreeEntry || eventType === "free" ? "Gratis" : `$${ticketPrice || "0"}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
