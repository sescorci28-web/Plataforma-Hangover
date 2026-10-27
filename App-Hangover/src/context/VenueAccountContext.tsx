import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { clubService } from '@/services/club.service';
import type { VenueAccount, VenueAccountEntry } from '@/types/venueAccount';

export interface VenueAccountContextType {
  account: VenueAccount | null;
  entries: VenueAccountEntry[];
  isLoading: boolean;
  isRefreshing: boolean;
  refreshAccount: () => Promise<void>;
  finalizeStay: () => Promise<{
    success: boolean;
    code?: string;
    error?: string;
    message?: string;
    balance?: number;
  }>;
}

const VenueAccountContext = createContext<VenueAccountContextType | null>(null);

export interface VenueAccountProviderProps {
  clubId?: string;
  clubName?: string;
  children: React.ReactNode;
}

export const VenueAccountProvider: React.FC<VenueAccountProviderProps> = ({
  clubId,
  children,
}) => {
  const [account, setAccount] = useState<VenueAccount | null>(null);
  const [entries, setEntries] = useState<VenueAccountEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Referencia para evitar actualizar estado si el componente se desmonta
  const isMountedRef = useRef<boolean>(true);

  // Consulta autoritativa al servidor
  const fetchAccountData = useCallback(async (isManualRefresh = false) => {
    if (!clubId) {
      if (isMountedRef.current) {
        setAccount(null);
        setEntries([]);
        setIsLoading(false);
        setIsRefreshing(false);
      }
      return;
    }

    if (isManualRefresh) {
      setIsRefreshing(true);
    }

    try {
      const res = await clubService.getMyActiveVenueAccount(clubId);
      if (isMountedRef.current) {
        if (!res.error) {
          setAccount(res.account);
          setEntries(res.entries || []);
        } else {
          console.warn('[VenueAccountContext] Error al consultar cuenta:', res.error);
        }
      }
    } catch (err) {
      console.error('[VenueAccountContext] Excepción al consultar cuenta:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [clubId]);

  // Carga inicial al montar o cambiar clubId
  useEffect(() => {
    isMountedRef.current = true;
    setIsLoading(true);
    fetchAccountData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchAccountData]);

  // Suscripción Realtime limpia y segura
  // REGLA CRÍTICA:
  // 1. Todos los listeners .on('postgres_changes', ...) se registran ANTES de llamar a .subscribe()
  // 2. La limpieza se retorna de forma síncrona al useEffect para que React la invoque en el desmontaje
  // 3. Se genera un topic con timestamp para evitar colisión con canales ya suscritos en caché
  useEffect(() => {
    if (!clubId) return;

    let activeChannel: RealtimeChannel | null = null;
    let isCancelled = false;

    const setupRealtimeChannel = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || isCancelled) return;

        // Nombre de canal único por instancia de suscripción
        const channelTopic = `user_venue_account_${clubId}_${user.id}_${Date.now()}`;
        const channel = supabase.channel(channelTopic);

        // REGISTRAR TODOS LOS LISTENERS ANTES DE SUBSCRIBE()
        channel
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'venue_accounts',
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              if (!isCancelled && isMountedRef.current) {
                fetchAccountData();
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'venue_account_entries',
            },
            () => {
              if (!isCancelled && isMountedRef.current) {
                fetchAccountData();
              }
            }
          );

        // Si se desmontó mientras obteníamos el usuario, no suscribir
        if (isCancelled) {
          supabase.removeChannel(channel);
          return;
        }

        // Llamar a .subscribe() ÚNICAMENTE después de haber registrado todos los listeners
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Canal listo
          }
        });

        activeChannel = channel;
      } catch (err) {
        console.warn('[VenueAccountContext] Error al configurar realtime:', err);
      }
    };

    setupRealtimeChannel();

    // LIMPIEZA SÍNCRONA
    return () => {
      isCancelled = true;
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
        activeChannel = null;
      }
    };
  }, [clubId, fetchAccountData]);

  const refreshAccount = useCallback(async () => {
    await fetchAccountData(true);
  }, [fetchAccountData]);

  const finalizeStay = useCallback(async () => {
    if (!clubId) {
      return { success: false, error: 'Identificador de discoteca no válido.' };
    }
    const result = await clubService.finalizeVenueStay(clubId);
    if (result.success) {
      if (isMountedRef.current) {
        setAccount(null);
        setEntries([]);
      }
    }
    return result;
  }, [clubId]);

  return (
    <VenueAccountContext.Provider
      value={{
        account,
        entries,
        isLoading,
        isRefreshing,
        refreshAccount,
        finalizeStay,
      }}
    >
      {children}
    </VenueAccountContext.Provider>
  );
};

export function useVenueAccount(): VenueAccountContextType {
  const ctx = useContext(VenueAccountContext);
  if (!ctx) {
    throw new Error('useVenueAccount debe ser utilizado dentro de un VenueAccountProvider');
  }
  return ctx;
}
