import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { NewServiceForm } from "@/components/profile/NewServiceForm";

export const revalidate = 0; // Dynamic route

interface EditServicePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditServicePage({ params }: EditServicePageProps) {
  const { id } = await params;
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

  // Fetch the service to edit, ensuring it belongs to the logged-in provider
  const { data: service, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .eq("provider_id", user.id)
    .single();

  if (error || !service) {
    notFound();
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
  } catch (err) {
    console.error("Error querying taxonomy tables, falling back to static lists:", err);
  }

  return (
    <div className="min-h-screen bg-[#06060e]">
      <div className="container mx-auto px-4 md:px-6 py-10 max-w-2xl">
        <Link
          href="/dashboard/provider"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al Panel
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/20 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-amber-400 rotate-[135deg]" />
            </div>
            <h1 className="text-2xl font-black font-outfit text-white">Editar Servicio</h1>
          </div>
          <p className="text-sm text-zinc-500">
            Los cambios se reflejan inmediatamente en el marketplace.
          </p>
        </div>

        <NewServiceForm initialService={service as any} categories={dbCategories} subcategories={dbSubcategories} />
      </div>
    </div>
  );
}
