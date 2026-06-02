import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { QRValidatorForm } from "./QRValidatorForm";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const revalidate = 0; // Always dynamic

export default async function QRValidationPage() {
  const supabase = await createClient();

  // Get current user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // Get provider profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || (profile.role !== "provider" && profile.role !== "admin")) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 max-w-xl">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/dashboard/provider"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Panel
        </Link>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-500/10 border border-accent-500/20 text-[10px] font-bold uppercase tracking-wider text-accent-400">
          <ShieldCheck className="w-3.5 h-3.5" /> Acceso Seguro
        </span>
      </div>

      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold font-outfit text-white">Validar Entrada / Reserva</h1>
        <p className="text-sm text-zinc-400">Ingresa o escanea el código QR del cliente para registrar su entrada.</p>
      </div>

      <QRValidatorForm />
    </div>
  );
}
