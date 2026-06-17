"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Wine, Building2, Calendar, Sparkles, User, Loader2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type OnboardingOption = "club" | "event_organizer" | "service_provider" | "user";

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<OnboardingOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [profileExists, setProfileExists] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }
        setUser(user);
        setUserId(user.id);
        
        // Verificar si ya completó el onboarding
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single();

        if (profile) {
          setProfileExists(true);
          if (profile.onboarding_completed) {
            router.push("/dashboard");
            return;
          }
        } else {
          setProfileExists(false);
        }
        setCheckingSession(false);
      } catch (err) {
        console.error(err);
        router.push("/login");
      }
    }
    checkUser();
  }, [router]);

  const handleCompleteOnboarding = async () => {
    if (!selected || !userId) return;

    setLoading(true);
    setError(null);

    const isProvider = selected !== "user";
    const role = isProvider ? "provider" : "user";
    const providerType = isProvider ? selected : null;

    try {
      if (profileExists) {
        // 1. Actualizamos el perfil del usuario en la base de datos
        const { error: updateErr } = await supabase
          .from("profiles")
          .update({
            onboarding_completed: true,
            role: role,
            provider_type: providerType
          })
          .eq("id", userId);

        if (updateErr) throw updateErr;
      } else {
        // 1. Creamos el perfil del usuario en la base de datos
        const { error: insertErr } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            role: role,
            provider_type: providerType,
            onboarding_completed: true,
            full_name: user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuario Hangover",
            username: user?.user_metadata?.username || user?.email?.split("@")[0] || `user_${Math.random().toString(36).substring(2, 7)}`,
            city: "No especificada",
            bio: null,
            avatar_url: null,
            phone: null
          });

        if (insertErr) throw insertErr;
      }

      // 2. Redirigimos al dashboard unificado
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Ocurrió un error al guardar tu perfil. Por favor, vuelve a intentarlo.");
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#020205] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020205] flex items-center justify-center relative py-12 px-4">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-950/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-950/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 space-y-8 text-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="bg-primary-600/10 border border-primary-500/20 p-3 rounded-2xl">
            <Wine className="w-7 h-7 text-primary-400" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary-400">Paso 2 de 2 • Onboarding</span>
          <h1 className="text-3xl md:text-5xl font-black text-white font-outfit uppercase tracking-tight">
            ¿Qué deseas hacer en Hangover?
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-md">
            Elige tu perfil principal. Podrás explorar eventos y, si lo deseas, administrar tu negocio o servicios desde la misma cuenta.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-400 text-xs max-w-md mx-auto">
            {error}
          </div>
        )}

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
          {/* Option: club */}
          <button
            onClick={() => setSelected("club")}
            className={`group p-6 rounded-3xl border text-left transition-all flex flex-col justify-between h-44 cursor-pointer relative overflow-hidden select-none ${
              selected === "club"
                ? "bg-primary-600/10 border-primary-500 shadow-xl shadow-primary-500/5"
                : "bg-zinc-950/30 border-white/5 hover:border-white/10 hover:bg-zinc-950/40"
            }`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
              selected === "club" ? "bg-primary-500/20 text-primary-400" : "bg-white/5 text-zinc-400"
            }`}>
              <Building2 className="w-5 h-5" />
            </div>
            <div className="space-y-1 relative z-10 mt-6">
              <h3 className="font-bold text-white text-base font-outfit uppercase">Administrar Discotecas</h3>
              <p className="text-zinc-500 text-[10px] sm:text-xs leading-relaxed max-w-[200px]">
                Registra locales, vende reservas de mesa VIP y gestiona pedidos.
              </p>
            </div>
          </button>

          {/* Option: event_organizer */}
          <button
            onClick={() => setSelected("event_organizer")}
            className={`group p-6 rounded-3xl border text-left transition-all flex flex-col justify-between h-44 cursor-pointer relative overflow-hidden select-none ${
              selected === "event_organizer"
                ? "bg-primary-600/10 border-primary-500 shadow-xl shadow-primary-500/5"
                : "bg-zinc-950/30 border-white/5 hover:border-white/10 hover:bg-zinc-950/40"
            }`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
              selected === "event_organizer" ? "bg-primary-500/20 text-primary-400" : "bg-white/5 text-zinc-400"
            }`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div className="space-y-1 relative z-10 mt-6">
              <h3 className="font-bold text-white text-base font-outfit uppercase">Organizar Eventos</h3>
              <p className="text-zinc-500 text-[10px] sm:text-xs leading-relaxed max-w-[200px]">
                Monta eventos, vende entradas oficiales con QR y valida accesos.
              </p>
            </div>
          </button>

          {/* Option: service_provider */}
          <button
            onClick={() => setSelected("service_provider")}
            className={`group p-6 rounded-3xl border text-left transition-all flex flex-col justify-between h-44 cursor-pointer relative overflow-hidden select-none ${
              selected === "service_provider"
                ? "bg-primary-600/10 border-primary-500 shadow-xl shadow-primary-500/5"
                : "bg-zinc-950/30 border-white/5 hover:border-white/10 hover:bg-zinc-950/40"
            }`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
              selected === "service_provider" ? "bg-primary-500/20 text-primary-400" : "bg-white/5 text-zinc-400"
            }`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1 relative z-10 mt-6">
              <h3 className="font-bold text-white text-base font-outfit uppercase">Ofrecer Servicios</h3>
              <p className="text-zinc-500 text-[10px] sm:text-xs leading-relaxed max-w-[200px]">
                Ofrece DJs, iluminación, sonido o catering y recibe reservas.
              </p>
            </div>
          </button>

          {/* Option: user */}
          <button
            onClick={() => setSelected("user")}
            className={`group p-6 rounded-3xl border text-left transition-all flex flex-col justify-between h-44 cursor-pointer relative overflow-hidden select-none ${
              selected === "user"
                ? "bg-primary-600/10 border-primary-500 shadow-xl shadow-primary-500/5"
                : "bg-zinc-950/30 border-white/5 hover:border-white/10 hover:bg-zinc-950/40"
            }`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
              selected === "user" ? "bg-primary-500/20 text-primary-400" : "bg-white/5 text-zinc-400"
            }`}>
              <User className="w-5 h-5" />
            </div>
            <div className="space-y-1 relative z-10 mt-6">
              <h3 className="font-bold text-white text-base font-outfit uppercase">Solo disfrutar</h3>
              <p className="text-zinc-500 text-[10px] sm:text-xs leading-relaxed max-w-[200px]">
                Encuentra planes, compra tickets y conecta con la comunidad Hangover.
              </p>
            </div>
          </button>
        </div>

        <div className="pt-6 max-w-xs mx-auto">
          <button
            onClick={handleCompleteOnboarding}
            disabled={loading || !selected}
            className="w-full bg-primary-600 hover:bg-primary-500 active:scale-95 text-white rounded-2xl py-3.5 text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-primary-500/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Completar Onboarding
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
