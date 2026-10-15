import { supabase } from '@/lib/supabase';

export interface UserBookingTicket {
  id: string;
  user_id: string;
  event_id: string | null;
  club_id: string | null;
  ticket_batch_id: string | null;
  total_amount: number | null;
  status: string;
  qr_code: string | null;
  qr_status: 'active' | 'used' | 'cancelled' | string;
  qr_validated_at: string | null;
  event_date: string | null;
  event_time: string | null;
  event_name: string | null;
  created_at: string;
  updated_at?: string;
  event?: {
    id: string;
    title: string;
    date: string | null;
    start_time: string | null;
    images: string[] | null;
    club?: {
      id: string;
      name: string;
      city: string | null;
    } | null;
  } | null;
  club?: {
    id: string;
    name: string;
    city: string | null;
  } | null;
  ticket_batch?: {
    id: string;
    name: string;
    price: number | null;
    description: string | null;
  } | null;
}

export const ticketService = {
  /**
   * Obtiene exclusivamente las reservas/entradas compradas por el usuario autenticado desde public.bookings.
   * La consulta se vincula estrictamente a auth.uid().
   */
  async getMyTickets(): Promise<{ tickets: UserBookingTicket[]; error: string | null }> {
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        return { tickets: [], error: 'Usuario no autenticado.' };
      }

      // Consulta relacional sobre la tabla real public.bookings
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          user_id,
          event_id,
          club_id,
          total_amount,
          status,
          qr_code,
          qr_status,
          qr_validated_at,
          event_date,
          event_time,
          event_name,
          notes,
          created_at,
          updated_at,
          events:event_id (
            id,
            title,
            event_date,
            opening_time,
            image_url,
            creator_id
          ),
          clubs:club_id (
            id,
            name,
            city
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback seguro a consulta directa de bookings si difieren alias de claves foráneas
        const { data: simpleData, error: simpleErr } = await supabase
          .from('bookings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (simpleErr) {
          return { tickets: [], error: simpleErr.message };
        }

        const formattedFallback: UserBookingTicket[] = (simpleData || []).map((b: any) => ({
          id: b.id,
          user_id: b.user_id,
          event_id: b.event_id || null,
          club_id: b.club_id || null,
          ticket_batch_id: null,
          total_amount: b.total_amount ? Number(b.total_amount) : null,
          status: b.status || 'PAID',
          qr_code: b.qr_code || b.id,
          qr_status: b.qr_status || 'active',
          qr_validated_at: b.qr_validated_at || null,
          event_date: b.event_date || b.reservation_date || null,
          event_time: b.event_time || null,
          event_name: b.event_name || 'Entrada Hangover',
          created_at: b.created_at || new Date().toISOString(),
          updated_at: b.updated_at,
        }));

        return { tickets: formattedFallback, error: null };
      }

      const tickets: UserBookingTicket[] = (data || []).map((item: any) => {
        const rawEvent = Array.isArray(item.events) ? item.events[0] : item.events;
        const rawClub = item.clubs 
          ? (Array.isArray(item.clubs) ? item.clubs[0] : item.clubs)
          : (rawEvent?.clubs ? (Array.isArray(rawEvent.clubs) ? rawEvent.clubs[0] : rawEvent.clubs) : null);

        return {
          id: item.id,
          user_id: item.user_id,
          event_id: item.event_id,
          club_id: item.club_id,
          ticket_batch_id: null,
          total_amount: item.total_amount ? Number(item.total_amount) : null,
          status: item.status || 'PAID',
          qr_code: item.qr_code || item.id,
          qr_status: item.qr_status || 'active',
          qr_validated_at: item.qr_validated_at,
          event_date: item.event_date || rawEvent?.event_date || null,
          event_time: item.event_time || rawEvent?.opening_time || null,
          event_name: item.event_name || rawEvent?.title || 'Entrada Hangover',
          created_at: item.created_at,
          updated_at: item.updated_at,
          event: rawEvent ? {
            id: rawEvent.id,
            title: rawEvent.title || 'Evento Hangover',
            date: rawEvent.event_date || null,
            start_time: rawEvent.opening_time || null,
            images: rawEvent.image_url ? [rawEvent.image_url] : null,
            club: rawClub ? {
              id: rawClub.id,
              name: rawClub.name || 'Club Hangover',
              city: rawClub.city || null,
            } : null
          } : null,
          club: rawClub ? {
            id: rawClub.id,
            name: rawClub.name || 'Club Hangover',
            city: rawClub.city || null,
          } : null,
          ticket_batch: item.notes ? {
            id: 'batch-info',
            name: item.notes.replace('Lote: ', ''),
            price: item.total_amount ? Number(item.total_amount) : null,
            description: null,
          } : null
        };
      });

      return { tickets, error: null };
    } catch (err: any) {
      return { tickets: [], error: err?.message || 'Error al obtener tus entradas desde public.bookings.' };
    }
  }
};
