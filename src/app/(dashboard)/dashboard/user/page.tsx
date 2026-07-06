import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UserDashboardClient } from "./UserDashboardClient";

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

  // Redirect to onboarding if not completed
  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  // Route security: Ensure user role matches (allow provider/admin to access user dashboard too)
  if (profile.role !== "user" && profile.role !== "provider" && profile.role !== "admin") {
    redirect(`/dashboard/${profile.role}`);
  }

  // 1. Fetch user bookings
  let bookings: any[] = [];
  try {
    const { data } = await supabase
      .from("bookings")
      .select("id, event_date, reservation_date, number_of_people, total_amount, status, notes, club_id, club_slug, event_id, qr_code, qr_status, qr_validated_at, booking_type, created_at, provider_id, service_id, event_name, event_type, end_time, duration, address, location_name, google_maps_url, special_requirements, file_urls")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    bookings = data || [];
  } catch (err) {
    console.error("Error fetching bookings:", err);
  }

  // 2. Fetch all clubs
  let clubs: any[] = [];
  try {
    const { data } = await supabase
      .from("clubs")
      .select("*")
      .order("name", { ascending: true });
    clubs = data || [];
  } catch (err) {
    console.error("Error fetching clubs:", err);
  }

  // 3. Fetch all events
  let events: any[] = [];
  try {
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });
    events = data || [];
  } catch (err) {
    console.error("Error fetching events:", err);
  }

  // 4. Fetch all services
  let services: any[] = [];
  try {
    const { data } = await supabase
      .from("services")
      .select("*")
      .order("title", { ascending: true });
    services = data || [];
  } catch (err) {
    console.error("Error fetching services:", err);
  }

  // 5. Fetch user favorite clubs from Supabase
  let favoriteClubsIds: string[] = [];
  try {
    const { data } = await supabase
      .from("user_favorite_clubs")
      .select("club_id")
      .eq("user_id", user.id);
    favoriteClubsIds = (data || []).map((fav: any) => fav.club_id);
  } catch (err) {
    console.error("Error fetching favorite clubs:", err);
  }

  // 6. Fetch user favorite events from Supabase
  let favoriteEventsIds: string[] = [];
  try {
    const { data } = await supabase
      .from("user_favorite_events")
      .select("event_id")
      .eq("user_id", user.id);
    favoriteEventsIds = (data || []).map((fav: any) => fav.event_id);
  } catch (err) {
    console.error("Error fetching favorite events:", err);
  }

  // 7. Fetch user favorite services from Supabase
  let favoriteServicesIds: string[] = [];
  try {
    const { data } = await supabase
      .from("user_favorite_services")
      .select("service_id")
      .eq("user_id", user.id);
    favoriteServicesIds = (data || []).map((fav: any) => fav.service_id);
  } catch (err) {
    console.error("Error fetching favorite services:", err);
  }

  // 8. Fetch user active presence in Connect
  let presence: any = null;
  try {
    const { data } = await supabase
      .from("connect_presence")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    presence = data;
  } catch (err) {
    console.error("Error fetching presence:", err);
  }

  // 9. Fetch active chat count
  let chatCount = 0;
  try {
    const { count } = await supabase
      .from("connect_chats")
      .select("id", { count: "exact", head: true })
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);
    chatCount = count || 0;
  } catch (err) {
    console.error("Error fetching chat count:", err);
  }

  // 10. Fetch pending connection requests count
  let pendingRequestCount = 0;
  try {
    const { count } = await supabase
      .from("connect_requests")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("status", "pending");
    pendingRequestCount = count || 0;
  } catch (err) {
    console.error("Error fetching pending requests count:", err);
  }

  return (
    <UserDashboardClient
      profile={profile}
      userEmail={user.email || ""}
      bookings={bookings}
      clubs={clubs}
      events={events}
      services={services}
      initialFavoriteClubs={favoriteClubsIds}
      initialFavoriteEvents={favoriteEventsIds}
      initialFavoriteServices={favoriteServicesIds}
      presence={presence}
      chatCount={chatCount}
      pendingRequestCount={pendingRequestCount}
    />
  );
}
