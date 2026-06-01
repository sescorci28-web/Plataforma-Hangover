import { requireAdmin } from "@/lib/admin-guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ContentTabs } from "./ContentTabs";
import { LayoutGrid } from "lucide-react";

export const revalidate = 0;

export default async function AdminContentPage() {
  const { supabase, profile } = await requireAdmin();

  // Fetch all content lists and profiles in parallel
  const [servicesRes, eventsRes, clubsRes, profilesRes] = await Promise.all([
    supabase.from("services").select("*").order("created_at", { ascending: false }),
    supabase.from("events").select("*").order("created_at", { ascending: false }),
    supabase.from("clubs").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, username"),
  ]);

  const profiles = profilesRes.data || [];
  const profilesMap = new Map<string, { full_name: string | null; username: string | null }>(
    profiles.map((p) => [p.id, { full_name: p.full_name, username: p.username }])
  );

  // Map and enrich services
  const servicesList = (servicesRes.data || []).map((s) => {
    const prof = profilesMap.get(s.provider_id);
    return {
      ...s,
      providerName: prof?.full_name || "Sin nombre",
      providerUsername: prof?.username || "",
    };
  });

  // Map and enrich events
  const eventsList = (eventsRes.data || []).map((e) => {
    const prof = profilesMap.get(e.creator_id);
    return {
      ...e,
      creatorName: prof?.full_name || "Sin nombre",
      creatorUsername: prof?.username || "",
    };
  });

  // Map and enrich clubs
  const clubsList = (clubsRes.data || []).map((c) => {
    const prof = c.provider_id ? profilesMap.get(c.provider_id) : null;
    return {
      ...c,
      providerName: prof?.full_name || "Sin proveedor asignado",
      providerUsername: prof?.username || "",
    };
  });

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        <AdminSidebar profile={profile} />

        <div className="flex-grow space-y-8">
          <header>
            <h1 className="text-3xl font-bold font-outfit text-white mb-1">Gestión de Contenido</h1>
            <p className="text-zinc-400">Inspecciona y modera todo el contenido publicado en la plataforma.</p>
          </header>

          <ContentTabs
            services={servicesList}
            events={eventsList}
            clubs={clubsList}
          />
        </div>
      </div>
    </div>
  );
}
