"use client";

import { useState } from "react";
import { MapPin, Star, Building2, ArrowRight, X, GlassWater, Sparkles } from "lucide-react";
import Link from "next/link";

interface Club {
  id: string;
  name: string;
  slug: string;
  city: string;
  description: string | null;
  banner_image: string | null;
  logo?: string | null;
  address?: string | null;
  opening_hours: string | null;
  rating: number;
  cover_price: number | null;
  amenities?: string[] | null;
  enabled_modules?: string[];
}

interface ClubsCatalogProps {
  initialClubs: Club[];
}

// Reusable logic to calculate if a club is currently open based on America/Bogota timezone
function isClubOpen(openingHours: string | null): boolean {
  if (!openingHours) return false;

  const now = new Date();
  let colombiaDate: Date;
  try {
    const colombiaTime = now.toLocaleString("en-US", { timeZone: "America/Bogota" });
    colombiaDate = new Date(colombiaTime);
  } catch (e) {
    colombiaDate = now;
  }

  const day = colombiaDate.getDay();
  const hour = colombiaDate.getHours();
  const hoursLower = openingHours.toLowerCase();

  let isTargetDay = false;

  if (hoursLower.includes("lunes") || hoursLower.includes("lun")) {
    if (day === 1 || (day === 2 && hour < 6)) isTargetDay = true;
  }
  if (hoursLower.includes("martes") || hoursLower.includes("mar")) {
    if (day === 2 || (day === 3 && hour < 6)) isTargetDay = true;
  }
  if (hoursLower.includes("miércoles") || hoursLower.includes("mier") || hoursLower.includes("mié")) {
    if (day === 3 || (day === 4 && hour < 6)) isTargetDay = true;
  }
  if (hoursLower.includes("jueves") || hoursLower.includes("jue")) {
    if (day === 4 || (day === 5 && hour < 6)) isTargetDay = true;
  }
  if (hoursLower.includes("viernes") || hoursLower.includes("vier") || hoursLower.includes("vi")) {
    if (day === 5 || (day === 6 && hour < 6)) isTargetDay = true;
  }
  if (hoursLower.includes("sábado") || hoursLower.includes("sab") || hoursLower.includes("sáb")) {
    if (day === 6 || (day === 0 && hour < 6)) isTargetDay = true;
  }
  if (hoursLower.includes("domingo") || hoursLower.includes("dom")) {
    if (day === 0 || (day === 1 && hour < 6)) isTargetDay = true;
  }

  if (!isTargetDay && (hoursLower.includes("fin de semana") || hoursLower.includes("weekend"))) {
    if (day === 4 || day === 5 || day === 6 || day === 0 || (day === 1 && hour < 6)) {
      isTargetDay = true;
    }
  }

  if (!isTargetDay && !hoursLower.match(/(lunes|martes|miércoles|jueves|viernes|sábado|domingo|lun|mar|mie|jue|vie|sab|dom)/)) {
    if (day === 4 || day === 5 || day === 6 || (day === 0 && hour < 6)) {
      isTargetDay = true;
    }
  }

  const isNightHour = hour >= 20 || hour < 6;

  return isTargetDay && isNightHour;
}

// Helper to extract or guess genres from amenities and description
function getClubGenres(club: Club): string[] {
  // If club has amenities, filter those that look like music genres or just return amenities
  const genres = club.amenities ? club.amenities.filter(a => 
    ["electrónica", "reggaetón", "reggaeton", "salsa", "crossover", "hip hop", "merengue", "bachata", "vallenato", "pop", "rock"].includes(a.toLowerCase())
  ) : [];

  if (genres.length > 0) {
    return genres;
  }

  // Fallback: search in description
  const desc = (club.description || "").toLowerCase();
  const title = club.name.toLowerCase();
  
  const found: string[] = [];
  if (desc.includes("electrónica") || desc.includes("electronica") || title.includes("electro")) found.push("Electrónica");
  if (desc.includes("reggaetón") || desc.includes("reggaeton") || title.includes("reggaeton")) found.push("Reggaetón");
  if (desc.includes("salsa") || title.includes("salsa")) found.push("Salsa");
  if (desc.includes("crossover") || title.includes("crossover")) found.push("Crossover");
  if (desc.includes("hip hop") || desc.includes("hiphop") || title.includes("hip hop")) found.push("Hip Hop");
  if (desc.includes("merengue") || title.includes("merengue")) found.push("Merengue");

  if (found.length === 0) {
    // Default fallback based on club name or just a standard genre
    if (club.name.toLowerCase().includes("hangover")) {
      return ["Crossover", "Reggaetón"];
    }
    return ["Crossover"];
  }
  return found;
}

