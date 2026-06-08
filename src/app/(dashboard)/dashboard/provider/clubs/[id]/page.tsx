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
    .select("booking_type, total_amount, number_of_people, qr_status, status, created_at")
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

  let coversToday = 0;
  let coversYesterday = 0;
  let coversThisWeek = 0;
  let coversThisMonth = 0;
  let coversThisYear = 0;

  let revenueToday = 0;
  let revenueThisMonth = 0;
  let revenueLastMonth = 0;
  let revenueThisYear = 0;

  let checkedInUsersThisWeek = 0;
  let checkedInUsersLastWeek = 0;
  let totalCheckedInUsers = 0;

  for (const b of bookings) {
    const time = new Date(b.created_at).getTime();
    const isCover = b.booking_type === "club_cover";
    const people = b.number_of_people || 0;
    const amount = b.total_amount || 0;
    const isCheckedIn = b.qr_status === "used" || b.status === "completed";

    // Covers
    if (isCover) {
      if (time >= startOfToday) {
        coversToday += people;
      } else if (time >= startOfYesterday && time <= endOfYesterday) {
        coversYesterday += people;
      }

      if (time >= startOfThisWeek) {
        coversThisWeek += people;
      }
      if (time >= startOfThisMonth) {
        coversThisMonth += people;
      }
      if (time >= startOfThisYear) {
        coversThisYear += people;
      }
    }

    // Revenue
    if (time >= startOfToday) {
      revenueToday += amount;
    }
    if (time >= startOfThisMonth) {
      revenueThisMonth += amount;
    } else if (time >= startOfLastMonth && time <= endOfLastMonth) {
      revenueLastMonth += amount;
    }
    if (time >= startOfThisYear) {
      revenueThisYear += amount;
    }

    // Checked-in
    if (isCheckedIn) {
      totalCheckedInUsers += people;
      if (time >= startOfThisWeek) {
        checkedInUsersThisWeek += people;
      } else if (time >= startOfLastWeek && time <= endOfLastWeek) {
        checkedInUsersLastWeek += people;
      }
    }
  }

  // Comparisons (Fase 4)
  const coversDiffPct = coversYesterday > 0 ? ((coversToday - coversYesterday) / coversYesterday) * 100 : null;
  const revDiffPct = revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : null;
  const checkedInDiffPct = checkedInUsersLastWeek > 0 ? ((checkedInUsersThisWeek - checkedInUsersLastWeek) / checkedInUsersLastWeek) * 100 : null;

  // 2. Fetch tables (Fase 5)
  const { data: tablesData } = await supabase
    .from("club_tables")
    .select("id, status")
    .eq("club_id", club.id)
    .eq("active", true);
  const tables = tablesData || [];
  const tablesOccupied = tables.filter(t => t.status === "Ocupada").length;
  const tablesFree = tables.filter(t => t.status === "Libre").length;

  // 3. Fetch assistance requests (Fase 5)
  const { data: requestsData } = await supabase
    .from("assistance_requests")
    .select("id, status")
    .eq("club_id", club.id);
  const requests = requestsData || [];
  const pendingRequests = requests.filter(r => r.status === "pending").length;
  const attendedRequests = requests.filter(r => r.status === "attended").length;

  // 4. Fetch live sessions with orders (Fase 5)
  const { data: sessionsData } = await supabase
    .from("live_sessions")
    .select(`
      id,
      status,
      total_amount,
      live_orders (id, status)
    `)
    .eq("club_id", club.id);
  
  const sessions = sessionsData || [];
  const openSessionsCount = sessions.filter(s => s.status === "open").length;
  const activeSessionsCount = openSessionsCount;

  let ordersPending = 0;
  let ordersPreparing = 0;
  let ordersDelivered = 0;
  let totalOrdersCount = 0;

  for (const sess of sessions) {
    const orders = sess.live_orders || [];
    totalOrdersCount += orders.length;
    for (const o of orders) {
      if (o.status === "pending") ordersPending++;
      else if (o.status === "preparing") ordersPreparing++;
      else if (o.status === "delivered_by_staff" || o.status === "confirmed") ordersDelivered++;
    }
  }

  // Mesas Expensive count (alerts)
  const mesasExpensiveCount = sessions.filter(s => s.status === "open" && (s.total_amount || 0) > 500000).length;

  // 5. Pending VIP Bookings Count (alerts)
  const { count: pendingBookingsCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("club_id", club.id)
    .eq("status", "pending");

  // ==========================================
  // REAL MULTIMEDIA STATS
  // ==========================================
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

  // ==========================================
  // FASE 7 - PRODUCTOS MAS VENDIDOS (LIVE_ORDER_ITEMS)
  // ==========================================
  const sessionIds = sessions.map(s => s.id);
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
      const price = it.price_at_order || 0;
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

  // ==========================================
  // FASE 8 - CHARTS DATA (LAST 30 DAYS)
  // ==========================================
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
      dailyRevenue[dateStr] += b.total_amount || 0;
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
    coversToday,
    coversThisWeek,
    coversThisMonth,
    coversThisYear,
    coversDiffPct,
    revenueToday,
    revenueThisMonth,
    revenueThisYear,
    revDiffPct,
    totalCheckedInUsers,
    checkedInDiffPct,
    totalOrdersCount,
    activeSessionsCount,
    tablesOccupied,
    tablesFree,
    openSessionsCount,
    ordersPending,
    ordersPreparing,
    ordersDelivered,
    pendingRequests,
    attendedRequests,
    pendingBookingsCount: pendingBookingsCount || 0,
    mesasExpensiveCount,
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
            stats={stats}
            chartsData={chartsData}
            topProducts={topProducts}
            multimediaStats={multimediaStats}
          />
        </div>
      </div>
    </div>
  );
}
