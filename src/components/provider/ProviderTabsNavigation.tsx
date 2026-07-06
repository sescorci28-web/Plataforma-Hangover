"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { 
  BarChart3, 
  Building2, 
  Sliders, 
  ShoppingBag, 
  QrCode, 
  Calendar, 
  Ticket, 
  Users, 
  DollarSign, 
  Sparkles, 
  Bell, 
  CalendarDays, 
  User, 
  Settings 
} from "lucide-react";

interface ProviderTabsNavigationProps {
  providerType: string | null;
}

export function ProviderTabsNavigation({ providerType }: ProviderTabsNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "provider";

  // Helper to determine if a main tab is active
  const isActive = (path: string, view?: string) => {
    if (view) {
      return pathname === "/dashboard/provider" && currentView === view;
    }
    return pathname === path;
  };

  const baseTabClass = "flex items-center gap-2 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer select-none";
  const activeTabClass = "border-primary-500 text-primary-400 bg-white/[0.02]";
  const inactiveTabClass = "border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.01]";

  return (
    <div className="border-t border-b border-white/5 bg-zinc-950/20 backdrop-blur-md sticky top-16 z-30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center overflow-x-auto scrollbar-none gap-1 -mb-[1px]">
          {/* 1. Common Main Summary Tab */}
          <Link
            href="/dashboard/provider?view=provider"
            className={`${baseTabClass} ${isActive("/dashboard/provider", "provider") && currentView !== "client" && !["events", "tickets", "attendees", "sales", "services", "requests", "bookings", "calendar"].includes(currentView) ? activeTabClass : inactiveTabClass}`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Resumen</span>
          </Link>
 
          {/* 2. Club-Specific Tabs */}
          {providerType === "club" && (
            <>
              <Link
                href="/dashboard/provider/clubs"
                className={`${baseTabClass} ${isActive("/dashboard/provider/clubs") ? activeTabClass : inactiveTabClass}`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Locales</span>
              </Link>
              <Link
                href="/dashboard/provider/tables"
                className={`${baseTabClass} ${isActive("/dashboard/provider/tables") ? activeTabClass : inactiveTabClass}`}
              >
                <Sliders className="w-4 h-4 shrink-0" />
                <span>Mesas</span>
              </Link>
              <Link
                href="/dashboard/provider/orders"
                className={`${baseTabClass} ${isActive("/dashboard/provider/orders") ? activeTabClass : inactiveTabClass}`}
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span>Pedidos</span>
              </Link>
              <Link
                href="/dashboard/provider/scanner"
                className={`${baseTabClass} ${isActive("/dashboard/provider/scanner") ? activeTabClass : inactiveTabClass}`}
              >
                <QrCode className="w-4 h-4 shrink-0" />
                <span>Scanner</span>
              </Link>
            </>
          )}
 
          {/* 3. Event Organizer-Specific Tabs */}
          {providerType === "event_organizer" && (
            <>
              <Link
                href="/dashboard/provider?view=events"
                className={`${baseTabClass} ${isActive("/dashboard/provider", "events") ? activeTabClass : inactiveTabClass}`}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <span>Eventos</span>
              </Link>
              <Link
                href="/dashboard/provider?view=tickets"
                className={`${baseTabClass} ${isActive("/dashboard/provider", "tickets") ? activeTabClass : inactiveTabClass}`}
              >
                <Ticket className="w-4 h-4 shrink-0" />
                <span>Boletería</span>
              </Link>
              <Link
                href="/dashboard/provider?view=attendees"
                className={`${baseTabClass} ${isActive("/dashboard/provider", "attendees") ? activeTabClass : inactiveTabClass}`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Asistentes</span>
              </Link>
              <Link
                href="/dashboard/provider?view=sales"
                className={`${baseTabClass} ${isActive("/dashboard/provider", "sales") ? activeTabClass : inactiveTabClass}`}
              >
                <DollarSign className="w-4 h-4 shrink-0" />
                <span>Ventas</span>
              </Link>
              <Link
                href="/dashboard/provider/scanner"
                className={`${baseTabClass} ${isActive("/dashboard/provider/scanner") ? activeTabClass : inactiveTabClass}`}
              >
                <QrCode className="w-4 h-4 shrink-0" />
                <span>Scanner</span>
              </Link>
            </>
          )}
 
          {/* 4. Service Provider-Specific Tabs */}
          {providerType === "service_provider" && (
            <>
              <Link
                href="/dashboard/provider?view=services"
                className={`${baseTabClass} ${isActive("/dashboard/provider", "services") ? activeTabClass : inactiveTabClass}`}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Servicios</span>
              </Link>
              <Link
                href="/dashboard/provider?view=requests"
                className={`${baseTabClass} ${isActive("/dashboard/provider", "requests") ? activeTabClass : inactiveTabClass}`}
              >
                <Bell className="w-4 h-4 shrink-0" />
                <span>Solicitudes</span>
              </Link>
              <Link
                href="/dashboard/provider?view=bookings"
                className={`${baseTabClass} ${isActive("/dashboard/provider", "bookings") ? activeTabClass : inactiveTabClass}`}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <span>Reservas</span>
              </Link>
              <Link
                href="/dashboard/provider?view=calendar"
                className={`${baseTabClass} ${isActive("/dashboard/provider", "calendar") ? activeTabClass : inactiveTabClass}`}
              >
                <CalendarDays className="w-4 h-4 shrink-0" />
                <span>Agenda</span>
              </Link>
            </>
          )}
 
          <div className="flex-grow" />
 
          {/* 5. Client View Tab */}
          <Link
            href="/dashboard/provider?view=client"
            className={`${baseTabClass} ${isActive("/dashboard/provider", "client") ? activeTabClass : inactiveTabClass} border-l border-white/5`}
          >
            <User className="w-4 h-4 shrink-0 text-primary-400" />
            <span>Vista Cliente</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
