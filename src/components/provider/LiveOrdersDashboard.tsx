"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Bell,
  Clock,
  Wine,
  Volume2,
  VolumeX,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  X,
  User,
  Coffee,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { updateOrderStatus } from "@/app/services/liveActions";

interface MenuItem {
  name: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  price_at_order: number;
  club_menu_items: MenuItem;
}

interface Order {
  id: string;
  status: "pending" | "preparing" | "delivered_by_staff" | "confirmed" | "cancelled";
  created_at: string;
  live_sessions: {
    user_id: string;
    club_tables: {
      table_number: string;
    };
    profiles: {
      full_name: string | null;
    };
  };
  live_order_items: OrderItem[];
}

interface Club {
  id: string;
  name: string;
  logo: string | null;
  slug: string;
}

interface LiveOrdersDashboardProps {
  clubs: Club[];
}

export function LiveOrdersDashboard({ clubs }: LiveOrdersDashboardProps) {
  const [selectedClubId, setSelectedClubId] = useState<string>(clubs[0]?.id || "");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Audio state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  const [isPending, startTransition] = useTransition();

  // Initialize audio context on user interaction
  const initAudio = () => {
    if (!audioCtx) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (Ctx) {
        setAudioCtx(new Ctx());
      }
    } else if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  };

  // Play C major 9 digital bell chime
  const playPremiumChime = () => {
    if (!soundEnabled) return;
    try {
      const ctx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioCtx) setAudioCtx(ctx);

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Do, Mi, Sol, Si, Re (Cmaj9)
      const freqs = [261.63, 329.63, 392.00, 493.88, 587.33];
      const now = ctx.currentTime;

      freqs.forEach((f, index) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now);
        
        // Bell envelope: instant attack, exponential decay
        gainNode.gain.setValueAtTime(0.0, now);
        gainNode.gain.linearRampToValueAtTime(0.12, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.5 + index * 0.08);

        osc.start(now);
        osc.stop(now + 2.0);
      });
    } catch (err) {
      console.error("Failed to play notification chime:", err);
    }
  };

  // Fetch orders
  const fetchOrders = async () => {
    if (!selectedClubId) return;
    const supabase = createClient();
    try {
      const { data, error: fetchErr } = await supabase
        .from("live_orders")
        .select(`
          id,
          status,
          created_at,
          live_sessions!inner(
            user_id,
            club_id,
            club_tables!inner(table_number),
            profiles!inner(full_name)
          ),
          live_order_items(
            id,
            quantity,
            price_at_order,
            club_menu_items(name)
          )
        `)
        .eq("live_sessions.club_id", selectedClubId)
        .order("created_at", { ascending: false });

      if (fetchErr) {
        console.error("Error fetching orders:", fetchErr);
        setError("Error al consultar comandas.");
      } else {
        setOrders((data as any[] || []));
      }
    } catch (err: any) {
      console.error("Error in fetchOrders:", err);
      setError("Error inesperado en consulta.");
    } finally {
      setLoading(false);
    }
  };

  // Setup realtime listener
  useEffect(() => {
    if (!selectedClubId) return;
    setLoading(true);
    fetchOrders();

    const supabase = createClient();
    const channel = supabase
      .channel(`live-orders-dashboard-${selectedClubId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_orders" },
        async (payload) => {
          // Play sound on new pending order
          if (payload.eventType === "INSERT" && payload.new.status === "pending") {
            const { data: sessionData } = await supabase
              .from("live_sessions")
              .select("club_id")
              .eq("id", payload.new.session_id)
              .single();

            if (sessionData && sessionData.club_id === selectedClubId) {
              playPremiumChime();
            }
          }
          fetchOrders();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_sessions" },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedClubId, audioCtx]);

  // Update order status action wrapper
  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    initAudio();
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, newStatus);
      if (res.error) {
        alert(res.error);
      } else {
        fetchOrders();
      }
    });
  };

  // Group orders by columns
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const deliveredOrders = orders.filter((o) => o.status === "delivered_by_staff");
  const confirmedOrders = orders.filter((o) => o.status === "confirmed" || o.status === "cancelled");

  return (
    <div className="space-y-6" onClick={initAudio}>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950/60 p-6 rounded-2xl border border-white/5">
        <div>
          <h1 className="text-xl font-bold font-outfit text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary-400" />
            Comandas y Pedidos en Vivo
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Gestiona los despachos de bebidas y comida de las mesas en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Sound Toggle */}
          <button
            onClick={() => {
              initAudio();
              setSoundEnabled(!soundEnabled);
            }}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              soundEnabled
                ? "bg-primary-500/10 border-primary-500/20 text-primary-400 hover:bg-primary-500/20"
                : "bg-zinc-800/40 border-white/5 text-zinc-500 hover:bg-zinc-800/60"
            }`}
            title={soundEnabled ? "Desactivar Sonido" : "Activar Sonido"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Club Dropdown Selector */}
          {clubs.length > 1 && (
            <select
              value={selectedClubId}
              onChange={(e) => setSelectedClubId(e.target.value)}
              className="bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50 flex-grow sm:flex-grow-0"
            >
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary-400 mx-auto" />
          <p className="text-sm text-zinc-400 font-medium">Cargando comandas activas...</p>
        </div>
      ) : (
        /* Kanban Columns Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Column 1: Pendientes */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-widest pl-1.5 border-l-2 border-yellow-400 flex justify-between items-center bg-yellow-400/5 py-1.5 pr-2.5 rounded-r-lg">
              <span>📥 Pendientes</span>
              <span className="bg-yellow-400/20 text-yellow-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {pendingOrders.length}
              </span>
            </h3>

            <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
              <AnimatePresence mode="popLayout">
                {pendingOrders.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 text-center py-6 italic">Sin comandas pendientes</p>
                ) : (
                  pendingOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAction={(status) => handleUpdateStatus(order.id, status)}
                      actionBtn={{ label: "Preparar", status: "preparing", icon: <Play className="w-3 h-3" /> }}
                      isPending={isPending}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Column 2: Preparando */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-primary-400 uppercase tracking-widest pl-1.5 border-l-2 border-primary-500 flex justify-between items-center bg-primary-500/5 py-1.5 pr-2.5 rounded-r-lg">
              <span>🍹 Preparando</span>
              <span className="bg-primary-500/20 text-primary-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {preparingOrders.length}
              </span>
            </h3>

            <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
              <AnimatePresence mode="popLayout">
                {preparingOrders.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 text-center py-6 italic">Sin comandas en preparación</p>
                ) : (
                  preparingOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAction={(status) => handleUpdateStatus(order.id, status)}
                      actionBtn={{ label: "Entregar", status: "delivered_by_staff", icon: <Check className="w-3 h-3" /> }}
                      isPending={isPending}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Column 3: Entregados */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest pl-1.5 border-l-2 border-emerald-500 flex justify-between items-center bg-emerald-500/5 py-1.5 pr-2.5 rounded-r-lg">
              <span>🔔 Entregados</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {deliveredOrders.length}
              </span>
            </h3>

            <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
              <AnimatePresence mode="popLayout">
                {deliveredOrders.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 text-center py-6 italic">Sin comandas entregadas</p>
                ) : (
                  deliveredOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAction={() => {}} // No action, client must confirm receipt
                      isPending={isPending}
                      subtitle="Esperando confirmación del cliente en mesa"
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Column 4: Historial / Confirmados */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1.5 border-l-2 border-zinc-500 flex justify-between items-center bg-zinc-500/5 py-1.5 pr-2.5 rounded-r-lg">
              <span>✅ Confirmados</span>
              <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {confirmedOrders.length}
              </span>
            </h3>

            <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
              <AnimatePresence mode="popLayout">
                {confirmedOrders.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 text-center py-6 italic">Sin historial en esta sesión</p>
                ) : (
                  confirmedOrders.slice(0, 10).map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAction={() => {}}
                      isPending={isPending}
                      isArchived={true}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Internal Kanban Card Component */
interface OrderCardProps {
  order: Order;
  onAction: (newStatus: string) => void;
  actionBtn?: {
    label: string;
    status: string;
    icon: React.ReactNode;
  };
  isPending: boolean;
  isArchived?: boolean;
  subtitle?: string;
}

function OrderCard({ order, onAction, actionBtn, isPending, isArchived = false, subtitle }: OrderCardProps) {
  const orderTime = new Date(order.created_at).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const cardBorderColor =
    order.status === "pending"
      ? "border-yellow-500/20 hover:border-yellow-500/35"
      : order.status === "preparing"
      ? "border-primary-500/20 hover:border-primary-500/35 shadow-[0_0_15px_rgba(217,70,239,0.03)]"
      : order.status === "delivered_by_staff"
      ? "border-emerald-500/20 hover:border-emerald-500/35"
      : order.status === "confirmed"
      ? "border-white/5 opacity-70"
      : "border-red-500/10 opacity-60";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", damping: 20, stiffness: 250 }}
      className={`glass-card p-4 bg-zinc-950/40 border rounded-2xl flex flex-col justify-between gap-3 ${cardBorderColor}`}
    >
      <div className="space-y-2">
        {/* Card Header */}
        <div className="flex justify-between items-start gap-2">
          <div>
            <p className="text-xs font-bold text-white font-outfit">
              Mesa {order.live_sessions?.club_tables?.table_number || "S/M"}
            </p>
            <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
              <User className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
              <span className="truncate max-w-[100px]">
                {order.live_sessions?.profiles?.full_name || "Cliente"}
              </span>
            </p>
          </div>
          <span className="text-[9px] font-bold text-zinc-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
            {orderTime}
          </span>
        </div>

        {/* Order Items list */}
        <div className="space-y-1.5 pt-1">
          {order.live_order_items.map((item) => (
            <div key={item.id} className="flex justify-between items-start text-xs gap-3">
              <span className="text-zinc-300 font-medium min-w-0 truncate">
                {item.club_menu_items?.name || "Desconocido"}
              </span>
              <span className="text-zinc-500 font-bold shrink-0">x{item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Subtitles & Card Footer Action Buttons */}
      {!isArchived && (
        <div className="border-t border-white/5 pt-2.5 flex flex-col gap-2">
          {subtitle && (
            <p className="text-[9px] text-zinc-500 italic text-center py-0.5">{subtitle}</p>
          )}

          <div className="flex gap-2 justify-end">
            {/* Cancel Button */}
            {(order.status === "pending" || order.status === "preparing") && (
              <button
                onClick={() => onAction("cancelled")}
                disabled={isPending}
                className="w-7 h-7 rounded-lg border border-red-500/10 bg-red-500/5 text-red-400 hover:bg-red-500/15 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                title="Cancelar comanda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Action transition button */}
            {actionBtn && (
              <button
                onClick={() => onAction(actionBtn.status)}
                disabled={isPending}
                className="flex-grow bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg py-1 px-3 text-[10px] font-bold transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {actionBtn.icon}
                <span>{actionBtn.label}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {isArchived && (
        <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[10px]">
          <span className="text-zinc-500">ID: {order.id.slice(0, 6).toUpperCase()}</span>
          {order.status === "confirmed" ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" /> Entregado
            </span>
          ) : (
            <span className="text-red-400 font-semibold flex items-center gap-0.5">
              <X className="w-3 h-3" /> Cancelado
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
