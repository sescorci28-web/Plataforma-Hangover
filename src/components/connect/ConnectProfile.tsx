"use client";

import { useState } from "react";
import {
  Star,
  MapPin,
  Calendar,
  Users,
  Building2,
  Trophy,
  Activity,
  UserCheck,
  UserPlus,
  MessageSquare,
  Share2,
  CheckCircle,
  ExternalLink,
  Flame,
  Award,
  Zap,
} from "lucide-react";

interface ProfileProps {
  userProfile: any;       // The profile currently viewed
  currentUser: any;       // The active logged-in user
  validatedBookings: any[];
  allClubs: any[];
  allEvents: any[];
  onOpenChat: (userId: string) => void;
  onClose?: () => void;
}

export function ConnectProfile({
  userProfile,
  currentUser,
  validatedBookings,
  allClubs,
  allEvents,
  onOpenChat,
  onClose,
}: ProfileProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(142);
  const [following, setFollowing] = useState(89);
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  const [agendaShared, setAgendaShared] = useState(true);

  // 1. Calculate Social Level and Points based on real data & triggers
  const attendedEventsCount = validatedBookings.filter(b => b.event_id && (b.status === "completed" || b.qr_status === "used")).length;
  const completedReservationsCount = validatedBookings.filter(b => b.booking_type === "club_vip" && (b.status === "completed" || b.qr_status === "used")).length;
  
  // Calculate points: Event check-in = 20 pts, VIP Reservation = 30 pts, followers = 5 pts
  const points = (attendedEventsCount * 20) + (completedReservationsCount * 30) + (followers * 5);
  
  const getSocialLevel = (pts: number) => {
    if (pts < 150) return { name: "Rookie", color: "text-zinc-400 bg-zinc-900 border-zinc-700", desc: "Comenzando la rumba" };
    if (pts < 500) return { name: "Popular", color: "text-cyan-400 bg-cyan-950/20 border-cyan-500/30", desc: "El alma de la fiesta" };
    if (pts < 1000) return { name: "VIP Member", color: "text-purple-400 bg-purple-950/20 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]", desc: "Acceso exclusivo" };
    if (pts < 2500) return { name: "Influencer", color: "text-pink-400 bg-pink-950/20 border-pink-500/30 shadow-[0_0_20px_rgba(236,72,153,0.3)] animate-pulse", desc: "Creador de tendencias" };
    return { name: "Legend", color: "text-amber-400 bg-amber-950/20 border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.4)] font-black uppercase tracking-widest", desc: "Rey de la noche" };
  };

  const level = getSocialLevel(points);

  // 2. Achievements listing (Gamification)
  const achievements = [
    { id: "first-res", name: "Primera Reserva", desc: "Aseguraste tu primera mesa VIP", unlocked: completedReservationsCount > 0, icon: "🍾" },
    { id: "checkin-master", name: "Rumbero Fiel", desc: "Asististe a más de 3 eventos", unlocked: attendedEventsCount >= 3, icon: "🎫" },
    { id: "vip-status", name: "VIP Local", desc: "Lograste más de 500 puntos sociales", unlocked: points >= 500, icon: "👑" },
    { id: "socialite", name: "Conector", desc: "Superaste los 100 seguidores", unlocked: followers >= 100, icon: "🤝" },
  ];

  const toggleFollow = () => {
    setIsFollowing(!isFollowing);
    setFollowers(prev => isFollowing ? prev - 1 : prev + 1);
  };

  const handleShareAgenda = () => {
    setShowShareSuccess(true);
    setTimeout(() => setShowShareSuccess(false), 3000);
  };

  const isOwnProfile = userProfile.id === currentUser.id;

  // Resolve user attended venues
  const attendedEvents = validatedBookings
    .filter(b => b.event_id && (b.status === "completed" || b.qr_status === "used"))
    .map(b => allEvents.find(e => e.id === b.event_id))
    .filter(Boolean);

  // Resolve user favorite clubs
  const favoriteClubs = allClubs.slice(0, 2); // Simulating favorite clubs

  return (
    <div className="glass-card bg-[#09090f]/95 border-white/10 rounded-[28px] p-6 space-y-6 max-w-2xl w-full mx-auto relative overflow-hidden shadow-2xl">
      {onClose && (
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors cursor-pointer">
          ✕
        </button>
      )}

      {/* 1. HEADER PROFILE CARD */}
      <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start border-b border-white/5 pb-6">
        <div className="relative">
          {userProfile.avatar_url ? (
            <img src={userProfile.avatar_url} alt={userProfile.full_name} className="w-24 h-24 rounded-full object-cover border-2 border-primary-500 p-0.5 bg-black" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary-600 flex items-center justify-center text-3xl font-black font-outfit text-white">
              {userProfile.full_name[0].toUpperCase()}
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#09090f] flex items-center justify-center text-[10px] text-white font-bold" title="En línea en Connect">
            ●
          </span>
        </div>

        <div className="flex-grow text-center sm:text-left space-y-2.5">
          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-xl font-black text-white font-outfit uppercase tracking-tight">{userProfile.full_name}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${level.color}`}>
                {level.name}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">@{userProfile.username || "username"}</p>
          </div>

          <p className="text-xs text-zinc-300 italic max-w-md">
            "{userProfile.bio || "Rumbero de corazón. Listo para los mejores planes de nightlife."}"
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-x-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-primary-400" /> {userProfile.city || "Barranquilla"}</span>
            <span>•</span>
            <span className="flex items-center gap-1 font-bold text-white"><Users className="w-3.5 h-3.5 text-purple-400" /> {followers} Seguidores</span>
            <span>•</span>
            <span className="flex items-center gap-1 font-bold text-white">{following} Siguiendo</span>
          </div>
        </div>

        {/* Action Buttons */}
        {!isOwnProfile && (
          <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={toggleFollow}
              className={`flex-grow sm:flex-grow-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isFollowing
                  ? "bg-zinc-800 border-white/10 text-white"
                  : "bg-primary-600 hover:bg-primary-500 text-white border-transparent shadow-lg shadow-primary-500/10"
              }`}
            >
              {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>{isFollowing ? "Siguiendo" : "Seguir"}</span>
            </button>
            <button
              onClick={() => onOpenChat(userProfile.id)}
              className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/20 text-xs font-bold transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Mensaje</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. SYSTEM OF SOCIAL REPUTATION & STATISTICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-2">
          <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Reputación Social de Nightlife</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400 font-outfit">98%</span>
            <span className="text-xs text-zinc-400">Score Positivo</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: "98%" }} />
          </div>
          <p className="text-[10px] text-zinc-500">Calculado por reservas completadas y asistencia verificada.</p>
        </div>

        <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-2">
          <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Actividad Total</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-400 font-outfit">{points}</span>
            <span className="text-xs text-zinc-400">Puntos Sociales</span>
          </div>
          <p className="text-[10px] text-zinc-400 font-semibold">{level.desc}</p>
        </div>
      </div>

      {/* 3. GAMIFIED ACHIEVEMENTS */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1">
          <Trophy className="w-4 h-4 text-amber-400" /> Logros Desbloqueados
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-3 rounded-2xl border text-center space-y-1.5 flex flex-col justify-between transition-all ${
                ach.unlocked
                  ? "bg-amber-500/5 border-amber-500/20 text-amber-300"
                  : "bg-black/20 border-white/5 text-zinc-650 opacity-50"
              }`}
            >
              <span className="text-xl block">{ach.icon}</span>
              <div>
                <h4 className="text-[10px] font-black uppercase truncate font-outfit">{ach.name}</h4>
                <p className="text-[8px] text-zinc-500 leading-tight mt-0.5 line-clamp-2">{ach.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. VERIFIED ATTENDED EVENTS & FAVORITE CLUBS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> Eventos Asistidos (Verificados)
          </h3>
          {attendedEvents.length > 0 ? (
            <div className="space-y-2">
              {attendedEvents.slice(0, 3).map((evt: any) => (
                <div key={evt.id} className="bg-black/30 border border-white/5 p-2.5 rounded-xl flex items-center gap-2">
                  <img src={evt.thumbnail_url || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=200"} alt={evt.title} className="w-8 h-8 rounded-lg object-cover border border-white/10" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate leading-tight">{evt.title}</p>
                    <p className="text-[9px] text-zinc-500 mt-0.5">{evt.event_date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-zinc-600 italic">No hay registros verificados en puerta QR aún.</p>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-purple-400" /> Discotecas Favoritas
          </h3>
          {favoriteClubs.length > 0 ? (
            <div className="space-y-2">
              {favoriteClubs.map((club: any) => (
                <div key={club.id} className="bg-black/30 border border-white/5 p-2.5 rounded-xl flex items-center gap-2">
                  <img src={club.logo || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=200"} alt={club.name} className="w-8 h-8 rounded-lg object-cover border border-white/10" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate leading-tight">{club.name}</p>
                    <p className="text-[9px] text-zinc-500 mt-0.5">{club.city}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-zinc-600 italic">No has marcado locales preferidos.</p>
          )}
        </div>
      </div>

      {/* 5. SHAREABLE SOCIAL AGENDA */}
      <div className="bg-white/5 border border-white/5 p-4 rounded-3xl space-y-3 relative">
        <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-400" />
            <h3 className="text-xs font-black uppercase text-white font-outfit">Mi Agenda Social de Fiestas</h3>
          </div>
          {isOwnProfile && (
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-zinc-500 font-bold uppercase">Compartir con Crew</span>
              <button
                onClick={() => setAgendaShared(!agendaShared)}
                className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  agendaShared ? 'bg-primary-600' : 'bg-zinc-700'
                }`}
              >
                <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                  agendaShared ? 'translate-x-3.5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {attendedEvents.slice(0, 1).map((evt: any) => (
            <div key={evt.id} className="flex justify-between items-center text-xs">
              <span className="font-semibold text-white">🎟️ Evento: {evt.title}</span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Asistencia Confirmada</span>
            </div>
          ))}
          {completedReservationsCount > 0 && (
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-white">🍾 Mesa VIP: Dulcinea Medellín</span>
              <span className="text-[10px] text-purple-400 font-bold bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">Mesa Confirmada</span>
            </div>
          )}
        </div>

        {isOwnProfile && (
          <div className="pt-2 border-t border-white/5 flex justify-between items-center">
            <p className="text-[9px] text-zinc-500">Tus amigos del Crew pueden ver qué días saldrás de fiesta.</p>
            <button
              onClick={handleShareAgenda}
              className="flex items-center gap-1 text-[10px] bg-primary-650/10 border border-primary-500/25 px-2.5 py-1 rounded-lg text-primary-400 font-bold hover:bg-primary-600/20 transition-all cursor-pointer"
            >
              <Share2 className="w-3 h-3" /> Compartir Enlace
            </button>
          </div>
        )}

        {showShareSuccess && (
          <div className="absolute inset-0 bg-[#09090f]/95 border border-primary-500/30 rounded-3xl flex items-center justify-center text-xs font-bold text-emerald-400 font-outfit uppercase tracking-wider animate-fadeIn">
            ¡Enlace de Agenda Social copiado al portapapeles!
          </div>
        )}
      </div>
    </div>
  );
}
