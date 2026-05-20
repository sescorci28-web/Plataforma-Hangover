"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "@/app/(dashboard)/dashboard/admin/actions";
import { UserRole } from "@/types/database.types";
import { Loader2, Check } from "lucide-react";

interface RoleSelectorProps {
  userId: string;
  currentRole: UserRole;
  currentAdminId: string;
}

export function RoleSelector({ userId, currentRole, currentAdminId }: RoleSelectorProps) {
  const [role, setRole] = useState<UserRole>(currentRole);
  const [isPending, startTransition] = useTransition();
  const [showCheck, setShowCheck] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole;
    setError(null);
    setShowCheck(false);

    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);

      if (result.error) {
        setError(result.error);
        // Revert role in select dropdown
        setRole(currentRole);
      } else {
        setRole(newRole);
        setShowCheck(true);
        setTimeout(() => setShowCheck(false), 3000);
      }
    });
  };

  const isSelf = userId === currentAdminId;

  return (
    <div className="flex items-center gap-2 relative">
      <select
        value={role}
        onChange={handleChange}
        disabled={isPending || isSelf}
        className="bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed font-medium cursor-pointer"
      >
        <option value="user">Usuario</option>
        <option value="provider">Proveedor</option>
        <option value="admin">Administrador</option>
      </select>

      {isPending && <Loader2 className="w-3.5 h-3.5 text-primary-400 animate-spin absolute -right-6" />}
      {showCheck && <Check className="w-3.5 h-3.5 text-emerald-400 absolute -right-6" />}
      
      {error && (
        <div className="absolute top-full left-0 z-10 mt-1 bg-red-950/90 border border-red-500/30 text-red-300 text-[10px] px-2 py-1 rounded shadow-lg max-w-[200px]">
          {error}
        </div>
      )}

      {isSelf && (
        <span className="text-[10px] text-zinc-500 italic block mt-1">(Tú)</span>
      )}
    </div>
  );
}
