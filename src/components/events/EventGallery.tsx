"use client";

import { useState, useMemo, useEffect } from "react";
import { Play, X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Close lightbox on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseLightbox();
      }
    };
    if (activeItemIndex !== null) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeItemIndex]);

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
                  <p className="text-zinc-350 text-[10px] line-clamp-2 leading-relaxed mt-0.5">{item.description}</p>
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
        {isMounted && activeItemIndex !== null && (
          createPortal(
            <div 
              className="fixed inset-0 z-[9999] bg-black/92 backdrop-blur-md flex items-center justify-center p-4 md:p-8 cursor-zoom-out"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  handleCloseLightbox();
                }
              }}
            >
              {/* Close Button: Placed at top-right of the screen */}
              <button
                onClick={handleCloseLightbox}
                className="fixed top-4 right-4 z-[10000] w-10 h-10 rounded-full bg-black/60 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105 shadow-xl"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Instagram-style Modal Card Container */}
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="w-full max-w-5xl h-[85vh] max-h-[780px] flex flex-col md:flex-row bg-[#08080d] border border-white/10 rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Left Column: Media Viewer */}
                <div className="relative flex-grow bg-black flex items-center justify-center min-h-[40vh] md:min-h-0 h-[50vh] md:h-full select-none">
                  {/* Media Element */}
                  <div className="max-w-full max-h-full aspect-auto flex items-center justify-center relative select-none">
                    {sortedItems[activeItemIndex].media_type === "video" ? (
                      <video
                        key={sortedItems[activeItemIndex].id}
                        src={sortedItems[activeItemIndex].url}
                        controls
                        autoPlay
                        loop
                        className="max-w-full max-h-[48vh] md:max-h-[82vh] object-contain shadow-2xl"
                      />
                    ) : (
                      <img
                        src={sortedItems[activeItemIndex].url}
                        alt={sortedItems[activeItemIndex].title || "Detalle multimedia"}
                        className="max-w-full max-h-[48vh] md:max-h-[82vh] object-contain shadow-2xl pointer-events-none"
                      />
                    )}
                  </div>

                  {/* Navigation Chevrons inside the viewer */}
                  {sortedItems.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevItem}
                        className="absolute left-4 w-10 h-10 rounded-full bg-black/60 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleNextItem}
                        className="absolute right-4 w-10 h-10 rounded-full bg-black/60 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Right Column: Sidebar (Metadata / Info) */}
                <div className="w-full md:w-[380px] lg:w-[400px] bg-[#0c0c14] border-t md:border-t-0 md:border-l border-white/5 flex flex-col h-[35vh] md:h-full shrink-0 justify-between p-6">
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-650 flex items-center justify-center text-white font-extrabold text-sm uppercase">
                        📸
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white text-xs font-outfit uppercase tracking-widest">
                          Galería Oficial
                        </h4>
                        <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-wider">
                          Contenido del Organizador
                        </span>
                      </div>
                    </div>

                    {/* Metadata Content */}
                    <div className="space-y-4">
                      {sortedItems[activeItemIndex].title ? (
                        <h3 className="text-white text-base font-black font-outfit leading-tight">
                          {sortedItems[activeItemIndex].title}
                        </h3>
                      ) : (
                        <h3 className="text-zinc-500 text-sm font-bold uppercase italic font-outfit">
                          Sin título
                        </h3>
                      )}
                      
                      {sortedItems[activeItemIndex].description ? (
                        <p className="text-xs text-zinc-400 leading-relaxed bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                          {sortedItems[activeItemIndex].description}
                        </p>
                      ) : (
                        <p className="text-xs text-zinc-600 italic leading-relaxed bg-white/[0.01] border border-dashed border-white/5 rounded-2xl p-4 text-center">
                          Sin descripción adicional.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Sidebar Footer info */}
                  <div className="pt-4 border-t border-white/5 text-[10px] text-zinc-500 flex justify-between items-center">
                    <span>Elemento {activeItemIndex + 1} de {sortedItems.length}</span>
                    {sortedItems[activeItemIndex].featured && (
                      <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold uppercase tracking-widest px-2 py-0.5 rounded text-[8px]">
                        ★ destacado
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>,
            document.body
          )
        )}
      </AnimatePresence>
    </div>
  );
}
