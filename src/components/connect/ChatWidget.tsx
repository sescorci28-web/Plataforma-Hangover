"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { 
  X, Send, Loader2, ArrowLeft, ShieldAlert, UserMinus, ShieldCheck
} from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { sendConnectMessage } from "@/app/services/connectActions";

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  social_instagram: string | null;
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  message_text: string;
  is_read: boolean;
  created_at: string;
}

interface ChatWidgetProps {
  chatId: string;
  otherUser: Profile;
  currentUser: any;
  onClose: () => void;
}

export function ChatWidget({ chatId, otherUser, currentUser, onClose }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [loadingMessages, setLoadingMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const supabase = createClient();

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Fetch initial message history
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("connect_messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (!error && data) {
        setMessages((data as any[]) || []);
      }
    } catch (err) {
      console.error("Error loading chat messages:", err);
    } finally {
      setLoadingMessages(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  // 2. Mark messages as read helper
  const markMessagesAsRead = async () => {
    try {
      await supabase
        .from("connect_messages")
        .update({ is_read: true })
        .eq("chat_id", chatId)
        .eq("sender_id", otherUser.id)
        .eq("is_read", false);
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  };

  useEffect(() => {
    fetchMessages();
    markMessagesAsRead();

    // 3. Supabase Realtime channel subscription specifically for this chat's messages
    const channel = supabase
      .channel(`chat-channel-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "connect_messages",
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicate rendering if already in state
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          
          if (newMsg.sender_id === otherUser.id) {
            markMessagesAsRead();
          }
          
          setTimeout(scrollToBottom, 50);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  // Scroll on message length change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText("");

    startTransition(async () => {
      const res = await sendConnectMessage({
        chatId,
        messageText: text
      });
      if (res.error) {
        alert(res.error);
        setInputText(text); // Restore text on failure
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed inset-y-0 right-0 w-full md:max-w-md bg-[#07070c] border-l border-white/10 shadow-2xl flex flex-col z-50 pt-16 md:pt-0"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="md:hidden w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="w-9 h-9 rounded-full border border-white/10 bg-zinc-900 overflow-hidden p-0.5">
            {otherUser.avatar_url ? (
              <img src={otherUser.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full bg-primary-500/10 flex items-center justify-center text-primary-400 font-extrabold text-xs rounded-full">
                {otherUser.full_name?.charAt(0) || "U"}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-white text-xs truncate leading-snug font-outfit">
              {otherUser.full_name}
            </h4>
            <p className="text-[9px] text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Conectado</span>
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="hidden md:flex w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message history */}
      <div className="flex-grow overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-black/10 via-[#05050a] to-[#07070c]">
        {loadingMessages ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
            <div className="w-12 h-12 bg-white/3 border border-white/5 rounded-2xl flex items-center justify-center text-zinc-500 mb-2">
              💬
            </div>
            <h5 className="text-white text-xs font-bold font-outfit">Inicia la conversación</h5>
            <p className="text-[10px] text-zinc-500 leading-normal max-w-[200px]">
              ¡Sé el primero en enviar un mensaje! Mantén el chat divertido y respetuoso.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser.id;
            return (
              <div 
                key={msg.id}
                className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}>
                  <div className={`px-4.5 py-3 rounded-2xl text-xs leading-relaxed ${
                    isMe 
                      ? 'bg-primary-600 text-white rounded-tr-none' 
                      : 'bg-zinc-900 border border-white/5 text-zinc-200 rounded-tl-none'
                  }`}>
                    <p className="break-words whitespace-pre-wrap">{msg.message_text}</p>
                  </div>
                  <span className="text-[9px] text-zinc-500 font-semibold px-1.5">
                    {new Date(msg.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input controls */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-zinc-950/90 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-grow bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-650 focus:border-primary-500 outline-none"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isPending}
          className="w-10 h-10 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white flex items-center justify-center transition-all cursor-pointer"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </motion.div>
  );
}
