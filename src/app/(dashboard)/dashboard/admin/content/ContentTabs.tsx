"use client";

import { useState } from "react";
import { LayoutGrid, Calendar, Building2, Search, MapPin, Tag } from "lucide-react";
import { DeleteContentButton } from "@/components/admin/DeleteContentButton";

interface ContentTabsProps {
  services: any[];
  events: any[];
  clubs: any[];
}

export function ContentTabs({ services, events, clubs }: ContentTabsProps) {
  const [activeTab, setActiveTab] = useState<"services" | "events" | "clubs">("services");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredServices = services.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.providerName && s.providerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.creatorName && e.creatorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    e.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClubs = clubs.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.providerName && c.providerName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Tabs list and Search bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex bg-white/5 border border-white/5 p-1 rounded-xl w-full md:w-auto">
          {[
            { id: "services", label: "Servicios", icon: LayoutGrid, count: services.length, color: "text-violet-400" },
            { id: "events", label: "Eventos", icon: Calendar, count: events.length, color: "text-rose-400" },
            { id: "clubs", label: "Discotecas", icon: Building2, count: clubs.length, color: "text-amber-400" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSearchQuery("");
                }}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex-1 md:flex-none ${
                  isActive
                    ? "bg-white/10 text-white shadow-md"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.color}`} />
                <span>{tab.label}</span>
                <span className="bg-white/5 px-2 py-0.5 rounded-full text-[10px] text-zinc-400 font-medium">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder={`Buscar por título, proveedor o ciudad...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50 transition-all"
          />
        </div>
      </div>

      {/* Services Tab View */}
      {activeTab === "services" && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-zinc-400 text-xs font-semibold uppercase tracking-wider border-b border-white/5">
                  <th className="py-4 px-6">Servicio</th>
                  <th className="py-4 px-6">Categoría</th>
                  <th className="py-4 px-6">Proveedor</th>
                  <th className="py-4 px-6">Precio</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500 text-xs">
                      No se encontraron servicios.
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((s) => (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-semibold text-white truncate max-w-[200px] block" title={s.title}>
                          {s.title}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-medium bg-violet-500/10 border border-violet-500/20 text-violet-400">
                          <Tag className="w-3 h-3" />
                          {s.category}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-zinc-200">{s.providerName || "Proveedor desconocido"}</span>
                          <span className="text-[10px] text-zinc-500 truncate max-w-[150px]">@{s.providerUsername || "—"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-emerald-400 font-bold">${s.price}</td>
                      <td className="py-4 px-6 text-right">
                        <DeleteContentButton id={s.id} type="service" itemName={s.title} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Events Tab View */}
      {activeTab === "events" && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-zinc-400 text-xs font-semibold uppercase tracking-wider border-b border-white/5">
                  <th className="py-4 px-6">Evento</th>
                  <th className="py-4 px-6">Fecha</th>
                  <th className="py-4 px-6">Ubicación</th>
                  <th className="py-4 px-6">Organizador</th>
                  <th className="py-4 px-6">Precio Entrada</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500 text-xs">
                      No se encontraron eventos.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((e) => {
                    const eventDateStr = e.event_date
                      ? new Date(e.event_date).toLocaleDateString("es-ES", {
                          day: "numeric", month: "short", year: "numeric",
                        })
                      : "Sin fecha";
                    return (
                      <tr key={e.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-semibold text-white truncate max-w-[180px] block" title={e.title}>
                            {e.title}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-zinc-300 text-xs">{eventDateStr}</td>
                        <td className="py-4 px-6 text-zinc-400 text-xs">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span className="truncate max-w-[140px]">{e.location}</span>
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="text-zinc-200">{e.creatorName || "Proveedor desconocido"}</span>
                            <span className="text-[10px] text-zinc-500">@{e.creatorUsername || "—"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-emerald-400 font-bold">
                          {e.ticket_price > 0 ? `$${e.ticket_price}` : "Gratis"}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <DeleteContentButton id={e.id} type="event" itemName={e.title} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clubs Tab View */}
      {activeTab === "clubs" && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-zinc-400 text-xs font-semibold uppercase tracking-wider border-b border-white/5">
                  <th className="py-4 px-6">Discoteca</th>
                  <th className="py-4 px-6">Ciudad</th>
                  <th className="py-4 px-6">Slug / Enlace</th>
                  <th className="py-4 px-6">Propietario / Proveedor</th>
                  <th className="py-4 px-6">Estado</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredClubs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500 text-xs">
                      No se encontraron discotecas.
                    </td>
                  </tr>
                ) : (
                  filteredClubs.map((c) => (
                    <tr key={c.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-semibold text-white truncate max-w-[180px] block" title={c.name}>
                          {c.name}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-zinc-300 text-xs">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          {c.city}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-zinc-500 font-mono text-[11px]">/discotecas/{c.slug}</td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-zinc-200">{c.providerName || "Proveedor desconocido"}</span>
                          <span className="text-[10px] text-zinc-500">@{c.providerUsername || "—"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {c.active ? (
                          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            Activa
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
                            Inactiva
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <DeleteContentButton id={c.id} type="club" itemName={c.name} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
