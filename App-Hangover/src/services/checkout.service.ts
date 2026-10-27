import { supabase } from '@/lib/supabase';

function isUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function formatPostgresDate(rawDate?: string | null): string | null {
  if (!rawDate) return null;
  const clean = rawDate.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return null;
}

export interface SimulateCheckoutParams {
  eventId: string;
  ticketBatchId?: string | null;
  unitPrice?: number;
  quantity: number;
  ticketBatchName?: string | null;
}

export interface CheckoutResult {
  success: boolean;
  booking?: any;
  qrCode?: string;
  subtotal?: number;
  serviceFee?: number;
  totalAmount?: number;
  error?: string;
}

export const checkoutService = {
  /**
   * Simula el pago de accesos de manera segura y crea la entrada REAL en public.bookings.
   * - Obtiene la fecha REAL (event_date), hora (start_time) y datos del evento desde public.events.
   * - Si falta la fecha real o el evento en Supabase, detiene el proceso e informa el error sin insertar registros incompletos.
   * - Asigna la boleta a auth.uid().
   * - Calcula el precio verificado + 5% de cargo por servicio.
   * - Asigna el qr_code único token e inicia qr_status = 'active'.
   */
  async simulateCheckoutPayment(params: SimulateCheckoutParams): Promise<CheckoutResult> {
    try {
      // 1. Obtener usuario autenticado directamente desde Supabase Auth
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        return {
          success: false,
          error: 'Debes haber iniciado sesión con tu cuenta de usuario para confirmar la compra.'
        };
      }

      // 2. Validar event_id real de Supabase
      if (!isUUID(params.eventId)) {
        return {
          success: false,
          error: 'No se pudo completar la compra: El evento no posee un UUID válido en Supabase.'
        };
      }

      // 3. Consultar la fecha (event_date) y datos REALES del evento desde public.events
      const { data: realEvent, error: fetchErr } = await supabase
        .from('events')
        .select('id, title, event_date, opening_time, ticket_price, creator_id, club_id')
        .eq('id', params.eventId)
        .single();

      if (fetchErr || !realEvent) {
        return {
          success: false,
          error: `No se pudo obtener la información real del evento desde Supabase: ${fetchErr?.message || 'Evento no encontrado'}`
        };
      }

      // Validar obligatoriamente la fecha real del evento (event_date)
      const validEventDate = formatPostgresDate(realEvent.event_date);
      if (!validEventDate) {
        return {
          success: false,
          error: 'No se pudo registrar la entrada: El evento en Supabase no tiene una fecha (event_date) válida registrada.'
        };
      }

      const qty = Math.max(1, params.quantity || 1);
      let officialUnitPrice = Math.max(0, params.unitPrice || 0);
      if (officialUnitPrice === 0 && realEvent.ticket_price) {
        officialUnitPrice = Number(realEvent.ticket_price);
      }
      let ticketBatchName = params.ticketBatchName || 'Entrada General';

      // 4. Si ticketBatchId es un UUID válido de la base de datos, validar precio y disponibilidad real en public.event_ticket_batches
      if (isUUID(params.ticketBatchId)) {
        const { data: batchData } = await supabase
          .from('event_ticket_batches')
          .select('id, price, capacity, sold_count, status, name')
          .eq('id', params.ticketBatchId)
          .single();

        if (batchData) {
          if (batchData.status === 'sold_out' || (batchData.capacity - (batchData.sold_count || 0)) < qty) {
            return {
              success: false,
              error: 'Entradas agotadas para el lote seleccionado.'
            };
          }

          if (batchData.price !== undefined && batchData.price !== null) {
            officialUnitPrice = Number(batchData.price);
          }
          if (batchData.name) {
            ticketBatchName = batchData.name;
          }
        }
      }

      // 5. Cálculo oficial de precios (Subtotal + 5% Service Fee)
      const subtotal = officialUnitPrice * qty;
      const serviceFee = Math.round(subtotal * 0.05);
      const totalAmount = subtotal + serviceFee;

      // 6. Generación de Token QR único inconfundible
      const timePart = Date.now().toString(36).toUpperCase();
      const randPart = Math.random().toString(36).substring(2, 7).toUpperCase();
      const qrToken = `HGVR-${timePart}-${randPart}`;

      // Determinar hora del evento desde opening_time o desde event_date
      let validEventTime = '00:00:00';
      if (realEvent.opening_time) {
        validEventTime = realEvent.opening_time;
      } else if (realEvent.event_date) {
        const parsedDate = new Date(realEvent.event_date);
        if (!isNaN(parsedDate.getTime())) {
          validEventTime = parsedDate.toTimeString().split(' ')[0] || '00:00:00';
        }
      }

      // 7. Construcción del Payload utilizando exclusivamente columnas existentes en public.bookings
      const bookingPayload: any = {
        user_id: user.id,
        club_id: realEvent.club_id || null,
        event_id: realEvent.id,
        provider_id: realEvent.creator_id || user.id,
        event_name: realEvent.title || 'Evento Hangover',
        event_date: validEventDate, // FECHA REAL OBTENIDA DE PUBLIC.EVENTS
        reservation_date: validEventDate,
        event_time: validEventTime,
        number_of_people: qty,
        total_amount: totalAmount,
        status: 'PAID',
        qr_code: qrToken,
        qr_status: 'active',
        notes: `Lote: ${ticketBatchName}`,
        created_at: new Date().toISOString(),
      };

      // 8. Inserción del Booking Real en Supabase
      const { data: insertedBooking, error: insertErr } = await supabase
        .from('bookings')
        .insert(bookingPayload)
        .select()
        .single();

      if (insertErr) {
        return {
          success: false,
          error: `Error al registrar la entrada en Supabase: ${insertErr.message}`
        };
      }

      return {
        success: true,
        booking: insertedBooking,
        qrCode: qrToken,
        subtotal,
        serviceFee,
        totalAmount,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Error inesperado al procesar el booking.'
      };
    }
  }
};
