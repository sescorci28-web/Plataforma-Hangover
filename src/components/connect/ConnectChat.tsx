"use client";

import { useState, useEffect, useRef } from "react";
import {
  Send,
  Ticket,
  Building2,
  Sparkles,
  User,
  Share2,
  Clock,
  ArrowLeft,
  Calendar,
  MessageSquare,
} from "lucide-react";

interface ChatProps {
  currentUser: any;
  selectedChatUserId: string | null;
  allProfiles: any[];
  clubsList: any[];
  eventsList: any[];
  onBack?: () => void;
  onSelectUser?: (userId: string) => void;
}

interface Message {
  id: string;
  sender_id: string;
  text: string;
  created_at: string;
  attachment?: {
    type: "club" | "event" | "service" | "profile" | "agenda";
    id: string;
    title: string;
    subtitle?: string;
    image?: string | null;
  };
}

export function ConnectChat({
  currentUser,
  selectedChatUserId,
  allProfiles,
  clubsList,
  eventsList,
  onBack,
  onSelectUser,
}: ChatProps) {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Find target chat partner
  const chatPartner = allProfiles.find((p) => p.id === selectedChatUserId) || {
    id: "system",
    full_name: "Chat Social",
    username: "hangover",
    avatar_url: null,
  };

  // 1. Initial simulated database for chat logs
  useEffect(() => {
    if (!selectedChatUserId) return;

    const initialLogs: Message[] = [
      {
        id: "msg-1",
        sender_id: selectedChatUserId,
        text: "¡Ey! ¿Qué tal? ¿Vas a ir hoy a la fiesta de rumba electrónica?",
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "msg-2",
        sender_id: currentUser.id,
        text: "¡Hola! Sí, ya tengo mi cover listo. ¿Tú con quién vas?",
        created_at: new Date(Date.now() - 3000000).toISOString(),
      },
      {
        id: "msg-3",
        sender_id: selectedChatUserId,
        text: "Voy con mi Crew. Te comparto la tarjeta del evento por si quieres ver el line-up oficial:",
        created_at: new Date(Date.now() - 2500000).toISOString(),
        attachment: {
          type: "event",
          id: eventsList[0]?.id || "evt-1",
          title: eventsList[0]?.title || "Fiesta del año",
          subtitle: eventsList[0]?.location || "Dulcinea Medellín",
          image: eventsList[0]?.thumbnail_url,
        },
      },
    ];

    setMessages(initialLogs);
  }, [selectedChatUserId, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender_id: currentUser.id,
      text: inputText.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    // Simulate auto reply
    setTimeout(() => {
      const replies = [
        "¡Excelente! Allá nos vemos.",
        "Te aviso cuando mi Crew llegue al local.",
        "¿Compartimos mesa VIP hoy?",
        "¡Qué brutal!",
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      
      const replyMsg: Message = {
        id: `msg-reply-${Date.now()}`,
        sender_id: selectedChatUserId || "system",
        text: randomReply,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, replyMsg]);
    }, 2000);
  };

  const shareItem = (type: "club" | "event", item: any) => {
    const attach: Message["attachment"] = {
      type,
      id: item.id,
      title: item.name || item.title || "Item",
      subtitle: item.city || item.event_date || "",
      image: item.logo || item.thumbnail_url || null,
    };

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender_id: currentUser.id,
      text: `Te compartí este ${type === 'club' ? 'local' : 'evento'}:`,
      created_at: new Date().toISOString(),
      attachment: attach,
    };

    setMessages((prev) => [...prev, newMsg]);
  };

  const filteredProfiles = allProfiles.filter((p) => 
    p.id !== currentUser.id && 
    (p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.username?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="h-full flex bg-[#050509]/45 relative">
      
      {/* 1. LEFT SIDE: CONTACT LIST */}
      <div className={`w-full md:w-80 border-r border-white/5 bg-[#050509]/90 flex flex-col shrink-0 ${
        selectedChatUserId ? "hidden md:flex" : "flex"
      }`}>
        <div className="p-4 border-b border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-xs uppercase tracking-wider text-white font-outfit">Mensajería Directa</h4>
            <span className="text-[9px] bg-primary-600/10 border border-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full font-bold uppercase">
              {filteredProfiles.length} Activos
            </span>
          </div>
          <input
            type="text"
            placeholder="Buscar contactos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-zinc-650"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-none">
          {filteredProfiles.map((usr) => {
            const isSelected = usr.id === selectedChatUserId;
            return (
              <button
                key={usr.id}
                type="button"
                onClick={() => onSelectUser && onSelectUser(usr.id)}
                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors cursor-pointer border ${
                  isSelected
                    ? "bg-primary-600/15 border-primary-500/25 text-white"
                    : "bg-transparent border-transparent hover:bg-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                {usr.avatar_url ? (
                  <img src={usr.avatar_url} alt={usr.full_name} className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0 border border-white/5">
                    {usr.full_name[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-baseline gap-2">
                    <h5 className="text-xs font-bold truncate leading-tight font-outfit text-white">{usr.full_name}</h5>
                    <span className="text-[8px] text-zinc-500 font-bold uppercase shrink-0">@{usr.username || "username"}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 truncate mt-1">Conectar y armar crew rumbera...</p>
                </div>
              </button>
            );
          })}
          {filteredProfiles.length === 0 && (
            <p className="text-[11px] text-zinc-600 italic text-center pt-8 font-medium">No se encontraron contactos</p>
          )}
        </div>
      </div>

      {/* 2. RIGHT SIDE: ACTIVE THREAD */}
      <div className={`flex-grow flex flex-col bg-[#050509]/20 relative ${
        selectedChatUserId ? "flex" : "hidden md:flex"
      }`}>
        {selectedChatUserId ? (
          <div className="h-full flex flex-col relative">
            {/* CHAT HEADER */}
            <div className="p-4 border-b border-white/5 bg-[#09090f]/75 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  onClick={onBack} 
                  className="md:hidden text-zinc-400 hover:text-white shrink-0 p-1 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                {chatPartner.avatar_url ? (
                  <img src={chatPartner.avatar_url} alt={chatPartner.full_name} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary-650 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {chatPartner.full_name[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="text-xs font-black uppercase text-white font-outfit truncate">{chatPartner.full_name}</h4>
                  <span className="text-[9px] text-emerald-400 font-semibold block">Activo en sala Connect</span>
                </div>
              </div>

              {/* Quick share actions inside chat */}
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => clubsList[0] && shareItem("club", clubsList[0])}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase text-zinc-300 rounded border border-white/5 transition-all cursor-pointer"
                  title="Compartir Discoteca"
                >
                  🍾 Compartir Local
                </button>
                <button
                  type="button"
                  onClick={() => eventsList[0] && shareItem("event", eventsList[0])}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase text-zinc-300 rounded border border-white/5 transition-all cursor-pointer"
                  title="Compartir Evento"
                >
                  🎫 Compartir Evento
                </button>
              </div>
            </div>

            {/* CHAT MESSAGES PANEL */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {messages.map((msg) => {
                const isOwn = msg.sender_id === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-fadeIn`}>
                    <div className={`max-w-[80%] space-y-1.5 ${isOwn ? "order-1" : "order-2"}`}>
                      
                      {/* Message Bubble Text */}
                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isOwn
                          ? "bg-primary-600/15 border border-primary-500/20 text-zinc-100 rounded-tr-none"
                          : "bg-[#09090f] border border-white/5 text-zinc-300 rounded-tl-none"
                      }`}>
                        <p>{msg.text}</p>
                        
                        {/* Shared Card Attachment */}
                        {msg.attachment && (
                          <div className="mt-3 p-3 rounded-xl bg-black/50 border border-white/10 space-y-2">
                            <div className="flex items-center gap-2">
                              {msg.attachment.image ? (
                                <img src={msg.attachment.image} alt={msg.attachment.title} className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500">
                                  {msg.attachment.type === "club" ? <Building2 className="w-5 h-5" /> : <Ticket className="w-5 h-5" />}
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="text-[8px] bg-primary-500/10 border border-primary-500/20 text-primary-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                                  {msg.attachment.type === "club" ? "Discoteca" : "Evento"}
                                </span>
                                <h5 className="text-xs font-bold text-white truncate mt-1 leading-tight font-outfit">{msg.attachment.title}</h5>
                                {msg.attachment.subtitle && (
                                  <p className="text-[9px] text-zinc-400 truncate mt-0.5">{msg.attachment.subtitle}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Timestamp */}
                      <span className={`text-[8px] text-zinc-650 font-bold uppercase tracking-wider block ${isOwn ? "text-right" : "text-left"}`}>
                        {new Date(msg.created_at).toLocaleTimeString("es-CO", { hour: "numeric", minute: "numeric" })}
                      </span>

                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT FORM */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-[#09090f]/70 sticky bottom-0 flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe un mensaje privado..."
                className="flex-1 bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-zinc-600"
              />
              <button
                type="submit"
                className="w-9 h-9 rounded-xl bg-primary-600 hover:bg-primary-500 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-550 bg-black/5">
            <MessageSquare className="w-10 h-10 text-zinc-850 mb-3 animate-pulse" />
            <h4 className="font-bold text-sm font-outfit uppercase">Mensajería Privada</h4>
            <p className="text-xs text-zinc-600 mt-1 max-w-xs">
              Selecciona un contacto de la lista de la izquierda para comenzar a chatear.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
