"use client";

import { useState, useTransition } from "react";
import { createServiceBooking } from "@/app/services/actions";
import { Service } from "@/types/database.types";
import { 
  Calendar, Clock, DollarSign, MapPin, Sparkles, Filter, X, 
  ArrowRight, Loader2, CheckCircle2, AlertTriangle, BookOpen, 
  Search, ShieldCheck, ArrowUpDown, Award, Flame, Star, Zap, Eye
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
  { id: "music", name: "Música y Entretenimiento", icon: "🎵" },
  { id: "sound", name: "Sonido e Iluminación", icon: "🔊" },
  { id: "bar", name: "Bar y Bebidas", icon: "🍸" },
  { id: "catering", name: "Catering y Comida", icon: "🍽️" },
  { id: "decor", name: "Decoración y Ambientación", icon: "🎈" },
  { id: "logistics", name: "Mobiliario y Logística", icon: "🪑" },
  { id: "staff", name: "Personal de Servicio", icon: "👨‍🍳" },
  { id: "security", name: "Seguridad", icon: "🛡️" },
  { id: "media", name: "Foto y Video", icon: "📸" },
  { id: "transport", name: "Transporte", icon: "🚗" },
  { id: "social", name: "Bodas y Eventos Sociales", icon: "💍" },
  { id: "premium", name: "Experiencias Premium", icon: "⭐" }
];

const SUBCATEGORIES_MAP: Record<string, string[]> = {
  music: [
    "DJ", "DJ Premium", "DJ Internacional", "Banda en vivo", "Grupo vallenato",
    "Grupo tropical", "Mariachis", "Saxofonista", "Violinista", "Cantante",
    "Animador", "Maestro de ceremonia", "Hora loca", "Bailarinas", "Show de baile",
    "Humoristas", "Magos", "Personajes temáticos"
  ],
  sound: [
    "Alquiler de sonido", "Sonido profesional", "Tarimas", "Luces inteligentes",
    "Cabezas móviles", "Pantallas LED", "Proyección audiovisual", "Micrófonos",
    "Producción técnica", "Máquina de humo", "Máquina de CO2", "Pirotecnia fría",
    "Show láser"
  ],
  bar: [
    "Bartender", "Bartender Premium", "Mixólogo", "Bar móvil", "Barra temática",
    "Estación de shots", "Estación de cócteles", "Servicio de bebidas"
  ],
  catering: [
    "Catering para fiestas", "Catering premium", "Chef privado", "Parrillero",
    "Pasabocas", "Comida rápida", "Food Truck", "Mesa de postres", "Repostería",
    "Tortas personalizadas"
  ],
  decor: [
    "Decoración temática", "Decoración de bodas", "Decoración de 15 Años",
    "Decoración de Cumpleaños", "Globos", "Flores", "Arreglos florales",
    "Backings", "Photocalls", "Centros de mesa", "Ambientación premium"
  ],
  logistics: [
    "Alquiler de mesas", "Alquiler de sillas", "Alquiler de carpas", "Salas lounge",
    "Mobiliario premium", "Cristalería", "Vajilla", "Mantelería", "Menaje"
  ],
  staff: [
    "Meseros", "Meseros VIP", "Capitanes de mesa", "Hostess", "Recepcionistas",
    "Impulsadoras", "Protocolo", "Personal de limpieza", "Auxiliares logísticos"
  ],
  security: [
    "Seguridad privada", "Control de acceso", "Logística de eventos",
    "Seguridad VIP", "Escoltas"
  ],
  media: [
    "Fotógrafo", "Fotografía profesional", "Fotografía aérea", "Videógrafo",
    "Drone", "Streaming", "Cabina fotográfica", "Video resumen"
  ],
  transport: [
    "Vans", "Buses", "Transporte VIP", "Chofer privado", "Limusinas"
  ],
  social: [
    "Wedding Planner", "Quinceaños Planner", "Cumpleaños Planner",
    "Coordinador de eventos sociales", "Maestro de ceremonia social",
    "Producción de eventos sociales"
  ],
  premium: [
    "Artistas famosos", "Influencers", "Celebridades", "DJs internacionales",
    "Producción integral", "Eventos de lujo"
  ]
};

