"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { 
  Calendar, MapPin, Sparkles, Search, SlidersHorizontal, 
  Users, ArrowRight, ShieldCheck, Star, Clock, Flame, 
  Ticket, AlertTriangle, PartyPopper, Check, Heart, ChevronLeft, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { EventCountdown } from "./EventCountdown";
import { slugify, getEventImage } from "@/lib/event-utils";

interface ExtendedEvent {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string;
  image_url: string | null;
  ticket_price: number;
  created_at: string;
  updated_at: string;
  views: number;
  ticketing_enabled: boolean;
  event_type: string;
  ticket_card_title: string | null;
  ticket_card_description: string | null;
  show_sales_progress: boolean;
  show_capacity: boolean;
  show_attendees: string;
  show_ticket_batches: boolean;
  show_favorites: boolean;
  show_countdown: boolean;
  show_remaining_tickets: boolean;
  show_statistics: boolean;
  show_who_is_going: boolean;
  show_event_chat: boolean;
  show_event_community: boolean;
  category: string | null;
  dress_code: string | null;
  min_age: number | null;
  opening_time: string | null;
  closing_time: string | null;
  has_parking: boolean;
  has_vip_zone: boolean;
  has_tables_module: boolean;
  is_adults_only: boolean;
  is_free_entry: boolean;
  average_rating: number;
  reviews_count: number;
  is_featured?: boolean;
  is_sponsored?: boolean;
  
  // Real-time extended counts
  attendeeCount: number;
  favoritesCount: number;
  salesTodayCount: number;
  creator?: {
    full_name: string | null;
    city: string | null;
  } | null;
}

interface EventsListProps {
  initialEvents: ExtendedEvent[];
  user: any;
  userCity: string | null;
}

const QUICK_FILTERS = [
  "Todos", "Hoy", "Esta noche", "Este fin de semana", "Esta semana", "Este mes", 
  "Gratis", "VIP", "Música en Vivo", "DJ Invitado", "Festival", "Concierto", 
  "After Party", "Beach Club", "Rooftop", "Bar", "Hotel", "Playa", "18+"
];

const SORT_OPTIONS = [
  { value: "upcoming", label: "Más próximos" },
  { value: "newest", label: "Más recientes" },
  { value: "popular", label: "Más populares" },
  { value: "best-sellers", label: "Más vendidos" },
  { value: "rating", label: "Mayor calificación" },
  { value: "price-asc", label: "Menor precio" },
  { value: "price-desc", label: "Mayor precio" }
];

