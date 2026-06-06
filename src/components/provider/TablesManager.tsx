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
  Plus,
  Sliders,
  DollarSign,
  UserCheck,
  CheckSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  createOrUpdateTable,
  updateTableStatus,
  attendAssistanceRequest,
  closeLiveSession,
} from "@/app/services/liveActions";

interface MenuItem {
  name: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  price_at_order: number;
  club_menu_items: MenuItem;
}

interface LiveOrder {
  id: string;
  status: string;
  live_order_items: OrderItem[];
}

interface LiveSession {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  profiles: {
    full_name: string | null;
  } | null;
  live_orders: LiveOrder[];
}

interface ClubTable {
  id: string;
  table_number: string;
  name: string | null;
  zone: string;
  status: "Libre" | "Ocupada" | "Reservada" | "Cerrada";
  active: boolean;
  live_sessions: LiveSession[];
}

interface AssistanceRequest {
  id: string;
  type: "bill" | "waiter";
  status: "pending" | "attended";
  created_at: string;
  user_id: string | null;
  club_tables: {
    table_number: string;
  };
  profiles: {
    full_name: string | null;
  } | null;
}

interface Club {
  id: string;
  name: string;
  slug: string;
}

interface TablesManagerProps {
  clubs: Club[];
}

const ZONES = ["Todas", "VIP", "General", "Terraza", "Palcos", "Pista", "Bar"];

