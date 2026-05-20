"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  fullName: string;
  onUploadComplete: (url: string) => void;
}

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  fullName,
  onUploadComplete,
}: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    if (!name) return "H";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("La imagen debe pesar menos de 2MB.");
      return;
    }

    // Validate type
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten archivos de imagen.");
      return;
    }

    setIsUploading(true);
    setError(null);

    const supabase = createClient();
    const fileExt = file.name.split(".").pop();
    const fileName = `avatar-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    try {
      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // 2. Get Public URL
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      
      const publicUrl = data.publicUrl;
      setAvatarUrl(publicUrl);
      onUploadComplete(publicUrl);
    } catch (err: any) {
      console.error("Error uploading avatar:", err);
      setError(err.message || "Error al subir la imagen. Verifica las políticas de almacenamiento.");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div 
        onClick={triggerFileInput}
        className="relative group w-32 h-32 rounded-full overflow-hidden cursor-pointer bg-zinc-800 border-2 border-white/10 hover:border-primary-500/50 transition-all flex items-center justify-center shadow-lg"
      >
        <AnimatePresence mode="wait">
          {avatarUrl ? (
            <motion.img
              key="image"
              src={avatarUrl}
              alt={fullName}
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          ) : (
            <motion.div
              key="fallback"
              className="w-full h-full bg-gradient-to-br from-primary-950/80 to-accent-950/80 flex items-center justify-center text-3xl font-bold text-white font-outfit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {getInitials(fullName)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Camera className="w-6 h-6 text-white mb-1" />
          <span className="text-[10px] text-zinc-300 font-medium font-sans">CAMBIAR FOTO</span>
        </div>

        {/* Loading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="image/*"
        disabled={isUploading}
        className="hidden"
      />

      {error && (
        <span className="text-xs text-red-400 text-center max-w-[200px]">
          {error}
        </span>
      )}

      <p className="text-xs text-zinc-500">
        Recomendado: JPG, PNG. Máx. 2MB
      </p>
    </div>
  );
}
