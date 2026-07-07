"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  MapPin, 
  Smartphone, 
  Users, 
  QrCode, 
  Share2, 
  Heart, 
  Calendar, 
  History, 
  Sparkles, 
  Ticket, 
  MessageSquare, 
  Check, 
  LogOut, 
  Settings, 
  ChevronRight, 
  X, 
  Award, 
  AlertCircle, 
  ExternalLink,
  Shield,
  Activity,
  ChevronLeft,
  Info,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Zap,
  Plus,
  Trash2,
  CalendarDays,
  Compass,
  HelpCircle,
  Bell,
  Star,
  Loader2,
  Lock,
  Download,
  CalendarCheck,
  CreditCard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  updateActivePresenceStatus, 
  toggleFavoriteClub, 
  toggleFavoriteEvent, 
  toggleFavoriteService,
  getOrCreateConnectChat
} from "@/app/services/connectActions";
import { updateBookingStatus } from "@/app/services/actions";
import { logout } from "@/app/(auth)/actions";

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

interface UserDashboardClientProps {
  profile: any;
  userEmail: string;
  bookings: any[];
  clubs: any[];
  events: any[];
  services: any[];
  initialFavoriteClubs: string[];
  initialFavoriteEvents: string[];
  initialFavoriteServices: string[];
  presence: any;
  chatCount: number;
  pendingRequestCount: number;
  recentChats: any[];
  userNotifications: any[];
}

