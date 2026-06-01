"use client";

import { useState } from "react";
import { Search, Calendar, Ticket, LayoutGrid, Building2, User, Clock, AlertTriangle } from "lucide-react";

interface BookingsListProps {
  bookings: any[];
}

export function BookingsList({ bookings }: BookingsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "club" | "event" | "service">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const getBookingType = (b: any) => {
    if (b.club_id) return "club";
    if (b.event_id) return "event";
    return "service";
  };

  const getBookingTitle = (b: any) => {
    if (b.club_id) return b.clubName || `Discoteca: ${b.club_slug}`;
    if (b.event_id) return b.eventName || "Evento";
    return b.serviceName || "Servicio";
  };

  const filteredBookings = bookings.filter((b) => {
    const type = getBookingType(b);
    const title = getBookingTitle(b);
    const clientName = b.clientName || "";
    const providerName = b.providerName || "";

    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      providerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "all" || type === typeFilter;
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Filters card */}
      <div className="glass-card p-5 border border-white/5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar por cliente, proveedor o título..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
            />
          </div>

          {/* Type filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50 font-medium cursor-pointer"
            >
              <option value="all">Todos los tipos de reservas</option>
              <option value="club">Discotecas (Accesos/VIP)</option>
              <option value="event">Eventos (Entradas)</option>
              <option value="service">Servicios (Contrataciones)</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50 font-medium cursor-pointer"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="confirmed">Confirmadas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
              <option value="rejected">Rechazadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-zinc-400 text-xs font-semibold uppercase tracking-wider border-b border-white/5">
                <th className="py-4 px-6">Tipo</th>
                <th className="py-4 px-6">Detalle de Reserva</th>
                <th className="py-4 px-6">Cliente</th>
                <th className="py-4 px-6">Proveedor</th>
                <th className="py-4 px-6">Fecha Reserva</th>
                <th className="py-4 px-6">Monto Total</th>
                <th className="py-4 px-6">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500 text-xs">
                    No se encontraron reservas que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const type = getBookingType(b);
                  const title = getBookingTitle(b);

                  let typeBadge = null;
                  if (type === "club") {
                    typeBadge = (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        <Building2 className="w-3 h-3" /> Discoteca
                      </span>
                    );
                  } else if (type === "event") {
                    typeBadge = (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
                        <Calendar className="w-3 h-3" /> Evento
                      </span>
                    );
                  } else {
                    typeBadge = (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400">
                        <LayoutGrid className="w-3 h-3" /> Servicio
                      </span>
                    );
                  }

                  let statusBadge = null;
                  switch (b.status) {
                    case "pending":
                      statusBadge = (
                        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                          Pendiente
                        </span>
                      );
                      break;
                    case "confirmed":
                      statusBadge = (
                        <span className="text-[10px] uppercase font-bold tracking-wider text-accent-400 bg-accent-500/10 border border-accent-500/20 px-2.5 py-0.5 rounded-full">
                          Confirmada
                        </span>
                      );
                      break;
                    case "completed":
                      statusBadge = (
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                          Completada
                        </span>
                      );
                      break;
                    case "cancelled":
                    case "rejected":
                      statusBadge = (
                        <span className="text-[10px] uppercase font-bold tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full">
                          {b.status === "cancelled" ? "Cancelada" : "Rechazada"}
                        </span>
                      );
                      break;
                    default:
                      statusBadge = (
                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-full">
                          {b.status}
                        </span>
                      );
                  }

                  const resDate = b.reservation_date || b.event_date;
                  const formattedDate = resDate
                    ? new Date(resDate).toLocaleDateString("es-ES", {
                        day: "numeric", month: "short", year: "numeric",
                      })
                    : "—";

                  return (
                    <tr key={b.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6">{typeBadge}</td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <span className="font-semibold text-white block max-w-[220px] truncate" title={title}>
                            {title}
                          </span>
                          {b.number_of_people && (
                            <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                              <User className="w-3 h-3" /> {b.number_of_people} {b.number_of_people === 1 ? "persona" : "personas"}
                            </span>
                          )}
                          {b.notes && (
                            <p className="text-[11px] text-zinc-400 italic max-w-[220px] truncate" title={b.notes}>
                              "{b.notes}"
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-zinc-200">{b.clientName || "Usuario"}</span>
                          <span className="text-[10px] text-zinc-500">@{b.clientUsername || "—"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-zinc-300 text-xs">{b.providerName || "—"}</span>
                      </td>
                      <td className="py-4 px-6 text-zinc-300 text-xs">
                        <div className="flex flex-col">
                          <span>{formattedDate}</span>
                          {b.event_time && <span className="text-[10px] text-zinc-500">{b.event_time}</span>}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-emerald-400 font-bold">${b.total_amount}</td>
                      <td className="py-4 px-6">{statusBadge}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