export function TablesManager({ clubs }: TablesManagerProps) {
  const [selectedClubId, setSelectedClubId] = useState<string>(clubs[0]?.id || "");
  const [tables, setTables] = useState<ClubTable[]>([]);
  const [assistanceRequests, setAssistanceRequests] = useState<AssistanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Zone Filter
  const [selectedZone, setSelectedZone] = useState("Todas");

  // Selected Table for Detail Drawer
  const [selectedTable, setSelectedTable] = useState<ClubTable | null>(null);

  // Sound and Audio state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  // New Table Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTableNum, setNewTableNum] = useState("");
  const [newTableName, setNewTableName] = useState("");
  const [newTableZone, setNewTableZone] = useState("General");
  const [formError, setFormError] = useState<string | null>(null);

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

      // High pitch alert chime: G5, C6 (alert chimes)
      const freqs = [783.99, 1046.50];
      const now = ctx.currentTime;

      freqs.forEach((f, index) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, now + index * 0.1);
        
        gainNode.gain.setValueAtTime(0.0, now + index * 0.1);
        gainNode.gain.linearRampToValueAtTime(0.15, now + index * 0.1 + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.1 + 0.8);

        osc.start(now + index * 0.1);
        osc.stop(now + index * 0.1 + 1.0);
      });
    } catch (err) {
      console.error("Failed to play notification chime:", err);
    }
  };

  const fetchData = async () => {
    if (!selectedClubId) return;
    const supabase = createClient();
    try {
      // 1. Fetch tables with sessions and orders
      const { data: tablesData, error: tablesErr } = await supabase
        .from("club_tables")
        .select(`
          id,
          table_number,
          name,
          zone,
          status,
          active,
          live_sessions(
            id,
            status,
            total_amount,
            created_at,
            profiles(full_name),
            live_orders(
              id,
              status,
              live_order_items(
                id,
                quantity,
                price_at_order,
                club_menu_items(name)
              )
            )
          )
        `)
        .eq("club_id", selectedClubId)
        .eq("active", true)
        .order("table_number", { ascending: true });

      if (tablesErr) {
        console.error("Error fetching tables:", tablesErr);
        setError("Error al consultar mesas.");
      } else {
        // Cast table_number to numeric sort if possible, to avoid lexicographical sorting anomalies (e.g. 1, 10, 2)
        const sortedTables = (tablesData as any[] || []).sort((a, b) => {
          const numA = parseInt(a.table_number, 10);
          const numB = parseInt(b.table_number, 10);
          if (isNaN(numA) || isNaN(numB)) {
            return a.table_number.localeCompare(b.table_number);
          }
          return numA - numB;
        });
        setTables(sortedTables);

        // Keep selected table updated in real-time
        if (selectedTable) {
          const updatedTable = sortedTables.find((t) => t.id === selectedTable.id);
          if (updatedTable) setSelectedTable(updatedTable);
        }
      }

      // 2. Fetch active assistance requests
      const { data: requestsData, error: requestsErr } = await supabase
        .from("assistance_requests")
        .select(`
          id,
          type,
          status,
          created_at,
          user_id,
          club_tables!inner(table_number),
          profiles(full_name)
        `)
        .eq("club_id", selectedClubId)
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (requestsErr) {
        console.error("Error fetching assistance requests:", requestsErr);
      } else {
        setAssistanceRequests(requestsData as any[] || []);
      }
    } catch (err: any) {
      console.error("Error in fetchData:", err);
      setError("Error inesperado al cargar datos de mesas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedClubId) return;
    setLoading(true);
    fetchData();

    const supabase = createClient();
    
    // Subscribe to tables changes
    const tablesChannel = supabase
      .channel(`tables-realtime-channel-${selectedClubId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "club_tables" },
        () => {
          fetchData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_sessions" },
        () => {
          fetchData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_orders" },
        () => {
          fetchData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_order_items" },
        () => {
          fetchData();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "assistance_requests" },
        async (payload) => {
          if (payload.new.club_id === selectedClubId && payload.new.status === "pending") {
            playPremiumChime();
          }
          fetchData();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "assistance_requests" },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tablesChannel);
    };
  }, [selectedClubId, audioCtx]);

  // Handlers
  const handleCreateNewTable = () => {
    if (!newTableNum.trim()) {
      setFormError("Por favor, ingresa el número de mesa.");
      return;
    }
    setFormError(null);
    startTransition(async () => {
      const res = await createOrUpdateTable(
        selectedClubId,
        newTableNum.trim(),
        newTableName.trim() || null,
        newTableZone,
        "Libre"
      );
      if (res.error) {
        setFormError(res.error);
      } else {
        setNewTableNum("");
        setNewTableName("");
        setShowAddForm(false);
        fetchData();
      }
    });
  };

  const handleUpdateTableStatus = (tableId: string, status: string) => {
    startTransition(async () => {
      const res = await updateTableStatus(tableId, status);
      if (res.error) {
        alert(res.error);
      } else {
        fetchData();
      }
    });
  };

  const handleCloseSession = (sessionId: string) => {
    if (!confirm("¿Estás seguro de que deseas cerrar la cuenta de esta mesa? La mesa volverá a estar disponible.")) {
      return;
    }
    startTransition(async () => {
      const res = await closeLiveSession(sessionId);
      if (res.error) {
        alert(res.error);
      } else {
        setSelectedTable(null);
        fetchData();
      }
    });
  };

  const handleAttendRequest = (requestId: string) => {
    startTransition(async () => {
      const res = await attendAssistanceRequest(requestId);
      if (res.error) {
        alert(res.error);
      } else {
        fetchData();
      }
    });
  };

  // Metrics calculations
  const totalTables = tables.length;
  const freeTables = tables.filter((t) => t.status === "Libre").length;
  const occupiedTables = tables.filter((t) => t.status === "Ocupada").length;
  const reservedTables = tables.filter((t) => t.status === "Reservada").length;
  const closedTables = tables.filter((t) => t.status === "Cerrada").length;

  // Filtered tables grid
  const filteredTables = tables.filter((t) => {
    if (selectedZone === "Todas") return true;
    return t.zone === selectedZone;
  });

  return (
    <div className="space-y-6" onClick={initAudio}>
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950/60 p-6 rounded-2xl border border-white/5">
        <div>
          <h1 className="text-xl font-bold font-outfit text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary-400" />
            Control de Mesas
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Supervisa el estado físico de la discoteca, consumos acumulados y gestiona alertas del personal.
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
            title={soundEnabled ? "Desactivar Sonido Alertas" : "Activar Sonido Alertas"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Add Table Button */}
          <button
            onClick={() => {
              initAudio();
              setShowAddForm(true);
            }}
            className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white rounded-xl py-2.5 px-4 text-xs font-bold transition-all shadow-md shadow-primary-500/15 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Mesa</span>
          </button>

          {/* Club Dropdown */}
          {clubs.length > 1 && (
            <select
              value={selectedClubId}
              onChange={(e) => setSelectedClubId(e.target.value)}
              className="bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50"
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

      {/* 2. Real-time Floating Alerts Bar for calling Waiter / requesting Bill */}
      {assistanceRequests.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/25 p-5 rounded-2xl space-y-3 shadow-[0_0_20px_rgba(239,68,68,0.05)]">
          <div className="flex items-center gap-2 text-red-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
            <h3 className="text-xs font-black uppercase tracking-wider font-outfit">
              ⚠️ Alertas de Asistencia Activas ({assistanceRequests.length})
            </h3>
          </div>

          <div className="flex flex-col gap-2.5">
            {assistanceRequests.map((req) => {
              const reqTime = new Date(req.created_at).toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={req.id}
                  className="bg-zinc-950/90 border border-white/5 rounded-xl p-3.5 flex items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                        req.type === "bill"
                          ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400"
                          : "bg-amber-500/10 border border-amber-500/25 text-amber-400"
                      }`}
                    >
                      {req.type === "bill" ? "💵" : "🛎️"}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">
                        Mesa {req.club_tables?.table_number} solicita{" "}
                        {req.type === "bill" ? "la cuenta" : "asistencia de mesero"}
                      </p>
                      <p className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5 font-medium">
                        <span>{req.profiles?.full_name || "Cliente"}</span>
                        <span>•</span>
                        <span>{reqTime}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAttendRequest(req.id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3 py-1.5 text-[10px] font-black tracking-wider uppercase flex items-center gap-1 shadow transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Atendido</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. State Metrics Summary Box */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Mesas */}
        <div className="glass-card p-5 border-white/5 bg-zinc-950/40 flex flex-col justify-between">
          <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Total Mesas</span>
          <span className="text-2xl font-black text-white mt-2 font-outfit">{totalTables}</span>
        </div>
        {/* Libres */}
        <div className="glass-card p-5 border-white/5 bg-zinc-950/40 flex flex-col justify-between">
          <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Mesas Libres</span>
          <span className="text-2xl font-black text-emerald-400 mt-2 font-outfit">{freeTables}</span>
        </div>
        {/* Ocupadas */}
        <div className="glass-card p-5 border-white/5 bg-zinc-950/40 flex flex-col justify-between">
          <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Mesas Ocupadas</span>
          <span className="text-2xl font-black text-primary-400 mt-2 font-outfit">{occupiedTables}</span>
        </div>
        {/* Reservadas */}
        <div className="glass-card p-5 border-white/5 bg-zinc-950/40 flex flex-col justify-between">
          <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Mesas Reservadas</span>
          <span className="text-2xl font-black text-amber-400 mt-2 font-outfit">{reservedTables}</span>
        </div>
        {/* Cerradas */}
        <div className="glass-card p-5 border-white/5 bg-zinc-950/40 flex flex-col justify-between">
          <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Mesas Cerradas</span>
          <span className="text-2xl font-black text-zinc-400 mt-2 font-outfit">{closedTables}</span>
        </div>
      </div>

      {/* 4. Zonal Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/5 scrollbar-hide">
        {ZONES.map((zone) => {
          const count = zone === "Todas" ? tables.length : tables.filter((t) => t.zone === zone).length;
          const isActive = selectedZone === zone;
          return (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`relative px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-primary-600 to-accent-600 text-white border-primary-500 shadow-md shadow-primary-500/10"
                  : "bg-white/5 text-zinc-400 border-white/5 hover:text-zinc-200 hover:bg-white/10"
              }`}
            >
              <span>{zone}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-white/5 text-zinc-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 5. Tables Grid (iPad/Tablet Friendly) */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-400 mx-auto" />
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="text-center py-16 border border-white/5 bg-zinc-950/20 rounded-2xl">
          <Wine className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
          <p className="text-xs text-zinc-500">No hay mesas en esta zona aún.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredTables.map((table) => {
            const activeSession = table.live_sessions.find((s) => s.status === "open");
            const totalAccum = activeSession ? activeSession.total_amount : 0;
            const ordersCount = activeSession
              ? activeSession.live_orders.filter((o) => o.status !== "cancelled").length
              : 0;

            const openTime = activeSession
              ? new Date(activeSession.created_at).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : null;

            // Status Styling
            let statusColor = "text-zinc-400 bg-zinc-500/10 border-zinc-500/10";
            if (table.status === "Ocupada") {
              statusColor = "text-primary-400 bg-primary-500/10 border-primary-500/15";
            } else if (table.status === "Reservada") {
              statusColor = "text-amber-400 bg-amber-500/10 border-amber-500/15";
            } else if (table.status === "Libre") {
              statusColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/15";
            } else if (table.status === "Cerrada") {
              statusColor = "text-zinc-500 bg-zinc-950 border-white/5";
            }

            return (
              <motion.div
                layout
                key={table.id}
                onClick={() => setSelectedTable(table)}
                className={`glass-card p-5 bg-zinc-950/40 border border-white/5 hover:border-white/10 rounded-2xl flex flex-col justify-between gap-4 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all relative ${
                  table.status === "Ocupada" ? "shadow-[0_0_15px_rgba(217,70,239,0.02)]" : ""
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Mesa</p>
                      <h4 className="text-lg font-black text-white font-outfit mt-0.5">
                        {table.table_number} {table.name && <span className="text-xs font-semibold text-zinc-400 font-sans">({table.name})</span>}
                      </h4>
                      <p className="text-[9px] font-bold text-zinc-400 mt-1 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-full inline-block">
                        {table.zone}
                      </p>
                    </div>

                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${statusColor}`}>
                      {table.status}
                    </span>
                  </div>

                  {activeSession && (
                    <div className="mt-4 pt-3.5 border-t border-white/5 space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-500">Cliente:</span>
                        <span className="text-white font-semibold truncate max-w-[120px]">
                          {activeSession.profiles?.full_name || "Cliente"}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-500">Pedidos:</span>
                        <span className="text-white font-semibold">{ordersCount}</span>
                      </div>
                      {openTime && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-zinc-500">Apertura:</span>
                          <span className="text-zinc-400">{openTime}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-white/5 pt-3.5 flex justify-between items-center">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Consumo</span>
                  <span className="text-xs font-black text-emerald-400 font-outfit">
                    ${totalAccum.toLocaleString("es-CO")} COP
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 6. Form Overlay Modal to Add Table */}
      <AnimatePresence>
        {showAddForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(false)}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto z-50 w-full max-w-md h-fit bg-zinc-950 border border-white/10 p-6 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.85)] space-y-5"
            >
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h3 className="text-base font-bold text-white font-outfit">Agregar Nueva Mesa</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/5 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Número de Mesa *</label>
                  <input
                    type="text"
                    value={newTableNum}
                    onChange={(e) => setNewTableNum(e.target.value)}
                    placeholder="Ej. 12, 101, VIP-4"
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                  />
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Nombre Opcional</label>
                  <input
                    type="text"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    placeholder="Ej. Mesa Principal VIP"
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                  />
                </div>

                {/* Zone */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Zona *</label>
                  <select
                    value={newTableZone}
                    onChange={(e) => setNewTableZone(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                  >
                    {ZONES.slice(1).map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-white/5">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateNewTable}
                  disabled={isPending}
                  className="bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white rounded-xl px-5 py-2.5 text-xs font-black cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Registrando..." : "Guardar Mesa"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 7. Sliding Right Lateral Drawer for Table Detailed Stats */}
      <AnimatePresence>
        {selectedTable && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTable(null)}
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-zinc-950 border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.85)] flex flex-col h-full overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/20">
                <div>
                  <h3 className="text-base font-bold text-white font-outfit">
                    Mesa {selectedTable.table_number}
                  </h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Zona: {selectedTable.zone} {selectedTable.name && `• ${selectedTable.name}`}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTable(null)}
                  className="w-8 h-8 rounded-full border border-white/5 bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable details */}
              <div className="flex-grow overflow-y-auto p-5 space-y-6">
                {/* 7.1 Manual Table Status Override */}
                <div className="space-y-2.5 bg-white/[0.01] border border-white/5 rounded-xl p-4">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Estado de Mesa</h4>
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedTable.status}
                      onChange={(e) => handleUpdateTableStatus(selectedTable.id, e.target.value)}
                      disabled={isPending}
                      className="bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50 flex-grow"
                    >
                      <option value="Libre">Libre</option>
                      <option value="Ocupada">Ocupada</option>
                      <option value="Reservada">Reservada</option>
                      <option value="Cerrada">Cerrada</option>
                    </select>
                    <span className="text-[10px] text-zinc-500 italic">Forzar manual</span>
                  </div>
                </div>

                {/* Session details */}
                {(() => {
                  const activeSession = selectedTable.live_sessions.find((s) => s.status === "open");
                  
                  if (!activeSession) {
                    return (
                      <div className="text-center py-12 bg-black/20 border border-dashed border-white/5 rounded-xl">
                        <User className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                        <p className="text-xs text-zinc-500">Mesa sin sesión de consumo activa.</p>
                      </div>
                    );
                  }

                  const openTime = new Date(activeSession.created_at).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const openDate = new Date(activeSession.created_at).toLocaleDateString("es-ES");

                  // Map products consumed
                  const productsMap: Record<string, { name: string; qty: number; price: number }> = {};
                  activeSession.live_orders.forEach((order) => {
                    if (order.status === "confirmed") {
                      order.live_order_items.forEach((item) => {
                        const pName = item.club_menu_items?.name || "Producto";
                        if (!productsMap[pName]) {
                          productsMap[pName] = { name: pName, qty: 0, price: Number(item.price_at_order) };
                        }
                        productsMap[pName].qty += item.quantity;
                      });
                    }
                  });
                  const consumedProducts = Object.values(productsMap);

                  return (
                    <div className="space-y-6">
                      {/* Session Metadata Card */}
                      <div className="space-y-3 bg-zinc-900/40 border border-white/5 p-4 rounded-xl">
                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1 border-l-2 border-primary-500">
                          Detalles de Cuenta
                        </h4>

                        <div className="space-y-2 pt-1.5 text-xs text-zinc-300">
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Cliente:</span>
                            <span className="text-white font-bold">{activeSession.profiles?.full_name || "Cliente"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Apertura:</span>
                            <span className="text-zinc-400">{openDate} a las {openTime}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2.5 border-t border-white/5 text-sm">
                            <span className="font-bold text-white">Total Consumo:</span>
                            <span className="text-emerald-400 font-extrabold font-outfit">
                              ${activeSession.total_amount.toLocaleString("es-CO")} COP
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Consumed Products Detailed Summary */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1 border-l-2 border-zinc-500">
                          Resumen de Consumo ({consumedProducts.length})
                        </h4>

                        <div className="space-y-2 bg-black/40 rounded-xl p-3.5 border border-white/5">
                          {consumedProducts.length === 0 ? (
                            <p className="text-[11px] text-zinc-500 italic text-center py-2">Ningún producto consumido/confirmado aún</p>
                          ) : (
                            consumedProducts.map((prod, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs gap-3">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-zinc-500 font-bold shrink-0">x{prod.qty}</span>
                                  <span className="text-zinc-300 truncate font-medium">{prod.name}</span>
                                </div>
                                <span className="text-zinc-400 font-semibold font-outfit shrink-0">
                                  ${(prod.price * prod.qty).toLocaleString("es-CO")} COP
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Orders history list */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1 border-l-2 border-zinc-500">
                          Comandas Enviadas ({activeSession.live_orders.length})
                        </h4>

                        <div className="space-y-2.5">
                          {activeSession.live_orders.map((order) => {
                            let statusBadge = "bg-zinc-800 text-zinc-400";
                            if (order.status === "pending") statusBadge = "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
                            else if (order.status === "preparing") statusBadge = "bg-primary-500/10 text-primary-400 border border-primary-500/20";
                            else if (order.status === "delivered_by_staff") statusBadge = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                            else if (order.status === "confirmed") statusBadge = "bg-zinc-800 text-zinc-400 border border-zinc-700/50";
                            else if (order.status === "cancelled") statusBadge = "bg-red-500/10 text-red-400 border border-red-500/20";

                            return (
                              <div key={order.id} className="p-3 bg-black/20 rounded-xl border border-white/5 space-y-2">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="text-zinc-400 font-bold">Comanda #{order.id.slice(0, 8).toUpperCase()}</span>
                                  <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[8px] ${statusBadge}`}>
                                    {order.status === "pending"
                                      ? "Cola"
                                      : order.status === "preparing"
                                      ? "Barra"
                                      : order.status === "delivered_by_staff"
                                      ? "Entregado"
                                      : order.status === "confirmed"
                                      ? "Confirmado"
                                      : "Cancelado"}
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  {order.live_order_items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center text-[11px] text-zinc-400">
                                      <span className="truncate max-w-[180px]">{item.club_menu_items?.name}</span>
                                      <span>x{item.quantity}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Close Table Account Button */}
                      <button
                        onClick={() => handleCloseSession(activeSession.id)}
                        disabled={isPending}
                        className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-black text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 shadow-md shadow-red-500/10 cursor-pointer disabled:opacity-50"
                      >
                        <CheckSquare className="w-4 h-4" />
                        <span>Cerrar Cuenta y Mesa</span>
                      </button>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
