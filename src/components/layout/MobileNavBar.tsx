"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Building2, Users, User } from "lucide-react";
import clsx from "clsx";

export function MobileNavBar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Inicio", href: "/", icon: Home },
    { label: "Eventos", href: "/events", icon: Calendar },
    { label: "Discotecas", href: "/discotecas", icon: Building2 },
    { label: "Connect", href: "/dashboard", icon: Users }, // Links to Connect / Dashboard
    { label: "Perfil", href: "/dashboard/profile", icon: User },
  ];

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <div className="glass bg-zinc-950/80 border border-white/10 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.6)] flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1.5 transition-all duration-300 relative group cursor-pointer"
            >
              <div
                className={clsx(
                  "p-1.5 rounded-xl transition-all duration-300",
                  isActive
                    ? "bg-primary-600/20 text-primary-400 scale-110"
                    : "text-zinc-400 group-hover:text-zinc-200"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={clsx(
                  "text-[9px] font-bold tracking-wide transition-all uppercase duration-300",
                  isActive ? "text-primary-300" : "text-zinc-500"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
