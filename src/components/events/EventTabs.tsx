"use client";

import { useState, useEffect, useTransition } from "react";
import { 
  Info, Users, Clock, Shirt, ShieldAlert, MapPin, Navigation, 
  Image as ImageIcon, HelpCircle, Calendar, Plus, Music, Radio,
  MessageSquare, Sparkles, Volume2, UserCheck, ChevronDown, ChevronUp, Loader2, Trash2, Camera, Lock, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { CommunityTab } from "@/components/connect/CommunityTab";
import { EventGallery } from "@/components/events/EventGallery";
import { EventGalleryManager } from "@/components/events/EventGalleryManager";
import { EventChatRoom } from "@/components/events/EventChatRoom";
import { 
  getEventUpdates, addEventUpdate, 
  getEventLineup, addEventLineupItem, 
  getEventAttendees, 
  getEventMemories, addEventMemory 
} from "@/app/events/actions";

interface EventTabsProps {
  eventId: string;
  eventDescription: string | null;
  eventLocation: string;
  openTime: string;
  closeTime: string;
  dressCode: string;
  minAge: string;
  hasConnectAccess: boolean;
  connectBookingId: string | null;
  currentUser: any;
  galleryItems?: any[];
  creatorId?: string;
  eventDate?: string;
}

export function EventTabs({
  eventId,
  eventDescription,
  eventLocation,
  openTime,
  closeTime,
  dressCode,
  minAge,
  hasConnectAccess,
  connectBookingId,
  currentUser,
  galleryItems = [],
  creatorId,
  eventDate = new Date().toISOString()
}: EventTabsProps) {
  const [activeTab, setActiveTab] = useState<"info" | "gallery" | "community">("info");
  
  // Gallery states
  const [galleryTab, setGalleryTab] = useState<"official" | "memories">("official");
  const [officialGallery, setOfficialGallery] = useState(galleryItems);
  const [memories, setMemories] = useState<any[]>([]);
  const [memoriesLoading, setMemoriesLoading] = useState(false);

  // Lineup states
  const [lineup, setLineup] = useState<any[]>([]);
  const [lineupLoading, setLineupLoading] = useState(true);

  // Updates states
  const [updates, setUpdates] = useState<any[]>([]);
  const [updatesLoading, setUpdatesLoading] = useState(true);

  // Attendees list
  const [attendees, setAttendees] = useState<any[]>([]);
  const [attendeesLoading, setAttendeesLoading] = useState(true);

  // Community sub-tab: 'connect' (interactive Connect presence widget) vs 'chat' (exclusive text chat room)
  const [communitySubTab, setCommunitySubTab] = useState<"connect" | "chat">("connect");

  // Accordion FAQ states
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

  // Forms states (for organizer role edits)
  const [showAddArtist, setShowAddArtist] = useState(false);
  const [artistName, setArtistName] = useState("");
  const [artistTime, setArtistTime] = useState("");
  const [artistDesc, setArtistDesc] = useState("");
  const [artistImg, setArtistImg] = useState("");
  const [artistSubmitting, setArtistSubmitting] = useState(false);

  const [showAddUpdate, setShowAddUpdate] = useState(false);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateDesc, setUpdateDesc] = useState("");
  const [updateSubmitting, setUpdateSubmitting] = useState(false);

  // Memories guest uploads form
  const [selectedMemoryFile, setSelectedMemoryFile] = useState<File | null>(null);
  const [memoryFilePreview, setMemoryFilePreview] = useState<string | null>(null);
  const [memoryTitle, setMemoryTitle] = useState("");
  const [memorySubmitting, setMemorySubmitting] = useState(false);

  const isOrganizer = currentUser && creatorId && currentUser.id === creatorId;

  // Load Lineup, Updates, and Attendees on mount
  useEffect(() => {
    fetchLineup();
    fetchUpdates();
    fetchAttendees();
    fetchMemories();
  }, [eventId]);

  const fetchLineup = async () => {
    setLineupLoading(true);
    const res = await getEventLineup(eventId);
    if (res.success) setLineup(res.lineup || []);
    setLineupLoading(false);
  };

  const fetchUpdates = async () => {
    setUpdatesLoading(true);
    const res = await getEventUpdates(eventId);
    if (res.success) setUpdates(res.updates || []);
    setUpdatesLoading(false);
  };

  const fetchAttendees = async () => {
    setAttendeesLoading(true);
    const res = await getEventAttendees(eventId);
    if (res.success) setAttendees(res.attendees || []);
    setAttendeesLoading(false);
  };

  const fetchMemories = async () => {
    setMemoriesLoading(true);
    const res = await getEventMemories(eventId);
    if (res.success) setMemories(res.memories || []);
    setMemoriesLoading(false);
  };

  const handleAddArtistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistName || !artistTime) return;
    setArtistSubmitting(true);
    const res = await addEventLineupItem(eventId, artistName, artistTime, artistDesc, artistImg || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300");
    setArtistSubmitting(false);
    if (res.error) {
      alert(res.error);
    } else {
      setArtistName(""); setArtistTime(""); setArtistDesc(""); setArtistImg("");
      setShowAddArtist(false);
      fetchLineup();
    }
  };

  const handleAddUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateTitle) return;
    setUpdateSubmitting(true);
    const res = await addEventUpdate(eventId, updateTitle, updateDesc);
    setUpdateSubmitting(false);
    if (res.error) {
      alert(res.error);
    } else {
      setUpdateTitle(""); setUpdateDesc("");
      setShowAddUpdate(false);
      fetchUpdates();
    }
  };

  const handleAddMemorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemoryFile) {
      alert("Por favor selecciona una foto para subir.");
      return;
    }
    setMemorySubmitting(true);
    const supabase = createClient();
    const bucketName = "event-memories";

    try {
      const fileExt = selectedMemoryFile.name.split(".").pop() || "jpg";
      const filePath = `${eventId}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, selectedMemoryFile, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      const res = await addEventMemory(eventId, publicUrl, 'image', memoryTitle);
      
      if (res.error) {
        alert(res.error);
      } else {
        setSelectedMemoryFile(null);
        setMemoryFilePreview(null);
        setMemoryTitle("");
        fetchMemories();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al subir la imagen del recuerdo.");
    } finally {
      setMemorySubmitting(false);
    }
  };

  // Static FAQ items
  const faqs = [
    { q: "¿Hay parqueadero disponible?", a: "Sí, el establecimiento cuenta con parqueadero privado vigilado y servicio de Valet Parking en la entrada principal." },
    { q: "¿Aceptan tarjetas de crédito y pagos digitales?", a: "Sí, se aceptan todas las tarjetas de crédito (Visa, MasterCard, Amex) y métodos de pago digital (Apple Pay, transferencias locales)." },
    { q: "¿Hay zonas exclusivas VIP?", a: "Sí, contamos con palcos VIP y zonas Lounge elevadas con servicio de mesero personalizado, botellas premium y acceso a baños exclusivos." },
    { q: "¿Existe restricción de edad para este evento?", a: "El evento es de ingreso exclusivo para mayores de edad (+18). Es obligatorio presentar documento de identidad físico (Cédula de Ciudadanía, pasaporte o licencia)." },
    { q: "¿Se permite el reingreso al recinto?", a: "Por políticas de seguridad del local, una vez valides tu código QR de entrada y salgas del establecimiento, no se permitirá el reingreso con el mismo ticket." }
  ];

  const mapsSearchQuery = encodeURIComponent(eventLocation);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsSearchQuery}`;

  return (
    <div className="space-y-6">
      {/* Navigation Tabs Header */}
      <div className="flex p-1 bg-black/45 rounded-2xl gap-2 shrink-0 w-full sm:max-w-lg border border-white/6 shadow-lg">
        <button
          onClick={() => setActiveTab("info")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
            activeTab === "info"
              ? "bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-lg shadow-primary-500/20"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-white/3"
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          Info
        </button>
        <button
          onClick={() => setActiveTab("gallery")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
            activeTab === "gallery"
              ? "bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-lg shadow-primary-500/20"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-white/3"
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Galería
        </button>
        <button
          onClick={() => setActiveTab("community")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
            activeTab === "community"
              ? "bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-lg shadow-primary-500/20"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-white/3"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Comunidad
        </button>
      </div>

      {/* Tab Contents */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
          {/* TAB 1: GENERAL INFO (Includes Description, Lineup, Timeline updates, FAQ Accordion) */}
          {activeTab === "info" && (
            <motion.div
              key="event-info-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Event Description Card */}
              <div className="bg-zinc-950/40 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6">
                <div className="space-y-3">
                  <h2 className="text-xs font-black text-primary-400 font-outfit uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Sobre este evento
                  </h2>
                  <p className="text-zinc-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                    {eventDescription || "Disfruta de la mejor atmósfera musical y producción de vanguardia. Prepárate para una noche inolvidable en compañía del line-up de primer nivel y servicios VIP exclusivos."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-white/5">
                  <div className="flex gap-3.5 p-4 rounded-2xl bg-[#09090f]/75 border border-white/5">
                    <Clock className="w-5 h-5 text-primary-450 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="text-zinc-500 font-bold uppercase tracking-wider">Apertura</p>
                      <p className="font-semibold text-zinc-200 mt-0.5">{openTime}</p>
                    </div>
                  </div>

                  <div className="flex gap-3.5 p-4 rounded-2xl bg-[#09090f]/75 border border-white/5">
                    <Clock className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="text-zinc-500 font-bold uppercase tracking-wider">Cierre Estimado</p>
                      <p className="font-semibold text-zinc-200 mt-0.5">{closeTime}</p>
                    </div>
                  </div>

                  <div className="flex gap-3.5 p-4 rounded-2xl bg-[#09090f]/75 border border-white/5">
                    <Shirt className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="text-zinc-500 font-bold uppercase tracking-wider">Dress Code</p>
                      <p className="font-semibold text-zinc-200 mt-0.5">{dressCode}</p>
                    </div>
                  </div>

                  <div className="flex gap-3.5 p-4 rounded-2xl bg-[#09090f]/75 border border-white/5">
                    <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="text-zinc-500 font-bold uppercase tracking-wider">Edad Mínima</p>
                      <p className="font-semibold text-zinc-200 mt-0.5">{minAge}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FESTIVAL LINEUP SECTION */}
              <div className="bg-zinc-950/40 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black text-primary-400 font-outfit uppercase tracking-widest flex items-center gap-1.5">
                    <Music className="w-4 h-4" /> Line-Up Oficial
                  </h2>
                  {isOrganizer && (
                    <button
                      onClick={() => setShowAddArtist(!showAddArtist)}
                      className="px-3.5 py-1.5 rounded-lg border border-white/8 hover:border-white/15 bg-white/5 text-[10px] font-black uppercase tracking-wider text-zinc-300 transition-all cursor-pointer"
                    >
                      {showAddArtist ? "Cerrar" : "+ Añadir DJ/Artista"}
                    </button>
                  )}
                </div>

                {showAddArtist && (
                  <form onSubmit={handleAddArtistSubmit} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] uppercase font-bold text-zinc-500 block mb-1">Nombre Artista *</label>
                        <input type="text" required value={artistName} onChange={(e) => setArtistName(e.target.value)} className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-xs text-white" placeholder="ej: DJ Kross" />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-zinc-500 block mb-1">Horario Show *</label>
                        <input type="text" required value={artistTime} onChange={(e) => setArtistTime(e.target.value)} className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-xs text-white" placeholder="ej: 11:30 PM - 01:00 AM" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-zinc-500 block mb-1">Descripción / Bio Corta</label>
                      <input type="text" value={artistDesc} onChange={(e) => setArtistDesc(e.target.value)} className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-xs text-white" placeholder="ej: Dj y productor residente crossover..." />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-zinc-500 block mb-1">Foto del Artista (URL)</label>
                      <input type="text" value={artistImg} onChange={(e) => setArtistImg(e.target.value)} className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-xs text-white" placeholder="ej: https://unsplash.com/..." />
                    </div>
                    <button type="submit" disabled={artistSubmitting} className="w-full py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs uppercase tracking-wider">
                      {artistSubmitting ? "Guardando..." : "Confirmar Artista"}
                    </button>
                  </form>
                )}

                {lineupLoading ? (
                  <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-zinc-650" /></div>
                ) : lineup.length === 0 ? (
                  <div className="text-center py-8 rounded-2xl border border-dashed border-white/5 text-zinc-500 text-xs">
                    No se han registrado artistas en el line-up de este evento aún.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {lineup.map((art) => (
                      <div key={art.id} className="flex gap-4 p-4 rounded-2xl bg-zinc-950/50 border border-white/5 items-center hover:border-white/10 transition-colors">
                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-white/8 bg-zinc-900">
                          <img src={art.image_url || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=150"} alt={art.artist_name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-grow">
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="font-extrabold text-white text-xs truncate leading-snug font-outfit">{art.artist_name}</h4>
                            <span className="text-[9px] font-black text-primary-400 bg-primary-500/10 border border-primary-500/15 px-2 py-0.5 rounded-full uppercase shrink-0">
                              {art.performance_time}
                            </span>
                          </div>
                          {art.description && <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{art.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* TIMELINE OF ANNOUNCEMENTS (NOVEDADES) */}
              <div className="bg-zinc-950/40 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black text-primary-400 font-outfit uppercase tracking-widest flex items-center gap-1.5">
                    <Radio className="w-4 h-4" /> Novedades y Anuncios
                  </h2>
                  {isOrganizer && (
                    <button
                      onClick={() => setShowAddUpdate(!showAddUpdate)}
                      className="px-3.5 py-1.5 rounded-lg border border-white/8 hover:border-white/15 bg-white/5 text-[10px] font-black uppercase tracking-wider text-zinc-300 transition-all cursor-pointer"
                    >
                      {showAddUpdate ? "Cerrar" : "+ Publicar Novedad"}
                    </button>
                  )}
                </div>

                {showAddUpdate && (
                  <form onSubmit={handleAddUpdateSubmit} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-zinc-500 block mb-1">Título de la Novedad *</label>
                      <input type="text" required value={updateTitle} onChange={(e) => setUpdateTitle(e.target.value)} className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-xs text-white" placeholder="ej: Primer lote agotado" />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-zinc-500 block mb-1">Detalles / Descripción *</label>
                      <textarea required rows={3} value={updateDesc} onChange={(e) => setUpdateDesc(e.target.value)} className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-xs text-white" placeholder="ej: El lote 1 se encuentra 100% agotado..." />
                    </div>
                    <button type="submit" disabled={updateSubmitting} className="w-full py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs uppercase tracking-wider">
                      {updateSubmitting ? "Publicando..." : "Publicar Anuncio"}
                    </button>
                  </form>
                )}

                {updatesLoading ? (
                  <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-zinc-650" /></div>
                ) : updates.length === 0 ? (
                  <div className="text-center py-8 rounded-2xl border border-dashed border-white/5 text-zinc-500 text-xs">
                    El organizador no ha publicado novedades de este evento por el momento.
                  </div>
                ) : (
                  <div className="relative pl-6 border-l border-white/10 space-y-6 ml-2.5">
                    {updates.map((up) => (
                      <div key={up.id} className="relative">
                        {/* Dot indicator */}
                        <span className="absolute -left-[31px] top-1.5 w-3 h-3 bg-indigo-500 rounded-full border border-zinc-950 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                              {new Date(up.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-white text-xs font-outfit">{up.title}</h4>
                          {up.description && <p className="text-[10px] text-zinc-400 leading-relaxed">{up.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ACCORDION FAQ SECTION */}
              <div className="bg-zinc-950/40 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6">
                <h2 className="text-xs font-black text-primary-400 font-outfit uppercase tracking-widest flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" /> Preguntas Frecuentes
                </h2>

                <div className="space-y-3.5">
                  {faqs.map((faq, idx) => {
                    const isOpen = faqOpenIndex === idx;
                    return (
                      <div key={idx} className="border border-white/5 bg-zinc-900/10 rounded-2xl overflow-hidden hover:border-white/10 transition-all">
                        <button
                          onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                          className="w-full flex items-center justify-between p-4.5 text-left text-xs font-bold text-zinc-250 cursor-pointer"
                        >
                          <span className="pr-4">{faq.q}</span>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: "auto" }}
                              exit={{ height: 0 }}
                              className="overflow-hidden"
                            >
                              <p className="px-4.5 pb-4.5 pt-1 text-[11px] text-zinc-450 leading-relaxed">{faq.a}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: GALLERY (Official & Memories albums) */}
          {activeTab === "gallery" && (
            <motion.div
              key="event-gallery-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Inner Tab bar for gallery type */}
              <div className="flex border-b border-white/5 p-1 bg-black/20 rounded-2xl gap-1">
                <button
                  onClick={() => setGalleryTab("official")}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all ${
                    galleryTab === "official" ? "bg-white/5 text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  📸 Galería Oficial
                </button>
                <button
                  onClick={() => setGalleryTab("memories")}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all ${
                    galleryTab === "memories" ? "bg-white/5 text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  🎉 Recuerdos de Asistentes
                </button>
              </div>

              {galleryTab === "official" ? (
                <div className="space-y-6">
                  {isOrganizer && (
                    <EventGalleryManager
                      eventId={eventId}
                      initialItems={officialGallery}
                      onItemsChange={setOfficialGallery}
                    />
                  )}
                  <EventGallery items={officialGallery.filter((item: any) => item.active)} />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Guest memory upload block */}
                  {hasConnectAccess ? (
                    <form onSubmit={handleAddMemorySubmit} className="p-5 rounded-2xl bg-zinc-950/40 border border-white/6 space-y-4">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-primary-450" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-300">¡Comparte tus fotos del evento!</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                        {/* Custom File Uploader */}
                        <div className="relative">
                          {memoryFilePreview ? (
                            <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/10 group">
                              <img src={memoryFilePreview} alt="Preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMemoryFile(null);
                                  setMemoryFilePreview(null);
                                }}
                                className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-650 hover:bg-red-500 rounded-full flex items-center justify-center text-white text-xs transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border border-dashed border-white/10 hover:border-primary-500/40 bg-black/40 cursor-pointer p-4 transition-all">
                              <Camera className="w-6 h-6 text-zinc-500 mb-1" />
                              <span className="text-[10px] font-bold text-zinc-400">Seleccionar Foto</span>
                              <span className="text-[8px] text-zinc-650 mt-0.5">JPG, PNG (máx. 10MB)</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setSelectedMemoryFile(file);
                                    setMemoryFilePreview(URL.createObjectURL(file));
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>

                        {/* Title Caption Input */}
                        <div className="space-y-3">
                          <label className="block">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Pie de foto (opcional)</span>
                            <input
                              type="text"
                              value={memoryTitle}
                              onChange={(e) => setMemoryTitle(e.target.value)}
                              placeholder="Ej. ¡Qué gran noche! 🎉"
                              className="w-full bg-black/40 border border-white/8 rounded-xl px-4 py-3 text-xs text-white placeholder:text-zinc-650 focus:outline-none focus:border-primary-500"
                            />
                          </label>
                        </div>
                      </div>
                      
                      <button type="submit" disabled={memorySubmitting || !selectedMemoryFile} className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        {memorySubmitting ? "Subiendo..." : "Publicar Recuerdo"}
                      </button>
                    </form>
                  ) : (
                    <div className="p-4.5 rounded-2xl bg-zinc-950/40 border border-white/5 text-center text-xs text-zinc-500 space-y-1">
                      <Lock className="w-5 h-5 mx-auto text-zinc-650" />
                      <p className="font-bold">Álbum colaborativo bloqueado</p>
                      <p className="text-[10px] text-zinc-600">Solo disponible para usuarios que validaron su ticket QR en el ingreso.</p>
                    </div>
                  )}

                  {memoriesLoading ? (
                    <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-zinc-650" /></div>
                  ) : memories.length === 0 ? (
                    <div className="text-center py-12 rounded-2xl border border-dashed border-white/5 text-zinc-500 text-xs">
                      No hay recuerdos subidos por asistentes aún. ¡Sé el primero en compartir!
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {memories.map((mem) => (
                        <div key={mem.id} className="relative aspect-square rounded-2xl overflow-hidden border border-white/5 group bg-zinc-950">
                          <img src={mem.url} alt={mem.title || "Recuerdo"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                            <span className="text-[8px] font-black uppercase text-primary-400">Por {mem.user?.full_name || "Asistente"}</span>
                            {mem.title && <span className="text-[9px] font-semibold text-white leading-tight mt-0.5 truncate">{mem.title}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: COMMUNITY (Hangover Connect & live chat) */}
          {activeTab === "community" && (
            <motion.div
              key="event-community-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Inner Tab bar for Connect tab type */}
              <div className="flex border-b border-white/5 p-1 bg-black/20 rounded-2xl gap-1">
                <button
                  onClick={() => setCommunitySubTab("connect")}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all ${
                    communitySubTab === "connect" ? "bg-white/5 text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  👥 Asistentes y Connect
                </button>
                <button
                  onClick={() => setCommunitySubTab("chat")}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all ${
                    communitySubTab === "chat" ? "bg-white/5 text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  💬 Chat del Evento
                </button>
              </div>

              {communitySubTab === "connect" ? (
                <div className="space-y-8">
                  {/* Grid of unique attendees parsed from Server Action */}
                  <div className="bg-zinc-950/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md space-y-4">
                    <h4 className="text-xs uppercase font-extrabold tracking-widest text-zinc-400">Asistentes Confirmados ({attendees.length})</h4>
                    {attendeesLoading ? (
                      <div className="py-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-zinc-650" /></div>
                    ) : attendees.length === 0 ? (
                      <p className="text-xs text-zinc-650">No hay asistentes registrados públicamente aún.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {attendees.map((att) => (
                          <div key={att.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[#09090f]/75 border border-white/5 hover:border-white/10 transition-colors">
                            <div className="w-8 h-8 rounded-full border border-white/10 bg-zinc-900 overflow-hidden shrink-0">
                              {att.avatar_url ? (
                                <img src={att.avatar_url} alt={att.full_name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-primary-600/20 flex items-center justify-center text-[10px] font-extrabold text-white uppercase">
                                  {att.full_name?.charAt(0) || "U"}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-white truncate leading-tight">{att.full_name || "Cliente Hangover"}</p>
                              {att.city && <p className="text-[9px] text-zinc-500 truncate mt-0.5">📍 {att.city}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Connect presence/interactive check-in widget */}
                  <CommunityTab
                    eventId={eventId}
                    hasAccess={hasConnectAccess}
                    bookingId={connectBookingId}
                    currentUser={currentUser}
                  />
                </div>
              ) : (
                <EventChatRoom
                  eventId={eventId}
                  currentUser={currentUser}
                  hasAccess={hasConnectAccess}
                  eventDate={eventDate}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
