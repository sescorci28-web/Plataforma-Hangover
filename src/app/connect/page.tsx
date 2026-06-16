import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ConnectView } from "@/components/connect/ConnectView";

export const revalidate = 0; // Dynamic route

export default async function ConnectPage() {
  const supabase = await createClient();

  // 1. Get current authenticated user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // 2. Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login");
  }

  // 3. Query profiles to resolve a list of members/users in connect (simulate list)
  let allProfiles: any[] = [];
  try {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, username, role, city")
      .limit(30);
    allProfiles = data || [];
  } catch (err) {
    console.error("Error fetching profiles list:", err);
  }

  // 4. Query clubs & events for integration
  let clubsList: any[] = [];
  try {
    const { data } = await supabase
      .from("clubs")
      .select("id, name, city, banner_image, logo, rating, cover_price, active")
      .eq("active", true)
      .limit(10);
    clubsList = data || [];
  } catch (err) {
    console.error("Error fetching clubs list for connect:", err);
  }

  let eventsList: any[] = [];
  try {
    const { data } = await supabase
      .from("events")
      .select("id, title, event_date, thumbnail_url, location")
      .limit(10);
    eventsList = data || [];
  } catch (err) {
    console.error("Error fetching events list for connect:", err);
  }

  // 5. Query user completed bookings for strict attendance validation
  let validatedBookings: any[] = [];
  try {
    const { data } = await supabase
      .from("bookings")
      .select("id, event_id, club_id, total_amount, number_of_people, status, qr_status, created_at")
      .eq("user_id", user.id)
      .or("status.eq.completed,qr_status.eq.used");
    validatedBookings = data || [];
  } catch (err) {
    console.error("Error fetching validated bookings:", err);
  }

  // Load connect specific tables with fallbacks
  let userReputation: any = null;
  try {
    const { data } = await supabase
      .from("connect_user_reputation")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    userReputation = data;
  } catch (e) {
    console.warn("Table connect_user_reputation is not initialized yet.");
  }

  let userFollowers: any[] = [];
  let userFollowing: any[] = [];
  try {
    const { data: followsData } = await supabase
      .from("connect_follows")
      .select("follower_id, following_id");
    
    if (followsData) {
      userFollowers = followsData.filter((f) => f.following_id === user.id);
      userFollowing = followsData.filter((f) => f.follower_id === user.id);
    }
  } catch (e) {
    console.warn("Table connect_follows is not initialized yet.");
  }

  let activePresenceList: any[] = [];
  try {
    const { data } = await supabase
      .from("connect_presence")
      .select(`
        id,
        status,
        club_id,
        event_id,
        user_id,
        profiles (
          id,
          full_name,
          avatar_url,
          username
        )
      `)
      .gt("expires_at", new Date().toISOString());
    activePresenceList = data || [];
  } catch (e) {
    console.warn("Table connect_presence is not initialized yet.");
  }

  return (
    <div className="min-h-screen bg-[#020205] text-zinc-100 font-sans">
      <ConnectView
        profile={profile}
        allProfiles={allProfiles}
        clubsList={clubsList}
        eventsList={eventsList}
        validatedBookings={validatedBookings}
        userReputation={userReputation}
        followersCount={userFollowers.length}
        followingCount={userFollowing.length}
        activePresenceList={activePresenceList}
      />
    </div>
  );
}
