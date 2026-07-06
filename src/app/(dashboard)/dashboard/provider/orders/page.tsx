import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LiveOrdersDashboard } from "@/components/provider/LiveOrdersDashboard";

export const revalidate = 0; // Always dynamic

export default async function ProviderLiveOrdersPage() {
  const supabase = await createClient();

  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // 2. Fetch role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login");
  }

  if (profile.role !== "provider" && profile.role !== "admin") {
    redirect(`/dashboard/${profile.role}`);
  }

  // 3. Fetch clubs managed by this provider
  let query = supabase.from("clubs").select("id, name, logo, slug");
  if (profile.role !== "admin") {
    query = query.eq("provider_id", user.id);
  }
  
  const { data: clubs, error: clubsError } = await query.order("name", { ascending: true });

  if (clubsError) {
    console.error("Error fetching provider clubs for orders dashboard:", clubsError);
  }

  const providerClubs = clubs || [];

  return <LiveOrdersDashboard clubs={providerClubs} />;
}

