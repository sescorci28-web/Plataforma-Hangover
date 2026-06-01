import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Shared guard for all admin pages.
 * Returns { supabase, user, profile } or redirects.
 */
export async function requireAdmin() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) redirect("/login");
  if (profile.role !== "admin") redirect(`/dashboard/${profile.role}`);

  return { supabase, user, profile };
}
