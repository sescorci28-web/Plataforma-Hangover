import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TablesManager } from "@/components/provider/TablesManager";
import { Building2, ArrowLeft, Sliders, Bell } from "lucide-react";
import Link from "next/link";

export const revalidate = 0; // Always dynamic

export default async function ProviderTablesPage() {
  const supabase = await createClient();

  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // 2. Fetch role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name, username, avatar_url")
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
    console.error("Error fetching provider clubs for tables dashboard:", clubsError);
  }

  const providerClubs = clubs || [];

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="glass-card p-6 sticky top-24">
            <div className="flex items-center gap-4 mb-8">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || ""}
                  className="w-12 h-12 rounded-full object-cover border border-white/10"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-xl font-bold font-outfit text-white shrink-0">
                  {profile.full_name?.charAt(0) || "P"}
                </div>
              )}
              <div className="overflow-hidden">
                <h3 className="font-semibold text-white truncate">{profile.full_name || "Proveedor"}</h3>
                <p className="text-xs text-zinc-400">@{profile.username || "proveedor"}</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              <Link href="/dashboard/provider" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium">
                <ArrowLeft className="w-5 h-5" />
                Volver al Panel
              </Link>
              <Link href="/dashboard/provider/tables" className="flex items-center gap-3 px-4 py-3 bg-primary-600 text-white rounded-xl transition-colors font-medium">
                <Sliders className="w-5 h-5" />
                Control de Mesas
              </Link>
              <Link href="/dashboard/provider/orders" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium">
                <Bell className="w-5 h-5" />
                Comandas en Vivo
              </Link>
              <Link href="/dashboard/provider/clubs" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium">
                <Building2 className="w-5 h-5" />
                Mis Discotecas
              </Link>
            </nav>
          </div>
        </div>

        {/* Tables Panel */}
        <div className="flex-grow min-w-0">
          <TablesManager clubs={providerClubs} />
        </div>
      </div>
    </div>
  );
}
