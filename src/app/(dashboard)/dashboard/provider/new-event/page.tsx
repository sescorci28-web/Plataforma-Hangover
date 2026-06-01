import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { NewEventForm } from "@/components/provider/NewEventForm";

export default async function NewEventPage() {
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
            <h1 className="text-3xl font-bold font-outfit text-white">Publicar Nuevo Evento</h1>
            <span className="bg-accent-600/20 text-accent-400 border border-accent-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {profile.role}
            </span>
          </div>
          <p className="text-zinc-400 text-sm">
            Crea un evento público (fiesta, festival, etc.) en el marketplace de Hangover. Los clientes podrán reservar o comprar sus entradas al instante.
          </p>
        </header>

        <div className="glass-card p-6 md:p-8">
          <NewEventForm />
        </div>
      </div>
    </div>
  );
}
