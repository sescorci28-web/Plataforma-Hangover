import { requireAdmin } from "@/lib/admin-guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Briefcase, LayoutGrid, Calendar, Building2, DollarSign } from "lucide-react";

export const revalidate = 0;

export default async function AdminProvidersPage() {
  const { supabase, profile } = await requireAdmin();

  // Fetch all providers
  const { data: providers } = await supabase
    .from("profiles")
    .select("id, full_name, username, city, avatar_url, created_at")
    .eq("role", "provider")
    .order("created_at", { ascending: false });

  const providersList = providers || [];

  // For each provider, count their services and events in parallel
  const providerIds = providersList.map((p) => p.id);

  const [servicesRes, eventsRes] = await Promise.all([
    providerIds.length
      ? supabase.from("services").select("id, provider_id, title, price").in("provider_id", providerIds)
      : Promise.resolve({ data: [] }),
    providerIds.length
      ? supabase.from("events").select("id, creator_id, title, ticket_price").in("creator_id", providerIds)
      : Promise.resolve({ data: [] }),
  ]);

  const servicesByProvider = new Map<string, any[]>();
  const eventsByProvider = new Map<string, any[]>();

  for (const s of servicesRes.data || []) {
    if (!servicesByProvider.has(s.provider_id)) servicesByProvider.set(s.provider_id, []);
    servicesByProvider.get(s.provider_id)!.push(s);
  }
  for (const e of eventsRes.data || []) {
    if (!eventsByProvider.has(e.creator_id)) eventsByProvider.set(e.creator_id, []);
    eventsByProvider.get(e.creator_id)!.push(e);
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        <AdminSidebar profile={profile} />

        <div className="flex-grow space-y-8">
          <header>
            <h1 className="text-3xl font-bold font-outfit text-white mb-1">Gestión de Proveedores</h1>
            <p className="text-zinc-400">Vista detallada de cada proveedor: sus servicios y eventos publicados.</p>
          </header>

          {providersList.length === 0 ? (
            <div className="glass-card p-12 text-center text-zinc-500 text-sm">
              No hay proveedores registrados todavía.
            </div>
          ) : (
            <div className="space-y-6">
              {providersList.map((prov) => {
                const initials = prov.full_name
                  ? prov.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
                  : "P";
                const services = servicesByProvider.get(prov.id) || [];
                const events = eventsByProvider.get(prov.id) || [];

                return (
                  <div key={prov.id} className="glass-card overflow-hidden border border-white/5">
                    {/* Provider header */}
                    <div className="p-5 border-b border-white/5 flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        {prov.avatar_url ? (
                          <img src={prov.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border border-white/10" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-accent-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                            {initials}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-white">{prov.full_name || "Sin nombre"}</p>
                          <p className="text-xs text-zinc-400">@{prov.username || "—"} · {prov.city || "Sin ciudad"}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <LayoutGrid className="w-3.5 h-3.5 text-accent-400" /> {services.length} servicios
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-rose-400" /> {events.length} eventos
                        </span>
                      </div>
                    </div>

                    {/* Services */}
                    {services.length > 0 && (
                      <div className="p-5 border-b border-white/5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-accent-400 mb-3 flex items-center gap-1.5">
                          <LayoutGrid className="w-3.5 h-3.5" /> Servicios
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {services.map((s) => (
                            <div key={s.id} className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-white/5 text-sm">
                              <span className="text-zinc-200 truncate">{s.title}</span>
                              <span className="text-emerald-400 font-semibold ml-3 shrink-0">${s.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Events */}
                    {events.length > 0 && (
                      <div className="p-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> Eventos
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {events.map((e) => (
                            <div key={e.id} className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-white/5 text-sm">
                              <span className="text-zinc-200 truncate">{e.title}</span>
                              <span className="text-emerald-400 font-semibold ml-3 shrink-0">
                                {e.ticket_price > 0 ? `$${e.ticket_price}` : "Gratis"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {services.length === 0 && events.length === 0 && (
                      <div className="p-5 text-sm text-zinc-600 italic">Este proveedor no tiene contenido publicado.</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
