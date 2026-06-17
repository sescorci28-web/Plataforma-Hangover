"use client";

import { useState, useRef, useEffect } from "react";
import { Service } from "@/types/database.types";
import { 
  MapPin, Sparkles, Filter, 
  BookOpen, 
  Search, ShieldCheck, ArrowUpDown, Star, Calendar,
  ChevronLeft, ChevronRight, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface ExtendedService extends Service {
  provider: {
    full_name: string | null;
    city: string | null;
  } | null;
  bookingsCount: number;
}

interface ServicesListProps {
  initialServices: ExtendedService[];
  user: any;
}

const CATEGORIES = [
  { id: "all", name: "Todos", icon: "🌐" },
  { id: "music", name: "Música y Shows", icon: "🎵" },
  { id: "sound", name: "Sonido e Iluminación", icon: "🔊" },
  { id: "bar", name: "Bar y Coctelería", icon: "🍸" },
  { id: "media", name: "Foto y Contenido", icon: "📸" },
  { id: "staff", name: "Staff y Personal", icon: "👥" },
  { id: "decor", name: "Decoración", icon: "🎨" },
  { id: "premium", name: "Experiencias VIP", icon: "⭐" },
  { id: "others", name: "Otros Servicios", icon: "📦" }
];

const SUBCATEGORIES_MAP: Record<string, string[]> = {
  music: [
    "DJ para fiesta privada", "DJ para discoteca", "Banda en vivo", "Show de entretenimiento", "Artista invitado", "Karaoke y animación"
  ],
  sound: [
    "Equipo completo de sonido", "Solo iluminación", "Producción técnica", "Show láser", "Pantallas y visuales"
  ],
  bar: [
    "Barra abierta", "Coctelería premium", "Bartender privado", "Barra temática", "Shots y experiencias"
  ],
  media: [
    "Fotografía del evento", "Video profesional", "Contenido para redes", "Cabina de fotos", "Transmisión en vivo"
  ],
  staff: [
    "Meseros", "Anfitrionas", "Seguridad", "Protocolo VIP", "Staff completo"
  ],
  decor: [
    "Decoración completa", "Iluminación decorativa", "Flores y centros", "Temática especial", "Globos y detalles"
  ],
  premium: [
    "Reserva VIP", "Experiencia exclusiva", "Paquete todo incluido", "Sorpresa personalizada"
  ],
  others: [
    "Catering", "Transporte", "Mobiliario", "Logística de evento", "Bodas y eventos sociales"
  ]
};

function normalizeCategory(cat: string): string {
  const c = (cat || "").toLowerCase().trim();
  if (c === "music" || c === "dj" || c.startsWith("dj-") || c.includes("vallenato") || c.includes("mariachi") || c.includes("saxo") || c.includes("violin") || c.includes("banda") || c.includes("show")) {
    return "music";
  }
  if (c === "sound" || c === "luces" || c === "iluminacion" || c === "iluminación") {
    return "sound";
  }
  if (c === "bar" || c === "coctel" || c === "cóctel" || c === "bartender") {
    return "bar";
  }
  if (c === "media" || c === "foto" || c === "video" || c === "fotógrafo" || c === "videógrafo" || c === "drone") {
    return "media";
  }
  if (c === "staff" || c === "security" || c === "seguridad" || c === "mesero" || c === "anfitriona" || c === "hostess") {
    return "staff";
  }
  if (c === "decor" || c === "flores" || c === "globos") {
    return "decor";
  }
  if (c === "premium" || c === "vip") {
    return "premium";
  }
  if (c === "catering" || c === "logistics" || c === "transport" || c === "social" || c === "others" || c === "comida" || c === "transporte" || c === "mobiliario" || c === "bodas") {
    return "others";
  }
  return c;
}

// Smart keyword mapper for subcategory selection to match DB values cleanly
function matchSubcategory(serviceSubcategory: string, selectedSub: string): boolean {
  const sub = serviceSubcategory.toLowerCase();
  const target = selectedSub.toLowerCase();
  
  if (sub.includes(target)) return true;
  
  // Keyword mapping lookup
  // Music y Shows
  if (target === "dj para fiesta privada" || target === "dj para discoteca") {
    return sub.includes("dj");
  }
  if (target === "karaoke y animación") {
    return sub.includes("karaoke") || sub.includes("anim") || sub.includes("maestro");
  }
  if (target === "show de entretenimiento") {
    return sub.includes("show") || sub.includes("humor") || sub.includes("mago") || sub.includes("hora loca") || sub.includes("bailar");
  }
  if (target === "artista invitado") {
    return sub.includes("cantante") || sub.includes("saxo") || sub.includes("violin") || sub.includes("grupo") || sub.includes("mariachi") || sub.includes("banda");
  }
  
  // Sonido e Iluminación
  if (target === "equipo completo de sonido") {
    return sub.includes("sonido") || sub.includes("alquiler");
  }
  if (target === "solo iluminación") {
    return sub.includes("luces") || sub.includes("iluminaci") || sub.includes("cabeza");
  }
  if (target === "pantallas y visuales") {
    return sub.includes("pantalla") || sub.includes("proyect") || sub.includes("audiovisual");
  }
  if (target === "show láser") {
    return sub.includes("láser") || sub.includes("laser") || sub.includes("humo") || sub.includes("co2") || sub.includes("pirotecnia");
  }
  
  // Bar y Coctelería
  if (target === "barra abierta" || target === "coctelería premium" || target === "shots y experiencias") {
    return sub.includes("bar") || sub.includes("bebida") || sub.includes("shot") || sub.includes("coctel") || sub.includes("cóctel");
  }
  if (target === "bartender privado") {
    return sub.includes("bartender") || sub.includes("mixólogo") || sub.includes("mixologo");
  }
  
  // Foto y Contenido
  if (target === "fotografía del evento") {
    return sub.includes("foto");
  }
  if (target === "video profesional") {
    return sub.includes("video") || sub.includes("videógrafo") || sub.includes("videografo") || sub.includes("resumen");
  }
  if (target === "contenido para redes") {
    return sub.includes("drone") || sub.includes("aérea") || sub.includes("aerea");
  }
  if (target === "cabina de fotos") {
    return sub.includes("cabina");
  }
  if (target === "transmisión en vivo") {
    return sub.includes("stream");
  }
  
  // Staff y Personal
  if (target === "meseros") {
    return sub.includes("mesero") || sub.includes("capitán") || sub.includes("capitan");
  }
  if (target === "anfitrionas") {
    return sub.includes("hostess") || sub.includes("recep") || sub.includes("impulsa");
  }
  if (target === "seguridad") {
    return sub.includes("seguridad") || sub.includes("escolta") || sub.includes("control");
  }
  if (target === "protocolo vip") {
    return sub.includes("protocolo");
  }
  if (target === "staff completo") {
    return sub.includes("personal") || sub.includes("auxiliar") || sub.includes("limpieza");
  }
  
  // Decoración
  if (target === "decoración completa") {
    return sub.includes("decor") || sub.includes("ambient");
  }
  if (target === "flores y centros") {
    return sub.includes("flor") || sub.includes("centro");
  }
  if (target === "globos y detalles") {
    return sub.includes("globo") || sub.includes("backing") || sub.includes("photo");
  }
  
  // Experiencias VIP
  if (target === "reserva vip" || target === "experiencia exclusiva" || target === "paquete todo incluido" || target === "sorpresa personalizada") {
    return sub.includes("premium") || sub.includes("lujo") || sub.includes("artista") || sub.includes("celebridad") || sub.includes("influencer");
  }
  
  // Otros Servicios
  if (target === "catering") {
    return sub.includes("catering") || sub.includes("comida") || sub.includes("chef") || sub.includes("postre") || sub.includes("torta") || sub.includes("pasabocas") || sub.includes("fast") || sub.includes("food");
  }
  if (target === "transporte") {
    return sub.includes("transport") || sub.includes("van") || sub.includes("bus") || sub.includes("chofer") || sub.includes("limusina");
  }
  if (target === "mobiliario") {
    return sub.includes("mesa") || sub.includes("silla") || sub.includes("carpa") || sub.includes("lounge") || sub.includes("mobiliario") || sub.includes("vajilla") || sub.includes("menaje") || sub.includes("cristalería");
  }
  if (target === "logística de evento" || target === "bodas y eventos sociales") {
    return sub.includes("wedding") || sub.includes("planner") || sub.includes("quince") || sub.includes("coordinador") || sub.includes("ceremonia") || sub.includes("producción");
  }

  return false;
}

export function ServicesList({ initialServices, user }: ServicesListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Advanced Filter States
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [searchCity, setSearchCity] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  
  // Custom filters
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyAvailableToday, setOnlyAvailableToday] = useState(false);
  const [onlyQuickResponse, setOnlyQuickResponse] = useState(false);
  const [onlyTopRated, setOnlyTopRated] = useState(false);
  
  const [sortBy, setSortBy] = useState("popular");
  const [showFilters, setShowFilters] = useState(false);

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedSubcategory("all");
  };

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === "left" ? -clientWidth * 0.6 : clientWidth * 0.6;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    // Reset scroll position on category switch
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
    const timer = setTimeout(() => {
      checkScroll();
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedCategory]);

  // Handle window resizing to recalculate scroll overflow arrows
  useEffect(() => {
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  // Filter & Sort Logic
  const filteredServices = initialServices
    .filter((s) => {
      // Category Mapping (preserving base categories from database)
      if (selectedCategory !== "all") {
        const serviceCategory = normalizeCategory(s.category);
        if (serviceCategory !== selectedCategory.toLowerCase()) {
          return false;
        }
      }
      // Subcategory mapping filter
      if (selectedSubcategory !== "all") {
        const subName = s.subcategory || s.category || "";
        if (!matchSubcategory(subName, selectedSubcategory)) {
          return false;
        }
      }
      // City search
      if (searchCity.trim() !== "") {
        const baseCityLower = (s.base_city || "").toLowerCase();
        const provCityLower = (s.provider?.city || "").toLowerCase();
        if (!baseCityLower.includes(searchCity.toLowerCase()) && !provCityLower.includes(searchCity.toLowerCase())) {
          return false;
        }
      }
      // Min price
      if (minPrice !== "" && s.price < Number(minPrice)) {
        return false;
      }
      // Max price
      if (maxPrice !== "" && s.price > Number(maxPrice)) {
        return false;
      }
      // Verified status
      if (onlyVerified && !s.verified) {
        return false;
      }
      // Available today
      if (onlyAvailableToday) {
        const isBusy = s.provider_status === "busy" || s.provider_status === "vacation" || s.provider_status === "inactive";
        const isOffline = s.availability_status === "offline" || s.availability_status === "busy";
        if (isBusy || isOffline) return false;
      }
      // Quick response
      if (onlyQuickResponse) {
        const respTime = (s.response_time || "").toLowerCase();
        const isQuick = respTime.includes("menos de 1 hora") || respTime.includes("1 hora") || respTime.includes("inmediata") || respTime.includes("minutos");
        if (!isQuick) return false;
      }
      // Top Rated
      if (onlyTopRated) {
        const rating = Number(s.average_rating) || 5.0;
        if (rating < 4.7) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "popular") {
        const aBookings = (a.completed_bookings_count || 0) + (a.bookingsCount || 0);
        const bBookings = (b.completed_bookings_count || 0) + (b.bookingsCount || 0);
        return bBookings - aBookings;
      }
      if (sortBy === "rating") {
        const aRating = Number(a.average_rating) || 5.0;
        const bRating = Number(b.average_rating) || 5.0;
        return bRating - aRating;
      }
      if (sortBy === "recent") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "price_asc") {
        return a.price - b.price;
      }
      if (sortBy === "price_desc") {
        return b.price - a.price;
      }
      return 0;
    });

  const clearFilters = () => {
    setSearchCity("");
    setMinPrice("");
    setMaxPrice("");
    setOnlyVerified(false);
    setOnlyAvailableToday(false);
    setOnlyQuickResponse(false);
    setOnlyTopRated(false);
    setSelectedCategory("all");
    setSelectedSubcategory("all");
    setSortBy("popular");
  };

  const currentCategoryObj = CATEGORIES.find(c => c.id === selectedCategory);
  const subcategoriesOptions = selectedCategory !== "all" ? SUBCATEGORIES_MAP[selectedCategory] || [] : [];

  return (
    <div className="w-full">
      
      {/* 1. SECCIÓN DE CATEGORÍAS Y SUBCATEGORÍAS */}
      <div className="space-y-6">
        <div className="flex flex-col border-b border-white/5 pb-5 gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 font-extrabold uppercase tracking-widest flex items-center gap-1.5 shrink-0 font-outfit">
              <Filter className="w-4 h-4 text-primary-400" />
              Categorías Principales
            </span>

            {/* Quick advanced toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                showFilters 
                  ? "bg-primary-500/10 border-primary-500/30 text-primary-400" 
                  : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Filtros Avanzados
            </button>
          </div>

          {/* Categories Horizontal Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? "bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-955/20"
                    : "bg-[#0c0c14] border-white/5 text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Subcategorías en una sola fila con scroll horizontal y flechas */}
        {selectedCategory !== "all" && subcategoriesOptions.length > 0 && (
          <div className="space-y-3 pt-2">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block font-outfit pl-1">
              Subcategorías de {currentCategoryObj?.name}
            </span>
            
            <div className="relative flex items-center w-full group">
              {/* Left Gradient Overlay & Arrow */}
              {showLeftArrow && (
                <>
                  <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#05050a] to-transparent z-10 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => scroll("left")}
                    className="absolute left-1.5 z-20 bg-[#0c0c14]/90 hover:bg-zinc-800 border border-white/10 p-2 rounded-full transition-all text-white shadow-lg cursor-pointer flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Horizontal scroll container */}
              <div
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex overflow-x-auto gap-2 py-1.5 px-1 w-full scroll-smooth scrollbar-none"
              >
                <button
                  onClick={() => setSelectedSubcategory("all")}
                  className={`px-4 py-2 rounded-xl text-[11px] font-extrabold uppercase tracking-wide border transition-all cursor-pointer whitespace-nowrap ${
                    selectedSubcategory === "all"
                      ? "bg-primary-600 border-primary-500 text-white shadow-sm"
                      : "bg-[#0c0c14] border-white/5 text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  Ver Todas
                </button>
                {subcategoriesOptions.map((subName) => (
                  <button
                    key={subName}
                    onClick={() => setSelectedSubcategory(subName)}
                    className={`px-4 py-2 rounded-xl text-[11px] font-extrabold uppercase tracking-wide border transition-all cursor-pointer whitespace-nowrap ${
                      selectedSubcategory === subName
                        ? "bg-primary-600 border-primary-500 text-white shadow-sm"
                        : "bg-[#0c0c14] border-white/5 text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {subName}
                  </button>
                ))}
              </div>

              {/* Right Gradient Overlay & Arrow */}
              {showRightArrow && (
                <>
                  <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#05050a] to-transparent z-10 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => scroll("right")}
                    className="absolute right-1.5 z-20 bg-[#0c0c14]/90 hover:bg-zinc-800 border border-white/10 p-2 rounded-full transition-all text-white shadow-lg cursor-pointer flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. FILTROS AVANZADOS (COLLAPSIBLE) */}
      <AnimatePresence>
        {(showFilters || selectedCategory !== "all") && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-[#07070d]/90 border border-white/5 rounded-3xl p-6 space-y-6 mt-10"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 items-end">
              {/* City Search */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 block pl-1">Ciudad</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                  <input
                    type="text"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    placeholder="Ej. Medellín, Barranquilla"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                  />
                </div>
              </div>

              {/* Price bounds */}
              <div className="space-y-1.5 sm:col-span-2 text-left">
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 block pl-1">Rango de Precios</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Mínimo ($)"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                  />
                  <span className="text-zinc-650 text-xs">-</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Máximo ($)"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                  />
                </div>
              </div>

              {/* Sort Option Dropdown */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 block pl-1">Ordenar Por</label>
                <div className="relative">
                  <ArrowUpDown className="absolute left-3.5 top-3 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50 cursor-pointer"
                  >
                    <option value="popular" className="bg-zinc-950 text-white">Más reservados</option>
                    <option value="rating" className="bg-zinc-950 text-white">Mejor calificados</option>
                    <option value="recent" className="bg-zinc-950 text-white">Más recientes</option>
                    <option value="price_asc" className="bg-zinc-950 text-white">Menor precio</option>
                    <option value="price_desc" className="bg-zinc-950 text-white">Mayor precio</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Checkboxes Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/5">
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <label className="text-xs font-semibold text-zinc-450 cursor-pointer flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={onlyVerified}
                    onChange={(e) => setOnlyVerified(e.target.checked)}
                    className="w-4 h-4 rounded border-white/10 bg-black/40 text-primary-600 focus:ring-0 cursor-pointer"
                  />
                  Solo Verificados
                </label>

                <label className="text-xs font-semibold text-zinc-450 cursor-pointer flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={onlyAvailableToday}
                    onChange={(e) => setOnlyAvailableToday(e.target.checked)}
                    className="w-4 h-4 rounded border-white/10 bg-black/40 text-primary-600 focus:ring-0 cursor-pointer"
                  />
                  Disponibles hoy
                </label>

                <label className="text-xs font-semibold text-zinc-450 cursor-pointer flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={onlyQuickResponse}
                    onChange={(e) => setOnlyQuickResponse(e.target.checked)}
                    className="w-4 h-4 rounded border-white/10 bg-black/40 text-primary-600 focus:ring-0 cursor-pointer"
                  />
                  Respuesta rápida (&lt; 1 h)
                </label>

                <label className="text-xs font-semibold text-zinc-450 cursor-pointer flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={onlyTopRated}
                    onChange={(e) => setOnlyTopRated(e.target.checked)}
                    className="w-4 h-4 rounded border-white/10 bg-black/40 text-primary-600 focus:ring-0 cursor-pointer"
                  />
                  Mejor Calificados (&gt; 4.7)
                </label>
              </div>

              <button
                onClick={clearFilters}
                className="text-[10px] uppercase tracking-wider text-rose-400 font-extrabold hover:underline cursor-pointer"
              >
                Limpiar Filtros
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. SECCIÓN DE CARDS */}
      <div className="mt-10">
        {filteredServices.length === 0 ? (
          <div className="glass-card p-12 text-center max-w-xl mx-auto space-y-6 bg-[#07070c]/80 border border-white/5 shadow-2xl rounded-3xl">
            <BookOpen className="w-14 h-14 text-primary-400 mx-auto animate-pulse" />
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white font-outfit">Sé el primero en ofrecer tu servicio</h3>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">
                Aún no hay proveedores en esta categoría. ¿Eres DJ, fotógrafo, bartender o tienes algún servicio para eventos?
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
              <Link 
                href="/register?type=provider" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-black uppercase tracking-wider px-6 py-3.5 rounded-2xl transition-all duration-300 shadow-lg shadow-primary-550/15"
              >
                Publicar mi servicio gratis
              </Link>
              <button 
                onClick={clearFilters}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-black uppercase tracking-wider px-6 py-3.5 rounded-2xl transition-all duration-300"
              >
                Ver otras categorías
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => {
              const displayCity = service.base_city || service.provider?.city || "No especificada";
              const providerName = service.provider?.full_name || "Proveedor Hangover";
              const rating = Number(service.average_rating) || 5.0;

              const normCat = normalizeCategory(service.category);
              let categoryGradient = "from-purple-600 to-indigo-600";
              if (normCat === "bar") categoryGradient = "from-rose-600 to-amber-600";
              if (normCat === "staff") categoryGradient = "from-sky-600 to-teal-600";
              if (normCat === "decor") categoryGradient = "from-fuchsia-600 to-pink-600";
              if (normCat === "premium") categoryGradient = "from-amber-500 to-orange-600";
              if (normCat === "others") categoryGradient = "from-emerald-600 to-lime-600";

              const displaySubcategory = service.subcategory || service.category;

              return (
                <Link 
                  href={`/services/${service.slug || service.id}`}
                  key={service.id} 
                  className="glass-card overflow-hidden hover:border-white/20 transition-all flex flex-col h-full group bg-[#07070c]/90"
                >
                  {/* Image / Gradient Header */}
                  <div className="relative h-48 w-full bg-zinc-950 flex-shrink-0 overflow-hidden">
                    {service.image_url ? (
                      <img
                        src={service.image_url}
                        alt={service.title}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-tr ${categoryGradient} opacity-60 flex items-center justify-center`}>
                        <Sparkles className="w-12 h-12 text-white/30" />
                      </div>
                    )}

                    {/* Badges on overlay image */}
                    <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none">
                      <span className="bg-black/85 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider text-primary-400 capitalize">
                        {displaySubcategory}
                      </span>

                      {service.badge_status && (
                        <span className={`bg-black/80 border border-white/10 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                          service.badge_status === 'top_provider' ? 'text-amber-400' :
                          service.badge_status === 'most_booked' ? 'text-rose-400' : 'text-primary-300'
                        }`}>
                          {service.badge_status === 'top_provider' ? '🏆 Top' :
                           service.badge_status === 'most_booked' ? '🔥 Ventas' : '⭐ Destacado'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span className="truncate max-w-[150px] font-medium flex items-center gap-1">
                          Por {providerName}
                          {service.verified && (
                            <span title="Proveedor Verificado" className="inline-flex">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            </span>
                          )}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                          <MapPin className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                          {displayCity}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-primary-400 transition-colors font-outfit">
                        {service.title}
                      </h3>
                      <p className="text-zinc-400 text-sm line-clamp-3 min-h-[60px] leading-relaxed">
                        {service.description || "Sin descripción proporcionada por el proveedor."}
                      </p>
                    </div>

                    {/* Rating / Booking Stats Row */}
                    <div className="flex items-center gap-3 pt-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1 bg-white/3 border border-white/5 px-2 py-1 rounded-md">
                        <Star className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        {rating.toFixed(1)}
                      </span>
                      <span className="flex items-center gap-1 bg-white/3 border border-white/5 px-2 py-1 rounded-md">
                        <Calendar className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                        {service.completed_bookings_count || service.bookingsCount || 0} reservas
                      </span>
                    </div>

                    {/* Price / Booking Action Footer */}
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-extrabold">Precio desde</p>
                        <p className="text-xl font-extrabold text-emerald-400 font-outfit">
                          ${service.price}
                        </p>
                      </div>

                      <span
                        className="bg-primary-600 group-hover:bg-primary-500 text-white rounded-xl py-2.5 px-4 text-xs font-bold transition-all flex items-center gap-1.5 glow shrink-0 shadow-md font-outfit uppercase tracking-widest"
                      >
                        <Info className="w-3.5 h-3.5" />
                        Más info
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
