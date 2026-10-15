import { supabase } from '@/lib/supabase';
import { EventInfo, TicketBatch } from '@/data/mockEvents';

/**
 * Mapea un registro crudo de la tabla public.events (y sus event_ticket_batches) a la interfaz EventInfo utilizada por la UI.
 */
export function mapSupabaseEventToEventInfo(dbEvent: any): EventInfo {
  const eventDateObj = dbEvent.event_date ? new Date(dbEvent.event_date) : new Date();

  // Formato elegante de fecha y hora en español (ej: "MIÉ, 28 OCT • 10:00 PM")
  let displayDate = 'Fecha por confirmar';
  try {
    const dateFormatted = eventDateObj.toLocaleDateString('es-CO', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    }).toUpperCase();
    const timeFormatted = eventDateObj.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    displayDate = `${dateFormatted} • ${timeFormatted}`;
  } catch (e) {
    displayDate = dbEvent.event_date || 'Fecha por confirmar';
  }

  // Mapear lotes de entradas si existen en la tabla relacional event_ticket_batches
  let mappedBatches: TicketBatch[] = [];
  const isFreeEvent = dbEvent.event_type === 'free' || Boolean(dbEvent.is_free_entry) || !dbEvent.ticketing_enabled;

  if (Array.isArray(dbEvent.event_ticket_batches) && dbEvent.event_ticket_batches.length > 0) {
    mappedBatches = dbEvent.event_ticket_batches.map((b: any) => ({
      id: b.id, // UUID REAL DE SUPABASE
      name: b.name || 'Entrada General',
      description: b.description || 'Acceso general al evento.',
      price: Number(b.price ?? dbEvent.ticket_price ?? 0),
      capacity: Number(b.capacity ?? 0),
      soldCount: Number(b.sold_count ?? 0),
      status: (b.status === 'sold_out' || b.status === 'coming_soon') ? b.status : 'active',
      maxPerOrder: 6,
    }));
  } else if (!isFreeEvent && Number(dbEvent.ticket_price ?? 0) > 0) {
    // Si el evento requiere entradas pero no tiene lotes detallados, solo mapear si no es gratuito
    mappedBatches = [
      {
        id: dbEvent.id,
        name: 'Entrada General',
        description: dbEvent.ticket_card_description || 'Acceso oficial al evento.',
        price: Number(dbEvent.ticket_price ?? 0),
        capacity: Number(dbEvent.capacity ?? 0),
        soldCount: 0,
        status: 'active',
        maxPerOrder: 6,
      },
    ];
  }

  return {
    id: dbEvent.id, // UUID REAL PROVENIENTE DE SUPABASE
    title: dbEvent.title || 'Evento Hangover',
    date: displayDate,
    dateISO: dbEvent.event_date || new Date().toISOString(),
    location: dbEvent.location || 'Lugar por confirmar',
    openTime: dbEvent.opening_time || '10:00 PM',
    closeTime: dbEvent.closing_time || '4:00 AM',
    dressCode: dbEvent.dress_code || 'Casual Premium',
    minAge: dbEvent.min_age ? `+${dbEvent.min_age} años` : 'Exclusivo +18',
    category: dbEvent.category || 'Fiesta',
    imageUrl: dbEvent.image_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
    description: dbEvent.description || 'Evento oficial publicado en la plataforma Hangover.',
    attendeeCount: Number(dbEvent.attendee_count ?? 0),
    capacity: Number(dbEvent.capacity ?? 200),
    views: Number(dbEvent.views ?? 0),
    rating: Number(dbEvent.average_rating ?? 5.0),
    reviewsCount: Number(dbEvent.reviews_count ?? 0),
    isFeatured: Boolean(dbEvent.is_featured),
    isTrending: Boolean(dbEvent.is_sponsored || dbEvent.is_featured),
    ticketBatches: mappedBatches,
    lineup: [],
    amenities: {
      hasParking: Boolean(dbEvent.has_parking),
      hasVipZone: Boolean(dbEvent.has_vip_zone),
      hasTablesModule: Boolean(dbEvent.has_tables_module),
      isAdultsOnly: Boolean(dbEvent.is_adults_only),
      isFreeEntry: Boolean(dbEvent.is_free_entry),
    },
    organizer: {
      id: dbEvent.creator_id || 'organizer-hangover',
      name: 'Organizador Verificado',
      bio: 'Productor oficial en la plataforma Hangover.',
      avatarUrl: null,
      instagram: 'hangover.app',
      eventsCount: 1,
      rating: 5.0,
    },
    relatedEventIds: [],
    faqs: [
      {
        question: '¿Cómo obtengo mi entrada?',
        answer: 'Al confirmar tu compra, tu entrada se registrará automáticamente en Supabase y tu código QR estará disponible en tu Perfil.',
      },
    ],
  };
}

export const eventService = {
  /**
   * Obtiene la lista completa de eventos REALES y PUBLICADOS desde public.events en Supabase.
   */
  async getEvents(): Promise<{ events: EventInfo[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*, event_ticket_batches(*)')
        .eq('status', 'published')
        .order('event_date', { ascending: true });

      if (error) {
        console.error('[eventService] Error al consultar public.events:', error.message);
        return { events: [], error: error.message };
      }

      const events: EventInfo[] = (data || []).map(mapSupabaseEventToEventInfo);
      return { events, error: null };
    } catch (err: any) {
      console.error('[eventService] Error inesperado:', err?.message);
      return { events: [], error: err?.message || 'Error al obtener eventos reales.' };
    }
  },

  /**
   * Obtiene los eventos publicados de una discoteca específica por su club_id.
   */
  async getEventsByClubId(clubId: string): Promise<{ events: EventInfo[]; error: string | null }> {
    try {
      if (!clubId) {
        return { events: [], error: 'ID de club no proporcionado.' };
      }

      const { data, error } = await supabase
        .from('events')
        .select('*, event_ticket_batches(*)')
        .eq('club_id', clubId)
        .eq('status', 'published')
        .order('event_date', { ascending: true });

      if (error) {
        console.error('[eventService] Error al consultar eventos del club:', error.message);
        return { events: [], error: error.message };
      }

      const events: EventInfo[] = (data || []).map(mapSupabaseEventToEventInfo);
      return { events, error: null };
    } catch (err: any) {
      console.error('[eventService] Error inesperado:', err?.message);
      return { events: [], error: err?.message || 'Error al obtener eventos del club.' };
    }
  },

  /**
   * Obtiene un evento REAL individual desde public.events en Supabase por su UUID.
   */
  async getEventById(eventId: string): Promise<{ event: EventInfo | null; error: string | null }> {
    try {
      if (!eventId) {
        return { event: null, error: 'ID de evento no proporcionado.' };
      }

      const { data, error } = await supabase
        .from('events')
        .select('*, event_ticket_batches(*)')
        .eq('id', eventId)
        .single();

      if (error || !data) {
        // Fallback a buscar entre todos si single falla por algún motivo de relación
        const { data: listData } = await supabase
          .from('events')
          .select('*, event_ticket_batches(*)')
          .eq('id', eventId);

        if (listData && listData.length > 0) {
          return { event: mapSupabaseEventToEventInfo(listData[0]), error: null };
        }

        return { event: null, error: error?.message || 'Evento no encontrado en Supabase.' };
      }

      return { event: mapSupabaseEventToEventInfo(data), error: null };
    } catch (err: any) {
      return { event: null, error: err?.message || 'Error al consultar el evento.' };
    }
  },
};
