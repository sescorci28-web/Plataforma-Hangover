import { supabase } from '@/lib/supabase';
import { ClubInfo, MenuCategory } from '@/data/mockClubs';
import {
  ClubDetail,
  ClubMenuItem,
  ClubServiceItem,
  ClubTable,
  ClubConnectStats,
  ClubBookingItem,
} from '@/types/club.types';

const DEFAULT_CLUB_BANNER = 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80';

function isUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Calcula con precisión si la discoteca está abierta en este momento
 * tomando en cuenta la zona horaria oficial de Colombia (America/Bogota).
 */
export function isClubOpen(openingHours: string | null): boolean {
  if (!openingHours) return false;

  const now = new Date();
  let colombiaDate: Date;
  try {
    const colombiaTime = now.toLocaleString('en-US', { timeZone: 'America/Bogota' });
    colombiaDate = new Date(colombiaTime);
  } catch {
    colombiaDate = now;
  }

  const day = colombiaDate.getDay(); // 0: Dom, 1: Lun, 2: Mar, 3: Mié, 4: Jue, 5: Vie, 6: Sáb
  const hour = colombiaDate.getHours();
  const hoursLower = openingHours.toLowerCase();

  let isTargetDay = false;

  if (hoursLower.includes('lunes') || hoursLower.includes('lun')) {
    if (day === 1 || (day === 2 && hour < 6)) isTargetDay = true;
  }
  if (hoursLower.includes('martes') || hoursLower.includes('mar')) {
    if (day === 2 || (day === 3 && hour < 6)) isTargetDay = true;
  }
  if (hoursLower.includes('miércoles') || hoursLower.includes('mier') || hoursLower.includes('mié')) {
    if (day === 3 || (day === 4 && hour < 6)) isTargetDay = true;
  }
  if (hoursLower.includes('jueves') || hoursLower.includes('jue')) {
    if (day === 4 || (day === 5 && hour < 6)) isTargetDay = true;
  }
  if (hoursLower.includes('viernes') || hoursLower.includes('vier') || hoursLower.includes('vi')) {
    if (day === 5 || (day === 6 && hour < 6)) isTargetDay = true;
  }
  if (hoursLower.includes('sábado') || hoursLower.includes('sab') || hoursLower.includes('sáb')) {
    if (day === 6 || (day === 0 && hour < 6)) isTargetDay = true;
  }
  if (hoursLower.includes('domingo') || hoursLower.includes('dom')) {
    if (day === 0 || (day === 1 && hour < 6)) isTargetDay = true;
  }

  if (!isTargetDay && (hoursLower.includes('fin de semana') || hoursLower.includes('weekend'))) {
    if (day === 4 || day === 5 || day === 6 || day === 0 || (day === 1 && hour < 6)) {
      isTargetDay = true;
    }
  }

  if (!isTargetDay && !hoursLower.match(/(lunes|martes|miércoles|jueves|viernes|sábado|domingo|lun|mar|mie|jue|vie|sab|dom)/)) {
    if (day === 4 || day === 5 || day === 6 || (day === 0 && hour < 6)) {
      isTargetDay = true;
    }
  }

  const isNightHour = hour >= 20 || hour < 6;
  return isTargetDay && isNightHour;
}

/**
 * Mapea un registro real de Supabase public.clubs a la interfaz detallada ClubDetail.
 */
