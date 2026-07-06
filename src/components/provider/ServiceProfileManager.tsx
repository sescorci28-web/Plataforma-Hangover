'use client';

import { useState, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import { 
  X, Play, Trash2, UploadCloud, Film, Image as ImageIcon, Loader2, 
  Sparkles, Check, Calendar as CalendarIcon, Music, Disc, Link as LinkIcon, 
  Plus, Info, ChevronLeft, ChevronRight, Eye, EyeOff, Star
} from 'lucide-react';
import { 
  getServiceAvailability, 
  toggleServiceAvailabilityDate, 
  getServiceMedia, 
  getServicePastEvents, 
  createServicePastEvent, 
  deleteServicePastEvent, 
  updateServiceProductions 
} from '@/app/services/actions';

interface ServiceProfileManagerProps {
  service: {
    id: string;
    title: string;
    category: string;
    spotify_url?: string | null;
    soundcloud_url?: string | null;
    youtube_url?: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
}

interface MediaItem {
  id: string;
  url: string;
  media_type: 'image' | 'video';
  thumbnail_url?: string | null;
  title?: string | null;
  description?: string | null;
  display_order: number;
  active: boolean;
  featured: boolean;
  duration?: number;
  created_at: string;
}

interface PastEvent {
  id: string;
  title: string;
  event_date: string;
  description?: string | null;
  media_urls?: string[];
}

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export function ServiceProfileManager({ service, isOpen, onClose }: ServiceProfileManagerProps) {
  const isArtistOrDj = 
    service.category === "music" || 
    service.category?.toLowerCase().includes("music") ||
    service.category?.toLowerCase().includes("dj") ||
    service.category?.toLowerCase().includes("show");

  const [activeTab, setActiveTab] = useState<'media' | 'calendar' | 'past_events' | 'productions'>('media');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Media specific tab
  const [activeMediaTab, setActiveMediaTab] = useState<'stories' | 'gallery'>('stories');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(true);

  // Upload form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [duration, setDuration] = useState(5);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Calendar states
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [manualAvailability, setManualAvailability] = useState<any[]>([]);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Past events states
  const [pastEvents, setPastEvents] = useState<PastEvent[]>([]);
  const [pastEventsLoading, setPastEventsLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventFile, setEventFile] = useState<File | null>(null);
  const [eventPreviewUrl, setEventPreviewUrl] = useState<string | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  // Productions state
  const [spotifyUrl, setSpotifyUrl] = useState(service.spotify_url || '');
  const [soundcloudUrl, setSoundcloudUrl] = useState(service.soundcloud_url || '');
  const [youtubeUrl, setYoutubeUrl] = useState(service.youtube_url || '');
  const [productionsSaving, startSaveProductions] = useTransition();
  const [productionsSaved, setProductionsSaved] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'media') fetchMedia();
      if (activeTab === 'calendar') fetchCalendar();
      if (activeTab === 'past_events') fetchPastEvents();
    }
  }, [isOpen, activeTab, activeMediaTab]);

  const cleanupPreviews = () => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    if (thumbnailPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(thumbnailPreviewUrl);
    setPreviewUrl(null);
    setThumbnailPreviewUrl(null);
    setSelectedFile(null);
    setThumbnailFile(null);
  };

  const resetUploadForm = () => {
    cleanupPreviews();
    setTitle('');
    setDescription('');
    setDisplayOrder(0);
    setIsActive(true);
    setIsFeatured(false);
    setDuration(5);
    setUploadProgress(null);
  };

  const fetchMedia = async () => {
    setMediaLoading(true);
    try {
      const res = await getServiceMedia(service.id);
      if (res.success) {
        const list = activeMediaTab === 'stories' ? res.stories : res.gallery;
        setMediaItems(list as MediaItem[]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMediaLoading(false);
    }
  };

  const generateVideoThumbnail = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.autoplay = false;
      video.muted = true;
      video.playsInline = true;
      const fileUrl = URL.createObjectURL(file);
      video.src = fileUrl;
      video.onloadedmetadata = () => {
        const limit = activeMediaTab === 'stories' ? 30 : 90;
        if (video.duration > limit) {
          URL.revokeObjectURL(fileUrl);
          reject(new Error(`El video supera la duración máxima permitida de ${limit} segundos.`));
          return;
        }
        video.currentTime = Math.min(1, video.duration / 2);
      };
      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              if (blob) {
                const thumb = new File([blob], `thumb-${Date.now()}.jpg`, { type: 'image/jpeg' });
                URL.revokeObjectURL(fileUrl);
                resolve(thumb);
              } else {
                URL.revokeObjectURL(fileUrl);
                reject(new Error("Error al capturar miniatura."));
              }
            }, 'image/jpeg', 0.85);
          }
        } catch (err) {
          URL.revokeObjectURL(fileUrl);
          reject(err);
        }
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    cleanupPreviews();
    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');
    try {
      if (isVideo) {
        setUploadProgress("Procesando metadatos de video...");
        const thumb = await generateVideoThumbnail(file);
        setThumbnailFile(thumb);
        setThumbnailPreviewUrl(URL.createObjectURL(thumb));
        setUploadProgress(null);
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } catch (err: any) {
      alert(err.message || "Error al procesar archivo.");
      cleanupPreviews();
    }
  };

  const handleMediaUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress("Subiendo archivo...");
    const bucket = activeMediaTab === 'stories' ? 'service-stories' : 'service-gallery';
    const isVideo = mediaType === 'video';

    try {
      const fileExt = selectedFile.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
      const mainPath = `${service.id}/${Date.now()}-${Math.random().toString(36).substring(2,7)}.${fileExt}`;
      const { error: uploadErr } = await supabase.storage.from(bucket).upload(mainPath, selectedFile, { cacheControl: '3600', upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl: mainUrl } } = supabase.storage.from(bucket).getPublicUrl(mainPath);

      let finalThumbnailUrl = null;
      if (isVideo && thumbnailFile) {
        setUploadProgress("Subiendo miniatura...");
        const thumbPath = `${service.id}/thumbs/${Date.now()}-${Math.random().toString(36).substring(2,7)}.jpg`;
        const { error: thumbErr } = await supabase.storage.from(bucket).upload(thumbPath, thumbnailFile, { cacheControl: '3600', upsert: true });
        if (thumbErr) throw thumbErr;
        const { data: { publicUrl: thumbUrl } } = supabase.storage.from(bucket).getPublicUrl(thumbPath);
        finalThumbnailUrl = thumbUrl;
      }

      setUploadProgress("Guardando registro...");
      const table = activeMediaTab === 'stories' ? 'service_stories' : 'service_gallery_items';
      const payload: any = {
        service_id: service.id,
        url: mainUrl,
        media_type: mediaType,
        thumbnail_url: finalThumbnailUrl,
        title: title.trim() || null,
        description: description.trim() || null,
        display_order: displayOrder,
        active: isActive,
        featured: isFeatured
      };
      if (activeMediaTab === 'stories') payload.duration = duration;

      const { error: dbErr } = await supabase.from(table).insert(payload);
      if (dbErr) throw dbErr;

      resetUploadForm();
      fetchMedia();
    } catch (err: any) {
      alert(err.message || "Error al subir multimedia.");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleToggleActiveField = async (id: string, field: 'active' | 'featured', currentValue: boolean) => {
    try {
      const table = activeMediaTab === 'stories' ? 'service_stories' : 'service_gallery_items';
      await supabase.from(table).update({ [field]: !currentValue }).eq('id', id);
      setMediaItems(mediaItems.map(item => item.id === id ? { ...item, [field]: !currentValue } : item));
    } catch (e) { console.error(e); }
  };

  const handleDeleteMediaItem = async (item: MediaItem) => {
    if (!confirm("¿Eliminar este elemento multimedia de forma permanente?")) return;
    setIsDeletingId(item.id);
    const bucket = activeMediaTab === 'stories' ? 'service-stories' : 'service-gallery';
    const table = activeMediaTab === 'stories' ? 'service_stories' : 'service_gallery_items';
    try {
      const extractPath = (url: string) => {
        const parts = url.split(`/storage/v1/object/public/${bucket}/`);
        return parts.length > 1 ? parts[1] : null;
      };
      const mainPath = extractPath(item.url);
      if (mainPath) await supabase.storage.from(bucket).remove([mainPath]);
      if (item.thumbnail_url) {
        const thumbPath = extractPath(item.thumbnail_url);
        if (thumbPath) await supabase.storage.from(bucket).remove([thumbPath]);
      }
      await supabase.from(table).delete().eq('id', item.id);
      setMediaItems(mediaItems.filter(i => i.id !== item.id));
    } catch (e) { console.error(e); }
    finally { setIsDeletingId(null); }
  };

  const fetchCalendar = async () => {
    setCalendarLoading(true);
    try {
      const res = await getServiceAvailability(service.id);
      if (res.success) {
        setManualAvailability(res.manual || []);
        setBookedDates(res.bookings || []);
      }
    } catch (e) { console.error(e); }
    finally { setCalendarLoading(false); }
  };

  const handleCalendarDayClick = async (day: number) => {
    const mm = String(calendarDate.getMonth() + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${calendarDate.getFullYear()}-${mm}-${dd}`;
    if (bookedDates.includes(dateStr)) {
      alert("Esta fecha está reservada por un contrato confirmado y no se puede desbloquear manualmente.");
      return;
    }
    const currentMatch = manualAvailability.find(m => m.date === dateStr);
    const currentStatus = currentMatch?.status || 'available';
    const nextStatus = currentStatus === 'blocked' ? 'available' : 'blocked';
    try {
      const res = await toggleServiceAvailabilityDate(service.id, dateStr, nextStatus);
      if (res.success) {
        if (nextStatus === 'available') {
          setManualAvailability(manualAvailability.filter(m => m.date !== dateStr));
        } else {
          setManualAvailability([...manualAvailability, { date: dateStr, status: 'blocked' }]);
        }
      } else {
        alert(res.error || "Error al actualizar disponibilidad.");
      }
    } catch (e) { console.error(e); }
  };

  const getCalendarDaysGrid = () => {
    const y = calendarDate.getFullYear();
    const m = calendarDate.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDay = new Date(y, m, 1).getDay();
    const padding = firstDay === 0 ? 6 : firstDay - 1;
    const days: (number | null)[] = [];
    for (let i = 0; i < padding; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  };

  const getDayStatus = (day: number) => {
    const mm = String(calendarDate.getMonth() + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${calendarDate.getFullYear()}-${mm}-${dd}`;
    if (bookedDates.includes(dateStr)) return 'booked';
    const manual = manualAvailability.find(m => m.date === dateStr);
    return manual?.status || 'available';
  };

  const fetchPastEvents = async () => {
    setPastEventsLoading(true);
    try {
      const res = await getServicePastEvents(service.id);
      if (res.success) setPastEvents(res.events || []);
    } catch (e) { console.error(e); }
    finally { setPastEventsLoading(false); }
  };

  const handleAddPastEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventDate) return;
    setIsAddingEvent(true);
    try {
      let finalMediaUrl = '';
      if (eventFile) {
        const ext = eventFile.name.split('.').pop() || 'jpg';
        const path = `${service.id}/events/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('service-gallery').upload(path, eventFile);
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from('service-gallery').getPublicUrl(path);
        finalMediaUrl = publicUrl;
      }
      const res = await createServicePastEvent(service.id, eventTitle, eventDate, eventDesc, finalMediaUrl ? [finalMediaUrl] : []);
      if (res.success) {
        setEventTitle(''); setEventDate(''); setEventDesc(''); setEventFile(null);
        if (eventPreviewUrl) URL.revokeObjectURL(eventPreviewUrl);
        setEventPreviewUrl(null);
        fetchPastEvents();
      } else {
        alert(res.error || "Error al agregar evento.");
      }
    } catch (err: any) {
      alert(err.message || "Error al crear el registro del evento.");
    } finally {
      setIsAddingEvent(false);
    }
  };

  const handleDeletePastEvent = async (id: string) => {
    if (!confirm("¿Eliminar este registro del historial?")) return;
    try {
      const res = await deleteServicePastEvent(id);
      if (res.success) setPastEvents(pastEvents.filter(ev => ev.id !== id));
      else alert(res.error || "Error al eliminar.");
    } catch (e) { console.error(e); }
  };

  const handleSaveProductions = (e: React.FormEvent) => {
    e.preventDefault();
    setProductionsSaved(false);
    startSaveProductions(async () => {
      const res = await updateServiceProductions(service.id, spotifyUrl, soundcloudUrl, youtubeUrl);
      if (res.success) {
        setProductionsSaved(true);
        setTimeout(() => setProductionsSaved(false), 3000);
      } else {
        alert(res.error || "Error al guardar producciones.");
      }
    });
  };

  if (!isOpen) return null;
  if (!mounted) return null;

  const tabs = [
    { id: 'media',       label: 'Historias y Galería',   icon: ImageIcon   },
    { id: 'calendar',    label: 'Disponibilidad',         icon: CalendarIcon },
    { id: 'past_events', label: 'Eventos Realizados',     icon: Sparkles    },
    ...(isArtistOrDj ? [{ id: 'productions', label: 'Producciones', icon: Music }] : []),
  ];
 
  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-md sm:max-w-lg bg-[#0a0a12] border border-white/10 rounded-[24px] shadow-[0_0_80px_rgba(139,92,246,0.25)] flex flex-col max-h-[82vh] overflow-hidden">
        
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/6 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary-600/20 border border-primary-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-white font-outfit truncate">Perfil Profesional</h3>
              <p className="text-[10px] text-zinc-500 truncate">{service.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-white/8 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
 
        {/* ── Tab Bar ────────────────────────────── */}
        <div className="flex bg-black/30 border-b border-white/6 shrink-0 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-3.5 text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border-b-2 justify-center shrink-0 flex-1 ${
                  isActive
                    ? 'text-primary-400 border-primary-500 bg-primary-500/5'
                    : 'text-zinc-500 border-transparent hover:text-white hover:bg-white/3'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Scrollable Content ─────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 scrollbar-hide">

          {/* ══════════════════════════════════════════ */}
          {/* TAB 1: MEDIA (STORIES & GALLERY)           */}
          {/* ══════════════════════════════════════════ */}
          {activeTab === 'media' && (
            <div className="space-y-5">
              {/* Sub-tab toggle */}
              <div className="flex bg-white/4 border border-white/6 rounded-2xl p-1 gap-1">
                {(['stories', 'gallery'] as const).map((sub) => (
                  <button
                    key={sub}
                    onClick={() => { setActiveMediaTab(sub); resetUploadForm(); }}
                    className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                      activeMediaTab === sub
                        ? 'bg-primary-600 text-white shadow-lg'
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    {sub === 'stories' ? 'Historias (Stories)' : 'Galería del Perfil'}
                  </button>
                ))}
              </div>

              {/* Upload Form */}
              <div className="bg-white/[0.025] border border-white/6 rounded-2xl p-5 space-y-5">
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-primary-400" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-zinc-300">
                    Subir {activeMediaTab === 'stories' ? 'Historia' : 'Imagen/Video'}
                  </span>
                  <span className="text-[9px] text-zinc-600 ml-auto">
                    {activeMediaTab === 'stories' ? 'Formato 9:16 · Máx 30s' : 'Máx 90s si es video'}
                  </span>
                </div>

                <form onSubmit={handleMediaUploadSubmit} className="space-y-4">
                  {/* File drop zone */}
                  <label className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
                    selectedFile ? 'border-primary-500/40 bg-primary-950/10 h-40' : 'border-white/10 hover:border-primary-500/30 bg-black/30 h-28'
                  }`}>
                    {selectedFile ? (
                      <div className="w-full h-full relative">
                        {mediaType === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-black/50 gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center">
                              <Film className="w-6 h-6 text-primary-400" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">{selectedFile.name}</p>
                              <p className="text-[10px] text-zinc-400 mt-0.5">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB · Video</p>
                              {thumbnailPreviewUrl && (
                                <p className="text-[10px] text-emerald-400 mt-0.5">✓ Miniatura generada</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <img src={previewUrl!} className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); cleanupPreviews(); }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center z-10 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
                          <UploadCloud className="w-5 h-5 text-zinc-500" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-white">Haz clic para cargar</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">Imagen o Video · Arrastra y suelta</p>
                        </div>
                      </>
                    )}
                    <input type="file" accept="image/*,video/*" onChange={handleFileChange} disabled={isUploading} className="hidden" />
                  </label>

                  {/* Metadata fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">Título (Opcional)</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej. Evento privado en vivo"
                        className="w-full rounded-xl border border-white/8 bg-black/40 px-3 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/40 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">
                        {activeMediaTab === 'stories' ? 'Duración (3-30s)' : 'Orden en galería'}
                      </label>
                      {activeMediaTab === 'stories' ? (
                        <input
                          type="number" min={3} max={30} value={duration}
                          onChange={(e) => setDuration(Math.min(30, Math.max(3, parseInt(e.target.value) || 5)))}
                          className="w-full rounded-xl border border-white/8 bg-black/40 px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      ) : (
                        <input
                          type="number" value={displayOrder}
                          onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                          className="w-full rounded-xl border border-white/8 bg-black/40 px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      )}
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => setIsActive(!isActive)}
                        className={`w-9 h-5 rounded-full border transition-all relative ${
                          isActive ? 'bg-emerald-600 border-emerald-500' : 'bg-zinc-800 border-white/10'
                        }`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isActive ? 'left-4' : 'left-0.5'}`} />
                      </div>
                      <span className="text-xs text-zinc-300">Visible</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => setIsFeatured(!isFeatured)}
                        className={`w-9 h-5 rounded-full border transition-all relative ${
                          isFeatured ? 'bg-amber-600 border-amber-500' : 'bg-zinc-800 border-white/10'
                        }`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isFeatured ? 'left-4' : 'left-0.5'}`} />
                      </div>
                      <span className="text-xs text-zinc-300 flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400" /> Destacado
                      </span>
                    </label>
                  </div>

                  {uploadProgress && (
                    <div className="flex items-center gap-2 text-[10px] text-primary-400 font-bold uppercase tracking-widest animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> {uploadProgress}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isUploading || !selectedFile}
                    className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                    Subir a {activeMediaTab === 'stories' ? 'Historias' : 'Galería'}
                  </button>
                </form>
              </div>

              {/* Media items grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    Contenido Guardado ({mediaItems.length})
                  </span>
                  <button onClick={fetchMedia} className="text-[10px] text-primary-400 hover:text-primary-300 cursor-pointer">Refrescar</button>
                </div>
                {mediaLoading ? (
                  <div className="py-10 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-zinc-700" /></div>
                ) : mediaItems.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-white/8 rounded-2xl">
                    <ImageIcon className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                    <p className="text-xs text-zinc-600">Sin contenido aún en esta sección.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                    {mediaItems.map((item) => {
                      const isVid = item.media_type === 'video';
                      const coverImg = isVid ? (item.thumbnail_url || item.url) : item.url;
                      return (
                        <div
                          key={item.id}
                          className={`relative aspect-[9/16] rounded-xl border overflow-hidden group transition-all ${
                            item.active ? 'border-white/10' : 'border-white/4 opacity-50'
                          }`}
                        >
                          <img src={coverImg} className="absolute inset-0 w-full h-full object-cover brightness-60 group-hover:brightness-75 transition-all" />
                          {/* Top badges */}
                          <div className="relative z-10 flex justify-between items-start p-1.5">
                            <span className="bg-black/70 border border-white/10 px-1.5 py-0.5 rounded text-[7px] font-bold text-white uppercase">
                              {isVid ? 'Video' : 'Foto'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteMediaItem(item)}
                              disabled={isDeletingId === item.id}
                              className="w-5 h-5 rounded bg-red-600/80 hover:bg-red-500 flex items-center justify-center text-white cursor-pointer transition-all"
                            >
                              {isDeletingId === item.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Trash2 className="w-2.5 h-2.5" />}
                            </button>
                          </div>
                          {/* Bottom controls */}
                          <div className="absolute bottom-0 left-0 right-0 z-10 p-1.5 bg-gradient-to-t from-black/80 to-transparent space-y-1">
                            {item.title && <p className="text-[7px] font-bold text-white truncate">{item.title}</p>}
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleActiveField(item.id, 'active', item.active)}
                                className={`flex-1 py-0.5 rounded text-[7px] font-bold uppercase cursor-pointer transition-all ${
                                  item.active ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400'
                                }`}
                              >
                                {item.active ? '✓ ON' : 'OFF'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleActiveField(item.id, 'featured', item.featured)}
                                className={`px-1.5 py-0.5 rounded text-[7px] font-bold cursor-pointer transition-all ${
                                  item.featured ? 'bg-amber-500 text-white' : 'bg-zinc-800 text-zinc-400'
                                }`}
                              >
                                ★
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════ */}
          {/* TAB 2: AVAILABILITY CALENDAR               */}
          {/* ══════════════════════════════════════════ */}
          {activeTab === 'calendar' && (
            <div className="space-y-5">
              {/* Info banner */}
              <div className="flex items-start gap-3 p-4 bg-primary-950/20 border border-primary-500/15 rounded-2xl text-xs text-zinc-400">
                <Info className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Toca una fecha para <strong className="text-white">bloquearla</strong> o desbloquearla. Las fechas en rojo tienen reservas activas y no se pueden alterar.
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 flex-wrap text-[10px] font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/40" /> Disponible</span>
                <span className="flex items-center gap-1.5 text-rose-400"><span className="w-3 h-3 rounded-full bg-rose-500/30 border border-rose-500/40" /> Reservado</span>
                <span className="flex items-center gap-1.5 text-zinc-500"><span className="w-3 h-3 rounded-full bg-zinc-800 border border-white/10" /> Bloqueado</span>
              </div>

              {/* Month Navigator */}
              <div className="flex items-center justify-between">
                <h4 className="font-black text-white font-outfit text-sm">
                  {MONTHS[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                </h4>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {calendarLoading ? (
                <div className="py-12 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-zinc-700" /></div>
              ) : (
                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {['L','M','X','J','V','S','D'].map(d => (
                    <span key={d} className="text-[9px] font-black uppercase text-zinc-600 tracking-wider py-1">{d}</span>
                  ))}
                  {getCalendarDaysGrid().map((day, idx) => {
                    if (day === null) return <div key={`pad-${idx}`} className="aspect-square" />;
                    const status = getDayStatus(day);
                    const today = new Date();
                    const isToday = day === today.getDate() && calendarDate.getMonth() === today.getMonth() && calendarDate.getFullYear() === today.getFullYear();
                    let cls = "bg-emerald-500/5 hover:bg-emerald-500/15 border-emerald-500/15 text-emerald-300 cursor-pointer";
                    if (status === 'booked') cls = "bg-rose-500/10 border-rose-500/20 text-rose-400 cursor-not-allowed";
                    else if (status === 'blocked') cls = "bg-zinc-900/80 border-white/5 text-zinc-600 hover:bg-zinc-800 cursor-pointer line-through decoration-zinc-500";
                    return (
                      <button
                        key={day}
                        onClick={() => handleCalendarDayClick(day)}
                        className={`h-11 sm:h-12 rounded-xl border flex flex-col items-center justify-center text-xs font-black relative transition-all ${cls} ${isToday ? 'ring-1 ring-primary-500 ring-offset-1 ring-offset-black' : ''}`}
                      >
                        {day}
                        <span className={`w-1 h-1 rounded-full absolute bottom-1 ${
                          status === 'available' ? 'bg-emerald-500' :
                          status === 'booked' ? 'bg-rose-500 animate-pulse' : 'bg-zinc-600'
                        }`} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════ */}
          {/* TAB 3: PAST EVENTS                         */}
          {/* ══════════════════════════════════════════ */}
          {activeTab === 'past_events' && (
            <div className="space-y-5">
              {/* Add event form */}
              <div className="bg-white/[0.025] border border-white/6 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary-400" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-zinc-300">Registrar Evento Realizado</span>
                </div>
                <form onSubmit={handleAddPastEvent} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">Nombre del Evento *</label>
                      <input
                        type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)}
                        placeholder="Ej. Boda Campestre Las Palmas"
                        required disabled={isAddingEvent}
                        className="w-full rounded-xl border border-white/8 bg-black/40 px-3 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">Fecha del Evento *</label>
                      <input
                        type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)}
                        required disabled={isAddingEvent}
                        className="w-full rounded-xl border border-white/8 bg-black/40 px-3 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">Breve Resumen</label>
                    <textarea
                      value={eventDesc} onChange={(e) => setEventDesc(e.target.value)}
                      rows={2} disabled={isAddingEvent}
                      placeholder="Describe el montaje, música, o detalles destacados..."
                      className="w-full rounded-xl border border-white/8 bg-black/40 px-3 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Photo upload */}
                  <div className="flex items-center gap-4">
                    {eventPreviewUrl ? (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 shrink-0">
                        <img src={eventPreviewUrl} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => { setEventFile(null); setEventPreviewUrl(null); }}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs cursor-pointer"
                        >✕</button>
                      </div>
                    ) : (
                      <label className="w-16 h-16 bg-black/40 border-2 border-dashed border-white/10 hover:border-primary-500/30 rounded-xl flex flex-col items-center justify-center cursor-pointer shrink-0 transition-colors">
                        <UploadCloud className="w-4 h-4 text-zinc-600" />
                        <span className="text-[7px] text-zinc-600 uppercase mt-1">Foto</span>
                        <input type="file" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) { setEventFile(file); setEventPreviewUrl(URL.createObjectURL(file)); }
                        }} className="hidden" />
                      </label>
                    )}
                    <p className="text-[10px] text-zinc-500 leading-relaxed">Adjunta una foto del evento. Se mostrará en tu historial público.</p>
                  </div>

                  <button
                    type="submit" disabled={isAddingEvent || !eventTitle || !eventDate}
                    className="bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 px-5 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 flex items-center gap-2 cursor-pointer"
                  >
                    {isAddingEvent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Agregar al Historial
                  </button>
                </form>
              </div>

              {/* Past events list */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  Historial Registrado ({pastEvents.length})
                </span>
                {pastEventsLoading ? (
                  <div className="py-10 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-zinc-700" /></div>
                ) : pastEvents.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-white/8 rounded-2xl">
                    <p className="text-xs text-zinc-600">Sin eventos registrados todavía.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pastEvents.map((ev) => (
                      <div key={ev.id} className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-all">
                        {ev.media_urls && ev.media_urls.length > 0 ? (
                          <img src={ev.media_urls[0]} className="w-11 h-11 rounded-xl object-cover border border-white/10 shrink-0" />
                        ) : (
                          <div className="w-11 h-11 bg-zinc-900 border border-white/5 rounded-xl flex items-center justify-center text-lg shrink-0">🎉</div>
                        )}
                        <div className="flex-grow min-w-0">
                          <h5 className="font-bold text-white text-xs font-outfit truncate">{ev.title}</h5>
                          <p className="text-[10px] text-zinc-500">
                            {new Date(ev.event_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          {ev.description && <p className="text-[10px] text-zinc-400 line-clamp-1 italic mt-0.5">{ev.description}</p>}
                        </div>
                        <button
                          onClick={() => handleDeletePastEvent(ev.id)}
                          className="p-2 rounded-xl bg-red-500/8 hover:bg-red-500/20 text-red-500 hover:text-red-400 transition-all cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════ */}
          {/* TAB 4: PRODUCTIONS                         */}
          {/* ══════════════════════════════════════════ */}
          {activeTab === 'productions' && (
            <div className="space-y-5">
              {/* Info */}
              <div className="flex items-start gap-3 p-4 bg-primary-950/20 border border-primary-500/15 rounded-2xl text-xs text-zinc-400">
                <Music className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Agrega tus links de Spotify, SoundCloud y YouTube. Se mostrarán como <strong className="text-white">reproductores interactivos</strong> en tu perfil público.
                </p>
              </div>

              <form onSubmit={handleSaveProductions} className="space-y-4">
                {[
                  { label: 'Spotify', placeholder: 'https://open.spotify.com/playlist/...', value: spotifyUrl, setter: setSpotifyUrl, color: 'text-emerald-400', icon: '🎵' },
                  { label: 'SoundCloud', placeholder: 'https://soundcloud.com/...', value: soundcloudUrl, setter: setSoundcloudUrl, color: 'text-orange-400', icon: '🔊' },
                  { label: 'YouTube', placeholder: 'https://youtube.com/watch?v=...', value: youtubeUrl, setter: setYoutubeUrl, color: 'text-red-400', icon: '▶️' },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider mb-1.5">
                      <span>{field.icon}</span>
                      <span className={field.color}>{field.label}</span>
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                      <input
                        type="url" value={field.value}
                        onChange={(e) => field.setter(e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full rounded-xl border border-white/8 bg-black/40 pl-9 pr-3 py-3 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-primary-500/40 transition-colors"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="submit" disabled={productionsSaving}
                  className={`w-full rounded-xl py-3.5 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                    productionsSaved
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-primary-600 hover:bg-primary-500 text-white'
                  }`}
                >
                  {productionsSaving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                  ) : productionsSaved ? (
                    <><Check className="w-4 h-4" /> ¡Guardado correctamente!</>
                  ) : (
                    <><Check className="w-4 h-4" /> Guardar Producciones</>
                  )}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}
