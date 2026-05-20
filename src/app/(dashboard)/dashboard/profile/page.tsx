import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Settings, User, LogOut } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/(auth)/actions";

export const revalidate = 0; // Disable cache for this page so it always loads fresh data

export default async function ProfilePage() {
  const supabase = await createClient();

  // Get current user session
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    // If auth user exists but profile doesn't, redirect to register/login
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="glass-card p-6 sticky top-24">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-xl font-bold font-outfit text-white">
                {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <h3 className="font-semibold text-white truncate max-w-[140px]">
                  {profile.full_name || "Usuario"}
                </h3>
                <p className="text-xs text-zinc-400 capitalize">{profile.role}</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              <Link 
                href={`/dashboard/${profile.role}`} 
                className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium"
              >
                <User className="w-5 h-5" />
                Mi Panel
              </Link>
              <Link 
                href="/dashboard/profile" 
                className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl text-primary-400 font-medium"
              >
                <Settings className="w-5 h-5" />
                Editar Perfil
              </Link>
              <form action={logout}>
                <button 
                  type="submit" 
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  Cerrar Sesión
                </button>
              </form>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow space-y-8">
          <header>
            <h1 className="text-3xl font-bold font-outfit mb-2">Editar Perfil</h1>
            <p className="text-zinc-400">Actualiza tu información personal y cómo te ven otros usuarios.</p>
          </header>

          <div className="glass-card p-6 md:p-8">
            <ProfileForm profile={profile} userId={user.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
