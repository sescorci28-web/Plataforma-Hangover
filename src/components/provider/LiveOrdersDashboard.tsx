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
  TrendingUp,
  Receipt,
  Search,
  Calendar,
  Filter,
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
    id: string;
    user_id: string;
    total_amount: number;
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

/* Internal component for reactive time countdown on active cards */
function ElapsedTime({ createdAt }: { createdAt: string }) {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    const calculateElapsed = () => {
      const created = new Date(createdAt).getTime();
      const now = new Date().getTime();
      const diffMs = now - created;
      setElapsedMinutes(Math.floor(diffMs / 60000));
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [createdAt]);

  let badgeColor = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
  let showWarning = false;

  if (elapsedMinutes >= 9) {
    badgeColor = "bg-red-500/15 border-red-500/30 text-red-400 animate-pulse";
    showWarning = true;
  } else if (elapsedMinutes >= 4) {
    badgeColor = "bg-amber-500/10 border-amber-500/20 text-amber-400";
  }

  return (
    <div className="flex flex-col gap-1 items-end">
      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${badgeColor}`}>
        <Clock className="w-3.5 h-3.5" />
        <span>{elapsedMinutes} min</span>
      </div>
      {showWarning && (
        <span className="text-[9px] font-extrabold text-red-400 bg-red-950/40 border border-red-500/30 px-2 py-0.5 rounded-md uppercase tracking-wider animate-bounce">
          ⚠ PEDIDO ATRASADO
        </span>
      )}
    </div>
  );
}

export function LiveOrdersDashboard({ clubs }: LiveOrdersDashboardProps) {
  const [selectedClubId, setSelectedClubId] = useState<string>(clubs[0]?.id || "");
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State: "kanban" | "history"
  const [activeTab, setActiveTab] = useState<"kanban" | "history">("kanban");

  // Filter States for history
  const [filterTable, setFilterTable] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterDate, setFilterDate] = useState("");

  // Audio state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  const [isPending, startTransition] = useTransition();

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

  const playPremiumChime = () => {
    if (!soundEnabled) return;
    try {
      const ctx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioCtx) setAudioCtx(ctx);

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const freqs = [261.63, 329.63, 392.00, 493.88, 587.33];
      const now = ctx.currentTime;

      freqs.forEach((f, index) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now);
        
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

  const fetchOrdersAndSessions = async () => {
    if (!selectedClubId) return;
    const supabase = createClient();
    try {
      // 1. Fetch Orders
      const { data: ordersData, error: fetchErr } = await supabase
        .from("live_orders")
        .select(`
          id,
          status,
          created_at,
          live_sessions!inner(
            id,
            user_id,
            total_amount,
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
        setOrders(ordersData as any[] || []);
      }

      // 2. Fetch Active open sessions
      const { data: sessionsData, error: sessionsErr } = await supabase
        .from("live_sessions")
        .select("id, total_amount, table_id")
        .eq("club_id", selectedClubId)
        .eq("status", "open");

      if (sessionsErr) {
        console.error("Error fetching sessions:", sessionsErr);
      } else {
        setActiveSessions(sessionsData || []);
      }
    } catch (err: any) {
      console.error("Error in fetchOrdersAndSessions:", err);
      setError("Error inesperado en consulta.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedClubId) return;
    setLoading(true);
    fetchOrdersAndSessions();

    const supabase = createClient();
    const channel = supabase
      .channel(`live-orders-dashboard-realtime-${selectedClubId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_orders" },
        async (payload) => {
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
          fetchOrdersAndSessions();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_sessions" },
        () => {
          fetchOrdersAndSessions();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_order_items" },
        () => {
          fetchOrdersAndSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedClubId, audioCtx]);

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    initAudio();
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, newStatus);
      if (res.error) {
        alert(res.error);
      } else {
        fetchOrdersAndSessions();
      }
    });
  };

  // Group active orders
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const deliveredOrders = orders.filter((o) => o.status === "delivered_by_staff");

  // Calculations for TOP Shift metrics bar
  const confirmedOrders = orders.filter((o) => o.status === "confirmed");
  const salesOfTheNight = confirmedOrders.reduce((sum, o) => {
    return sum + o.live_order_items.reduce((itemSum, item) => {
      return itemSum + Number(item.price_at_order) * item.quantity;
    }, 0);
  }, 0);

  const completedOrdersCount = confirmedOrders.length;
  const ticketAverage = completedOrdersCount > 0 ? salesOfTheNight / completedOrdersCount : 0;
  const activeTablesCount = activeSessions.length;
  const activeOrdersCount = pendingOrders.length + preparingOrders.length + deliveredOrders.length;
  const totalAccumulatedConsumption = activeSessions.reduce((sum, s) => sum + Number(s.total_amount), 0);

  // Filter history list
  const historyList = orders.filter((o) => o.status === "confirmed" || o.status === "cancelled");
  const filteredHistory = historyList.filter((order) => {
    const tableNum = order.live_sessions?.club_tables?.table_number || "";
    const clientName = order.live_sessions?.profiles?.full_name || "";
    const orderStatus = order.status;

    // Filter table
    if (filterTable && !tableNum.toLowerCase().includes(filterTable.toLowerCase())) {
      return false;
    }
    // Filter client
    if (filterClient && !clientName.toLowerCase().includes(filterClient.toLowerCase())) {
      return false;
    }
    // Filter status
    if (filterStatus !== "Todos" && orderStatus !== filterStatus) {
      return false;
    }
    // Filter product name
    if (filterProduct) {
      const hasProduct = order.live_order_items.some((item) =>
        item.club_menu_items?.name?.toLowerCase().includes(filterProduct.toLowerCase())
      );
      if (!hasProduct) return false;
    }
    // Filter date
    if (filterDate) {
      const formattedOrderDate = new Date(order.created_at).toISOString().split("T")[0];
      if (formattedOrderDate !== filterDate) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6" onClick={initAudio}>
      {/* 1. Header Controls */}
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

      {/* 2. Top Metrics Dashboard (Updated in Real Time) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Ventas */}
        <div className="glass-card p-4 border-white/5 bg-zinc-950/40 flex flex-col justify-between">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Ventas Confirmadas</span>
          <span className="text-sm font-black text-emerald-400 mt-2 font-outfit">
            ${salesOfTheNight.toLocaleString("es-CO")} COP
          </span>
        </div>
        {/* Ticket Promedio */}
        <div className="glass-card p-4 border-white/5 bg-zinc-950/40 flex flex-col justify-between">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Ticket Promedio</span>
          <span className="text-sm font-black text-white mt-2 font-outfit">
            ${Math.round(ticketAverage).toLocaleString("es-CO")} COP
          </span>
        </div>
        {/* Mesas Activas */}
        <div className="glass-card p-4 border-white/5 bg-zinc-950/40 flex flex-col justify-between">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Mesas Activas</span>
          <span className="text-base font-black text-primary-400 mt-2 font-outfit">
            {activeTablesCount}
          </span>
        </div>
        {/* Consumo Acumulado */}
        <div className="glass-card p-4 border-white/5 bg-zinc-950/40 flex flex-col justify-between">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Consumo Total Acum.</span>
          <span className="text-sm font-black text-accent-400 mt-2 font-outfit">
            ${totalAccumulatedConsumption.toLocaleString("es-CO")} COP
          </span>
        </div>
        {/* Pedidos Activos */}
        <div className="glass-card p-4 border-white/5 bg-zinc-950/40 flex flex-col justify-between">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Pedidos en Curso</span>
          <span className="text-base font-black text-yellow-400 mt-2 font-outfit">
            {activeOrdersCount}
          </span>
        </div>
        {/* Pedidos Completados */}
        <div className="glass-card p-4 border-white/5 bg-zinc-950/40 flex flex-col justify-between">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Pedidos Entregados</span>
          <span className="text-base font-black text-zinc-400 mt-2 font-outfit">
            {completedOrdersCount}
          </span>
        </div>
      </div>

      {/* 3. Tab Navigation */}
      <div className="flex p-1 bg-black/30 rounded-2xl gap-2 w-full sm:max-w-md">
        <button
          onClick={() => setActiveTab("kanban")}
          className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "kanban"
              ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
        >
          Tablero Activo
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "history"
              ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
        >
          Historial de Pedidos
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary-400 mx-auto" />
          <p className="text-sm text-zinc-400 font-medium">Cargando...</p>
        </div>
      ) : activeTab === "kanban" ? (
        /* 4. Tablero Kanban de 3 columnas */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Pendientes */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-widest pl-2 border-l-2 border-yellow-400 flex justify-between items-center bg-yellow-400/5 py-2 pr-3 rounded-r-lg font-outfit">
              <span>📥 Pendientes</span>
              <span className="bg-yellow-400/20 text-yellow-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {pendingOrders.length}
              </span>
            </h3>

            <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
              <AnimatePresence mode="popLayout">
                {pendingOrders.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 text-center py-8 italic">Sin comandas pendientes</p>
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
            <h3 className="text-xs font-bold text-primary-400 uppercase tracking-widest pl-2 border-l-2 border-primary-500 flex justify-between items-center bg-primary-500/5 py-2 pr-3 rounded-r-lg font-outfit">
              <span>🍹 Preparando</span>
              <span className="bg-primary-500/20 text-primary-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {preparingOrders.length}
              </span>
            </h3>

            <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
              <AnimatePresence mode="popLayout">
                {preparingOrders.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 text-center py-8 italic">Sin comandas en preparación</p>
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
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest pl-2 border-l-2 border-emerald-500 flex justify-between items-center bg-emerald-500/5 py-2 pr-3 rounded-r-lg font-outfit">
              <span>🔔 Entregados en Mesa</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {deliveredOrders.length}
              </span>
            </h3>

            <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
              <AnimatePresence mode="popLayout">
                {deliveredOrders.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 text-center py-8 italic">Sin comandas entregadas</p>
                ) : (
                  deliveredOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAction={() => {}}
                      isPending={isPending}
                      subtitle="Esperando confirmación del cliente en mesa"
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      ) : (
        /* 5. Historial de Pedidos Tab with Advanced Filters */
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="glass-card p-5 bg-zinc-950/40 border border-white/5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <Filter className="w-4 h-4 text-primary-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-outfit">Filtrar Historial</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Filter Table */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Mesa</label>
                <div className="relative">
                  <input
                    type="text"
                    value={filterTable}
                    onChange={(e) => setFilterTable(e.target.value)}
                    placeholder="Ej: 12, VIP-1"
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                  />
                </div>
              </div>

              {/* Filter Client */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Cliente</label>
                <div className="relative">
                  <input
                    type="text"
                    value={filterClient}
                    onChange={(e) => setFilterClient(e.target.value)}
                    placeholder="Nombre del cliente"
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                  />
                </div>
              </div>

              {/* Filter Product */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Producto</label>
                <div className="relative">
                  <input
                    type="text"
                    value={filterProduct}
                    onChange={(e) => setFilterProduct(e.target.value)}
                    placeholder="Ej: Aguardiente"
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                  />
                </div>
              </div>

              {/* Filter Status */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Estado</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                >
                  <option value="Todos">Todos</option>
                  <option value="confirmed">Confirmados</option>
                  <option value="cancelled">Cancelados</option>
                </select>
              </div>

              {/* Filter Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Fecha</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                />
              </div>
            </div>

            {/* Reset Filters button */}
            {(filterTable || filterClient || filterProduct || filterStatus !== "Todos" || filterDate) && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    setFilterTable("");
                    setFilterClient("");
                    setFilterProduct("");
                    setFilterStatus("Todos");
                    setFilterDate("");
                  }}
                  className="text-[11px] font-bold text-primary-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          {/* List of historical items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredHistory.length === 0 ? (
              <div className="col-span-full py-16 text-center border border-white/5 bg-zinc-950/20 rounded-2xl">
                <HelpCircle className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">No hay comandas registradas en el historial con estos filtros.</p>
              </div>
            ) : (
              filteredHistory.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAction={() => {}}
                  isPending={isPending}
                  isArchived={true}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* Internal Kanban Card Component */
interface OrderCardProps {
  order: Order;
  onAction?: (newStatus: string) => void;
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
      ? "border-yellow-500/20 hover:border-yellow-500/40 focus:border-yellow-500/50"
      : order.status === "preparing"
      ? "border-primary-500/20 hover:border-primary-500/40 shadow-[0_0_20px_rgba(217,70,239,0.04)]"
      : order.status === "delivered_by_staff"
      ? "border-emerald-500/20 hover:border-emerald-500/40"
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
      className={`glass-card p-5 bg-zinc-950/40 border rounded-2xl flex flex-col justify-between gap-4 transition-all md:p-6 select-none ${cardBorderColor}`}
    >
      <div className="space-y-3">
        {/* Card Header */}
        <div className="flex justify-between items-start gap-2">
          <div>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Mesa</span>
            <p className="text-base font-black text-white font-outfit mt-0.5">
              {order.live_sessions?.club_tables?.table_number || "S/M"}
            </p>
            <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-1 font-medium">
              <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="truncate max-w-[120px]">
                {order.live_sessions?.profiles?.full_name || "Cliente"}
              </span>
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-[10px] font-bold text-zinc-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
              {orderTime}
            </span>
            {/* Live elapsed timer on active orders */}
            {!isArchived && <ElapsedTime createdAt={order.created_at} />}
          </div>
        </div>

        {/* Order Items list */}
        <div className="space-y-2 bg-black/20 border border-white/5 rounded-xl p-3.5">
          {order.live_order_items.map((item) => (
            <div key={item.id} className="flex justify-between items-start text-xs gap-4">
              <span className="text-zinc-300 font-semibold min-w-0 leading-relaxed">
                {item.club_menu_items?.name || "Desconocido"}
              </span>
              <span className="text-zinc-500 font-extrabold shrink-0 bg-white/5 px-1.5 py-0.2 rounded">
                x{item.quantity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Subtitles & Card Footer Action Buttons */}
      {!isArchived && (
        <div className="border-t border-white/5 pt-3.5 flex flex-col gap-3">
          {subtitle && (
            <p className="text-[10px] text-zinc-500 italic text-center leading-relaxed py-0.5">{subtitle}</p>
          )}

          <div className="flex gap-3 justify-end items-center">
            {/* Cancel Button */}
            {(order.status === "pending" || order.status === "preparing") && onAction && (
              <button
                onClick={() => onAction("cancelled")}
                disabled={isPending}
                className="w-10 h-10 rounded-xl border border-red-500/10 bg-red-500/5 text-red-400 hover:bg-red-500/15 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95"
                title="Cancelar comanda"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Action transition button */}
            {actionBtn && onAction && (
              <button
                onClick={() => onAction(actionBtn.status)}
                disabled={isPending}
                className="flex-grow h-10 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white rounded-xl px-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary-500/10 cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-98"
              >
                {actionBtn.icon}
                <span>{actionBtn.label}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {isArchived && (
        <div className="border-t border-white/5 pt-3 flex items-center justify-between text-xs">
          <span className="text-[10px] text-zinc-500 uppercase font-semibold">ID: #{order.id.slice(0, 6).toUpperCase()}</span>
          {order.status === "confirmed" ? (
            <span className="text-emerald-400 font-extrabold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Confirmado
            </span>
          ) : (
            <span className="text-red-400 font-extrabold flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Cancelado
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
