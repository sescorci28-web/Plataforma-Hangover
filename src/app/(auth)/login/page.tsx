"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Wine, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { login } from "../actions";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      
      const result = await login(formData);
      
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center relative py-20 px-4">
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-900/20 rounded-full blur-[100px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8 relative overflow-hidden">
          {/* Shine effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50" />
          
          <div className="flex flex-col items-center mb-8">
            <div className="bg-primary-600/20 p-3 rounded-2xl mb-4">
              <Wine className="w-8 h-8 text-primary-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 font-outfit">Bienvenido de vuelta</h1>
            <p className="text-zinc-400 text-sm text-center">
              Ingresa a tu cuenta para continuar planificando.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-300 ml-1">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-medium text-zinc-300">Contraseña</label>
                <Link href="/forgot-password" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 mt-6 font-semibold transition-all glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-zinc-400">
            ¿No tienes una cuenta?{" "}
            <Link href="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Regístrate ahora
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