export function EventsList({ initialEvents, user, userCity }: EventsListProps) {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [sortBy, setSortBy] = useState("upcoming");
  const [visibleCount, setVisibleCount] = useState(6);
  const [loadingMore, setLoadingMore] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Helper: Deduce Venue Type
  const getVenueType = (event: ExtendedEvent): string => {
    const categoryLower = (event.category || "").toLowerCase();
    const descLower = (event.description || "").toLowerCase();
    const titleLower = (event.title || "").toLowerCase();
    const locationLower = (event.location || "").toLowerCase();
    
    if (categoryLower.includes("rooftop") || descLower.includes("rooftop") || titleLower.includes("rooftop")) return "Rooftop";
    if (categoryLower.includes("beach club") || descLower.includes("beach club") || locationLower.includes("beach") || locationLower.includes("playa")) return "Beach Club";
    if (categoryLower.includes("bar") || categoryLower.includes("lounge") || descLower.includes("bar") || descLower.includes("lounge")) return "Bar / Lounge";
    if (categoryLower.includes("restaurante") || descLower.includes("restaurante")) return "Restaurante";
    if (categoryLower.includes("hotel") || locationLower.includes("hotel")) return "Hotel";
    if (categoryLower.includes("discoteca") || descLower.includes("discoteca") || titleLower.includes("club") || descLower.includes("club")) return "Discoteca";
    if (categoryLower.includes("estadio") || locationLower.includes("estadio") || locationLower.includes("arena")) return "Estadio / Arena";
    if (categoryLower.includes("parque") || locationLower.includes("parque")) return "Parque";
    if (categoryLower.includes("finca") || locationLower.includes("finca")) return "Finca";
    if (categoryLower.includes("casa") || locationLower.includes("casa")) return "Casa Privada";
    
    return event.category ? event.category : "Establecimiento";
  };

  // Helper: Calculate Badges Dynamically
  const getDynamicBadges = (event: ExtendedEvent) => {
    if (!now) return [];
    const badges = [];
    const capacity = (event as any).capacity ?? 350;
    const bookingsCount = event.attendeeCount || 0;
    const views = event.views || 0;
    const favorites = event.favoritesCount || 0;
    const salesToday = event.salesTodayCount || 0;
    const isSponsored = !!event.is_sponsored;
    const isFeatured = !!event.is_featured || event.average_rating >= 4.8;
    const ticketPrice = event.ticket_price || 0;
    const isFree = ticketPrice === 0 || event.is_free_entry;
    
    // Check if Event is Live Now
    const eventTime = new Date(event.event_date).getTime();
    const nowTime = now.getTime();
    const duration = 6 * 60 * 60 * 1000; // 6 hour default event duration
    const isLive = eventTime <= nowTime && (eventTime + duration) > nowTime;
    
    // Check if Event is Today
    const eventDateStr = new Date(event.event_date).toDateString();
    const todayDateStr = now.toDateString();
    const isToday = eventDateStr === todayDateStr;
    
    const isSoldOut = bookingsCount >= capacity;
    const isLastTickets = !isSoldOut && (capacity - bookingsCount <= 20 || (bookingsCount / capacity) >= 0.85);
    
    // Algorithmic Trending Score
    const trendingScore = views * 1.5 + favorites * 5 + salesToday * 10;
    const isTrending = trendingScore >= 60;
    
    if (isLive) {
      badges.push({ text: "🔴 En Vivo", className: "bg-red-500 text-white border-none shadow-[0_0_12px_rgba(239,68,68,0.6)] font-black" });
    } else if (isToday) {
      badges.push({ text: "⏳ Hoy", className: "bg-amber-500 text-black border-none font-extrabold animate-pulse" });
    }
    
    if (isSoldOut) {
      badges.push({ text: "💥 Agotado", className: "bg-zinc-800 text-zinc-400 border-zinc-700 font-bold" });
    } else if (isLastTickets) {
      badges.push({ text: "🟠 Últimas Entradas", className: "bg-orange-500 text-white border-none animate-pulse font-bold" });
    } else if (isFree) {
      badges.push({ text: "🎁 Gratis", className: "bg-emerald-500 text-white border-none font-bold" });
    } else {
      badges.push({ text: "🟢 Disponible", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" });
    }
    
    if (isSponsored) {
      badges.push({ text: "✨ Patrocinado", className: "bg-gradient-to-r from-yellow-500 to-amber-500 text-black border-none font-black shadow-[0_0_12px_rgba(245,158,11,0.4)]" });
    } else if (isFeatured) {
      badges.push({ text: "⭐ Destacado", className: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-none font-bold" });
    }
    
    if (isTrending) {
      badges.push({ text: "🔥 Trending", className: "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-none font-extrabold" });
    }
    
    // New if created in the last 3 days
    const createdTime = new Date(event.created_at).getTime();
    if (nowTime - createdTime < 3 * 24 * 60 * 60 * 1000) {
      badges.push({ text: "🆕 Nuevo", className: "bg-cyan-500 text-white border-none" });
    }
    
    // Near you
    if (userCity && event.location && event.location.toLowerCase().includes(userCity.toLowerCase())) {
      badges.push({ text: "📍 Cerca de ti", className: "bg-blue-500 text-white border-none" });
    }
    
    // Best seller (more than 50 bookings)
    if (bookingsCount > 50) {
      badges.push({ text: "🏆 Más Vendido", className: "bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-white border-none font-extrabold" });
    }
    
    return badges.slice(0, 3); // Max 3 badges
  };

  // Algorithm: Find Smart Hero Event
  const heroEvent = useMemo(() => {
    if (initialEvents.length === 0) return null;
    
    const scoredEvents = initialEvents.map(e => {
      const views = e.views || 0;
      const sales = e.attendeeCount || 0;
      const favorites = e.favoritesCount || 0;
      const rating = e.average_rating || 5.0;
      const isSponsored = !!e.is_sponsored;
      const isFeatured = !!e.is_featured || rating >= 4.8;
      
      const trendingScore = views * 1.5 + sales * 10 + favorites * 5;
      const conversion = sales / (views + 1);
      const timeUntil = new Date(e.event_date).getTime() - Date.now();
      
      return {
        event: e,
        isSponsored,
        isFeatured,
        trendingScore,
        conversion,
        timeUntil: timeUntil > 0 ? timeUntil : Infinity,
        interest: sales + favorites
      };
    });
    
    scoredEvents.sort((a, b) => {
      if (a.isSponsored !== b.isSponsored) return a.isSponsored ? -1 : 1;
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      if (b.trendingScore !== a.trendingScore) return b.trendingScore - a.trendingScore;
      if (b.conversion !== a.conversion) return b.conversion - a.conversion;
      if (a.timeUntil !== b.timeUntil) return a.timeUntil - b.timeUntil;
      return b.interest - a.interest;
    });
    
    return scoredEvents[0]?.event || null;
  }, [initialEvents]);

  // Main list for grid/search
  const processedEvents = useMemo(() => {
    let result = [...initialEvents];
    
    // 1. Apply Search
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => {
        const title = (e.title || "").toLowerCase();
        const desc = (e.description || "").toLowerCase();
        const loc = (e.location || "").toLowerCase();
        const creatorName = (e.creator?.full_name || "").toLowerCase();
        const category = (e.category || "").toLowerCase();
        
        return title.includes(q) || 
               desc.includes(q) || 
               loc.includes(q) || 
               creatorName.includes(q) || 
               category.includes(q);
      });
    }
    
    // 2. Apply Quick Filter
    if (activeFilter !== "Todos" && now) {
      result = result.filter(e => {
        const eventDate = new Date(e.event_date);
        const titleLower = (e.title || "").toLowerCase();
        const descLower = (e.description || "").toLowerCase();
        const locLower = (e.location || "").toLowerCase();
        const catLower = (e.category || "").toLowerCase();
        
        switch (activeFilter) {
          case "Hoy":
          case "Esta noche":
            return eventDate.toDateString() === now.toDateString();
            
          case "Este fin de semana": {
            const day = eventDate.getDay();
            const diffInDays = (eventDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
            return [0, 5, 6].includes(day) && diffInDays <= 7;
          }
          case "Esta semana":
            return (eventDate.getTime() - now.getTime()) <= 7 * 24 * 60 * 60 * 1000;
            
          case "Este mes":
            return (eventDate.getTime() - now.getTime()) <= 30 * 24 * 60 * 60 * 1000;
            
          case "Gratis":
            return e.ticket_price === 0 || e.is_free_entry;
            
          case "VIP":
            return e.has_vip_zone;
            
          case "Música en Vivo":
            return titleLower.includes("en vivo") || titleLower.includes("live") || descLower.includes("en vivo") || descLower.includes("live") || descLower.includes("banda");
            
          case "DJ Invitado":
            return titleLower.includes("dj") || descLower.includes("dj") || descLower.includes("set");
            
          case "Festival":
            return catLower === "festival" || titleLower.includes("festival") || descLower.includes("festival");
            
          case "Concierto":
            return catLower === "concierto" || titleLower.includes("concierto") || descLower.includes("concierto");
            
          case "After Party":
            return catLower === "after party" || titleLower.includes("after") || descLower.includes("after");
            
          case "Beach Club":
            return catLower.includes("beach") || locLower.includes("beach") || locLower.includes("playa") || descLower.includes("beach");
            
          case "Rooftop":
            return catLower.includes("rooftop") || locLower.includes("rooftop") || locLower.includes("terraza") || descLower.includes("rooftop");
            
          case "Bar":
            return catLower === "bar" || locLower.includes("bar") || descLower.includes("bar");
            
          case "Hotel":
            return locLower.includes("hotel") || descLower.includes("hotel");
            
          case "Playa":
            return locLower.includes("playa") || locLower.includes("beach");
            
          case "18+":
            return (e.min_age || 0) >= 18;
            
          default:
            return true;
        }
      });
    }
    
    // 3. Apply Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "upcoming":
          return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "popular":
          return (b.views + b.favoritesCount * 5) - (a.views + a.favoritesCount * 5);
        case "best-sellers":
          return b.attendeeCount - a.attendeeCount;
        case "rating":
          return b.average_rating - a.average_rating;
        case "price-asc":
          return a.ticket_price - b.ticket_price;
        case "price-desc":
          return b.ticket_price - a.ticket_price;
        default:
          return 0;
      }
    });
    
    return result;
  }, [initialEvents, searchQuery, activeFilter, sortBy, now]);

  // Paginated grid events
  const gridEvents = useMemo(() => {
    // Exclude the hero event if there's no active filter/search to prevent duplication
    const isSearching = searchQuery.trim() !== "" || activeFilter !== "Todos";
    if (isSearching || !heroEvent) {
      return processedEvents.slice(0, visibleCount);
    }
    return processedEvents.filter(e => e.id !== heroEvent.id).slice(0, visibleCount);
  }, [processedEvents, heroEvent, visibleCount, searchQuery, activeFilter]);

  // Discovery Moments Events
  const moments = useMemo(() => {
    if (!now) return { happeningNow: [], tonight: [], next7Days: [], thisWeekend: [], trending: [], recommended: [] };
    const happeningNow: ExtendedEvent[] = [];
    const tonight: ExtendedEvent[] = [];
    const next7Days: ExtendedEvent[] = [];
    const thisWeekend: ExtendedEvent[] = [];
    
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const nowTime = now.getTime();
    
    processedEvents.forEach(e => {
      const eTime = new Date(e.event_date).getTime();
      const diffDays = (eTime - nowTime) / oneDayInMs;
      
      // 1. Happening Now
      const duration = 6 * 60 * 60 * 1000;
      if (eTime <= nowTime && (eTime + duration) > nowTime) {
        happeningNow.push(e);
      }
      
      // 2. Tonight
      if (new Date(e.event_date).toDateString() === now.toDateString()) {
        tonight.push(e);
      }
      
      // 3. Next 7 Days
      if (diffDays > 0 && diffDays <= 7) {
        next7Days.push(e);
      }
      
      // 4. This Weekend
      const day = new Date(e.event_date).getDay();
      if ([0, 5, 6].includes(day) && diffDays <= 7) {
        thisWeekend.push(e);
      }
    });
    
    // 5. Trending
    const trending = [...processedEvents]
      .sort((a, b) => {
        const scoreA = (a.views || 0) * 1.5 + (a.favoritesCount || 0) * 5 + (a.salesTodayCount || 0) * 10;
        const scoreB = (b.views || 0) * 1.5 + (b.favoritesCount || 0) * 5 + (b.salesTodayCount || 0) * 10;
        return scoreB - scoreA;
      })
      .slice(0, 8);

    // 6. Recommended for you (initial implementation using matching city)
    const recommended = [...processedEvents]
      .filter(e => {
        if (!userCity) return true; // Fallback to all if user city is not available
        return e.location?.toLowerCase().includes(userCity.toLowerCase()) || 
               e.creator?.city?.toLowerCase().includes(userCity.toLowerCase());
      })
      .sort((a, b) => b.average_rating - a.average_rating)
      .slice(0, 8);
      
    return { happeningNow, tonight, next7Days, thisWeekend, trending, recommended };
  }, [processedEvents, now, userCity]);

  // Venue categories for horizontal sliders
  const venueSliders = useMemo(() => {
    const rooftops = processedEvents.filter(e => getVenueType(e) === "Rooftop");
    const beachClubs = processedEvents.filter(e => getVenueType(e) === "Beach Club");
    const liveMusic = processedEvents.filter(e => {
      const titleLower = (e.title || "").toLowerCase();
      const descLower = (e.description || "").toLowerCase();
      return titleLower.includes("en vivo") || titleLower.includes("live") || descLower.includes("en vivo") || descLower.includes("live") || descLower.includes("banda");
    });
    const bars = processedEvents.filter(e => getVenueType(e) === "Bar / Lounge" || getVenueType(e) === "Bar");
    const djs = processedEvents.filter(e => {
      const titleLower = (e.title || "").toLowerCase();
      const descLower = (e.description || "").toLowerCase();
      return titleLower.includes("dj") || descLower.includes("dj") || descLower.includes("set");
    });
    const concerts = processedEvents.filter(e => {
      const catLower = (e.category || "").toLowerCase();
      const titleLower = (e.title || "").toLowerCase();
      return catLower === "concierto" || titleLower.includes("concierto");
    });
    const festivals = processedEvents.filter(e => {
      const catLower = (e.category || "").toLowerCase();
      const titleLower = (e.title || "").toLowerCase();
      return catLower === "festival" || titleLower.includes("festival");
    });
    const afterParties = processedEvents.filter(e => {
      const catLower = (e.category || "").toLowerCase();
      const titleLower = (e.title || "").toLowerCase();
      return catLower === "after party" || titleLower.includes("after");
    });
    
    return [
      { id: "rooftops", label: "🏙️ Rooftops", events: rooftops },
      { id: "beach-clubs", label: "🌴 Beach Clubs", events: beachClubs },
      { id: "live-music", label: "🎶 Música en Vivo", events: liveMusic },
      { id: "bars", label: "🍸 Bares", events: bars },
      { id: "djs", label: "🎧 DJs Invitados", events: djs },
      { id: "concerts", label: "🎤 Conciertos", events: concerts },
      { id: "festivals", label: "🎪 Festivales", events: festivals },
      { id: "afters", label: "🌙 After Party", events: afterParties }
    ].filter(item => item.events.length > 0);
  }, [processedEvents]);

  // Handle Load More
  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 6);
      setLoadingMore(false);
    }, 800);
  };

  // horizontal scroll helper
  const scrollRef = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollBy({ left: 350, behavior: "smooth" });
    }
  };
  
  const scrollLeftRef = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollBy({ left: -350, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-16">
      {/* 1. SEO Schema.org Event metadata */}
      {processedEvents.slice(0, 10).map((event) => (
        <script
          key={`schema-${event.id}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Event",
              "name": event.title,
              "startDate": event.event_date,
              "location": {
                "@type": "Place",
                "name": event.location,
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": event.creator?.city || "Colombia",
                  "addressCountry": "CO"
                }
              },
              "image": [
                getEventImage(event.image_url, event.id)
              ],
              "description": event.description || "Experiencia exclusiva de Hangover",
              "offers": {
                "@type": "Offer",
                "price": event.ticket_price,
                "priceCurrency": "COP",
                "availability": "https://schema.org/InStock",
                "validFrom": event.created_at
              },
              "organizer": {
                "@type": "Organization",
                "name": event.creator?.full_name || "Organizador Hangover"
              }
            })
          }}
        />
      ))}

      {/* 2. SEARCH & FILTERS CONTROLS */}
      <div className="glass-card p-6 border border-white/5 space-y-4 rounded-3xl backdrop-blur-xl relative z-20 shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="relative flex-grow group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-primary-400 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por evento, artista, DJ, organizador, lugar, ciudad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-black/50 border border-white/10 focus:border-primary-500/50 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary-500/30 transition-all font-outfit shadow-inner"
            />
          </div>
          
          {/* Sort Select */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider hidden sm:inline">Ordenar por:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-black/50 border border-white/10 hover:border-white/20 text-xs text-zinc-300 hover:text-white pl-4 pr-10 py-3.5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary-500/20 font-semibold cursor-pointer transition-all"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-[#09090f] text-zinc-300">{opt.label}</option>
                ))}
              </select>
              <SlidersHorizontal className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Quick Filter Pills (Horizontal Slider) */}
        <div className="relative w-full">
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 pt-1 snap-x snap-mandatory">
            {QUICK_FILTERS.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => {
                    setActiveFilter(filter);
                    setVisibleCount(6); // reset pagination
                  }}
                  className={`snap-center px-4.5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 cursor-pointer border ${
                    isActive
                      ? "bg-gradient-to-r from-primary-600 to-indigo-600 border-none text-white shadow-[0_5px_15px_rgba(217,70,239,0.25)] hover:opacity-90 scale-[1.03]"
                      : "bg-white/[0.03] border-white/5 text-zinc-400 hover:bg-white/5 hover:border-white/10 hover:text-white"
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. EXPERIENCE EXPLORER RENDER CONTENT */}
      {processedEvents.length === 0 ? (
        // Empty State Component
        <div className="glass-card p-16 text-center max-w-xl mx-auto space-y-5 rounded-3xl border border-white/5">
          <div className="relative w-16 h-16 mx-auto bg-gradient-to-tr from-primary-600/10 to-rose-600/10 border border-white/10 rounded-2xl flex items-center justify-center animate-pulse">
            <PartyPopper className="w-8 h-8 text-zinc-550" />
            <div className="absolute inset-0 border border-primary-500/20 rounded-2xl filter blur-[4px]" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white font-outfit">No hay experiencias disponibles</h3>
            <p className="text-zinc-400 text-xs max-w-sm mx-auto leading-relaxed">
              No encontramos eventos que coincidan con la búsqueda o filtro seleccionado en este momento. Intenta cambiar los criterios de búsqueda.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery("");
              setActiveFilter("Todos");
              setSortBy("upcoming");
            }}
            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-xs font-bold text-white transition-all cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <>
          {/* A. SMART HERO VIEW */}
          {heroEvent && searchQuery.trim() === "" && activeFilter === "Todos" && (
            <div className="relative rounded-3xl border border-white/10 bg-[#09090f] overflow-hidden shadow-[0_20px_50px_rgba(217,70,239,0.15)] group transition-all duration-300">
              {/* Back Visual */}
              <div className="absolute inset-0 z-0 select-none">
                <img
                  src={getEventImage(heroEvent.image_url, heroEvent.id)}
                  alt={heroEvent.title}
                  className="w-full h-full object-cover opacity-35 filter blur-[1px] scale-100 group-hover:scale-[1.02] transition-transform duration-[8000ms] ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#030308] via-[#030308]/90 to-transparent md:bg-gradient-to-tr" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020205] via-transparent to-transparent" />
              </div>

              {/* Layout Grid */}
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 p-6 sm:p-10 lg:p-14 items-center">
                {/* Information */}
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/20 border border-primary-500/30 text-[10px] font-bold uppercase tracking-wider text-primary-300">
                      <Sparkles className="w-3.5 h-3.5" /> Evento Recomendado
                    </span>
                    {getDynamicBadges(heroEvent).map((badge, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.className}`}
                      >
                        {badge.text}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-outfit leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-300">
                      <Link href={`/events/${slugify(heroEvent.title)}`}>
                        {heroEvent.title}
                      </Link>
                    </h2>
                    <p className="text-zinc-400 text-xs">
                      Organizado por{" "}
                      <span className="text-zinc-200 font-bold">
                        {heroEvent.creator?.full_name || "Organizador Hangover"}
                      </span>
                    </p>
                  </div>

                  <p className="text-zinc-300 text-xs sm:text-sm line-clamp-3 leading-relaxed max-w-xl">
                    {heroEvent.description || "Prepárate para una noche inolvidable. Disfruta de la mejor música, producción premium y sorpresas exclusivas."}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5 max-w-lg">
                    <div className="flex items-center gap-3 text-zinc-350">
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-primary-400 shrink-0">
                        <Calendar className="w-4.5 h-4.5" />
                      </div>
                      <div className="text-[11px]">
                        <p className="text-zinc-550 uppercase font-black tracking-wider">Fecha y Hora</p>
                        <p className="capitalize font-bold text-white">
                          {new Date(heroEvent.event_date).toLocaleDateString("es-ES", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-zinc-350">
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-rose-400 shrink-0">
                        <MapPin className="w-4.5 h-4.5" />
                      </div>
                      <div className="text-[11px]">
                        <p className="text-zinc-550 uppercase font-black tracking-wider">Establecimiento</p>
                        <p className="font-bold text-white truncate max-w-[170px]" title={heroEvent.location}>
                          {heroEvent.location} ({getVenueType(heroEvent)})
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Indicator Stats */}
                  <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-zinc-500" />
                      <strong>{heroEvent.attendeeCount}</strong> asistentes
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-zinc-500" />
                      <strong>{heroEvent.favoritesCount}</strong> guardados
                    </span>
                    {heroEvent.salesTodayCount > 0 && (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                          🔥 {heroEvent.salesTodayCount} vendidos hoy
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Area: Countdown */}
                <div className="flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl border border-white/15 bg-black/60 backdrop-blur-xl space-y-6 lg:max-w-md lg:ml-auto w-full shadow-2xl">
                  <div className="text-center space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-extrabold">La experiencia inicia en</p>
                    <p className="text-[10px] text-primary-400 font-bold uppercase tracking-wider">Reserva antes de que se agote</p>
                  </div>

                  <EventCountdown targetDate={heroEvent.event_date} variant="detailed" />

                  <Link
                    href={`/events/${slugify(heroEvent.title)}`}
                    className="w-full bg-gradient-to-r from-primary-600 to-rose-600 hover:from-primary-500 hover:to-rose-500 text-white rounded-xl py-4.5 px-6 font-black text-sm transition-all flex items-center justify-center gap-2 glow hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    Ver Evento Completo
                    <ArrowRight className="w-4.5 h-4.5 shrink-0" />
                  </Link>

                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Hangover Verified · Entrada 100% Segura</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* B. DISCOVERY CHRONOLOGICAL MOMENTS (Only visible when not search/filtering) */}
          {searchQuery.trim() === "" && activeFilter === "Todos" && (
            <div className="space-y-12">
              
              {/* Moment: Ocurriendo Ahora */}
              {moments.happeningNow.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                    <h3 className="text-lg font-black text-white uppercase tracking-wider font-outfit">🔴 Ocurriendo Ahora</h3>
                    <div className="h-px bg-white/10 flex-grow" />
                  </div>
                  <div className="relative">
                    <div id="happening-slider" className="flex gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-4">
                      {moments.happeningNow.map(e => <Card key={e.id} event={e} getDynamicBadges={getDynamicBadges} getVenueType={getVenueType} />)}
                    </div>
                  </div>
                </div>
              )}

              {/* Moment: Esta Noche */}
              {moments.tonight.length > 0 && (
                <div className="space-y-5 p-6 rounded-3xl bg-gradient-to-b from-primary-950/20 to-transparent border border-primary-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                      <h3 className="text-xl font-black text-white uppercase tracking-wider font-outfit">🔥 HOY EN LA NOCHE</h3>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => scrollLeftRef("tonight-slider")} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                      <button onClick={() => scrollRef("tonight-slider")} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="relative">
                    <div id="tonight-slider" className="flex gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-4">
                      {moments.tonight.map(e => (
                        <div key={e.id} className="min-w-[280px] sm:min-w-[340px] max-w-[340px] snap-center shrink-0">
                          {/* Card with dynamic neon styles */}
                          <div className="glass-card overflow-hidden hover:border-primary-500/30 transition-all duration-300 flex flex-col h-full group relative hover:shadow-[0_10px_35px_rgba(217,70,239,0.15)] bg-black/60 border border-primary-500/15">
                            <div className="relative h-48 w-full bg-zinc-950 flex-shrink-0 overflow-hidden">
                              <img src={getEventImage(e.image_url, e.id)} alt={e.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#030308] via-transparent to-black/35" />
                              <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-black border-none animate-pulse">HOY</span>
                                {getDynamicBadges(e).slice(1).map((b, i) => <span key={i} className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${b.className}`}>{b.text}</span>)}
                              </div>
                              <span className="absolute top-4 right-4 bg-black/75 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                {e.ticket_price > 0 ? `$${e.ticket_price.toLocaleString("es-CO")}` : "Gratis"}
                              </span>
                            </div>
                            <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                              <div className="space-y-2">
                                <span className="text-[9px] text-primary-400 font-bold uppercase tracking-wider">Hoy · {e.creator?.full_name || "Organizador"}</span>
                                <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-primary-400 transition-colors font-outfit">
                                  <Link href={`/events/${slugify(e.title)}`}>{e.title}</Link>
                                </h3>
                                <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2 min-h-[36px]">{e.description || "Prepárate para la mejor noche."}</p>
                              </div>
                              <div className="pt-2 flex items-center justify-between text-[10px] text-zinc-550 border-t border-white/5">
                                <span className="truncate">📍 {e.location}</span>
                                <Link href={`/events/${slugify(e.title)}`} className="text-primary-400 font-extrabold shrink-0 hover:underline flex items-center gap-0.5">
                                  Ver Evento <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Moment: Próximos 7 días */}
              {moments.next7Days.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-white uppercase tracking-wider font-outfit">📅 En los próximos 7 días</h3>
                    <div className="flex gap-1.5">
                      <button onClick={() => scrollLeftRef("week-slider")} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                      <button onClick={() => scrollRef("week-slider")} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="relative">
                    <div id="week-slider" className="flex gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-4">
                      {moments.next7Days.map(e => <Card key={e.id} event={e} getDynamicBadges={getDynamicBadges} getVenueType={getVenueType} />)}
                    </div>
                  </div>
                </div>
              )}

              {/* Moment: Este fin de semana */}
              {moments.thisWeekend.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-white uppercase tracking-wider font-outfit">🎉 Este Fin de Semana</h3>
                    <div className="flex gap-1.5">
                      <button onClick={() => scrollLeftRef("weekend-slider")} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                      <button onClick={() => scrollRef("weekend-slider")} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="relative">
                    <div id="weekend-slider" className="flex gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-4">
                      {moments.thisWeekend.map(e => <Card key={e.id} event={e} getDynamicBadges={getDynamicBadges} getVenueType={getVenueType} />)}
                    </div>
                  </div>
                </div>
              )}

              {/* Moment: Tendencia */}
              {moments.trending.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-white uppercase tracking-wider font-outfit">🔥 En Tendencia esta Semana</h3>
                    <div className="flex gap-1.5">
                      <button onClick={() => scrollLeftRef("trending-slider")} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                      <button onClick={() => scrollRef("trending-slider")} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="relative">
                    <div id="trending-slider" className="flex gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-4">
                      {moments.trending.map(e => <Card key={e.id} event={e} getDynamicBadges={getDynamicBadges} getVenueType={getVenueType} />)}
                    </div>
                  </div>
                </div>
              )}

              {/* Moment: Recomendados para ti */}
              {moments.recommended.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-white uppercase tracking-wider font-outfit">❤️ Recomendaciones para ti</h3>
                    <div className="flex gap-1.5">
                      <button onClick={() => scrollLeftRef("rec-slider")} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                      <button onClick={() => scrollRef("rec-slider")} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="relative">
                    <div id="rec-slider" className="flex gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-4">
                      {moments.recommended.map(e => <Card key={e.id} event={e} getDynamicBadges={getDynamicBadges} getVenueType={getVenueType} />)}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* C. GENERAL MAIN GRID & PAGINATION */}
          <div className="space-y-8 pt-8">
            <div className="flex items-center gap-2">
              <div className="h-px bg-white/10 flex-grow" />
              <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest font-outfit shrink-0">
                {searchQuery.trim() !== "" || activeFilter !== "Todos" 
                  ? `Resultados del Filtro (${processedEvents.length})` 
                  : "Todos los Eventos Activos"}
              </h3>
              <div className="h-px bg-white/10 flex-grow" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {gridEvents.map((event) => (
                <div key={event.id} className="min-w-0 w-full">
                  <Card event={event} getDynamicBadges={getDynamicBadges} getVenueType={getVenueType} />
                </div>
              ))}
            </div>

            {/* Pagination Load More Button */}
            {processedEvents.length > gridEvents.length && (
              <div className="text-center pt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-4 cursor-pointer bg-zinc-900 border border-white/10 hover:border-white/20 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center justify-center gap-2 min-w-[180px] disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                      Cargando experiencias...
                    </>
                  ) : (
                    "Cargar más experiencias"
                  )}
                </button>
              </div>
            )}
          </div>

          {/* D. VENUE CATEGORIES SECTIONS (Only visible in search/filter = Todos) */}
          {searchQuery.trim() === "" && activeFilter === "Todos" && venueSliders.length > 0 && (
            <div className="space-y-16 pt-16 border-t border-white/5">
              <h3 className="text-2xl font-black text-white font-outfit uppercase tracking-wider text-center">Explorar por Establecimientos</h3>
              
              {venueSliders.map((slider) => (
                <div key={slider.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-black text-white uppercase tracking-wider font-outfit">{slider.label}</h4>
                    <div className="flex gap-1.5">
                      <button onClick={() => scrollLeftRef(`${slider.id}-slider`)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                      <button onClick={() => scrollRef(`${slider.id}-slider`)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="relative">
                    <div id={`${slider.id}-slider`} className="flex gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-4">
                      {slider.events.map(e => <Card key={e.id} event={e} getDynamicBadges={getDynamicBadges} getVenueType={getVenueType} />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Subcomponent: Premium Card
interface CardProps {
  event: ExtendedEvent;
  getDynamicBadges: (e: ExtendedEvent) => any[];
  getVenueType: (e: ExtendedEvent) => string;
}

function Card({ event, getDynamicBadges, getVenueType }: CardProps) {
  const capacity = (event as any).capacity ?? 350;
  const remaining = Math.max(capacity - event.attendeeCount, 0);
  const isSoldOut = event.attendeeCount >= capacity;
  const badges = getDynamicBadges(event);
  const venueType = getVenueType(event);
  const priceLabel = event.ticket_price > 0 ? `$${event.ticket_price.toLocaleString("es-CO")}` : "Gratis";

  return (
    <div className="min-w-[280px] sm:min-w-[340px] max-w-[340px] md:max-w-none w-full snap-center shrink-0 h-full flex flex-col group relative">
      <Link href={`/events/${slugify(event.title)}`} className="flex flex-col h-full w-full">
        <div className="glass-card overflow-hidden hover:border-white/20 hover:bg-[#09090f]/90 transition-all duration-500 flex flex-col h-full group bg-[#07070c]/90 border border-white/5 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_35px_rgba(217,70,239,0.08)]">
          {/* Visual Header */}
          <div className="relative h-48 w-full bg-zinc-950 overflow-hidden shrink-0">
            <img
              src={getEventImage(event.image_url, event.id)}
              alt={event.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05050a] via-transparent to-black/30" />

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
              {badges.map((badge, idx) => (
                <span
                  key={idx}
                  className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border select-none ${badge.className}`}
                >
                  {badge.text}
                </span>
              ))}
            </div>

            {/* Price Tag Overlay */}
            <span className="absolute top-4 right-4 bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-400 select-none shadow-md">
              {priceLabel}
            </span>

            {/* Countdown Overlay */}
            <div className="absolute bottom-4 right-4 z-10 shadow-lg">
              <EventCountdown targetDate={event.event_date} variant="compact" />
            </div>
          </div>

          {/* Details Section */}
          <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              {/* Category & Place type */}
              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                <span>{event.category || "Experiencia"}</span>
                <span>{venueType}</span>
              </div>

              {/* Event title */}
              <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-primary-400 transition-colors font-outfit leading-snug">
                {event.title}
              </h3>

              {/* Organizer details */}
              <p className="text-[10px] text-zinc-400 font-medium">
                Por <span className="text-zinc-300 font-semibold">{event.creator?.full_name || "Organizador Hangover"}</span>
              </p>

              {/* Real-time Indicator Statistics */}
              <div className="flex flex-col gap-1 pt-1.5 text-[10px] text-zinc-500 border-t border-white/5">
                {isSoldOut ? (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    ⚠️ Capacidad Completa agotada
                  </span>
                ) : remaining <= 20 ? (
                  <span className="text-orange-400 font-bold animate-pulse flex items-center gap-1">
                    🔥 ¡Solo quedan {remaining} entradas!
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-medium">
                    <Ticket className="w-3.5 h-3.5 text-zinc-650" />
                    {remaining} entradas disponibles
                  </span>
                )}
                <span className="flex items-center gap-1 font-medium">
                  <Users className="w-3.5 h-3.5 text-zinc-650" />
                  {event.favoritesCount + event.attendeeCount + 12} personas interesadas
                </span>
                {event.salesTodayCount > 0 && (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    🔥 {event.salesTodayCount} entradas vendidas hoy
                  </span>
                )}
              </div>
            </div>

            {/* Location & Date */}
            <div className="space-y-2 text-xs text-zinc-350 pt-2 border-t border-white/5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-400 shrink-0" />
                <span className="capitalize text-[11px] font-semibold truncate">
                  {new Date(event.event_date).toLocaleDateString("es-ES", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="truncate text-[11px] font-medium">{event.location}</span>
              </div>
            </div>

            {/* Card Action Button (Non-purchasing) */}
            <div className="pt-2">
              <div className="w-full bg-white/5 border border-white/10 group-hover:bg-primary-600/10 group-hover:border-primary-500/35 group-hover:text-primary-300 text-zinc-300 rounded-xl py-3 px-4 text-xs font-bold text-center transition-all duration-300 flex items-center justify-center gap-1.5">
                Ver Evento Completo
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
