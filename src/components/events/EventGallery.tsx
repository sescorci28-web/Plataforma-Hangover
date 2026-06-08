"use client";

import { useState, useMemo } from "react";
import { Play, X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GalleryItem {
  id: string;
  url: string;
  media_type: "image" | "video";
  thumbnail_url?: string | null;
  title?: string | null;
  description?: string | null;
  featured?: boolean;
}

interface EventGalleryProps {
  items: GalleryItem[];
}

export function EventGallery({ items = [] }: EventGalleryProps) {
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
  }, [items]);

  const handleOpenLightbox = (index: number) => {
    setActiveItemIndex(index);
  };

  const handleCloseLightbox = () => {
    setActiveItemIndex(null);
  };

  const handleNextItem = () => {
    setActiveItemIndex((prev) => {
      if (prev === null) return null;
      if (prev >= sortedItems.length - 1) return 0;
      return prev + 1;
    });
  };

  const handlePrevItem = () => {
    setActiveItemIndex((prev) => {
      if (prev === null) return null;
      if (prev <= 0) return sortedItems.length - 1;
      return prev - 1;
    });
  };

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 font-outfit">
          🎥 Galería del Evento
        </h4>
        <div className="text-center py-16 border border-dashed border-white/10 bg-zinc-950/20 rounded-[28px] space-y-3 p-6 backdrop-blur-md">
          <div className="max-w-md mx-auto space-y-1">
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider font-outfit">
              🎥 Aún no hay contenido multimedia publicado.
            </p>
            <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
              El organizador del evento podrá publicar fotos y videos exclusivos de la fiesta muy pronto.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 font-outfit">
        🖼️ Galería del Evento
      </h4>

      {/* Grid of gallery items */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {sortedItems.map((item, index) => {
          const isVideo = item.media_type === "video";
          const coverUrl = isVideo ? (item.thumbnail_url || item.url) : item.url;

          return (
            <motion.div
              key={item.id}
              onClick={() => handleOpenLightbox(index)}
              className="relative aspect-[9/16] rounded-2xl overflow-hidden border border-white/5 bg-zinc-950 hover:border-white/15 cursor-pointer group shadow-lg"
              whileHover={{ scale: 1.015 }}
              transition={{ duration: 0.2 }}
            >
              {/* Thumbnail image */}
              <img
                src={coverUrl}
                alt={item.title || "Multimedia del evento"}
                loading="lazy"
                className="w-full h-full object-cover filter brightness-90 group-hover:brightness-100 transition-all duration-300"
              />

              {/* Video Play Indicator */}
              {isVideo && (
                <div className="absolute top-3 left-3 bg-black/60 border border-white/10 px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-wider">
                  <Play className="w-2.5 h-2.5 fill-white" />
                  <span>▶ Video</span>
                </div>
              )}

              {/* Title & Overlay (on hover) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                {item.title && (
                  <h5 className="text-white text-xs font-bold font-outfit truncate">{item.title}</h5>
                )}
                {item.description && (
                  <p className="text-zinc-300 text-[10px] line-clamp-2 leading-relaxed mt-0.5">{item.description}</p>
                )}
              </div>

              {/* Featured Badge */}
              {item.featured && (
                <div className="absolute top-3 right-3 bg-primary-600/95 border border-primary-500/30 px-2 py-0.5 rounded-full text-white text-[8px] font-black uppercase tracking-widest shadow-md">
                  ★ destacado
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Lightbox Slider Modal */}
      <AnimatePresence>
        {activeItemIndex !== null && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            {/* Desktop arrows */}
            <button
              onClick={handlePrevItem}
              className="absolute left-6 hidden md:flex w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 items-center justify-center text-white border border-white/10 transition-all cursor-pointer z-50"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={handleNextItem}
              className="absolute right-6 hidden md:flex w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 items-center justify-center text-white border border-white/10 transition-all cursor-pointer z-50"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Modal Body Container */}
            <div className="relative w-full max-w-md aspect-[9/16] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-between bg-[#050508]">
              {/* Top Bar controls */}
              <div className="absolute top-4 inset-x-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent p-2 rounded-t-xl">
                <div>
                  {sortedItems[activeItemIndex].title ? (
                    <h4 className="text-white text-xs font-bold font-outfit truncate">
                      {sortedItems[activeItemIndex].title}
                    </h4>
                  ) : (
                    <h4 className="text-white text-xs font-bold font-outfit truncate">Multimedia</h4>
                  )}
                  {sortedItems[activeItemIndex].description && (
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                      {sortedItems[activeItemIndex].description}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleCloseLightbox}
                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Main Content (Image or Video) */}
              <div className="flex-grow w-full h-full relative flex items-center justify-center bg-black">
                {sortedItems[activeItemIndex].media_type === "video" ? (
                  <video
                    key={sortedItems[activeItemIndex].id}
                    src={sortedItems[activeItemIndex].url}
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-contain aspect-[9/16]"
                  />
                ) : (
                  <img
                    src={sortedItems[activeItemIndex].url}
                    alt={sortedItems[activeItemIndex].title || "Detalle multimedia"}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/30 pointer-events-none" />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
