import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClubsManager } from "./ClubsManager";

export const revalidate = 0; // Always dynamic page

export default async function ProviderClubsPage() {
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

  // Fetch clubs belonging to this provider
  let clubs = [];
  try {
    const { data, error } = await supabase
      .from("clubs")
      .select("*")
      .eq("provider_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      clubs = data;
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const startOfTodayISO = startOfToday.toISOString();
      const clubIds = clubs.map(c => c.id);
      if (clubIds.length > 0) {
        const { data: bookingsRes } = await supabase
          .from("bookings")
          .select("club_id, total_amount, number_of_people, qr_status, status")
          .in("club_id", clubIds)
          .gte("created_at", startOfTodayISO);
        const bookingsList = bookingsRes || [];
        clubs = clubs.map(c => {
          const clubBookings = bookingsList.filter(b => b.club_id === c.id);
          const todaySales = clubBookings
            .filter(b => b.status !== "cancelled" && b.status !== "rejected")
            .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
          const todayAttendees = clubBookings
            .filter(b => b.qr_status === "used" || b.status === "completed")
            .reduce((sum, b) => sum + (b.number_of_people || 0), 0);
          return {
            ...c,
            todaySales,
            todayAttendees
          };
        });
      }
    }
  } catch (err) {
    console.error("Error loading clubs:", err);
  }

  return <ClubsManager clubs={clubs} />;
}

