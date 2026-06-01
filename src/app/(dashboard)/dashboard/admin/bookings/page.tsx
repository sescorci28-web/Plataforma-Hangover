import { requireAdmin } from "@/lib/admin-guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { BookingsList } from "./BookingsList";

export const revalidate = 0;

export default async function AdminBookingsPage() {
  const { supabase, profile } = await requireAdmin();

  // Fetch all bookings and auxiliary data in parallel
  const [
    bookingsRes,
    profilesRes,
    clubsRes,
    eventsRes,
    servicesRes
  ] = await Promise.all([
    supabase.from("bookings").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, username"),
    supabase.from("clubs").select("id, name"),
    supabase.from("events").select("id, title"),
    supabase.from("services").select("id, title")
  ]);

  const profilesMap = new Map(
    (profilesRes.data || []).map((p) => [p.id, { name: p.full_name, username: p.username }])
  );

  const clubsMap = new Map((clubsRes.data || []).map((c) => [c.id, c.name]));
  const eventsMap = new Map((eventsRes.data || []).map((e) => [e.id, e.title]));
  const servicesMap = new Map((servicesRes.data || []).map((s) => [s.id, s.title]));

  // Enrich bookings list with resolved relation details
  const bookingsList = (bookingsRes.data || []).map((b) => {
    const client = profilesMap.get(b.user_id);
    const provider = b.provider_id ? profilesMap.get(b.provider_id) : null;
    const clubName = b.club_id ? clubsMap.get(b.club_id) : null;
    const eventName = b.event_id ? eventsMap.get(b.event_id) : null;
    const serviceName = b.service_id ? servicesMap.get(b.service_id) : null;

    return {
      ...b,
      clientName: client?.name || "Cliente desconocido",
      clientUsername: client?.username || "",
      providerName: provider?.name || "Proveedor desconocido",
      clubName,
      eventName,
      serviceName,
    };
  });

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        <AdminSidebar profile={profile} />

        <div className="flex-grow space-y-8">
          <header>
            <h1 className="text-3xl font-bold font-outfit text-white mb-1">Gestión de Reservas</h1>
            <p className="text-zinc-400">Monitorea y revisa todas las reservas de servicios, eventos y discotecas.</p>
          </header>

          <BookingsList bookings={bookingsList} />
        </div>
      </div>
    </div>
  );
}
