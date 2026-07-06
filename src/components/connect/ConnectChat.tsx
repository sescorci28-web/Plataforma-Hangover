"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
  Paperclip,
  FileText,
  MapPin,
  Star,
  Check,
  Plus,
  Phone,
  Info
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
    type: "club" | "event" | "service" | "profile" | "agenda" | "quotation" | "invoice";
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
  const [activeFilter, setActiveFilter] = useState<"all" | "user" | "provider" | "club" | "staff">("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Find target chat partner
  const chatPartner = allProfiles.find((p) => p.id === selectedChatUserId) || {
    id: "system",
    full_name: "Chat Soporte",
    username: "hangover",
    avatar_url: null,
    role: "staff"
  };

  // Helper type formatting
  const getUserTypeLabel = (role: string) => {
    const r = (role || "").toLowerCase();
    if (r === "provider") return "Proveedor";
    if (r === "staff" || r === "admin") return "Soporte";
    if (r === "club" || r === "discoteca") return "Discoteca";
    if (r === "event") return "Organizador";
    return "Cliente";
  };

  const getUserTypeBadgeStyle = (role: string) => {
    const r = (role || "").toLowerCase();
    if (r === "provider") return "bg-purple-500/10 text-purple-300 border-purple-500/20";
    if (r === "staff" || r === "admin") return "bg-red-500/10 text-red-300 border-red-500/20";
    if (r === "club" || r === "discoteca") return "bg-amber-500/10 text-amber-300 border-amber-500/20";
    if (r === "event") return "bg-blue-500/10 text-blue-300 border-blue-500/20";
    return "bg-zinc-500/10 text-zinc-400 border-zinc-550/20";
  };

  // Helper status formatting
  const getContactStatus = (id: string) => {
    if (!id) return { label: "Desconectado", style: "text-zinc-650" };
    const hash = id.charCodeAt(id.length - 1) % 3;
    if (hash === 0) return { label: "En línea", style: "text-emerald-400" };
    if (hash === 1) return { label: "Hace 5 minutos", style: "text-zinc-500" };
    return { label: "Desconectado", style: "text-zinc-650" };
  };

  // Contact metadata helper for the left column list
  const getContactMeta = (id: string) => {
    if (!id) return { lastMessage: "", time: "", unreadCount: 0 };
    const hash = id.charCodeAt(id.length - 1) % 5;
    let lastMessage = "Hola, ¿cómo estás?";
    let time = "10:35 AM";
    let unreadCount = 0;
    
    if (hash === 0) {
      lastMessage = "Solicitud de servicio enviada. Esperando aprobación.";
      time = "Hace 2 min";
      unreadCount = 1;
    } else if (hash === 1) {
      lastMessage = "Reserva confirmada. ¡Pago recibido con éxito!";
      time = "Ayer";
    } else if (hash === 2) {
      lastMessage = "Perfecto, agendado para las 8:00 PM.";
      time = "12:15 PM";
      unreadCount = 2;
    } else if (hash === 3) {
      lastMessage = "Cotización enviada: DJ Set VIP de 4 horas.";
      time = "Hace 1h";
    }
    return { lastMessage, time, unreadCount };
  };

  // 1. Load initial simulated chat logs
  useEffect(() => {
    if (!selectedChatUserId) return;

    // Load structured messages including automated system cards and details
    const initialLogs: Message[] = [
      {
        id: "msg-1",
        sender_id: selectedChatUserId,
        text: "¡Hola! Estoy muy interesado en contratar tu servicio para nuestro próximo evento privado.",
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: "msg-2",
        sender_id: currentUser.id,
        text: "¡Hola! Claro que sí, con mucho gusto. ¿Me compartes la fecha y el tipo de evento?",
        created_at: new Date(Date.now() - 6000000).toISOString(),
      },
      {
        id: "msg-3",
        sender_id: selectedChatUserId,
        text: "🔔 SOLICITUD DE SERVICIO ENVIADA\n\nServicio: DJ Set Especial VIP\nFecha: 2026-08-18\nPrecio: $750.000 COP\nEstado: Pendiente de revisión",
        created_at: new Date(Date.now() - 5400000).toISOString(),
      },
      {
        id: "msg-4",
        sender_id: currentUser.id,
        text: "Perfecto. Te acabo de adjuntar la propuesta de cotización y los detalles técnicos del servicio:",
        created_at: new Date(Date.now() - 3600000).toISOString(),
        attachment: {
          type: "quotation",
          id: "quote-1",
          title: "Cotización: DJ Set VIP (4 horas)",
          subtitle: "$750.000 COP • Incluye sonido básico y luces de cabina",
        }
      }
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
        "¡Excelente! Quedo al tanto.",
        "Revisaré los requerimientos y te respondo de una.",
        "Listo, nos vemos en la consola del evento.",
        "¡Qué buena vibra!"
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

  // Filter contacts by search query & type filter
  const filteredProfiles = allProfiles.filter((p) => {
    if (p.id === currentUser.id) return false;
    
    // Role type filters
    if (activeFilter !== "all") {
      const role = (p.role || "").toLowerCase();
      if (activeFilter === "user" && role !== "user" && role !== "") return false;
      if (activeFilter === "provider" && role !== "provider") return false;
      if (activeFilter === "club" && role !== "club" && role !== "discoteca") return false;
      if (activeFilter === "staff" && role !== "staff" && role !== "admin") return false;
    }

    const name = p.full_name?.toLowerCase() || "";
    const username = p.username?.toLowerCase() || "";
    const query = searchTerm.toLowerCase();
    
    return name.includes(query) || username.includes(query);
  });

  return (
    <div className="h-full flex bg-[#050509]/45 relative">
      
      {/* COLUMNA IZQUIERDA: LISTA DE CHATS */}
      <div className={`w-full md:w-80 border-r border-white/5 bg-[#050509]/90 flex flex-col shrink-0 ${
        selectedChatUserId ? "hidden md:flex" : "flex"
      }`}>
        
        {/* Search header */}
        <div className="p-4 border-b border-white/5 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-xs uppercase tracking-wider text-white font-outfit">Mensajería Connect</h4>
            <span className="text-[9px] bg-primary-600/10 border border-primary-500/20 text-primary-400 px-2.5 py-0.5 rounded-full font-bold uppercase">
              {filteredProfiles.length} Activos
            </span>
          </div>
          <input
            type="text"
            placeholder="Buscar chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-zinc-650"
          />
        </div>

        {/* Filters Quick bar */}
        <div className="px-4 pb-3 border-b border-white/5 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {([
            { id: "all", label: "Todos" },
            { id: "user", label: "Clientes" },
            { id: "provider", label: "Proveedores" },
            { id: "club", label: "Locales" },
            { id: "staff", label: "Soporte" }
          ] as const).map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === filter.id 
                  ? "bg-primary-600 border-primary-500 text-white"
                  : "bg-white/5 border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Contacts list */}
        <div className="flex-grow overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {filteredProfiles.map((usr) => {
            const isSelected = usr.id === selectedChatUserId;
            const statusInfo = getContactStatus(usr.id);
            const metaInfo = getContactMeta(usr.id);
            
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
                {/* Avatar with dynamic status dot */}
                <div className="relative shrink-0">
                  {usr.avatar_url ? (
                    <img src={usr.avatar_url} alt={usr.full_name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white uppercase border border-white/5">
                      {usr.full_name?.[0] || "U"}
                    </div>
                  )}
                  {statusInfo.label === "En línea" && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-black" />
                  )}
                </div>

                <div className="min-w-0 flex-grow">
                  <div className="flex justify-between items-baseline gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h5 className="text-xs font-black truncate leading-tight font-outfit text-white">{usr.full_name}</h5>
                      <span className={`text-[7px] px-1.5 py-0.2 rounded border uppercase font-bold shrink-0 ${getUserTypeBadgeStyle(usr.role)}`}>
                        {getUserTypeLabel(usr.role)}
                      </span>
                    </div>
                    <span className="text-[8px] text-zinc-550 shrink-0 font-bold">{metaInfo.time}</span>
                  </div>

                  <p className="text-[10px] text-zinc-500 truncate mt-1 leading-relaxed">
                    {metaInfo.lastMessage}
                  </p>
                </div>

                {/* Unread circle counter */}
                {metaInfo.unreadCount > 0 && (
                  <span className="w-4 h-4 bg-primary-600 text-white rounded-full flex items-center justify-center text-[8px] font-black shrink-0">
                    {metaInfo.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
          {filteredProfiles.length === 0 && (
            <div className="text-center p-8 space-y-1 text-zinc-600">
              <p className="text-xs italic font-medium">No se encontraron contactos</p>
              <p className="text-[9px] uppercase tracking-wider">Prueba modificando los filtros</p>
            </div>
          )}
        </div>

      </div>

      {/* COLUMNA DERECHA: CONVERSACIÓN ACTIVA */}
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
                  <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold text-white shrink-0 border border-white/5">
                    {chatPartner.full_name?.[0].toUpperCase() || "S"}
                  </div>
                )}
                
                <div className="min-w-0">
                  <h4 className="text-xs font-black uppercase text-white font-outfit truncate">{chatPartner.full_name}</h4>
                  <span className={`text-[9px] font-bold block ${getContactStatus(chatPartner.id).style}`}>
                    {getContactStatus(chatPartner.id).label}
                  </span>
                </div>
              </div>

              {/* Action buttons header */}
              <div className="flex gap-2">
                <button
                  onClick={() => alert(`Visualizando Perfil de ${chatPartner.full_name}`)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:text-white rounded-xl border border-white/5 transition-all cursor-pointer"
                >
                  Ver Perfil
                </button>
                <button
                  onClick={() => alert(`Información del contacto: ${chatPartner.full_name}\nRol: ${getUserTypeLabel(chatPartner.role)}`)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:text-white rounded-xl border border-white/5 transition-all cursor-pointer"
                >
                  Información
                </button>
              </div>

            </div>

            {/* MESSAGE LIST */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin">
              
              {messages.map((msg) => {
                const isOwn = msg.sender_id === currentUser.id;
                const isSystemMessage = msg.text.startsWith("🔔") || msg.text.startsWith("[COTIZACIÓN]") || msg.text.includes("Pago procesado");
                
                return (
                  <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-fadeIn`}>
                    
                    <div className={`max-w-[80%] space-y-1.5 ${isOwn ? "order-1" : "order-2"}`}>
                      
                      {isSystemMessage ? (
                        /* SYSTEM AND CONTRACT MESSAGES CARDS */
                        <div className="bg-[#0b0b15] border border-primary-500/25 rounded-2xl p-4 text-xs max-w-sm space-y-2.5 shadow-lg shadow-primary-950/10">
                          <div className="flex items-center gap-1.5 text-primary-400 font-black uppercase text-[10px] tracking-wider border-b border-white/5 pb-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Notificación de Contratación</span>
                          </div>
                          <p className="text-zinc-300 leading-relaxed whitespace-pre-line font-mono text-[10px]">{msg.text}</p>
                          <div className="text-[8px] text-zinc-550 font-bold uppercase tracking-wider text-right">
                            {new Date(msg.created_at).toLocaleTimeString("es-CO", { hour: "numeric", minute: "numeric" })}
                          </div>
                        </div>
                      ) : (
                        /* STANDARD CHAT BUBBLE */
                        <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isOwn
                            ? "bg-primary-600/15 border border-primary-500/25 text-zinc-100 rounded-tr-none shadow-md shadow-primary-950/5"
                            : "bg-[#09090f] border border-white/5 text-zinc-300 rounded-tl-none"
                        }`}>
                          <p>{msg.text}</p>
                          
                          {/* Rich attachment card rendering */}
                          {msg.attachment && (
                            <div className="mt-3 p-4 rounded-2xl bg-zinc-950/90 border border-white/10 space-y-3 max-w-sm">
                              <div className="flex items-start justify-between gap-2.5">
                                <div className="min-w-0">
                                  <span className={`text-[8px] border px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                                    msg.attachment.type === "club" ? "bg-amber-500/10 text-amber-300 border-amber-500/20" :
                                    msg.attachment.type === "event" ? "bg-blue-500/10 text-blue-300 border-blue-500/20" :
                                    msg.attachment.type === "service" ? "bg-purple-500/10 text-purple-300 border-purple-500/20" :
                                    msg.attachment.type === "quotation" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20 animate-pulse" :
                                    "bg-zinc-500/10 text-zinc-300 border-zinc-550/20"
                                  }`}>
                                    {msg.attachment.type === "club" ? "Discoteca" :
                                     msg.attachment.type === "event" ? "Evento" :
                                     msg.attachment.type === "service" ? "Servicio" :
                                     msg.attachment.type === "quotation" ? "Cotización Directa" : "Documento"}
                                  </span>
                                  <h5 className="text-xs font-black text-white mt-1.5 leading-tight font-outfit truncate">{msg.attachment.title}</h5>
                                  {msg.attachment.subtitle && (
                                    <p className="text-[10px] text-zinc-400 mt-0.5 leading-normal truncate">{msg.attachment.subtitle}</p>
                                  )}
                                </div>

                                {msg.attachment.image && (
                                  <img src={msg.attachment.image} alt={msg.attachment.title} className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0" />
                                )}
                              </div>

                              {/* Interactive operations in attachment footer */}
                              <div className="pt-2.5 border-t border-white/5 flex gap-2">
                                {msg.attachment.type === "quotation" && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => alert("¡Cotización aprobada! Estado de la reserva actualizado a ACCEPTED.")}
                                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-1.5 text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                                    >
                                      Aceptar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => alert("Cotización rechazada.")}
                                      className="flex-1 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg py-1.5 text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                                    >
                                      Rechazar
                                    </button>
                                  </>
                                )}

                                {msg.attachment.type === "club" && (
                                  <Link
                                    href={`/discotecas/${msg.attachment.id}`}
                                    className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-lg py-1.5 text-[9px] font-black uppercase tracking-wider text-center transition-colors cursor-pointer"
                                  >
                                    Ver Detalle Local
                                  </Link>
                                )}

                                {msg.attachment.type === "event" && (
                                  <Link
                                    href={`/events/${msg.attachment.id}`}
                                    className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-lg py-1.5 text-[9px] font-black uppercase tracking-wider text-center transition-colors cursor-pointer"
                                  >
                                    Ver Detalle Evento
                                  </Link>
                                )}

                                {msg.attachment.type === "service" && (
                                  <button
                                    type="button"
                                    onClick={() => alert("Mostrando detalle técnico de la cotización...")}
                                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-1.5 text-[9px] font-black uppercase tracking-wider text-center transition-colors cursor-pointer"
                                  >
                                    Ver Detalle
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

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

            {/* CHAT INPUT AREA */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-[#09090f]/70 sticky bottom-0 flex gap-2 items-center shrink-0">
              
              {/* Attachment options list */}
              <div className="flex gap-1.5 shrink-0">
                
                <button
                  type="button"
                  onClick={() => {
                    const url = prompt("Introduce el enlace de la imagen o selecciona un archivo (simulado):");
                    if (url) {
                      setMessages(prev => [...prev, {
                        id: `msg-${Date.now()}`,
                        sender_id: currentUser.id,
                        text: "Te envié una imagen adjunta.",
                        created_at: new Date().toISOString(),
                        attachment: {
                          type: "event",
                          id: "img-attach",
                          title: "Archivo Imagen",
                          subtitle: "imagen_evento.jpg",
                          image: url
                        }
                      }]);
                    }
                  }}
                  className="p-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl border border-white/5 transition-colors cursor-pointer"
                  title="Enviar imagen"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMessages(prev => [...prev, {
                      id: `msg-${Date.now()}`,
                      sender_id: currentUser.id,
                      text: "Te envié un documento PDF.",
                      created_at: new Date().toISOString(),
                      attachment: {
                        type: "service",
                        id: "doc-attach",
                        title: "Cronograma_Hangover.pdf",
                        subtitle: "Documento PDF - 1.8 MB"
                      }
                    }]);
                  }}
                  className="p-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl border border-white/5 transition-colors cursor-pointer"
                  title="Enviar documento"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMessages(prev => [...prev, {
                      id: `msg-${Date.now()}`,
                      sender_id: currentUser.id,
                      text: "Ubicación del evento compartida.",
                      created_at: new Date().toISOString(),
                      attachment: {
                        type: "club",
                        id: "loc-attach",
                        title: "Calle 79 # 53-21 (Salón VIP)",
                        subtitle: "Ver dirección en mapa"
                      }
                    }]);
                  }}
                  className="p-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl border border-white/5 transition-colors cursor-pointer"
                  title="Enviar ubicación"
                >
                  <MapPin className="w-3.5 h-3.5" />
                </button>

              </div>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe un mensaje privado..."
                className="flex-1 bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-zinc-650"
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
            <h4 className="font-bold text-sm font-outfit uppercase">Mensajería Connect</h4>
            <p className="text-xs text-zinc-600 mt-1 max-w-xs leading-relaxed">
              Selecciona una conversación del listado lateral para comenzar a chatear.
            </p>
          </div>
        )}

      </div>

    </div>
  );
}
