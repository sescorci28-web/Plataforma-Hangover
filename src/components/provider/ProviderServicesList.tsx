"use client";

import { useTransition, useState } from "react";
import { deleteService } from "@/app/services/actions";
import { Edit2, Trash2, Loader2, AlertTriangle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Service {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  subcategory?: string | null;
  image_url: string | null;
}

interface ProviderServicesListProps {
  services: Service[];
}

export function ProviderServicesList({ services }: ProviderServicesListProps) {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showConfirmId, setShowConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setError(null);
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteService(id);
      if (result.error) {
        setError(result.error);
        setDeletingId(null);
      } else {
        setShowConfirmId(null);
        setDeletingId(null);
      }
    });
  };

  if (!services || services.length === 0) {
    return (
      <div className="text-center py-10 text-zinc-500 text-sm border border-dashed border-white/10 rounded-xl">
        No tienes servicios publicados en el marketplace.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => {
          const isConfirming = showConfirmId === service.id;
          const isDeletingThis = deletingId === service.id;

          return (
            <div
              key={service.id}
              className="glass-card p-5 bg-black/40 rounded-xl border border-white/5 flex flex-col justify-between h-56 relative overflow-hidden group"
            >
              {/* Confirm Delete Overlay */}
              <AnimatePresence>
                {isConfirming && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-zinc-950/95 z-10 flex flex-col items-center justify-center p-4 text-center space-y-3"
                  >
                    <AlertTriangle className="w-8 h-8 text-red-500 animate-bounce" />
                    <p className="text-xs font-semibold text-white">¿Seguro que deseas eliminar este servicio?</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowConfirmId(null)}
                        disabled={isPending}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-zinc-300 text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        disabled={isPending}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        {isDeletingThis ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Eliminar"
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Service details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-primary-400 capitalize">
                    {service.subcategory || service.category}
                  </span>
                  <span className="text-md font-bold text-white font-outfit">${service.price}</span>
                </div>
                <h3 className="text-md font-bold text-white group-hover:text-primary-400 transition-colors truncate">
                  {service.title}
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-3">
                  {service.description || "Sin descripción."}
                </p>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between mt-auto">
                <span className="text-[10px] text-zinc-500">ID: {service.id.substring(0, 8)}...</span>
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/provider/edit-service/${service.id}`}
                    className="p-2 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-xs cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-primary-400" />
                    Editar
                  </Link>
                  <button
                    onClick={() => setShowConfirmId(service.id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors flex items-center gap-1 text-xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
