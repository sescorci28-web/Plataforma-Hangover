import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProviderTabsNavigation } from "@/components/provider/ProviderTabsNavigation";
import { 
  Building2, 
  Calendar, 
  DollarSign, 
  MapPin, 
  QrCode, 
  Plus, 
  User, 
  Settings, 
  LogOut, 
  Sparkles, 
  Camera 
} from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/(auth)/actions";

interface ProviderLayoutProps {
  children: React.ReactNode;
}

export default async function ProviderLayout({ children }: ProviderLayoutProps) {
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

  // Route security: Ensure user role matches provider
  if (profile.role !== "provider") {
    redirect(`/dashboard/${profile.role}`);
  }

  // Fetch counters & earnings in parallel for statistics strip
  let clubsCount = 0;
  let eventsCount = 0;
  let servicesCount = 0;
  let bookingsCount = 0;
  let monthlyEarnings = 0;

  try {
    const [clubsRes, eventsRes, servicesRes, bookingsRes] = await Promise.all([
      supabase.from("clubs").select("id", { count: "exact", head: true }).eq("provider_id", user.id),
      supabase.from("events").select("id", { count: "exact", head: true }).eq("creator_id", user.id),
      supabase.from("services").select("id", { count: "exact", head: true }).eq("provider_id", user.id),
      supabase.from("bookings").select("total_amount, status").eq("provider_id", user.id)
    ]);

    clubsCount = clubsRes.count || 0;
    eventsCount = eventsRes.count || 0;
    servicesCount = servicesRes.count || 0;

    const bookings = bookingsRes.data || [];
    bookingsCount = bookings.length;
    monthlyEarnings = bookings
      .filter((b: any) => b.status === "confirmed" || b.status === "completed")
      .reduce((sum: number, b: any) => sum + Number(b.total_amount || 0), 0);
  } catch (err) {
    console.error("Error calculating provider layout stats:", err);
  }

  const formattedEarnings = new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(monthlyEarnings);

  const initials = profile.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "P";

  const displayUsername = profile.username || profile.full_name?.toLowerCase().replace(/\s+/g, "_") || "proveedor";

  return (
    <div className="min-h-screen bg-[#020205] text-zinc-100 font-sans pb-16">
      {/* 1. Header / Cover section */}
      <div className="container mx-auto px-4 md:px-6 pt-6">
        {/* Cover Photo card */}
        <div className="w-full h-40 md:h-56 rounded-2xl relative overflow-hidden bg-gradient-to-r from-indigo-950 via-purple-950 to-pink-950 border border-white/5 shadow-2xl flex items-end p-4">
          <div className="absolute inset-0 bg-black/20 z-10" />
          {/* Decorative neon light particles */}
          <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-primary-500/20 rounded-full blur-[80px] z-0 animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-pink-500/10 rounded-full blur-[100px] z-0 animate-pulse" />
          
          <button className="absolute top-4 right-4 z-20 bg-black/60 hover:bg-black/80 text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl border border-white/10 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cambiar Portada</span>
          </button>
        </div>

        {/* Profile Identity Overlay */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 px-4 md:px-8 -mt-10 md:-mt-14 relative z-20 mb-6">
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || ""}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-[#020205] bg-zinc-800 shadow-2xl shrink-0"
              />
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-650 flex items-center justify-center text-3xl md:text-4xl font-bold font-outfit text-white shrink-0 border-4 border-[#020205] shadow-2xl">
                {initials}
              </div>
            )}

            <div className="text-left pt-2 md:pt-8">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold font-outfit text-white tracking-tight leading-none">
                  {profile.full_name || "Proveedor"}
                </h1>
                <span className="bg-primary-500/10 text-primary-300 border border-primary-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Verificado
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1.5 flex items-center gap-1.5 flex-wrap">
                <span>@{displayUsername}</span>
                <span className="text-zinc-600">•</span>
                <span className="capitalize text-zinc-300">
                  {profile.provider_type === "club" && "Establecimiento / Club"}
                  {profile.provider_type === "event_organizer" && "Organizador de Eventos"}
                  {profile.provider_type === "service_provider" && "Proveedor de Servicios"}
                </span>
                {profile.city && profile.city !== "No especificada" && (
                  <>
                    <span className="text-zinc-600">•</span>
                    <span className="inline-flex items-center gap-1 text-zinc-400">
                      <MapPin className="w-3 h-3 text-primary-400" />
                      {profile.city}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Global actions row */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-start md:justify-end self-stretch md:self-end pt-2 md:pt-0">
            {/* Scanner QR */}
            {(profile.provider_type === "club" || profile.provider_type === "event_organizer") && (
              <Link 
                href="/dashboard/provider/scanner" 
                className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs shadow-lg shadow-primary-600/15 transform hover:scale-[1.02] active:scale-[0.98] flex-grow sm:flex-grow-0"
              >
                <QrCode className="w-3.5 h-3.5 shrink-0" />
                Validar Accesos
              </Link>
            )}

            {/* Creation Buttons */}
            {profile.provider_type === "service_provider" ? (
              <Link 
                href="/dashboard/provider/new-service" 
                className="bg-zinc-900 border border-white/10 hover:border-primary-500/40 text-zinc-200 hover:text-white px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs flex-grow sm:flex-grow-0"
              >
                <Plus className="w-3.5 h-3.5 text-primary-400" />
                Nuevo Servicio
              </Link>
            ) : (
              <Link 
                href="/dashboard/provider/new-event" 
                className="bg-zinc-900 border border-white/10 hover:border-primary-500/40 text-zinc-200 hover:text-white px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs flex-grow sm:flex-grow-0"
              >
                <Plus className="w-3.5 h-3.5 text-primary-400" />
                Crear Evento
              </Link>
            )}

            {/* Settings */}
            <Link 
              href="/dashboard/profile" 
              className="p-2.5 bg-zinc-900 border border-white/5 hover:border-white/20 text-zinc-400 hover:text-white rounded-xl transition-all"
              title="Configurar Perfil"
            >
              <Settings className="w-4 h-4" />
            </Link>

            {/* Logout */}
            <form action={logout}>
              <button 
                type="submit" 
                className="p-2.5 bg-zinc-900 border border-white/5 hover:border-red-500/20 text-zinc-400 hover:text-red-400 rounded-xl transition-all cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Bio text if exists */}
        {profile.bio && (
          <p className="text-zinc-300 text-sm italic max-w-2xl px-4 md:px-8 mb-6 border-l-2 border-primary-500/40">
            "{profile.bio}"
          </p>
        )}

        {/* Instagram/Social-Style Statistics strip */}
        <div className="flex flex-wrap items-center gap-6 md:gap-10 px-4 md:px-8 py-4 border-t border-white/5 text-sm text-zinc-400 mb-2">
          {profile.provider_type === "club" && (
            <div>
              <strong className="text-white font-bold text-base">{clubsCount}</strong> discotecas
            </div>
          )}
          {profile.provider_type === "event_organizer" && (
            <div>
              <strong className="text-white font-bold text-base">{eventsCount}</strong> eventos
            </div>
          )}
          {profile.provider_type === "service_provider" && (
            <div>
              <strong className="text-white font-bold text-base">{servicesCount}</strong> servicios
            </div>
          )}
          <div>
            <strong className="text-white font-bold text-base">{bookingsCount}</strong> reservas
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <strong className="text-white font-bold text-base">{formattedEarnings} COP</strong> recaudado
          </div>
        </div>
      </div>

      {/* 2. Navigation switcher tabs */}
      <ProviderTabsNavigation providerType={profile.provider_type} />

      {/* 3. Content Area */}
      <main className="container mx-auto px-4 md:px-6 pt-8">
        {children}
      </main>
    </div>
  );
}
