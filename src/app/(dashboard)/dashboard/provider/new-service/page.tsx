import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { NewServiceForm } from "@/components/profile/NewServiceForm";

export default async function NewServicePage() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // Get user profile role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "provider" && profile.role !== "admin")) {
    redirect("/dashboard");
  }

  // Fetch dynamic categories & subcategories for the form
  let dbCategories: any[] = [];
  let dbSubcategories: any[] = [];
  
  try {
    const { data: catData } = await supabase
      .from("service_categories")
      .select("id, slug, name, icon")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
      
    const { data: subData } = await supabase
      .from("service_subcategories")
      .select("id, category_id, slug, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    dbCategories = catData || [];
    dbSubcategories = subData || [];
  } catch (error) {
    console.error("Error querying taxonomy tables, falling back to static lists:", error);
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 max-w-3xl">
      <div className="space-y-6">
        <header className="space-y-2">
          <Link 
            href="/dashboard/provider"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Panel de Proveedor
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold font-outfit text-white">Publicar Nuevo Servicio</h1>
            <span className="bg-primary-600/20 text-primary-400 border border-primary-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {profile.role}
            </span>
          </div>
          <p className="text-zinc-400 text-sm">
            Crea una oferta de servicio profesional en el marketplace de Hangover. Recuerda que estará disponible para su contratación inmediata por los clientes.
          </p>
        </header>

        <div className="glass-card p-6 md:p-8">
          <NewServiceForm categories={dbCategories} subcategories={dbSubcategories} />
        </div>
      </div>
    </div>
  );
}
