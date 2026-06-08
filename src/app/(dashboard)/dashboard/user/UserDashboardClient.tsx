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
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
import { 
  updateActivePresenceStatus, 
  toggleFavoriteClub, 
  toggleFavoriteEvent, 
  toggleFavoriteService 
} from "@/app/services/connectActions";
import { logout } from "@/app/(auth)/actions";
import { UserBookingsTabs } from "@/components/dashboard/UserBookingsTabs";

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
}

export function UserDashboardClient({
  profile,
  userEmail,
  bookings,
  clubs,
  events,
  services,
  initialFavoriteClubs,
  initialFavoriteEvents,
  initialFavoriteServices,
  presence: initialPresence,
  chatCount,
  pendingRequestCount
}: UserDashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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

  // Resolve booking title & date helper
  const getBookingDetails = (booking: any) => {
    let title = "Reserva Hangover";
    let image = "";
    let slug = "";
    let type = "Mesas";

    if (booking.event_id) {
      const ev = events.find((e) => e.id === booking.event_id);
      title = ev?.title || "Entrada de Evento";
      image = ev?.image_url || "";
      type = "Entrada";
    } else if (booking.club_id) {
      const cl = clubs.find((c) => c.id === booking.club_id);
      title = cl?.name || booking.club_slug || "Reserva de Discoteca";
      image = cl?.logo || cl?.images?.[0] || "";
      slug = cl?.slug || "";
    } else if (booking.service_id) {
      const sv = services.find((s) => s.id === booking.service_id);
      title = sv?.title || "Servicio Contratado";
      image = sv?.images?.[0] || "";
      type = "Servicio";
    }
    return { title, image, slug, type };
  };

  // 1. Compile User Level
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

  // 2. Compile Live Presence Venue
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

  // 3. Compile Bookings Timeline (Tu Próxima Noche)
  const now = new Date();
  const upcomingBookings = bookings
    .filter((b) => {
      const bDate = new Date(b.reservation_date || b.event_date);
      // Reset hours to compare dates only
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const bookingDay = new Date(bDate.getFullYear(), bDate.getMonth(), bDate.getDate());
      return bookingDay >= today && b.status !== "cancelled" && b.status !== "rejected";
    })
    .sort((a, b) => new Date(a.reservation_date || a.event_date).getTime() - new Date(b.reservation_date || b.event_date).getTime());

  // 4. Compile Past Nocturnal History (Mi Historial Nocturno)
  const pastBookings = bookings
    .filter((b) => {
      const bDate = new Date(b.reservation_date || b.event_date);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const bookingDay = new Date(bDate.getFullYear(), bDate.getMonth(), bDate.getDate());
      return bookingDay < today || b.status === "completed";
    })
    .sort((a, b) => new Date(b.reservation_date || b.event_date).getTime() - new Date(a.reservation_date || a.event_date).getTime());

  // Group past history by month
  const groupedPastHistory: { [key: string]: any[] } = {};
  pastBookings.forEach((booking) => {
    const bDate = new Date(booking.reservation_date || booking.event_date);
    const monthYear = bDate.toLocaleString("es-ES", { month: "long", year: "numeric" });
    const capitalizedMonthYear = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
    if (!groupedPastHistory[capitalizedMonthYear]) {
      groupedPastHistory[capitalizedMonthYear] = [];
    }
    groupedPastHistory[capitalizedMonthYear].push(booking);
  });

  // 5. Compile Recent Activity Feed (100% real actions)
  const recentActivities: { id: string; title: string; desc: string; date: Date; icon: string }[] = [];

  // Add Bookings created
  bookings.slice(0, 3).forEach((b) => {
    const { title, type } = getBookingDetails(b);
    recentActivities.push({
      id: `act-book-${b.id}`,
      title: type === "Entrada" ? "Entrada Adquirida" : "Reserva Realizada",
      desc: `Compraste acceso para ${title} para ${b.number_of_people || 1} personas.`,
      date: new Date(b.created_at || b.reservation_date || b.event_date),
      icon: type === "Entrada" ? "🎫" : "🍾"
    });
  });

  // Add Presence Check-in
  if (presence) {
    recentActivities.push({
      id: `act-pres-${presence.id}`,
      title: "Check-in Connect",
      desc: `Te uniste a la comunidad en vivo en ${activeVenueName}.`,
      date: new Date(presence.check_in_at),
      icon: "📍"
    });
  }

  // Add Favorite follows (first 2)
  favoriteClubs.slice(0, 2).forEach((clubId) => {
    const club = clubs.find((c) => c.id === clubId);
    if (club) {
      recentActivities.push({
        id: `act-fav-c-${clubId}`,
        title: "Siguiendo Local",
        desc: `Agregaste a ${club.name} a tus locales favoritos.`,
        // Approximate date since we don't store fav creation date explicitly in state list
        date: new Date(profile.created_at), 
        icon: "❤️"
      });
    }
  });

  // Sort activities by date desc
  recentActivities.sort((a, b) => b.date.getTime() - a.date.getTime());
  const displayActivities = recentActivities.slice(0, 4);

  // 6. Dynamic Gradient Avatar Fallback
  const getGradientAvatar = (name: string) => {
    const gradients = [
      "from-purple-600 to-pink-600",
      "from-blue-600 to-indigo-600",
      "from-emerald-500 to-teal-600",
      "from-rose-500 to-orange-500",
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

  // 7. QR Data & Unique Code
  const userUniqueCode = `HN-${(profile.id || '').substring(0, 8).toUpperCase()}`;
  const userQRData = `hangover:user:${profile.username || profile.id}`;

  // 8. Sharing actions
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

  // 9. Hot presence update action
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

  // 10. Database Favorites toggling
  const handleToggleClub = async (id: string) => {
    const isFav = favoriteClubs.includes(id);
    const updated = isFav ? favoriteClubs.filter(x => x !== id) : [...favoriteClubs, id];
    setFavoriteClubs(updated); // optimistic
    const res = await toggleFavoriteClub(id);
    if (res.error) {
      setMessage({ text: res.error, type: "error" });
      setFavoriteClubs(favoriteClubs); // revert
    }
  };

  const handleToggleEvent = async (id: string) => {
    const isFav = favoriteEvents.includes(id);
    const updated = isFav ? favoriteEvents.filter(x => x !== id) : [...favoriteEvents, id];
    setFavoriteEvents(updated); // optimistic
    const res = await toggleFavoriteEvent(id);
    if (res.error) {
      setMessage({ text: res.error, type: "error" });
      setFavoriteEvents(favoriteEvents); // revert
    }
  };

  const handleToggleService = async (id: string) => {
    const isFav = favoriteServices.includes(id);
    const updated = isFav ? favoriteServices.filter(x => x !== id) : [...favoriteServices, id];
    setFavoriteServices(updated); // optimistic
    const res = await toggleFavoriteService(id);
    if (res.error) {
      setMessage({ text: res.error, type: "error" });
      setFavoriteServices(favoriteServices); // revert
    }
  };

  // Recommendations: Events happening in same city, or simply future events
  const recommendedEvents = events
    .filter((e) => {
      const evDate = new Date(e.event_date);
      return evDate >= now && !favoriteEvents.includes(e.id);
    })
    .slice(0, 3);

  // Normalize bookings for the UserBookingsTabs component
  const normalizedBookings = bookings.map((booking: any) => {
    const { title } = getBookingDetails(booking);
    return {
      ...booking,
      title,
      displayDate: booking.reservation_date || booking.event_date
    };
  });

  return (
    <div className="relative min-h-screen bg-[#030307] text-zinc-100 font-sans antialiased pb-24">
      {/* Background Neon Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-950/15 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute top-[40%] right-[-10%] w-[45vw] h-[45vw] bg-pink-950/10 rounded-full blur-[130px] mix-blend-screen" />
        <div className="absolute bottom-[0%] left-[20%] w-[600px] h-[600px] bg-blue-950/10 rounded-full blur-[150px] mix-blend-screen" />
      </div>

      {/* Floating notification toaster */}
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
        
        {/* Main Flex Grid layout (Mobile single column, Desktop sidebars) */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">
          
          {/* LEFT SIDEBAR: PROFILE, QR CARD, HANGOVER CONNECT */}
          <div className="space-y-6">
            
            {/* Si es proveedor, mostrar acceso al panel de negocio */}
            {profile.role === 'provider' && (
              <Link
                href="/dashboard/provider"
                className="w-full inline-flex justify-center items-center gap-2 bg-gradient-to-r from-primary-600/90 to-indigo-600/90 hover:from-primary-500 hover:to-indigo-500 text-white rounded-2xl py-3 px-4 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-primary-600/10 active:scale-95"
              >
                🍾 Panel de Proveedor
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            {/* 1. SECCIÓN PERFIL (Estilo Instagram) */}
            <div className="glass-card p-6 bg-gradient-to-b from-zinc-950/80 to-zinc-950/40 border-white/5 relative overflow-hidden rounded-3xl">
              {/* Profile Card Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl" />
              
              <div className="flex flex-col items-center text-center space-y-4">
                
                {/* Profile Image / Dynamic Fallback */}
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
                  
                  {/* Small Live Check-in Pin Overlay */}
                  {presence && (
                    <div className="absolute bottom-0 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#030307] flex items-center justify-center text-[10px] shadow-lg animate-bounce" title="Conectado en vivo">
                      🟢
                    </div>
                  )}
                </div>

                {/* Name & Username */}
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white font-outfit">{profile.full_name || "Usuario"}</h2>
                  <p className="text-sm text-zinc-400">@{profile.username || "usuario"}</p>
                </div>

                {/* Level badge */}
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

                {/* Bio & City */}
                <div className="space-y-2 max-w-xs">
                  {profile.city && profile.city !== "No especificada" && (
                    <p className="text-xs text-zinc-400 flex items-center justify-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>{profile.city}</span>
                    </p>
                  )}
                  {profile.bio ? (
                    <p className="text-xs text-zinc-300 italic px-4 leading-relaxed font-medium">"{profile.bio}"</p>
                  ) : (
                    <p className="text-xs text-zinc-500 italic px-4 leading-relaxed">Sin biografía configurada.</p>
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

                {/* Profile actions (Edit & Share) */}
                <div className="grid grid-cols-2 gap-3 w-full pt-2">
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/15 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-zinc-400" />
                    <span>Editar Perfil</span>
                  </Link>

                  <button
                    onClick={handleCopyProfileLink}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-purple-600/10 border border-purple-500/20 hover:bg-purple-600/20 hover:border-purple-500/35 text-purple-300 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
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

            {/* 2. SECCIÓN HANGOVER CONNECT (Bloque Protagonista) */}
            <div className="glass-card p-6 bg-gradient-to-b from-purple-950/20 via-zinc-950/90 to-zinc-950/70 border-purple-500/10 rounded-3xl relative overflow-hidden">
              {/* Connect Indicator Glow */}
              <div className={`absolute top-0 right-0 w-2 h-2 rounded-full m-4 animate-ping ${presence ? "bg-emerald-500" : "bg-zinc-600"}`} />
              
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs">
                      💬
                    </div>
                    <h3 className="text-md font-bold tracking-tight text-white font-outfit uppercase">Hangover Connect</h3>
                  </div>
                  <p className="text-xs text-zinc-400">Tu presencia digital en vivo dentro de la comunidad nocturna.</p>
                </div>

                {/* Check-in Venue Status */}
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block">Ubicación Actual</span>
                    {presence ? (
                      <Link 
                        href={activeVenueSlug}
                        className="font-bold text-white hover:text-purple-400 transition-colors flex items-center gap-1 group"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        <span>📍 Actualmente en {activeVenueName}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ) : (
                      <p className="text-zinc-400 font-medium italic">No estás checkeado en ningún local.</p>
                    )}
                  </div>
                  {presence && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-[9px] uppercase tracking-wider">
                      En Vivo
                    </span>
                  )}
                </div>

                {presence && (
                  <div className="space-y-4">
                    {/* Connect Status selector */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block">Mi Estado</span>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handlePresenceStatusChange('available')}
                          className={`px-2 py-2.5 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                            presenceStatus === 'available'
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-white/5 border-white/5 text-zinc-400 hover:text-white"
                          }`}
                        >
                          <span className="text-xs">🟢</span>
                          <span>Disponible</span>
                        </button>
                        <button
                          onClick={() => handlePresenceStatusChange('observing')}
                          className={`px-2 py-2.5 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                            presenceStatus === 'observing'
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                              : "bg-white/5 border-white/5 text-zinc-400 hover:text-white"
                          }`}
                        >
                          <span className="text-xs">🟡</span>
                          <span>Observando</span>
                        </button>
                        <button
                          onClick={() => handlePresenceStatusChange('do_not_disturb')}
                          className={`px-2 py-2.5 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                            presenceStatus === 'do_not_disturb'
                              ? "bg-red-500/10 border-red-500/30 text-red-400"
                              : "bg-white/5 border-white/5 text-zinc-400 hover:text-white"
                          }`}
                        >
                          <span className="text-xs">🔴</span>
                          <span>No Molestar</span>
                        </button>
                      </div>
                    </div>

                    {/* Visibility Switch */}
                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl text-xs">
                      <div>
                        <p className="font-bold text-zinc-200">
                          {presenceVisibility === 'visible' ? "Modo Público" : "Modo Fantasma"}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          {presenceVisibility === 'visible' 
                            ? "Otros usuarios en el local pueden interactuar contigo." 
                            : "Estás conectado pero oculto en la comunidad."}
                        </p>
                      </div>
                      <button
                        onClick={handlePresenceVisibilityToggle}
                        className={`w-11 h-6 rounded-full p-1 transition-all ${
                          presenceVisibility === 'visible' ? "bg-purple-600" : "bg-zinc-700"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-all ${
                          presenceVisibility === 'visible' ? "translate-x-5" : "translate-x-0"
                        }`} />
                      </button>
                    </div>

                    {/* Chat Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-[#0a0a10] border border-white/5 rounded-2xl text-center space-y-0.5">
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">Conexiones</span>
                        <p className="text-lg font-black text-purple-400 font-outfit">{chatCount}</p>
                        <span className="text-[9px] text-zinc-400">chats activos</span>
                      </div>

                      <div className="p-3 bg-[#0a0a10] border border-white/5 rounded-2xl text-center space-y-0.5 relative">
                        {pendingRequestCount > 0 && (
                          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        )}
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">Solicitudes</span>
                        <p className="text-lg font-black text-pink-400 font-outfit">{pendingRequestCount}</p>
                        <span className="text-[9px] text-zinc-400">pendientes</span>
                      </div>
                    </div>

                    {/* Connect Community Hub Button */}
                    <Link
                      href={presence.club_id ? `/discotecas/${clubs.find(c => c.id === presence.club_id)?.slug || ""}?tab=connect` : "/discotecas"}
                      className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl py-3 text-xs font-bold transition-all shadow-lg shadow-purple-500/10 cursor-pointer text-center active:scale-95"
                    >
                      <MessageSquare className="w-4 h-4 shrink-0" />
                      <span>Ir al Chat de la Comunidad</span>
                    </Link>
                  </div>
                )}

                {!presence && (
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center space-y-3">
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      El modo **Connect** te permite chatear en tiempo real con personas en la misma discoteca. 
                      Para activarlo, realiza check-in escaneando tu QR de reserva en la entrada del local.
                    </p>
                    <Link 
                      href="/discotecas"
                      className="inline-flex items-center gap-1.5 text-xs text-purple-400 font-bold hover:underline"
                    >
                      <span>Descubrir locales</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}

              </div>
            </div>

            {/* 3. SECCIÓN MI QR HANGOVER */}
            <div className="glass-card p-6 bg-gradient-to-b from-zinc-950/80 to-zinc-950/40 border-white/5 rounded-3xl relative overflow-hidden">
              <div className="flex flex-col items-center text-center space-y-5">
                
                <div className="space-y-1 w-full text-left">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-purple-400 shrink-0" />
                    <h3 className="text-md font-bold tracking-tight text-white font-outfit uppercase">Mi QR Hangover</h3>
                  </div>
                  <p className="text-xs text-zinc-400">Identifícate al instante en discotecas, eventos y para networking.</p>
                </div>

                {/* QR mini card trigger */}
                <button 
                  onClick={() => setShowQRModal(true)}
                  className="group relative bg-white p-4 rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.1)] hover:shadow-[0_0_40px_rgba(139,92,246,0.25)] transition-all duration-300 cursor-pointer active:scale-95"
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(userQRData)}&color=000000&bgcolor=ffffff`}
                    alt="Tu código QR"
                    className="w-32 h-32 block group-hover:scale-102 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center text-white text-xs font-bold font-outfit uppercase tracking-wider">
                    🔍 Ampliar QR
                  </div>
                </button>

                {/* Unique identity code */}
                <div className="w-full flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl text-xs">
                  <div className="text-left">
                    <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">Código Identidad</span>
                    <span className="font-mono text-zinc-200 font-semibold">{userUniqueCode}</span>
                  </div>
                  
                  <button
                    onClick={handleCopyQRLink}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-300 font-bold text-[10px] transition-colors border border-white/5"
                  >
                    {copiedQR ? "¡Copiado!" : "Copiar Código"}
                  </button>
                </div>

              </div>
            </div>

            {/* Logout button */}
            <form action={logout} className="pt-2">
              <button 
                type="submit" 
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-2xl text-red-400 text-xs font-bold transition-all cursor-pointer active:scale-98"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Cerrar Sesión
              </button>
            </form>

          </div>

          {/* RIGHT SIDE: TIMELINE PLANS, HISTORY TIMELINE, FAVORITES CAROUSELS, RECOMMENDATIONS, BOOKINGS */}
          <div className="space-y-10">
            
            {/* 4. TU PRÓXIMA NOCHE (Timeline de Planes) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold uppercase tracking-wider font-outfit text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  Tu Próxima Noche
                </h3>
                <span className="text-xs text-zinc-500 font-bold">{upcomingBookings.length} planes próximos</span>
              </div>

              {upcomingBookings.length > 0 ? (
                <div className="relative border-l border-white/10 pl-6 ml-3 space-y-6">
                  {upcomingBookings.slice(0, 3).map((b, idx) => {
                    const { title, image, slug, type } = getBookingDetails(b);
                    const formattedDate = new Date(b.reservation_date || b.event_date).toLocaleDateString("es-ES", {
                      weekday: "short",
                      day: "numeric",
                      month: "short"
                    });
                    
                    return (
                      <div key={b.id} className="relative">
                        {/* Timeline Node Ring */}
                        <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 border-2 border-[#030307] shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                        
                        <div className="glass-card p-4 hover:border-white/10 transition-all flex items-center justify-between gap-4 rounded-2xl bg-zinc-950/40">
                          <div className="flex items-center gap-3">
                            {image ? (
                              <img
                                src={image}
                                alt={title}
                                className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-purple-950/40 text-purple-400 border border-purple-500/10 flex items-center justify-center font-bold text-sm shrink-0">
                                🍸
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-white text-sm leading-none">{title}</h4>
                                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold uppercase tracking-wider">
                                  {type}
                                </span>
                              </div>
                              <p className="text-zinc-400 text-[11px] capitalize mt-1.5">{formattedDate} • {b.number_of_people || 1} pers.</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl uppercase tracking-wider">
                              {b.status === "confirmed" ? "Confirmado" : "Pendiente"}
                            </span>
                            {slug && (
                              <Link 
                                href={`/discotecas/${slug}`}
                                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-zinc-300 hover:text-white transition-all shrink-0"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center bg-zinc-950/30 rounded-3xl border border-dashed border-white/5 space-y-3">
                  <p className="text-xs text-zinc-500">No tienes reservas o eventos confirmados para los próximos días.</p>
                  <Link 
                    href="/events"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
                  >
                    <span>Explorar Eventos</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>

            {/* 5. ACTIVIDAD RECIENTE (Feed Social) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold uppercase tracking-wider font-outfit text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Actividad Reciente
                </h3>
              </div>

              {displayActivities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayActivities.map((act) => {
                    const timeAgo = act.date.toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short"
                    });
                    
                    return (
                      <div key={act.id} className="p-4 bg-zinc-950/40 border border-white/5 rounded-2xl flex gap-3 items-start hover:border-white/10 transition-colors">
                        <div className="w-8 h-8 rounded-xl bg-purple-600/10 border border-purple-500/10 flex items-center justify-center text-sm shrink-0">
                          {act.icon}
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center w-full">
                            <h4 className="font-bold text-white text-xs">{act.title}</h4>
                            <span className="text-[9px] text-zinc-500 font-bold">{timeAgo}</span>
                          </div>
                          <p className="text-zinc-400 text-[11px] leading-relaxed font-medium">{act.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center bg-zinc-950/30 rounded-3xl border border-dashed border-white/5 text-xs text-zinc-500">
                  Aún no tienes actividad registrada en la plataforma.
                </div>
              )}
            </div>

            {/* 6. MI HISTORIAL NOCTURNO (Timeline mensual) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold uppercase tracking-wider font-outfit text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-400" />
                  Mi Historial Nocturno
                </h3>
              </div>

              {Object.keys(groupedPastHistory).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(groupedPastHistory).slice(0, 3).map(([monthYear, items]) => (
                    <div key={monthYear} className="space-y-3">
                      <h4 className="text-xs font-black uppercase text-purple-400/80 tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                        {monthYear}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {items.map((b) => {
                          const { title, image, type } = getBookingDetails(b);
                          const dateDay = new Date(b.reservation_date || b.event_date).toLocaleDateString("es-ES", {
                            day: "numeric"
                          });

                          return (
                            <div key={b.id} className="p-3.5 bg-black/40 border border-white/5 rounded-2xl flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-purple-950/20 text-purple-400 border border-purple-500/10 flex items-center justify-center font-bold text-sm shrink-0">
                                ✓
                              </div>
                              <div className="overflow-hidden">
                                <h5 className="font-bold text-white text-xs truncate leading-tight">{title}</h5>
                                <p className="text-zinc-500 text-[10px] mt-0.5">Día {dateDay} • {type}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-zinc-950/30 rounded-3xl border border-dashed border-white/5 text-xs text-zinc-500">
                  No tienes registros históricos de salidas anteriores.
                </div>
              )}
            </div>

            {/* 7. FAVORITOS (Carruseles Horizontales de base de datos) */}
            <div className="space-y-6">
              
              {/* Locales Favoritos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                    Locales Favoritos
                  </h4>
                </div>

                {favoriteClubs.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    {favoriteClubs.map((clubId) => {
                      const club = clubs.find((c) => c.id === clubId);
                      if (!club) return null;
                      
                      return (
                        <div key={club.id} className="w-56 bg-zinc-950/50 border border-white/5 rounded-2xl overflow-hidden shrink-0 flex flex-col justify-between hover:border-white/10 transition-colors">
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
                            <h5 className="font-bold text-white text-xs truncate">{club.name}</h5>
                            {club.city && (
                              <p className="text-[10px] text-zinc-400 flex items-center gap-0.5">
                                <MapPin className="w-3 h-3 text-purple-400" />
                                <span>{club.city}</span>
                              </p>
                            )}
                            <Link
                              href={`/discotecas/${club.slug}`}
                              className="w-full inline-flex items-center justify-center gap-1 bg-white/5 hover:bg-white/10 text-white rounded-lg py-2 text-[10px] font-bold transition-all border border-white/5"
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
                  <div className="p-6 text-center bg-zinc-950/30 rounded-2xl border border-dashed border-white/5 text-xs text-zinc-500">
                    No has guardado locales favoritos. ¡Explora discotecas para agregar tu favorita!
                  </div>
                )}
              </div>

              {/* Eventos Guardados */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Eventos Guardados
                  </h4>
                </div>

                {favoriteEvents.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    {favoriteEvents.map((eventId) => {
                      const ev = events.find((e) => e.id === eventId);
                      if (!ev) return null;
                      
                      const evDate = new Date(ev.event_date).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short"
                      });

                      return (
                        <div key={ev.id} className="w-56 bg-zinc-950/50 border border-white/5 rounded-2xl overflow-hidden shrink-0 flex flex-col justify-between hover:border-white/10 transition-colors">
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
                            <h5 className="font-bold text-white text-xs truncate">{ev.title}</h5>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-purple-400 font-bold">{evDate}</span>
                              <span className="text-emerald-400 font-bold">{ev.ticket_price > 0 ? `$${ev.ticket_price}` : "Gratis"}</span>
                            </div>
                            <Link
                              href={`/events/${ev.id}`}
                              className="w-full inline-flex items-center justify-center gap-1 bg-white/5 hover:bg-white/10 text-white rounded-lg py-2 text-[10px] font-bold transition-all border border-white/5"
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
                  <div className="p-6 text-center bg-zinc-950/30 rounded-2xl border border-dashed border-white/5 text-xs text-zinc-500">
                    No has guardado eventos. ¡Visita los eventos programados para guardar tus preferidos!
                  </div>
                )}
              </div>

            </div>

            {/* 8. EVENTOS RECOMENDADOS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold uppercase tracking-wider font-outfit text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Eventos Recomendados
                </h3>
              </div>

              {recommendedEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recommendedEvents.map((ev) => {
                    const evDate = new Date(ev.event_date).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short"
                    });
                    
                    return (
                      <div key={ev.id} className="glass-card overflow-hidden hover:border-white/10 transition-colors flex flex-col justify-between bg-zinc-950/40 rounded-2xl">
                        <div className="relative h-32 w-full bg-zinc-900">
                          {ev.image_url ? (
                            <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-purple-950/20 flex items-center justify-center text-zinc-500 text-xl font-bold">
                              🎟
                            </div>
                          )}
                          <button
                            onClick={() => handleToggleEvent(ev.id)}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer active:scale-90"
                          >
                            <Heart className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="p-4 space-y-2">
                          <h5 className="font-bold text-white text-xs truncate">{ev.title}</h5>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-purple-400 font-bold">{evDate}</span>
                            <span className="text-emerald-400 font-extrabold">{ev.ticket_price > 0 ? `$${ev.ticket_price}` : "Gratis"}</span>
                          </div>
                          <Link
                            href={`/events/${ev.id}`}
                            className="w-full inline-flex items-center justify-center gap-1 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-300 rounded-lg py-2 text-[10px] font-bold transition-all"
                          >
                            <span>Ver Info</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center bg-zinc-950/30 rounded-3xl border border-dashed border-white/5 text-xs text-zinc-500">
                  No hay recomendaciones disponibles para tu zona en este momento.
                </div>
              )}
            </div>

            {/* 9. MIS RESERVAS (Pestañas de Reservas originales) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold uppercase tracking-wider font-outfit text-white flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-purple-400" />
                  Administrar Reservas
                </h3>
              </div>

              {/* Original listings tab */}
              <div className="glass-card p-6 bg-zinc-950/30 rounded-3xl border border-white/5">
                <UserBookingsTabs initialBookings={normalizedBookings} />
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* MODAL: QR AMPLIO DETALLADO */}
      <AnimatePresence>
        {showQRModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            
            {/* Close touch area outside */}
            <div className="absolute inset-0 cursor-default" onClick={() => setShowQRModal(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="glass-card w-full max-w-sm p-6 bg-[#0c0c14] border border-white/10 rounded-3xl relative overflow-hidden z-10 text-center space-y-6"
            >
              {/* Glow accents */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h3 className="font-extrabold text-white text-md tracking-tight uppercase font-outfit">Mi Identidad QR</h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="p-1.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Presenta este QR a los relacionistas o porteros para check-ins rápidos, acreditaciones y networking Connect.
                </p>

                {/* QR Code */}
                <div className="bg-white p-4 rounded-2xl inline-block shadow-[0_0_40px_rgba(168,85,247,0.25)] border-2 border-purple-500/20">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(userQRData)}&color=000000&bgcolor=ffffff`}
                    alt="Código QR de Identidad"
                    className="w-52 h-52 block"
                    loading="lazy"
                  />
                </div>

                {/* Details info */}
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-left space-y-2">
                  <div className="flex justify-between items-center text-xs text-zinc-400">
                    <span>Nombre:</span>
                    <span className="text-white font-bold">{profile.full_name || "Usuario"}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-zinc-400">
                    <span>Username:</span>
                    <span className="text-purple-400 font-bold">@{profile.username}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-zinc-400 border-t border-white/5 pt-2 mt-1">
                    <span>Código único:</span>
                    <span className="font-mono text-[11px] text-zinc-200 font-bold">{userUniqueCode}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
