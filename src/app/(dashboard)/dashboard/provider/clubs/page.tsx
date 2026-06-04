import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BarChart3, Settings, LogOut, Building2, QrCode, Camera } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
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

  const activeProfile = profile;

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
    }
  } catch (err) {
    console.error("Error loading clubs:", err);
  }

  const initials = activeProfile.full_name
    ? activeProfile.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "P";

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
                <div className="w-12 h-12 rounded-full bg-accent-600 flex items-center justify-center text-xl font-bold font-outfit text-white shrink-0">
                  {initials}
                </div>
              )}
              <div className="overflow-hidden">
                <h3 className="font-semibold text-white truncate">{activeProfile.full_name || "Proveedor"}</h3>
                <p className="text-xs text-zinc-400">@{activeProfile.username || "proveedor"}</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              <Link href="/dashboard/provider" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium">
                <BarChart3 className="w-5 h-5" />
                Panel de Control
              </Link>
              <Link href="/dashboard/provider/clubs" className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl text-accent-400 font-medium">
                <Building2 className="w-5 h-5" />
                Mis Discotecas
              </Link>
              <Link href="/dashboard/provider/validate" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium">
                <QrCode className="w-5 h-5 text-primary-400" />
                Validar Entrada
              </Link>
              <Link href="/dashboard/provider/scanner" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium">
                <Camera className="w-5 h-5 text-accent-400" />
                Escáner Cámara
              </Link>
              <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium">
                <Settings className="w-5 h-5" />
                Editar Perfil
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
        <div className="flex-grow">
          <ClubsManager clubs={clubs} />
        </div>
      </div>
    </div>
  );
}