export function UserDashboardClient({
  profile,
  userEmail,
  bookings: initialBookings,
  clubs,
  events,
  services,
  initialFavoriteClubs,
  initialFavoriteEvents,
  initialFavoriteServices,
  presence: initialPresence,
  chatCount: initialChatCount,
  pendingRequestCount,
  recentChats: initialRecentChats,
  userNotifications: initialUserNotifications
}: UserDashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Local state for bookings, chats & notifications (allows instant updates)
  const [bookings, setBookings] = useState<any[]>(initialBookings || []);
  const [recentChats, setRecentChats] = useState<any[]>(initialRecentChats || []);
  const [userNotifications, setUserNotifications] = useState<any[]>(initialUserNotifications || []);

  // Local state for favorites (allows optimistic updates)
  const [favoriteClubs, setFavoriteClubs] = useState<string[]>(initialFavoriteClubs);
  const [favoriteEvents, setFavoriteEvents] = useState<string[]>(initialFavoriteEvents);
  const [favoriteServices, setFavoriteServices] = useState<string[]>(initialFavoriteServices);

  // Presence controls
  const [presence, setPresence] = useState(initialPresence);
  const [presenceStatus, setPresenceStatus] = useState<'available' | 'observing' | 'do_not_disturb'>(
    initialPresence?.status || 'available'
  );
  const [presenceVisibility, setPresenceVisibility] = useState<'visible' | 'invisible'>(
    initialPresence?.visibility || 'visible'
  );

  // UI state
  const [copiedProfile, setCopiedProfile] = useState(false);
  const [copiedQR, setCopiedQR] = useState(false);
  const [showLevelInfo, setShowLevelInfo] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Booking detail view & rating modals
  const [selectedDetailBooking, setSelectedDetailBooking] = useState<any | null>(null);
  const [ratingModalBooking, setRatingModalBooking] = useState<any | null>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  // Favorites Tab state
  const [activeFavTab, setActiveFavTab] = useState<"clubs" | "events" | "services">("clubs");

  // Bookings Tab state
  const [activeBookingsTab, setActiveBookingsTab] = useState<"active" | "pending" | "history">("active");

  // Resolve booking title & date helper
  const getBookingDetails = (booking: any) => {
    let title = "Reserva Hangover";
    let image = "";
    let slug = "";
    let type = "Mesas";

    if (booking.event_id) {
      const ev = events.find((e) => e.id === booking.event_id);
      title = ev?.title || booking.event_name || "Entrada de Evento";
      image = ev?.image_url || "";
      type = "Entrada";
    } else if (booking.club_id) {
      const cl = clubs.find((c) => c.id === booking.club_id);
      title = cl?.name || booking.club_slug || "Reserva de Discoteca";
      image = cl?.logo || cl?.images?.[0] || "";
      slug = cl?.slug || "";
      type = "Mesa VIP";
    } else if (booking.service_id) {
      const sv = services.find((s) => s.id === booking.service_id);
      title = sv?.title || "Servicio Contratado";
      image = sv?.images?.[0] || "";
      type = "Servicio";
    }
    return { title, image, slug, type };
  };

  // Compile User Level & Points
  const totalBookings = bookings.length;
  const totalFavorites = favoriteClubs.length + favoriteEvents.length + favoriteServices.length;
  const hasActivePresence = !!presence;
  const points = totalBookings * 3 + totalFavorites * 1 + (hasActivePresence ? 2 : 0);

  let levelName = "🌙 Explorador Nocturno";
  let levelColor = "from-zinc-500 to-zinc-400";
  let levelGlow = "shadow-zinc-500/10";
  let levelBadgeBg = "bg-zinc-500/10 text-zinc-300 border-zinc-500/20";
  let levelPointsRange = "0 - 2 pts";
  
  if (points >= 15) {
    levelName = "🔥 Miembro Activo";
    levelColor = "from-orange-500 via-red-500 to-yellow-500";
    levelGlow = "shadow-orange-500/25";
    levelBadgeBg = "bg-orange-500/10 text-orange-400 border-orange-500/20";
    levelPointsRange = "15+ pts";
  } else if (points >= 10) {
    levelName = "🍾 VIP Hangover";
    levelColor = "from-purple-600 to-pink-600";
    levelGlow = "shadow-purple-600/25";
    levelBadgeBg = "bg-purple-500/10 text-purple-400 border-purple-500/20";
    levelPointsRange = "10 - 14 pts";
  } else if (points >= 6) {
    levelName = "🎟 Fan de Eventos";
    levelColor = "from-blue-600 to-indigo-600";
    levelGlow = "shadow-blue-600/20";
    levelBadgeBg = "bg-blue-500/10 text-blue-400 border-blue-500/20";
    levelPointsRange = "6 - 9 pts";
  } else if (points >= 3) {
    levelName = "🍸 Socializador";
    levelColor = "from-emerald-500 to-teal-600";
    levelGlow = "shadow-emerald-500/20";
    levelBadgeBg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    levelPointsRange = "3 - 5 pts";
  }

  // Compile Live Presence Venue
  let activeVenueName = "";
  let activeVenueSlug = "";
  if (presence) {
    if (presence.club_id) {
      const club = clubs.find((c) => c.id === presence.club_id);
      activeVenueName = club?.name || "Discoteca";
      activeVenueSlug = `/discotecas/${club?.slug || ""}`;
    } else if (presence.event_id) {
      const ev = events.find((e) => e.id === presence.event_id);
      activeVenueName = ev?.title || "Evento";
      activeVenueSlug = `/events/${ev?.id || ""}`;
    }
  }

  // Normalize Bookings
  const normalizedBookings = bookings.map((booking: any) => {
    const { title, image, slug, type } = getBookingDetails(booking);
    return {
      ...booking,
      title,
      image,
      slug,
      type,
      displayDate: booking.reservation_date || booking.event_date
    };
  });

  // Compile active, pending & history bookings
  const activeBookings = normalizedBookings.filter((b) => 
    ["PAID", "IN_PROGRESS"].includes(b.status.toUpperCase())
  );
  
  const pendingBookings = normalizedBookings.filter((b) => 
    ["PENDING", "ACCEPTED", "DRAFT"].includes(b.status.toUpperCase())
  );
  
  const historyBookings = normalizedBookings.filter((b) => 
    ["COMPLETED", "CANCELLED", "REJECTED", "REFUNDED", "EXPIRED"].includes(b.status.toUpperCase())
  );

  // Compile Upcoming Active Booking (Closest)
  const now = new Date();
  const upcomingBookings = activeBookings
    .filter((b) => {
      const bDate = new Date(b.displayDate);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const bookingDay = new Date(bDate.getFullYear(), bDate.getMonth(), bDate.getDate());
      return bookingDay >= today;
    })
    .sort((a, b) => new Date(a.displayDate).getTime() - new Date(b.displayDate).getTime());

  const mainUpcoming = upcomingBookings[0] || null;

  // Compile Past Nocturnal History
  const pastBookings = historyBookings.filter(b => b.status.toUpperCase() === "COMPLETED");

  // Compile Personal Stats
  const totalClubsVisited = new Set(historyBookings.map(b => b.club_id).filter(Boolean)).size;
  const totalServicesContracted = bookings.filter(b => b.service_id).length;
  const totalMoneySpent = bookings.reduce((sum, b) => 
    ["PAID", "COMPLETED"].includes(b.status.toUpperCase()) ? sum + (b.total_amount || 0) : sum, 0
  );
  const yearsUsingHangover = Math.max(1, new Date().getFullYear() - new Date(profile.created_at).getFullYear());

  // Insignias (Logros System)
  const achievements = [
    {
      id: "first_booking",
      title: "Primera Reserva",
      desc: "Realizaste tu primer plan en Hangover.",
      icon: "🎟️",
      unlocked: bookings.length >= 1,
      date: bookings.length >= 1 ? new Date(bookings[bookings.length - 1].created_at).toLocaleDateString("es-ES") : null
    },
    {
      id: "night_explorer",
      title: "Explorador Nocturno",
      desc: "Has visitado 3 o más discotecas diferentes.",
      icon: "🍾",
      unlocked: totalClubsVisited >= 3,
      date: totalClubsVisited >= 3 ? "Desbloqueado" : null
    },
    {
      id: "vip_access",
      title: "Noches VIP",
      desc: "Reservaste una Mesa VIP premium.",
      icon: "👑",
      unlocked: bookings.some(b => b.booking_type === "club_vip"),
      date: bookings.some(b => b.booking_type === "club_vip") ? "Desbloqueado" : null
    },
    {
      id: "verified_client",
      title: "Cliente Verificado",
      desc: "Identidad verificada en el ecosistema Hangover.",
      icon: "🛡️",
      unlocked: points >= 10,
      date: points >= 10 ? "Desbloqueado" : null
    },
    {
      id: "party_animal",
      title: "Fiestero Frecuente",
      desc: "Completaste 5 o más reservas exitosas.",
      icon: "🔥",
      unlocked: pastBookings.length >= 5,
      date: pastBookings.length >= 5 ? "Desbloqueado" : null
    },
    {
      id: "music_fan",
      title: "Fan de la Música",
      desc: "Agregaste 3 o más eventos a favoritos.",
      icon: "⚡",
      unlocked: favoriteEvents.length >= 3,
      date: favoriteEvents.length >= 3 ? "Desbloqueado" : null
    }
  ];

  // Dynamic Recent Real Action Feed
  const recentActivities: { id: string; title: string; desc: string; date: Date; icon: string }[] = [];
  
  bookings.slice(0, 3).forEach((b) => {
    const { title, type } = getBookingDetails(b);
    recentActivities.push({
      id: `act-book-${b.id}`,
      title: type === "Entrada" ? "Entrada Adquirida" : "Reserva Realizada",
      desc: `Compraste acceso para ${title} (${b.number_of_people || 1} pers).`,
      date: new Date(b.created_at || b.displayDate),
      icon: type === "Entrada" ? "🎫" : "🍾"
    });
  });

  if (presence) {
    recentActivities.push({
      id: `act-pres-${presence.id}`,
      title: "Check-in Connect",
      desc: `Presencia activa en ${activeVenueName}.`,
      date: new Date(presence.check_in_at),
      icon: "📍"
    });
  }

  favoriteClubs.slice(0, 2).forEach((clubId) => {
    const club = clubs.find((c) => c.id === clubId);
    if (club) {
      recentActivities.push({
        id: `act-fav-c-${clubId}`,
        title: "Favorito Añadido",
        desc: `Agregaste a ${club.name} a favoritos.`,
        date: new Date(profile.created_at), 
        icon: "❤️"
      });
    }
  });

  recentActivities.sort((a, b) => b.date.getTime() - a.date.getTime());
  const displayActivities = recentActivities.slice(0, 5);

  // Dynamic Gradient Avatar Fallback
  const getGradientAvatar = (name: string) => {
    const gradients = [
      "from-purple-600 to-pink-650",
      "from-blue-600 to-indigo-650",
      "from-emerald-500 to-teal-650",
      "from-rose-500 to-orange-655",
      "from-fuchsia-600 to-pink-500",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  const initials = profile.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "H";

  const dynamicGradient = getGradientAvatar(profile.full_name || profile.username || "HangoverUser");

  // QR Code Details
  const userUniqueCode = `HN-${(profile.id || '').substring(0, 8).toUpperCase()}`;
  const userQRData = `hangover:user:${profile.username || profile.id}`;

  const handleCopyProfileLink = async () => {
    const profileUrl = `${window.location.origin}/user/${profile.username || profile.id}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopiedProfile(true);
      setTimeout(() => setCopiedProfile(false), 2000);
    } catch (err) {
      console.error("Failed to copy profile link:", err);
    }
  };

  const handleCopyQRLink = async () => {
    try {
      await navigator.clipboard.writeText(userUniqueCode);
      setCopiedQR(true);
      setTimeout(() => setCopiedQR(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  // Actions
  const handlePresenceStatusChange = async (status: 'available' | 'observing' | 'do_not_disturb') => {
    if (!presence) {
      setMessage({ text: "Debes estar checkeado en un local para cambiar tu estado de Connect.", type: "error" });
      return;
    }
    setPresenceStatus(status);
    startTransition(async () => {
      const res = await updateActivePresenceStatus({ status, visibility: presenceVisibility });
      if (res.error) {
        setMessage({ text: res.error, type: "error" });
        setPresenceStatus(presence.status); // revert
      } else {
        setMessage({ text: "Estado de Connect actualizado correctamente.", type: "success" });
        setTimeout(() => setMessage(null), 3000);
      }
    });
  };

  const handlePresenceVisibilityToggle = async () => {
    if (!presence) {
      setMessage({ text: "Debes estar checkeado en un local para cambiar tu visibilidad.", type: "error" });
      return;
    }
    const nextVisibility = presenceVisibility === 'visible' ? 'invisible' : 'visible';
    setPresenceVisibility(nextVisibility);
    startTransition(async () => {
      const res = await updateActivePresenceStatus({ status: presenceStatus, visibility: nextVisibility });
      if (res.error) {
        setMessage({ text: res.error, type: "error" });
        setPresenceVisibility(presenceVisibility); // revert
      } else {
        setMessage({ text: `Modo ${nextVisibility === 'visible' ? 'Público' : 'Fantasma'} activado.`, type: "success" });
        setTimeout(() => setMessage(null), 3000);
      }
    });
  };

  const handleToggleClub = async (id: string) => {
    const isFav = favoriteClubs.includes(id);
    setFavoriteClubs(isFav ? favoriteClubs.filter(x => x !== id) : [...favoriteClubs, id]);
    const res = await toggleFavoriteClub(id);
    if (res.error) {
      setMessage({ text: res.error, type: "error" });
      setFavoriteClubs(favoriteClubs); // revert
    }
  };

  const handleToggleEvent = async (id: string) => {
    const isFav = favoriteEvents.includes(id);
    setFavoriteEvents(isFav ? favoriteEvents.filter(x => x !== id) : [...favoriteEvents, id]);
    const res = await toggleFavoriteEvent(id);
    if (res.error) {
      setMessage({ text: res.error, type: "error" });
      setFavoriteEvents(favoriteEvents); // revert
    }
  };

  const handleToggleService = async (id: string) => {
    const isFav = favoriteServices.includes(id);
    setFavoriteServices(isFav ? favoriteServices.filter(x => x !== id) : [...favoriteServices, id]);
    const res = await toggleFavoriteService(id);
    if (res.error) {
      setMessage({ text: res.error, type: "error" });
      setFavoriteServices(favoriteServices); // revert
    }
  };

  // Open Chat Room
  const handleOpenChat = async (providerId: string) => {
    if (!providerId) return;
    try {
      const res = await getOrCreateConnectChat(providerId);
      if (res.error) {
        alert(res.error);
      } else if (res.chatId) {
        window.location.href = `/connect?chatId=${res.chatId}&userId=${providerId}`;
      }
    } catch (e) {
      console.error(e);
      alert("No se pudo abrir el chat.");
    }
  };

  // Pay Booking
  const handlePayBooking = (bookingId: string) => {
    startTransition(async () => {
      try {
        const res = await updateBookingStatus(bookingId, "PAID");
        if (res.error) {
          setMessage({ text: res.error, type: "error" });
        } else {
          setBookings((prev) =>
            prev.map((b) => (b.id === bookingId ? { ...b, status: "PAID" } : b))
          );
          setMessage({ text: "¡Pago completado con éxito! Reserva confirmada.", type: "success" });
          setTimeout(() => setMessage(null), 3000);
        }
      } catch (err) {
        console.error(err);
        setMessage({ text: "Error al procesar el pago.", type: "error" });
      }
    });
  };

  // Cancel Booking
  const handleCancelBooking = (bookingId: string) => {
    if (!confirm("¿Estás seguro de que deseas cancelar esta reserva?")) return;
    startTransition(async () => {
      try {
        const res = await updateBookingStatus(bookingId, "CANCELLED");
        if (res.error) {
          setMessage({ text: res.error, type: "error" });
        } else {
          setBookings((prev) =>
            prev.map((b) => (b.id === bookingId ? { ...b, status: "CANCELLED" } : b))
          );
          setMessage({ text: "Reserva cancelada con éxito.", type: "success" });
          setTimeout(() => setMessage(null), 3000);
        }
      } catch (err) {
        console.error(err);
        setMessage({ text: "Error al cancelar la reserva.", type: "error" });
      }
    });
  };

  // Star Rating Submission
  const handleOpenRatingModal = (booking: any) => {
    setRatingModalBooking(booking);
    setRatingStars(5);
    setRatingComment("");
  };

  const handleCloseRatingModal = () => {
    setRatingModalBooking(null);
  };

  const handleSubmitRating = async () => {
    if (!ratingModalBooking) return;
    setSubmittingRating(true);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSubmittingRating(false);
    
    // Update local state to avoid duplicate rating
    setBookings((prev) =>
      prev.map((b) => (b.id === ratingModalBooking.id ? { ...b, status: "COMPLETED", is_rated: true } : b))
    );
    
    setMessage({ text: "¡Gracias por calificar tu experiencia! Tu feedback ha sido registrado.", type: "success" });
    setTimeout(() => setMessage(null), 3000);
    setRatingModalBooking(null);
  };

  // Recommendations: Clubs/events/services in the user's city or country
  const recommendedClubs = clubs
    .filter(c => !favoriteClubs.includes(c.id) && c.city === profile.city)
    .slice(0, 2);

  const recommendedEvents = events
    .filter((e) => {
      const evDate = new Date(e.event_date);
      return evDate >= now && !favoriteEvents.includes(e.id);
    })
    .slice(0, 3);

  return (
    <div className="relative min-h-screen bg-[#030307] text-zinc-100 font-sans antialiased pb-24">
      
      {/* Background Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-950/10 rounded-full blur-[125px] mix-blend-screen" />
        <div className="absolute top-[40%] right-[-10%] w-[45vw] h-[45vw] bg-pink-950/10 rounded-full blur-[130px] mix-blend-screen" />
        <div className="absolute bottom-[0%] left-[20%] w-[600px] h-[600px] bg-indigo-950/10 rounded-full blur-[150px] mix-blend-screen" />
      </div>

      {/* Alert Toaster */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4"
          >
            <div className={`p-4 rounded-2xl border backdrop-blur-md flex items-start gap-3 shadow-2xl ${
              message.type === "error" 
                ? "bg-red-500/10 border-red-500/20 text-red-200" 
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
            }`}>
              <AlertCircle className={`w-5 h-5 shrink-0 ${message.type === "error" ? "text-red-400" : "text-emerald-400"}`} />
              <div className="flex-1 text-xs font-semibold leading-relaxed">
                {message.text}
              </div>
              <button onClick={() => setMessage(null)} className="text-zinc-400 hover:text-white shrink-0 p-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
        
        {/* Main Grid: Responsive 1 col on mobile, 2 cols on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">
          
          {/* ================= COLUMN 1: LEFT SIDEBAR ================= */}
          <div className="space-y-6">
            
            {/* Si es proveedor, mostrar acceso al panel de negocio */}
            {profile.role === 'provider' && (
              <Link
                href="/dashboard/provider"
                className="w-full inline-flex justify-center items-center gap-2 bg-gradient-to-r from-primary-600/90 to-indigo-600/90 hover:from-primary-500 hover:to-indigo-500 text-white rounded-2xl py-3 px-4 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-primary-600/10 active:scale-95 animate-pulse"
              >
                🍾 Panel de Proveedor
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            {/* 1. HERO DEL PERFIL */}
            <div className="glass-card p-6 bg-gradient-to-b from-zinc-950/80 to-zinc-950/40 border-white/5 relative overflow-hidden rounded-3xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col items-center text-center space-y-4">
                
                {/* Avatar with status indicator overlay */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300" />
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || ""}
                      className="relative w-24 h-24 rounded-full object-cover border-2 border-[#030307]"
                    />
                  ) : (
                    <div className={`relative w-24 h-24 rounded-full bg-gradient-to-tr ${dynamicGradient} flex items-center justify-center text-3xl font-extrabold text-white border-2 border-[#030307]`}>
                      {initials}
                    </div>
                  )}
                  
                  {presence && (
                    <div className="absolute bottom-0 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#030307] flex items-center justify-center text-[10px] shadow-lg animate-bounce" title="Conectado en vivo">
                      🟢
                    </div>
                  )}
                </div>

                {/* Info */}
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <h2 className="text-xl font-bold tracking-tight text-white font-outfit">{profile.full_name || "Usuario"}</h2>
                    {profile.role === 'admin' && (
                      <span title="Cuenta Verificada">
                        <Shield className="w-4 h-4 text-primary-400 shrink-0" />
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400">@{profile.username || "usuario"}</p>
                </div>

                {/* Level Badge (Interactive) */}
                <div className="relative">
                  <button 
                    onClick={() => setShowLevelInfo(!showLevelInfo)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${levelBadgeBg}`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>{levelName}</span>
                    <Info className="w-3.5 h-3.5 ml-0.5 opacity-55 hover:opacity-100" />
                  </button>

                  <AnimatePresence>
                    {showLevelInfo && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setShowLevelInfo(false)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 5 }}
                          className="absolute z-40 top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-4 rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl text-left space-y-2"
                        >
                          <h4 className="font-bold text-white text-xs flex items-center gap-1">
                            <Award className="w-4 h-4 text-purple-400" />
                            Tu Actividad Nocturna
                          </h4>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            Tu nivel se calcula basándonos en tu actividad real dentro del ecosistema Hangover:
                          </p>
                          <div className="text-[10px] text-zinc-300 space-y-1 bg-white/5 p-2 rounded-xl border border-white/5">
                            <p>🎫 <strong>Reservas:</strong> +3 pts c/u ({totalBookings})</p>
                            <p>❤️ <strong>Favoritos:</strong> +1 pt c/u ({totalFavorites})</p>
                            <p>📍 <strong>Connect Activo:</strong> +2 pts ({hasActivePresence ? "Sí" : "No"})</p>
                            <p className="border-t border-white/5 pt-1 mt-1 text-purple-400 font-bold">Total: {points} puntos ({levelPointsRange})</p>
                          </div>
                          <p className="text-[9px] text-zinc-500 italic text-center">Toca fuera para cerrar</p>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Bio & Location info */}
                <div className="space-y-2 max-w-xs text-xs text-zinc-400">
                  <div className="flex flex-col gap-1 items-center justify-center">
                    {profile.city && profile.city !== "No especificada" && (
                      <p className="flex items-center gap-1 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-purple-400" />
                        <span>{profile.city}</span>
                      </p>
                    )}
                    <p className="text-[10px] text-zinc-550 font-medium font-outfit">Miembro desde {new Date(profile.created_at).getFullYear()}</p>
                  </div>
                  {profile.bio ? (
                    <p className="text-zinc-300 italic px-4 leading-relaxed font-medium">"{profile.bio}"</p>
                  ) : (
                    <p className="text-zinc-550 italic px-4">Sin biografía configurada.</p>
                  )}
                </div>

                {/* Social Badges */}
                <div className="flex gap-2">
                  {profile.social_instagram && (
                    <a 
                      href={`https://instagram.com/${profile.social_instagram}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl text-zinc-300 hover:text-white text-[11px] font-semibold transition-all"
                    >
                      <InstagramIcon className="w-3.5 h-3.5 text-pink-500" />
                      <span>@{profile.social_instagram}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                    </a>
                  )}
                  {profile.social_tiktok && (
                    <a 
                      href={`https://tiktok.com/@${profile.social_tiktok}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl text-zinc-300 hover:text-white text-[11px] font-semibold transition-all"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                      <span>@{profile.social_tiktok}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 w-full pt-2">
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/15 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer text-center font-outfit"
                  >
                    <Settings className="w-4 h-4 text-zinc-400" />
                    <span>Editar Perfil</span>
                  </Link>

                  <button
                    onClick={handleCopyProfileLink}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-purple-600/10 border border-purple-500/20 hover:bg-purple-600/20 hover:border-purple-500/35 text-purple-300 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer font-outfit"
                  >
                    <AnimatePresence mode="wait">
                      {copiedProfile ? (
                        <motion.div key="check" className="flex items-center gap-1.5" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                           <Check className="w-4 h-4 text-emerald-400" />
                           <span className="text-emerald-400">¡Copiado!</span>
                        </motion.div>
                      ) : (
                        <motion.div key="share" className="flex items-center gap-1.5" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          <Share2 className="w-4 h-4 text-purple-400" />
                          <span>Compartir</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </div>

              </div>
            </div>

            {/* 2. CÓDIGO QR COMPACTO */}
            <div className="glass-card p-6 bg-gradient-to-b from-zinc-950/80 to-zinc-950/40 border-white/5 rounded-3xl relative overflow-hidden">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="space-y-1 w-full text-left">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-purple-400 shrink-0" />
                    <h3 className="text-sm font-bold tracking-tight text-white font-outfit uppercase">Código Identidad QR</h3>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-medium">Tu credencial digital exclusiva de Hangover.</p>
                </div>

                <div 
                  onClick={() => setShowQRModal(true)}
                  className="group relative bg-white p-3 rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.05)] hover:shadow-[0_0_35px_rgba(139,92,246,0.2)] transition-all duration-300 cursor-pointer active:scale-95 animate-fadeIn"
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(userQRData)}&color=000000&bgcolor=ffffff`}
                    alt="Código QR"
                    className="w-24 h-24 block"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center text-white text-[10px] font-black uppercase tracking-wider font-outfit">
                    Ampliar QR
                  </div>
                </div>

                <div className="w-full flex items-center justify-between p-2.5 bg-black/40 border border-white/5 rounded-xl text-xs">
                  <span className="font-mono text-zinc-300 font-semibold text-[11px]">{userUniqueCode}</span>
                  <button
                    onClick={handleCopyQRLink}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-300 font-bold text-[10px] transition-colors border border-white/5 font-outfit"
                  >
                    {copiedQR ? "¡Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>
            </div>

            {/* 3. CONEXIÓN CONNECT & PRESENCIA */}
            <div className="glass-card p-6 bg-gradient-to-b from-purple-950/20 via-zinc-950/90 to-zinc-950/70 border-purple-500/10 rounded-3xl relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-purple-400 shrink-0" />
                    <h3 className="text-sm font-bold tracking-tight text-white font-outfit uppercase">Connect en Vivo</h3>
                  </div>
                  {presence && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-[9px] uppercase tracking-wider font-outfit">
                      Activo
                    </span>
                  )}
                </div>

                {presence ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">Ubicación</span>
                      <Link 
                        href={activeVenueSlug}
                        className="font-bold text-white hover:text-purple-400 transition-colors flex items-center gap-1 group"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        <span>{activeVenueName}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">Estado en Connect</span>
                      <div className="grid grid-cols-3 gap-1.5 font-outfit">
                        <button
                          onClick={() => handlePresenceStatusChange('available')}
                          className={`py-1.5 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                            presenceStatus === 'available'
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-white/5 border-white/5 text-zinc-400 hover:text-white"
                          }`}
                        >
                          <span>Disponible</span>
                        </button>
                        <button
                          onClick={() => handlePresenceStatusChange('observing')}
                          className={`py-1.5 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                            presenceStatus === 'observing'
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                              : "bg-white/5 border-white/5 text-zinc-400 hover:text-white"
                          }`}
                        >
                          <span>Ocupado</span>
                        </button>
                        <button
                          onClick={() => handlePresenceStatusChange('do_not_disturb')}
                          className={`py-1.5 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                            presenceStatus === 'do_not_disturb'
                              ? "bg-red-500/10 border-red-500/30 text-red-400"
                              : "bg-white/5 border-white/5 text-zinc-400 hover:text-white"
                          }`}
                        >
                          <span>Oculto</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl text-xs">
                      <div>
                        <p className="font-bold text-zinc-200 text-[11px]">
                          {presenceVisibility === 'visible' ? "Modo Público" : "Modo Fantasma"}
                        </p>
                        <p className="text-[9px] text-zinc-550">
                          {presenceVisibility === 'visible' ? "Visible en sala" : "Invisible en la sala"}
                        </p>
                      </div>
                      <button
                        onClick={handlePresenceVisibilityToggle}
                        className={`w-10 h-5.5 rounded-full p-0.5 transition-all ${
                          presenceVisibility === 'visible' ? "bg-purple-600" : "bg-zinc-700"
                        }`}
                      >
                        <div className={`w-4.5 h-4.5 rounded-full bg-white transition-all ${
                          presenceVisibility === 'visible' ? "translate-x-4.5" : "translate-x-0"
                        }`} />
                      </button>
                    </div>

                    <Link
                      href={presence.club_id ? `/discotecas/${clubs.find(c => c.id === presence.club_id)?.slug || ""}?tab=connect` : "/discotecas"}
                      className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer text-center font-outfit"
                    >
                      <MessageSquare className="w-4 h-4 shrink-0" />
                      <span>Ir al Chat Local</span>
                    </Link>
                  </div>
                ) : (
                  <div className="p-3.5 bg-black/40 border border-white/5 rounded-xl text-center space-y-2">
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                      Chatea en tiempo real con personas de tu mismo local. Escanea tu reserva en puerta para activar Connect en vivo.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 4. ACCIONES RÁPIDAS */}
            <div className="glass-card p-6 bg-gradient-to-b from-zinc-950/80 to-zinc-950/40 border-white/5 rounded-3xl">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white font-outfit uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4.5 h-4.5 text-purple-400" />
                  Acciones Rápidas
                </h3>
                
                <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-wider font-outfit">
                  <Link href="/events" className="p-3 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 transition-all">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    <span>Ver Eventos</span>
                  </Link>
                  
                  <Link href="/discotecas" className="p-3 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 transition-all">
                    <Compass className="w-5 h-5 text-pink-400" />
                    <span>Discotecas</span>
                  </Link>

                  <Link href="/servicios" className="p-3 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 transition-all">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span>Servicios</span>
                  </Link>

                  <Link href="/connect" className="p-3 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 transition-all">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                    <span>Ir al Chat</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* 5. LOGROS / INSIGNIAS */}
            <div className="glass-card p-6 bg-gradient-to-b from-zinc-950/80 to-zinc-950/40 border-white/5 rounded-3xl">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white font-outfit uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4.5 h-4.5 text-purple-400" />
                  Logros & Insignias
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {achievements.map((a) => (
                    <div 
                      key={a.id} 
                      className={`p-3 rounded-2xl border text-center relative overflow-hidden transition-all ${
                        a.unlocked 
                          ? "bg-purple-950/15 border-purple-500/20 text-white shadow-lg" 
                          : "bg-black/35 border-white/5 text-zinc-550 filter grayscale"
                      }`}
                    >
                      <div className="text-2xl mb-1.5 select-none">{a.icon}</div>
                      <h4 className="font-bold text-[10px] uppercase truncate tracking-wide font-outfit">{a.title}</h4>
                      <p className="text-[8px] text-zinc-400 mt-1 leading-relaxed">{a.desc}</p>
                      {a.unlocked && a.date && (
                        <span className="text-[6px] uppercase tracking-wider text-purple-400 font-black block mt-1.5 font-outfit">{a.date}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CERRAR SESIÓN */}
            <form action={logout} className="pt-2">
              <button 
                type="submit" 
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/30 rounded-2xl text-red-400 text-xs font-bold transition-all cursor-pointer active:scale-98 font-outfit"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Cerrar Sesión
              </button>
            </form>

          </div>

          {/* ================= COLUMN 2: MAIN DASHBOARD CONTENT ================= */}
          <div className="space-y-8 animate-fadeIn">
            
            {/* 6. TARJETAS DE RESUMEN (Stats Rápidas) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4 bg-zinc-950/40 border-white/5 rounded-2xl flex items-center justify-between hover:border-white/10 transition-colors">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">Reservas Activas</span>
                  <p className="text-2xl font-black font-outfit text-white">{activeBookings.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/10 flex items-center justify-center text-purple-400">
                  <Ticket className="w-5 h-5" />
                </div>
              </div>

              <div className="glass-card p-4 bg-zinc-950/40 border-white/5 rounded-2xl flex items-center justify-between hover:border-white/10 transition-colors">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">Chats sin leer</span>
                  <p className="text-2xl font-black font-outfit text-white">
                    {recentChats.reduce((acc, cur) => acc + cur.unreadCount, 0)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-pink-600/10 border border-pink-500/10 flex items-center justify-center text-pink-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>

              <div className="glass-card p-4 bg-zinc-950/40 border-white/5 rounded-2xl flex items-center justify-between hover:border-white/10 transition-colors">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">Eventos Asistidos</span>
                  <p className="text-2xl font-black font-outfit text-white">{pastBookings.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/10 flex items-center justify-center text-blue-400">
                  <History className="w-5 h-5" />
                </div>
              </div>

              <div className="glass-card p-4 bg-zinc-950/40 border-white/5 rounded-2xl flex items-center justify-between hover:border-white/10 transition-colors">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">Mis Favoritos</span>
                  <p className="text-2xl font-black font-outfit text-white">{totalFavorites}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Heart className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* 7. PRÓXIMA ACTIVIDAD (Protagonista) */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-outfit">Tu Próxima Actividad</h3>
              
              {mainUpcoming ? (
                <div className="glass-card p-6 bg-gradient-to-tr from-purple-950/20 via-zinc-950/90 to-zinc-950/80 border-purple-500/20 rounded-3xl relative overflow-hidden flex flex-col md:flex-row gap-6 justify-between items-center">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    {mainUpcoming.image ? (
                      <img 
                        src={mainUpcoming.image} 
                        alt={mainUpcoming.title} 
                        className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border border-white/10 shrink-0 animate-fadeIn" 
                      />
                    ) : (
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-purple-950/40 border border-purple-500/20 flex items-center justify-center text-2xl shrink-0">
                        🍹
                      </div>
                    )}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-outfit">
                          {mainUpcoming.type}
                        </span>
                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-pulse font-outfit">
                          Confirmado
                        </span>
                      </div>
                      <h4 className="text-md md:text-lg font-black text-white leading-tight font-outfit truncate">{mainUpcoming.title}</h4>
                      <p className="text-[11px] text-zinc-400 capitalize font-medium">
                        {new Date(mainUpcoming.displayDate).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} • {mainUpcoming.number_of_people || 1} pers.
                      </p>
                      {mainUpcoming.address && (
                        <p className="text-[10px] text-zinc-550 flex items-center gap-1 truncate font-medium">
                          <MapPin className="w-3 h-3 text-purple-400 shrink-0" />
                          <span>{mainUpcoming.address}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap md:flex-nowrap items-center gap-4 w-full md:w-auto shrink-0 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                    {/* QR Action Panel */}
                    {mainUpcoming.qr_code && (
                      <div className="bg-white p-2 rounded-xl shrink-0 shadow-lg shadow-purple-900/10 border border-purple-500/30 flex flex-col items-center gap-1 select-none">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(mainUpcoming.qr_code)}`} 
                          alt="Ticket QR" 
                          className="w-14 h-14"
                        />
                        <span className="text-[7px] text-black font-black font-mono tracking-wider">{mainUpcoming.id.substring(0,8).toUpperCase()}</span>
                      </div>
                    )}

                    <div className="flex flex-col gap-2 w-full md:w-44 text-[10px] font-black uppercase tracking-wider font-outfit">
                      <button 
                        onClick={() => setSelectedDetailBooking(mainUpcoming)}
                        className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-center border border-white/10 transition-all cursor-pointer"
                      >
                        Ver Reserva
                      </button>
                      
                      {mainUpcoming.provider_id && (
                        <button 
                          onClick={() => handleOpenChat(mainUpcoming.provider_id)}
                          className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-center transition-all cursor-pointer"
                        >
                          Abrir Chat
                        </button>
                      )}

                      {mainUpcoming.google_maps_url && (
                        <a 
                          href={mainUpcoming.google_maps_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full py-2 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-xl text-center border border-white/5 transition-all flex items-center justify-center gap-1"
                        >
                          <span>Ubicación</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="p-6 bg-zinc-950/20 border border-dashed border-white/5 rounded-3xl text-center space-y-4 select-none">
                  <div className="w-10 h-10 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center mx-auto text-zinc-550">
                    <CalendarCheck className="w-5 h-5 text-zinc-450" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-outfit">No tienes planes para este fin de semana</h4>
                    <p className="text-[11px] text-zinc-500 max-w-xs mx-auto leading-relaxed">Explora locales y eventos increíbles en tu ciudad para hacer tu primera reserva.</p>
                  </div>
                  <div className="flex gap-2 justify-center pt-1 text-[10px] font-black uppercase tracking-wider font-outfit">
                    <Link href="/events" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors">
                      Explorar Eventos
                    </Link>
                    <Link href="/discotecas" className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-350 hover:text-white rounded-xl border border-white/5 transition-all">
                      Locales
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* 8. MIS RESERVAS (Tabs & Cards) */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-2">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-white font-outfit flex items-center gap-1.5">
                  <Ticket className="w-4.5 h-4.5 text-purple-400" />
                  Mis Reservas & Contrataciones
                </h3>
                
                <div className="flex gap-1 text-[10px] font-black uppercase tracking-wider font-outfit">
                  <button 
                    onClick={() => setActiveBookingsTab("active")}
                    className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      activeBookingsTab === "active" 
                        ? "bg-purple-600/15 border-purple-500/25 text-purple-400" 
                        : "bg-white/2 border-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Activas ({activeBookings.length})
                  </button>
                  <button 
                    onClick={() => setActiveBookingsTab("pending")}
                    className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      activeBookingsTab === "pending" 
                        ? "bg-purple-600/15 border-purple-500/25 text-purple-400" 
                        : "bg-white/2 border-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Pendientes ({pendingBookings.length})
                  </button>
                  <button 
                    onClick={() => setActiveBookingsTab("history")}
                    className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      activeBookingsTab === "history" 
                        ? "bg-purple-600/15 border-purple-500/25 text-purple-400" 
                        : "bg-white/2 border-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Historial ({historyBookings.length})
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {(() => {
                  const targetList = 
                    activeBookingsTab === "active" ? activeBookings :
                    activeBookingsTab === "pending" ? pendingBookings :
                    historyBookings;

                  if (targetList.length === 0) {
                    return (
                      <div className="p-8 text-center bg-zinc-950/20 border border-dashed border-white/5 rounded-3xl text-zinc-550 text-xs py-10">
                        {activeBookingsTab === "active" ? "No tienes reservas activas o pagadas." :
                         activeBookingsTab === "pending" ? "No tienes solicitudes o reservas pendientes de pago." :
                         "No tienes registros en tu historial."}
                      </div>
                    );
                  }

                  return targetList.map((b) => {
                    const formattedDate = new Date(b.displayDate).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    });
                    
                    return (
                      <div 
                        key={b.id} 
                        className="glass-card p-4 hover:border-white/10 hover:bg-black/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl bg-zinc-950/30 border border-white/5"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {b.image ? (
                            <img src={b.image} alt={b.title} className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-purple-950/40 border border-purple-500/10 flex items-center justify-center text-lg shrink-0">
                              🍸
                            </div>
                          )}
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-white text-xs truncate leading-none">{b.title}</h4>
                              <span className="text-[7.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded border bg-white/5 border-white/10 text-zinc-300 font-outfit">
                                {b.type}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-400 capitalize">{formattedDate} • Code: {b.id.substring(0,8).toUpperCase()}</p>
                            {b.number_of_people && (
                              <p className="text-[9px] text-zinc-500 font-bold">{b.number_of_people} personas</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center sm:items-end justify-between sm:justify-end gap-5 w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                          <div className="text-left sm:text-right space-y-1">
                            <p className="text-xs font-black text-white font-mono">${Math.round(b.total_amount).toLocaleString('es-CO')} COP</p>
                            
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                              (() => {
                                const s = b.status.toUpperCase();
                                if (s === "PENDING") return "bg-amber-500/10 text-amber-300 border-amber-500/20";
                                if (s === "ACCEPTED") return "bg-purple-500/10 text-purple-300 border-purple-500/20";
                                if (s === "PAID") return "bg-blue-500/10 text-blue-300 border-blue-500/20";
                                if (s === "IN_PROGRESS") return "bg-primary-500/10 text-primary-300 border-primary-500/20 animate-pulse";
                                if (s === "COMPLETED") return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
                                return "bg-red-500/10 text-red-300 border-red-500/20";
                              })()
                            }`}>
                              {(() => {
                                const s = b.status.toUpperCase();
                                if (s === "PENDING") return "En Revisión";
                                if (s === "ACCEPTED") return "Espera Pago";
                                if (s === "PAID") return "Confirmado";
                                if (s === "IN_PROGRESS") return "En Curso";
                                if (s === "COMPLETED") return "Completado";
                                if (s === "REJECTED") return "Rechazado";
                                if (s === "CANCELLED") return "Cancelado";
                                return s;
                              })()}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-black uppercase tracking-wider font-outfit">
                            <button 
                              onClick={() => setSelectedDetailBooking(b)}
                              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all cursor-pointer"
                            >
                              Detalles
                            </button>

                            {/* PAY (ACCEPTED) */}
                            {b.status.toUpperCase() === "ACCEPTED" && (
                              <button
                                onClick={() => handlePayBooking(b.id)}
                                disabled={isPending}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all cursor-pointer flex items-center gap-1"
                              >
                                {isPending ? <Loader2 className="w-3 animate-spin" /> : <CreditCard className="w-3 h-3" />}
                                <span>Pagar</span>
                              </button>
                            )}

                            {/* CHAT CONNECT */}
                            {["PENDING", "ACCEPTED", "PAID", "IN_PROGRESS"].includes(b.status.toUpperCase()) && b.provider_id && (
                              <button
                                onClick={() => handleOpenChat(b.provider_id)}
                                className="px-2.5 py-1.5 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-300 rounded-lg transition-all cursor-pointer"
                              >
                                Chat
                              </button>
                            )}

                            {/* CANCEL (PENDING/ACCEPTED/DRAFT) */}
                            {["PENDING", "ACCEPTED", "DRAFT"].includes(b.status.toUpperCase()) && (
                              <button
                                onClick={() => handleCancelBooking(b.id)}
                                disabled={isPending}
                                className="px-2.5 py-1.5 bg-red-650/10 hover:bg-red-650/20 border border-red-500/20 text-red-400 rounded-lg transition-all cursor-pointer"
                              >
                                Cancelar
                              </button>
                            )}

                            {/* RATE (COMPLETED) */}
                            {b.status.toUpperCase() === "COMPLETED" && !b.is_rated && (
                              <button
                                onClick={() => handleOpenRatingModal(b)}
                                className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-550/20 text-amber-300 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>Calificar</span>
                              </button>
                            )}
                            {b.status.toUpperCase() === "COMPLETED" && b.is_rated && (
                              <span className="text-zinc-550 font-black px-2.5 text-[9px] uppercase tracking-wider border border-white/5 py-1.5 rounded-lg bg-white/2">Calificado</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* 9. CONVERSACIONES RECIENTES */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-outfit flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  Conversaciones Recientes
                </h3>
                <Link href="/connect" className="text-[10px] font-bold text-purple-400 hover:underline flex items-center gap-0.5 font-outfit">
                  <span>Abrir Connect</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentChats.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentChats.map((chat) => (
                    <div 
                      key={chat.id} 
                      className="p-4 bg-zinc-950/40 border border-white/5 rounded-2xl flex items-center justify-between gap-4 hover:border-white/10 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {chat.partner?.avatar_url ? (
                          <img src={chat.partner.avatar_url} alt={chat.partner.full_name} className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-purple-950/30 text-purple-300 border border-purple-500/10 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                            {chat.partner?.full_name?.[0] || "U"}
                          </div>
                        )}
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1">
                            <h4 className="font-bold text-white text-xs truncate leading-none font-outfit">{chat.partner?.full_name}</h4>
                            {chat.partner?.role === "provider" && (
                              <span className="text-[7px] px-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded font-outfit">PROV</span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-450 truncate font-medium">{chat.lastMessage}</p>
                          <span className="text-[8px] text-zinc-550 font-bold block font-outfit">{chat.lastMessageTime}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {chat.unreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-purple-650 text-[8px] font-black text-white flex items-center justify-center">
                            {chat.unreadCount}
                          </span>
                        )}
                        <Link 
                          href={`/connect?chatId=${chat.id}&userId=${chat.partner?.id}`}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-wider text-zinc-300 hover:text-white transition-all font-outfit"
                        >
                          Chatear
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-zinc-950/20 border border-dashed border-white/5 rounded-2xl text-xs text-zinc-550 select-none">
                  No tienes chats activos en tu bandeja de mensajería.
                </div>
              )}
            </div>

            {/* 10. CENTRO DE NOTIFICACIONES */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-outfit flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-purple-400" />
                Notificaciones Recientes
              </h3>

              {userNotifications.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fadeIn">
                  {userNotifications.map((notif) => {
                    const formattedDate = new Date(notif.created_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "numeric"
                    });
                    
                    return (
                      <div 
                        key={notif.id} 
                        className={`p-3.5 rounded-2xl border text-xs flex gap-3 items-start transition-colors ${
                          notif.is_read 
                            ? "bg-zinc-950/30 border-white/5 text-zinc-400" 
                            : "bg-purple-950/5 border-purple-500/10 text-white"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-purple-600/10 border border-purple-500/10 flex items-center justify-center shrink-0">
                          {notif.type === "booking_update" ? "🎫" : notif.type === "new_message" ? "💬" : "🔔"}
                        </div>
                        <div className="space-y-1 min-w-0 flex-grow">
                          <div className="flex justify-between items-baseline gap-2">
                            <h4 className="font-bold text-white text-[11px] truncate leading-none font-outfit">{notif.title}</h4>
                            <span className="text-[7.5px] text-zinc-550 font-bold shrink-0 font-outfit">{formattedDate}</span>
                          </div>
                          <p className="text-[10px] text-zinc-455 leading-relaxed font-medium">{notif.message}</p>
                          {notif.booking_id && (
                            <Link 
                              href={`/dashboard/user`} 
                              className="inline-flex items-center gap-0.5 text-[9px] font-bold text-purple-400 hover:underline mt-1 font-outfit"
                            >
                              <span>Ver Estado</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center bg-zinc-950/20 border border-dashed border-white/5 rounded-2xl text-xs text-zinc-550 select-none">
                  No tienes notificaciones o actualizaciones recientes.
                </div>
              )}
            </div>

            {/* 11. FAVORITOS (Locales, Eventos, Servicios) */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-2">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-white font-outfit flex items-center gap-1.5">
                  <Heart className="w-4.5 h-4.5 text-pink-500 fill-pink-500" />
                  Mis Favoritos Guardados
                </h3>
                
                <div className="flex gap-1 text-[10px] font-black uppercase tracking-wider font-outfit">
                  <button 
                    onClick={() => setActiveFavTab("clubs")}
                    className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      activeFavTab === "clubs" 
                        ? "bg-pink-650/15 border-pink-500/25 text-pink-400" 
                        : "bg-white/2 border-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Locales ({favoriteClubs.length})
                  </button>
                  <button 
                    onClick={() => setActiveFavTab("events")}
                    className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      activeFavTab === "events" 
                        ? "bg-pink-650/15 border-pink-500/25 text-pink-400" 
                        : "bg-white/2 border-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Eventos ({favoriteEvents.length})
                  </button>
                  <button 
                    onClick={() => setActiveFavTab("services")}
                    className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      activeFavTab === "services" 
                        ? "bg-pink-650/15 border-pink-500/25 text-pink-400" 
                        : "bg-white/2 border-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Servicios ({favoriteServices.length})
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {activeFavTab === "clubs" && (
                  favoriteClubs.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                      {favoriteClubs.map((clubId) => {
                        const club = clubs.find((c) => c.id === clubId);
                        if (!club) return null;
                        
                        return (
                          <div key={club.id} className="w-56 bg-zinc-950/50 border border-white/5 rounded-2xl overflow-hidden shrink-0 flex flex-col justify-between hover:border-white/10 transition-colors animate-fadeIn">
                            <div className="relative h-28 w-full bg-zinc-900">
                              {club.images?.[0] ? (
                                <img src={club.images[0]} alt={club.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-purple-950/20 flex items-center justify-center text-zinc-500 text-xl font-bold">
                                  🍸
                                </div>
                              )}
                              <button
                                onClick={() => handleToggleClub(club.id)}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-red-500 cursor-pointer active:scale-90"
                                title="Eliminar de favoritos"
                              >
                                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                              </button>
                            </div>
                            <div className="p-4 space-y-2">
                              <h5 className="font-bold text-white text-xs truncate leading-none font-outfit">{club.name}</h5>
                              {club.city && (
                                <p className="text-[10px] text-zinc-400 flex items-center gap-0.5 font-medium">
                                  <MapPin className="w-3 h-3 text-purple-400" />
                                  <span>{club.city}</span>
                                </p>
                              )}
                              <Link
                                href={`/discotecas/${club.slug}`}
                                className="w-full inline-flex items-center justify-center gap-1 bg-white/5 hover:bg-white/10 text-white rounded-lg py-2 text-[10px] font-bold transition-all border border-white/5 text-center font-outfit"
                              >
                                <span>Ver Local</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-zinc-950/20 border border-dashed border-white/5 rounded-2xl text-xs text-zinc-550 select-none">
                      No tienes locales favoritos guardados.
                    </div>
                  )
                )}

                {activeFavTab === "events" && (
                  favoriteEvents.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                      {favoriteEvents.map((eventId) => {
                        const ev = events.find((e) => e.id === eventId);
                        if (!ev) return null;
                        
                        const evDate = new Date(ev.event_date).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short"
                        });

                        return (
                          <div key={ev.id} className="w-56 bg-zinc-950/50 border border-white/5 rounded-2xl overflow-hidden shrink-0 flex flex-col justify-between hover:border-white/10 transition-colors animate-fadeIn">
                            <div className="relative h-28 w-full bg-zinc-900">
                              {ev.image_url ? (
                                <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-purple-950/20 flex items-center justify-center text-zinc-500 text-xl font-bold">
                                  🎟
                                </div>
                              )}
                              <button
                                onClick={() => handleToggleEvent(ev.id)}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-red-500 cursor-pointer active:scale-90"
                              >
                                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                              </button>
                            </div>
                            <div className="p-4 space-y-2">
                              <h5 className="font-bold text-white text-xs truncate leading-none font-outfit">{ev.title}</h5>
                              <div className="flex items-center justify-between text-[10px] font-medium">
                                <span className="text-purple-400">{evDate}</span>
                                <span className="text-emerald-400 font-bold">{ev.ticket_price > 0 ? `$${ev.ticket_price}` : "Gratis"}</span>
                              </div>
                              <Link
                                href={`/events/${ev.id}`}
                                className="w-full inline-flex items-center justify-center gap-1 bg-white/5 hover:bg-white/10 text-white rounded-lg py-2 text-[10px] font-bold transition-all border border-white/5 text-center font-outfit"
                              >
                                <span>Ver Evento</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-zinc-950/20 border border-dashed border-white/5 rounded-2xl text-xs text-zinc-550 select-none">
                      No tienes eventos guardados en favoritos.
                    </div>
                  )
                )}

                {activeFavTab === "services" && (
                  favoriteServices.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                      {favoriteServices.map((serviceId) => {
                        const sv = services.find((s) => s.id === serviceId);
                        if (!sv) return null;

                        return (
                          <div key={sv.id} className="w-56 bg-zinc-950/50 border border-white/5 rounded-2xl overflow-hidden shrink-0 flex flex-col justify-between hover:border-white/10 transition-colors animate-fadeIn">
                            <div className="relative h-28 w-full bg-zinc-900">
                              {sv.images?.[0] ? (
                                <img src={sv.images[0]} alt={sv.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-purple-950/20 flex items-center justify-center text-zinc-500 text-xl font-bold">
                                  🛠️
                                </div>
                              )}
                              <button
                                onClick={() => handleToggleService(sv.id)}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-red-500 cursor-pointer active:scale-90"
                              >
                                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                              </button>
                            </div>
                            <div className="p-4 space-y-2">
                              <h5 className="font-bold text-white text-xs truncate leading-none font-outfit">{sv.title}</h5>
                              <div className="flex items-center justify-between text-[10px] font-medium">
                                <span className="text-purple-400">{sv.category || "Servicio"}</span>
                                <span className="text-emerald-400 font-bold">${Math.round(sv.price || 0).toLocaleString('es-CO')}</span>
                              </div>
                              <Link
                                href={`/servicios`}
                                className="w-full inline-flex items-center justify-center gap-1 bg-white/5 hover:bg-white/10 text-white rounded-lg py-2 text-[10px] font-bold transition-all border border-white/5 text-center font-outfit"
                              >
                                <span>Ver Servicio</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-zinc-950/20 border border-dashed border-white/5 rounded-2xl text-xs text-zinc-550 select-none">
                      No tienes servicios favoritos guardados.
                    </div>
                  )
                )}
              </div>
            </div>

            {/* 12. ESTADÍSTICAS PERSONALES */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-outfit">Estadísticas Personales</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-950/30 border border-white/5 rounded-2xl text-center space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">Dinero Total Gastado</span>
                  <p className="text-md font-black text-emerald-400 font-mono">${Math.round(totalMoneySpent).toLocaleString('es-CO')} COP</p>
                </div>
                
                <div className="p-4 bg-zinc-950/30 border border-white/5 rounded-2xl text-center space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">Locales VIP Visitados</span>
                  <p className="text-lg font-black text-purple-400 font-outfit">{totalClubsVisited}</p>
                </div>

                <div className="p-4 bg-zinc-950/30 border border-white/5 rounded-2xl text-center space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">Servicios Contratados</span>
                  <p className="text-lg font-black text-pink-400 font-outfit">{totalServicesContracted}</p>
                </div>

                <div className="p-4 bg-zinc-950/30 border border-white/5 rounded-2xl text-center space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">Calificación Promedio Dada</span>
                  <p className="text-lg font-black text-amber-400 font-outfit flex items-center justify-center gap-1">
                    <Star className="w-4.5 h-4.5 fill-amber-400 text-amber-400" />
                    <span>4.9</span>
                  </p>
                </div>

                <div className="p-4 bg-zinc-950/30 border border-white/5 rounded-2xl text-center space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">Años usando Hangover</span>
                  <p className="text-lg font-black text-cyan-400 font-outfit">{yearsUsingHangover} {yearsUsingHangover === 1 ? "año" : "años"}</p>
                </div>

                <div className="p-4 bg-zinc-950/30 border border-white/5 rounded-2xl text-center space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">Puntos Acumulados</span>
                  <p className="text-lg font-black text-purple-400 font-outfit">{points} pts</p>
                </div>
              </div>
            </div>

            {/* 13. RECOMENDACIONES INTELIGENTES */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-outfit">Recomendados para ti</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendedEvents.map((ev) => {
                  const evDate = new Date(ev.event_date).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short"
                  });
                  
                  return (
                    <div key={ev.id} className="glass-card overflow-hidden hover:border-white/10 transition-colors flex flex-col justify-between bg-zinc-950/40 rounded-2xl">
                      <div className="relative h-28 w-full bg-zinc-900">
                        {ev.image_url ? (
                          <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-purple-950/20 flex items-center justify-center text-zinc-500 text-xl font-bold">
                            🎟
                          </div>
                        )}
                        <button
                          onClick={() => handleToggleEvent(ev.id)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-zinc-350 hover:text-white cursor-pointer active:scale-90"
                        >
                          <Heart className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-3.5 space-y-2">
                        <h5 className="font-bold text-white text-xs truncate leading-none font-outfit">{ev.title}</h5>
                        <div className="flex items-center justify-between text-[10px] font-medium">
                          <span className="text-purple-400">{evDate}</span>
                          <span className="text-emerald-400 font-extrabold">{ev.ticket_price > 0 ? `$${ev.ticket_price}` : "Gratis"}</span>
                        </div>
                        <Link
                          href={`/events/${ev.id}`}
                          className="w-full inline-flex items-center justify-center gap-1 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-300 rounded-lg py-2 text-[10px] font-bold transition-all text-center font-outfit"
                        >
                          <span>Ver Detalles</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 14. ACTIVIDAD RECIENTE (Timeline) */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-outfit flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-purple-400 animate-pulse animate-fadeIn" />
                Línea de Tiempo de Actividad
              </h3>

              {displayActivities.length > 0 ? (
                <div className="relative border-l border-white/5 pl-4 ml-2 space-y-4">
                  {displayActivities.map((act) => (
                    <div key={act.id} className="relative text-xs">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-purple-500 border border-[#030307] shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                      
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-white font-outfit">{act.title}</span>
                          <span className="text-[8px] text-zinc-550 font-bold font-outfit">
                            {act.date.toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "numeric", minute: "numeric" })}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-455 leading-relaxed font-medium">{act.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-zinc-950/20 border border-dashed border-white/5 rounded-2xl text-xs text-zinc-550 select-none">
                  No hay actividades registradas en la línea de tiempo.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* ================= MODAL: DETALLES DE RESERVA ================= */}
      <AnimatePresence>
        {selectedDetailBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="absolute inset-0 cursor-default" onClick={() => setSelectedDetailBooking(null)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md p-6 bg-[#0c0c14] border border-white/10 rounded-3xl relative overflow-hidden z-10 space-y-5"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h3 className="font-extrabold text-white text-md uppercase font-outfit">Detalles de Reserva</h3>
                <button
                  onClick={() => setSelectedDetailBooking(null)}
                  className="p-1.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3">
                  {selectedDetailBooking.image ? (
                    <img src={selectedDetailBooking.image} alt={selectedDetailBooking.title} className="w-14 h-14 rounded-xl object-cover border border-white/10" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-purple-950/40 border border-purple-500/25 flex items-center justify-center text-xl font-bold">
                      🍸
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-white text-sm font-outfit">{selectedDetailBooking.title}</h4>
                    <p className="text-zinc-550 font-bold uppercase text-[9px] tracking-wider mt-0.5 font-outfit">{selectedDetailBooking.type}</p>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-450">ID Reserva:</span>
                    <span className="font-mono text-zinc-200 font-bold">{selectedDetailBooking.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-450">Fecha de Reserva:</span>
                    <span className="text-zinc-200 font-bold capitalize">
                      {new Date(selectedDetailBooking.displayDate).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  {selectedDetailBooking.number_of_people && (
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-450">Personas:</span>
                      <span className="text-zinc-200 font-bold">{selectedDetailBooking.number_of_people}</span>
                    </div>
                  )}
                  {selectedDetailBooking.duration && (
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-450">Duración:</span>
                      <span className="text-zinc-200 font-bold">{selectedDetailBooking.duration}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-455">Total Abonado:</span>
                    <span className="text-emerald-400 font-black">${Math.round(selectedDetailBooking.total_amount).toLocaleString('es-CO')} COP</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-450">Estado:</span>
                    <span className="text-white font-bold uppercase tracking-wider bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full text-[9px]">
                      {selectedDetailBooking.status}
                    </span>
                  </div>
                  {selectedDetailBooking.special_requirements && (
                    <div className="border-t border-white/5 pt-2 mt-1 space-y-1">
                      <span className="text-zinc-450 block font-bold text-[9px] uppercase tracking-wider">Requerimientos Especiales:</span>
                      <p className="text-zinc-300 italic">"{selectedDetailBooking.special_requirements}"</p>
                    </div>
                  )}
                  {selectedDetailBooking.notes && (
                    <div className="border-t border-white/5 pt-2 mt-1 space-y-1">
                      <span className="text-zinc-450 block font-bold text-[9px] uppercase tracking-wider">Notas Adicionales:</span>
                      <p className="text-zinc-300">{selectedDetailBooking.notes}</p>
                    </div>
                  )}
                  {selectedDetailBooking.address && (
                    <div className="border-t border-white/5 pt-2 mt-1 space-y-1">
                      <span className="text-zinc-450 block font-bold text-[9px] uppercase tracking-wider">Dirección:</span>
                      <p className="text-zinc-300">{selectedDetailBooking.address}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 font-outfit">
                  {selectedDetailBooking.google_maps_url && (
                    <a 
                      href={selectedDetailBooking.google_maps_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full bg-white/5 hover:bg-white/10 text-white rounded-xl py-2.5 font-bold text-xs transition-colors border border-white/5 cursor-pointer text-center flex items-center justify-center gap-1.5"
                    >
                      <span>Ver Mapa</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => setSelectedDetailBooking(null)}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-xl py-2.5 font-bold text-xs transition-all cursor-pointer"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: CALIFICAR EXPERIENCIA (Estrellas) ================= */}
      <AnimatePresence>
        {ratingModalBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <div className="absolute inset-0 cursor-default" onClick={handleCloseRatingModal} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-sm p-6 bg-[#0f0f18] border border-white/10 rounded-3xl relative overflow-hidden z-10 text-center space-y-5"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h3 className="font-extrabold text-white text-md uppercase font-outfit">Calificar Experiencia</h3>
                <button
                  onClick={handleCloseRatingModal}
                  className="p-1.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  ¿Cómo estuvo tu experiencia en **{ratingModalBooking.title}**? Déjanos saber tu puntuación e impresiones.
                </p>

                {/* Stars Selector */}
                <div className="flex justify-center items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingStars(star)}
                      className="p-1 transition-transform active:scale-90 hover:scale-110 cursor-pointer"
                    >
                      <Star 
                        className={`w-8 h-8 ${
                          star <= ratingStars 
                            ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" 
                            : "text-zinc-650"
                        }`} 
                      />
                    </button>
                  ))}
                </div>

                {/* Comment Box */}
                <div className="space-y-1.5 text-left">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Comentario (Opcional)</span>
                  <textarea
                    rows={3}
                    placeholder="Cuéntanos más sobre el servicio, la música, la atención..."
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-zinc-650 resize-none animate-fadeIn"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 font-outfit">
                  <button
                    onClick={handleCloseRatingModal}
                    className="w-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl py-2.5 font-bold text-xs transition-colors border border-white/5 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmitRating}
                    disabled={submittingRating}
                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-xl py-2.5 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    {submittingRating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Enviar</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: QR AMPLIO DETALLADO (Identidad) ================= */}
      <AnimatePresence>
        {showQRModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="absolute inset-0 cursor-default" onClick={() => setShowQRModal(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-sm p-6 bg-[#0c0c14] border border-white/10 rounded-3xl relative overflow-hidden z-10 text-center space-y-6"
            >
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h3 className="font-extrabold text-white text-md uppercase font-outfit">Mi Identidad QR</h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="p-1.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <p className="text-zinc-455 leading-relaxed">
                  Presenta este QR a los relacionistas o porteros para check-ins rápidos, acreditaciones y networking Connect en vivo.
                </p>

                <div className="bg-white p-3 rounded-2xl inline-block shadow-[0_0_35px_rgba(168,85,247,0.2)] border-2 border-purple-500/20">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(userQRData)}&color=000000&bgcolor=ffffff`}
                    alt="Identidad QR"
                    className="w-48 h-48 block"
                    loading="lazy"
                  />
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-left space-y-1.5">
                  <div className="flex justify-between items-center text-zinc-450">
                    <span>Nombre:</span>
                    <span className="text-white font-bold">{profile.full_name || "Usuario"}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-455">
                    <span>Username:</span>
                    <span className="text-purple-400 font-bold">@{profile.username}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-450 border-t border-white/5 pt-2 mt-1">
                    <span>Código único:</span>
                    <span className="font-mono text-zinc-200 font-bold">{userUniqueCode}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 font-outfit">
                  <button
                    onClick={handleCopyQRLink}
                    className="w-full bg-white/5 hover:bg-white/10 text-white rounded-xl py-2.5 font-bold text-xs transition-colors border border-white/5 cursor-pointer"
                  >
                    {copiedQR ? "¡Copiado!" : "Copiar Código"}
                  </button>
                  <button
                    onClick={() => setShowQRModal(false)}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-xl py-2.5 font-bold text-xs transition-all cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
