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
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { confirmLiveOrderItemReceipt } from "@/app/services/liveActions";

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
  
  const [isPending, startTransition] = useTransition();

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
        .select("id, status, total_amount, created_at, club_tables(table_number)")
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
                    ${session.total_amount.toLocaleString("es-CO")} COP
                  </p>
                </div>
              </div>
            </div>

            {/* List of Orders */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pl-1 border-l-2 border-primary-500">
                <Receipt className="w-4 h-4 text-primary-400" />
                Historial de Pedidos de la Noche ({orders.length})
              </h3>

              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="text-center py-12 border border-white/5 bg-black/20 rounded-2xl">
                    <HelpCircle className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                    <p className="text-xs text-zinc-500">No hay comandas registradas en esta sesión aún.</p>
                  </div>
                ) : (
                  orders.map((order) => {
                    const statusConfig = {
                      pending: {
                        label: "Enviado a Barra",
                        classes: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
                        description: "El personal está asignando tu comanda en barra.",
                      },
                      preparing: {
                        label: "Preparando",
                        classes: "bg-primary-500/10 border-primary-500/20 text-primary-400 animate-pulse",
                        description: "Tu bebida/comida se está preparando en la barra.",
                      },
                      delivered_by_staff: {
                        label: "Entregado en Mesa",
                        classes: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 animate-pulse font-bold",
                        description: "El personal ya entregó el pedido. Por favor confirma la recepción.",
                      },
                      confirmed: {
                        label: "Confirmado y Cargado",
                        classes: "bg-zinc-800 border-zinc-700 text-zinc-400",
                        description: "Pedido recibido correctamente y sumado al acumulado.",
                      },
                      cancelled: {
                        label: "Cancelado",
                        classes: "bg-red-500/10 border-red-500/20 text-red-400",
                        description: "Este pedido fue cancelado por el staff.",
                      },
                    };

                    const cfg = statusConfig[order.status] || statusConfig.pending;
                    const orderDate = new Date(order.created_at).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={order.id}
                        className="glass-card p-5 bg-zinc-950/30 border border-white/5 hover:border-white/10 transition-all rounded-2xl space-y-4"
                      >
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white font-outfit">
                              Comanda #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span className="text-[10px] text-zinc-500">• {orderDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full border ${cfg.classes}`}>
                              {cfg.label}
                            </span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-3.5">
                          {order.live_order_items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-lg border border-white/5 bg-zinc-900 overflow-hidden shrink-0">
                                  {item.club_menu_items?.image_url ? (
                                    <img
                                      src={item.club_menu_items.image_url}
                                      alt={item.club_menu_items.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700">
                                      <Wine className="w-5 h-5" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h5 className="font-bold text-white text-xs truncate">
                                    {item.club_menu_items?.name || "Producto desconocido"}
                                  </h5>
                                  <p className="text-[10px] text-zinc-500 mt-0.5">
                                    ${item.price_at_order.toLocaleString("es-CO")} COP x {item.quantity}
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs font-extrabold text-zinc-300">
                                ${(item.price_at_order * item.quantity).toLocaleString("es-CO")} COP
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Status Description / Receipt Confirm Action */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-white/5 bg-white/[0.01] p-3 rounded-xl">
                          <p className="text-[10px] text-zinc-400 leading-relaxed max-w-sm">
                            {cfg.description}
                          </p>

                          {order.status === "delivered_by_staff" && (
                            <button
                              onClick={() => handleConfirmReceipt(order.id)}
                              disabled={isPending}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
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
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
