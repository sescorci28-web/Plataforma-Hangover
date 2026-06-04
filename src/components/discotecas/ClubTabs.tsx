"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Info, Wine, Settings2, Sparkles, Star } from "lucide-react";

// Local SVG icon to avoid version mismatch in lucide-react
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface MenuItem {
  id: string;
  category: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
}

interface ClubService {
  id: string;
  name: string;
  description: string;
  price: number | null;
}

interface ClubTabsProps {
  clubName: string;
  clubDescription: string | null;
  clubAddress: string | null;
  clubOpeningHours: string | null;
  clubInstagram: string | null;
  menuItems: MenuItem[];
  clubServices: ClubService[];
}

export function ClubTabs({
  clubName,
  clubDescription,
  clubAddress,
  clubOpeningHours,
  clubInstagram,
  menuItems,
  clubServices,
}: ClubTabsProps) {
  const [activeTab, setActiveTab] = useState<"info" | "menu" | "services">("info");

  // Group menu items by category
  const categories = ["Botellas", "Tragos", "Comida", "Sin Alcohol"];
  const groupedMenu = menuItems.reduce((acc, item) => {
    // Normalise category or map custom categories if any
    let cat = item.category;
    if (!categories.includes(cat)) {
      if (cat.toLowerCase().includes("trago") || cat.toLowerCase().includes("coctel")) {
        cat = "Tragos";
      } else if (cat.toLowerCase().includes("comida") || cat.toLowerCase().includes("snack")) {
        cat = "Comida";
      } else if (cat.toLowerCase().includes("alcohol") || cat.toLowerCase().includes("bebida") || cat.toLowerCase().includes("agua")) {
        cat = "Sin Alcohol";
      } else {
        cat = "Botellas"; // fallback
      }
    }
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const hasMenu = menuItems.length > 0;
  const hasServices = clubServices.length > 0;

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-white/5 p-1 bg-black/30 rounded-2xl gap-2 shrink-0 max-w-md">
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
          onClick={() => setActiveTab("menu")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === "menu"
              ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
        >
          <Wine className="w-3.5 h-3.5" />
          Carta / Menú
        </button>
        <button
          onClick={() => setActiveTab("services")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === "services"
              ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          Servicios
        </button>
      </div>

      {/* Tab Contents with animations */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
          {activeTab === "info" && (
            <motion.div
              key="info-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Description */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white font-outfit">Sobre {clubName}</h3>
                <p className="text-zinc-300 text-sm md:text-base leading-relaxed whitespace-pre-line">
                  {clubDescription || "Esta discoteca no cuenta con una descripción detallada en este momento."}
                </p>
              </div>

              {/* Grid cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-5 rounded-2xl border border-white/5 bg-gradient-to-tr from-white/5 to-transparent">
                  <h4 className="font-bold text-white mb-2 text-sm font-outfit">Servicio de Reservas</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Reserva mesas VIP, botellas y accesos rápidos directamente sin comisiones adicionales.
                  </p>
                </div>
                <div className="p-5 rounded-2xl border border-white/5 bg-gradient-to-tr from-white/5 to-transparent">
                  <h4 className="font-bold text-white mb-2 text-sm font-outfit">Seguridad Garantizada</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Acceso seguro con control digital de entradas. Tu diversión está protegida con Hangover.
                  </p>
                </div>
              </div>

              {/* Location details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {clubAddress && (
                  <div className="p-5 rounded-2xl border border-white/5 bg-black/30">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Dirección</p>
                    <div className="flex gap-3">
                      <MapPin className="w-5 h-5 text-accent-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-zinc-300 leading-relaxed">{clubAddress}</p>
                    </div>
                  </div>
                )}

                {clubOpeningHours && (
                  <div className="p-5 rounded-2xl border border-white/5 bg-black/30">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Horario</p>
                    <div className="flex gap-3">
                      <Clock className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-zinc-300 leading-relaxed">{clubOpeningHours}</p>
                    </div>
                  </div>
                )}

                {clubInstagram && (
                  <div className="p-5 rounded-2xl border border-white/5 bg-black/30 sm:col-span-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Redes Sociales</p>
                    <div className="flex gap-3">
                      <InstagramIcon className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
                      <a
                        href={`https://instagram.com/${clubInstagram.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-400 hover:text-primary-300 transition-colors hover:underline font-semibold"
                      >
                        {clubInstagram}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "menu" && (
            <motion.div
              key="menu-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {!hasMenu ? (
                <div className="text-center py-16 border border-white/5 bg-black/20 rounded-2xl">
                  <Wine className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-white mb-1">Carta no disponible</h4>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                    Esta discoteca aún no ha publicado su menú de productos.
                  </p>
                </div>
              ) : (
                categories.map((cat) => {
                  const items = groupedMenu[cat] || [];
                  if (items.length === 0) return null;

                  return (
                    <div key={cat} className="space-y-4">
                      <h4 className="text-xs font-bold text-primary-400 uppercase tracking-widest pl-1 border-l-2 border-primary-500">
                        {cat === "Tragos" ? "Tragos y Cocteles" : cat === "Sin Alcohol" ? "Bebidas Sin Alcohol" : cat}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="glass-card p-4 bg-zinc-950/40 border border-white/5 hover:border-white/10 transition-all rounded-2xl flex gap-4 items-center"
                          >
                            <div className="w-16 h-16 rounded-xl border border-white/10 bg-zinc-900 overflow-hidden shrink-0">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700">
                                  <Wine className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-grow">
                              <h5 className="font-bold text-white text-sm truncate font-outfit">{item.name}</h5>
                              {item.description && (
                                <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5 leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                              <p className="text-xs font-extrabold text-emerald-400 mt-1.5">
                                ${item.price.toLocaleString("es-CO")} COP
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}

          {activeTab === "services" && (
            <motion.div
              key="services-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {!hasServices ? (
                <div className="text-center py-16 border border-white/5 bg-black/20 rounded-2xl">
                  <Settings2 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-white mb-1">Servicios no especificados</h4>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                    Esta discoteca no tiene catálogo de servicios adicionales en el sistema.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clubServices.map((service) => (
                    <div
                      key={service.id}
                      className="p-5 bg-zinc-950/40 border border-white/5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 max-w-xl">
                        <h5 className="font-bold text-white text-sm font-outfit flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                          {service.name}
                        </h5>
                        <p className="text-xs text-zinc-400 leading-relaxed">{service.description}</p>
                      </div>

                      <div className="shrink-0 sm:text-right">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Precio</p>
                        <p className="text-sm font-extrabold text-accent-400 font-outfit mt-0.5">
                          {service.price && Number(service.price) > 0
                            ? `$${Number(service.price).toLocaleString("es-CO")} COP`
                            : "Incluido"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
