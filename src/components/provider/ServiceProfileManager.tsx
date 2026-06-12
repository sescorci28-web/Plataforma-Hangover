'use client';

import { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  X, Play, Trash2, UploadCloud, Film, Image as ImageIcon, Loader2, 
  Sparkles, Check, Calendar as CalendarIcon, Music, Disc, Link as LinkIcon, Plus, Info 
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

export function ServiceProfileManager({ service, isOpen, onClose }: ServiceProfileManagerProps) {
  const [activeTab, setActiveTab] = useState<'media' | 'calendar' | 'past_events' | 'productions'>('media');
  
  // Media specific tab
  const [activeMediaTab, setActiveMediaTab] = useState<'stories' | 'gallery'>('stories');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(true);

  // Form states for media upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [duration, setDuration] = useState(5); // default 5s
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

  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'media') fetchMedia();
      if (activeTab === 'calendar') fetchCalendar();
      if (activeTab === 'past_events') fetchPastEvents();
    }
  }, [isOpen, activeTab, activeMediaTab]);

  // Clean previews helper
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

  // 1. MULTIMEDIA UPLOADING OPERATIONS
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

  // Generate thumbnail from video
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
    setUploadProgress("Subiendo archivo principal...");
    const bucket = activeMediaTab === 'stories' ? 'service-stories' : 'service-gallery';
    const isVideo = mediaType === 'video';

    try {
      const fileExt = selectedFile.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
      const mainPath = `${service.id}/${Date.now()}-${Math.random().toString(36).substring(2,7)}.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(mainPath, selectedFile, { cacheControl: '3600', upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl: mainUrl } } = supabase.storage.from(bucket).getPublicUrl(mainPath);

      let finalThumbnailUrl = null;
      if (isVideo && thumbnailFile) {
        setUploadProgress("Subiendo miniatura...");
        const thumbPath = `${service.id}/thumbs/${Date.now()}-${Math.random().toString(36).substring(2,7)}.jpg`;
        const { error: thumbErr } = await supabase.storage
          .from(bucket)
          .upload(thumbPath, thumbnailFile, { cacheControl: '3600', upsert: true });

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

      if (activeMediaTab === 'stories') {
        payload.duration = duration;
      }

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
    } catch (e) {
      console.error(e);
    }
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
      if (mainPath) {
        await supabase.storage.from(bucket).remove([mainPath]);
      }
      if (item.thumbnail_url) {
        const thumbPath = extractPath(item.thumbnail_url);
        if (thumbPath) {
          await supabase.storage.from(bucket).remove([thumbPath]);
        }
      }

      await supabase.from(table).delete().eq('id', item.id);
      setMediaItems(mediaItems.filter(i => i.id !== item.id));
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeletingId(null);
    }
  };

  // 2. AVAILABILITY CALENDAR OPERATIONS
  const fetchCalendar = async () => {
    setCalendarLoading(true);
    try {
      const res = await getServiceAvailability(service.id);
      if (res.success) {
        setManualAvailability(res.manual || []);
        setBookedDates(res.bookings || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleCalendarDayClick = async (day: number) => {
    const formattedMonth = String(calendarDate.getMonth() + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${calendarDate.getFullYear()}-${formattedMonth}-${formattedDay}`;

    // Cannot toggle auto-booked days
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
    } catch (e) {
      console.error(e);
    }
  };

  const getCalendarDaysGrid = () => {
    const y = calendarDate.getFullYear();
    const m = calendarDate.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDay = new Date(y, m, 1).getDay();
    const padding = firstDay === 0 ? 6 : firstDay - 1;

    const days = [];
    for (let i = 0; i < padding; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  };

  const getDayAvailabilityStatus = (day: number) => {
    const formattedMonth = String(calendarDate.getMonth() + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${calendarDate.getFullYear()}-${formattedMonth}-${formattedDay}`;

    if (bookedDates.includes(dateStr)) return 'booked';
    const manual = manualAvailability.find(m => m.date === dateStr);
    return manual?.status || 'available';
  };

  // 3. PAST EVENTS HISTORIAL OPERATIONS
  const fetchPastEvents = async () => {
    setPastEventsLoading(true);
    try {
      const res = await getServicePastEvents(service.id);
      if (res.success) {
        setPastEvents(res.events || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPastEventsLoading(false);
    }
  };

  const handleAddPastEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventDate) return;
    setIsAddingEvent(true);

    try {
      let finalMediaUrl = '';
      if (eventFile) {
        // Upload photo/video to service-gallery bucket under events folder
        const ext = eventFile.name.split('.').pop() || 'jpg';
        const path = `${service.id}/events/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('service-gallery')
          .upload(path, eventFile);
        if (upErr) throw upErr;

        const { data: { publicUrl } } = supabase.storage.from('service-gallery').getPublicUrl(path);
        finalMediaUrl = publicUrl;
      }

      const res = await createServicePastEvent(
        service.id,
        eventTitle,
        eventDate,
        eventDesc,
        finalMediaUrl ? [finalMediaUrl] : []
      );

      if (res.success) {
        setEventTitle('');
        setEventDate('');
        setEventDesc('');
        setEventFile(null);
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
      if (res.success) {
        setPastEvents(pastEvents.filter(ev => ev.id !== id));
      } else {
        alert(res.error || "Error al eliminar.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 4. PRODUCTIONS FORM SAVING
  const handleSaveProductions = (e: React.FormEvent) => {
    e.preventDefault();
    startSaveProductions(async () => {
      const res = await updateServiceProductions(service.id, spotifyUrl, soundcloudUrl, youtubeUrl);
      if (res.success) {
        alert("🎵 ¡Enlaces de producciones actualizados correctamente!");
      } else {
        alert(res.error || "Error al guardar producciones.");
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="glass-card w-full max-w-3xl my-8 overflow-hidden relative border-white/10 bg-zinc-950 shadow-[0_0_60px_rgba(217,70,239,0.15)] rounded-[28px] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white font-outfit truncate">
              Perfil Profesional: {service.title}
            </h3>
            <p className="text-xs text-zinc-400">Personaliza la presentación de tu show público.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-white/5 bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/5 bg-black/25 p-1 gap-1.5 shrink-0 overflow-x-auto scrollbar-hide">
          {[
            { id: 'media', name: 'Historias y Galería', icon: ImageIcon },
            { id: 'calendar', name: 'Calendario', icon: CalendarIcon },
            { id: 'past_events', name: 'Eventos Realizados', icon: Check },
            { id: 'productions', name: 'Producciones/Música', icon: Music },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 px-4 text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center whitespace-nowrap flex items-center justify-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'text-primary-400 border-b-2 border-primary-500 bg-primary-500/5'
                    : 'text-zinc-450 hover:text-white border-b-2 border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content wrapper scrollable */}
        <div className="flex-grow overflow-y-auto p-6 scrollbar-none">

          {/* ============================================== */}
          {/* TAB 1: MEDIA (STORIES & GALLERY) */}
          {/* ============================================== */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              {/* Media Sub-tabs selector */}
              <div className="flex p-0.5 bg-white/3 border border-white/5 rounded-xl gap-1.5 max-w-xs">
                <button
                  type="button"
                  onClick={() => { setActiveMediaTab('stories'); resetUploadForm(); }}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider text-center rounded-lg cursor-pointer ${
                    activeMediaTab === 'stories' ? 'bg-primary-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Historias (Stories)
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveMediaTab('gallery'); resetUploadForm(); }}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider text-center rounded-lg cursor-pointer ${
                    activeMediaTab === 'gallery' ? 'bg-primary-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Galería del Perfil
                </button>
              </div>

              {/* Upload Form */}
              <form onSubmit={handleMediaUploadSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-white/[0.02] border border-white/5 rounded-3xl">
                <div className="flex flex-col gap-2.5">
                  <span className="text-[10px] font-extrabold uppercase text-zinc-500">Subir Contenido (9:16 Recomendado)</span>
                  
                  <div className="relative aspect-[9/16] rounded-2xl border-2 border-dashed border-white/10 hover:border-primary-500/30 bg-black/50 overflow-hidden flex flex-col items-center justify-center p-4">
                    {previewUrl ? (
                      mediaType === 'video' ? (
                        <div className="relative w-full h-full">
                          <video src={previewUrl} className="w-full h-full object-cover" muted playsInline />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Play className="w-12 h-12 text-white/70" />
                          </div>
                          {thumbnailPreviewUrl && (
                            <img src={thumbnailPreviewUrl} className="absolute bottom-3 right-3 w-12 h-20 rounded border border-white/10 object-cover" />
                          )}
                        </div>
                      ) : (
                        <img src={previewUrl} className="w-full h-full object-cover" />
                      )
                    ) : (
                      <label className="flex flex-col items-center gap-3 cursor-pointer text-center justify-center w-full h-full">
                        <UploadCloud className="w-10 h-10 text-zinc-550" />
                        <div>
                          <p className="text-xs font-bold text-white">Cargar Imagen o Video</p>
                          <p className="text-[10px] text-zinc-500 mt-1">Soporta formatos comunes e integra miniatura automática.</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleFileChange}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>
                    )}

                    {previewUrl && (
                      <button
                        type="button"
                        onClick={cleanupPreviews}
                        disabled={isUploading}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <label className="block text-xs">
                      <span className="mb-1 block font-bold uppercase tracking-wider text-zinc-500">Título del contenido (Opcional)</span>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej. Evento privado en vivo"
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-650 focus:outline-none"
                      />
                    </label>

                    <label className="block text-xs">
                      <span className="mb-1 block font-bold uppercase tracking-wider text-zinc-500">Descripción (Opcional)</span>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        placeholder="Describe brevemente este set de fotos/videos..."
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-650 focus:outline-none resize-none font-sans"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="block text-xs">
                        <span className="mb-1 block font-bold uppercase tracking-wider text-zinc-500">Orden de lista</span>
                        <input
                          type="number"
                          value={displayOrder}
                          onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </label>

                      {activeMediaTab === 'stories' && (
                        <label className="block text-xs">
                          <span className="mb-1 block font-bold uppercase tracking-wider text-zinc-500">Duración (segundos)</span>
                          <input
                            type="number"
                            min={3}
                            max={30}
                            value={duration}
                            onChange={(e) => setDuration(Math.min(30, Math.max(3, parseInt(e.target.value) || 5)))}
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                          />
                        </label>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 pt-2.5">
                      <div className="flex items-center gap-2">
                        <input
                          id="svc-media-active"
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="w-4 h-4 rounded border-white/10 bg-black/60 accent-primary-500"
                        />
                        <label htmlFor="svc-media-active" className="text-xs font-semibold text-zinc-300 cursor-pointer">
                          Activo (Visible en el perfil)
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          id="svc-media-featured"
                          type="checkbox"
                          checked={isFeatured}
                          onChange={(e) => setIsFeatured(e.target.checked)}
                          className="w-4 h-4 rounded border-white/10 bg-black/60 accent-primary-500"
                        />
                        <label htmlFor="svc-media-featured" className="text-xs font-semibold text-zinc-300 cursor-pointer flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Destacar contenido
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    {uploadProgress && (
                      <p className="text-[10px] text-primary-400 font-bold uppercase tracking-widest animate-pulse mb-2">
                        ⏳ {uploadProgress}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={isUploading || !selectedFile}
                      className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3.5 text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                    >
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                      Subir a {activeMediaTab === 'stories' ? 'Historias' : 'Galería'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Items List */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Contenido Registrado ({mediaItems.length})</h4>
                {mediaLoading ? (
                  <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-zinc-700" /></div>
                ) : mediaItems.length === 0 ? (
                  <div className="text-center py-8 bg-black/20 border border-white/5 rounded-2xl">
                    <p className="text-xs text-zinc-500">No hay contenido multimedia subido para esta sección.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {mediaItems.map((item) => {
                      const isVid = item.media_type === 'video';
                      const coverImg = isVid ? (item.thumbnail_url || item.url) : item.url;
                      return (
                        <div 
                          key={item.id}
                          className={`relative aspect-[9/16] rounded-xl border bg-black overflow-hidden flex flex-col justify-between p-2 group transition-all ${
                            item.active ? 'border-white/10' : 'border-white/5 opacity-50'
                          }`}
                        >
                          <img src={coverImg} className="absolute inset-0 w-full h-full object-cover brightness-50 group-hover:brightness-60" />
                          <div className="relative z-10 flex justify-between items-start">
                            <span className="bg-black/60 border border-white/15 px-1 py-0.5 rounded text-[7px] font-bold text-white uppercase">
                              {isVid ? '▶ Video' : 'Foto'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteMediaItem(item)}
                              disabled={isDeletingId === item.id}
                              className="w-5.5 h-5.5 rounded-md bg-red-600/80 hover:bg-red-500 flex items-center justify-center text-white cursor-pointer"
                            >
                              {isDeletingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            </button>
                          </div>

                          <div className="relative z-10 space-y-1 mt-auto">
                            {item.title && <p className="text-[8px] font-bold text-white truncate font-outfit">{item.title}</p>}
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleActiveField(item.id, 'active', item.active)}
                                className={`flex-1 py-0.5 rounded text-[8px] font-bold uppercase text-center ${
                                  item.active ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400'
                                }`}
                              >
                                {item.active ? 'Activo' : 'Oculto'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleActiveField(item.id, 'featured', item.featured)}
                                className={`px-1.5 py-0.5 rounded text-[8px] font-bold text-center ${
                                  item.featured ? 'bg-amber-600 text-white' : 'bg-zinc-800 text-zinc-400'
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

          {/* ============================================== */}
          {/* TAB 2: AVAILABILITY CALENDAR */}
          {/* ============================================== */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start gap-2.5 text-xs text-zinc-400">
                <Info className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Haz clic sobre cualquier fecha en la cuadrícula inferior para <strong>Bloquearla</strong> (volverla No disponible en tu calendario) o <strong>Desbloquearla</strong>. Las fechas reservadas por contratos activos (rojo) no se pueden alterar manualmente.
                </p>
              </div>

              {/* Navigator */}
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white font-outfit">
                  {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][calendarDate.getMonth()]} {calendarDate.getFullYear()}
                </h4>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-350 transition-colors cursor-pointer"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-350 transition-colors cursor-pointer"
                  >
                    Siguiente
                  </button>
                </div>
              </div>

              {calendarLoading ? (
                <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-zinc-750" /></div>
              ) : (
                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(lbl => (
                    <span key={lbl} className="text-[9px] font-black uppercase text-zinc-550 tracking-wider py-1">{lbl}</span>
                  ))}
                  {getCalendarDaysGrid().map((day, idx) => {
                    if (day === null) return <div key={`pad-${idx}`} className="aspect-square bg-transparent" />;
                    const status = getDayAvailabilityStatus(day);
                    let dayStyle = "bg-emerald-500/5 hover:bg-emerald-550/10 border-emerald-500/10 text-emerald-400 cursor-pointer";
                    if (status === 'booked') {
                      dayStyle = "bg-rose-500/10 border-rose-500/20 text-rose-455 cursor-not-allowed";
                    } else if (status === 'blocked') {
                      dayStyle = "bg-zinc-900 border-white/5 text-zinc-550 hover:bg-zinc-800 cursor-pointer line-through";
                    }
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleCalendarDayClick(day)}
                        className={`aspect-square rounded-xl border flex flex-col items-center justify-center text-xs font-bold font-sans relative ${dayStyle}`}
                      >
                        <span>{day}</span>
                        <span className={`w-1 h-1 rounded-full absolute bottom-1.5 ${
                          status === 'available' ? 'bg-emerald-500' :
                          status === 'booked' ? 'bg-rose-500 animate-pulse' : 'bg-zinc-500'
                        }`} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============================================== */}
          {/* TAB 3: PAST EVENTS */}
          {/* ============================================== */}
          {activeTab === 'past_events' && (
            <div className="space-y-6">
              {/* Event Adding form */}
              <form onSubmit={handleAddPastEvent} className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                <span className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider block">Registrar Evento Realizado</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block text-xs">
                    <span className="mb-1 block font-bold text-zinc-400">Nombre del Evento</span>
                    <input
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="Ej. Boda Campestre Las Palmas"
                      required
                      disabled={isAddingEvent}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white"
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="mb-1 block font-bold text-zinc-400">Fecha del Evento</span>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                      disabled={isAddingEvent}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white"
                    />
                  </label>
                </div>

                <label className="block text-xs">
                  <span className="mb-1 block font-bold text-zinc-400">Breve Resumen / Detalles</span>
                  <textarea
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    rows={2}
                    placeholder="Describe los detalles del montaje, música, o coctelería ejecutados..."
                    disabled={isAddingEvent}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white resize-none font-sans"
                  />
                </label>

                {/* Cover File Upload */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-zinc-400">Foto del Evento (Opcional)</span>
                  <div className="flex items-center gap-4">
                    {eventPreviewUrl ? (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 shrink-0">
                        <img src={eventPreviewUrl} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => { setEventFile(null); setEventPreviewUrl(null); }}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center text-white"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="w-20 h-20 bg-black/45 border border-dashed border-white/10 hover:border-primary-500/30 rounded-xl flex flex-col items-center justify-center cursor-pointer shrink-0">
                        <UploadCloud className="w-5 h-5 text-zinc-550" />
                        <span className="text-[7px] font-bold text-zinc-500 uppercase mt-1">Subir Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setEventFile(file);
                              setEventPreviewUrl(URL.createObjectURL(file));
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                    <div className="text-zinc-500 text-[10px] max-w-sm">
                      Sube una fotografía de alta calidad mostrando tu trabajo, el público, o el montaje. Se guardará de manera permanente.
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAddingEvent || !eventTitle || !eventDate}
                  className="bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 px-6 text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-lg"
                >
                  {isAddingEvent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Agregar al Historial</span>
                </button>
              </form>

              {/* Past Events list */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Historial Registrado ({pastEvents.length})</h4>
                {pastEventsLoading ? (
                  <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-zinc-750" /></div>
                ) : pastEvents.length === 0 ? (
                  <div className="text-center py-8 bg-black/20 border border-white/5 rounded-2xl">
                    <p className="text-xs text-zinc-500">No hay eventos completados cargados en tu historial público.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pastEvents.map((ev) => (
                      <div key={ev.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl gap-4">
                        <div className="flex items-center gap-3">
                          {ev.media_urls && ev.media_urls.length > 0 ? (
                            <img src={ev.media_urls[0]} className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0" />
                          ) : (
                            <div className="w-12 h-12 bg-zinc-900 border border-white/5 rounded-lg flex items-center justify-center text-zinc-650 font-bold shrink-0">🎉</div>
                          )}
                          <div>
                            <h5 className="font-bold text-white text-xs font-outfit">{ev.title}</h5>
                            <p className="text-[10px] text-zinc-500">{new Date(ev.event_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            {ev.description && <p className="text-[10px] text-zinc-400 mt-1 line-clamp-1 italic">{ev.description}</p>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeletePastEvent(ev.id)}
                          className="p-2 rounded-lg bg-red-600/10 hover:bg-red-500 hover:text-white text-red-400 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================== */}
          {/* TAB 4: PRODUCTIONS / SOUND LINKS */}
          {/* ============================================== */}
          {activeTab === 'productions' && (
            <form onSubmit={handleSaveProductions} className="space-y-5">
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start gap-2.5 text-xs text-zinc-400">
                <Music className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Agrega tus enlaces oficiales de Spotify, SoundCloud y YouTube. En tu perfil público se renderizarán los <strong>reproductores interactivos integrados</strong> para que los clientes puedan oír tu repertorio de música.
                </p>
              </div>

              <div className="space-y-4">
                <label className="block text-xs">
                  <span className="mb-1 block font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Disc className="w-4 h-4 text-emerald-500" /> Spotify URL (Playlist o Set)
                  </span>
                  <input
                    type="url"
                    value={spotifyUrl}
                    onChange={(e) => setSpotifyUrl(e.target.value)}
                    placeholder="Ej. https://open.spotify.com/playlist/37i9dQZF1DXcBWIG36go7r"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-3 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500"
                  />
                </label>

                <label className="block text-xs">
                  <span className="mb-1 block font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Disc className="w-4 h-4 text-orange-500" /> SoundCloud URL (Track o Playlist)
                  </span>
                  <input
                    type="url"
                    value={soundcloudUrl}
                    onChange={(e) => setSoundcloudUrl(e.target.value)}
                    placeholder="Ej. https://soundcloud.com/chistian_official/chistian-live-barranquilla"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-3 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500"
                  />
                </label>

                <label className="block text-xs">
                  <span className="mb-1 block font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-red-500" /> YouTube Video URL (Demo o Set)
                  </span>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="Ej. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-3 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-red-500"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={productionsSaving}
                className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3.5 text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg mt-4"
              >
                {productionsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Guardar Enlaces de Producciones
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
