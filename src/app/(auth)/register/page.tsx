"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Wine, Mail, Lock, User, Loader2, ArrowRight } from "lucide-react";
import { signup } from "../actions";
import { createClient } from "@/lib/supabase/client";

// Inline SVG components for social logo to avoid import errors
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...props}>
    <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 15 1 12 1 7.24 1 3.2 3.74 1.25 7.74l3.96 3.07C6.18 7.72 8.86 5.04 12 5.04z" />
    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.44-1.1 2.67-2.33 3.49l3.61 2.8c2.12-1.95 3.78-5.17 3.78-8.44z" />
    <path fill="#FBBC05" d="M5.21 14.81c-.24-.72-.38-1.49-.38-2.31s.14-1.59.38-2.31L1.25 7.12C.45 8.73 0 10.52 0 12.43s.45 3.7 1.25 5.31l3.96-3.07z" />
    <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.61-2.8c-1.2.8-2.73 1.28-4.35 1.28-3.14 0-5.82-2.68-6.79-5.77l-3.96 3.07C3.2 19.26 7.24 23 12 23z" />
  </svg>
);

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      
      const result = await signup(formData);
      
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  const handleGoogleRegister = async () => {
    try {
      const supabase = createClient();
      const { error: googleErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (googleErr) {
        setError(googleErr.message);
      }
    } catch (err: any) {
      console.error(err);
      setError("Error al conectar con Google.");
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center relative py-20 px-4">
      {/* Background Neon Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-950/15 rounded-full blur-[140px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8 relative overflow-hidden bg-zinc-950/50 border border-white/5 shadow-2xl rounded-[32px]">
          {/* Subtle top indicator bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />
          
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="bg-primary-600/10 border border-primary-500/20 p-3.5 rounded-2xl mb-4">
              <Wine className="w-8 h-8 text-primary-400 animate-pulse" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2 font-outfit uppercase tracking-wider">
              La vida nocturna comienza aquí
            </h1>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-[280px]">
              Descubre eventos, discotecas, reservas VIP y experiencias únicas.
            </p>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-400 text-xs text-center font-medium">
                {error}
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleRegister}
              type="button"
              className="w-full min-h-[48px] bg-white hover:bg-zinc-200 text-black rounded-2xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-3 active:scale-95 shadow-md shadow-white/5"
            >
              <GoogleIcon className="w-4 h-4" />
              Continuar con Google
            </button>

            {/* Separator */}
            <div className="flex items-center gap-3 my-4">
              <div className="h-px bg-white/5 flex-grow" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">o continúa con correo</span>
              <div className="h-px bg-white/5 flex-grow" />
            </div>

            {/* Email form */}
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 ml-1">Nombre Completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 hover:border-white/15 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50 transition-all"
                    placeholder="Juan Pérez"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 ml-1">Correo Electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 hover:border-white/15 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50 transition-all"
                    placeholder="ejemplo@correo.com"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 ml-1">Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 hover:border-white/15 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50 transition-all"
                    placeholder="••••••••"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-2xl py-3.5 mt-5 text-xs font-black uppercase tracking-widest transition-all glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer active:scale-95 shadow-lg shadow-primary-600/10"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Crear Cuenta
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center text-xs text-zinc-400">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-primary-400 hover:text-primary-300 font-bold transition-colors">
              Inicia sesión
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
