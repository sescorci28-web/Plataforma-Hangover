"use client";

import { useState } from "react";
import {
  Sparkles,
  MapPin,
  Clock,
  Building2,
  Star,
  Plus,
  Edit2,
  Trash2,
  X,
  Users,
  Compass,
  MessageSquare,
  Flame,
  Award,
  Send,
  Ticket,
  ChevronRight,
  TrendingUp,
  ThumbsUp,
  Smile,
  ShieldAlert,
  UserCheck,
  UserX,
  Bookmark,
  Share2,
  Music,
} from "lucide-react";
import { ConnectProfile } from "./ConnectProfile";
import { ConnectChat } from "./ConnectChat";

interface ConnectViewProps {
  profile: any;
  allProfiles: any[];
  clubsList: any[];
  eventsList: any[];
  validatedBookings: any[];
  userReputation: any;
  followersCount: number;
  followingCount: number;
  activePresenceList: any[];
}

interface PostComment {
  id: string;
  username: string;
  text: string;
  rep: string;
}

interface PostUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  isProfessional: boolean;
  profTitle?: string;
}

interface Post {
  id: string;
  user: PostUser;
  media_url: string;
  caption: string;
  venue: string;
  reactions: { brutal: number; me_apunto: number; vamos: number; me_gusta: number };
  userReaction: string | null;
  comments: PostComment[];
  showComments: boolean;
  newCommentText: string;
}