export function mapSupabaseClubToClubDetail(dbClub: any): ClubDetail {
  const addressParts = [dbClub.address, dbClub.city].filter(Boolean);
  const location = addressParts.length > 0 ? addressParts.join(', ') : (dbClub.city || 'Colombia');

  // Jerarquía visual: hero_image -> banner_image -> logo -> fallback
  const imageUrl = dbClub.hero_image || dbClub.banner_image || dbClub.logo || DEFAULT_CLUB_BANNER;

  const gallery: string[] = [];
  if (dbClub.banner_image && dbClub.banner_image !== imageUrl) gallery.push(dbClub.banner_image);
  if (dbClub.logo && dbClub.logo !== imageUrl && !gallery.includes(dbClub.logo)) gallery.push(dbClub.logo);
  if (Array.isArray(dbClub.gallery)) {
    dbClub.gallery.forEach((g: string) => {
      if (g && !gallery.includes(g)) gallery.push(g);
    });
  }

  const hasRealRating = Boolean(
    (typeof dbClub.rating === 'number' && dbClub.rating > 0) ||
    (typeof dbClub.reviews_count === 'number' && dbClub.reviews_count > 0)
  );

  return {
    id: dbClub.id,
    name: dbClub.name || 'Discoteca Hangover',
    slug: dbClub.slug || '',
    city: dbClub.city || 'Colombia',
    address: dbClub.address || null,
    location,
    description: dbClub.description || 'Discoteca oficial asociada a Hangover.',
    banner_image: dbClub.banner_image || null,
    hero_image: dbClub.hero_image || null,
    logo: dbClub.logo || null,
    video_hero: dbClub.video_hero || null,
    imageUrl,
    gallery,
    instagram: dbClub.instagram || null,
    whatsapp: dbClub.whatsapp || null,
    facebook: dbClub.facebook || null,
    tiktok: dbClub.tiktok || null,
    website: dbClub.website || null,
    opening_hours: dbClub.opening_hours || null,
    isOpen: isClubOpen(dbClub.opening_hours),
    rating: typeof dbClub.rating === 'number' ? dbClub.rating : 0,
    reviews_count: typeof dbClub.reviews_count === 'number' ? dbClub.reviews_count : 0,
    hasRealRating,
    cover_price: Number(dbClub.cover_price || 0),
    price_range: dbClub.price_range || '$$',
    payment_methods: Array.isArray(dbClub.payment_methods) ? dbClub.payment_methods : ['Efectivo', 'Tarjeta'],
    amenities: Array.isArray(dbClub.amenities) ? dbClub.amenities : [],
    capacity: Number(dbClub.capacity || 0),
    club_type: dbClub.club_type || 'Discoteca',
    status: dbClub.status || 'published',
    active: Boolean(dbClub.active),
    provider_id: dbClub.provider_id || null,
    owner_id: dbClub.owner_id || null,
    business_id: dbClub.business_id || null,
    enabled_modules: Array.isArray(dbClub.enabled_modules) ? dbClub.enabled_modules : ['reservations', 'covers', 'events'],
    modules_config: dbClub.modules_config || {},
  };
}

/**
 * Mapeo ligero compatible con ClubInfo para listas y catálogos.
 */
export function mapSupabaseClubToClubInfo(dbClub: any, menuCategories: MenuCategory[] = []): ClubInfo {
  const detail = mapSupabaseClubToClubDetail(dbClub);
  return {
    id: detail.id,
    name: detail.name,
    verified: true,
    location: detail.location,
    hours: detail.opening_hours || 'Jue - Sáb: 9:00 PM - 4:00 AM',
    description: detail.description || '',
    category: detail.club_type,
    rating: detail.hasRealRating ? detail.rating : 5.0,
    imageUrl: detail.imageUrl,
    gallery: detail.gallery,
    upcomingEvents: [],
    menu: menuCategories,
  };
}

