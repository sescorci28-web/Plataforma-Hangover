"use client";

import { useState, useEffect, useRef, useTransition } from "react";
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
  X,
  Phone,
  Info,
  DollarSign,
  Award,
  Users,
  CreditCard,
  ExternalLink,
  Compass,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Inbox,
  Download
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateBookingStatus } from "@/app/services/actions";

interface ChatProps {
  currentUser: any;
  selectedChatUserId: string | null;
  allProfiles: any[];
  clubsList: any[];
  eventsList: any[];
  onBack?: () => void;
  onSelectUser?: (userId: string) => void;
}

interface ChatListItem {
  id: string;
  partner: any;
  lastMessage: string;
  lastMessageTime: string;
  rawLastMsgTime: string;
  unreadCount: number;
}

interface Message {
  id: string;
  sender_id: string;
  text: string;
  created_at: string;
  status?: "sending" | "sent" | "error";
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
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [realBooking, setRealBooking] = useState<any | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "user" | "provider" | "club" | "staff">("all");
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [loadingChats, setLoadingChats] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showNewMessagesBanner, setShowNewMessagesBanner] = useState(false);
  const isAtBottomRef = useRef(true);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const activeChatIdRef = useRef<string | null>(null);
  const [inAppNotification, setInAppNotification] = useState<{ senderName: string; chatUserId: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Find active chat partner profile
  const chatPartner = allProfiles.find((p) => p.id === selectedChatUserId) || null;

  // Helper formatting for User Roles
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

  const getContactStatus = (id: string) => {
    return { label: "Disponible en Connect", style: "text-zinc-500 font-bold" };
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    // Check if user is scrolled near the bottom (within 60px)
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 60;
    isAtBottomRef.current = isAtBottom;
    
    if (isAtBottom) {
      setShowNewMessagesBanner(false);
    }
  };

  // 1. Fetch real chat list for currentUser
  useEffect(() => {
    const fetchChats = async () => {
      setLoadingChats(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: chatsData } = await supabase
          .from("connect_chats")
          .select("id, user_a_id, user_b_id, created_at")
          .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

        const formattedChats: ChatListItem[] = [];

        if (chatsData) {
          for (const chat of chatsData) {
            const partnerId = chat.user_a_id === user.id ? chat.user_b_id : chat.user_a_id;
            const partnerProfile = allProfiles.find((p) => p.id === partnerId);
            
            if (partnerProfile) {
              // Fetch last message for preview
              const { data: lastMsg } = await supabase
                .from("connect_messages")
                .select("message_text, created_at")
                .eq("chat_id", chat.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

              const text = lastMsg?.message_text || "";
              const previewText = text.startsWith("[IMAGE]:") 
                ? "📷 Imagen compartida" 
                : text.startsWith("[FILE]:") 
                ? "📁 Archivo compartido" 
                : text || "No hay mensajes aún";

              formattedChats.push({
                id: chat.id,
                partner: partnerProfile,
                lastMessage: previewText,
                lastMessageTime: lastMsg?.created_at
                  ? new Date(lastMsg.created_at).toLocaleTimeString("es-CO", { hour: "numeric", minute: "numeric" })
                  : "",
                rawLastMsgTime: lastMsg?.created_at || chat.created_at,
                unreadCount: 0
              });
            }
          }
        }

        // Sort by most recent message
        formattedChats.sort((a, b) => new Date(b.rawLastMsgTime).getTime() - new Date(a.rawLastMsgTime).getTime());
        setChats(formattedChats);
      } catch (err) {
        console.error("Error fetching chats:", err);
      } finally {
        setLoadingChats(false);
      }
    };

    fetchChats();
  }, [allProfiles, selectedChatUserId, reloadTrigger]);

  // 2. EFECTO UNIFICADO: Fetch mensajes + Suscripción Realtime por chat activo
  // Un solo efecto sin race conditions. Cuando cambia selectedChatUserId:
  // 1) Cancela el canal anterior
  // 2) Carga mensajes históricos
  // 3) Abre suscripción Realtime filtrada por chat_id
  useEffect(() => {
    if (!selectedChatUserId || !currentUser.id) {
      setMessages([]);
      activeChatIdRef.current = null;
      return;
    }

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let aborted = false; // previene actualizaciones de estado si el efecto limpió antes

    const init = async () => {
      try {
        const [userA, userB] = [currentUser.id, selectedChatUserId].sort();

        const { data: chatRecord } = await supabase
          .from("connect_chats")
          .select("id")
          .eq("user_a_id", userA)
          .eq("user_b_id", userB)
          .maybeSingle();

        if (aborted) return;

        if (!chatRecord) {
          activeChatIdRef.current = null;
          setMessages([]);
          return;
        }

        const chatId = chatRecord.id;
        activeChatIdRef.current = chatId;

        // Cargar historial de mensajes
        const { data: messagesData } = await supabase
          .from("connect_messages")
          .select("*")
          .eq("chat_id", chatId)
          .order("created_at", { ascending: true });

        if (aborted) return;

        if (messagesData) {
          setMessages(
            messagesData.map((m) => ({
              id: m.id,
              sender_id: m.sender_id,
              text: m.message_text,
              created_at: m.created_at,
              status: "sent" as const
            }))
          );
          setTimeout(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }
          }, 100);
        }

        // Suscripción Realtime para este chat específico
        // Requiere que connect_messages tenga REPLICA IDENTITY FULL
        // y esté en la publicación supabase_realtime
        channel = supabase
          .channel(`chat-messages:${chatId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "connect_messages",
              filter: `chat_id=eq.${chatId}`
            },
            (payload) => {
              if (aborted) return;
              const newMsg = payload.new as any;

              // Ignorar mensajes propios (ya están por actualización optimista)
              if (newMsg.sender_id === currentUser.id) return;

              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [
                  ...prev,
                  {
                    id: newMsg.id,
                    sender_id: newMsg.sender_id,
                    text: newMsg.message_text,
                    created_at: newMsg.created_at,
                    status: "sent" as const
                  }
                ];
              });

              // Actualizar preview en la barra lateral
              setChats((prev) => {
                const list = [...prev];
                const idx = list.findIndex((c) => c.id === chatId);
                if (idx !== -1) {
                  const text = newMsg.message_text || "";
                  list[idx].lastMessage = text.startsWith("[IMAGE]:")
                    ? "📷 Imagen compartida"
                    : text.startsWith("[FILE]:")
                    ? "📁 Archivo compartido"
                    : text;
                  list[idx].lastMessageTime = new Date(newMsg.created_at).toLocaleTimeString("es-CO", {
                    hour: "numeric",
                    minute: "numeric"
                  });
                  list[idx].rawLastMsgTime = newMsg.created_at;
                  list.sort((a, b) => new Date(b.rawLastMsgTime).getTime() - new Date(a.rawLastMsgTime).getTime());
                }
                return list;
              });

              // Auto-scroll o banner de nuevos mensajes
              if (isAtBottomRef.current) {
                setTimeout(() => {
                  if (messagesContainerRef.current) {
                    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                  }
                }, 50);
              } else {
                setShowNewMessagesBanner(true);
              }
            }
          )
          .subscribe((status) => {
            console.log(`[Realtime] chat-messages:${chatId} →`, status);
          });
      } catch (err) {
        console.error("[ConnectChat] Error initializing chat:", err);
      }
    };

    setShowNewMessagesBanner(false);
    init();

    return () => {
      aborted = true;
      activeChatIdRef.current = null;
      if (channel) {
        channel.unsubscribe();
        supabase.removeChannel(channel);
        console.log("[Realtime] Channel cleaned up");
      }
    };
  }, [selectedChatUserId, currentUser.id]);

  // 3. Suscripción global para mensajes en OTROS chats (notificaciones + sidebar)
  useEffect(() => {
    if (!currentUser.id) return;

    const supabase = createClient();

    // Escucha todos los INSERT en connect_messages sin filtro de fila.
    // Para mensajes del chat activo, el efecto #2 ya lo maneja con su canal propio.
    // Este canal solo procesa mensajes de OTROS chats para actualizar la barra lateral
    // y mostrar notificaciones in-app.
    const channel = supabase
      .channel(`global-messages:${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "connect_messages"
        },
        (payload) => {
          const newMsg = payload.new as any;

          // Si pertenece al chat activo, ya fue manejado por el efecto #2
          if (newMsg.chat_id === activeChatIdRef.current) return;
          // Si lo envié yo, no notificar
          if (newMsg.sender_id === currentUser.id) return;

          // Actualizar barra lateral (reodernar y preview)
          setReloadTrigger((prev) => prev + 1);

          // Mostrar notificación in-app con el nombre del remitente
          setChats((prev) => {
            const chat = prev.find((c) => c.id === newMsg.chat_id);
            if (chat) {
              const senderName = chat.partner?.full_name || "Alguien";
              setInAppNotification({ senderName, chatUserId: chat.partner?.id || "" });
            }
            return prev;
          });
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] global-messages:${currentUser.id} →`, status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser.id]);

  // 5. Fetch real booking details between participants for Contextual Panel (Column 3)
  useEffect(() => {
    if (!selectedChatUserId) {
      setRealBooking(null);
      return;
    }

    const fetchBooking = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("bookings")
          .select("*")
          .or(`user_id.eq.${currentUser.id},user_id.eq.${selectedChatUserId}`)
          .or(`provider_id.eq.${currentUser.id},provider_id.eq.${selectedChatUserId}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        setRealBooking(data || null);
      } catch (err) {
        console.error("Error loading booking:", err);
      }
    };

    fetchBooking();
  }, [selectedChatUserId, currentUser.id]);

  // 6. Real-time booking changes subscription (Sub 2) to update contextual panel on the fly
  useEffect(() => {
    if (!realBooking?.id) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`realtime-booking:${realBooking.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `id=eq.${realBooking.id}`
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setRealBooking(null);
          } else {
            setRealBooking(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [realBooking?.id]);

  // 5. Send message action (with Optimistic Updates)
  const sendMessageText = async (textToSend: string) => {
    if (!textToSend || !selectedChatUserId) return;

    const tempId = `optimistic-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      sender_id: currentUser.id,
      text: textToSend,
      created_at: new Date().toISOString(),
      status: "sending"
    };

    // Append optimistic message locally
    setMessages((prev) => [...prev, optimisticMsg]);

    // Scroll to bottom immediately
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 50);

    try {
      const supabase = createClient();
      const [userA, userB] = [currentUser.id, selectedChatUserId].sort();
      let chatId = chats.find((c) => c.partner.id === selectedChatUserId)?.id || "";

      if (!chatId) {
        // Fetch or create chat room
        const { data: chatRecord } = await supabase
          .from("connect_chats")
          .select("id")
          .eq("user_a_id", userA)
          .eq("user_b_id", userB)
          .maybeSingle();

        if (chatRecord) {
          chatId = chatRecord.id;
        } else {
          const { data: newChat } = await supabase
            .from("connect_chats")
            .insert({ user_a_id: userA, user_b_id: userB })
            .select("id")
            .single();
          if (newChat) chatId = newChat.id;
        }
      }

      if (chatId) {
        const { data: insertedMsg, error } = await supabase
          .from("connect_messages")
          .insert({
            chat_id: chatId,
            sender_id: currentUser.id,
            message_text: textToSend
          })
          .select("*")
          .single();

        if (!error && insertedMsg) {
          // Replace optimistic message with actual persisted message
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId
                ? {
                    id: insertedMsg.id,
                    sender_id: insertedMsg.sender_id,
                    text: insertedMsg.message_text,
                    created_at: insertedMsg.created_at,
                    status: "sent"
                  }
                : m
            )
          );

          // Update latest message info on the sidebar chat item
          setChats((prev) => {
            const list = [...prev];
            const idx = list.findIndex((c) => c.id === chatId);
            if (idx !== -1) {
              list[idx].lastMessage = textToSend.startsWith("[IMAGE]:") 
                ? "📷 Imagen compartida" 
                : textToSend.startsWith("[FILE]:") 
                ? "📁 Archivo compartido" 
                : textToSend;
              list[idx].lastMessageTime = new Date(insertedMsg.created_at).toLocaleTimeString("es-CO", {
                hour: "numeric",
                minute: "numeric"
              });
              list[idx].rawLastMsgTime = insertedMsg.created_at;
              list.sort((a, b) => new Date(b.rawLastMsgTime).getTime() - new Date(a.rawLastMsgTime).getTime());
            }
            return list;
          });
        } else {
          // Set status to error
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, status: "error" } : m))
          );
          alert("Error al enviar el mensaje: " + (error?.message || "Error desconocido"));
        }
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: "error" } : m))
        );
      }
    } catch (err: any) {
      console.error(err);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "error" } : m))
      );
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend) return;
    setInputText(""); // Clear input field immediately
    await sendMessageText(textToSend);
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, isImageOnly = false) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChatUserId) return;

    setIsUploading(true);
    try {
      const supabase = createClient();
      const [userA, userB] = [currentUser.id, selectedChatUserId].sort();
      
      // Get or create chat to find ID for storage folder structure
      let chatId = chats.find((c) => c.partner.id === selectedChatUserId)?.id || "";
      if (!chatId) {
        const { data: chatRecord } = await supabase
          .from("connect_chats")
          .select("id")
          .eq("user_a_id", userA)
          .eq("user_b_id", userB)
          .maybeSingle();
        if (chatRecord) {
          chatId = chatRecord.id;
        } else {
          const { data: newChat } = await supabase
            .from("connect_chats")
            .insert({ user_a_id: userA, user_b_id: userB })
            .select("id")
            .single();
          if (newChat) chatId = newChat.id;
        }
      }

      if (!chatId) throw new Error("No se pudo iniciar el chat.");

      const fileExt = file.name.split('.').pop();
      const safeName = file.name.replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `${safeName}_${Date.now()}.${fileExt}`;
      const filePath = `${chatId}/${fileName}`;

      // Upload to public Supabase Storage bucket 'connect-attachments'
      const { error: uploadError } = await supabase.storage
        .from('connect-attachments')
        .upload(filePath, file);

      if (uploadError) {
        console.warn("Storage upload failed, falling back to base64 encoding:", uploadError);
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          const isImg = file.type.startsWith("image/") || isImageOnly;
          const msgText = isImg ? `[IMAGE]:${base64}` : `[FILE]:${file.name}:${base64}`;
          await sendMessageText(msgText);
        };
        reader.readAsDataURL(file);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('connect-attachments')
          .getPublicUrl(filePath);

        const isImg = file.type.startsWith("image/") || isImageOnly;
        const msgText = isImg ? `[IMAGE]:${publicUrl}` : `[FILE]:${file.name}:${publicUrl}`;
        await sendMessageText(msgText);
      }
    } catch (err: any) {
      console.error("Error upload file:", err);
      alert("Error al adjuntar archivo.");
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  // Helper trigger to update status from the contextual panel (updates both DB and timeline)
  const handleUpdateBookingStatus = (newStatus: string) => {
    if (!realBooking) return;
    startTransition(async () => {
      try {
        const res = await updateBookingStatus(realBooking.id, newStatus);
        if (res.error) {
          alert(res.error);
        } else {
          setRealBooking((prev: any) => ({ ...prev, status: newStatus }));
          alert(`Estado de la reserva cambiado con éxito a ${newStatus}.`);
        }
      } catch (err) {
        console.error(err);
        alert("Error al actualizar estado.");
      }
    });
  };

  // Filter contacts by query & type filter
  const filteredChats = chats.filter((chat) => {
    const usr = chat.partner;
    if (activeFilter !== "all") {
      const role = (usr.role || "").toLowerCase();
      if (activeFilter === "user" && role !== "user" && role !== "") return false;
      if (activeFilter === "provider" && role !== "provider") return false;
      if (activeFilter === "club" && role !== "club" && role !== "discoteca") return false;
      if (activeFilter === "staff" && role !== "staff" && role !== "admin") return false;
    }

    const name = usr.full_name?.toLowerCase() || "";
    const username = usr.username?.toLowerCase() || "";
    const msg = chat.lastMessage.toLowerCase();
    const query = searchTerm.toLowerCase();

    return name.includes(query) || username.includes(query) || msg.includes(query);
  });

  return (
    <div className="h-full flex bg-[#050509]/45 relative overflow-hidden">

      {/* IN-APP NOTIFICATION TOAST (mensajes de otros chats) */}
      {inAppNotification && (
        <div className="absolute top-4 right-4 z-50 max-w-xs w-full animate-fadeIn">
          <div className="bg-[#0f0f1a] border border-primary-500/30 rounded-2xl p-4 shadow-2xl shadow-black/60 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-600/20 border border-primary-500/20 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-primary-400" />
              </div>
              <div className="min-w-0 flex-grow">
                <p className="text-[10px] font-black uppercase tracking-wider text-primary-400 mb-0.5">💬 Nuevo mensaje</p>
                <p className="text-xs font-bold text-white truncate">de {inAppNotification.senderName}</p>
              </div>
              <button
                onClick={() => setInAppNotification(null)}
                className="text-zinc-500 hover:text-white shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (onSelectUser) onSelectUser(inAppNotification.chatUserId);
                  setInAppNotification(null);
                }}
                className="flex-grow bg-primary-600 hover:bg-primary-500 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                Ver conversación
              </button>
              <button
                onClick={() => setInAppNotification(null)}
                className="bg-white/5 hover:bg-white/10 text-zinc-400 text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border border-white/5 transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* COLUMNA 1: LISTADO DE CHATS OPERATIVOS */}
      <div className={`w-full md:w-80 border-r border-white/5 bg-[#050509]/90 flex flex-col shrink-0 ${
        selectedChatUserId ? "hidden md:flex" : "flex"
      }`}>
        
        {/* Search header with metadata */}
        <div className="p-4 border-b border-white/5 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-xs uppercase tracking-wider text-white font-outfit">Mensajería Connect</h4>
            <span className="text-[9px] bg-primary-600/10 border border-primary-500/20 text-primary-400 px-2.5 py-0.5 rounded-full font-bold uppercase">
              {filteredChats.length} Activas
            </span>
          </div>
          
          <input
            type="text"
            placeholder="Buscar contactos o mensajes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-zinc-650"
          />
        </div>



        {/* Chats list */}
        <div className="flex-grow overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {loadingChats ? (
            <div className="flex items-center justify-center pt-12 text-zinc-550 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary-550" />
              <span className="text-xs uppercase tracking-wider font-bold">Cargando chats...</span>
            </div>
          ) : filteredChats.length > 0 ? (
            filteredChats.map((chat) => {
              const usr = chat.partner;
              const isSelected = usr.id === selectedChatUserId;
              
              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => onSelectUser && onSelectUser(usr.id)}
                  className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors cursor-pointer border ${
                    isSelected
                      ? "bg-primary-600/15 border-primary-500/25 text-white"
                      : "bg-transparent border-transparent hover:bg-white/5 text-zinc-400 hover:text-white"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {usr.avatar_url ? (
                      <img src={usr.avatar_url} alt={usr.full_name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white uppercase border border-white/5">
                        {usr.full_name?.[0] || "U"}
                      </div>
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
                      <span className="text-[8px] text-zinc-550 shrink-0 font-bold">{chat.lastMessageTime}</span>
                    </div>

                    <p className="text-[10px] text-zinc-550 truncate mt-1 leading-relaxed">
                      {chat.lastMessage}
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            /* ELEGANT EMPTY STATE FOR CONVERSATIONS */
            <div className="text-center py-12 px-4 space-y-4 max-w-sm mx-auto select-none">
              <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center mx-auto text-zinc-650">
                <Inbox className="w-6 h-6 text-zinc-500" />
              </div>
              <div className="space-y-1.5">
                <h5 className="text-xs font-black text-white font-outfit uppercase tracking-wider">Todavía no tienes conversaciones</h5>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Cuando reserves un servicio, contactes un proveedor, una discoteca o un organizador, tus conversaciones aparecerán aquí automáticamente.
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/servicios"
                  className="bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-2 px-3 text-[10px] font-black uppercase tracking-wider transition-colors text-center"
                >
                  Explorar Servicios
                </Link>
                <Link
                  href="/discotecas"
                  className="bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl py-2 px-3 text-[10px] font-black uppercase tracking-wider transition-all text-center border border-white/5"
                >
                  Explorar Eventos
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* COLUMNA 2: CONVERSACIÓN */}
      <div className={`flex-grow flex flex-col bg-[#050509]/20 relative ${
        selectedChatUserId ? "flex" : "hidden md:flex"
      }`}>
        
        {selectedChatUserId && chatPartner ? (
          <div className="h-full flex flex-col relative">
            
            {/* CHAT HEADER */}
            <div className="p-4 border-b border-white/5 bg-[#09090f]/75 flex items-center justify-between sticky top-0 z-10 shrink-0">
              
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Back button for mobile */}
                <button 
                  onClick={onBack} 
                  className="md:hidden text-zinc-400 hover:text-white shrink-0 p-1 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>


                
                <div className="flex items-center gap-3.5 min-w-0">
                  {chatPartner.avatar_url ? (
                    <img src={chatPartner.avatar_url} alt={chatPartner.full_name} className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0" />
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

              </div>

              {/* Chat action controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert(`Buscando archivos compartidos con ${chatPartner.full_name}...`)}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-wider text-zinc-300 hover:text-white rounded-xl border border-white/5 transition-all cursor-pointer flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Archivos</span>
                </button>

                <button
                  onClick={() => setShowRightPanel(prev => !prev)}
                  className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 border ${
                    showRightPanel 
                      ? "bg-primary-600/10 border-primary-500/20 text-primary-400" 
                      : "bg-white/5 border-white/5 text-zinc-400"
                  }`}
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Información</span>
                </button>
              </div>

            </div>

            {/* MESSAGES LOG */}
            <div className="flex-grow relative flex flex-col min-h-0">
              <div 
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin"
              >
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === currentUser.id;
                  const isSystemMessage = msg.text.startsWith("🔔") || msg.text.startsWith("[COTIZACIÓN]") || msg.text.includes("Cambio de estado") || msg.text.includes("Estado de la reserva");
                  
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-fadeIn`}>
                      <div className={`max-w-[80%] space-y-1.5 ${isOwn ? "order-1" : "order-2"}`}>
                        
                        {isSystemMessage ? (
                          /* SYSTEM NOTIFICATION CARD */
                          <div className="bg-[#0b0b15] border border-primary-500/25 rounded-2xl p-4 text-xs max-w-sm space-y-2.5 shadow-lg shadow-primary-950/10">
                            <div className="flex items-center gap-1.5 text-primary-400 font-black uppercase text-[10px] tracking-wider border-b border-white/5 pb-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Notificación de Sistema</span>
                            </div>
                            <p className="text-zinc-300 leading-relaxed whitespace-pre-line font-mono text-[10px]">{msg.text}</p>
                            <div className="text-[8px] text-zinc-550 font-bold uppercase tracking-wider text-right">
                              {new Date(msg.created_at).toLocaleTimeString("es-CO", { hour: "numeric", minute: "numeric" })}
                            </div>
                          </div>
                        ) : (
                          /* STANDARD CHAT BUBBLE */
                          <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            isOwn
                              ? "bg-primary-600/15 border border-primary-500/25 text-zinc-100 rounded-tr-none shadow-md shadow-primary-950/5"
                              : "bg-[#09090f] border border-white/5 text-zinc-300 rounded-tl-none"
                          }`}>
                            {msg.text.startsWith("[IMAGE]:") ? (
                              <div className="relative group max-w-sm rounded-xl overflow-hidden border border-white/10 bg-black/45 shadow-lg">
                                <img
                                  src={msg.text.replace("[IMAGE]:", "")}
                                  alt="Imagen compartida"
                                  className="w-full h-auto max-h-64 object-cover cursor-pointer hover:scale-[1.01] transition-transform duration-250"
                                  onClick={() => window.open(msg.text.replace("[IMAGE]:", ""), "_blank")}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-white bg-black/60 px-2 py-1 rounded-lg">Ver pantalla completa ↗</span>
                                </div>
                              </div>
                            ) : msg.text.startsWith("[FILE]:") ? (
                              (() => {
                                const payload = msg.text.replace("[FILE]:", "");
                                const colonIdx = payload.indexOf(":");
                                const fileName = colonIdx !== -1 ? payload.substring(0, colonIdx) : "Archivo";
                                const fileUrl = colonIdx !== -1 ? payload.substring(colonIdx + 1) : payload;
                                return (
                                  <div className="flex items-center gap-3 p-2 bg-black/35 rounded-xl border border-white/5 max-w-xs shadow-inner">
                                    <div className="w-8 h-8 bg-primary-600/15 rounded-lg flex items-center justify-center text-primary-400 shrink-0">
                                      <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-grow">
                                      <p className="font-bold text-[10px] text-white truncate">{fileName}</p>
                                      <span className="text-[8px] text-zinc-500 font-bold block uppercase tracking-wider">Documento</span>
                                    </div>
                                    <a
                                      href={fileUrl}
                                      download={fileName}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-300 hover:text-white transition-colors cursor-pointer"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                );
                              })()
                            ) : (
                              <p className="whitespace-pre-line">{msg.text}</p>
                            )}
                          </div>
                        )}
  
                        {/* Timestamp & Indicators */}
                        <div className={`flex items-center gap-1.5 justify-end ${isOwn ? "text-right" : "text-left"}`}>
                          <span className="text-[8px] text-zinc-650 font-bold uppercase tracking-wider">
                            {new Date(msg.created_at).toLocaleTimeString("es-CO", { hour: "numeric", minute: "numeric" })}
                          </span>
                          {isOwn && (
                            <span className="text-[9px] font-bold">
                              {msg.status === "sending" ? (
                                <span className="text-zinc-500 animate-pulse">Enviando...</span>
                              ) : msg.status === "error" ? (
                                <span className="text-red-500 font-extrabold flex items-center gap-0.5" title="Error al enviar el mensaje">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Error
                                </span>
                              ) : (
                                <span className="text-emerald-500 font-extrabold" title="Enviado">✓</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {showNewMessagesBanner && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
                  <button
                    onClick={() => {
                      if (messagesContainerRef.current) {
                        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                      }
                      setShowNewMessagesBanner(false);
                    }}
                    className="bg-primary-600 hover:bg-primary-500 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-full border border-primary-500/30 flex items-center gap-1.5 shadow-lg shadow-black/50 animate-pulse cursor-pointer"
                  >
                    <span>Nuevos mensajes ↓</span>
                  </button>
                </div>
              )}
            </div>

            {/* CHAT INPUT AREA */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-[#09090f]/70 sticky bottom-0 flex gap-2 items-center shrink-0">
              
              {/* Real hidden file inputs */}
              <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                onChange={(e) => handleUploadFile(e, true)}
                className="hidden"
              />
              <input
                type="file"
                ref={fileInputRef}
                accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={(e) => handleUploadFile(e, false)}
                className="hidden"
              />

              {/* Attachment options list */}
              <div className="flex gap-1.5 shrink-0">
                
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-zinc-400 hover:text-white rounded-xl border border-white/5 transition-colors cursor-pointer"
                  title="Enviar imagen"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-zinc-400 hover:text-white rounded-xl border border-white/5 transition-colors cursor-pointer"
                  title="Enviar documento"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (selectedChatUserId) {
                      await sendMessageText(`📍 Ubicación compartida: Calle 85 # 11-12, Bogotá (Salón Dulcinea VIP)`);
                    }
                  }}
                  className="p-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl border border-white/5 transition-colors cursor-pointer"
                  title="Enviar ubicación"
                >
                  <MapPin className="w-3.5 h-3.5" />
                </button>

              </div>

              {isUploading ? (
                <div className="flex-1 bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 flex items-center gap-2 text-xs text-zinc-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-400" />
                  <span>Subiendo archivo...</span>
                </div>
              ) : (
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Escribe un mensaje privado..."
                  className="flex-1 bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-zinc-650"
                />
              )}
              
              <button
                type="submit"
                disabled={isUploading || !inputText.trim()}
                className="w-9 h-9 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>

            </form>

          </div>
        ) : (
          /* ELEGANT WELCOME SCREEN WHEN NO CHAT SELECTED */
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500 bg-black/5 select-none space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-primary-600/10 border border-primary-500/20 flex items-center justify-center text-primary-400 shadow-xl shadow-primary-950/20">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="space-y-2 max-w-sm">
              <h4 className="font-black text-lg font-outfit uppercase tracking-wider text-white">Bienvenido a Hangover Connect</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Este será tu centro de comunicación dentro de Hangover. Desde aquí podrás conversar con proveedores, discotecas, organizadores y recibir actualizaciones en tiempo real sobre tus reservas.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* COLUMNA 3: PANEL CONTEXTUAL INTELIGENTE */}
      {selectedChatUserId && showRightPanel && (
        <div className="hidden xl:flex w-80 md:w-[330px] border-l border-white/5 bg-[#050509]/95 flex-col overflow-y-auto pt-5 pb-5 pl-5 pr-3.5 space-y-6 shrink-0 select-none animate-[slideInRight_0.2s_ease-out]">
          
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-550">Panel de Control Operativo</h4>
            <p className="text-xs text-zinc-400 mt-1">Detalles sincronizados con la conversación.</p>
          </div>

          {realBooking ? (
            <div className="space-y-6">
              
              {/* Status Header */}
              <div className="p-4 bg-white/[0.015] border border-white/5 rounded-2xl space-y-2">
                <p className="text-[8px] font-black uppercase text-zinc-550 tracking-wider">Estado de Contratación</p>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    realBooking.status === "PENDING" ? "bg-amber-500 animate-pulse" :
                    realBooking.status === "ACCEPTED" ? "bg-purple-500" :
                    realBooking.status === "PAID" ? "bg-blue-500" :
                    realBooking.status === "IN_PROGRESS" ? "bg-emerald-500 animate-bounce" : "bg-emerald-500"
                  }`} />
                  <span className="text-xs font-black uppercase text-white tracking-wider font-outfit">
                    {realBooking.status === "PENDING" ? "Pendiente Aprobación" :
                     realBooking.status === "ACCEPTED" ? "Aceptada (Espera Pago)" :
                     realBooking.status === "PAID" ? "Confirmada (Pagada)" :
                     realBooking.status === "IN_PROGRESS" ? "En Curso" : "Completada"}
                  </span>
                </div>
              </div>

              {/* Shared steppers timeline */}
              <div className="space-y-3">
                <h5 className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Timeline del Gig</h5>
                
                <div className="relative flex flex-col gap-3 pl-4 before:content-[''] before:absolute before:left-[4px] before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-800">
                  
                  {/* Step 1 */}
                  <div className="relative flex items-start text-[10px]">
                    <span className="absolute left-[-16px] top-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="font-bold text-white">Solicitud enviada</span>
                  </div>

                  {/* Step 2 */}
                  <div className="relative flex items-start text-[10px]">
                    <span className={`absolute left-[-16px] top-1 w-1.5 h-1.5 rounded-full ${
                      ["ACCEPTED", "PAID", "IN_PROGRESS", "COMPLETED"].includes(realBooking.status) ? "bg-primary-500" : "bg-zinc-800"
                    }`} />
                    <span className={`font-bold ${["ACCEPTED", "PAID", "IN_PROGRESS", "COMPLETED"].includes(realBooking.status) ? "text-white" : "text-zinc-500"}`}>
                      Proveedor aceptó
                    </span>
                  </div>

                  {/* Step 3 */}
                  <div className="relative flex items-start text-[10px]">
                    <span className={`absolute left-[-16px] top-1 w-1.5 h-1.5 rounded-full ${
                      ["PAID", "IN_PROGRESS", "COMPLETED"].includes(realBooking.status) ? "bg-primary-500" : "bg-zinc-800"
                    }`} />
                    <span className={`font-bold ${["PAID", "IN_PROGRESS", "COMPLETED"].includes(realBooking.status) ? "text-white" : "text-zinc-500"}`}>
                      Pago verificado
                    </span>
                  </div>

                  {/* Step 4 */}
                  <div className="relative flex items-start text-[10px]">
                    <span className={`absolute left-[-16px] top-1 w-1.5 h-1.5 rounded-full ${
                      ["IN_PROGRESS", "COMPLETED"].includes(realBooking.status) ? "bg-primary-500" : "bg-zinc-800"
                    }`} />
                    <span className={`font-bold ${["IN_PROGRESS", "COMPLETED"].includes(realBooking.status) ? "text-white" : "text-zinc-500"}`}>
                      Servicio iniciado
                    </span>
                  </div>

                  {/* Step 5 */}
                  <div className="relative flex items-start text-[10px]">
                    <span className={`absolute left-[-16px] top-1 w-1.5 h-1.5 rounded-full ${
                      realBooking.status === "COMPLETED" ? "bg-emerald-500" : "bg-zinc-800"
                    }`} />
                    <span className={`font-bold ${realBooking.status === "COMPLETED" ? "text-white" : "text-zinc-500"}`}>
                      Servicio finalizado
                    </span>
                  </div>

                </div>
              </div>

              {/* Financial specs list */}
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-2.5 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Precio Total</span>
                  <span className="text-white font-bold">${Math.round(realBooking.total_amount || 0).toLocaleString("es-CO")} COP</span>
                </div>
                <div className="flex justify-between">
                  <span>Fecha</span>
                  <span className="text-white font-semibold">
                    {realBooking.event_date ? new Date(realBooking.event_date).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : "N/A"}
                  </span>
                </div>
              </div>

              {/* Place details */}
              {(realBooking.location_name || realBooking.address) && (
                <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl space-y-1.5 text-[10px] text-zinc-400">
                  <p className="font-bold text-white flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                    Lugar: {realBooking.location_name || "Establecimiento"}
                  </p>
                  {realBooking.address && <p>{realBooking.address}</p>}
                </div>
              )}

              {/* Contextual actions buttons */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                {realBooking.status === "PENDING" && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleUpdateBookingStatus("ACCEPTED")}
                      className="bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Aceptar
                    </button>
                    <button
                      onClick={() => handleUpdateBookingStatus("REJECTED")}
                      className="bg-white/5 hover:bg-white/10 text-zinc-400 rounded-xl py-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Rechazar
                    </button>
                  </div>
                )}

                {realBooking.status === "ACCEPTED" && (
                  <button
                    onClick={() => handleUpdateBookingStatus("PAID")}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2 px-4 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <CreditCard className="w-4 h-4" /> Registrar Pago
                  </button>
                )}

                {realBooking.status === "PAID" && (
                  <button
                    onClick={() => handleUpdateBookingStatus("IN_PROGRESS")}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2 px-4 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Iniciar Servicio
                  </button>
                )}

                {realBooking.status === "IN_PROGRESS" && (
                  <button
                    onClick={() => handleUpdateBookingStatus("COMPLETED")}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2 px-4 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Finalizar Servicio
                  </button>
                )}
              </div>

            </div>
          ) : (
            /* SIMPLE INFORMATION CARD WHEN NO BOOKING IS ATTACHED */
            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center space-y-2 select-none">
              <p className="text-xs text-zinc-400">
                Selecciona una conversación para ver su información y reservas activas.
              </p>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