export function ConnectView({
  profile,
  allProfiles,
  clubsList,
  eventsList,
  validatedBookings,
  userReputation,
  followersCount,
  followingCount,
  activePresenceList,
}: ConnectViewProps) {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<"feed" | "reels" | "messages" | "explore" | "profile">("feed");
  const [selectedCity, setSelectedCity] = useState("Barranquilla");
  const [currentProfileView, setCurrentProfileView] = useState<"social" | "client" | "provider" | "club">("social");
  
  // Mood / social state
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [feedSubTab, setFeedSubTab] = useState<"posts" | "plans">("posts");

  // Active Story Player Modal state
  const [activeStoryUser, setActiveStoryUser] = useState<any | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  // Spontaneous Plans state
  const [plans, setPlans] = useState([
    {
      id: "plan-1",
      creator: { full_name: "Andrés Silva", avatar_url: null, social_level: "VIP Member" },
      title: "Rumba en Hangover Club esta noche",
      description: "¡Ey! Compré mesa VIP general, busco 3 personas más para parchar y armar crew. Género: Crossover/Reggaetón.",
      venue: "Hangover Club",
      membersCount: 2,
      joined: false,
    },
    {
      id: "plan-2",
      creator: { full_name: "Laura Gómez", avatar_url: null, social_level: "Popular" },
      title: "Pre-fiesta electrónica en Rooftop",
      description: "Tomemos algo en el rooftop antes de bajar a la discoteca principal. Entrada libre.",
      venue: "Sunset Lounge",
      membersCount: 1,
      joined: false,
    }
  ]);

  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [newPlanDesc, setNewPlanDesc] = useState("");
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);

  // Posts/Reels Feed State
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "post-1",
      user: { id: "user-2", full_name: "Carlos DJ", avatar_url: null, isProfessional: true, profTitle: "Guest DJ" },
      media_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600",
      caption: "¡Qué noche la de ayer en el opening set! Gracias a todos los que bailaron. #nightlife #techno",
      venue: "Hangover Club",
      reactions: { brutal: 42, me_apunto: 12, vamos: 34, me_gusta: 56 },
      userReaction: null as string | null,
      comments: [
        { id: "c-1", username: "andres_s", text: "¡Set brutal, hermano!", rep: "VIP Member" },
        { id: "c-2", username: "laura_g", text: "¿Cuándo repites?", rep: "Popular" }
      ],
      showComments: false,
      newCommentText: ""
    },
    {
      id: "post-2",
      user: { id: "user-3", full_name: "Mariana Rojas", avatar_url: null, isProfessional: false },
      media_url: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=600",
      caption: "Celebrando mi cumple en la mesa VIP del mejor club de la ciudad. ¡Brutal el servicio!",
      venue: "Dulcinea Medellín",
      reactions: { brutal: 89, me_apunto: 4, vamos: 57, me_gusta: 104 },
      userReaction: null as string | null,
      comments: [],
      showComments: false,
      newCommentText: ""
    }
  ]);

  // Chat State
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);

  // Moderation state
  const [moderatingPostId, setModeratingPostId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Crews State
  const [crews, setCrews] = useState([
    { id: "crew-1", name: "Los VIPs del Techno", members: 8, attendingToday: 3 },
    { id: "crew-2", name: "Crew Cartagena 2026", members: 5, attendingToday: 1 }
  ]);
  const [isCreateCrewOpen, setIsCreateCrewOpen] = useState(false);
  const [newCrewName, setNewCrewName] = useState("");

  // AI Agent Input
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Handlers
  const handleReact = (postId: string, reactionType: "brutal" | "me_apunto" | "vamos" | "me_gusta") => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const reactionsCopy = { ...post.reactions };
        let userReact = post.userReaction;
        
        if (userReact === reactionType) {
          // Remove reaction
          reactionsCopy[reactionType]--;
          userReact = null;
        } else {
          // Switch or add reaction
          if (userReact) {
            reactionsCopy[userReact as "brutal" | "me_apunto" | "vamos" | "me_gusta"]--;
          }
          reactionsCopy[reactionType]++;
          userReact = reactionType;
        }

        return { ...post, reactions: reactionsCopy, userReaction: userReact };
      }
      return post;
    }));
  };

  const handleAddComment = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId && post.newCommentText.trim()) {
        const comments = [
          ...post.comments,
          {
            id: `c-${Date.now()}`,
            username: profile.username || "tú",
            text: post.newCommentText.trim(),
            rep: "Rookie"
          }
        ];
        return { ...post, comments, newCommentText: "" };
      }
      return post;
    }));
  };

  const handleJoinPlan = (planId: string) => {
    setPlans(prev => prev.map(p => {
      if (p.id === planId) {
        const joined = !p.joined;
        return { ...p, joined, membersCount: joined ? p.membersCount + 1 : p.membersCount - 1 };
      }
      return p;
    }));
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanTitle.trim()) return;

    const nPlan = {
      id: `plan-${Date.now()}`,
      creator: { full_name: profile.full_name, avatar_url: profile.avatar_url, social_level: "Rookie" },
      title: newPlanTitle,
      description: newPlanDesc,
      venue: "Local General",
      membersCount: 1,
      joined: true
    };

    setPlans(prev => [nPlan, ...prev]);
    setNewPlanTitle("");
    setNewPlanDesc("");
    setIsCreatePlanOpen(false);
    showToast("¡Plan social espontáneo publicado!");
  };

  const handleCreateCrew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCrewName.trim()) return;

    const nCrew = {
      id: `crew-${Date.now()}`,
      name: newCrewName.trim(),
      members: 1,
      attendingToday: 0
    };

    setCrews(prev => [...prev, nCrew]);
    setNewCrewName("");
    setIsCreateCrewOpen(false);
    showToast(`¡Crew "${nCrew.name}" creada con éxito!`);
  };

  const handleReportPost = (postId: string, reason: string) => {
    showToast(`Publicación reportada por "${reason}". La moderación la revisará.`);
    setModeratingPostId(null);
  };

  const handleAskAi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsAiLoading(true);
    setTimeout(() => {
      setAiResponse(`Basado en tu presupuesto y gustos, te sugiero asistir hoy a "Fiesta del año" en Dulcinea Medellín. 3 miembros de tu Crew asistirán. También podrías conectar con @carlos_dj, quien subirá fotos de su set en vivo.`);
      setIsAiLoading(false);
    }, 1500);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Mock Stories
  const stories = [
    { user: { full_name: "Laura Gómez", avatar_url: null }, media: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=200" },
    { user: { full_name: "Andrés Silva", avatar_url: null }, media: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=200" },
    { user: { full_name: "Carlos DJ", avatar_url: null }, media: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=200" },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-[#020205] text-zinc-100 font-sans relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[100] bg-zinc-950 border border-emerald-500/30 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slideIn">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider font-outfit">{toastMessage}</span>
        </div>
      )}

      {/* 1. LEFT SIDEBAR NAVIGATION WITH PROFILE SWITCHER */}
      <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-white/5 bg-[#050509]/60 shrink-0 flex flex-col justify-between p-4 lg:p-5">
        <div className="flex flex-col md:flex-row lg:flex-col gap-4 lg:gap-6 justify-between lg:justify-start items-stretch md:items-center lg:items-stretch w-full">
          
          {/* MULTI-PROFILE SWITCHER DROPDOWN */}
          <div className="space-y-1.5 flex-grow md:max-w-xs lg:w-full">
            <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500 ml-1 block lg:inline">Cambiar Consola Perfil</label>
            <div className="relative">
              <select
                value={currentProfileView}
                onChange={(e) => setCurrentProfileView(e.target.value as any)}
                className="w-full bg-[#09090f] border border-white/10 text-white py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wide focus:outline-none cursor-pointer appearance-none select-none"
              >
                <option value="social">Perfil Social (Connect)</option>
                <option value="client">Perfil Cliente (Comprar)</option>
                <option value="provider">Perfil Proveedor (Gigs)</option>
                <option value="club">Perfil Discoteca (Ops)</option>
              </select>
              <span className="absolute right-3.5 top-3 text-[9px] pointer-events-none">▼</span>
            </div>
          </div>

          <div className="hidden lg:block h-px bg-white/5" />

          {/* Social Navigation Tabs */}
          <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 gap-1.5 scrollbar-none w-full">
            {[
              { id: "feed", label: "Feed", icon: Flame },
              { id: "reels", label: "Reels", icon: Compass },
              { id: "messages", label: "Chats", icon: MessageSquare },
              { id: "explore", label: "Mapa", icon: MapPin },
              { id: "profile", label: "Perfil", icon: Award },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === "messages") {
                      setActiveTab("messages");
                      setSelectedChatUserId(allProfiles[0]?.id || null);
                    } else {
                      setActiveTab(tab.id as any);
                    }
                  }}
                  className={`whitespace-nowrap px-3.5 py-2.5 rounded-xl text-[10px] lg:text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-colors border cursor-pointer ${
                    isActive
                      ? "bg-primary-600/10 text-primary-400 border-primary-500/20"
                      : "text-zinc-400 border-transparent hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card footer */}
        <div className="hidden lg:flex items-center gap-3 p-3 bg-zinc-950/40 border border-white/5 rounded-2xl">
          <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-sm font-black font-outfit text-white">
            {profile.full_name[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <h5 className="text-[10px] font-black uppercase text-white font-outfit truncate">{profile.full_name}</h5>
            <span className="text-[8px] text-zinc-500 block">Social Level: Rookie</span>
          </div>
        </div>
      </aside>

      {/* 2. DYNAMIC MAIN CENTRAL AREA */}
      <main className="flex-grow flex flex-col min-h-0 overflow-y-auto bg-black/10">
        
        {/* TOP CITY SELECTOR & MOOD SELECTOR BAR */}
        <header className="p-4 border-b border-white/5 bg-[#050509]/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary-400 shrink-0" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-transparent text-sm font-black uppercase text-white font-outfit focus:outline-none cursor-pointer"
            >
              <option value="Barranquilla">Barranquilla</option>
              <option value="Medellín">Medellín</option>
              <option value="Bogotá">Bogotá</option>
            </select>
          </div>

          {/* Active Mood selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[9px] text-zinc-500 font-bold uppercase mr-1">Mood Hoy:</span>
            {[
              { id: "salir", label: "Quiero salir" },
              { id: "parche", label: "Busco parche" },
              { id: "tomar", label: "Quiero tomar algo" },
              { id: "evento", label: "Busco evento" }
            ].map((mood) => {
              const isActive = currentMood === mood.id;
              return (
                <button
                  key={mood.id}
                  onClick={() => setCurrentMood(isActive ? null : mood.id)}
                  className={`px-2.5 py-1 rounded-full border text-[9px] font-extrabold uppercase transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary-600/10 border-primary-500 text-primary-400"
                      : "bg-[#09090f] border-white/5 text-zinc-400 hover:text-white"
                  }`}
                >
                  {mood.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* CONDITIONAL SUBVIEW RENDERING */}
        {activeTab === "feed" && (
          <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Mobile Sub-tab Selector */}
            <div className="xl:hidden flex bg-[#09090f]/80 p-1 rounded-xl border border-white/5 mb-2 w-full col-span-1">
              <button
                type="button"
                onClick={() => setFeedSubTab("posts")}
                className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  feedSubTab === "posts"
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-500/10 border border-primary-500/20"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Flame className="w-3.5 h-3.5" /> Publicaciones
              </button>
              <button
                type="button"
                onClick={() => setFeedSubTab("plans")}
                className={`flex-grow py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  feedSubTab === "plans"
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-500/10 border border-primary-500/20"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Planes y Crews
              </button>
            </div>

            {/* Main Center feed column */}
            <div className={`xl:col-span-2 space-y-6 ${feedSubTab === "posts" ? "block" : "hidden xl:block"}`}>
              
              {/* Active Stories Carousel */}
              <div className="glass-card p-4 bg-zinc-950/30 border-white/5 rounded-3xl space-y-3">
                <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Historias de 24h</span>
                <div className="flex gap-4 overflow-x-auto scrollbar-none py-1">
                  {/* Create Story circle */}
                  <div className="flex flex-col items-center gap-1.5 cursor-pointer">
                    <div className="w-12 h-12 rounded-full border border-dashed border-white/20 bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all shrink-0">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] text-zinc-500 font-bold">Subir</span>
                  </div>

                  {/* Story users */}
                  {stories.map((st, idx) => (
                    <div
                      key={idx}
                      onClick={() => { setActiveStoryUser(st); setActiveStoryIndex(idx); }}
                      className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <div className="w-12 h-12 rounded-full border-2 border-primary-500 p-0.5 bg-black hover:scale-105 transition-transform shrink-0">
                        <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white font-bold">
                          {st.user.full_name[0].toUpperCase()}
                        </div>
                      </div>
                      <span className="text-[9px] text-zinc-400 font-bold">{st.user.full_name.split(" ")[0]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feed Posts List */}
              <div className="space-y-6">
                {posts.map((post) => (
                  <article key={post.id} className="glass-card overflow-hidden bg-zinc-950/30 border-white/5 rounded-3xl">
                    {/* Header */}
                    <div className="p-4 flex items-center justify-between border-b border-white/5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white border border-white/10 shrink-0">
                          {post.user.full_name[0].toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white leading-tight font-outfit">{post.user.full_name}</h4>
                          <span className="text-[9px] text-zinc-500">{post.venue}</span>
                        </div>
                      </div>

                      {/* Prof details / moderation button */}
                      <div className="flex items-center gap-2">
                        {post.user.isProfessional && (
                          <span className="text-[8px] bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                            {post.user.profTitle}
                          </span>
                        )}
                        <button
                          onClick={() => setModeratingPostId(post.id)}
                          className="text-zinc-600 hover:text-white transition-colors cursor-pointer"
                        >
                          •••
                        </button>
                      </div>
                    </div>

                    {/* Media */}
                    <div className="aspect-[4/3] w-full bg-black relative">
                      <img src={post.media_url} alt="Feed media" className="w-full h-full object-cover" />
                    </div>

                    {/* Footer / Interaction panel */}
                    <div className="p-4 space-y-3">
                      {/* Nightlife Reactions Bar */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div className="flex gap-2">
                          {[
                            { type: "brutal", label: "Brutal", icon: Flame, color: "text-orange-400 hover:bg-orange-500/10" },
                            { type: "me_apunto", label: "Me apunto", icon: UserCheck, color: "text-cyan-400 hover:bg-cyan-500/10" },
                            { type: "vamos", label: "Vamos", icon: Ticket, color: "text-purple-400 hover:bg-purple-500/10" },
                            { type: "me_gusta", label: "Me gusta", icon: ThumbsUp, color: "text-rose-400 hover:bg-rose-500/10" }
                          ].map((react) => {
                            const Icon = react.icon;
                            const isUserReact = post.userReaction === react.type;
                            return (
                              <button
                                key={react.type}
                                onClick={() => handleReact(post.id, react.type as any)}
                                className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                                  isUserReact
                                    ? "bg-primary-600/15 border-primary-500 text-primary-400"
                                    : "bg-black/35 border-white/5 text-zinc-400 " + react.color
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5 shrink-0" />
                                <span>{react.label}</span>
                                <span className="font-bold text-zinc-500">{(post.reactions as any)[react.type]}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Professional Hire CTA */}
                        {post.user.isProfessional && (
                          <button
                            onClick={() => showToast(`Iniciando cotización con profesional ${post.user.full_name}`)}
                            className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" /> Contratar
                          </button>
                        )}
                      </div>

                      {/* Caption */}
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        <strong className="text-white mr-1.5">@{post.user.full_name.replace(" ", "").toLowerCase()}</strong>
                        {post.caption}
                      </p>

                      {/* Comments Drawer toggler */}
                      <div className="space-y-2">
                        <button
                          onClick={() => setPosts(prev => prev.map(p => p.id === post.id ? { ...p, showComments: !p.showComments } : p))}
                          className="text-[10px] text-zinc-500 hover:text-white font-bold uppercase transition-colors"
                        >
                          {post.showComments ? "Ocultar Comentarios" : `Ver los ${post.comments.length} comentarios`}
                        </button>

                        {post.showComments && (
                          <div className="space-y-3 bg-black/40 border border-white/5 p-3.5 rounded-2xl animate-fadeIn">
                            
                            {/* Scrollable list of comments */}
                            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin pr-1">
                              {post.comments.map((comment) => (
                                <div key={comment.id} className="text-xs flex flex-wrap items-baseline justify-between gap-2 border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                                  <div>
                                    <strong className="text-white">@{comment.username}</strong>
                                    <span className="text-zinc-400 ml-1.5">{comment.text}</span>
                                  </div>
                                  <span className="text-[8px] bg-primary-600/10 border border-primary-500/20 text-primary-400 px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0">
                                    {comment.rep}
                                  </span>
                                </div>
                              ))}
                              {post.comments.length === 0 && (
                                <p className="text-[10px] text-zinc-550 italic py-1">Sin comentarios aún. ¡Sé el primero!</p>
                              )}
                            </div>

                            {/* Add comment form */}
                            <div className="flex gap-2 pt-2.5 border-t border-white/5">
                              <input
                                type="text"
                                value={post.newCommentText}
                                onChange={(e) => setPosts(prev => prev.map(p => p.id === post.id ? { ...p, newCommentText: e.target.value } : p))}
                                placeholder="Escribe un comentario..."
                                className="flex-grow bg-black border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none"
                              />
                              <button
                                onClick={() => handleAddComment(post.id)}
                                className="bg-primary-600 hover:bg-primary-500 text-white rounded-lg px-3 text-xs font-bold transition-colors cursor-pointer"
                              >
                                Enviar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>

            </div>

            {/* Right Feed widgets column */}
            <div className={`space-y-6 ${feedSubTab === "plans" ? "block" : "hidden xl:block"}`}>
              
              {/* Spontaneous plans widget */}
              <div className="glass-card p-5 bg-zinc-950/30 border-white/5 rounded-3xl space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <h4 className="font-bold text-white text-sm font-outfit">Planes Espontáneos</h4>
                  <button
                    onClick={() => setIsCreatePlanOpen(true)}
                    className="w-7 h-7 rounded-lg bg-primary-600/10 border border-primary-500/20 text-primary-400 flex items-center justify-center hover:bg-primary-600/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {plans.map((pl) => (
                    <div key={pl.id} className="bg-black/35 border border-white/5 p-4 rounded-2xl space-y-3 relative overflow-hidden">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {pl.creator.full_name[0]}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-[11px] font-black uppercase text-white truncate leading-tight font-outfit">{pl.creator.full_name}</h5>
                          <span className="text-[8px] text-zinc-500 font-bold block">{pl.creator.social_level}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h6 className="text-xs font-bold text-white leading-tight font-outfit">{pl.title}</h6>
                        <p className="text-[10px] text-zinc-400 leading-snug">{pl.description}</p>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-white/5">
                        <span className="text-[9px] text-primary-400 font-bold uppercase flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-primary-400" /> {pl.venue}
                        </span>
                        <button
                          onClick={() => handleJoinPlan(pl.id)}
                          className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer border ${
                            pl.joined
                              ? "bg-zinc-800 border-white/10 text-white"
                              : "bg-primary-600/10 border-primary-500/20 text-primary-400"
                          }`}
                        >
                          {pl.joined ? "✓ Unido" : "Unirme"} ({pl.membersCount})
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-5 bg-zinc-950/30 border-white/5 rounded-3xl space-y-3">
                <h4 className="font-bold text-white text-sm font-outfit pb-2 border-b border-white/5">Tendencias Locales</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-zinc-300 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-orange-400" /> 1. Hangover Club
                    </span>
                    <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Muy Activo</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-zinc-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" /> 2. Fiesta del año
                    </span>
                    <span className="text-[9px] text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded">124 Comentarios</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-zinc-300 flex items-center gap-1">
                      <Music className="w-3.5 h-3.5 text-cyan-400" /> 3. DJ Carlos Set
                    </span>
                    <span className="text-[9px] text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded">Top Tendencia</span>
                  </div>
                </div>
              </div>

              {/* AI Agent Recommendation Panel */}
              <div className="glass-card p-5 bg-zinc-950/30 border-white/5 rounded-3xl space-y-4">
                <h4 className="font-bold text-white text-sm font-outfit pb-2 border-b border-white/5 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-purple-400" /> Recomendar con IA
                </h4>
                <form onSubmit={handleAskAi} className="space-y-2.5">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ej. Busco rumba electrónica barata hoy"
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <button type="submit" className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-2 text-xs font-bold transition-all cursor-pointer">
                    {isAiLoading ? "Consultando..." : "Preguntar Asistente"}
                  </button>
                </form>
                {aiResponse && (
                  <p className="text-[10px] text-zinc-400 leading-relaxed bg-black/40 border border-white/5 p-3 rounded-xl">
                    {aiResponse}
                  </p>
                )}
              </div>

              {/* Crews widget */}
              <div className="glass-card p-5 bg-zinc-950/30 border-white/5 rounded-3xl space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <h4 className="font-bold text-white text-sm font-outfit">Mis Crews (Parches)</h4>
                  <button
                    onClick={() => setIsCreateCrewOpen(true)}
                    className="w-7 h-7 rounded-lg bg-primary-600/10 border border-primary-500/20 text-primary-400 flex items-center justify-center hover:bg-primary-600/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {crews.map((cr) => (
                    <div key={cr.id} className="flex justify-between items-center text-xs bg-black/20 p-2.5 rounded-xl border border-white/5">
                      <div>
                        <span className="font-bold text-white font-outfit block">{cr.name}</span>
                        <span className="text-[9px] text-zinc-500">{cr.members} miembros</span>
                      </div>
                      {cr.attendingToday > 0 && (
                        <span className="text-[9px] text-primary-400 font-bold bg-primary-500/10 border border-primary-500/20 px-2 py-0.5 rounded">
                          {cr.attendingToday} irán hoy
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {activeTab === "reels" && (
          <div className="max-w-md mx-auto py-8 space-y-8 h-full overflow-y-auto scrollbar-none snap-y snap-mandatory">
            {posts.map((post) => (
              <div key={post.id} className="snap-start aspect-[9/16] w-full bg-[#09090f] rounded-[28px] border border-white/10 overflow-hidden relative shadow-2xl flex flex-col justify-end p-5">
                <img src={post.media_url} alt="Reel media" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

                {/* Actions overlay side bar */}
                <div className="absolute right-4 bottom-24 flex flex-col gap-4 text-center z-10">
                  <button onClick={() => handleReact(post.id, "brutal")} className="w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-orange-400 hover:scale-110 transition-transform cursor-pointer" title="Brutal">
                    <Flame className="w-5 h-5 text-orange-450" />
                  </button>
                  <span className="text-[9px] font-bold text-white">{post.reactions.brutal}</span>
                  
                  <button onClick={() => handleReact(post.id, "vamos")} className="w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-purple-400 hover:scale-110 transition-transform cursor-pointer" title="Vamos">
                    <Ticket className="w-5 h-5 text-purple-450" />
                  </button>
                  <span className="text-[9px] font-bold text-white">{post.reactions.vamos}</span>
                  
                  <button onClick={() => showToast("Enlace del Reel copiado")} className="w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Text descriptions */}
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white border border-white/10">
                      {post.user.full_name[0]}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight font-outfit">{post.user.full_name}</h4>
                      <p className="text-[9px] text-zinc-400 mt-0.5">📍 {post.venue}</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-300 leading-snug">{post.caption}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "messages" && (
          <div className="flex-grow h-full">
            <ConnectChat
              currentUser={profile}
              selectedChatUserId={selectedChatUserId}
              allProfiles={allProfiles}
              clubsList={clubsList}
              eventsList={eventsList}
              onBack={() => setSelectedChatUserId(null)}
              onSelectUser={(uid) => setSelectedChatUserId(uid)}
            />
          </div>
        )}

        {activeTab === "explore" && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white font-outfit uppercase tracking-wider">Mapa Social de Actividad (2D)</h3>
              <p className="text-xs text-zinc-500">Visualiza en tiempo real qué discotecas y eventos tienen más rumba en {selectedCity}</p>
            </div>

            {/* Social Map rendering container */}
            <div className="w-full aspect-[2/1] min-h-[300px] bg-zinc-950 border border-white/10 rounded-3xl relative overflow-hidden flex items-center justify-center">
              
              {/* Glowing activity pins */}
              <div className="absolute top-1/4 left-1/3 text-center">
                <div className="w-4 h-4 rounded-full bg-purple-500 animate-ping absolute top-0 left-0" />
                <div className="w-4 h-4 rounded-full bg-purple-600 border border-purple-400 relative z-10 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.8)]" title="Hangover Club" />
                <span className="text-[9px] bg-black/80 px-2 py-0.5 rounded-lg border border-white/10 font-bold block mt-1.5 text-white whitespace-nowrap">
                  Hangover Club (45 checked-in)
                </span>
              </div>

              <div className="absolute bottom-1/3 right-1/4 text-center">
                <div className="w-4 h-4 rounded-full bg-pink-500 animate-ping absolute top-0 left-0" />
                <div className="w-4 h-4 rounded-full bg-pink-600 border border-pink-400 relative z-10 cursor-pointer shadow-[0_0_15px_rgba(236,72,153,0.8)]" title="Event Hall" />
                <span className="text-[9px] bg-black/80 px-2 py-0.5 rounded-lg border border-white/10 font-bold block mt-1.5 text-white whitespace-nowrap">
                  Medellín Fest (124 checked-in)
                </span>
              </div>

              {/* Map grid simulation background */}
              <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 opacity-5 pointer-events-none">
                {Array.from({ length: 72 }).map((_, i) => (
                  <div key={i} className="border border-white/40" />
                ))}
              </div>

              <span className="text-xs text-zinc-650 font-bold uppercase tracking-wider relative z-10 pointer-events-none select-none">
                Mapa en tiempo real - {selectedCity}
              </span>
            </div>

            {/* Who is here now presence table */}
            <div className="glass-card p-6 bg-zinc-950/30 border-white/5 rounded-3xl space-y-4">
              <div>
                <h4 className="font-bold text-white text-sm font-outfit">Quién está aquí ahora</h4>
                <p className="text-xs text-zinc-500">Usuarios con check-in activo en tu ubicación actual</p>
              </div>

              <div className="space-y-2.5">
                {allProfiles.slice(0, 4).map((usr) => (
                  <div key={usr.id} className="flex justify-between items-center bg-black/25 p-3 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white">
                        {usr.full_name[0]}
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">{usr.full_name}</span>
                        <span className="text-[9px] text-zinc-500 block">En Hangover Club</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { setActiveTab("messages"); setSelectedChatUserId(usr.id); }}
                      className="bg-primary-600/10 hover:bg-primary-600/20 text-primary-400 border border-primary-500/20 rounded-xl px-3 py-1.5 text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Enviar Mensaje
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="p-6">
            <ConnectProfile
              userProfile={profile}
              currentUser={profile}
              validatedBookings={validatedBookings}
              allClubs={clubsList}
              allEvents={eventsList}
              onOpenChat={(uid) => { setActiveTab("messages"); setSelectedChatUserId(uid); }}
            />
          </div>
        )}

      </main>

      {/* 3. STORY PLAYER FULLSCREEN VIEW MODAL */}
      {activeStoryUser && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center md:p-4">
          <div className="w-full h-full md:h-auto md:max-w-md md:aspect-[9/16] bg-[#09090f] md:rounded-[28px] border-0 md:border md:border-white/10 overflow-hidden relative shadow-2xl flex flex-col justify-between p-5">
            {/* Story timeline progress bar */}
            <div className="w-full flex gap-1.5 absolute top-4 left-0 px-5 z-20">
              {stories.map((_, idx) => (
                <div key={idx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className={`h-full bg-primary-500 rounded-full transition-all duration-3000 ${
                    idx < activeStoryIndex ? "w-full" : idx === activeStoryIndex ? "w-full" : "w-0"
                  }`} />
                </div>
              ))}
            </div>

            {/* Media background */}
            <img src={activeStoryUser.media} alt="Story content" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />

            {/* Header info */}
            <div className="relative z-10 flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white border border-white/20">
                  {activeStoryUser.user.full_name[0]}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight font-outfit">{activeStoryUser.user.full_name}</h4>
                  <span className="text-[8px] text-zinc-400 block">Hace 4 horas</span>
                </div>
              </div>
              <button onClick={() => setActiveStoryUser(null)} className="text-white hover:text-zinc-300 font-bold p-1 text-sm cursor-pointer shrink-0">
                ✕
              </button>
            </div>

            {/* Footer comments reply */}
            <div className="relative z-10 flex gap-2">
              <input
                type="text"
                placeholder={`Responder a ${activeStoryUser.user.full_name.split(" ")[0]}...`}
                className="flex-grow bg-black/70 border border-white/20 rounded-xl py-2 px-3 text-xs text-white focus:outline-none placeholder:text-zinc-500"
              />
              <button
                onClick={() => { setActiveStoryUser(null); showToast("Respuesta de Historia enviada"); }}
                className="bg-primary-600 hover:bg-primary-500 text-white rounded-xl px-4 text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CREATE PLAN MODAL */}
      {isCreatePlanOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="glass-card max-w-md w-full p-6 border-white/10 bg-[#09090f] rounded-[28px] space-y-5 shadow-2xl relative">
            <button onClick={() => setIsCreatePlanOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors cursor-pointer">
              ✕
            </button>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white font-outfit">Lanzar Plan Espontáneo</h3>
              <p className="text-xs text-zinc-500">¿Qué planeas hacer esta noche? Invita a otros rumberos a unirse.</p>
            </div>
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Título de tu Plan</label>
                <input
                  type="text"
                  required
                  value={newPlanTitle}
                  onChange={e => setNewPlanTitle(e.target.value)}
                  placeholder="Ej. Pre-copas en mi casa y luego Hangover Club"
                  className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Detalles del Parche</label>
                <textarea
                  required
                  value={newPlanDesc}
                  onChange={e => setNewPlanDesc(e.target.value)}
                  placeholder="Describe la hora, el género de música, si tienes auto o si buscas gente para compartir mesa..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none h-20 resize-none"
                />
              </div>
              <button type="submit" className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer">
                Publicar Plan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. CREATE CREW MODAL */}
      {isCreateCrewOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="glass-card max-w-sm w-full p-6 border-white/10 bg-[#09090f] rounded-[28px] space-y-5 shadow-2xl relative">
            <button onClick={() => setIsCreateCrewOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors cursor-pointer">
              ✕
            </button>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white font-outfit">Crear Nueva Crew</h3>
              <p className="text-xs text-zinc-500">Un grupo cerrado de amigos para planificar eventos juntos.</p>
            </div>
            <form onSubmit={handleCreateCrew} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Nombre de la Crew</label>
                <input
                  type="text"
                  required
                  value={newCrewName}
                  onChange={e => setNewCrewName(e.target.value)}
                  placeholder="Ej. Los Reyes del Dance"
                  className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                />
              </div>
              <button type="submit" className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer">
                Crear Crew
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODERATION DIALOG OVERLAY */}
      {moderatingPostId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="glass-card max-w-xs w-full p-6 border-red-500/20 bg-zinc-950 rounded-2xl space-y-4 text-center">
            <h3 className="text-sm font-bold text-white font-outfit uppercase tracking-wider">Moderar Publicación</h3>
            <p className="text-xs text-zinc-400">Reporta esta publicación si infringe las normas de la comunidad nightlife.</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => handleReportPost(moderatingPostId, "Contenido comercial inapropiado")} className="w-full bg-zinc-900 hover:bg-zinc-800 border border-white/5 py-2 rounded-xl text-xs text-red-400 font-bold transition-all cursor-pointer">
                Contenido no Relacionado a Nightlife
              </button>
              <button onClick={() => handleReportPost(moderatingPostId, "Comportamiento inapropiado")} className="w-full bg-zinc-900 hover:bg-zinc-800 border border-white/5 py-2 rounded-xl text-xs text-red-400 font-bold transition-all cursor-pointer">
                Comportamiento Inadecuado
              </button>
              <button onClick={() => setModeratingPostId(null)} className="w-full bg-zinc-800 hover:bg-zinc-700 py-2 rounded-xl text-xs text-white font-bold transition-all cursor-pointer">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
