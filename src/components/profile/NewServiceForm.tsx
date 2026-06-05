"use client";

import { useState, useTransition } from "react";
import { createService, updateService } from "@/app/services/actions";
import { Sparkles, DollarSign, Tag, AlignLeft, FileText, Loader2, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Service } from "@/types/database.types";

const CATEGORIES = [
  { id: "dj", name: "DJs & Música" },
  { id: "bar", name: "Bares & Coctelería" },
  { id: "staff", name: "Personal de Servicio" },
  { id: "security", name: "Seguridad" },
  { id: "catering", name: "Catering & Comida" }
];

interface NewServiceFormProps {
  initialService?: Service;
}

export function NewServiceForm({ initialService }: NewServiceFormProps = {}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialService?.title || "");
  const [description, setDescription] = useState(initialService?.description || "");
  const [price, setPrice] = useState(initialService?.price?.toString() || "");
  const [category, setCategory] = useState(initialService?.category || "dj");
  const [imageUrl, setImageUrl] = useState(initialService?.image_url || "");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!title.trim()) {
      setError("El título del servicio es requerido.");
      return;
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("El precio debe ser un número mayor a cero.");
      return;
    }

    startTransition(async () => {
      const result = initialService
        ? await updateService(
            initialService.id,
            title,
            description,
            priceNum,
            category,
            imageUrl || undefined
          )
        : await createService(
            title,
            description,
            priceNum,
            category,
            imageUrl || undefined
          );

      if (result.error) {
        setError(result.error);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Redirect back to dashboard after 2s
        setTimeout(() => {
          router.push("/dashboard/provider");
          router.refresh();
        }, 2000);
      }
    });
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
            <div>{initialService ? "¡Servicio actualizado con éxito! Redirigiendo al panel..." : "¡Servicio publicado con éxito! Redirigiendo al panel..."}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {/* Título del Servicio */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-300 ml-1">Título del Servicio</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Sparkles className="h-5 w-5 text-zinc-500" />
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending || success}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-sm"
              placeholder="Ej. DJ Profesional con Equipamiento Completo"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Categoría */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-300 ml-1">Categoría</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag className="h-5 w-5 text-zinc-500" />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isPending || success}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-sm cursor-pointer"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-zinc-950 text-white">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Precio base */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-300 ml-1">Precio Base ($)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-zinc-500" />
              </div>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={isPending || success}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-sm"
                placeholder="Ej. 350"
                min="1"
                required
              />
            </div>
          </div>
        </div>

        {/* URL de la imagen */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-300 ml-1">Enlace / URL de Imagen (Opcional)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FileText className="h-5 w-5 text-zinc-500" />
            </div>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={isPending || success}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-sm"
              placeholder="https://ejemplo.com/imagen-servicio.jpg"
            />
          </div>
        </div>

        {/* Descripción */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-300 ml-1">Descripción del Servicio</label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none">
              <AlignLeft className="h-5 w-5 text-zinc-500" />
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending || success}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-sm min-h-[140px] resize-y"
              placeholder="Detalla los servicios incluidos, equipamiento disponible, requerimientos técnicos, etc."
              required
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-between items-center border-t border-white/5">
        <Link 
          href="/dashboard/provider"
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Panel
        </Link>

        <button
          type="submit"
          disabled={isPending || success}
          className="w-full sm:w-auto min-w-[200px] bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 px-6 font-semibold text-sm transition-all glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {initialService ? "Guardando..." : "Publicando..."}
            </>
          ) : (
            initialService ? "Guardar Cambios" : "Publicar Servicio"
          )}
        </button>
      </div>
    </form>
  );
}
