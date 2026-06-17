"use client";

import { useState } from "react";
import { Grid, FileText, Calendar as CalendarIcon, MessageSquare, Check, X, Shield, MapPin, AlertCircle, Play, Music, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ServiceGallery } from "./ServiceGallery";
import { ServicePortfolio } from "./ServicePortfolio";
import { ServiceCalendar } from "./ServiceCalendar";
import { ServiceReviewsSection } from "./ServiceReviewsSection";

interface ServiceProfileTabsProps {
  service: any;
  includesArr: string[];
  excludesArr: string[];
  requirementsArr: string[];
  citiesArr: string[];
  galleryUrls: string[];
  hasImages: boolean;
  dbGallery: any[];
  pastEvents: any[];
  reviews: any[];
  user: any;
  eligibleBookingId: string | null;
  manualAvailability: any[];
  bookedDates: string[];
  spotifyEmbedUrl: string | null;
  soundcloudEmbedUrl: string | null;
  youtubeEmbedUrl: string | null;
  videoEmbedUrl: string | null;
}

export function ServiceProfileTabs({
  service,
  includesArr,
  excludesArr,
  requirementsArr,
  citiesArr,
  galleryUrls,
  hasImages,
  dbGallery,
  pastEvents,
  reviews,
  user,
  eligibleBookingId,
  manualAvailability,
  bookedDates,
  spotifyEmbedUrl,
  soundcloudEmbedUrl,
  youtubeEmbedUrl,
  videoEmbedUrl
}: ServiceProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<"media" | "details" | "calendar" | "reviews">("media");

  const tabs = [
    { id: "media" as const, label: "Galería y Sets", icon: Grid },
    { id: "details" as const, label: "Detalles y Requisitos", icon: FileText },
    { id: "calendar" as const, label: "Calendario", icon: CalendarIcon },
    { id: "reviews" as const, label: `Reseñas (${reviews.length})`, icon: MessageSquare },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Tab Selector (Instagram Style) */}
      <div className="flex border-b border-white/10 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer ${
                isActive ? "text-primary-450 font-bold" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-primary-450" : "text-zinc-550"}`} />
              <span>{tab.label}</span>
              
              {isActive && (
                <motion.div
                  layoutId="activeTabLine"
                  className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* TAB 1: MEDIA & SETS */}
            {activeTab === "media" && (
              <div className="space-y-8">
                {/* Visual Airbnb Gallery */}
                {hasImages && (
                  <div className="bg-zinc-900/20 border border-white/5 p-4 rounded-3xl backdrop-blur-xs">
                    <ServiceGallery
                      mainImageUrl={service.image_url}
                      galleryUrls={galleryUrls}
                      serviceTitle={service.title}
                    />
                  </div>
                )}

                {/* Spotify / SoundCloud / Youtube Integrations */}
                {(spotifyEmbedUrl || soundcloudEmbedUrl || youtubeEmbedUrl || videoEmbedUrl) && (
                  <div className="bg-zinc-900/50 border border-white/6 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-md">
                    <div className="flex items-center gap-2 border-b border-white/6 pb-4">
                      <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary-400 to-accent-500" />
                      <div>
                        <h3 className="text-sm font-extrabold text-white uppercase tracking-widest font-outfit flex items-center gap-2">
                          <Music className="w-4 h-4 text-primary-450" /> Producciones, Sets y Demos
                        </h3>
                        <p className="text-zinc-500 text-[10px] mt-0.5">Escucha o mira las presentaciones del proveedor en vivo.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {spotifyEmbedUrl && (
                        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg md:col-span-2">
                          <iframe
                            src={spotifyEmbedUrl}
                            width="100%"
                            height="152"
                            frameBorder="0"
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                            className="bg-transparent"
                          />
                        </div>
                      )}

                      {soundcloudEmbedUrl && (
                        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-zinc-900 md:col-span-2">
                          <iframe
                            width="100%"
                            height="166"
                            scrolling="no"
                            frameBorder="no"
                            allow="autoplay"
                            src={soundcloudEmbedUrl}
                          />
                        </div>
                      )}

                      {youtubeEmbedUrl && (
                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg md:col-span-2">
                          <iframe
                            src={youtubeEmbedUrl}
                            title="YouTube Demo"
                            className="absolute inset-0 w-full h-full border-none"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}

                      {videoEmbedUrl && !youtubeEmbedUrl && (
                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg md:col-span-2">
                          <iframe
                            src={videoEmbedUrl}
                            title="Video Demo"
                            className="absolute inset-0 w-full h-full border-none"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Portfolio items (videos/photos) */}
                {dbGallery.length > 0 && (
                  <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
                    <ServicePortfolio galleryItems={dbGallery} serviceTitle={service.title} />
                  </div>
                )}

                {/* Past Events Grid */}
                {pastEvents.length > 0 && (
                  <div className="bg-zinc-900/50 border border-white/6 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-md">
                    <div className="flex items-center justify-between border-b border-white/6 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary-400 to-accent-500" />
                        <h3 className="text-sm font-extrabold text-white uppercase tracking-widest font-outfit">Historial de Trabajos</h3>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{pastEvents.length} eventos</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pastEvents.map((work: any) => (
                        <div key={work.id} className="bg-zinc-950/60 border border-white/5 rounded-2xl overflow-hidden group hover:border-white/15 transition-all">
                          {work.media_urls && work.media_urls.length > 0 && (
                            <div className="relative h-40 w-full overflow-hidden bg-zinc-900 shrink-0">
                              <img src={work.media_urls[0]} alt={work.title} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-550" />
                            </div>
                          )}
                          <div className="p-4 space-y-2">
                            <div className="flex justify-between items-start gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-white font-outfit truncate">{work.title}</h4>
                              <span className="bg-white/5 border border-white/8 px-2 py-0.5 rounded text-[9px] font-bold text-zinc-500 uppercase shrink-0">
                                {new Date(work.event_date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            </div>
                            {work.description && <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-3">{work.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!hasImages && dbGallery.length === 0 && pastEvents.length === 0 && !spotifyEmbedUrl && !soundcloudEmbedUrl && !youtubeEmbedUrl && (
                  <div className="flex flex-col items-center justify-center text-center p-12 bg-zinc-900/20 border border-white/5 rounded-3xl">
                    <Sparkles className="w-8 h-8 text-zinc-600 mb-3" />
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">No hay material multimedia cargado aún</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SPECIFICATIONS & DETAILS */}
            {activeTab === "details" && (
              <div className="space-y-6">
                {/* Description */}
                <div className="bg-zinc-900/50 border border-white/6 rounded-3xl p-6 sm:p-8 space-y-4 backdrop-blur-md">
                  <div className="flex items-center gap-2 border-b border-white/6 pb-4">
                    <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary-400 to-accent-500" />
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-widest font-outfit">Descripción del Show</h3>
                  </div>
                  <p className="text-zinc-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                    {service.description || "Este proveedor aún no ha escrito una descripción. Contáctalo directamente para conocer más sobre su servicio."}
                  </p>
                  {service.experience && (
                    <div className="pt-4 border-t border-white/5 space-y-2">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Experiencia y Trayectoria</span>
                      <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed whitespace-pre-line">{service.experience}</p>
                    </div>
                  )}
                </div>

                {/* Includes / Excludes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-900/50 border border-white/6 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2">
                      <Check className="w-4 h-4 text-emerald-500" /> ¿Qué incluye el show?
                    </h4>
                    <ul className="space-y-2.5">
                      {includesArr.map((item, idx) => (
                        <li key={idx} className="text-xs text-zinc-350 flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2">
                      <X className="w-4 h-4 text-rose-500" /> No incluye
                    </h4>
                    <ul className="space-y-2.5">
                      {excludesArr.map((item, idx) => (
                        <li key={idx} className="text-xs text-zinc-450 flex items-start gap-2">
                          <X className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Technical Requirements & Coverage */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Requirements */}
                  <div className="bg-zinc-900/50 border border-white/6 rounded-3xl p-6 sm:p-8 space-y-4 backdrop-blur-md">
                    <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-3">
                      <AlertCircle className="w-4 h-4 text-amber-500" /> Requerimientos en el Recinto
                    </h4>
                    <div className="space-y-2.5">
                      {requirementsArr.map((item, idx) => (
                        <div key={idx} className="flex gap-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-zinc-450 hover:bg-white/[0.04] transition-colors">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coverage */}
                  <div className="bg-zinc-900/50 border border-white/6 rounded-3xl p-6 sm:p-8 space-y-4 backdrop-blur-md flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black text-primary-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-3">
                        <MapPin className="w-4 h-4 text-primary-500" /> Zonas de Cobertura
                      </h4>
                      <p className="text-zinc-550 text-[10px] pb-3">Ciudades y municipios donde este proveedor realiza montajes directos.</p>
                      <div className="flex flex-wrap gap-2">
                        {citiesArr.map((city) => (
                          <div
                            key={city}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/8 text-xs font-bold text-zinc-350 hover:bg-white/[0.06] transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5 text-primary-400" />
                            <span>{city}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 text-[11px] text-zinc-500 flex items-start gap-2 bg-white/[0.01] p-3 rounded-2xl">
                      <Shield className="w-4 h-4 text-primary-400 shrink-0" />
                      <span>Todos los servicios y reservas en Hangover están protegidos por nuestra política de cumplimiento del proveedor.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CALENDAR */}
            {activeTab === "calendar" && (
              <div className="bg-zinc-900/20 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md">
                <ServiceCalendar
                  serviceId={service.id}
                  manualAvailability={manualAvailability}
                  bookings={bookedDates}
                />
              </div>
            )}

            {/* TAB 4: REVIEWS */}
            {activeTab === "reviews" && (
              <div className="bg-zinc-900/20 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md">
                <ServiceReviewsSection
                  serviceId={service.id}
                  reviews={reviews}
                  user={user}
                  eligibleBookingId={eligibleBookingId}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
