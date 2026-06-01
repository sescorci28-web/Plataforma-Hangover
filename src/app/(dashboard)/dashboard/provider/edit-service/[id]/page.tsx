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
            <h1 className="text-3xl font-bold font-outfit text-white">Editar Servicio</h1>
            <span className="bg-accent-600/20 text-accent-400 border border-accent-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {profile.role}
            </span>
          </div>
          <p className="text-zinc-400 text-sm">
            Modifica los detalles de tu servicio. Los cambios se reflejarán inmediatamente en el marketplace de Hangover.
          </p>
        </header>

        <div className="glass-card p-6 md:p-8">
          <NewServiceForm initialService={service as any} />
        </div>
      </div>
    </div>
  );
}
