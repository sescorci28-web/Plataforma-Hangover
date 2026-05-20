import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const revalidate = 0; // Always dynamic

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect("/login");
  }

  // Fetch the role from the profile table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    // If user exists but no profile, redirect to login/register to reset
    redirect("/login");
  }

  // Redirect to the appropriate dashboard
  redirect(`/dashboard/${profile.role}`);
}
