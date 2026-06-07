"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2, Grid, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ServiceGalleryProps {
  mainImageUrl: string | null | undefined;
  galleryUrls: string[] | null | undefined;
  serviceTitle: string;
}

export function ServiceGallery({ mainImageUrl, galleryUrls, serviceTitle }: ServiceGalleryProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Combine main image + gallery urls
  const allImages: string[] = [];
  if (mainImageUrl && !mainImageUrl.includes("placeholder")) {
    allImages.push(mainImageUrl);
  }
  if (galleryUrls && Array.isArray(galleryUrls)) {
    galleryUrls.forEach((url) => {
      if (url && url.trim() !== "" && !allImages.includes(url)) {
        allImages.push(url);
      }
    });
  }

  // Fallback if no images are present
  if (allImages.length === 0) {
    return (
      <div className="relative h-64 sm:h-96 w-full bg-gradient-to-tr from-primary-950/40 via-night-lighter to-accent-950/40 rounded-3xl border border-white/5 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:30px_30px]" />
        <div className="text-center space-y-3 relative z-10">
          <Sparkles className="w-12 h-12 text-primary-400/40 mx-auto animate-pulse" />
          <p className="text-zinc-500 text-sm font-medium">Galería sin imágenes cargadas</p>
        </div>
      </div>
    );
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIdx === null) return;
    setActiveIdx((activeIdx - 1 + allImages.length) % allImages.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIdx === null) return;
    setActiveIdx((activeIdx + 1) % allImages.length);
  };

  // Airbnb style grid layouts depending on how many images we have
  const hasMultiple = allImages.length > 1;

  return (
    <div className="space-y-4">
      {/* Gallery Grid */}
      {!hasMultiple ? (
        // Only 1 image
        <div 
          onClick={() => setActiveIdx(0)}
          className="relative h-64 sm:h-96 md:h-[450px] w-full rounded-3xl border border-white/10 overflow-hidden group cursor-pointer"
        >
          <img
            src={allImages[0]}
            alt={serviceTitle}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Maximize2 className="w-8 h-8 text-white filter drop-shadow-md" />
          </div>
        </div>
      ) : (
        // Premium grid of images (Airbnb style)
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-[300px] sm:h-[400px] md:h-[450px] rounded-3xl overflow-hidden border border-white/10 relative">
          {/* Main Photo (Left) */}
          <div 
            onClick={() => setActiveIdx(0)}
            className="md:col-span-2 relative h-full w-full overflow-hidden group cursor-pointer bg-zinc-900"
          >
            <img
              src={allImages[0]}
              alt={`${serviceTitle} - 1`}
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Right Photos (up to 4 more) */}
          <div className="hidden md:grid md:grid-cols-2 md:col-span-2 gap-3 h-full">
            {[1, 2, 3, 4].map((num) => {
              const imgUrl = allImages[num];
              const isLastPlaceholder = num === 4 && allImages.length > 5;
              
              if (!imgUrl) {
                // If we don't have enough images, show beautiful backdrop blur fillers
                return (
                  <div key={num} className="bg-white/3 border border-white/5 rounded-none flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:20px_20px]" />
                    <Sparkles className="w-5 h-5 text-white/5" />
                  </div>
                );
              }

              return (
                <div
                  key={num}
                  onClick={() => setActiveIdx(num)}
                  className="relative h-full w-full overflow-hidden group cursor-pointer bg-zinc-900"
                >
                  <img
                    src={imgUrl}
                    alt={`${serviceTitle} - ${num + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {isLastPlaceholder && (
                      <div className="text-center space-y-1 relative z-10">
                        <Grid className="w-5 h-5 text-white mx-auto" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          +{allImages.length - 4} fotos
                        </span>
                      </div>
                    )}
                  </div>
                  {isLastPlaceholder && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Floating trigger button for mobile / general */}
          <button
            onClick={() => setActiveIdx(0)}
            className="absolute bottom-4 right-4 bg-black/80 hover:bg-black/90 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-lg flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer hover:border-white/20"
          >
            <Grid className="w-4 h-4" />
            Mostrar todas ({allImages.length})
          </button>
        </div>
      )}

      {/* Lightbox / Slider Modal */}
      <AnimatePresence>
        {activeIdx !== null && (
          <div 
            className={`fixed inset-0 z-50 flex flex-col justify-between p-4 sm:p-6 bg-black/98 transition-all ${
              isFullscreen ? "p-0" : ""
            }`}
            onClick={() => setActiveIdx(null)}
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-4 py-4 z-10">
              <span className="text-xs sm:text-sm font-semibold tracking-widest text-zinc-400 uppercase">
                {activeIdx + 1} / {allImages.length}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFullscreen(!isFullscreen);
                  }}
                  className="p-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-4 h-4 sm:w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIdx(null);
                  }}
                  className="p-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4 sm:w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Image Slider Area */}
            <div className="flex-grow flex items-center justify-center relative max-w-5xl mx-auto w-full h-[60vh] sm:h-auto">
              {/* Left Arrow */}
              <button
                onClick={handlePrev}
                className="absolute left-2 sm:left-4 z-20 p-3 rounded-full bg-black/40 border border-white/5 hover:bg-white/10 text-white transition-colors active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Central Image Container */}
              <motion.div 
                key={activeIdx}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className="relative max-h-full max-w-full flex items-center justify-center p-2"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={allImages[activeIdx]}
                  alt={`${serviceTitle} fullscreen ${activeIdx}`}
                  className="max-h-[75vh] sm:max-h-[80vh] max-w-full object-contain rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
                />
              </motion.div>

              {/* Right Arrow */}
              <button
                onClick={handleNext}
                className="absolute right-2 sm:right-4 z-20 p-3 rounded-full bg-black/40 border border-white/5 hover:bg-white/10 text-white transition-colors active:scale-95 cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Lightbox Footer */}
            <div className="text-center w-full py-4 text-xs sm:text-sm text-zinc-500 font-medium z-10 px-4">
              <span>Use las flechas del teclado o los controles de navegación</span>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
