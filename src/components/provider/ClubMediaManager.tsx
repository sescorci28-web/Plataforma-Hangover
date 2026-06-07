'use client';

import { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Play, Trash2, UploadCloud, Film, Image as ImageIcon, Loader2, Sparkles, Check } from 'lucide-react';

interface ClubMediaManagerProps {
  club: {
    id: string;
    name: string;
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

export function ClubMediaManager({ club, isOpen, onClose }: ClubMediaManagerProps) {
  const [activeManagerTab, setActiveManagerTab] = useState<'stories' | 'gallery'>('stories');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [duration, setDuration] = useState(5); // defaults to 5s for stories

  // Thumbnail states
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);

  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  
  const supabase = createClient();

  // Load items on mount and tab switch
  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen, activeManagerTab]);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const table = activeManagerTab === 'stories' ? 'club_stories' : 'club_gallery_items';
      const { data, error: fetchErr } = await supabase
        .from(table)
        .select('*')
        .eq('club_id', club.id)
        .order('display_order', { ascending: true });

      if (fetchErr) {
        throw fetchErr;
      }
      setItems(data || []);
    } catch (err: any) {
      console.error('Error fetching media items:', err);
      setError('Error al cargar elementos del servidor.');
    } finally {
      setLoading(false);
    }
  };

  const cleanupPreviews = () => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    if (thumbnailPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(thumbnailPreviewUrl);
    setPreviewUrl(null);
    setThumbnailPreviewUrl(null);
    setSelectedFile(null);
    setThumbnailFile(null);
  };

  const resetForm = () => {
    cleanupPreviews();
    setTitle('');
    setDescription('');
    setDisplayOrder(0);
    setIsActive(true);
    setIsFeatured(false);
    setDuration(5);
    setError(null);
    setSuccessMessage(null);
  };

  // Generate poster thumbnail from video file using canvas
  const generateVideoThumbnail = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.autoplay = false;
      video.muted = true;
      video.playsInline = true;
      
      const fileUrl = URL.createObjectURL(file);
      video.src = fileUrl;
      
      video.onloadedmetadata = () => {
        const limit = activeManagerTab === 'stories' ? 30 : 90;
        if (video.duration > limit) {
          URL.revokeObjectURL(fileUrl);
          reject(new Error(`El video supera la duración máxima permitida de ${limit} segundos.`));
          return;
        }
        // Seek to 1s or half duration
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
                reject(new Error("Error al capturar cuadro de video."));
              }
            }, 'image/jpeg', 0.85);
          } else {
            URL.revokeObjectURL(fileUrl);
            reject(new Error("Canvas context context2d not available."));
          }
        } catch (err) {
          URL.revokeObjectURL(fileUrl);
          reject(err);
        }
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(fileUrl);
        reject(new Error("Error cargando metadatos de video."));
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    cleanupPreviews();
    
    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');
    
    // Warning size check (suggestion for H.264 compression)
    if (isVideo && file.size > 15 * 1024 * 1024) {
      setError("⚠️ Video grande detectado (>15MB). Recomendamos comprimir a MP4 (H.264, AAC) antes de subir para ahorrar datos y acelerar la reproducción.");
    }

    try {
      if (isVideo) {
        setUploadProgress("Procesando metadatos y generando miniatura...");
        const thumb = await generateVideoThumbnail(file);
        setThumbnailFile(thumb);
        setThumbnailPreviewUrl(URL.createObjectURL(thumb));
        setUploadProgress(null);
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Error al procesar el archivo seleccionado.");
      cleanupPreviews();
    }
  };

  // Submit media upload to Supabase
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Por favor, selecciona un archivo.");
      return;
    }

    setIsUploading(true);
    setUploadProgress("Subiendo archivo principal...");
    setError(null);

    const bucketName = activeManagerTab === 'stories' ? 'club-stories' : 'club-gallery';
    const isVideo = mediaType === 'video';

    try {
      // 1. Upload main media file
      const fileExt = selectedFile.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
      const mainPath = `${club.id}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      
      const { error: mainUploadErr } = await supabase.storage
        .from(bucketName)
        .upload(mainPath, selectedFile, { cacheControl: '3600', upsert: true });

      if (mainUploadErr) throw mainUploadErr;

      const { data: { publicUrl: mainUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(mainPath);

      // 2. Upload thumbnail if video
      let finalThumbnailUrl = null;
      if (isVideo && thumbnailFile) {
        setUploadProgress("Subiendo miniatura generada...");
        const thumbPath = `${club.id}/thumbs/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.jpg`;
        const { error: thumbUploadErr } = await supabase.storage
          .from(bucketName)
          .upload(thumbPath, thumbnailFile, { cacheControl: '3600', upsert: true });

        if (thumbUploadErr) throw thumbUploadErr;

        const { data: { publicUrl: thumbUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(thumbPath);
        
        finalThumbnailUrl = thumbUrl;
      }

      // 3. Save to database table
      setUploadProgress("Guardando metadatos en base de datos...");
      const table = activeManagerTab === 'stories' ? 'club_stories' : 'club_gallery_items';
      
      const payload: any = {
        club_id: club.id,
        url: mainUrl,
        media_type: mediaType,
        thumbnail_url: finalThumbnailUrl,
        title: title.trim() || null,
        description: description.trim() || null,
        display_order: Number(displayOrder) || 0,
        active: isActive,
        featured: isFeatured,
      };

      if (activeManagerTab === 'stories') {
        payload.duration = Number(duration) || 5;
      }

      const { error: dbErr } = await supabase.from(table).insert(payload);

      if (dbErr) throw dbErr;

      setSuccessMessage(`¡Elemento subido con éxito a ${activeManagerTab === 'stories' ? 'Historias' : 'Galería'}!`);
      resetForm();
      fetchItems();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Ocurrió un error inesperado al subir.");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Toggle active or featured status of existing items
  const handleToggleField = async (id: string, field: 'active' | 'featured', currentValue: boolean) => {
    try {
      const table = activeManagerTab === 'stories' ? 'club_stories' : 'club_gallery_items';
      const { error: updateErr } = await supabase
        .from(table)
        .update({ [field]: !currentValue })
        .eq('id', id);

      if (updateErr) throw updateErr;
      
      setItems(items.map(item => item.id === id ? { ...item, [field]: !currentValue } : item));
    } catch (err) {
      console.error('Error toggling status:', err);
      alert('No se pudo actualizar el estado.');
    }
  };

  // Delete item from storage and database
  const handleDeleteItem = async (item: MediaItem) => {
    if (!confirm('¿Seguro que deseas eliminar este elemento de forma permanente?')) return;
    
    setIsDeletingId(item.id);
    const bucketName = activeManagerTab === 'stories' ? 'club-stories' : 'club-gallery';
    const table = activeManagerTab === 'stories' ? 'club_stories' : 'club_gallery_items';

    try {
      // 1. Try to extract file paths from Supabase urls to delete them from Storage
      const extractPath = (url: string) => {
        const parts = url.split(`/storage/v1/object/public/${bucketName}/`);
        return parts.length > 1 ? parts[1] : null;
      };

      const mainPath = extractPath(item.url);
      if (mainPath) {
        await supabase.storage.from(bucketName).remove([mainPath]);
      }

      if (item.thumbnail_url) {
        const thumbPath = extractPath(item.thumbnail_url);
        if (thumbPath) {
          await supabase.storage.from(bucketName).remove([thumbPath]);
        }
      }

      // 2. Delete from DB
      const { error: dbDeleteErr } = await supabase
        .from(table)
        .delete()
        .eq('id', item.id);

      if (dbDeleteErr) throw dbDeleteErr;

      setItems(items.filter(i => i.id !== item.id));
      setSuccessMessage("Elemento eliminado de forma permanente.");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Ocurrió un error al eliminar.");
    } finally {
      setIsDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="glass-card w-full max-w-3xl my-8 overflow-hidden relative border-white/10 bg-zinc-950 shadow-[0_0_60px_rgba(217,70,239,0.15)] rounded-[28px] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white font-outfit">
              Multimedia de {club.name}
            </h3>
            <p className="text-xs text-zinc-400">Sube y edita videos y fotos verticales 9:16 para la noche.</p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="w-8 h-8 rounded-full border border-white/5 bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-white/5 bg-black/20 p-1 gap-2 shrink-0">
          <button
            onClick={() => {
              setActiveManagerTab('stories');
              resetForm();
            }}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center ${
              activeManagerTab === 'stories'
                ? 'text-primary-400 border-b-2 border-primary-500 bg-primary-500/5'
                : 'text-zinc-400 hover:text-white border-b-2 border-transparent'
            }`}
          >
            📸 Historias (Stories - Max 30s)
          </button>
          <button
            onClick={() => {
              setActiveManagerTab('gallery');
              resetForm();
            }}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center ${
              activeManagerTab === 'gallery'
                ? 'text-primary-400 border-b-2 border-primary-500 bg-primary-500/5'
                : 'text-zinc-400 hover:text-white border-b-2 border-transparent'
            }`}
          >
            🖼️ Galería del Perfil (Max 90s)
          </button>
        </div>

        {/* Body content scrollable */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6 scrollbar-none">
          
          {/* Notifications */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-400 text-xs">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400 text-xs flex justify-between items-center">
              <span>{successMessage}</span>
              <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">✕</button>
            </div>
          )}

          {/* Form to Upload New Media */}
          <form onSubmit={handleUploadSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-white/[0.02] border border-white/5 rounded-3xl">
            {/* Upload Zone */}
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                1. Selecciona Foto o Video
              </span>
              
              <div className="relative aspect-[9/16] rounded-2xl border-2 border-dashed border-white/10 hover:border-primary-500/50 bg-black/40 overflow-hidden flex flex-col items-center justify-center p-4 transition-all">
                {previewUrl ? (
                  mediaType === 'video' ? (
                    <div className="relative w-full h-full">
                      <video src={previewUrl} className="w-full h-full object-cover" muted playsInline />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Play className="w-12 h-12 text-white/80 shrink-0" />
                      </div>
                      {thumbnailPreviewUrl && (
                        <div className="absolute bottom-3 right-3 w-16 h-28 border border-white/10 rounded-lg overflow-hidden shadow-lg p-0.5 bg-black">
                          <img src={thumbnailPreviewUrl} className="w-full h-full object-cover rounded-md" />
                          <span className="absolute bottom-1 inset-x-1 text-[7px] text-center text-zinc-400 bg-black/70 font-semibold uppercase rounded">Portada</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <img src={previewUrl} className="w-full h-full object-cover" />
                  )
                ) : (
                  <label className="flex flex-col items-center gap-3 cursor-pointer text-center py-10 w-full h-full justify-center">
                    <UploadCloud className="w-10 h-10 text-zinc-500 group-hover:text-primary-400" />
                    <div>
                      <p className="text-xs font-bold text-white">Subir Imagen o Video</p>
                      <p className="text-[10px] text-zinc-500 mt-1 max-w-[200px] leading-relaxed">
                        Recomendamos videos MP4 (H.264) verticales 9:16.
                      </p>
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
                    className="absolute top-3 right-3 w-7 h-7 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Metadata form */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="space-y-3.5">
                <span className="block text-[11px] font-black uppercase tracking-wider text-zinc-400">
                  2. Configuración del Contenido
                </span>

                <label className="block text-xs text-zinc-300">
                  <span className="mb-1 block font-bold uppercase tracking-wider text-zinc-500">Título (Opcional)</span>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isUploading}
                    placeholder="Ej. Fiesta de Anoche, Zona VIP, DJ ..."
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary-500 focus:bg-zinc-950"
                  />
                </label>

                <label className="block text-xs text-zinc-300">
                  <span className="mb-1 block font-bold uppercase tracking-wider text-zinc-500">Descripción (Opcional)</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isUploading}
                    rows={2}
                    placeholder="Detalla qué está ocurriendo en el contenido multimedia..."
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary-500 focus:bg-zinc-950"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs text-zinc-300">
                    <span className="mb-1 block font-bold uppercase tracking-wider text-zinc-500">Orden de lista</span>
                    <input
                      type="number"
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                      disabled={isUploading}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500 focus:bg-zinc-950"
                    />
                  </label>

                  {activeManagerTab === 'stories' && (
                    <label className="block text-xs text-zinc-300">
                      <span className="mb-1 block font-bold uppercase tracking-wider text-zinc-500">Duración (segundos)</span>
                      <input
                        type="number"
                        min={3}
                        max={30}
                        value={duration}
                        onChange={(e) => setDuration(Math.min(30, Math.max(3, parseInt(e.target.value) || 5)))}
                        disabled={isUploading}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500 focus:bg-zinc-950"
                      />
                    </label>
                  )}
                </div>

                <div className="flex flex-col gap-3.5 pt-2">
                  <div className="flex items-center gap-2.5">
                    <input
                      id="item-active"
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      disabled={isUploading}
                      className="w-4 h-4 rounded border-white/10 bg-black/60 accent-primary-500 text-primary-600 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="item-active" className="text-xs font-semibold text-zinc-300 cursor-pointer select-none">
                      Marcar como activo (Visible ahora)
                    </label>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <input
                      id="item-featured"
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      disabled={isUploading}
                      className="w-4 h-4 rounded border-white/10 bg-black/60 accent-primary-500 text-primary-600 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="item-featured" className="text-xs font-semibold text-zinc-300 cursor-pointer select-none flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Destacar este contenido</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                {uploadProgress && (
                  <p className="text-[10px] text-primary-400 font-bold uppercase tracking-wider animate-pulse">
                    ⏳ {uploadProgress}
                  </p>
                )}
                
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3.5 text-xs font-bold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-lg shadow-primary-500/10 flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      Subir a {activeManagerTab === 'stories' ? 'Historias' : 'Galería'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* List of Existing Media Items */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Contenido Actual ({items.length})
            </h4>

            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-10 border border-white/5 bg-black/20 rounded-2xl">
                <p className="text-xs text-zinc-500">No hay contenido configurado aún.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {items.map((item) => {
                  const isVideo = item.media_type === 'video';
                  const cover = isVideo ? (item.thumbnail_url || item.url) : item.url;
                  
                  return (
                    <div
                      key={item.id}
                      className={`relative aspect-[9/16] rounded-xl border bg-black overflow-hidden flex flex-col justify-between group p-2 transition-all ${
                        item.active 
                          ? 'border-white/10 hover:border-white/20' 
                          : 'border-white/5 opacity-55 saturate-50'
                      }`}
                    >
                      <img src={cover} className="absolute inset-0 w-full h-full object-cover filter brightness-50 group-hover:brightness-60 transition-all" />

                      {/* Header indicators */}
                      <div className="relative z-10 flex justify-between items-start gap-1">
                        <div className="flex flex-col gap-1.5">
                          {isVideo ? (
                            <span className="bg-black/60 border border-white/15 px-1.5 py-0.5 rounded text-[8px] font-bold text-white flex items-center gap-0.5">
                              <Play className="w-2 h-2 fill-white" />
                              <span>▶ Video</span>
                            </span>
                          ) : (
                            <span className="bg-black/60 border border-white/15 px-1.5 py-0.5 rounded text-[8px] font-bold text-zinc-400 uppercase">Foto</span>
                          )}
                          
                          {item.featured && (
                            <span className="bg-amber-500/20 border border-amber-500/30 px-1 py-0.2 rounded text-[7px] text-amber-300 font-bold uppercase tracking-wider">★</span>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteItem(item)}
                          disabled={isDeletingId === item.id}
                          className="w-6 h-6 bg-red-600/80 hover:bg-red-500 rounded-lg flex items-center justify-center text-white transition-colors cursor-pointer disabled:opacity-50 relative z-20"
                          title="Eliminar elemento"
                        >
                          {isDeletingId === item.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      {/* Footer info/controls */}
                      <div className="relative z-10 space-y-1.5">
                        {item.title && (
                          <p className="text-[9px] font-bold text-white truncate font-outfit">{item.title}</p>
                        )}
                        <p className="text-[8px] text-zinc-400 font-semibold uppercase">Orden: {item.display_order}</p>

                        <div className="flex gap-1.5 pt-1 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => handleToggleField(item.id, 'active', item.active)}
                            className={`flex-1 py-0.5 rounded text-[8px] font-bold uppercase cursor-pointer transition-colors text-center ${
                              item.active ? 'bg-emerald-600/90 text-white' : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {item.active ? 'Activo' : 'Oculto'}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleToggleField(item.id, 'featured', item.featured)}
                            className={`px-1.5 py-0.5 rounded text-[8px] font-bold cursor-pointer transition-colors text-center ${
                              item.featured ? 'bg-amber-600/90 text-white' : 'bg-zinc-800 text-zinc-400'
                            }`}
                            title="Destacar"
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
      </div>
    </div>
  );
}
