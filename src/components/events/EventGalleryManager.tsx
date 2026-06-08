"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Play, Trash2, UploadCloud, Loader2, Sparkles, Plus, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EventGalleryManagerProps {
  eventId: string;
  initialItems: any[];
  onItemsChange: (updatedItems: any[]) => void;
}

export function EventGalleryManager({ eventId, initialItems = [], onItemsChange }: EventGalleryManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<any[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Thumbnail states for videos
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);

  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const cleanupPreviews = () => {
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    if (thumbnailPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(thumbnailPreviewUrl);
    setPreviewUrl(null);
    setThumbnailPreviewUrl(null);
    setSelectedFile(null);
    setThumbnailFile(null);
  };

  const resetForm = () => {
    cleanupPreviews();
    setTitle("");
    setDescription("");
    setDisplayOrder(0);
    setIsActive(true);
    setIsFeatured(false);
    setError(null);
    setSuccessMessage(null);
  };

  // Generate poster thumbnail from video file using canvas
  const generateVideoThumbnail = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.autoplay = false;
      video.muted = true;
      video.playsInline = true;

      const fileUrl = URL.createObjectURL(file);
      video.src = fileUrl;

      video.onloadedmetadata = () => {
        if (video.duration > 90) {
          URL.revokeObjectURL(fileUrl);
          reject(new Error("El video supera la duración máxima permitida de 90 segundos."));
          return;
        }
        video.currentTime = Math.min(1, video.duration / 2);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              if (blob) {
                const thumb = new File([blob], `thumb-${Date.now()}.jpg`, { type: "image/jpeg" });
                URL.revokeObjectURL(fileUrl);
                resolve(thumb);
              } else {
                URL.revokeObjectURL(fileUrl);
                reject(new Error("Error al capturar cuadro de video."));
              }
            }, "image/jpeg", 0.85);
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

    const isVideo = file.type.startsWith("video/");
    setMediaType(isVideo ? "video" : "image");

    if (isVideo && file.size > 25 * 1024 * 1024) {
      setError("⚠️ Video grande detectado (>25MB). Recomendamos comprimir el video para acelerar la reproducción.");
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

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Por favor, selecciona un archivo.");
      return;
    }

    setIsUploading(true);
    setUploadProgress("Subiendo archivo principal...");
    setError(null);

    const bucketName = "event-gallery";
    const isVideo = mediaType === "video";

    try {
      // 1. Upload main media file
      const fileExt = selectedFile.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
      const mainPath = `${eventId}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

      const { error: mainUploadErr } = await supabase.storage
        .from(bucketName)
        .upload(mainPath, selectedFile, { cacheControl: "3600", upsert: true });

      if (mainUploadErr) throw mainUploadErr;

      const { data: { publicUrl: mainUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(mainPath);

      // 2. Upload thumbnail if video
      let finalThumbnailUrl = null;
      if (isVideo && thumbnailFile) {
        setUploadProgress("Subiendo miniatura generada...");
        const thumbPath = `${eventId}/thumbs/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.jpg`;
        const { error: thumbUploadErr } = await supabase.storage
          .from(bucketName)
          .upload(thumbPath, thumbnailFile, { cacheControl: "3600", upsert: true });

        if (thumbUploadErr) throw thumbUploadErr;

        const { data: { publicUrl: thumbUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(thumbPath);

        finalThumbnailUrl = thumbUrl;
      }

      // 3. Save to database table
      setUploadProgress("Guardando metadatos en base de datos...");
      const payload: any = {
        event_id: eventId,
        url: mainUrl,
        media_type: mediaType,
        thumbnail_url: finalThumbnailUrl,
        title: title.trim() || null,
        description: description.trim() || null,
        display_order: Number(displayOrder) || 0,
        active: isActive,
        featured: isFeatured,
      };

      const { data: insertedData, error: dbErr } = await supabase
        .from("event_gallery_items")
        .insert(payload)
        .select()
        .single();

      if (dbErr) throw dbErr;

      setSuccessMessage("¡Elemento subido con éxito!");
      
      const updatedItems = [...items, insertedData].sort((a, b) => a.display_order - b.display_order);
      setItems(updatedItems);
      onItemsChange(updatedItems);

      resetForm();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Ocurrió un error inesperado al subir.");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleToggleField = async (id: string, field: "active" | "featured", currentValue: boolean) => {
    try {
      const { error: updateErr } = await supabase
        .from("event_gallery_items")
        .update({ [field]: !currentValue })
        .eq("id", id);

      if (updateErr) throw updateErr;

      const updated = items.map((item) =>
        item.id === id ? { ...item, [field]: !currentValue } : item
      );
      setItems(updated);
      onItemsChange(updated);
    } catch (err) {
      console.error("Error toggling status:", err);
      alert("No se pudo actualizar el estado.");
    }
  };

  const handleDeleteItem = async (item: any) => {
    if (!confirm("¿Seguro que deseas eliminar este elemento de forma permanente?")) return;

    setIsDeletingId(item.id);
    const bucketName = "event-gallery";

    try {
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

      const { error: dbDeleteErr } = await supabase
        .from("event_gallery_items")
        .delete()
        .eq("id", item.id);

      if (dbDeleteErr) throw dbDeleteErr;

      const filtered = items.filter((i) => i.id !== item.id);
      setItems(filtered);
      onItemsChange(filtered);
      setSuccessMessage("Elemento eliminado de forma permanente.");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Ocurrió un error al eliminar.");
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-outfit">
            Controles de Organizador
          </h3>
          <p className="text-[10px] text-zinc-500 font-semibold uppercase mt-0.5">
            Sube fotos o videos (máx. 90s) verticales 9:16
          </p>
        </div>
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            resetForm();
          }}
          className="inline-flex items-center gap-1 px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-primary-600 hover:bg-primary-500 active:scale-95 text-white rounded-xl cursor-pointer shadow-lg shadow-primary-600/10 transition-all font-outfit"
        >
          {isOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {isOpen ? "Cerrar Gestor" : "Añadir Media"}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 bg-zinc-950/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md">
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

              <form onSubmit={handleUploadSubmit} className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
                {/* Upload Area */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                    1. Multimedia
                  </span>

                  <div className="relative aspect-[9/16] rounded-2xl border-2 border-dashed border-white/10 hover:border-primary-500/50 bg-black/40 overflow-hidden flex flex-col items-center justify-center p-4 transition-all">
                    {previewUrl ? (
                      mediaType === "video" ? (
                        <div className="relative w-full h-full">
                          <video src={previewUrl} className="w-full h-full object-cover" muted playsInline />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <Play className="w-10 h-10 text-white/80 shrink-0" />
                          </div>
                          {thumbnailPreviewUrl && (
                            <div className="absolute bottom-2 right-2 w-12 h-20 border border-white/10 rounded-lg overflow-hidden shadow-lg p-0.5 bg-black">
                              <img src={thumbnailPreviewUrl} className="w-full h-full object-cover rounded-md" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <img src={previewUrl} className="w-full h-full object-cover" />
                      )
                    ) : (
                      <label className="flex flex-col items-center gap-2 cursor-pointer text-center py-8 w-full h-full justify-center">
                        <UploadCloud className="w-8 h-8 text-zinc-500" />
                        <div>
                          <p className="text-[11px] font-bold text-white">Subir Foto o Video</p>
                          <p className="text-[9px] text-zinc-500 mt-1 max-w-[150px] leading-relaxed">
                            Preferiblemente vertical 9:16.
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
                        className="absolute top-2.5 right-2.5 w-6 h-6 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Details Form */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-500">
                      2. Configuración
                    </span>

                    <label className="block text-xs">
                      <span className="mb-1 block font-bold uppercase tracking-wider text-zinc-500 text-[10px]">Título (Opcional)</span>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isUploading}
                        placeholder="Ej. DJ Set en vivo, Show VIP..."
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary-500"
                      />
                    </label>

                    <label className="block text-xs">
                      <span className="mb-1 block font-bold uppercase tracking-wider text-zinc-500 text-[10px]">Descripción (Opcional)</span>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isUploading}
                        rows={2}
                        placeholder="Comenta un poco sobre este momento del evento..."
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary-500"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="block text-xs">
                        <span className="mb-1 block font-bold uppercase tracking-wider text-zinc-500 text-[10px]">Orden de lista</span>
                        <input
                          type="number"
                          value={displayOrder}
                          onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                          disabled={isUploading}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500"
                        />
                      </label>

                      <div className="flex flex-col gap-2 justify-center pt-4">
                        <div className="flex items-center gap-2">
                          <input
                            id="evt-active"
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            disabled={isUploading}
                            className="w-3.5 h-3.5 rounded border-white/10 bg-black/60 accent-primary-500 cursor-pointer"
                          />
                          <label htmlFor="evt-active" className="text-[11px] font-semibold text-zinc-300 cursor-pointer select-none">
                            Visible ahora
                          </label>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            id="evt-featured"
                            type="checkbox"
                            checked={isFeatured}
                            onChange={(e) => setIsFeatured(e.target.checked)}
                            disabled={isUploading}
                            className="w-3.5 h-3.5 rounded border-white/10 bg-black/60 accent-primary-500 cursor-pointer"
                          />
                          <label htmlFor="evt-featured" className="text-[11px] font-semibold text-zinc-300 cursor-pointer select-none flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>Destacar</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    {uploadProgress && (
                      <p className="text-[9px] text-primary-400 font-bold uppercase tracking-wider animate-pulse mb-2">
                        ⏳ {uploadProgress}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isUploading || !selectedFile}
                      className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-primary-600/10 flex items-center justify-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        "Subir a la Galería"
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Items Management Grid */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  Multimedia subida ({items.length})
                </span>

                {items.length === 0 ? (
                  <p className="text-center py-6 text-xs text-zinc-500">No hay fotos ni videos subidos todavía.</p>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                    {items.map((item) => {
                      const isVideo = item.media_type === "video";
                      const cover = isVideo ? (item.thumbnail_url || item.url) : item.url;

                      return (
                        <div
                          key={item.id}
                          className={`relative aspect-[9/16] rounded-xl border bg-black overflow-hidden flex flex-col justify-between group p-1.5 transition-all ${
                            item.active
                              ? "border-white/10 hover:border-white/20"
                              : "border-white/5 opacity-50 saturate-50"
                          }`}
                        >
                          <img src={cover} className="absolute inset-0 w-full h-full object-cover filter brightness-50" />

                          {/* Indicators / Trash */}
                          <div className="relative z-10 flex justify-between items-start gap-1">
                            <span className="bg-black/60 border border-white/15 px-1 rounded text-[7px] font-bold text-white uppercase scale-90 origin-top-left">
                              {isVideo ? "▶ Video" : "Foto"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item)}
                              disabled={isDeletingId === item.id}
                              className="w-5 h-5 bg-red-600/80 hover:bg-red-500 rounded flex items-center justify-center text-white cursor-pointer disabled:opacity-50"
                            >
                              {isDeletingId === item.id ? (
                                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-2.5 h-2.5" />
                              )}
                            </button>
                          </div>

                          {/* Actions */}
                          <div className="relative z-10 space-y-1">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleField(item.id, "active", item.active)}
                                className={`flex-1 py-0.5 rounded text-[7px] font-black uppercase cursor-pointer text-center ${
                                  item.active ? "bg-emerald-600/90 text-white" : "bg-zinc-800 text-zinc-400"
                                }`}
                              >
                                {item.active ? "Activo" : "Oculto"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleField(item.id, "featured", item.featured)}
                                className={`px-1 py-0.5 rounded text-[7px] font-bold cursor-pointer text-center ${
                                  item.featured ? "bg-amber-600/90 text-white" : "bg-zinc-800 text-zinc-400"
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
