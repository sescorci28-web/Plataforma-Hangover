"use client";

import { useState, useTransition } from "react";
import { User, AtSign, MapPin, AlignLeft, Phone, Loader2, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AvatarUpload } from "./AvatarUpload";
import { updateProfile } from "@/app/(dashboard)/dashboard/profile/actions";
import { Profile } from "@/types/database.types";
import Link from "next/link";

interface ProfileFormProps {
  profile: Profile;
  userId: string;
}

export function ProfileForm({ profile, userId }: ProfileFormProps) {
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [username, setUsername] = useState(profile.username || "");
  const [city, setCity] = useState(profile.city || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Basic frontend checks
    if (!fullName.trim()) {
      setError("El nombre completo es requerido.");
      return;
    }
    if (!username.trim()) {
      setError("El nombre de usuario es requerido.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("full_name", fullName);
      formData.append("username", username);
      formData.append("city", city);
      formData.append("bio", bio);
      formData.append("phone", phone);
      formData.append("avatar_url", avatarUrl);

      const result = await updateProfile(formData);

      if (result.error) {
        setError(result.error);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Automatically hide success alert after 5s
        setTimeout(() => setSuccess(false), 5000);
      }
    });
  };

  const handleAvatarUpload = (url: string) => {
    setAvatarUrl(url);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>{error}</div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>Tu perfil se ha actualizado correctamente.</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Side: Avatar Upload */}
        <div className="w-full lg:w-1/3 flex justify-center py-4 bg-black/20 rounded-2xl border border-white/5 p-6">
          <AvatarUpload
            userId={userId}
            fullName={fullName || profile.full_name || "Usuario"}
            currentAvatarUrl={avatarUrl}
            onUploadComplete={handleAvatarUpload}
          />
        </div>

        {/* Right Side: Form Inputs */}
        <div className="flex-1 w-full space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre Completo */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-300 ml-1">Nombre Completo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                  placeholder="Ej. Juan Pérez"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-300 ml-1">Nombre de Usuario (Username)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AtSign className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                  placeholder="Ej. juan_perez"
                  required
                />
              </div>
            </div>

            {/* Ciudad */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-300 ml-1">Ciudad</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                  placeholder="Ej. Bogotá, CO"
                />
              </div>
            </div>

            {/* Teléfono */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-300 ml-1">Teléfono</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                  placeholder="Ej. +57 300 123 4567"
                />
              </div>
            </div>
          </div>

          {/* Biografía */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-300 ml-1">Biografía</label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <AlignLeft className="h-5 w-5 text-zinc-500" />
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all min-h-[120px] resize-y"
                placeholder="Cuéntanos un poco sobre ti, tus gustos o tus servicios..."
              />
            </div>
          </div>

          {/* Role Status (Read only for users) */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between text-sm">
            <span className="text-zinc-400">Tipo de Cuenta (Rol)</span>
            <span className="capitalize font-semibold text-primary-400 bg-primary-500/10 px-3 py-1 rounded-full border border-primary-500/20">
              {profile.role}
            </span>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-between items-center">
            <Link 
              href={`/dashboard/${profile.role}`}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Dashboard
            </Link>

            <button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto min-w-[200px] bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 px-6 font-semibold transition-all glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
