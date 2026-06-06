"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Wine,
  Clock,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  Loader2,
  Receipt,
  MapPin,
  UtensilsCrossed,
  HelpCircle,
  TrendingUp,
  Bell,
  Coins,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { confirmLiveOrderItemReceipt, requestAssistance } from "@/app/services/liveActions";

interface MenuItem {
  name: string;
  image_url: string | null;
}

interface OrderItem {
  id: string;
  quantity: number;
  price_at_order: number;
  menu_item_id: string;
  club_menu_items: MenuItem;
}

interface Order {
  id: string;
  status: "pending" | "preparing" | "delivered_by_staff" | "confirmed" | "cancelled";
  created_at: string;
  live_order_items: OrderItem[];
}

interface Session {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  table_id: string;
  club_tables: {
    table_number: string;
  };
}

interface Club {
  id: string;
  name: string;
  slug: string;
  banner_image: string | null;
  logo: string | null;
}

export default function MiCuentaPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [club, setClub] = useState<Club | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);
  const [isRequestingBill, setIsRequestingBill] = useState(false);
  const [assistanceStatus, setAssistanceStatus] = useState<string | null>(null);

  const handleCallWaiter = async () => {
    if (!session || !club) return;
    setIsCallingWaiter(true);
    setAssistanceStatus(null);
    try {
      const res = await requestAssistance(club.id, session.table_id, "waiter");
      if (res.error) {
        setAssistanceStatus(`Error: ${res.error}`);
      } else {
        setAssistanceStatus("Llamada enviada al mesero 🛎️");
        setTimeout(() => setAssistanceStatus(null), 3000);
      }
    } catch (err) {
      setAssistanceStatus("Error al solicitar asistencia.");
    } finally {
      setIsCallingWaiter(false);
    }
  };

  const handleRequestBill = async () => {
    if (!session || !club) return;
    setIsRequestingBill(true);
    setAssistanceStatus(null);
    try {
      const res = await requestAssistance(club.id, session.table_id, "bill");
      if (res.error) {
        setAssistanceStatus(`Error: ${res.error}`);
      } else {
        setAssistanceStatus("Solicitud de cuenta enviada 💵");
        setTimeout(() => setAssistanceStatus(null), 3000);
      }
    } catch (err) {
      setAssistanceStatus("Error al solicitar la cuenta.");
    } finally {
      setIsRequestingBill(false);
    }
  };

  const [isPending, startTransition] = useTransition();

  const getStepIndex = (status: string) => {
    switch (status) {
      case "pending": return 0;
      case "preparing": return 1;
      case "delivered_by_staff": return 2;
      default: return 0;
    }
  };

  const fetchSessionAndOrders = async () => {
    const supabase = createClient();
    try {
      // 1. Get authenticated user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      setUser(authUser);

      // 2. Get club
      const { data: clubData, error: clubErr } = await supabase
        .from("clubs")
        .select("id, name, slug, banner_image, logo")
        .eq("slug", slug)
        .single();

      if (clubErr || !clubData) {
        setError("Discoteca no encontrada.");
        setLoading(false);
        return;
      }
      setClub(clubData);

      // 3. Get active open session for this user at this club
      const { data: sessionData, error: sessionErr } = await supabase
        .from("live_sessions")
        .select("id, status, total_amount, created_at, table_id, club_tables(table_number)")
        .eq("club_id", clubData.id)
        .eq("user_id", authUser.id)
        .eq("status", "open")
        .maybeSingle();

      if (sessionErr) {
        console.error("Error fetching session:", sessionErr);
        setError("Error al cargar la cuenta.");
        setLoading(false);
        return;
      }

      if (!sessionData) {
        setSession(null);
        setOrders([]);
        setLoading(false);
        return;
      }

      setSession(sessionData as any);

      // 4. Get orders associated with this session with items and menu item details
      const { data: ordersData, error: ordersErr } = await supabase
        .from("live_orders")
        .select(`
          id,
          status,
          created_at,
          live_order_items(
            id,
            quantity,
            price_at_order,
            menu_item_id,
            club_menu_items(
              name,
              image_url
            )
          )
        `)
        .eq("session_id", sessionData.id)
        .order("created_at", { ascending: false });

      if (ordersErr) {
        console.error("Error fetching orders:", ordersErr);
      } else {
        setOrders(ordersData as any[] || []);
      }
    } catch (err: any) {
      console.error("Error in fetch:", err);
      setError("Error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  // Real-time setup
  useEffect(() => {
    fetchSessionAndOrders();

    const supabase = createClient();
    
    // Subscribe to live_orders and live_order_items updates
    const channel = supabase
      .channel("mi-cuenta-orders-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_orders" },
        () => {
          fetchSessionAndOrders();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_sessions" },
        () => {
          fetchSessionAndOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slug]);

  // Handle client receipt confirmation
  const handleConfirmReceipt = (orderId: string) => {
    startTransition(async () => {
      const res = await confirmLiveOrderItemReceipt(orderId);
      if (res.error) {
        alert(res.error);
      } else {
        fetchSessionAndOrders();
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05050a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary-400 mx-auto" />
          <p className="text-sm text-zinc-400 font-medium">Sincronizando cuenta en vivo...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-[80vh] w-full flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 text-center border-white/5 space-y-6">
          <Wine className="w-12 h-12 text-primary-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Sesión Requerida</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Debes iniciar sesión en Hangover para registrar pedidos en las mesas de la discoteca y hacer seguimiento a tu cuenta.
          </p>
          <Link
            href="/login"
            className="w-full bg-primary-600 hover:bg-primary-500 text-white py-3.5 rounded-xl font-semibold text-xs tracking-wider uppercase transition-all block text-center"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#05050a] text-zinc-100 pb-24 overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary-950/20 rounded-full blur-[130px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-950/20 rounded-full blur-[130px]" />
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10 pt-8 max-w-4xl">
        {/* Back navigation */}
        <div className="mb-6 flex justify-between items-center">
          <Link
            href={`/discotecas/${slug}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Menú
          </Link>
          {club && (
            <h2 className="text-sm font-bold text-zinc-500 font-outfit uppercase tracking-wider">
              {club.name}
            </h2>
          )}
        </div>

        {error ? (
          <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : !session ? (
          /* Blank state: No active session */
          <div className="glass-card p-12 text-center border-white/5 space-y-6 flex flex-col items-center max-w-md mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 mb-2">
              <Receipt className="w-8 h-8 text-primary-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white font-outfit">Sin Cuenta Activa</h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs">
                No tienes ninguna comanda enviada o sesión abierta en este club. Los pedidos que agregues a tu mesa se registrarán aquí al instante.
              </p>
            </div>
            <Link
              href={`/discotecas/${slug}`}
              className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all glow inline-flex items-center gap-1.5"
            >
              <UtensilsCrossed className="w-4 h-4" />
              Ver la Carta
            </Link>
          </div>
        ) : (
          /* Active Account Layout */
          <div className="space-y-6">
            {/* Header / Session Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Table details */}
              <div className="glass-card p-5 border-white/5 flex items-center gap-4 bg-zinc-950/60">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Ubicación</p>
                  <p className="text-sm font-bold text-white font-outfit">
                    Mesa {session.club_tables?.table_number || "No especificada"}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="glass-card p-5 border-white/5 flex items-center gap-4 bg-zinc-950/60">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Sesión</p>
                  <p className="text-sm font-bold text-amber-400 font-outfit uppercase tracking-wider">
                    Abierta / Consumo Activo
                  </p>
                </div>
              </div>

              {/* Total Accumulation */}
              <div className="glass-card p-5 border-primary-500/20 flex items-center gap-4 bg-gradient-to-br from-primary-950/40 via-zinc-950/60 to-zinc-950/60 shadow-[0_0_20px_rgba(217,70,239,0.05)]">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Total Acumulado</p>
                  <p className="text-base font-black text-emerald-400 font-outfit">
                    ${(() => {
                      const calculatedTotal = orders
                        .filter(o => o.status === 'confirmed')
                        .reduce((sum, order) => {
                          return sum + order.live_order_items.reduce((itemSum, item) => {
                            return itemSum + (Number(item.price_at_order) * item.quantity);
                          }, 0);
                        }, 0);
                      
                      return (calculatedTotal || session.total_amount).toLocaleString("es-CO");
                    })()} COP
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions / Assistance Calling */}
            <div className="glass-card p-5 border-white/5 bg-zinc-950/40 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-left w-full sm:w-auto">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-outfit">
                  🛎️ Asistencia en Mesa
                </h4>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  ¿Necesitas ayuda del personal o estás listo para pagar? Presiona un botón.
                </p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={handleCallWaiter}
                  disabled={isCallingWaiter || isRequestingBill}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5 hover:border-white/10 py-3 px-6 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCallingWaiter ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Bell className="w-4 h-4 text-amber-400" />
                  )}
                  Llamar Mesero
                </button>
                <button
                  onClick={handleRequestBill}
                  disabled={isCallingWaiter || isRequestingBill}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5 hover:border-white/10 py-3 px-6 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {isRequestingBill ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Coins className="w-4 h-4 text-emerald-400" />
                  )}
                  Pedir Cuenta
                </button>
              </div>
            </div>

            {assistanceStatus && (
              <div className="bg-primary-950/80 border border-primary-500/30 text-primary-300 rounded-xl px-4 py-2.5 text-xs font-semibold text-center animate-pulse">
                {assistanceStatus}
              </div>
            )}

            {/* List of Orders */}
            <div className="space-y-8">
              {(() => {
                const activeOrders = orders.filter(
                  (o) => o.status !== "confirmed" && o.status !== "cancelled"
                );
                const pastOrders = orders.filter(
                  (o) => o.status === "confirmed" || o.status === "cancelled"
                );

                return (
                  <>
                    {/* Active Orders Section with Stepper */}
                    {activeOrders.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pl-1 border-l-2 border-primary-500 font-outfit">
                          <TrendingUp className="w-4 h-4 text-primary-400 animate-pulse shrink-0" />
                          Pedidos en Curso ({activeOrders.length})
                        </h3>

                        <div className="space-y-5">
                          {activeOrders.map((order) => {
                            const currentIndex = getStepIndex(order.status);
                            const orderDate = new Date(order.created_at).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            });

                            return (
                              <div
                                key={order.id}
                                className="glass-card p-6 bg-gradient-to-br from-zinc-950/80 via-zinc-950/50 to-zinc-950/80 border border-white/10 rounded-2xl space-y-6 shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
                              >
                                {/* Active Order Header */}
                                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                  <div>
                                    <span className="text-xs font-bold text-white font-outfit">
                                      Comanda #{order.id.slice(0, 8).toUpperCase()}
                                    </span>
                                    <span className="text-[10px] text-zinc-500 ml-2">• {orderDate}</span>
                                  </div>
                                  <span className="text-[10px] text-primary-400 font-bold bg-primary-500/10 border border-primary-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    {order.status === "pending"
                                      ? "En Cola"
                                      : order.status === "preparing"
                                      ? "En Barra"
                                      : "En Mesa"}
                                  </span>
                                </div>

                                {/* Active Order Stepper */}
                                <div className="relative py-4 px-2">
                                  {/* Line Background */}
                                  <div className="absolute top-[28px] left-[10%] right-[10%] h-[2px] bg-zinc-800 rounded-full" />

                                  {/* Line Progress */}
                                  <motion.div
                                    className="absolute top-[28px] left-[10%] h-[2px] bg-gradient-to-r from-primary-500 to-emerald-500 rounded-full origin-left"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(currentIndex / 2) * 80}%` }}
                                    transition={{ duration: 0.6, ease: "easeInOut" }}
                                  />

                                  {/* Nodes */}
                                  <div className="relative flex justify-between">
                                    {[
                                      { label: "Enviado", desc: "Comanda enviada", icon: Receipt },
                                      { label: "Preparando", desc: "En barra", icon: Wine },
                                      { label: "Entregado", desc: "En tu mesa", icon: CheckCircle2 },
                                    ].map((step, idx) => {
                                      const Icon = step.icon;
                                      const isCompleted = currentIndex > idx;
                                      const isActive = currentIndex === idx;

                                      return (
                                        <div key={idx} className="flex flex-col items-center w-24 text-center z-10">
                                          <motion.div
                                            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-350 ${
                                              isCompleted
                                                ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                                : isActive
                                                ? "bg-primary-600 border-primary-400 text-white shadow-[0_0_15px_rgba(217,70,239,0.4)] scale-110"
                                                : "bg-zinc-950 border-zinc-800 text-zinc-500"
                                            }`}
                                            animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                          >
                                            <Icon className="w-4 h-4" />
                                          </motion.div>

                                          <span
                                            className={`text-[10px] font-bold mt-2 font-outfit ${
                                              isActive
                                                ? "text-primary-400"
                                                : isCompleted
                                                ? "text-emerald-400"
                                                : "text-zinc-500"
                                            }`}
                                          >
                                            {step.label}
                                          </span>
                                          <span className="text-[8px] text-zinc-500 mt-0.5 max-w-[80px] hidden sm:block">
                                            {step.desc}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Active Order Items */}
                                <div className="space-y-3 bg-white/[0.02] border border-white/5 rounded-xl p-4">
                                  {order.live_order_items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg border border-white/5 bg-zinc-900 overflow-hidden shrink-0">
                                          {item.club_menu_items?.image_url ? (
                                            <img
                                              src={item.club_menu_items.image_url}
                                              alt={item.club_menu_items.name}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700">
                                              <Wine className="w-4 h-4" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="min-w-0">
                                          <h5 className="font-bold text-white text-[11px] truncate">
                                            {item.club_menu_items?.name || "Producto"}
                                          </h5>
                                          <p className="text-[9px] text-zinc-500 mt-0.5">
                                            ${item.price_at_order.toLocaleString("es-CO")} x {item.quantity}
                                          </p>
                                        </div>
                                      </div>
                                      <span className="text-[11px] font-bold text-zinc-300 font-outfit">
                                        ${(item.price_at_order * item.quantity).toLocaleString("es-CO")} COP
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                {/* Confirmation Section if delivered */}
                                {order.status === "delivered_by_staff" && (
                                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl">
                                    <div className="text-left w-full sm:w-auto">
                                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-outfit">
                                        ¡Pedido en tu mesa!
                                      </p>
                                      <p className="text-[9px] text-zinc-400 mt-0.5">
                                        Por favor confirma la recepción para agregar el total a la cuenta.
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => handleConfirmReceipt(order.id)}
                                      disabled={isPending}
                                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                      {isPending ? (
                                        <>
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          Procesando...
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          Confirmar que Recibí
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Past Orders / History Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pl-1 border-l-2 border-zinc-500 font-outfit">
                        <Receipt className="w-4 h-4 text-zinc-400 shrink-0" />
                        Historial de Consumo ({pastOrders.length})
                      </h3>

                      <div className="space-y-3">
                        {pastOrders.length === 0 ? (
                          <div className="text-center py-10 border border-white/5 bg-black/10 rounded-2xl">
                            <HelpCircle className="w-7 h-7 text-zinc-700 mx-auto mb-2" />
                            <p className="text-xs text-zinc-500">No hay consumos confirmados en esta sesión aún.</p>
                          </div>
                        ) : (
                          pastOrders.map((order) => {
                            const orderDate = new Date(order.created_at).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            });

                            return (
                              <div
                                key={order.id}
                                className="glass-card p-4 bg-zinc-950/20 border border-white/5 rounded-xl space-y-3 opacity-80 hover:opacity-100 transition-opacity"
                              >
                                <div className="flex justify-between items-center pb-2 border-b border-white/5 text-[10px]">
                                  <div>
                                    <span className="font-bold text-zinc-400">
                                      Comanda #{order.id.slice(0, 8).toUpperCase()}
                                    </span>
                                    <span className="text-zinc-600 ml-2">• {orderDate}</span>
                                  </div>
                                  <span
                                    className={`font-bold px-2 py-0.5 rounded-md uppercase tracking-wider text-[8px] ${
                                      order.status === "confirmed"
                                        ? "bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                                        : "bg-red-950/20 border border-red-900/30 text-red-400"
                                    }`}
                                  >
                                    {order.status === "confirmed" ? "Confirmado" : "Cancelado"}
                                  </span>
                                </div>

                                <div className="space-y-2">
                                  {order.live_order_items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between text-xs gap-3">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-6 h-6 rounded border border-white/5 bg-zinc-900 overflow-hidden shrink-0">
                                          {item.club_menu_items?.image_url ? (
                                            <img
                                              src={item.club_menu_items.image_url}
                                              alt={item.club_menu_items.name}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-800">
                                              <Wine className="w-3.5 h-3.5" />
                                            </div>
                                          )}
                                        </div>
                                        <span className="text-zinc-300 truncate max-w-[180px]">
                                          {item.club_menu_items?.name || "Producto"}
                                        </span>
                                        <span className="text-zinc-500 font-bold">x{item.quantity}</span>
                                      </div>
                                      <span className="text-zinc-400 font-bold font-outfit">
                                        ${(item.price_at_order * item.quantity).toLocaleString("es-CO")} COP
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
