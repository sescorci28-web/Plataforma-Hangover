"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Wine, Mail, Lock, User, Briefcase, Loader2, ArrowRight } from "lucide-react";
import clsx from "clsx";
import { signup } from "../actions";

export default function RegisterPage() {
  const [type, setType] = useState<"user" | "provider">("user");
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
      formData.append("type", type);
      
      const result = await signup(formData);
      
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center relative py-20 px-4">
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-900/20 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8 relative overflow-hidden">
          {/* Shine effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-500 to-transparent opacity-50" />
          
          <div className="flex flex-col items-center mb-8">
            <div className="bg-accent-600/20 p-3 rounded-2xl mb-4">
              <Wine className="w-8 h-8 text-accent-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 font-outfit">Crea tu cuenta</h1>
            <p className="text-zinc-400 text-sm text-center">
              Únete a la mejor plataforma de nightlife.
            </p>
          </div>

          <div className="flex bg-black/40 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setType("user")}
              className={clsx(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2",
                type === "user" ? "bg-white/10 text-white shadow-sm" : "text-zinc-400 hover:text-white"
              )}
            >
              <User className="w-4 h-4" />
              Usuario
            </button>
            <button
              type="button"
              onClick={() => setType("provider")}
              className={clsx(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2",
                type === "provider" ? "bg-white/10 text-white shadow-sm" : "text-zinc-400 hover:text-white"
              )}
            >
              <Briefcase className="w-4 h-4" />
              Proveedor
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-300 ml-1">Nombre Completo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-all"
                  placeholder="Juan Pérez"
                  required
                />
              </div>
            </div>

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
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-all"
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-300 ml-1">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-accent-600 hover:bg-accent-500 text-white rounded-xl py-3 mt-6 font-semibold transition-all glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Crear Cuenta
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-zinc-400">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-accent-400 hover:text-accent-300 font-medium transition-colors">
              Inicia sesión
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