export function ClubsCatalog({ initialClubs }: ClubsCatalogProps) {
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const handleClearFilters = () => {
    setSelectedCity("all");
    setSelectedGenre("all");
    setSelectedStatus("all");
  };

  const filteredClubs = initialClubs.filter((club) => {
    // 1. Filter by City
    if (selectedCity !== "all" && club.city.toLowerCase() !== selectedCity.toLowerCase()) {
      return false;
    }

    // 2. Filter by Genre
    if (selectedGenre !== "all") {
      const clubGenres = getClubGenres(club).map(g => g.toLowerCase());
      if (!clubGenres.includes(selectedGenre.toLowerCase())) {
        return false;
      }
    }

    // 3. Filter by Status
    if (selectedStatus !== "all") {
      if (selectedStatus === "open") {
        const isOpen = isClubOpen(club.opening_hours);
        if (!isOpen) return false;
      } else if (selectedStatus === "reservations") {
        const hasReservations = club.enabled_modules ? club.enabled_modules.includes("reservations") : true;
        if (!hasReservations) return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-8">
      {/* 1. BARRA DE FILTROS */}
      <div className="glass-card border border-white/5 bg-[#07070c]/50 p-5 rounded-3xl max-w-6xl mx-auto flex flex-col md:flex-row items-end gap-4 relative z-20">
        <div className="w-full md:w-auto flex-grow grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Ciudad */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 block pl-1">Ciudad</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50 cursor-pointer"
            >
              <option value="all" className="bg-zinc-950 text-white">Todas las ciudades</option>
              <option value="Barranquilla" className="bg-zinc-950 text-white">Barranquilla</option>
              <option value="Medellín" className="bg-zinc-950 text-white">Medellín</option>
              <option value="Bogotá" className="bg-zinc-950 text-white">Bogotá</option>
              <option value="Cali" className="bg-zinc-950 text-white">Cali</option>
              <option value="Cartagena" className="bg-zinc-950 text-white">Cartagena</option>
            </select>
          </div>

          {/* Género Musical */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 block pl-1">Género Musical</label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50 cursor-pointer"
            >
              <option value="all" className="bg-zinc-950 text-white">Todos los géneros</option>
              <option value="Electrónica" className="bg-zinc-950 text-white">Electrónica</option>
              <option value="Reggaetón" className="bg-zinc-950 text-white">Reggaetón</option>
              <option value="Salsa" className="bg-zinc-950 text-white">Salsa</option>
              <option value="Crossover" className="bg-zinc-950 text-white">Crossover</option>
              <option value="Hip Hop" className="bg-zinc-950 text-white">Hip Hop</option>
              <option value="Merengue" className="bg-zinc-950 text-white">Merengue</option>
            </select>
          </div>

          {/* Estado */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 block pl-1">Estado</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50 cursor-pointer"
            >
              <option value="all" className="bg-zinc-950 text-white">Todos los estados</option>
              <option value="open" className="bg-zinc-950 text-white">Abierto ahora</option>
              <option value="reservations" className="bg-zinc-950 text-white">Reservas disponibles</option>
            </select>
          </div>
        </div>

        {/* Limpiar filtros */}
        <div className="w-full md:w-auto shrink-0">
          <button
            onClick={handleClearFilters}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white px-5 py-3 rounded-2xl border border-white/10 hover:border-white/20 text-xs font-black uppercase tracking-widest transition-all cursor-pointer active:scale-95"
          >
            <X className="w-3.5 h-3.5" />
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* 2. CARDS OR EMPTY STATE */}
      <div className="relative z-10">
        {filteredClubs.length === 0 ? (
          /* 3. ESTADO VACÍO CUANDO NO HAY RESULTADOS */
          <div className="glass-card max-w-lg mx-auto p-10 md:p-14 text-center border-white/5 space-y-6 shadow-[0_0_50px_-12px_rgba(217,70,239,0.1)] bg-[#07070c]/50 rounded-[28px]">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-primary-500/10 border border-primary-500/20 rounded-2xl">
              <GlassWater className="w-10 h-10 text-primary-400" />
              <div className="absolute -inset-1.5 bg-primary-500/20 rounded-2xl blur opacity-30" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white font-outfit">No encontramos clubes con esos filtros</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Intenta con otra ciudad o género musical
              </p>
            </div>
            <div className="pt-2">
              <button 
                onClick={handleClearFilters} 
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all cursor-pointer shadow-lg active:scale-95"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        ) : (
          /* Grid of Clubs (con tamaño y dimensiones idénticas) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {filteredClubs.map((club) => {
              const isOpen = isClubOpen(club.opening_hours);
              const genres = getClubGenres(club);
              const ratingVal = club.rating || 0;
              const formattedRating = Number(ratingVal).toFixed(1);

              return (
                <Link 
                  key={club.id} 
                  href={`/discotecas/${club.slug || club.id}`}
                  className="glass-card overflow-hidden hover:border-primary-500/30 transition-all duration-300 flex flex-col h-full group hover:shadow-[0_0_25px_-5px_rgba(217,70,239,0.2)] bg-[#07070c]/50 rounded-[28px] border-white/5 cursor-pointer text-left"
                >
                  {/* Banner Image */}
                  <div className="relative h-52 w-full bg-zinc-950 flex-shrink-0 overflow-hidden">
                    {club.banner_image ? (
                      <img
                        src={club.banner_image}
                        alt={club.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-primary-950 via-zinc-900 to-accent-950 flex items-center justify-center opacity-60">
                        <Building2 className="w-12 h-12 text-white/20" />
                      </div>
                    )}
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-85" />
                    
                    {/* Location Badge (top left) */}
                    <div className="absolute top-4 left-4 flex items-center gap-1 bg-black/70 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-zinc-350">
                      <MapPin className="w-3 h-3 text-accent-400" />
                      <span>{club.city}</span>
                    </div>

                    {/* Rating Badge (top right) */}
                    {ratingVal > 0 && (
                      <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/70 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{formattedRating}</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {/* Open / Closed Status Badge */}
                      <div className="flex items-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          isOpen 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-zinc-800/40 border-zinc-700/50 text-zinc-500"
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${isOpen ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`} />
                          <span>{isOpen ? "Abierto ahora" : "Cerrado"}</span>
                        </span>
                      </div>

                      {/* Club Name */}
                      <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors font-outfit line-clamp-1 uppercase text-left">
                        {club.name}
                      </h3>

                      {/* Short description (exactly 2 lines truncated) */}
                      <p className="text-zinc-400 text-xs md:text-sm leading-relaxed line-clamp-2 h-[40px] overflow-hidden text-left">
                        {club.description || "Disfruta de la mejor producción acústica e iluminación del sector en un ambiente unique."}
                      </p>

                      {/* Music genres chips */}
                      <div className="flex flex-wrap gap-2 h-6 overflow-hidden pt-0.5">
                        {genres.map((g, idx) => (
                          <span key={idx} className="text-[10px] font-semibold text-primary-400">
                            #{g}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer / Action row */}
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-4">
                      {/* Cover price */}
                      <div className="flex flex-col text-left">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Entrada</span>
                        <span className={`text-xs font-black uppercase tracking-wider ${club.cover_price && club.cover_price > 0 ? "text-emerald-400" : "text-zinc-400"}`}>
                          {club.cover_price && club.cover_price > 0 ? `Desde $${club.cover_price.toLocaleString("es-CO")}` : "Entrada libre"}
                        </span>
                      </div>

                      {/* Action Button */}
                      <span
                        className="inline-flex items-center gap-1.5 bg-white group-hover:bg-zinc-200 active:scale-95 text-black px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg font-bold"
                      >
                        Ver más
                        <ArrowRight className="w-3.5 h-3.5 text-black" />
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
