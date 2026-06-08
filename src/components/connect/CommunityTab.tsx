"use client";

import { useState, useEffect, useTransition } from "react";
import { 
  Users, Sparkles, Shield, Eye, EyeOff, LogOut, Check, X, 
  MessageSquare, Loader2, UserCheck, AlertTriangle, AlertCircle,
  UserMinus, ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

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
  checkInUser, 
  checkOutUser, 
  updatePresenceHeartbeat, 
  sendConnectRequest, 
  handleConnectRequest,
  blockUser,
  reportUser,
  updateSocialProfile
} from "@/app/services/connectActions";
import { ChatWidget } from "./ChatWidget";

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  social_instagram: string | null;
  social_tiktok: string | null;
}

interface Presence {
  id: string;
  user_id: string;
  visibility: 'visible' | 'invisible';
  status: 'available' | 'observing' | 'do_not_disturb';
  check_in_at: string;
  user?: Profile;
}

interface Request {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface Chat {
  id: string;
  user_a_id: string;
  user_b_id: string;
  club_id: string | null;
  event_id: string | null;
  created_at?: string;
  otherUser?: Profile;
}

interface CommunityTabProps {
  clubId?: string | null;
  eventId?: string | null;
  hasAccess: boolean;
  bookingId?: string | null;
  currentUser: any;
}

export function CommunityTab({ clubId, eventId, hasAccess, bookingId, currentUser }: CommunityTabProps) {
  const [activePresence, setActivePresence] = useState<Presence[]>([]);
  const [myPresence, setMyPresence] = useState<Presence | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isPending, startTransition] = useTransition();

  // Settings states
  const [selectedVisibility, setSelectedVisibility] = useState<'visible' | 'invisible'>('visible');
  const [selectedStatus, setSelectedStatus] = useState<'available' | 'observing' | 'do_not_disturb'>('available');

  // Interactive modal states
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  // Social edit profile state
  const [isEditingSocial, setIsEditingSocial] = useState(false);
  const [instagramUser, setInstagramUser] = useState("");
  const [userBio, setUserBio] = useState("");

  const supabase = createClient();
  const venueType = clubId ? 'club' : 'event';
  const venueId = clubId || eventId;

  // 1. Fetch initial status data
  const fetchCommunityData = async () => {
    if (!currentUser) return;

    try {
      // Fetch current user presence
      const presenceQuery = supabase
        .from("connect_presence")
        .select("*, user:profiles(*)")
        .eq("user_id", currentUser.id);
      
      if (clubId) presenceQuery.eq("club_id", clubId);
      if (eventId) presenceQuery.eq("event_id", eventId);

      const { data: myPresenceData } = await presenceQuery.maybeSingle();
      setMyPresence(myPresenceData as any);

      if (myPresenceData) {
        setSelectedVisibility(myPresenceData.visibility);
        setSelectedStatus(myPresenceData.status);

        // Retrieve other active presence users
        const othersQuery = supabase
          .from("connect_presence")
          .select("*, user:profiles(*)")
          .neq("user_id", currentUser.id)
          .gt("expires_at", new Date().toISOString())
          .gt("last_seen_at", new Date(Date.now() - 15 * 60 * 1000).toISOString()); // Heartbeat within 15 min

        if (clubId) othersQuery.eq("club_id", clubId);
        if (eventId) othersQuery.eq("event_id", eventId);

        const { data: othersData } = await othersQuery;
        setActivePresence((othersData as any[]) || []);
      } else {
        setActivePresence([]);
      }

      // Fetch requests related to user in this local context
      const reqQuery = supabase
        .from("connect_requests")
        .select("*")
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);
      
      if (clubId) reqQuery.eq("club_id", clubId);
      if (eventId) reqQuery.eq("event_id", eventId);

      const { data: reqData } = await reqQuery;
      setRequests((reqData as any[]) || []);

      // Fetch chats
      const chatsQuery = supabase
        .from("connect_chats")
        .select("*")
        .or(`user_a_id.eq.${currentUser.id},user_b_id.eq.${currentUser.id}`);

      const { data: chatsData } = await chatsQuery;
      
      if (chatsData && chatsData.length > 0) {
        // Hydrate chats with other user profiles
        const hydratedChats = await Promise.all(
          chatsData.map(async (chat) => {
            const otherUserId = chat.user_a_id === currentUser.id ? chat.user_b_id : chat.user_a_id;
            const { data: otherProfile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", otherUserId)
              .single();
            return {
              ...chat,
              otherUser: otherProfile
            };
          })
        );
        setChats(hydratedChats);
      } else {
        setChats([]);
      }
    } catch (err) {
      console.error("Error fetching community data:", err);
    }
  };

