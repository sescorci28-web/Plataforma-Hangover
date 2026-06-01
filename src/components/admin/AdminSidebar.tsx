"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Users, Briefcase, LayoutGrid, Ticket, LogOut, Settings } from "lucide-react";
import { logout } from "@/app/(auth)/actions";

const NAV_ITEMS = [
  { href: "/dashboard/admin", label: "Resumen", icon: Shield },
  { href: "/dashboard/admin/users", label: "Usuarios", icon: Users },
  { href: "/dashboard/admin/providers", label: "Proveedores", icon: Briefcase },
  { href: "/dashboard/admin/content", label: "Contenido", icon: LayoutGrid },
  { href: "/dashboard/admin/bookings", label: "Reservas", icon: Ticket },
];

interface AdminSidebarProps {
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    role: string;
  };
}

export function AdminSidebar({ profile }: AdminSidebarProps) {
  const pathname = usePathname();

  const initials = profile.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "A";

  return (
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
            <div className="w-12 h-12 rounded-full bg-emerald-700 flex items-center justify-center text-xl font-bold font-outfit text-white shrink-0">
              {initials}
            </div>
          )}
          <div className="overflow-hidden">
            <h3 className="font-semibold text-white truncate">{profile.full_name || "Admin"}</h3>
            <p className="text-xs text-emerald-400 capitalize font-semibold">Portal {profile.role}</p>
          </div>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-emerald-400"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            );
          })}

          <div className="pt-2 border-t border-white/5 mt-2">
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium"
            >
              <Settings className="w-5 h-5" />
              Editar Perfil
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left font-medium cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                Cerrar Sesión
              </button>
            </form>
          </div>
        </nav>
      </div>
    </div>
  );
}
