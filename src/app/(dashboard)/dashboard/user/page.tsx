import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Calendar, Clock, Ticket, Heart, CreditCard, ChevronRight, MapPin, User, LogOut, Settings, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import { UserBookingsTabs } from "@/components/dashboard/UserBookingsTabs";

export const revalidate = 0; // Always dynamic

export default async function UserDashboard() {
  const supabase = await createClient();

  // Get current user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login");
  }

  // Route security: Ensure user role matches
  if (profile.role !== "user") {
    redirect(`/dashboard/${profile.role}`);
  }

  const activeProfile = profile;
  const isProfileError = false;

  // Fetch real user bookings with try-catch and enrich them using the club reference
  let bookings: any[] = [];
  let isBookingsError = false;

  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("id, event_date, reservation_date, number_of_people, total_amount, status, notes, club_id, club_slug, qr_code, qr_status, qr_validated_at, booking_type")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      isBookingsError = true;
    } else {
      bookings = data || [];
    }
  } catch (err) {
    isBookingsError = true;
  }

  const clubIds = [...new Set(bookings.map((booking: any) => booking.club_id).filter(Boolean))];
  const clubNames = new Map<string, string>();

  if (clubIds.length > 0) {
    const { data: clubsData } = await supabase
      .from("clubs")
      .select("id, name")
      .in("id", clubIds);

    (clubsData || []).forEach((club: any) => {
      clubNames.set(club.id, club.name);
    });
  }

  const normalizedBookings = bookings.map((booking: any) => ({
    ...booking,
    title: clubNames.get(booking.club_id) || booking.club_slug || "Reserva de discoteca",
    displayDate: booking.reservation_date || booking.event_date,
  }));

  const bookingsCount = normalizedBookings.length;

  // Calculate total spent on completed/confirmed bookings
  const totalSpent = normalizedBookings
    .filter((b: any) => b.status === "confirmed" || b.status === "completed")
    .reduce((sum: number, b: any) => sum + Number(b.total_amount), 0);

  const initials = activeProfile.full_name
    ? activeProfile.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="glass-card p-6 sticky top-24">
            <div className="flex items-center gap-4 mb-8">
              {activeProfile.avatar_url ? (
                <img
                  src={activeProfile.avatar_url}
                  alt={activeProfile.full_name || ""}
                  className="w-12 h-12 rounded-full object-cover border border-white/10"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-xl font-bold font-outfit text-white shrink-0">
                  {initials}
                </div>
              )}
              <div className="overflow-hidden">
                <h3 className="font-semibold text-white truncate">{activeProfile.full_name || "Usuario"}</h3>
                <p className="text-xs text-zinc-400">@{activeProfile.username || "usuario"}</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              <Link href="/dashboard/user" className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl text-primary-400 font-medium">
                <Ticket className="w-5 h-5" />
                Mis Reservas
              </Link>
              <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium">
                <Settings className="w-5 h-5" />
                Editar Perfil
              </Link>
              <Link href="#" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium">
                <Heart className="w-5 h-5" />
                Favoritos
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

        {/* Main Content */}
        <div className="flex-grow space-y-8">
          {/* Recovery/Error Alert Banner if Profile fails to fetch */}
          {isProfileError && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm flex flex-col gap-2">
              <div className="font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Modo de Recuperación (Sin Conexión a Perfil de Base de Datos)</span>
              </div>
              <p className="text-xs text-zinc-300">
                No pudimos obtener tu registro de perfil de Supabase. Esto puede deberse a que el perfil aún no ha sido sincronizado o hay un inconveniente temporal con la base de datos.
                Por favor, intenta actualizar tu perfil manualmente para crearlo.
              </p>
              <div>
                <Link 
                  href="/dashboard/profile" 
                  className="inline-block bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
                >
                  Configurar / Crear mi Perfil ahora
                </Link>
              </div>
            </div>
          )}

          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-outfit mb-2 text-white">Mi Dashboard</h1>
              <p className="text-zinc-400">¡Hola, {activeProfile.full_name}! Bienvenido de vuelta, organiza tu próxima fiesta.</p>
            </div>
            {activeProfile.city && activeProfile.city !== "No especificada" && (
              <div className="flex items-center gap-1.5 text-zinc-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-sm shrink-0">
                <MapPin className="w-4 h-4 text-primary-400" />
                <span>{activeProfile.city}</span>
              </div>
            )}
          </header>

          {/* Profile Card Summary */}
          <div className="glass-card p-6 bg-gradient-to-r from-primary-950/20 to-transparent flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-400">Resumen de Perfil</h3>
              <div className="text-sm text-zinc-300">
                <p><span className="text-zinc-500">Nombre de usuario:</span> @{activeProfile.username}</p>
                <p><span className="text-zinc-500">Correo electrónico:</span> {user.email}</p>
                {activeProfile.phone && <p><span className="text-zinc-500">Teléfono:</span> {activeProfile.phone}</p>}
              </div>
              {activeProfile.bio && (
                <p className="text-sm text-zinc-400 italic mt-2">"{activeProfile.bio}"</p>
              )}
            </div>
            <Link 
              href="/dashboard/profile" 
              className="bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shrink-0 text-sm glow text-center w-full md:w-auto"
            >
              Editar Perfil completo
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-zinc-400 font-medium">Reservas Activas</h4>
                <Calendar className="w-5 h-5 text-primary-400" />
              </div>
              <p className="text-3xl font-bold">{bookingsCount || 2}</p>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-zinc-400 font-medium">Total Solicitudes</h4>
                <Clock className="w-5 h-5 text-accent-400" />
              </div>
              <p className="text-3xl font-bold">{bookingsCount}</p>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-zinc-400 font-medium">Inversión</h4>
                <CreditCard className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-3xl font-bold">${totalSpent || "0.00"}</p>
            </div>
          </div>

          {/* User Bookings tabs showing separate states */}
          <UserBookingsTabs initialBookings={normalizedBookings} />
        </div>
      </div>
    </div>
  );
}