export const clubService = {
  /**
   * Obtiene la lista de discotecas reales y publicadas (active = true y status = 'published').
   * Garantiza que discotecas en borrador (draft) nunca se expongan al público.
   */
  async getClubs(): Promise<{ clubs: ClubInfo[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('active', true)
        .eq('status', 'published')
        .order('name', { ascending: true });

      if (error) {
        console.error('[clubService] Error al consultar public.clubs:', error.message);
        return { clubs: [], error: error.message };
      }

      const clubs: ClubInfo[] = (data || []).map((c) => mapSupabaseClubToClubInfo(c));
      return { clubs, error: null };
    } catch (err: any) {
      console.error('[clubService] Error inesperado en getClubs:', err?.message);
      return { clubs: [], error: err?.message || 'Error al obtener discotecas.' };
    }
  },

  /**
   * Obtiene las discotecas destacadas para la pantalla principal (Home).
   */
  async getFeaturedClubs(limit = 6): Promise<{ clubs: ClubInfo[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('active', true)
        .eq('status', 'published')
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[clubService] Error al consultar clubes destacados:', error.message);
        return { clubs: [], error: error.message };
      }

      const clubs: ClubInfo[] = (data || []).map((c) => mapSupabaseClubToClubInfo(c));
      return { clubs, error: null };
    } catch (err: any) {
      console.error('[clubService] Error en getFeaturedClubs:', err?.message);
      return { clubs: [], error: err?.message || 'Error al obtener clubes destacados.' };
    }
  },

  /**
   * Obtiene los datos detallados de una discoteca por ID (UUID) o por Slug.
   * Filtra estrictamente que esté publicada y activa.
   */
  async getClubDetail(idOrSlug: string): Promise<{ club: ClubDetail | null; error: string | null }> {
    try {
      if (!idOrSlug) {
        return { club: null, error: 'Identificador no proporcionado.' };
      }

      let query = supabase.from('clubs').select('*').eq('active', true).eq('status', 'published');

      if (isUUID(idOrSlug)) {
        query = query.eq('id', idOrSlug);
      } else {
        query = query.eq('slug', idOrSlug);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('[clubService] Error consultando club detail:', error.message);
        return { club: null, error: error.message };
      }

      if (!data) {
        // Fallback: si no encontró por slug intentamos por ID si idOrSlug tuviese formato especial
        if (!isUUID(idOrSlug)) {
          const { data: fallbackData } = await supabase
            .from('clubs')
            .select('*')
            .eq('id', idOrSlug)
            .eq('active', true)
            .eq('status', 'published')
            .maybeSingle();

          if (fallbackData) {
            return { club: mapSupabaseClubToClubDetail(fallbackData), error: null };
          }
        }
        return { club: null, error: 'Discoteca no encontrada o no disponible públicamente.' };
      }

      return { club: mapSupabaseClubToClubDetail(data), error: null };
    } catch (err: any) {
      console.error('[clubService] Error inesperado en getClubDetail:', err?.message);
      return { club: null, error: err?.message || 'Error al consultar la discoteca.' };
    }
  },

  /**
   * Mantener compatibilidad con getClubById retornando ClubInfo.
   */
  async getClubById(clubId: string): Promise<{ club: ClubInfo | null; error: string | null }> {
    const { club, error } = await this.getClubDetail(clubId);
    if (!club) return { club: null, error };
    return { club: mapSupabaseClubToClubInfo(club), error: null };
  },

  /**
   * Consulta los productos de la carta reales administrados desde Hangover Business.
   */
  async getClubMenuItems(clubId: string): Promise<{ items: ClubMenuItem[]; error: string | null }> {
    try {
      if (!clubId) return { items: [], error: null };

      const { data, error } = await supabase
        .from('club_menu_items')
        .select('*')
        .eq('club_id', clubId)
        .eq('active', true)
        .order('featured', { ascending: false })
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('[clubService] Error al consultar club_menu_items:', error.message);
        return { items: [], error: error.message };
      }

      const items: ClubMenuItem[] = (data || []).map((m) => ({
        id: m.id,
        club_id: m.club_id,
        category: m.category || 'General',
        name: m.name || 'Producto',
        description: m.description || null,
        price: Number(m.price || 0),
        image_url: m.image_url || null,
        active: Boolean(m.active),
        featured: Boolean(m.featured),
        available: m.available !== false, // Por defecto true si no es explícitamente false
      }));

      return { items, error: null };
    } catch (err: any) {
      console.error('[clubService] Error inesperado en getClubMenuItems:', err?.message);
      return { items: [], error: err?.message };
    }
  },

  /**
   * Consulta los servicios especiales asociados a la discoteca.
   */
  async getClubServices(clubId: string): Promise<{ services: ClubServiceItem[]; error: string | null }> {
    try {
      if (!clubId) return { services: [], error: null };

      const { data, error } = await supabase
        .from('club_services')
        .select('*')
        .eq('club_id', clubId)
        .eq('active', true)
        .order('created_at', { ascending: true });

      if (error) {
        return { services: [], error: error.message };
      }

      const services: ClubServiceItem[] = (data || []).map((s) => ({
        id: s.id,
        club_id: s.club_id,
        name: s.name,
        description: s.description || '',
        price: s.price !== null ? Number(s.price) : null,
        active: Boolean(s.active),
      }));

      return { services, error: null };
    } catch (err: any) {
      return { services: [], error: err?.message };
    }
  },

  /**
   * Consulta las mesas y palcos reales configurados por el negocio en club_tables.
   */
  async getClubTables(clubId: string): Promise<{ tables: ClubTable[]; error: string | null }> {
    try {
      if (!clubId) return { tables: [], error: null };

      const { data, error } = await supabase
        .from('club_tables')
        .select('*')
        .eq('club_id', clubId)
        .eq('active', true)
        .order('table_number', { ascending: true });

      if (error) {
        console.error('[clubService] Error al consultar club_tables:', error.message);
        return { tables: [], error: error.message };
      }

      const tables: ClubTable[] = (data || []).map((t) => ({
        id: t.id,
        club_id: t.club_id,
        table_number: String(t.table_number || ''),
        name: t.name || (t.table_number ? `Mesa ${t.table_number}` : 'Mesa'),
        zone: t.zone || 'General',
        status: t.status || 'Libre',
        capacity: t.capacity ? Number(t.capacity) : null,
        min_spend: t.min_spend ? Number(t.min_spend) : null,
        conditions: t.conditions || null,
        active: Boolean(t.active),
      }));

      return { tables, error: null };
    } catch (err: any) {
      console.error('[clubService] Error inesperado en getClubTables:', err?.message);
      return { tables: [], error: err?.message };
    }
  },

  /**
   * Consulta las métricas reales de comunidad y presencia activa en Hangover Connect.
   */
  async getClubConnectStats(clubId: string): Promise<ClubConnectStats> {
    const defaultStats: ClubConnectStats = {
      activeConnectCount: 0,
      visibleConnectCount: 0,
      occupancyStatus: 'Baja ocupación',
      occupancyColor: '#10b981',
      attendees: [],
    };

    try {
      if (!clubId) return defaultStats;

      const nowIso = new Date().toISOString();
      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

      // Consultar usuarios activos en connect_presence
      const { data: presenceData } = await supabase
        .from('connect_presence')
        .select('id, status, check_in_at, user_id, visibility, profiles(full_name, avatar_url)')
        .eq('club_id', clubId)
        .gt('expires_at', nowIso)
        .gt('last_seen_at', fifteenMinAgo);

      const allActive = presenceData || [];
      const visible = allActive.filter((p: any) => p.visibility === 'visible');

      // Consultar sesiones abiertas en vivo para estimar ocupación
      const { count: openSessionsCount } = await supabase
        .from('live_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('club_id', clubId)
        .eq('status', 'open');

      const count = openSessionsCount || allActive.length;
      let occupancyStatus: 'Baja ocupación' | 'Ocupación media' | 'Alta ocupación' = 'Baja ocupación';
      let occupancyColor = '#10b981';

      if (count >= 8) {
        occupancyStatus = 'Alta ocupación';
        occupancyColor = '#ef4444';
      } else if (count >= 3) {
        occupancyStatus = 'Ocupación media';
        occupancyColor = '#f59e0b';
      }

      const attendees = visible.slice(0, 12).map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        fullName: p.profiles?.full_name || 'Asistente Connect',
        avatarUrl: p.profiles?.avatar_url || null,
        status: p.status || null,
        checkInAt: p.check_in_at,
      }));

      return {
        activeConnectCount: allActive.length,
        visibleConnectCount: visible.length,
        occupancyStatus,
        occupancyColor,
        attendees,
      };
    } catch {
      return defaultStats;
    }
  },

  /**
   * Crea una solicitud real de reserva VIP en public.bookings.
   */
  async createClubBooking(params: {
    clubId: string;
    clubSlug?: string;
    providerId?: string | null;
    ownerId?: string | null;
    customerName: string;
    reservationDate: string;
    guestCount: number;
    tableZone?: string;
    tableNumber?: string;
    comment?: string;
  }): Promise<{ success: boolean; bookingId?: string; error?: string }> {
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        return {
          success: false,
          error: 'Debes iniciar sesión con tu cuenta para solicitar una reserva.',
        };
      }

      if (!params.customerName.trim()) {
        return { success: false, error: 'Ingresa el nombre del cliente.' };
      }

      if (!params.reservationDate) {
        return { success: false, error: 'Selecciona la fecha de reserva.' };
      }

      if (params.guestCount < 1) {
        return { success: false, error: 'La cantidad de personas debe ser al menos 1.' };
      }

      // Generar token QR único
      const timePart = Date.now().toString(36).toUpperCase();
      const randPart = Math.random().toString(36).substring(2, 7).toUpperCase();
      const qrCode = `HGVR-VIP-${timePart}-${randPart}`;

      const notesParts = [
        `Cliente: ${params.customerName.trim()}`,
        `Personas: ${params.guestCount}`,
      ];
      if (params.tableZone) notesParts.push(`Zona: ${params.tableZone}`);
      if (params.tableNumber) notesParts.push(`Mesa: ${params.tableNumber}`);
      if (params.comment?.trim()) notesParts.push(`Nota: ${params.comment.trim()}`);

      const targetProvider = params.providerId || params.ownerId || user.id;

      const payload: any = {
        user_id: user.id,
        provider_id: targetProvider,
        club_id: params.clubId,
        club_slug: params.clubSlug || '',
        booking_type: 'club_vip',
        reservation_date: params.reservationDate,
        event_date: params.reservationDate,
        event_time: '21:00:00',
        number_of_people: params.guestCount,
        total_amount: 0,
        notes: notesParts.join(' | '),
        status: 'pending',
        qr_code: qrCode,
        qr_status: 'active',
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert(payload)
        .select('id')
        .single();

      if (error) {
        console.error('[clubService] Error creando reserva VIP:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true, bookingId: data?.id };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al procesar la reserva.' };
    }
  },

  /**
   * Registra la adquisición de un Cover para el club en public.bookings.
   */
  async buyClubCover(params: {
    clubId: string;
    clubSlug?: string;
    providerId?: string | null;
    ownerId?: string | null;
    customerName: string;
    visitDate: string;
    guestCount: number;
    coverPrice: number;
  }): Promise<{ success: boolean; bookingId?: string; error?: string }> {
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        return {
          success: false,
          error: 'Debes iniciar sesión con tu cuenta para comprar entradas de cover.',
        };
      }

      const total = params.guestCount * params.coverPrice;
      const timePart = Date.now().toString(36).toUpperCase();
      const randPart = Math.random().toString(36).substring(2, 7).toUpperCase();
      const qrCode = `HGVR-COV-${timePart}-${randPart}`;

      const targetProvider = params.providerId || params.ownerId || user.id;

      const payload: any = {
        user_id: user.id,
        provider_id: targetProvider,
        club_id: params.clubId,
        club_slug: params.clubSlug || '',
        booking_type: 'club_cover',
        reservation_date: params.visitDate,
        event_date: params.visitDate,
        event_time: '21:00:00',
        number_of_people: params.guestCount,
        total_amount: total,
        notes: `Cliente: ${params.customerName.trim()} | Compra de Cover (${params.guestCount} pers. x $${params.coverPrice})`,
        status: 'pending',
        qr_code: qrCode,
        qr_status: 'active',
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert(payload)
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, bookingId: data?.id };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al adquirir cover.' };
    }
  },

  /**
   * Consulta las reservas realizadas por el usuario actual en esta discoteca.
   */
  async getUserClubBookings(clubId: string): Promise<ClubBookingItem[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !clubId) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((b) => ({
        id: b.id,
        user_id: b.user_id,
        club_id: b.club_id,
        provider_id: b.provider_id,
        booking_type: b.booking_type,
        reservation_date: b.reservation_date || b.event_date || '',
        number_of_people: b.number_of_people || 1,
        notes: b.notes || '',
        status: b.status || 'pending',
        total_amount: Number(b.total_amount || 0),
        qr_code: b.qr_code,
        qr_status: b.qr_status,
        created_at: b.created_at,
      }));
    } catch {
      return [];
    }
  },
};
