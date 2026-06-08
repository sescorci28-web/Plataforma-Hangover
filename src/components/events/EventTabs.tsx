"use client";

import { useState, useEffect } from "react";
import { Info, Users, Clock, Shirt, ShieldAlert, MapPin, Navigation, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CommunityTab } from "@/components/connect/CommunityTab";
import { EventGallery } from "@/components/events/EventGallery";
import { EventGalleryManager } from "@/components/events/EventGalleryManager";

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
  creatorId
}: EventTabsProps) {
  const [activeTab, setActiveTab] = useState<"info" | "gallery" | "community">("info");
  const [gallery, setGallery] = useState(galleryItems);

  useEffect(() => {
    if (galleryItems) {
      setGallery(galleryItems);
    }
  }, [galleryItems]);

  // Google Maps URL
  const mapsSearchQuery = encodeURIComponent(eventLocation);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsSearchQuery}`;

  return (
    <div className="space-y-6">
      {/* Navigation Tabs Header */}
      <div className="flex p-1 bg-black/30 rounded-2xl gap-2 shrink-0 w-full sm:max-w-lg border border-white/5">
        <button
          onClick={() => setActiveTab("info")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === "info"
              ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          Información
        </button>
        <button
          onClick={() => setActiveTab("gallery")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === "gallery"
              ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Galería
        </button>
        <button
          onClick={() => setActiveTab("community")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === "community"
              ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Comunidad
        </button>
      </div>

      {/* Tab Contents */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
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
                  <h2 className="text-lg font-bold text-white font-outfit uppercase tracking-widest text-primary-400">Sobre este evento</h2>
                  <p className="text-zinc-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                    {eventDescription || "Disfruta de la mejor atmósfera musical y producción de vanguardia. Prepárate para una noche inolvidable en compañía del line-up de primer nivel y servicios VIP exclusivos."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-white/5">
                  <div className="flex gap-3.5 p-4 rounded-2xl bg-[#09090f]/75 border border-white/5">
                    <Clock className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
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
                      <p className="text-zinc-500 font-bold uppercase tracking-wider">Código de Vestimenta</p>
                      <p className="font-semibold text-zinc-200 mt-0.5">{dressCode}</p>
                    </div>
                  </div>

                  <div className="flex gap-3.5 p-4 rounded-2xl bg-[#09090f]/75 border border-white/5">
                    <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="text-zinc-500 font-bold uppercase tracking-wider">Restricción de Edad</p>
                      <p className="font-semibold text-zinc-200 mt-0.5">{minAge}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Location Card */}
              <div className="bg-zinc-950/40 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6">
                <h2 className="text-lg font-bold text-white font-outfit uppercase tracking-widest text-primary-400">Ubicación del Evento</h2>
                
                {/* Map visual card mockup */}
                <div className="h-48 w-full rounded-2xl border border-white/10 relative overflow-hidden bg-[#09090f] flex items-center justify-center">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:20px_20px]" />
                  <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-primary-500/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                  
                  <div className="absolute h-1 w-full bg-white/10 top-1/3 left-0" />
                  <div className="absolute h-1 w-full bg-white/10 top-2/3 left-0" />
                  <div className="absolute w-1 h-full bg-white/10 left-1/4 top-0" />
                  <div className="absolute w-1 h-full bg-white/10 left-3/4 top-0" />

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center animate-bounce shadow-[0_0_20px_rgba(244,63,94,0.6)]">
                      <MapPin className="w-5 h-5 text-rose-400" />
                    </div>
                    <span className="mt-2 bg-black/85 border border-white/15 px-3 py-1 rounded-lg text-[10px] font-bold text-zinc-300">
                      {eventLocation}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Dirección</p>
                    <p className="text-sm font-semibold text-zinc-200">{eventLocation}</p>
                  </div>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold text-xs transition-colors shrink-0 cursor-pointer shadow-lg"
                  >
                    <Navigation className="w-4 h-4 shrink-0" />
                    Ver en Google Maps
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "gallery" && (
            <motion.div
              key="event-gallery-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {currentUser && creatorId && currentUser.id === creatorId && (
                <EventGalleryManager
                  eventId={eventId}
                  initialItems={gallery}
                  onItemsChange={setGallery}
                />
              )}
              <EventGallery items={gallery.filter((item: any) => item.active)} />
            </motion.div>
          )}

          {activeTab === "community" && (
            <motion.div
              key="event-community-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <CommunityTab
                eventId={eventId}
                hasAccess={hasConnectAccess}
                bookingId={connectBookingId}
                currentUser={currentUser}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
