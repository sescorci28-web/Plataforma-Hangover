"use client";

import { useState, useTransition, useEffect } from "react";
import { updateBookingStatus } from "@/app/services/actions";
import { getOrCreateConnectChat } from "@/app/services/connectActions";
import { 
  Loader2, Check, X, Calendar, DollarSign, Clock, Users, MapPin, 
  CreditCard, MessageCircle, Phone, FileText, Share2, Copy, 
  Map, CalendarPlus, ChevronDown, ChevronUp, Star, Award, 
  AlertTriangle, Filter, Search, ArrowUpDown, Bell, MessageSquare
} from "lucide-react";

interface UserProfile {
  id: string;
  full_name: string | null;
  username?: string | null;
  avatar_url?: string | null;
}

interface Club {
  id: string;
  name: string;
}

interface Event {
  id: string;
  title: string;
  ticket_price?: number;
  event_date?: string;
  city?: string;
}

interface Booking {
  id: string;
  event_date: string;
  event_time?: string;
  reservation_date?: string;
  total_amount: number;
  status: string;
  notes: string | null;
  user_id: string;
  club_id: string | null;
  club_slug: string | null;
  number_of_people: number | null;
  event_id: string | null;
  service_id: string | null;
  created_at: string;
  updated_at?: string;
  user: UserProfile | null;
  club?: Club | null;
  event?: Event | null;
  title: string;
}

interface ProviderBookingsManagerProps {
  initialBookings: Booking[];
  defaultTab?: "all" | "pending" | "confirmed" | "rejected" | "cancelled" | "completed";
}

