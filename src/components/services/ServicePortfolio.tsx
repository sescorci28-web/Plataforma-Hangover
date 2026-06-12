'use client';

import { useState } from 'react';
import { Play, Maximize2, X, ChevronLeft, ChevronRight, Grid, Film, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GalleryItem {
  id: string;
  url: string;
  media_type: 'image' | 'video';
  thumbnail_url?: string | null;
  title?: string | null;
  description?: string | null;
}

interface ServicePortfolioProps {
  galleryItems: GalleryItem[];
  serviceTitle: string;
}

export function ServicePortfolio({ galleryItems = [], serviceTitle }: ServicePortfolioProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // Filter videos and images, showing videos first
  const videos = galleryItems.filter((item) => item.media_type === 'video');
  const images = galleryItems.filter((item) => item.media_type === 'image');
  const sortedItems = [...videos, ...images];

  if (sortedItems.length === 0) {
    return (
      <div className="bg-zinc-950/40 border border-white/5 p-8 rounded-3xl text-center space-y-3">
        <Film className="w-10 h-10 text-zinc-650 mx-auto animate-pulse" />
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Galería del portafolio vacía</p>
      </div>
    );
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIdx === null) return;
    setActiveIdx((activeIdx - 1 + sortedItems.length) % sortedItems.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIdx === null) return;
    setActiveIdx((activeIdx + 1) % sortedItems.length);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 font-outfit pl-1">
          💼 Portafolio Multimedia
        </h3>
        <p className="text-zinc-400 text-xs mt-1">Conoce muestras del trabajo, sets y presentaciones en vivo de este proveedor.</p>
      </div>

      {/* Grid of portfolio elements (Instagram feed style) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {sortedItems.map((item, index) => {
          const isVideo = item.media_type === 'video';
          const coverUrl = isVideo ? (item.thumbnail_url || item.url) : item.url;

          return (
            <div
              key={item.id}
              onClick={() => setActiveIdx(index)}
              className="relative aspect-[9/16] rounded-2xl border border-white/5 overflow-hidden group cursor-pointer bg-zinc-900 shadow-lg hover:border-primary-500/30 transition-all duration-300"
            >
              <img
                src={coverUrl}
                alt={item.title || serviceTitle}
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
              />

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3.5">
                <span className="self-start bg-black/60 border border-white/15 px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                  {isVideo ? (
                    <>
                      <Film className="w-2.5 h-2.5 text-rose-500" />
                      <span>Video</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-2.5 h-2.5 text-primary-400" />
                      <span>Foto</span>
                    </>
                  )}
                </span>

                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white font-outfit line-clamp-1">
                    {item.title || "Ver elemento"}
                  </h4>
                  {item.description && (
                    <p className="text-[10px] text-zinc-300 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Play indicator overlay for videos on normal state */}
              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none group-hover:opacity-0 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-black/75 border border-white/10 flex items-center justify-center">
                    <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox / Video Player Modal */}
      <AnimatePresence>
        {activeIdx !== null && (
          <div
            className="fixed inset-0 z-55 flex flex-col justify-between p-4 sm:p-6 bg-black/95 backdrop-blur-xl"
            onClick={() => setActiveIdx(null)}
          >
            {/* Header */}
            <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-4 py-2 z-10 shrink-0">
              <span className="text-[10px] sm:text-xs font-bold tracking-widest text-zinc-450 uppercase">
                {activeIdx + 1} / {sortedItems.length} • {sortedItems[activeIdx].media_type === 'video' ? 'DEMO VIDEO' : 'FOTO'}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveIdx(null); }}
                className="p-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 text-zinc-350 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Container */}
            <div className="flex-grow flex items-center justify-center relative max-w-lg mx-auto w-full h-[60vh] sm:h-auto">
              <button
                onClick={handlePrev}
                className="absolute -left-14 z-20 p-2.5 rounded-full bg-black/45 border border-white/5 hover:bg-white/10 text-white transition-all active:scale-95 cursor-pointer hidden sm:flex"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <motion.div
                key={activeIdx}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className="relative max-h-full max-w-full flex items-center justify-center p-2"
                onClick={(e) => e.stopPropagation()}
              >
                {sortedItems[activeIdx].media_type === 'video' ? (
                  <video
                    src={sortedItems[activeIdx].url}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-[70vh] sm:max-h-[75vh] rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-w-full aspect-[9/16] object-cover"
                  />
                ) : (
                  <img
                    src={sortedItems[activeIdx].url}
                    alt={sortedItems[activeIdx].title || serviceTitle}
                    className="max-h-[70vh] sm:max-h-[75vh] rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] object-contain max-w-full"
                  />
                )}
              </motion.div>

              <button
                onClick={handleNext}
                className="absolute -right-14 z-20 p-2.5 rounded-full bg-black/45 border border-white/5 hover:bg-white/10 text-white transition-all active:scale-95 cursor-pointer hidden sm:flex"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Footer */}
            <div className="text-center w-full py-2 text-zinc-500 z-10 px-4 space-y-1">
              {sortedItems[activeIdx].title && (
                <p className="text-sm font-bold text-white font-outfit">{sortedItems[activeIdx].title}</p>
              )}
              {sortedItems[activeIdx].description && (
                <p className="text-xs text-zinc-400 max-w-md mx-auto">{sortedItems[activeIdx].description}</p>
              )}
              <p className="text-[10px] text-zinc-600 pt-1.5 uppercase font-semibold">Toca fuera o usa cerrar para salir</p>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