export function ServicesList({ initialServices, user }: ServicesListProps) {
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

  // Booking Modal States (Preserved original code for backward compatibility)
  const [bookingService, setBookingService] = useState<ExtendedService | null>(null);
  const [eventDate, setEventDate] = useState("");
  const [notes, setNotes] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedSubcategory("all");
  };

  // Filter & Sort Logic
  const filteredServices = initialServices
    .filter((s) => {
      // Category (fallback check using category column or category_id relation)
      if (selectedCategory !== "all") {
        const catMatch = s.category?.toLowerCase() === selectedCategory.toLowerCase();
        if (!catMatch) return false;
      }
      // Subcategory (checks custom subcategory text)
      if (selectedSubcategory !== "all") {
        const subName = (s.subcategory || "").toLowerCase();
        if (!subName.includes(selectedSubcategory.toLowerCase())) {
          return false;
        }
      }
      // City search (checks base_city or provider city)
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
      // Available today (operational status is active/available and provider is not on vacation/busy/offline)
      if (onlyAvailableToday) {
        const isBusy = s.provider_status === "busy" || s.provider_status === "vacation" || s.provider_status === "inactive";
        const isOffline = s.availability_status === "offline" || s.availability_status === "busy";
        if (isBusy || isOffline) return false;
      }
      // Quick response (response_time is less than 1 hour or immediate)
      if (onlyQuickResponse) {
        const respTime = (s.response_time || "").toLowerCase();
        const isQuick = respTime.includes("menos de 1 hora") || respTime.includes("1 hora") || respTime.includes("inmediata") || respTime.includes("minutos");
        if (!isQuick) return false;
      }
      // Top Rated (average rating >= 4.7)
      if (onlyTopRated) {
        const rating = Number(s.average_rating) || 5.0;
        if (rating < 4.7) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "popular") {
        // Combined rank of completed_bookings_count and bookingsCount
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

  const handleOpenBooking = (e: React.MouseEvent, service: ExtendedService) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      window.location.href = `/login?redirect=/services`;
      return;
    }
    setBookingService(service);
    setEventDate("");
    setNotes("");
    setError(null);
    setSuccess(false);
  };

  const handleCloseBooking = () => {
    if (isPending) return;
    setBookingService(null);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingService) return;
    setError(null);
    setSuccess(false);

    if (!eventDate) {
      setError("La fecha del evento es obligatoria.");
      return;
    }

    startTransition(async () => {
      const result = await createServiceBooking(
        bookingService.id,
        bookingService.provider_id,
        eventDate,
        bookingService.price,
        notes
      );

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          setBookingService(null);
          setSuccess(false);
        }, 3000);
      }
    });
  };

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
    <div className="space-y-8">
      {/* Header filter tags carousel */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col border-b border-white/5 pb-4 gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 font-extrabold uppercase tracking-widest flex items-center gap-1.5 shrink-0">
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
          <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? "bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-950/20"
                    : "bg-[#0c0c14] border-white/5 text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic subcategory pills selector */}
        {selectedCategory !== "all" && subcategoriesOptions.length > 0 && (
          <div className="bg-[#08080f] border border-white/5 rounded-2xl p-4 space-y-2.5">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">
              Subcategorías de {currentCategoryObj?.name}
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedSubcategory("all")}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  selectedSubcategory === "all"
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-black/30 border-white/5 text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                Ver Todas
              </button>
              {subcategoriesOptions.map((subName) => (
                <button
                  key={subName}
                  onClick={() => setSelectedSubcategory(subName)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                    selectedSubcategory === subName
                      ? "bg-accent-500/10 border-accent-500/30 text-accent-400"
                      : "bg-black/30 border-white/5 text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {subName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Collapsible Advanced Filters */}
        <AnimatePresence>
          {(showFilters || selectedCategory !== "all") && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden bg-[#07070d]/90 border border-white/5 rounded-3xl p-6 space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 items-end">
                {/* City Search */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 block">Ciudad</label>
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
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 block">Rango de Precios</label>
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
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 block">Ordenar Por</label>
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
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
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
      </div>

      {/* Services Grid */}
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

            // Fallback gradient colors depending on service category
            let categoryGradient = "from-purple-600 to-indigo-600";
            if (service.category === "bar") categoryGradient = "from-rose-600 to-amber-600";
            if (service.category === "staff") categoryGradient = "from-sky-600 to-teal-600";
            if (service.category === "security") categoryGradient = "from-slate-600 to-zinc-700";
            if (service.category === "catering") categoryGradient = "from-emerald-600 to-lime-600";
            if (service.category === "decor") categoryGradient = "from-fuchsia-600 to-pink-600";
            if (service.category === "logistics") categoryGradient = "from-blue-600 to-cyan-600";
            if (service.category === "premium") categoryGradient = "from-amber-500 to-orange-600";

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

                    <button
                      onClick={(e) => handleOpenBooking(e, service)}
                      className="bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-2.5 px-4.5 text-xs font-bold transition-all flex items-center gap-1.5 glow cursor-pointer shrink-0 active:scale-95 shadow-md"
                    >
                      Reservar
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Booking Modal (Preserved original code for backward compatibility) */}
      <AnimatePresence>
        {bookingService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md overflow-hidden relative border-white/10"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Solicitud de Reserva</h3>
                  <p className="text-xs text-zinc-400">Reserva de servicio profesional</p>
                </div>
                <button
                  onClick={handleCloseBooking}
                  disabled={isPending}
                  className="text-zinc-400 hover:text-white disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleConfirmBooking} className="p-6 space-y-4">
                {error && (
                  <div className="flex items-center gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>¡Reserva enviada! Esperando respuesta del proveedor.</span>
                  </div>
                )}

                {/* Service Details Card */}
                <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-1">
                  <span className="text-[10px] text-primary-400 font-bold uppercase tracking-wider">Servicio Seleccionado</span>
                  <h4 className="font-semibold text-white truncate">{bookingService.title}</h4>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-zinc-400">Precio Total (Base)</span>
                    <span className="text-md font-extrabold text-emerald-400">${bookingService.price}</span>
                  </div>
                </div>

                {/* Date Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 ml-1">Fecha de la Fiesta / Evento</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                      disabled={isPending || success}
                      className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                    />
                  </div>
                </div>

                {/* Notes Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 ml-1">Notas / Requerimientos Especiales</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe los detalles de tu evento (horario, tipo de música, espacio, etc.)"
                    disabled={isPending || success}
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white placeholder:text-zinc-655 focus:outline-none focus:ring-1 focus:ring-primary-500/50 min-h-[80px] resize-none"
                  />
                </div>

                {/* Confirm Button */}
                {!success && (
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 px-4 font-semibold text-sm transition-all flex items-center justify-center gap-2 glow disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Procesando Reserva...
                      </>
                    ) : (
                      "Confirmar y Enviar Solicitud"
                    )}
                  </button>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
