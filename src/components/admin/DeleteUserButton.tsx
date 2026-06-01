"use client";

import { useTransition, useState } from "react";
import { deleteUser } from "@/app/(dashboard)/dashboard/admin/actions";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (result.error) {
        setError(result.error);
        setConfirming(false);
      }
    });
  };

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="p-1.5 text-red-500/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
        title={`Eliminar ${userName}`}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-400">{error}</span>}
      <button
        onClick={() => setConfirming(false)}
        disabled={isPending}
        className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg transition-colors cursor-pointer"
      >
        Cancelar
      </button>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="px-2 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
      >
        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />}
        Eliminar
      </button>
    </div>
  );
}