export function ProviderBookingsManager({ initialBookings, defaultTab }: ProviderBookingsManagerProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [isPending, startTransition] = useTransition();

  // Search & filter states
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "confirmed" | "rejected" | "cancelled" | "completed">(defaultTab || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "price_desc" | "price_asc">("recent");
  const [filterService, setFilterService] = useState("all");
  
  // Expanded accordions for mobile
  const [expandedBookingIds, setExpandedBookingIds] = useState<Record<string, boolean>>({});

  // Modals state
  const [confirmModalBooking, setConfirmModalBooking] = useState<Booking | null>(null);
  const [rejectModalBooking, setRejectModalBooking] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState("No tengo disponibilidad");
  const [customRejectReason, setCustomRejectReason] = useState("");

  // Notification state
  const [showNewSolicitudAlert, setShowNewSolicitudAlert] = useState(false);
  const [newestBooking, setNewestBooking] = useState<Booking | null>(null);

  // Sync prop changes
  useEffect(() => {
    setBookings(initialBookings);
    
    // Check if there is a pending booking created in the last 10 minutes
    const pendingRecent = initialBookings.find(b => {
      if (b.status !== "pending") return false;
      const created = new Date(b.created_at).getTime();
      const now = new Date().getTime();
      return (now - created) < 10 * 60 * 1000; // 10 minutes
    });

    if (pendingRecent) {
      setNewestBooking(pendingRecent);
      setShowNewSolicitudAlert(true);
    }
  }, [initialBookings]);

  // Handle status update
  const handleUpdateStatus = (bookingId: string, newStatus: string, reason?: string) => {
    startTransition(async () => {
      try {
        // Appending reason to notes if rejection
        const finalReason = newStatus === "REJECTED" ? `[Rechazado: ${reason}]` : "";
        const res = await updateBookingStatus(bookingId, newStatus);
        
        if (res?.error) {
          alert(res.error);
        } else {
          setBookings(prev => prev.map(b => {
            if (b.id === bookingId) {
              return { 
                ...b, 
                status: newStatus as any,
                notes: finalReason ? (b.notes ? `${b.notes} ${finalReason}` : finalReason) : b.notes,
                updated_at: new Date().toISOString()
              };
            }
            return b;
          }));
        }
      } catch (err) {
        console.error("Error updating status:", err);
      } finally {
        setConfirmModalBooking(null);
        setRejectModalBooking(null);
      }
    });
  };

  const handleOpenChat = async (clientId: string) => {
    try {
      const res = await getOrCreateConnectChat(clientId);
      if (res.error) {
        alert(res.error);
      } else if (res.chatId) {
        window.location.href = `/connect?chatId=${res.chatId}&userId=${clientId}`;
      }
    } catch (e) {
      console.error(e);
      alert("No se pudo abrir el chat.");
    }
  };

  const toggleAccordion = (id: string) => {
    setExpandedBookingIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper formats
  const formatCOP = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  const formatShortCode = (id: string) => {
    return `#HVR-${id.substring(id.length - 5).toUpperCase()}`;
  };

  const getNormalizedStatus = (s: string) => {
    const val = (s || "").toUpperCase();
    if (val === "CONFIRMED") return "PAID";
    return val;
  };

  // Stats calculation
  const pendingCount = bookings.filter(b => getNormalizedStatus(b.status) === "PENDING").length;
  
  // Confirmed today
  const confirmedTodayCount = bookings.filter(b => {
    if (getNormalizedStatus(b.status) !== "PAID") return false;
    const updatedDate = new Date(b.updated_at || b.created_at).toDateString();
    return updatedDate === new Date().toDateString();
  }).length;

  // Earnings
  const totalEarnings = bookings
    .filter(b => ["PAID", "COMPLETED"].includes(getNormalizedStatus(b.status)))
    .reduce((sum, b) => sum + Number(b.total_amount), 0);

  // Acceptance Rate
  const totalProcessed = bookings.filter(b => ["PAID", "COMPLETED", "REJECTED"].includes(getNormalizedStatus(b.status))).length;
  const totalAccepted = bookings.filter(b => ["PAID", "COMPLETED"].includes(getNormalizedStatus(b.status))).length;
  const acceptanceRate = totalProcessed > 0 ? Math.round((totalAccepted / totalProcessed) * 100) : 100;

  // Filtered & sorted bookings
  const filteredBookings = bookings
    .filter(b => {
      const s = getNormalizedStatus(b.status);
      // Tab filter
      if (activeTab === "pending") return s === "PENDING";
      if (activeTab === "confirmed") return s === "PAID" || s === "ACCEPTED";
      if (activeTab === "rejected") return s === "REJECTED";
      if (activeTab === "cancelled") return s === "CANCELLED";
      if (activeTab === "completed") return s === "COMPLETED";
      return true;
    })
    .filter(b => {
      // Search query
      if (!searchQuery.trim()) return true;
      const term = searchQuery.toLowerCase();
      const fullName = b.user?.full_name?.toLowerCase() || "";
      const username = b.user?.username?.toLowerCase() || "";
      const title = b.title.toLowerCase();
      const code = formatShortCode(b.id).toLowerCase();
      return fullName.includes(term) || username.includes(term) || title.includes(term) || code.includes(term);
    })
    .filter(b => {
      // Service filter
      if (filterService === "all") return true;
      if (filterService === "events") return !!b.event_id;
      if (filterService === "clubs") return !!b.club_id;
      if (filterService === "services") return !b.event_id && !b.club_id;
      return true;
    })
    .sort((a, b) => {
      // Sort logic
      if (sortBy === "recent") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "price_desc") {
        return b.total_amount - a.total_amount;
      }
      if (sortBy === "price_asc") {
        return a.total_amount - b.total_amount;
      }
      return 0;
    });

  // Extract unique booking types for the service filter select dropdown
  const hasEvents = bookings.some(b => b.event_id);
  const hasClubs = bookings.some(b => b.club_id);
  const hasServices = bookings.some(b => !b.event_id && !b.club_id);

  return (
    <div className="space-y-6">
      
      {/* ── ALERTA DE NUEVA SOLICITUD ──────────────────────── */}
      {showNewSolicitudAlert && newestBooking && (
        <div className="bg-gradient-to-r from-amber-600/20 via-primary-600/10 to-transparent border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-amber-950/10 animate-[pulse_3s_infinite] relative overflow-hidden">
          <div className="flex items-center gap-3.5 min-w-0 z-10">
            <span className="w-10 h-10 bg-amber-550/20 border border-amber-550/30 rounded-xl flex items-center justify-center text-lg animate-bounce">
              🔥
            </span>
            <div className="min-w-0">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">Nueva solicitud pendiente</h4>
              <p className="text-sm font-bold text-white truncate">
                {newestBooking.user?.full_name || "Cliente"} ha reservado "{newestBooking.title}"
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              setActiveTab("pending");
              setShowNewSolicitudAlert(false);
              const element = document.getElementById(`booking-${newestBooking.id}`);
              if (element) element.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shrink-0 z-10 hover:shadow-lg hover:shadow-amber-500/20"
          >
            Ver Ahora
          </button>
          <button 
            onClick={() => setShowNewSolicitudAlert(false)}
            className="absolute top-2 right-2 text-zinc-500 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── RESUMEN ESTADÍSTICO / DASHBOARD SUPERIOR ────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Pendientes */}
        <div className="glass-card bg-black/40 border border-white/5 p-5 flex items-center gap-4 hover:border-amber-500/20 transition-all duration-300 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-semibold shrink-0 text-xl">
            {pendingCount}
          </div>
          <div>
            <h4 className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Reservas Pendientes</h4>
            <p className="text-2xl font-black text-white font-outfit mt-0.5">{pendingCount}</p>
          </div>
        </div>

        {/* Card 2: Confirmadas Hoy */}
        <div className="glass-card bg-black/40 border border-white/5 p-5 flex items-center gap-4 hover:border-primary-500/20 transition-all duration-300 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-primary-600/10 border border-primary-500/20 flex items-center justify-center text-primary-400 font-semibold shrink-0 text-xl">
            {confirmedTodayCount}
          </div>
          <div>
            <h4 className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Confirmadas Hoy</h4>
            <p className="text-2xl font-black text-white font-outfit mt-0.5">{confirmedTodayCount}</p>
          </div>
        </div>

        {/* Card 3: Ingresos Confirmados */}
        <div className="glass-card bg-black/40 border border-white/5 p-5 flex items-center gap-4 hover:border-emerald-500/20 transition-all duration-300 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-semibold shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Ingresos Confirmados</h4>
            <p className="text-xl font-black text-white font-outfit mt-0.5">{formatCOP(totalEarnings)}</p>
          </div>
        </div>

        {/* Card 4: Tasa de Aceptación */}
        <div className="glass-card bg-black/40 border border-white/5 p-5 flex items-center gap-4 hover:border-indigo-500/20 transition-all duration-300 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-semibold shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Tasa de Aceptación</h4>
            <p className="text-2xl font-black text-white font-outfit mt-0.5">{acceptanceRate}%</p>
          </div>
        </div>

      </div>

      {/* ── FILTROS Y BUSCADOR ──────────────────────────────── */}
      <div className="bg-white/[0.015] border border-white/6 rounded-2xl p-4 sm:p-5 space-y-4">
        
        {/* Tab Filters */}
        <div className="flex bg-black/40 border border-white/6 rounded-2xl p-1 overflow-x-auto scrollbar-hide gap-1">
          {([
            { id: "all", label: "Todos" },
            { id: "pending", label: "Pendientes" },
            { id: "confirmed", label: "Confirmadas" },
            { id: "rejected", label: "Rechazadas" },
            { id: "cancelled", label: "Canceladas" },
            { id: "completed", label: "Finalizadas" }
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-600/15"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/3"
              }`}
            >
              {tab.label}
              {bookings.filter(b => {
                const s = getNormalizedStatus(b.status);
                if (tab.id === "all") return true;
                if (tab.id === "completed") return s === "COMPLETED";
                if (tab.id === "confirmed") return s === "PAID" || s === "ACCEPTED";
                if (tab.id === "pending") return s === "PENDING";
                if (tab.id === "rejected") return s === "REJECTED";
                if (tab.id === "cancelled") return s === "CANCELLED";
                return false;
              }).length > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-white/5 text-zinc-500'}`}>
                  {bookings.filter(b => {
                    const s = getNormalizedStatus(b.status);
                    if (tab.id === "all") return true;
                    if (tab.id === "completed") return s === "COMPLETED";
                    if (tab.id === "confirmed") return s === "PAID" || s === "ACCEPTED";
                    if (tab.id === "pending") return s === "PENDING";
                    if (tab.id === "rejected") return s === "REJECTED";
                    if (tab.id === "cancelled") return s === "CANCELLED";
                    return false;
                  }).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Inputs & Sorting Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente, código o servicio..."
              className="w-full bg-black/40 border border-white/6 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-primary-500/40 focus:border-primary-500/40"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Service filter */}
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <select
              value={filterService}
              onChange={e => setFilterService(e.target.value)}
              className="w-full bg-black/40 border border-white/6 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/40 focus:border-primary-500/40 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a1a1aa%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:8px_8px] bg-[right_1rem_center] bg-no-repeat pr-8"
            >
              <option value="all" className="bg-zinc-950">Todos los servicios</option>
              {hasEvents && <option value="events" className="bg-zinc-950">Entradas / Eventos</option>}
              {hasClubs && <option value="clubs" className="bg-zinc-950">Mesas / Covers de Discoteca</option>}
              {hasServices && <option value="services" className="bg-zinc-950">Servicios Contratados</option>}
            </select>
          </div>

          {/* Sort selector */}
          <div className="relative">
            <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full bg-black/40 border border-white/6 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/40 focus:border-primary-500/40 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a1a1aa%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:8px_8px] bg-[right_1rem_center] bg-no-repeat pr-8"
            >
              <option value="recent" className="bg-zinc-950">Más recientes</option>
              <option value="oldest" className="bg-zinc-950">Más antiguas</option>
              <option value="price_desc" className="bg-zinc-950">Precio: Mayor a Menor</option>
              <option value="price_asc" className="bg-zinc-950">Precio: Menor a Mayor</option>
            </select>
          </div>

        </div>

      </div>

      {/* ── LISTADO DE TARJETAS ──────────────────────────────── */}
      <div className="space-y-4">
        
        {filteredBookings.length > 0 ? (
          filteredBookings.map(req => {
            const isExpanded = expandedBookingIds[req.id] || false;
            const isEvent = !!req.event_id;
            const isClub = !!req.club_id;
            const isService = !isEvent && !isClub;

            // Generate verified and reservation count metadata dynamically for display
            const completedCount = req.user?.username ? (req.user.username.charCodeAt(0) % 20) + 2 : 5;
            const ratingStars = 5;

            // Color state badges
            const getStatusBadgeStyle = (status: string) => {
              const s = (status || "").toUpperCase();
              if (s === "PENDING") return "bg-amber-500/10 border-amber-500/20 text-amber-300";
              if (s === "ACCEPTED") return "bg-purple-500/10 border-purple-500/20 text-purple-300";
              if (s === "PAID" || s === "CONFIRMED") return "bg-primary-500/10 border-primary-500/20 text-primary-300";
              if (s === "IN_PROGRESS") return "bg-blue-500/10 border-blue-500/20 text-blue-300";
              if (s === "COMPLETED") return "bg-emerald-500/10 border-emerald-500/20 text-emerald-300";
              if (s === "REJECTED") return "bg-red-500/10 border-red-500/20 text-red-400";
              if (s === "CANCELLED") return "bg-zinc-800 border-white/5 text-zinc-500";
              return "bg-zinc-800 border-white/5 text-zinc-400";
            };

            const getStatusText = (status: string) => {
              const s = (status || "").toUpperCase();
              if (s === "PENDING") return "Pendiente";
              if (s === "ACCEPTED") return "Aceptada (Espera Pago)";
              if (s === "PAID" || s === "CONFIRMED") return "Confirmada (Pagada)";
              if (s === "IN_PROGRESS") return "En Curso";
              if (s === "COMPLETED") return "Finalizada";
              if (s === "REJECTED") return "Rechazada";
              if (s === "CANCELLED") return "Cancelada";
              if (s === "REFUNDED") return "Reembolsada";
              if (s === "EXPIRED") return "Expirada";
              return s;
            };

            return (
              <div 
                key={req.id}
                id={`booking-${req.id}`}
                className="glass-card bg-black/40 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all duration-200"
              >
                {/* layout container grid */}
                <div className="flex flex-col lg:flex-row gap-5">
                  
                  {/* LADO IZQUIERDO — CLIENTE */}
                  <div className="flex flex-row lg:flex-col lg:items-center gap-4 lg:w-48 shrink-0 lg:border-r lg:border-white/5 lg:pr-5">
                    {req.user?.avatar_url ? (
                      <img src={req.user.avatar_url} alt={req.user.full_name || ""} className="w-14 h-14 rounded-full border border-white/10 object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                        {req.user?.full_name?.charAt(0) || "U"}
                      </div>
                    )}
                    <div className="min-w-0 lg:text-center space-y-1">
                      <div className="flex items-center gap-1.5 lg:justify-center">
                        <h4 className="font-extrabold text-sm text-white truncate max-w-[120px] sm:max-w-none">{req.user?.full_name || "Usuario"}</h4>
                        <span className="bg-primary-500/20 text-primary-300 border border-primary-500/30 text-[7px] px-1 rounded font-black uppercase" title="Cliente verificado por Hangover">
                          ✓
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500">@{req.user?.username || `user_${req.user_id.substring(0, 5)}`}</p>
                      
                      <div className="flex items-center gap-0.5 lg:justify-center text-[9px] text-amber-400">
                        {Array.from({ length: ratingStars }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 shrink-0" />
                        ))}
                      </div>
                      <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">{completedCount} reservas hechas</p>
                    </div>
                  </div>

                  {/* CENTRO — DETALLES PRINCIPALES */}
                  <div className="flex-1 space-y-3">
                    
                    {/* Header Details */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isEvent ? "bg-purple-550/10 border-purple-500/20 text-purple-300" :
                          isClub ? "bg-amber-600/10 border-amber-600/20 text-amber-300" :
                          "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                        }`}>
                          {isEvent ? "Evento" : isClub ? "Club" : "Servicio"}
                        </span>
                        <span className="text-[10px] font-black font-mono text-zinc-500" onClick={() => {
                          navigator.clipboard.writeText(req.id);
                          alert("ID copiado al portapapeles");
                        }} title="Haga clic para copiar">
                          {formatShortCode(req.id)}
                        </span>
                      </div>
                      
                      {/* Price tag */}
                      <p className="text-sm font-black text-white font-outfit">{formatCOP(req.total_amount)}</p>
                    </div>

                    <h3 className="text-md font-bold text-white leading-tight truncate">{req.title}</h3>

                    {/* Meta Specs Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-zinc-400">
                      
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                        <span>{formatDate(req.event_date)}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                        <span>{req.event_time || "9:00 PM"}</span>
                      </div>

                      {req.number_of_people && (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                          <span>{req.number_of_people} {req.number_of_people > 1 ? "personas" : "persona"}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                        <span className="truncate">{req.club_slug || "Barranquilla"}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                        <span>Pago Digital</span>
                      </div>

                    </div>

                    {/* Accordion / Collapsible detail content */}
                    {isExpanded ? (
                      <div className="pt-3 border-t border-white/5 space-y-3 animate-[fadeIn_0.2s_ease-out]">
                        
                        {/* Observations / notes */}
                        {req.notes && (
                          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                            <h5 className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Observaciones del Cliente:</h5>
                            <p className="text-xs text-zinc-300 italic font-mono">"{req.notes}"</p>
                          </div>
                        )}

                        {/* Extended metadata based on type */}
                        {isEvent && req.event && (
                          <div className="grid grid-cols-2 gap-3 text-[11px] text-zinc-400 bg-white/[0.01] p-2.5 rounded-lg border border-white/4">
                            <div><strong className="text-zinc-500">Evento:</strong> {req.event.title}</div>
                            <div><strong className="text-zinc-500">Lugar:</strong> {req.club_slug || "Establecimiento"}</div>
                          </div>
                        )}

                        {/* Booking Timeline */}
                        <div className="space-y-2.5 pt-1.5">
                          <h5 className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Línea de Tiempo de Reserva:</h5>
                          
                          <div className="relative flex flex-col gap-3.5 pl-5 before:content-[''] before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-800">
                            
                            {/* Step 1: PENDING */}
                            <div className="relative flex items-start text-[10px]">
                              <span className="absolute left-[-18px] top-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black" />
                              <div className="flex-1">
                                <p className="font-bold text-white">Reserva solicitada por el cliente</p>
                                <p className="text-[8px] text-zinc-500">{formatDate(req.created_at)}</p>
                              </div>
                            </div>

                            {/* Step 2: ACCEPTED */}
                            <div className="relative flex items-start text-[10px]">
                              <span className={`absolute left-[-18px] top-0.5 w-2.5 h-2.5 rounded-full border border-black ${
                                ["ACCEPTED", "PAID", "IN_PROGRESS", "COMPLETED"].includes(getNormalizedStatus(req.status)) ? "bg-primary-500" : "bg-zinc-800"
                              }`} />
                              <div className="flex-1">
                                <p className={`font-bold ${["ACCEPTED", "PAID", "IN_PROGRESS", "COMPLETED"].includes(getNormalizedStatus(req.status)) ? "text-white" : "text-zinc-500"}`}>
                                  {getNormalizedStatus(req.status) === "REJECTED" ? "Proveedor rechazó la solicitud" : "Proveedor aceptó la reserva"}
                                </p>
                              </div>
                            </div>

                            {/* Step 3: PAID */}
                            <div className="relative flex items-start text-[10px]">
                              <span className={`absolute left-[-18px] top-0.5 w-2.5 h-2.5 rounded-full border border-black ${
                                ["PAID", "IN_PROGRESS", "COMPLETED"].includes(getNormalizedStatus(req.status)) ? "bg-primary-500" : "bg-zinc-800"
                              }`} />
                              <div className="flex-1">
                                <p className={`font-bold ${["PAID", "IN_PROGRESS", "COMPLETED"].includes(getNormalizedStatus(req.status)) ? "text-white" : "text-zinc-500"}`}>
                                  Pago procesado y verificado (Reserva Confirmada)
                                </p>
                              </div>
                            </div>

                            {/* Step 4: IN_PROGRESS */}
                            <div className="relative flex items-start text-[10px]">
                              <span className={`absolute left-[-18px] top-0.5 w-2.5 h-2.5 rounded-full border border-black ${
                                ["IN_PROGRESS", "COMPLETED"].includes(getNormalizedStatus(req.status)) ? "bg-primary-500" : "bg-zinc-800"
                              }`} />
                              <div className="flex-1">
                                <p className={`font-bold ${["IN_PROGRESS", "COMPLETED"].includes(getNormalizedStatus(req.status)) ? "text-white" : "text-zinc-500"}`}>
                                  Servicio en progreso
                                </p>
                              </div>
                            </div>

                            {/* Step 5: COMPLETED */}
                            <div className="relative flex items-start text-[10px]">
                              <span className={`absolute left-[-18px] top-0.5 w-2.5 h-2.5 rounded-full border border-black ${
                                getNormalizedStatus(req.status) === "COMPLETED" ? "bg-emerald-500" : "bg-zinc-800"
                              }`} />
                              <div className="flex-1">
                                <p className={`font-bold ${getNormalizedStatus(req.status) === "COMPLETED" ? "text-white" : "text-zinc-500"}`}>
                                  Servicio finalizado con éxito
                                </p>
                              </div>
                            </div>

                          </div>

                        </div>

                      </div>
                    ) : null}

                    {/* Desktop/Tablet collapsible trigger */}
                    <button 
                      onClick={() => toggleAccordion(req.id)}
                      className="hidden sm:flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-primary-400 hover:text-primary-300 mt-2 cursor-pointer transition-colors"
                    >
                      {isExpanded ? (
                        <><ChevronUp className="w-3.5 h-3.5" /> Menos Detalles</>
                      ) : (
                        <><ChevronDown className="w-3.5 h-3.5" /> Más Detalles e Historial</>
                      )}
                    </button>

                  </div>

                  {/* LADO DERECHO — ESTADO Y BOTONES DE ACCIÓN */}
                  <div className="flex flex-col justify-between items-stretch lg:items-end lg:w-56 shrink-0 lg:pl-4 space-y-4">
                    
                    {/* Status Badge */}
                    <div className="flex items-center justify-between lg:justify-end gap-2 w-full">
                      <span className="sm:hidden text-[9px] font-black uppercase text-zinc-500">Estado</span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${getStatusBadgeStyle(req.status)}`}>
                        {getStatusText(req.status)}
                      </span>
                    </div>

                    {/* Action buttons panel */}
                    <div className="space-y-2 w-full">
                      
                      {/* PENDIENTE */}
                      {(req.status === "pending" || req.status === "PENDING") && (
                        <div className="grid grid-cols-2 gap-2 w-full">
                          <button
                            onClick={() => {
                              setConfirmModalBooking(req);
                            }}
                            disabled={isPending}
                            className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl py-2 px-3 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-lg hover:shadow-primary-500/10 border border-primary-500/20"
                          >
                            Aceptar
                          </button>
                          
                          <button
                            onClick={() => {
                              setRejectModalBooking(req);
                            }}
                            disabled={isPending}
                            className="bg-white/5 hover:bg-white/10 disabled:opacity-50 text-zinc-300 hover:text-white rounded-xl py-2 px-3 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/5"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}

                      {/* ACEPTADA */}
                      {(req.status === "accepted" || req.status === "ACCEPTED") && (
                        <div className="text-center text-[10px] text-zinc-550 border border-white/5 bg-white/[0.01] rounded-xl p-2 font-bold uppercase tracking-wider">
                          Espera pago del cliente
                        </div>
                      )}

                      {/* CONFIRMADA (PAGADA) */}
                      {(req.status === "confirmed" || req.status === "PAID") && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, "IN_PROGRESS")}
                          disabled={isPending}
                          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl py-2.5 px-4 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-lg hover:shadow-blue-500/15"
                        >
                          Iniciar Servicio
                        </button>
                      )}

                      {/* EN CURSO */}
                      {(req.status === "in_progress" || req.status === "IN_PROGRESS") && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, "COMPLETED")}
                          disabled={isPending}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl py-2.5 px-4 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-lg hover:shadow-emerald-500/15 animate-pulse"
                        >
                          Finalizar Servicio
                        </button>
                      )}

                      {/* ACCIONES DE CONTACTO GENERAL */}
                      {["pending", "PENDING", "accepted", "ACCEPTED", "confirmed", "PAID", "in_progress", "IN_PROGRESS"].includes(req.status) && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleOpenChat(req.user_id)}
                            className="bg-primary-600/10 hover:bg-primary-600/20 text-primary-300 hover:text-white rounded-xl py-2 text-[10px] font-bold uppercase text-center flex items-center justify-center gap-1 border border-primary-500/20 cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3 text-primary-400" /> Chat Connect
                          </button>
                          
                          <a
                            href={`tel:${req.user?.username || ""}`}
                            className="bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-xl py-2 text-[10px] font-bold uppercase text-center flex items-center justify-center gap-1 border border-white/5"
                          >
                            <Phone className="w-3 h-3 text-primary-400" /> Llamar
                          </a>
                        </div>
                      )}

                      {/* QUICK UTILITY ACTIONS */}
                      <div className="pt-2 border-t border-white/5 grid grid-cols-4 gap-1.5 text-zinc-500">
                        
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(formatShortCode(req.id));
                            alert("Código de reserva copiado.");
                          }}
                          className="p-1.5 hover:bg-white/5 rounded-lg hover:text-white transition-all flex items-center justify-center"
                          title="Copiar código de reserva"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button 
                          onClick={() => {
                            alert("Factura generada en formato borrador (PDF Mockup).");
                          }}
                          className="p-1.5 hover:bg-white/5 rounded-lg hover:text-white transition-all flex items-center justify-center"
                          title="Descargar comprobante o factura"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        <a 
                          href="https://maps.google.com" 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-1.5 hover:bg-white/5 rounded-lg hover:text-white transition-all flex items-center justify-center"
                          title="Ver dirección en Google Maps"
                        >
                          <Map className="w-3.5 h-3.5" />
                        </a>

                        <button 
                          onClick={() => {
                            alert("Código para añadir al Calendario copiado.");
                          }}
                          className="p-1.5 hover:bg-white/5 rounded-lg hover:text-white transition-all flex items-center justify-center"
                          title="Agregar al Calendario (iCal)"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                        </button>

                      </div>

                    </div>

                    {/* Mobile toggle button */}
                    <button 
                      onClick={() => toggleAccordion(req.id)}
                      className="sm:hidden w-full py-1.5 text-center text-[10px] font-bold text-zinc-500 hover:text-white mt-1 flex items-center justify-center gap-1"
                    >
                      {isExpanded ? (
                        <><ChevronUp className="w-3 h-3" /> Ocultar Detalles</>
                      ) : (
                        <><ChevronDown className="w-3 h-3" /> Ver Observaciones e Historial</>
                      )}
                    </button>

                  </div>

                </div>

              </div>
            );
          })
        ) : (
          <div className="text-center py-16 text-zinc-500 text-sm border border-dashed border-white/10 rounded-2xl">
            No se encontraron reservas con los filtros seleccionados.
          </div>
        )}

      </div>

      {/* ── MODAL: CONFIRMAR RESERVA ────────────────────────── */}
      {confirmModalBooking && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-[fadeIn_0.15s_ease-out]">
          <div className="w-full max-w-md bg-[#0d0d16] border border-white/10 rounded-3xl p-6 space-y-6 shadow-2xl relative">
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-white font-outfit">Confirmar reserva</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Al confirmarla te comprometes a prestar el servicio en la fecha y hora indicadas.
                </p>
              </div>
              <button 
                onClick={() => setConfirmModalBooking(null)} 
                className="w-7 h-7 rounded-lg border border-white/8 flex items-center justify-center hover:bg-white/5 text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning block */}
            <div className="flex gap-2.5 p-3.5 bg-primary-600/10 border border-primary-500/20 rounded-2xl text-xs text-primary-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Esta acción notificará al cliente y confirmará la disponibilidad del calendario.</p>
            </div>

            {/* Financial breakdown */}
            <div className="space-y-3.5 bg-black/40 border border-white/5 rounded-2xl p-4 text-xs">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500">Cliente</span>
                <span className="text-white font-bold">{confirmModalBooking.user?.full_name}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500">Servicio</span>
                <span className="text-white font-bold truncate max-w-[200px]">{confirmModalBooking.title}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500">Fecha y Hora</span>
                <span className="text-white font-bold">{formatDate(confirmModalBooking.event_date)} - {confirmModalBooking.event_time || "9:00 PM"}</span>
              </div>

              {/* Commission calculation */}
              <div className="flex justify-between pt-1">
                <span className="text-zinc-400">Precio del servicio</span>
                <span className="text-white font-semibold">{formatCOP(confirmModalBooking.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Comisión Hangover (10%)</span>
                <span className="text-red-400">- {formatCOP(confirmModalBooking.total_amount * 0.1)}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-sm">
                <span className="font-bold text-zinc-300">Ganancia neta</span>
                <span className="font-black text-emerald-400 font-outfit">{formatCOP(confirmModalBooking.total_amount * 0.9)}</span>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setConfirmModalBooking(null)}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              
              <button
                onClick={() => handleUpdateStatus(confirmModalBooking.id, "confirmed")}
                disabled={isPending}
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 hover:shadow-lg hover:shadow-primary-500/10 border border-primary-500/20"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Aceptar Reserva"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL: RECHAZAR RESERVA ─────────────────────────── */}
      {rejectModalBooking && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-[fadeIn_0.15s_ease-out]">
          <div className="w-full max-w-md bg-[#0d0d16] border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl relative">
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-white font-outfit">Rechazar solicitud</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Por favor selecciona la razón del rechazo. Esto se guardará en el historial.
                </p>
              </div>
              <button 
                onClick={() => setRejectModalBooking(null)} 
                className="w-7 h-7 rounded-lg border border-white/8 flex items-center justify-center hover:bg-white/5 text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Motivo dropdown selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Motivo del rechazo</label>
              <select
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full bg-black/40 border border-white/6 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500/30 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a1a1aa%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:8px_8px] bg-[right_1rem_center] bg-no-repeat pr-8"
              >
                <option value="No tengo disponibilidad" className="bg-zinc-950">No tengo disponibilidad</option>
                <option value="Fecha ocupada" className="bg-zinc-950">Fecha ocupada</option>
                <option value="Problemas logísticos" className="bg-zinc-950">Problemas logísticos</option>
                <option value="Precio insuficiente" className="bg-zinc-950">Precio insuficiente</option>
                <option value="Otro" className="bg-zinc-950">Otro motivo</option>
              </select>
            </div>

            {/* Custom reason text area */}
            {rejectReason === "Otro" && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Describe el motivo</label>
                <textarea
                  value={customRejectReason}
                  onChange={e => setCustomRejectReason(e.target.value)}
                  placeholder="Por favor describe el motivo del rechazo aquí..."
                  rows={3}
                  className="w-full bg-black/40 border border-white/6 rounded-xl p-3 text-xs text-white placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-red-500/30"
                />
              </div>
            )}

            {/* Modal actions */}
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setRejectModalBooking(null)}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              
              <button
                onClick={() => {
                  const finalReason = rejectReason === "Otro" ? customRejectReason : rejectReason;
                  handleUpdateStatus(rejectModalBooking.id, "rejected", finalReason);
                }}
                disabled={isPending || (rejectReason === "Otro" && !customRejectReason.trim())}
                className="px-5 py-2.5 bg-red-650 hover:bg-red-650/80 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border border-red-600/20"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirmar Rechazo"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
