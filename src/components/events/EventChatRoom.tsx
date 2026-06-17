'use client';

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Image as ImageIcon, Sparkles, Clock, Lock, ShieldAlert, AlertCircle, Loader2 } from "lucide-react";
import { getChatMessages, sendChatMessage } from "@/app/events/actions";
import { createClient } from "@/lib/supabase/client";

interface EventChatRoomProps {
  eventId: string;
  currentUser: any;
  hasAccess: boolean;
  eventDate: string;
}

export function EventChatRoom({ eventId, currentUser, hasAccess, eventDate }: EventChatRoomProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isWithinTimeFrame, setIsWithinTimeFrame] = useState(false);
  const [timeRemainingText, setTimeRemainingText] = useState("");
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    // Check if within 24 hours of target date
    const checkTimeFrame = () => {
      const targetTime = Date.parse(eventDate);
      if (isNaN(targetTime)) return;

      const now = Date.now();
      const difference = targetTime - now;
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (difference <= twentyFourHours && difference > - (6 * 60 * 60 * 1000)) {
        setIsWithinTimeFrame(true);
      } else {
        setIsWithinTimeFrame(false);
        if (difference > twentyFourHours) {
          const diffHrs = Math.floor(difference / (1000 * 60 * 60));
          if (diffHrs > 24) {
            const days = Math.floor(diffHrs / 24);
            const hrs = diffHrs % 24;
            setTimeRemainingText(`Disponible en ${days}d y ${hrs}h (se habilita 24h antes del evento)`);
          } else {
            setTimeRemainingText(`Disponible en ${diffHrs}h (se habilita 24h antes del evento)`);
          }
        } else {
          setTimeRemainingText("El chat de este evento ya finalizó.");
        }
      }
    };

    checkTimeFrame();
    const interval = setInterval(checkTimeFrame, 60000);
    return () => clearInterval(interval);
  }, [eventDate]);

  useEffect(() => {
    if (!isWithinTimeFrame || !hasAccess || !currentUser) return;

    const fetchMessages = async () => {
      setLoading(true);
      const res = await getChatMessages(eventId);
      if (res.success) {
        setMessages(res.messages || []);
      }
      setLoading(false);
      scrollToBottom();
    };

    fetchMessages();

    // Setup realtime subscription
    const channel = supabase
      .channel(`event-chat-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "event_chat_messages"
        },
        async (payload) => {
          // Re-fetch or insert message locally
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", payload.new.sender_id)
            .single();

          const messageWithSender = {
            ...payload.new,
            sender: profile
          };

          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, messageWithSender];
          });
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, isWithinTimeFrame, hasAccess, currentUser]);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const text = newMessage.trim();
    setNewMessage("");

    const res = await sendChatMessage(eventId, text);
    if (res.error) {
      alert(res.error);
    } else {
      scrollToBottom();
    }
    setSending(false);
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-white/5 bg-zinc-950/20 rounded-3xl text-center space-y-3">
        <Lock className="w-8 h-8 text-zinc-500" />
        <p className="text-xs text-zinc-400">Por favor, inicia sesión para acceder al chat del evento.</p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-rose-500/15 bg-rose-500/5 rounded-3xl text-center space-y-4">
        <ShieldAlert className="w-8 h-8 text-rose-400" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-white font-outfit uppercase tracking-widest">Acceso Denegado</p>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
            El chat exclusivo del evento está restringido a compradores de entradas oficiales o asistentes confirmados.
          </p>
        </div>
      </div>
    );
  }

  if (!isWithinTimeFrame) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-primary-500/15 bg-primary-500/5 rounded-3xl text-center space-y-4">
        <Clock className="w-8 h-8 text-primary-400 animate-pulse" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-white font-outfit uppercase tracking-widest">Chat Programado</p>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto font-medium">
            {timeRemainingText}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#07070c]/90 border border-white/8 rounded-3xl h-[480px] overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/6 bg-white/[0.01]">
        <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h4 className="text-xs font-black text-white font-outfit uppercase tracking-wider">Chat en Vivo del Evento</h4>
          <p className="text-[9px] text-zinc-500 font-semibold mt-0.5">Comunidad en vivo • Activo</p>
        </div>
        <span className="ml-auto w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-none">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-500">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-[10px] uppercase tracking-wider font-bold">Cargando mensajes...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-1.5 text-zinc-600 text-center">
            <Sparkles className="w-6 h-6 text-zinc-700" />
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Comienza la conversación</p>
            <p className="text-[10px] text-zinc-550 max-w-[240px] leading-relaxed">Envía un mensaje de saludo para conectar con otros asistentes.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === currentUser.id;
            return (
              <div key={m.id} className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 overflow-hidden shrink-0">
                  {m.sender?.avatar_url ? (
                    <img src={m.sender.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary-600/20 flex items-center justify-center text-[10px] font-extrabold text-white">
                      {m.sender?.full_name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>

                {/* Message Body */}
                <div className="space-y-1">
                  {!isMe && (
                    <span className="text-[9px] text-zinc-500 font-bold block ml-1">{m.sender?.full_name || "Asistente"}</span>
                  )}
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    isMe 
                      ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-tr-none' 
                      : 'bg-zinc-900 border border-white/5 text-zinc-200 rounded-tl-none'
                  }`}>
                    {m.message}
                  </div>
                  <span className="text-[8px] text-zinc-650 block text-right">
                    {new Date(m.created_at).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-3 bg-black/45 border-t border-white/6 flex items-center gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje para conectar..."
          disabled={sending}
          className="flex-grow bg-white/5 border border-white/6 rounded-2xl px-4 py-3 text-xs text-white placeholder-zinc-550 focus:outline-none focus:border-primary-500/40 transition-colors"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="w-10 h-10 rounded-2xl bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all cursor-pointer shadow-lg active:scale-95 shrink-0"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
