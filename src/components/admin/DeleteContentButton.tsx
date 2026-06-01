"use client";

import { useTransition, useState } from "react";
import { deleteService, deleteEvent, deleteClub } from "@/app/(dashboard)/dashboard/admin/actions";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";

interface DeleteContentButtonProps {
  id: string;
  type: "service" | "event" | "club";
  itemName: string;
}

export function DeleteContentButton({ id, type, itemName }: DeleteContentButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      let result;
      if (type === "service") {
        result = await deleteService(id);
      } else if (type === "event") {
        result = await deleteEvent(id);
      } else if (type === "club") {
        result = await deleteClub(id);
      }

      if (result && result.error) {
        setError(result.error);
      } else {
        setConfirming(false);
      }
    });
  };

  const handleCancel = () => {
    setError(null);
    setConfirming(false);
  };

  if (!confirming) {
    return (
      <div className="flex items-center justify-end gap-2">
        {error && (
          <span className="text-xs text-red-400 max-w-[200px] truncate" title={error}>
            {error}
          </span>
        )}
        <button
          onClick={() => setConfirming(true)}
          className="p-1.5 text-red-500/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
          title={`Eliminar ${itemName}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <button
          onClick={handleCancel}
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
      {error && (
        <span className="text-[10px] text-red-400 text-right max-w-[250px] leading-tight block mt-1" title={error}>
          {error}
        </span>
      )}
    </div>
  );
}
