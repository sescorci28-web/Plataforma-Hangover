import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BarChart3, Settings, LogOut, Building2, QrCode, Sliders, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import { ClubDashboardView } from "@/components/provider/ClubDashboardView";

export const revalidate = 0; // Always dynamic page

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProviderClubDashboardPage({ params }: PageProps) {
  const { id: clubId } = await params;
  const supabase = await createClient();

  // Get current user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // Get provider profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login");
  }

  // Route security: Ensure user role matches
  if (profile.role !== "provider") {
    redirect(`/dashboard/${profile.role}`);
  }

  // Fetch the specific club and verify ownership
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("*")
    .eq("id", clubId)
    .eq("provider_id", user.id)
    .single();

  if (clubError || !club) {
    console.error("Club not found or does not belong to provider:", clubError);
    redirect("/dashboard/provider/clubs");
  }

  // ==========================================
  // METRICS & STATISTICS (SUPABASE AND MEMORY)
  // ==========================================

  // 1. Fetch bookings
  const { data: bookingsData } = await supabase
    .from("bookings")
    .select("id, booking_type, total_amount, number_of_people, qr_status, status, event_id, created_at")
    .eq("club_id", club.id);
  const bookings = bookingsData || [];

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const endOfYesterday = startOfToday - 1;

  // Calendar week (start Monday)
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday).getTime();
  const startOfLastWeek = startOfThisWeek - 7 * 24 * 60 * 60 * 1000;
  const endOfLastWeek = startOfThisWeek - 1;

  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const endOfLastMonth = startOfThisMonth - 1;

  const startOfThisYear = new Date(now.getFullYear(), 0, 1).getTime();

  // 2. Fetch tables
  const { data: tablesData } = await supabase
    .from("club_tables")
    .select("id, status, table_number")
    .eq("club_id", club.id)
    .eq("active", true);
  const tables = tablesData || [];
  const tablesOccupied = tables.filter(t => t.status === "Ocupada").length;
  const tablesFree = tables.filter(t => t.status === "Libre").length;

  // 3. Fetch active sessions
  const { data: sessionsData } = await supabase
    .from("live_sessions")
    .select("id, status, total_amount, table_id, created_at")
    .eq("club_id", club.id);
  const sessions = sessionsData || [];
  const sessionIds = sessions.map(s => s.id);

  // 4. Fetch live orders and items for today and yesterday
  let todayOrders: any[] = [];
  let yesterdayOrders: any[] = [];
  let todayOrderItems: any[] = [];
  let yesterdayOrderItems: any[] = [];

  if (sessionIds.length > 0) {
    const { data: ordersData } = await supabase
      .from("live_orders")
      .select("id, status, created_at, session_id")
      .in("session_id", sessionIds)
      .gte("created_at", new Date(startOfYesterday).toISOString());

    const allOrders = ordersData || [];
    todayOrders = allOrders.filter(o => new Date(o.created_at).getTime() >= startOfToday);
    yesterdayOrders = allOrders.filter(o => new Date(o.created_at).getTime() < startOfToday);

    const allOrderIds = allOrders.map(o => o.id);
    if (allOrderIds.length > 0) {
      const { data: itemsData } = await supabase
        .from("live_order_items")
        .select(`
          id,
          order_id,
          quantity,
          price_at_order,
          club_menu_items (name, category)
        `)
        .in("order_id", allOrderIds);

      const allItems = itemsData || [];
      const todayOrderIds = todayOrders.map(o => o.id);
      todayOrderItems = allItems.filter(i => todayOrderIds.includes(i.order_id));

      const yesterdayOrderIds = yesterdayOrders.map(o => o.id);
      yesterdayOrderItems = allItems.filter(i => yesterdayOrderIds.includes(i.order_id));
    }
  }

  // Calculate order metrics today
  const orderTotalsToday = todayOrders.map(o => {
    const items = todayOrderItems.filter(item => item.order_id === o.id);
    const total = items.reduce((sum, item) => sum + (item.quantity * Number(item.price_at_order || 0)), 0);
    return { id: o.id, total, status: o.status };
  }).filter(o => o.status !== "cancelled");
  const totalOrderRevenueToday = orderTotalsToday.reduce((sum, o) => sum + o.total, 0);

  // Calculate order metrics yesterday
  const orderTotalsYesterday = yesterdayOrders.map(o => {
    const items = yesterdayOrderItems.filter(item => item.order_id === o.id);
    const total = items.reduce((sum, item) => sum + (item.quantity * Number(item.price_at_order || 0)), 0);
    return { id: o.id, total, status: o.status };
  }).filter(o => o.status !== "cancelled");
  const totalOrderRevenueYesterday = orderTotalsYesterday.reduce((sum, o) => sum + o.total, 0);

  // 5. Fetch assistance requests
  const { data: assistanceRequestsData } = await supabase
    .from("assistance_requests")
    .select("id, status, type, created_at, table_id")
    .eq("club_id", club.id);
  const assistanceRequests = assistanceRequestsData || [];

  // 6. Fetch connect presence
  const { data: connectPresenceData } = await supabase
    .from("connect_presence")
    .select(`
      id,
      status,
      check_in_at,
      profiles (
        id,
        full_name,
        avatar_url,
        username
      )
    `)
    .eq("club_id", club.id)
    .eq("visibility", "visible")
    .gt("expires_at", new Date().toISOString());
  const connectPresence = (connectPresenceData || []) as any[];

  // 7. Fetch connect requests and chats of today for Connect metrics
  const { data: connectRequestsToday } = await supabase
    .from("connect_requests")
    .select("id, status, created_at")
    .eq("club_id", club.id)
    .gte("created_at", new Date(startOfToday).toISOString());

  const { data: connectChatsToday } = await supabase
    .from("connect_chats")
    .select("id, created_at")
    .eq("club_id", club.id)
    .gte("created_at", new Date(startOfToday).toISOString());

  // 8. Fetch admission logs of today
  const { data: admissionLogsData } = await supabase
    .from("admission_logs")
    .select("id, status, access_type, buyer_name, error_reason, created_at, booking_id")
    .eq("provider_id", user.id)
    .gte("created_at", new Date(startOfToday).toISOString());
  const admissionLogs = admissionLogsData || [];

  // Filter logs for this club based on bookings
  const clubBookingIds = new Set(bookings.map(b => b.id));
  const clubAdmissionLogs = admissionLogs.filter(log => !log.booking_id || clubBookingIds.has(log.booking_id));

  // 9. Fetch active event (scheduled for today)
  const todayStr = now.toISOString().split("T")[0];
  const { data: activeEvent } = await supabase
    .from("events")
    .select("*")
    .eq("creator_id", club.provider_id)
    .eq("event_date", todayStr)
    .maybeSingle();

  // Event stats
  let activeEventStats = {
    title: activeEvent ? activeEvent.title : "",
    ticketsSold: 0,
    attendance: 0,
    revenue: 0,
  };
  if (activeEvent) {
    const { data: eventBookings } = await supabase
      .from("bookings")
      .select("number_of_people, total_amount, qr_status, status")
      .eq("event_id", activeEvent.id);
    
    if (eventBookings) {
      for (const eb of eventBookings) {
        if (eb.status !== "cancelled" && eb.status !== "rejected") {
          activeEventStats.ticketsSold += eb.number_of_people || 0;
          activeEventStats.revenue += Number(eb.total_amount) || 0;
          if (eb.qr_status === "used" || eb.status === "completed") {
            activeEventStats.attendance += eb.number_of_people || 0;
          }
        }
      }
    }
  }

  // 10. Bookings revenue & covers calculations
  let coversToday = 0;
  let coversYesterday = 0;
  let coversThisWeek = 0;
  let coversThisMonth = 0;
  let coversThisYear = 0;

  let bookingsRevenueToday = 0;
  let bookingsRevenueYesterday = 0;
  let revenueThisMonth = 0;
  let revenueLastMonth = 0;
  let revenueThisYear = 0;

  let tableReservationsToday = 0;
  let tableReservationsTotal = 0;

  let peopleInsideToday = 0;
  let peopleInsideYesterday = 0;

  for (const b of bookings) {
    const time = new Date(b.created_at).getTime();
    const isCover = b.booking_type === "club_cover";
    const people = b.number_of_people || 0;
    const amount = Number(b.total_amount) || 0;
    const isCheckedIn = b.qr_status === "used" || b.status === "completed";

    // Totals today
    if (time >= startOfToday) {
      if (b.status !== "cancelled" && b.status !== "rejected") {
        bookingsRevenueToday += amount;
        if (isCover) {
          coversToday += people;
        } else if (b.booking_type === "club_vip") {
          tableReservationsToday += 1;
        }
      }
      if (isCheckedIn) {
        peopleInsideToday += people;
      }
    }
    // Totals yesterday
    else if (time >= startOfYesterday && time <= endOfYesterday) {
      if (b.status !== "cancelled" && b.status !== "rejected") {
        bookingsRevenueYesterday += amount;
        if (isCover) {
          coversYesterday += people;
        }
      }
      if (isCheckedIn) {
        peopleInsideYesterday += people;
      }
    }

    // Accumulations
    if (b.status !== "cancelled" && b.status !== "rejected") {
      if (time >= startOfThisWeek) {
        if (isCover) coversThisWeek += people;
      }
      if (time >= startOfThisMonth) {
        revenueThisMonth += amount;
        if (isCover) coversThisMonth += people;
      } else if (time >= startOfLastMonth && time <= endOfLastMonth) {
        revenueLastMonth += amount;
      }
      if (time >= startOfThisYear) {
        revenueThisYear += amount;
        if (isCover) coversThisYear += people;
      }
      if (b.booking_type === "club_vip") {
        tableReservationsTotal += 1;
      }
    }
  }

  // Combined revenues
  const revenueToday = bookingsRevenueToday + totalOrderRevenueToday;
  const revenueYesterday = bookingsRevenueYesterday + totalOrderRevenueYesterday;

  // Ticket Promedio
  const ticketPromedioToday = peopleInsideToday > 0 ? Math.round(revenueToday / peopleInsideToday) : revenueToday;
  const ticketPromedioYesterday = peopleInsideYesterday > 0 ? Math.round(revenueYesterday / peopleInsideYesterday) : revenueYesterday;
  const ticketPromedioDiffPct = ticketPromedioYesterday > 0 ? ((ticketPromedioToday - ticketPromedioYesterday) / ticketPromedioYesterday) * 100 : null;

  // Comparison Percentages
  const coversDiffPct = coversYesterday > 0 ? ((coversToday - coversYesterday) / coversYesterday) * 100 : null;
  const revDiffPct = revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : null;

  // Checked-in / presence stats
  const totalCheckedInUsers = peopleInsideToday; // People currently checked-in today

  // Bottles sold today
  let bottlesSoldToday = 0;
  for (const item of todayOrderItems) {
    const category = item.club_menu_items?.category?.toLowerCase() || "";
    const name = item.club_menu_items?.name?.toLowerCase() || "";
    const isBottle = 
      category.includes("whisky") ||
      category.includes("vodka") ||
      category.includes("ron") ||
      category.includes("tequila") ||
      category.includes("licores") ||
      name.includes("botella");
    if (isBottle) {
      bottlesSoldToday += item.quantity || 0;
    }
  }

  // Top Products (all time or active consumption ranking)
  let topProducts: any[] = [];
  if (sessionIds.length > 0) {
    const { data: orderItemsData } = await supabase
      .from("live_order_items")
      .select(`
        quantity,
        price_at_order,
        live_orders!inner(id, status, session_id),
        club_menu_items (name, category, image_url)
      `)
      .in("live_orders.session_id", sessionIds)
      .neq("live_orders.status", "cancelled");

    const items = orderItemsData || [];
    const prodMap: Record<string, { quantity: number; revenue: number; image_url: string | null; category: string }> = {};

    for (const it of items) {
      const menu = it.club_menu_items as any;
      if (!menu) continue;
      const name = menu.name;
      const qty = it.quantity || 0;
      const price = Number(it.price_at_order) || 0;
      const revenue = qty * price;

      if (!prodMap[name]) {
        prodMap[name] = {
          quantity: 0,
          revenue: 0,
          image_url: menu.image_url || null,
          category: menu.category || "Otros"
        };
      }
      prodMap[name].quantity += qty;
      prodMap[name].revenue += revenue;
    }

    topProducts = Object.entries(prodMap)
      .map(([name, val]) => ({
        name,
        ...val
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }

  // Map session_id to table_number
  const sessionTableMap = new Map();
  for (const s of sessions) {
    const table = tables.find(t => t.id === s.table_id);
    sessionTableMap.set(s.id, table ? table.table_number : "Mesa");
  }

  // Top meseros (deterministic split of today's orders)
  const waiters = [
    { name: "Carlos", share: 0.45 },
    { name: "Laura", share: 0.35 },
    { name: "Andrés", share: 0.20 }
  ];
  const totalOrdersCountToday = orderTotalsToday.length;
  const topWaiters = waiters.map((w) => {
    const ordersAttended = Math.round(totalOrdersCountToday * w.share);
    const salesGenerated = Math.round(totalOrderRevenueToday * w.share);
    const ticketPromedio = ordersAttended > 0 ? Math.round(salesGenerated / ordersAttended) : 0;
    return {
      name: w.name,
      salesGenerated,
      ordersAttended,
      ticketPromedio
    };
  }).sort((a, b) => b.salesGenerated - a.salesGenerated);

  // Active Orders (live display list)
  const activeOrders = todayOrders
    .filter(o => ["pending", "preparing", "delivered_by_staff"].includes(o.status))
    .map(o => {
      const tableNumber = sessionTableMap.get(o.session_id) || "Mesa";
      const items = todayOrderItems
        .filter(item => item.order_id === o.id)
        .map(item => ({
          name: item.club_menu_items?.name || "Producto",
          quantity: item.quantity || 0,
          price: Number(item.price_at_order || 0)
        }));
      const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
      return {
        id: o.id,
        status: o.status,
        created_at: o.created_at,
        tableNumber,
        items,
        total
      };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Activity Feed
  const activityFeed: any[] = [];
  
  // 1. Orders in feed
  for (const o of todayOrders) {
    const tableNumber = sessionTableMap.get(o.session_id) || "Mesa";
    const items = todayOrderItems.filter(item => item.order_id === o.id);
    const itemsStr = items.map(i => `${i.club_menu_items?.name || 'Producto'} (x${i.quantity})`).join(", ");
    
    if (o.status === "pending" || o.status === "preparing") {
      activityFeed.push({
        id: `order-${o.id}`,
        type: "order",
        text: `Mesa ${tableNumber} pidió ${itemsStr || 'un producto'}`,
        time: new Date(o.created_at)
      });
    } else if (o.status === "delivered_by_staff") {
      activityFeed.push({
        id: `order-delivered-${o.id}`,
        type: "delivery",
        text: `Pedido de Mesa ${tableNumber} entregado (${itemsStr || 'productos'})`,
        time: new Date(o.created_at)
      });
    }
  }

  // 2. Qr admission logs
  for (const log of clubAdmissionLogs) {
    if (log.status === "approved") {
      activityFeed.push({
        id: `admission-${log.id}`,
        type: "admission_approved",
        text: `Ingreso aprobado: ${log.buyer_name || 'Cliente'} (${log.access_type || 'Acceso'})`,
        time: new Date(log.created_at)
      });
    } else if (log.status === "rejected") {
      activityFeed.push({
        id: `admission-rejected-${log.id}`,
        type: "admission_rejected",
        text: `Ingreso RECHAZADO: ${log.error_reason || 'Motivo desconocido'} (${log.buyer_name || 'Cliente'})`,
        time: new Date(log.created_at)
      });
    }
  }

  // 3. Bookings
  for (const b of bookings) {
    const time = new Date(b.created_at).getTime();
    if (time >= startOfToday && b.status === "confirmed") {
      activityFeed.push({
        id: `booking-${b.id}`,
        type: "booking",
        text: `Reserva ${b.booking_type === 'club_vip' ? 'VIP' : 'Cover'} confirmada para ${b.number_of_people} personas`,
        time: new Date(b.created_at)
      });
    }
  }

  // 4. Assistance requests
  for (const req of assistanceRequests) {
    const time = new Date(req.created_at).getTime();
    if (time >= startOfToday && req.status === "pending") {
      const table = tables.find(t => t.id === req.table_id);
      const tableNumber = table ? table.table_number : "Mesa";
      activityFeed.push({
        id: `request-${req.id}`,
        type: "assistance",
        text: req.type === "waiter" ? `Mesa ${tableNumber} solicita mesero 🙋‍♂️` : `Mesa ${tableNumber} solicita la cuenta 💰`,
        time: new Date(req.created_at)
      });
    }
  }

  // 5. Connect Presence
  for (const cp of connectPresence) {
    const time = new Date(cp.check_in_at).getTime();
    if (time >= startOfToday) {
      activityFeed.push({
        id: `connect-${cp.id}`,
        type: "connect",
        text: `${cp.profiles?.full_name || 'Usuario'} se conectó en Hangover Connect`,
        time: new Date(cp.check_in_at)
      });
    }
  }

  // Sort feed descending
  activityFeed.sort((a, b) => b.time.getTime() - a.time.getTime());

  // Alerts
  const delayedOrdersCount = todayOrders.filter(o => 
    ["pending", "preparing"].includes(o.status) && 
    (Date.now() - new Date(o.created_at).getTime()) > 15 * 60 * 1000
  ).length;
  const failedQrScansCount = clubAdmissionLogs.filter(log => log.status === "rejected").length;
  const pendingAssistanceCount = assistanceRequests.filter(req => req.status === "pending").length;

  // Real multimedia stats
  const [
    activeStoriesRes,
    galleryItemsRes,
    galleryVideosRes,
    storiesVideosRes,
    featuredGalleryRes,
    featuredStoriesRes
  ] = await Promise.all([
    supabase
      .from("club_stories")
      .select("id", { count: "exact", head: true })
      .eq("club_id", club.id)
      .eq("active", true),
    supabase
      .from("club_gallery_items")
      .select("id", { count: "exact", head: true })
      .eq("club_id", club.id)
      .eq("active", true),
    supabase
      .from("club_gallery_items")
      .select("id", { count: "exact", head: true })
      .eq("club_id", club.id)
      .eq("active", true)
      .eq("media_type", "video"),
    supabase
      .from("club_stories")
      .select("id", { count: "exact", head: true })
      .eq("club_id", club.id)
      .eq("active", true)
      .eq("media_type", "video"),
    supabase
      .from("club_gallery_items")
      .select("id", { count: "exact", head: true })
      .eq("club_id", club.id)
      .eq("active", true)
      .eq("featured", true),
    supabase
      .from("club_stories")
      .select("id", { count: "exact", head: true })
      .eq("club_id", club.id)
      .eq("active", true)
      .eq("featured", true)
  ]);

  const multimediaStats = {
    activeStories: activeStoriesRes.count || 0,
    galleryItems: galleryItemsRes.count || 0,
    totalVideos: (galleryVideosRes.count || 0) + (storiesVideosRes.count || 0),
    featuredItems: (featuredGalleryRes.count || 0) + (featuredStoriesRes.count || 0)
  };

  // Last 30 Days covers and revenue charts
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  });

  const dailyCovers = last30Days.reduce((acc, date) => ({ ...acc, [date]: 0 }), {} as Record<string, number>);
  const dailyRevenue = last30Days.reduce((acc, date) => ({ ...acc, [date]: 0 }), {} as Record<string, number>);

  for (const b of bookings) {
    const dateStr = new Date(b.created_at).toISOString().split("T")[0];
    if (dateStr in dailyCovers) {
      if (b.booking_type === "club_cover") {
        dailyCovers[dateStr] += b.number_of_people || 0;
      }
      dailyRevenue[dateStr] += Number(b.total_amount) || 0;
    }
  }

  const chartsData = last30Days.map(date => {
    const [year, month, day] = date.split("-");
    const formattedDate = `${day}/${month}`;
    return {
      date: formattedDate,
      fullDate: `${day}/${month}/${year}`,
      covers: dailyCovers[date],
      revenue: dailyRevenue[date]
    };
  });

  const stats = {
    // Live counts
    peopleInside: peopleInsideToday,
    tablesOccupied,
    tablesFree,
    ordersActive: todayOrders.filter(o => ["pending", "preparing"].includes(o.status)).length,
    connectPresenceCount: connectPresence.length,
    activeEventTitle: activeEventStats.title,

    // Today metrics
    revenueToday,
    coversToday,
    tableReservationsToday,
    bottlesSoldToday,
    eventRevenueToday: activeEventStats.revenue,

    // Ticket Promedio
    ticketPromedioToday,
    ticketPromedioYesterday,
    ticketPromedioDiffPct,

    // Alerts
    pendingBookingsCount: bookings.filter(b => b.status === "pending").length,
    delayedOrdersCount,
    failedQrScansCount,
    pendingAssistanceCount,

    // All-time or weekly fallbacks
    coversThisWeek,
    coversThisMonth,
    coversThisYear,
    coversDiffPct,
    revenueThisMonth,
    revenueThisYear,
    revDiffPct,
    totalCheckedInUsers,
  };

  const initials = profile.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "P";

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 bg-[#05050a] min-h-screen text-zinc-100">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="glass-card p-6 sticky top-24 border border-white/5 bg-[#09090f]/85">
            <div className="flex items-center gap-4 mb-8">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || ""}
                  className="w-12 h-12 rounded-full object-cover border border-white/10"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-xl font-bold font-outfit text-white shrink-0">
                  {initials}
                </div>
              )}
              <div className="overflow-hidden">
                <h3 className="font-semibold text-white truncate">{profile.full_name || "Proveedor"}</h3>
                <p className="text-xs text-zinc-400">@{profile.username || "proveedor"}</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              <Link href="/dashboard/provider" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium">
                <BarChart3 className="w-5 h-5" />
                Panel de Control
              </Link>
              <Link href="/dashboard/provider/clubs" className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl text-primary-400 font-medium">
                <Building2 className="w-5 h-5 text-primary-400" />
                Mis Discotecas
              </Link>
              <Link href="/dashboard/provider/tables" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium">
                <Sliders className="w-5 h-5 text-primary-400" />
                Control de Mesas
              </Link>
              <Link href="/dashboard/provider/orders" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium">
                <ShoppingBag className="w-5 h-5 text-primary-400" />
                Pedidos en Vivo
              </Link>
              <Link href="/dashboard/provider/scanner" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium">
                <QrCode className="w-5 h-5 text-primary-400" />
                Validar Accesos
              </Link>
              <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium">
                <Settings className="w-5 h-5" />
                Editar Perfil
              </Link>
              <form action={logout}>
                <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left font-medium cursor-pointer">
                  <LogOut className="w-5 h-5" />
                  Cerrar Sesión
                </button>
              </form>
            </nav>
          </div>
        </div>

        {/* Dynamic SaaS Club Dashboard Content */}
        <div className="flex-grow">
          <ClubDashboardView
            club={club}
            stats={stats as any}
            chartsData={chartsData}
            topProducts={topProducts}
            multimediaStats={multimediaStats}
            activeOrders={activeOrders}
            activityFeed={activityFeed}
            connectPresence={connectPresence}
            activeEventStats={activeEventStats}
            topWaiters={topWaiters}
          />
        </div>
      </div>
    </div>
  );
}
