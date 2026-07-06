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
    <div className="container mx-auto px-4 md:px-6 py-10 max-w-2xl">
      {/* Back link */}
      <Link
        href="/dashboard/provider"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver al Panel
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-primary-600/20 border border-primary-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-400" />
          </div>
          <h1 className="text-2xl font-black font-outfit text-white">Publicar Servicio</h1>
        </div>
        <p className="text-sm text-zinc-500">
          Ponlo en el marketplace de Hangover en menos de 2 minutos.
        </p>
      </div>

      <NewServiceForm categories={dbCategories} subcategories={dbSubcategories} />
    </div>
  );
}