  useEffect(() => {
    fetchCommunityData();
  }, [currentUser, clubId, eventId]);

  // 2. Realtime Subscription Channels
  useEffect(() => {
    if (!currentUser) return;

    // Set up postgres changes listeners
    const channel = supabase
      .channel("connect-realtime-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connect_presence" },
        () => {
          fetchCommunityData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connect_requests" },
        () => {
          fetchCommunityData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connect_chats" },
        () => {
          fetchCommunityData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // 3. Heartbeat Timer (Every 5 minutes = 300000ms)
  useEffect(() => {
    if (!myPresence || !currentUser) return;

    const runHeartbeat = async () => {
      await updatePresenceHeartbeat({ clubId, eventId });
    };

    runHeartbeat(); // Trigger immediate ping on mount / presence load

    const intervalId = setInterval(runHeartbeat, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(intervalId);
  }, [myPresence, currentUser, clubId, eventId]);

  // Handle actions
  const handleCheckIn = (visibility: 'visible' | 'invisible', status: 'available' | 'observing' | 'do_not_disturb') => {
    if (!bookingId) return;
    startTransition(async () => {
      const res = await checkInUser({
        clubId,
        eventId,
        bookingId,
        visibility,
        status
      });
      if (res.success) {
        await fetchCommunityData();
      } else {
        alert(res.error || "Ocurrió un error al unirse.");
      }
    });
  };

  const handleCheckOut = () => {
    if (window.confirm("¿Seguro que deseas salir de Hangover Connect? Ya no aparecerás en la lista ni podrás ver a otros.")) {
      startTransition(async () => {
        const res = await checkOutUser({ clubId, eventId });
        if (res.success) {
          setMyPresence(null);
          setActivePresence([]);
          setRequests([]);
          setChats([]);
        } else {
          alert(res.error || "Ocurrió un error al salir.");
        }
      });
    }
  };

  const handleSendRequest = async (receiverId: string) => {
    const res = await sendConnectRequest({
      receiverId,
      clubId,
      eventId
    });
    if (res.success) {
      await fetchCommunityData();
    } else {
      alert(res.error);
    }
  };

  const handleProcessRequest = async (requestId: string, accept: boolean) => {
    const res = await handleConnectRequest({
      requestId,
      status: accept ? 'accepted' : 'rejected'
    });
    if (res.success) {
      await fetchCommunityData();
    } else {
      alert(res.error);
    }
  };

  const handleBlock = async (blockedId: string) => {
    if (window.confirm("¿Seguro que deseas bloquear a este usuario? Ninguno podrá ver la presencia o mensajes del otro.")) {
      const res = await blockUser({ blockedId });
      if (res.success) {
        await fetchCommunityData();
      } else {
        alert(res.error);
      }
    }
  };

  const handleReport = async () => {
    if (!reportTargetId || !reportReason) return;
    setIsReporting(true);
    const res = await reportUser({
      reportedId: reportTargetId,
      reason: reportReason,
      details: reportDetails,
      clubId,
      eventId
    });
    setIsReporting(false);
    if (res.success) {
      alert("Reporte enviado exitosamente. Moderadores revisarán este caso pronto.");
      setReportTargetId(null);
      setReportReason("");
      setReportDetails("");
    } else {
      alert(res.error);
    }
  };

  const handleSaveSocials = async () => {
    startTransition(async () => {
      const res = await updateSocialProfile({
        instagram: instagramUser,
        bio: userBio
      });
      if (res.success) {
        setIsEditingSocial(false);
        await fetchCommunityData();
      } else {
        alert(res.error);
      }
    });
  };

  // Visibility states indicators helpers
  const getStatusDotColor = (status: string) => {
    if (status === 'available') return 'bg-emerald-500';
    if (status === 'observing') return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getStatusText = (status: string) => {
    if (status === 'available') return 'Disponible para conversar';
    if (status === 'observing') return 'Solo observando';
    return 'No molestar';
  };

  // Connection flow helpers
  const getRequestState = (targetId: string) => {
    const req = requests.find(r => 
      (r.sender_id === currentUser?.id && r.receiver_id === targetId) ||
      (r.receiver_id === currentUser?.id && r.sender_id === targetId)
    );
    return req;
  };

  if (!currentUser) {
    return (
      <div className="text-center py-12 border border-white/5 bg-zinc-950/20 rounded-2xl">
        <AlertCircle className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
        <p className="text-xs text-zinc-400">Por favor, inicia sesión para acceder a Connect.</p>
      </div>
    );
  }

  // Compile Anonymous Community Activity Feed
  const communityActivities: { id: string; text: string; date: Date; icon: string }[] = [];

  // 1. Current Active Attendees count (Aggregate)
  const visibleAttendeesCount = activePresence.filter(p => p.visibility === 'visible').length;
  if (visibleAttendeesCount > 0) {
    communityActivities.push({
      id: "com-act-active-count",
      text: `🔥 ${visibleAttendeesCount} usuarios activos esta noche`,
      date: new Date(),
      icon: "⚡"
    });
  }

  // 2. Anonymized check-ins
  activePresence.filter(p => p.visibility === 'visible').slice(0, 5).forEach((p, idx) => {
    // Alternamos texto para reflejar "Usuario se unió a Connect" y "Nuevo check-in"
    const isEven = idx % 2 === 0;
    communityActivities.push({
      id: `com-act-checkin-${p.id}`,
      text: isEven ? "👤 Usuario se unió a Connect" : "📍 Nuevo check-in registrado",
      date: new Date(p.check_in_at),
      icon: isEven ? "👤" : "📍"
    });
  });

  // 3. Anonymized connection chats
  chats.slice(0, 3).forEach((c) => {
    communityActivities.push({
      id: `com-act-conn-${c.id}`,
      text: "🤝 Nueva conexión creada",
      date: new Date(c.created_at || Date.now() - 30 * 60 * 1000),
      icon: "🤝"
    });
  });

  // Sort by date desc
  communityActivities.sort((a, b) => b.date.getTime() - a.date.getTime());
  const displayCommunityActivities = communityActivities.slice(0, 4);

  // A. IF NOT SIGNED UP YET
  if (!myPresence) {
    return (
      <div className="space-y-8 relative max-w-4xl mx-auto">
        {/* Top Header Widget */}
        <div className="glass-card p-5 bg-zinc-950/60 border-white/5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-zinc-700 shrink-0" />
            <div className="space-y-0.5">
              <h4 className="text-sm font-black text-white font-outfit uppercase tracking-wider">
                Hangover Connect
              </h4>
              <p className="text-[11px] text-zinc-500 font-semibold">
                No estás conectado a la comunidad en vivo de este local.
              </p>
            </div>
          </div>
        </div>

        {/* Check-In Panel (Centered) */}
        <div className="glass-card p-6 md:p-8 border-primary-500/20 bg-gradient-to-tr from-primary-950/20 via-zinc-900/60 to-accent-950/10 rounded-3xl text-center shadow-xl relative overflow-hidden max-w-xl mx-auto">
          {/* Glow */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl" />
          
          <div className="w-16 h-16 rounded-2xl bg-primary-600/10 border border-primary-500/20 flex items-center justify-center mx-auto text-primary-400 mb-6">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2 max-w-md mx-auto mb-6">
            <h3 className="text-2xl font-black text-white font-outfit">🔥 HANGOVER CONNECT</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              ¡Estás en el local! Activa la red temporal de vida nocturna de esta noche. Encuentra asistentes reales que están en el mismo local, envía solicitudes y chatea.
            </p>
          </div>

          {hasAccess ? (
            <div className="space-y-6 pt-4 max-w-sm mx-auto">
              {/* Form settings */}
              <div className="space-y-4 text-left">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Tu estado inicial</label>
                  <div className="grid grid-cols-1 gap-2">
                    <button 
                      onClick={() => setSelectedStatus('available')}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                        selectedStatus === 'available' 
                          ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400' 
                          : 'bg-white/3 border-white/5 text-zinc-400 hover:text-zinc-300'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <span>Disponible para conversar</span>
                    </button>
                    <button 
                      onClick={() => setSelectedStatus('observing')}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                        selectedStatus === 'observing' 
                          ? 'bg-amber-500/10 border-amber-500/35 text-amber-400' 
                          : 'bg-white/3 border-white/5 text-zinc-400 hover:text-zinc-300'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                      <span>Solo observando</span>
                    </button>
                    <button 
                      onClick={() => setSelectedStatus('do_not_disturb')}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                        selectedStatus === 'do_not_disturb' 
                          ? 'bg-red-500/10 border-red-500/35 text-red-400' 
                          : 'bg-white/3 border-white/5 text-zinc-400 hover:text-zinc-300'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                      <span>No molestar</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  disabled={isPending}
                  onClick={() => handleCheckIn('invisible', selectedStatus)}
                  className="flex-1 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-extrabold text-xs transition-all border border-white/10"
                >
                  Ingresar Invisible
                </button>
                <button
                  disabled={isPending}
                  onClick={() => handleCheckIn('visible', selectedStatus)}
                  className="flex-1 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-extrabold text-xs transition-all shadow-md shadow-primary-500/10"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Unirse Visible 🟢"}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4.5 rounded-2xl bg-rose-500/5 border border-rose-500/15 max-w-sm mx-auto text-xs text-rose-400 space-y-1.5">
              <Shield className="w-5 h-5 mx-auto text-rose-400" />
              <p className="font-bold">Acceso Restringido</p>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                Necesitas un QR validado por el staff en la entrada del local o evento para poder conectarte esta noche.
              </p>
            </div>
          )}
        </div>

        {/* Connections Section */}
        <div className="space-y-4">
          <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-500 pl-1">
            Conexiones Activas ({chats.length})
          </h3>

          {chats.length === 0 ? (
            <div className="glass-card p-6 bg-zinc-950/20 border-white/5 rounded-2xl text-center space-y-2 max-w-md mx-auto">
              <MessageSquare className="w-7 h-7 text-zinc-700 mx-auto" />
              <p className="text-[11px] text-zinc-500 leading-normal">
                No tienes chats activos. Cuando envíes una solicitud y la acepten, la conversación aparecerá aquí.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {chats.map((chat) => {
                const profile = chat.otherUser;
                if (!profile) return null;

                return (
                  <div
                    key={chat.id}
                    className="p-4 bg-zinc-900/40 border border-white/5 rounded-2xl flex items-center justify-between gap-3 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full border border-white/10 bg-zinc-900 overflow-hidden p-0.5">
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <div className="w-full h-full bg-primary-500/10 flex items-center justify-center text-primary-400 font-extrabold text-xs rounded-full">
                              {profile.full_name?.charAt(0) || "U"}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-xs truncate leading-snug font-outfit">
                          {profile.full_name}
                        </h4>
                        <p className="text-[9px] text-zinc-500 leading-none">
                          Desconectado
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveChat(chat)}
                      className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chatear</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Realtime Chat Widget Overlay Modals */}
        <AnimatePresence>
          {activeChat && (
            <ChatWidget
              chatId={activeChat.id}
              otherUser={activeChat.otherUser as any}
              currentUser={currentUser}
              onClose={() => setActiveChat(null)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // B. IF SIGNED UP (VISIBLE OR INVISIBLE)
  return (
    <div className="space-y-8 relative max-w-5xl mx-auto">
      {/* Top Header Widget */}
      <div className="glass-card p-5 bg-zinc-950/60 border-white/5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className={`w-3.5 h-3.5 rounded-full ${getStatusDotColor(myPresence.status)} shrink-0 animate-pulse`} />
          <div className="space-y-0.5">
            <h4 className="text-sm font-black text-white font-outfit uppercase tracking-wider">
              Estás en Hangover Connect
            </h4>
            <p className="text-[11px] text-zinc-400 font-semibold">
              Modo: <span className="text-white font-bold">{myPresence.visibility === 'visible' ? 'Visible 👁️' : 'Invisible 🕵️'}</span> • {getStatusText(myPresence.status)}
            </p>
          </div>
        </div>

        {/* Presence update status switches */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Social settings update button */}
          <button
            onClick={() => {
              setInstagramUser(myPresence.user?.social_instagram || "");
              setUserBio(myPresence.user?.bio || "");
              setIsEditingSocial(!isEditingSocial);
            }}
            className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            <InstagramIcon className="w-3.5 h-3.5" />
            <span>Editar Perfil Social</span>
          </button>

          <button
            onClick={() => handleCheckIn(myPresence.visibility === 'visible' ? 'invisible' : 'visible', myPresence.status)}
            className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            {myPresence.visibility === 'visible' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>Hacer {myPresence.visibility === 'visible' ? 'Invisible' : 'Visible'}</span>
          </button>

          <button
            onClick={handleCheckOut}
            className="px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 hover:border-red-500/40 text-red-400 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>
      </div>

      {/* Social editing profile inline block */}
      {isEditingSocial && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass-card p-5 bg-[#0a0a14] border border-white/10 rounded-2xl space-y-4"
        >
          <h4 className="text-xs uppercase font-extrabold tracking-widest text-primary-400">Configurar Perfil Social</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Instagram Username (Sin @)</label>
              <input
                type="text"
                value={instagramUser}
                onChange={(e) => setInstagramUser(e.target.value)}
                placeholder="ej: tu_usuario"
                className="w-full bg-white/3 border border-white/5 rounded-xl px-4.5 py-2.5 text-xs text-white placeholder-zinc-650 focus:border-primary-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">Biografía Corta (Max 120 caracteres)</label>
              <input
                type="text"
                maxLength={120}
                value={userBio}
                onChange={(e) => setUserBio(e.target.value)}
                placeholder="ej: Pasando una buena noche con amigos."
                className="w-full bg-white/3 border border-white/5 rounded-xl px-4.5 py-2.5 text-xs text-white placeholder-zinc-650 focus:border-primary-500 outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button 
              onClick={() => setIsEditingSocial(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 text-zinc-400"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSaveSocials}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white"
            >
              {isPending ? "Guardando..." : "Guardar Perfil"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Requests */}
      {requests.filter(r => r.receiver_id === currentUser.id && r.status === 'pending').length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs uppercase font-extrabold tracking-widest text-primary-400 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-primary-400" />
            🔔 Solicitudes de Conexión Recibidas
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests
              .filter(r => r.receiver_id === currentUser.id && r.status === 'pending')
              .map((req) => {
                const presenceUser = activePresence.find(p => p.user_id === req.sender_id);
                const senderProfile = presenceUser?.user;

                if (!senderProfile) return null;

                return (
                  <div key={req.id} className="glass-card p-4.5 bg-gradient-to-r from-primary-950/20 via-zinc-950/50 to-transparent border-primary-500/10 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-white/10 bg-zinc-900 overflow-hidden shrink-0">
                        {senderProfile.avatar_url ? (
                          <img src={senderProfile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-primary-500/10 flex items-center justify-center text-primary-400 font-extrabold text-sm">
                            {senderProfile.full_name?.charAt(0) || "U"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-bold text-white text-xs truncate leading-snug">
                          {senderProfile.full_name}
                        </h5>
                        <p className="text-[9px] text-zinc-500 leading-none">@{senderProfile.username || "sin_username"}</p>
                      </div>
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleProcessRequest(req.id, false)}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer"
                        title="Rechazar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleProcessRequest(req.id, true)}
                        className="w-8 h-8 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                        title="Aceptar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 2. Asistentes en el local */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pl-1">
          <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-500">
            Asistentes en el local ({activePresence.filter(p => p.visibility === 'visible').length})
          </h3>
          {myPresence.visibility === 'invisible' && (
            <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
              🕵️ Estás invisible: No apareces en esta lista
            </span>
          )}
        </div>

        {activePresence.filter(p => p.visibility === 'visible').length === 0 ? (
          <div className="text-center py-16 border border-white/5 bg-zinc-950/20 rounded-2xl">
            <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-white mb-1">Sin asistentes conectados</h4>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">
              Aún no hay otros usuarios visibles checked-in en la comunidad de esta noche. ¡Sé el primero en hacer conexiones!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {activePresence
              .filter(p => p.visibility === 'visible')
              .map((presence) => {
                const profile = presence.user;
                if (!profile) return null;

                const connection = getRequestState(profile.id);
                const isConnected = connection?.status === 'accepted';
                const isRequestPending = connection?.status === 'pending';

                return (
                  <div 
                    key={presence.id} 
                    className="p-5 bg-zinc-900/40 hover:bg-zinc-900/60 transition-all rounded-3xl flex flex-col justify-between h-full group shadow-lg"
                  >
                    {/* Top profile card header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className="w-11 h-11 rounded-full border border-white/10 bg-zinc-900 overflow-hidden p-0.5">
                            {profile.avatar_url ? (
                              <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <div className="w-full h-full bg-primary-500/10 flex items-center justify-center text-primary-400 font-extrabold text-xs rounded-full">
                                {profile.full_name?.charAt(0) || "U"}
                              </div>
                            )}
                          </div>
                          {/* Live status dot with halo pulse */}
                          <span className="absolute bottom-0 right-0 flex h-3 w-3">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                              presence.status === 'available' ? 'bg-emerald-400' : presence.status === 'observing' ? 'bg-amber-400' : 'bg-red-400'
                            }`} />
                            <span className={`relative inline-flex rounded-full h-3 w-3 border border-zinc-950 ${
                              presence.status === 'available' ? 'bg-emerald-500' : presence.status === 'observing' ? 'bg-amber-500' : 'bg-red-500'
                            }`} title={getStatusText(presence.status)} />
                          </span>
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-bold text-white text-xs truncate leading-snug group-hover:text-primary-400 transition-colors font-outfit">
                            {profile.full_name}
                          </h4>
                          <p className="text-[9px] text-zinc-500 leading-none">@{profile.username || "sin_username"}</p>
                        </div>
                      </div>

                      {/* Block & Report Dropdown / Actions */}
                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setReportTargetId(profile.id)}
                          className="w-6 h-6 rounded bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 hover:text-amber-500 transition-all cursor-pointer"
                          title="Reportar"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleBlock(profile.id)}
                          className="w-6 h-6 rounded bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 hover:text-red-500 transition-all cursor-pointer"
                          title="Bloquear"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Bio content */}
                    {profile.bio && (
                      <p className="text-[11px] text-zinc-400 leading-relaxed mt-3 pl-1 italic border-l border-zinc-800">
                        "{profile.bio}"
                      </p>
                    )}

                    {/* Social Credentials (Only shown after accepted connection) */}
                    {isConnected && profile.social_instagram && (
                      <div className="mt-3.5 pt-3.5 border-t border-white/5 flex items-center justify-between">
                        <a
                          href={`https://instagram.com/${profile.social_instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/5 text-[10px] text-zinc-300 font-semibold"
                        >
                          <InstagramIcon className="w-3.5 h-3.5 text-pink-500" />
                          <span>@{profile.social_instagram}</span>
                        </a>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="mt-4 pt-3.5 border-t border-white/5">
                      {isConnected ? (
                        <button
                          onClick={() => {
                            const foundChat = chats.find(c => c.user_a_id === profile.id || c.user_b_id === profile.id);
                            if (foundChat) setActiveChat(foundChat);
                          }}
                          className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chatear</span>
                        </button>
                      ) : isRequestPending ? (
                        <div className="w-full py-2 bg-white/3 text-zinc-500 border border-white/5 rounded-xl text-[11px] font-black uppercase tracking-wider text-center select-none">
                          Solicitud Pendiente
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(profile.id)}
                          disabled={presence.status === 'do_not_disturb'}
                          className={`w-full py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            presence.status === 'do_not_disturb'
                              ? 'bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed'
                              : 'bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-500/10 active:scale-95'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Conectar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* 3. Conexiones Activas */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-500 pl-1">
          Tus Conexiones Activas ({chats.length})
        </h3>

        {chats.length === 0 ? (
          <div className="glass-card p-6 bg-zinc-950/20 border-white/5 rounded-2xl text-center space-y-2 max-w-md">
            <MessageSquare className="w-7 h-7 text-zinc-700 mx-auto" />
            <p className="text-[11px] text-zinc-500 leading-normal">
              No tienes chats activos. Cuando envíes una solicitud y la acepten, la conversación aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {chats.map((chat) => {
              const profile = chat.otherUser;
              if (!profile) return null;

              const isActiveInVenue = activePresence.some(p => p.user_id === profile.id);

              return (
                <div
                  key={chat.id}
                  className="p-4 bg-zinc-900/40 border border-white/5 rounded-2xl flex items-center justify-between gap-3 hover:border-white/10 hover:bg-zinc-900/60 transition-all shadow-md"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full border border-white/10 bg-zinc-900 overflow-hidden p-0.5">
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <div className="w-full h-full bg-primary-500/10 flex items-center justify-center text-primary-400 font-extrabold text-xs rounded-full">
                            {profile.full_name?.charAt(0) || "U"}
                          </div>
                        )}
                      </div>
                      {isActiveInVenue && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-zinc-950 bg-emerald-500 animate-pulse" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-xs truncate leading-snug font-outfit">
                        {profile.full_name}
                      </h4>
                      <p className="text-[9px] text-zinc-500 leading-none">
                        {isActiveInVenue ? 'En el local ahora' : 'Desconectado'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveChat(chat)}
                    className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-sm active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chatear</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Actividad Reciente en la Comunidad (Respetando privacidad) */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-500 pl-1">
          Actividad de la Comunidad
        </h3>

        {displayCommunityActivities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayCommunityActivities.map((act) => (
              <div key={act.id} className="p-4 bg-zinc-950/40 border border-white/5 rounded-2xl flex gap-3 items-center hover:border-white/10 transition-colors animate-fade-in">
                <div className="w-8 h-8 rounded-xl bg-purple-600/10 border border-purple-500/10 flex items-center justify-center text-sm shrink-0">
                  {act.icon}
                </div>
                <div>
                  <p className="text-zinc-200 text-xs font-semibold">{act.text}</p>
                  <p className="text-zinc-500 text-[10px] mt-0.5">
                    {new Date(act.date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center bg-zinc-950/30 rounded-3xl border border-dashed border-white/5 text-xs text-zinc-500">
            Sin actividad reciente en la comunidad.
          </div>
        )}
      </div>

      {/* Realtime Chat Widget Overlay Modals */}
      <AnimatePresence>
        {activeChat && (
          <ChatWidget
            chatId={activeChat.id}
            otherUser={activeChat.otherUser as any}
            currentUser={currentUser}
            onClose={() => setActiveChat(null)}
          />
        )}
      </AnimatePresence>

      {/* Report Modal */}
      {reportTargetId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-md w-full p-6 bg-[#07070d] border border-white/10 rounded-3xl space-y-5 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="text-sm font-bold uppercase tracking-wider font-outfit">Reportar Usuario</h4>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Tu reporte ayuda a mantener Hangover seguro y divertido. Los administradores revisarán el historial de comportamiento de este usuario.
            </p>

            <div className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Motivo del reporte</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-300 focus:border-primary-500 outline-none"
                >
                  <option value="" disabled>Selecciona un motivo</option>
                  <option value="spam">Comportamiento molesto / Spam</option>
                  <option value="harassment">Acoso o amenazas</option>
                  <option value="identity">Perfil falso o usurpación de identidad</option>
                  <option value="other">Otro motivo</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Detalles adicionales (Opcional)</label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Describe qué ocurrió..."
                  rows={3}
                  className="w-full bg-white/3 border border-white/5 rounded-xl p-4 text-xs text-white placeholder-zinc-650 focus:border-primary-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button 
                onClick={() => {
                  setReportTargetId(null);
                  setReportReason("");
                  setReportDetails("");
                }}
                className="px-4.5 py-2.5 rounded-xl text-xs font-semibold bg-white/5 text-zinc-400 cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                disabled={!reportReason || isReporting}
                onClick={handleReport}
                className="px-4.5 py-2.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isReporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Enviar Reporte"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
