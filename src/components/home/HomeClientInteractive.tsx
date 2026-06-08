"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Calendar, Building, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function HomeClientInteractive() {
  const router = useRouter();
  const [activeSearchTab, setActiveSearchTab] = useState<"events" | "clubs" | "services">("events");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();

    if (activeSearchTab === "events") {
      router.push(query ? `/events?search=${encodeURIComponent(query)}` : "/events");
    } else if (activeSearchTab === "clubs") {
      router.push(query ? `/discotecas?search=${encodeURIComponent(query)}` : "/discotecas");
    } else if (activeSearchTab === "services") {
      router.push(query ? `/services?search=${encodeURIComponent(query)}` : "/services");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3 relative z-20">
      {/* Search Category Pills */}
      <div className="flex justify-center gap-1.5 sm:gap-2">
        <button
          onClick={() => setActiveSearchTab("events")}
          className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer border ${
            activeSearchTab === "events"
              ? "bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-600/15"
              : "bg-black/40 border-white/5 hover:border-white/10 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Eventos</span>
        </button>

        <button
          onClick={() => setActiveSearchTab("clubs")}
          className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer border ${
            activeSearchTab === "clubs"
              ? "bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-600/15"
              : "bg-black/40 border-white/5 hover:border-white/10 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Discotecas</span>
        </button>

        <button
          onClick={() => setActiveSearchTab("services")}
          className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer border ${
            activeSearchTab === "services"
              ? "bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-600/15"
              : "bg-black/40 border-white/5 hover:border-white/10 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Servicios</span>
        </button>
      </div>

      {/* Global Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="w-full bg-zinc-950/70 border border-white/10 p-2 flex items-center gap-2 rounded-3xl backdrop-blur-md shadow-2xl hover:border-white/15 focus-within:border-primary-500/50 transition-all"
      >
        <div className="flex-grow flex items-center px-3 sm:px-4 py-2 w-full">
          <Search className="w-5 h-5 text-zinc-500 mr-3 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeSearchTab === "events"
                ? "Buscar eventos por nombre, fecha, DJ..."
                : activeSearchTab === "clubs"
                ? "Buscar discotecas por nombre o ubicación..."
                : "Buscar servicios por DJ, luces, catering, barra..."
            }
            className="bg-transparent border-none outline-none text-white w-full text-xs sm:text-sm placeholder:text-zinc-650"
          />
        </div>
        <button
          type="submit"
          className="bg-white hover:bg-zinc-200 active:scale-95 text-black px-6 py-2.5 sm:px-8 sm:py-3 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all cursor-pointer shrink-0"
        >
          Buscar
        </button>
      </form>
    </div>
  );
}
