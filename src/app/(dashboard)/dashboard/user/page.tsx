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

  // 9. Fetch recent chats with last message & partner profile
  let recentChats: any[] = [];
  try {
    const { data: chatsData } = await supabase
      .from("connect_chats")
      .select("id, user_a_id, user_b_id, created_at")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .limit(6);

    if (chatsData) {
      const partnerIds = chatsData.map((c: any) => c.user_a_id === user.id ? c.user_b_id : c.user_a_id);
      
      const { data: partnerProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, role")
        .in("id", partnerIds);

      for (const chat of chatsData) {
        const partnerId = chat.user_a_id === user.id ? chat.user_b_id : chat.user_a_id;
        const partner = partnerProfiles?.find((p: any) => p.id === partnerId);
        
        if (partner) {
          const { data: lastMsg } = await supabase
            .from("connect_messages")
            .select("message_text, created_at, sender_id, is_read")
            .eq("chat_id", chat.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          recentChats.push({
            id: chat.id,
            partner,
            lastMessage: lastMsg?.message_text || "No hay mensajes aún",
            lastMessageTime: lastMsg?.created_at
              ? new Date(lastMsg.created_at).toLocaleTimeString("es-CO", { hour: "numeric", minute: "numeric" })
              : "",
            rawLastMsgTime: lastMsg?.created_at || chat.created_at,
            unreadCount: (lastMsg && !lastMsg.is_read && lastMsg.sender_id !== user.id) ? 1 : 0
          });
        }
      }
    }
    recentChats.sort((a, b) => new Date(b.rawLastMsgTime).getTime() - new Date(a.rawLastMsgTime).getTime());
  } catch (err) {
    console.error("Error fetching recent chats:", err);
  }

  // 10. Fetch user notifications
  let userNotifications: any[] = [];
  try {
    const { data } = await supabase
      .from("user_notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6);
    userNotifications = data || [];
  } catch (err) {
    console.error("Error fetching notifications:", err);
  }

  // 11. Fetch pending connection requests count
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
      chatCount={recentChats.length}
      pendingRequestCount={pendingRequestCount}
      recentChats={recentChats}
      userNotifications={userNotifications}
    />
  );
}
