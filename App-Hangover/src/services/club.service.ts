import { supabase } from '@/lib/supabase';
import { ClubInfo, MenuCategory } from '@/data/mockClubs';
import {
  ClubDetail,
  ClubMenuItem,
  ClubServiceItem,
  ClubTable,
  ClubConnectStats,
  ClubBookingItem,
  VenueOrder,
  VenueOrderItem,
  ClubReview,
  ClubReviewsSummary,
  ClubReviewEligibility,
} from '@/types/club.types';
import type { VenueAccount, VenueAccountEntry } from '@/types/venueAccount';

const DEFAULT_CLUB_BANNER = 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80';

function isUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export function formatCategoryName(category?: string | null): string {
  if (!category || !category.trim()) return 'General';
  const clean = category.trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

export function formatProductImageUrl(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const { data } = supabase.storage.from('club-media').getPublicUrl(trimmed);
  return data?.publicUrl || trimmed;
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
    isOpen:
      typeof dbClub.is_open === 'boolean'
        ? dbClub.is_open
        : typeof dbClub.modules_config?.is_open === 'boolean'
          ? dbClub.modules_config.is_open
          : isClubOpen(dbClub.opening_hours),
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
   * Unifica y sincroniza:
   * 1. public.menu_products (administrada por la APK de Hangover Business)
   * 2. public.club_menu_items (administrada por el Dashboard Web)
   */
  async getClubMenuItems(clubId: string): Promise<{ items: ClubMenuItem[]; error: string | null }> {
    try {
      if (!clubId) return { items: [], error: null };

      const cleanClubId = clubId.trim();

      // 1. Consultar productos creados desde la APK de Hangover Business (public.menu_products)
      const mpPromise = supabase
        .from('menu_products')
        .select('id, club_id, name, description, image_url, product_type, base_price, is_available, is_featured, status, display_order, created_at, category:menu_categories(id, name)')
        .eq('club_id', cleanClubId)
        .eq('status', 'published');

      // 2. Consultar productos registrados en public.club_menu_items
      const cmiPromise = supabase
        .from('club_menu_items')
        .select('id, club_id, category, name, description, price, image_url, active, featured, available, created_at')
        .eq('club_id', cleanClubId)
        .eq('active', true);

      const [mpRes, cmiRes] = await Promise.all([mpPromise, cmiPromise]);

      if (mpRes.error && cmiRes.error) {
        console.error('[clubService] Error al consultar la carta:', mpRes.error.message, cmiRes.error.message);
        return { items: [], error: mpRes.error.message || cmiRes.error.message };
      }

      if (mpRes.error) {
        console.warn('[clubService] Advertencia al consultar menu_products:', mpRes.error.message);
      }
      if (cmiRes.error) {
        console.warn('[clubService] Advertencia al consultar club_menu_items:', cmiRes.error.message);
      }

      // Mapear productos de menu_products (APK Business)
      const mpItems: ClubMenuItem[] = (mpRes.data || []).map((p: any) => {
        const rawCategory = p.category?.name || p.product_type || 'General';
        return {
          id: p.id,
          club_id: p.club_id,
          category: formatCategoryName(rawCategory),
          name: (p.name || 'Producto').trim(),
          description: p.description || null,
          price: Number(p.base_price || 0),
          image_url: formatProductImageUrl(p.image_url),
          active: p.status === 'published',
          featured: Boolean(p.is_featured),
          available: p.is_available !== false,
        };
      });

      // Mapear productos de club_menu_items (Dashboard Web / Legacy)
      const cmiItems: ClubMenuItem[] = (cmiRes.data || []).map((m: any) => {
        return {
          id: m.id,
          club_id: m.club_id,
          category: formatCategoryName(m.category),
          name: (m.name || 'Producto').trim(),
          description: m.description || null,
          price: Number(m.price || 0),
          image_url: formatProductImageUrl(m.image_url),
          active: Boolean(m.active),
          featured: Boolean(m.featured),
          available: m.available !== false,
        };
      });

      // Unificación y deduplicación estricta:
      // Si un producto existe en public.menu_products (autoritativa de Business), se prioriza su ID.
      // Si un producto de club_menu_items coincide en nombre con uno publicado, se mapea su ID a menu_products.
      const mpByName = new Map<string, ClubMenuItem>();
      mpItems.forEach((item) => {
        mpByName.set(item.name.toLowerCase().trim(), item);
      });

      const sanitizedCmi: ClubMenuItem[] = [];
      cmiItems.forEach((cmi) => {
        const cleanName = cmi.name.toLowerCase().trim();
        const existingMp = mpByName.get(cleanName);
        if (existingMp) {
          // Ya existe en menu_products como publicado; no duplicar
          return;
        }
        sanitizedCmi.push(cmi);
      });

      const combined = [...mpItems, ...sanitizedCmi];

      // Ordenar: destacados primero, luego categoría, luego nombre
      combined.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.name.localeCompare(b.name);
      });

      return { items: combined, error: null };
    } catch (err: any) {
      console.error('[clubService] Error inesperado en getClubMenuItems:', err?.message);
      return { items: [], error: err?.message || 'Error inesperado al consultar la carta.' };
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
        status: 'PENDING',
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
        status: 'PENDING',
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
        status: b.status || 'PENDING',
        total_amount: Number(b.total_amount || 0),
        qr_code: b.qr_code,
        qr_status: b.qr_status,
        created_at: b.created_at,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Cancela una solicitud de reserva pendiente del usuario actual en public.bookings.
   */
  async cancelUserClubBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Usuario no autenticado' };

      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .eq('user_id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al cancelar la reserva' };
    }
  },

  /**
   * Alias de compatibilidad para reserveVIPTable (utilizado por flujos VIP).
   */
  async reserveVIPTable(params: {
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
  }) {
    return this.createClubBooking(params);
  },

  /**
   * Alias de compatibilidad para reserveCover.
   */
  async reserveCover(params: {
    clubId: string;
    clubSlug?: string;
    providerId?: string | null;
    ownerId?: string | null;
    customerName: string;
    visitDate: string;
    guestCount: number;
    coverPrice: number;
  }) {
    return this.buyClubCover(params);
  },

  /**
   * Verifica si el usuario actual tiene presencia activa en la discoteca
   * o si su entrada QR ya fue validada en puerta para la jornada actual.
   */
  async checkUserPresenceInClub(clubId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !clubId) return false;

      // 0. Verificar si la discoteca se encuentra actualmente abierta
      const { data: club } = await supabase
        .from('clubs')
        .select('modules_config')
        .eq('id', clubId)
        .maybeSingle();

      const isOpen = Boolean(club?.modules_config?.is_open);
      if (!isOpen) {
        return false;
      }

      const now = new Date().toISOString();
      const lastStatusChange = club?.modules_config?.last_status_change
        ? new Date(club.modules_config.last_status_change).getTime()
        : 0;

      // 1. Consultar si existe presencia viva en connect_presence
      const { data: presence, error: presenceError } = await supabase
        .from('connect_presence')
        .select('id, expires_at, status')
        .eq('user_id', user.id)
        .eq('club_id', clubId)
        .maybeSingle();

      if (!presenceError && presence) {
        if (presence.expires_at && presence.expires_at > now) {
          // Verificar si la cuenta de la estancia actual ya fue cerrada
          const { data: latestAccount } = await supabase
            .from('venue_accounts')
            .select('status')
            .eq('user_id', user.id)
            .eq('club_id', clubId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (latestAccount?.status === 'closed') {
            return false;
          }

          return true;
        }
      }

      // No se utiliza una compra histórica ni una entrada QR ya usada para reactivar la presencia.
      // Un nuevo ingreso requiere un nuevo flujo de validación en puerta.
      return false;
    } catch (err) {
      console.error('[clubService.checkUserPresenceInClub] Error:', err);
      return false;
    }
  },

  /**
   * Crea un pedido en vivo mediante la función segura PostgreSQL create_venue_order.
   */
  async createClubVenueOrder(params: {
    clubId: string;
    customerName: string;
    tableOrLocation: string;
    items: Array<{
      product_id: string;
      variant_id?: string | null;
      quantity: number;
      notes?: string;
    }>;
    customerPhone?: string;
    notes?: string;
  }): Promise<{ success: boolean; orderId?: string; orderNumber?: string; totalAmount?: number; error?: string }> {
    try {
      if (!params.clubId || !params.tableOrLocation?.trim() || !params.items?.length) {
        return { success: false, error: 'Faltan datos obligatorios para el pedido (mesa o productos).' };
      }

      // Validar si la discoteca se encuentra abierta comercialmente
      const { data: clubRecord } = await supabase
        .from('clubs')
        .select('id, modules_config, opening_hours')
        .eq('id', params.clubId)
        .maybeSingle();

      if (clubRecord) {
        const manualIsOpen = clubRecord.modules_config?.is_open;
        const isCurrentlyOpen =
          typeof (clubRecord as any).is_open === 'boolean'
            ? (clubRecord as any).is_open
            : typeof manualIsOpen === 'boolean'
              ? manualIsOpen
              : isClubOpen(clubRecord.opening_hours);

        if (!isCurrentlyOpen) {
          return {
            success: false,
            error: 'La discoteca se encuentra cerrada actualmente. No se pueden emitir nuevos pedidos.',
          };
        }
      }

      // 1. Validar presencia activa en esta discoteca
      const hasPresence = await this.checkUserPresenceInClub(params.clubId);
      if (!hasPresence) {
        // Verificar si el usuario autenticado es personal/dueño del establecimiento para pruebas operativas
        const { data: { user } } = await supabase.auth.getUser();
        let isStaffOrOwner = false;
        if (user) {
          const { data: clubStaff } = await supabase
            .from('clubs')
            .select('owner_id')
            .eq('id', params.clubId)
            .maybeSingle();
          if (clubStaff?.owner_id === user.id) {
            isStaffOrOwner = true;
          }
        }

        if (!isStaffOrOwner) {
          return {
            success: false,
            error: 'Debes contar con un ingreso validado en puerta y presencia activa para realizar pedidos en vivo.',
          };
        }
      }

      // 2. Mapeo defensivo de identificadores:
      // Si algún product_id proviene de club_menu_items, resolver al id de menu_products
      const resolvedItems = await Promise.all(
        params.items.map(async (item) => {
          // Verificar si el product_id existe directamente en public.menu_products
          const { data: mp } = await supabase
            .from('menu_products')
            .select('id')
            .eq('id', item.product_id)
            .eq('club_id', params.clubId)
            .maybeSingle();

          if (mp?.id) {
            return item;
          }

          // Si no está en menu_products, consultar si es de club_menu_items y resolver su contraparte en menu_products
          const { data: cmi } = await supabase
            .from('club_menu_items')
            .select('name')
            .eq('id', item.product_id)
            .eq('club_id', params.clubId)
            .maybeSingle();

          if (cmi?.name) {
            const { data: matchMp } = await supabase
              .from('menu_products')
              .select('id')
              .eq('club_id', params.clubId)
              .ilike('name', cmi.name.trim())
              .eq('status', 'published')
              .maybeSingle();

            if (matchMp?.id) {
              return { ...item, product_id: matchMp.id };
            }
          }

          return item;
        })
      );

      const { data, error } = await supabase.rpc('create_venue_order', {
        p_club_id: params.clubId,
        p_customer_name: params.customerName.trim(),
        p_customer_phone: params.customerPhone?.trim() || null,
        p_table_or_location: params.tableOrLocation.trim(),
        p_notes: params.notes?.trim() || null,
        p_items: resolvedItems.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id || null,
          quantity: i.quantity,
          notes: i.notes || null,
        })),
      });

      if (error) {
        console.error('[createClubVenueOrder] Error RPC:', error);
        return { success: false, error: error.message || 'Error al procesar el pedido.' };
      }

      if (data && data.success) {
        return {
          success: true,
          orderId: data.order_id,
          orderNumber: data.order_number,
          totalAmount: Number(data.total_amount || 0),
        };
      }

      return {
        success: false,
        error: data?.error || 'No se pudo crear el pedido.',
      };
    } catch (err: any) {
      console.error('[createClubVenueOrder] Excepción:', err);
      return { success: false, error: err?.message || 'Error inesperado al emitir comanda.' };
    }
  },

  /**
   * Consulta los pedidos en vivo del usuario actual en esta discoteca.
   */
  async getUserActiveVenueOrders(clubId: string): Promise<VenueOrder[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !clubId) return [];

      const { data, error } = await supabase
        .from('venue_orders')
        .select(`
          id,
          order_number,
          club_id,
          customer_id,
          customer_name,
          customer_phone,
          status,
          total,
          subtotal,
          table_or_location,
          notes,
          created_at,
          updated_at,
          items:venue_order_items (
            id,
            order_id,
            product_id,
            variant_id,
            product_name,
            variant_name,
            unit_price,
            quantity,
            subtotal,
            notes
          )
        `)
        .eq('club_id', clubId)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error || !data) {
        console.warn('[getUserActiveVenueOrders] Error:', error?.message);
        return [];
      }

      return data.map((o: any) => {
        const orderTotal = Number(o.total || o.total_amount || 0);
        return {
          id: o.id,
          order_number: o.order_number,
          club_id: o.club_id,
          customer_id: o.customer_id,
          user_id: o.customer_id,
          customer_name: o.customer_name,
          customer_phone: o.customer_phone,
          status: o.status,
          total: orderTotal,
          total_amount: orderTotal,
          subtotal: Number(o.subtotal || 0),
          table_or_location: o.table_or_location,
          notes: o.notes,
          delivered_at: o.delivered_at || null,
          confirmed_at: o.confirmed_at || null,
          created_at: o.created_at,
          updated_at: o.updated_at,
          items: (o.items || o.venue_order_items || []).map((it: any) => ({
            id: it.id,
            order_id: it.order_id,
            product_id: it.product_id,
            variant_id: it.variant_id,
            product_name: it.product_name,
            variant_name: it.variant_name,
            unit_price: Number(it.unit_price || 0),
            quantity: Number(it.quantity || 1),
            subtotal: Number(it.subtotal || 0),
            notes: it.notes,
          })),
        };
      });
    } catch (err) {
      console.error('[getUserActiveVenueOrders] Excepción:', err);
      return [];
    }
  },

  /**
   * Confirma la recepción del pedido por parte del cliente.
   * Utiliza la función RPC segura 'confirm_venue_order_delivery' con validación de identidad.
   */
  async confirmOrderDelivery(orderId: string): Promise<{ success: boolean; error?: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Debes iniciar sesión para confirmar la recepción.' };
      }
      if (!orderId) {
        return { success: false, error: 'Identificador de comanda no válido.' };
      }

      // 1. Llamada a la RPC server-side que valida auth.uid() y estado 'delivered'
      const { data: rpcData, error: rpcError } = await supabase.rpc('confirm_venue_order_delivery', {
        p_order_id: orderId,
      });

      if (!rpcError && rpcData?.success) {
        return { success: true, error: null };
      }

      // 2. Si la RPC devolvió un error de validación de negocio, reportarlo
      if (rpcError && rpcError.message && !rpcError.message.includes('Could not find')) {
        console.warn('[confirmOrderDelivery] RPC error:', rpcError.message);
        return { success: false, error: rpcError.message };
      }

      // 3. Fallback defensivo directo en Supabase
      const nowIso = new Date().toISOString();
      let { error: directError } = await supabase
        .from('venue_orders')
        .update({
          status: 'completed',
          confirmed_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', orderId)
        .eq('customer_id', user.id)
        .eq('status', 'delivered');

      // Si falla por columna confirmed_at no existente en schema cache
      if (directError && directError.message && directError.message.includes('confirmed_at')) {
        const retry = await supabase
          .from('venue_orders')
          .update({
            status: 'completed',
            updated_at: nowIso,
          })
          .eq('id', orderId)
          .eq('customer_id', user.id)
          .eq('status', 'delivered');
        directError = retry.error;
      }

      if (directError) {
        console.error('[confirmOrderDelivery] Error en fallback directo:', directError);
        return { success: false, error: directError.message || rpcError?.message || 'No se pudo confirmar la entrega.' };
      }

      // Asegurar que el cargo en la cuenta de estancia se registre incluso en el fallback directo
      try {
        await supabase.rpc('record_venue_account_charge_for_order', {
          p_order_id: orderId,
        });
      } catch (chargeErr) {
        console.warn('[confirmOrderDelivery] Aviso al asentar cargo en fallback:', chargeErr);
      }

      return { success: true, error: null };
    } catch (err: any) {
      console.error('[confirmOrderDelivery] Excepción inesperada:', err);
      return { success: false, error: err?.message || 'Error al confirmar la comanda.' };
    }
  },

  /**
   * Consulta la cuenta activa de consumo por estancia del usuario y su ledger de movimientos.
   */
  async getMyActiveVenueAccount(clubId: string): Promise<{
    account: VenueAccount | null;
    entries: VenueAccountEntry[];
    isClubOpen?: boolean;
    stayStatus?: string;
    error: string | null;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { account: null, entries: [], error: 'No autenticado.' };
      if (!clubId) return { account: null, entries: [], error: 'ID de discoteca no especificado.' };

      // 1. Intento por RPC autoritativa
      const { data, error } = await supabase.rpc('get_my_active_venue_account', {
        p_club_id: clubId,
      });

      if (!error && data) {
        return {
          account: data.account as VenueAccount | null,
          entries: (data.entries as VenueAccountEntry[]) || [],
          isClubOpen: data.is_club_open,
          stayStatus: data.stay_status,
          error: null,
        };
      }

      // 2. Fallback directo en caso de desincronización de esquema
      const { data: clubData } = await supabase
        .from('clubs')
        .select('modules_config')
        .eq('id', clubId)
        .maybeSingle();

      const fallbackIsOpen = Boolean(clubData?.modules_config?.is_open);

      const { data: accData, error: accError } = await supabase
        .from('venue_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('club_id', clubId)
        .in('status', ['open', 'pending_payment', 'paid', 'closed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (accError || !accData) {
        return { account: null, entries: [], isClubOpen: fallbackIsOpen, error: null };
      }

      const { data: entData } = await supabase
        .from('venue_account_entries')
        .select('*')
        .eq('account_id', accData.id)
        .order('created_at', { ascending: false });

      return {
        account: accData as VenueAccount,
        entries: (entData as VenueAccountEntry[]) || [],
        isClubOpen: fallbackIsOpen,
        error: null,
      };
    } catch (err: any) {
      console.warn('[getMyActiveVenueAccount] Excepción:', err);
      return { account: null, entries: [], error: err?.message || 'Error al consultar cuenta.' };
    }
  },

  /**
   * Control de salida: finaliza la estancia en la discoteca únicamente si el saldo
   * calculado por el servidor es exactamente 0.00 COP.
   * Si hay saldo pendiente, el servidor rechaza la salida y retorna el saldo adeudado.
   */
  async finalizeVenueStay(clubId: string): Promise<{
    success: boolean;
    code?: string;
    error?: string;
    message?: string;
    balance?: number;
    closed_at?: string;
    is_club_closed?: boolean;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Debes iniciar sesión para finalizar tu estancia.' };
      }
      if (!clubId) {
        return { success: false, error: 'ID de discoteca no válido.' };
      }

      const { data, error } = await supabase.rpc('finalize_venue_stay', {
        p_club_id: clubId,
      });

      if (error) {
        console.warn('[finalizeVenueStay] Error RPC:', error.message);
        return { success: false, error: error.message };
      }

      return data as {
        success: boolean;
        code?: string;
        error?: string;
        message?: string;
        balance?: number;
        closed_at?: string;
        is_club_closed?: boolean;
      };
    } catch (err: any) {
      console.error('[finalizeVenueStay] Excepción:', err);
      return { success: false, error: err?.message || 'Error al procesar la salida.' };
    }
  },

  /**
   * Obtiene la estancia activa del usuario en alguna discoteca (cuenta abierta o presencia confirmada).
   */
  async getUserActiveStay(): Promise<{
    clubId: string;
    clubName: string;
    hasActivePresence: boolean;
    isClubOpen: boolean;
    hasPendingDebt?: boolean;
    accountBalance?: number;
  } | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const now = new Date().toISOString();

      // 1. Consultar si el usuario tiene presencia viva confirmada en puerta
      const { data: presence } = await supabase
        .from('connect_presence')
        .select('club_id, status, expires_at, clubs(id, name, modules_config)')
        .eq('user_id', user.id)
        .gt('expires_at', now)
        .order('last_seen_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const hasLivePresence = Boolean(presence?.club_id);
      const liveClubId = presence?.club_id;

      // 2. Consultar si tiene una cuenta de consumo abierta o con saldo pendiente
      const { data: account } = await supabase
        .from('venue_accounts')
        .select('club_id, balance, status, clubs(id, name, modules_config)')
        .eq('user_id', user.id)
        .in('status', ['open', 'pending_payment'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const hasDebt = Number(account?.balance || 0) > 0;

      // Caso 1: Tiene presencia viva en sala (validado en puerta)
      if (hasLivePresence && liveClubId) {
        const clubName = (presence.clubs as any)?.name || 'Discoteca Hangover';
        const clubModulesConfig = (presence.clubs as any)?.modules_config || {};
        const isClubOpen = Boolean(clubModulesConfig.is_open);

        // Si la discoteca está cerrada, la presencia viva concluye operativamente
        if (!isClubOpen) {
          if (hasDebt && account?.club_id === liveClubId) {
            return {
              clubId: liveClubId,
              clubName,
              hasActivePresence: false,
              isClubOpen: false,
              hasPendingDebt: true,
              accountBalance: Number(account?.balance || 0),
            };
          }
          return null;
        }

        // Si la cuenta asociada a este local ya está cerrada, la estancia finalizó
        if (account?.club_id === liveClubId && account?.status === 'closed') {
          return null;
        }

        return {
          clubId: liveClubId,
          clubName,
          hasActivePresence: true,
          isClubOpen: true,
          hasPendingDebt: hasDebt,
          accountBalance: Number(account?.balance || 0),
        };
      }

      // Caso 2: No tiene presencia viva, pero tiene saldo adeudado pendiente de pago
      if (hasDebt && account?.club_id) {
        const clubName = (account.clubs as any)?.name || 'Discoteca Hangover';
        const clubModulesConfig = (account.clubs as any)?.modules_config || {};
        const isClubOpen = Boolean(clubModulesConfig.is_open);

        return {
          clubId: account.club_id,
          clubName,
          hasActivePresence: false,
          isClubOpen,
          hasPendingDebt: true,
          accountBalance: Number(account.balance || 0),
        };
      }

      // Caso 3: Sin presencia viva y sin deuda -> Sin estancia activa
      return null;
    } catch (err) {
      console.warn('[getUserActiveStay] Error:', err);
      return null;
    }
  },

  /**
   * Consulta si el usuario actual sigue a una discoteca.
   */
  async isUserFollowingClub(clubId: string): Promise<boolean> {
    if (!clubId) return false;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data } = await supabase
        .from('user_favorite_clubs')
        .select('id')
        .eq('user_id', user.id)
        .eq('club_id', clubId)
        .maybeSingle();

      return Boolean(data);
    } catch (err) {
      console.warn('[isUserFollowingClub] Error:', err);
      return false;
    }
  },

  /**
   * Alterna el estado de seguimiento (seguir / dejar de seguir) con persistencia en Supabase.
   */
  async toggleFollowClub(
    clubId: string,
    currentFollowing: boolean
  ): Promise<{ success: boolean; following: boolean; error?: string }> {
    if (!clubId) return { success: false, following: currentFollowing, error: 'invalid_club' };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, following: currentFollowing, error: 'auth_required' };
      }

      if (currentFollowing) {
        // Dejar de seguir
        const { error } = await supabase
          .from('user_favorite_clubs')
          .delete()
          .eq('user_id', user.id)
          .eq('club_id', clubId);

        if (error) throw error;
        return { success: true, following: false };
      } else {
        // Seguir
        const { error } = await supabase
          .from('user_favorite_clubs')
          .insert({
            user_id: user.id,
            club_id: clubId,
          });

        if (error && error.code !== '23505') {
          // Si no es un error de clave duplicada, propagar el fallo
          throw error;
        }
        return { success: true, following: true };
      }
    } catch (err: any) {
      console.error('[toggleFollowClub] Error:', err);
      return { success: false, following: currentFollowing, error: err?.message || 'Error al cambiar seguimiento' };
    }
  },

  /**
   * Consulta el listado de opiniones públicas, promedio real y distribución de estrellas.
   */
  async getClubReviews(clubId: string): Promise<ClubReviewsSummary> {
    const emptySummary: ClubReviewsSummary = {
      reviews: [],
      averageRating: 0,
      totalCount: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };

    if (!clubId) return emptySummary;

    try {
      const { data, error } = await supabase
        .from('club_reviews')
        .select(`
          id,
          club_id,
          user_id,
          rating,
          atmosphere,
          service,
          music,
          security,
          facilities,
          comment,
          recommend,
          created_at,
          booking_id,
          profiles (
            full_name,
            avatar_url,
            username
          )
        `)
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[getClubReviews] Error:', error.message);
        return emptySummary;
      }

      const reviews: ClubReview[] = (data || []).map((row: any) => ({
        id: row.id,
        club_id: row.club_id,
        user_id: row.user_id,
        rating: Number(row.rating || 5),
        atmosphere: row.atmosphere,
        service: row.service,
        music: row.music,
        security: row.security,
        facilities: row.facilities,
        comment: row.comment,
        recommend: row.recommend,
        created_at: row.created_at,
        booking_id: row.booking_id,
        profiles: row.profiles
          ? {
              full_name: row.profiles.full_name || null,
              avatar_url: row.profiles.avatar_url || null,
              username: row.profiles.username || null,
            }
          : null,
      }));

      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let sum = 0;

      reviews.forEach((r) => {
        const star = Math.max(1, Math.min(5, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
        distribution[star] = (distribution[star] || 0) + 1;
        sum += r.rating;
      });

      const totalCount = reviews.length;
      const averageRating = totalCount > 0 ? Number((sum / totalCount).toFixed(1)) : 0;

      return {
        reviews,
        averageRating,
        totalCount,
        distribution,
      };
    } catch (err) {
      console.error('[getClubReviews] Error:', err);
      return emptySummary;
    }
  },

  /**
   * Regla Antifraude: Verifica si el usuario actual cumple las condiciones para calificar
   * (ingreso validado en puerta con QR usado o registro en admission_logs).
   */
  async checkUserCanReviewClub(clubId: string): Promise<ClubReviewEligibility> {
    const unverified: ClubReviewEligibility = {
      authenticated: false,
      hasEntered: false,
      canReview: false,
      alreadyReviewed: false,
      existingReview: null,
      verifiedBookingId: null,
    };

    if (!clubId) return unverified;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return unverified;

      // 1. Intentar invocar RPC server-side autoritativa si existe
      try {
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('check_user_can_review_club', {
          p_club_id: clubId,
        });

        if (!rpcErr && rpcRes) {
          return {
            authenticated: true,
            hasEntered: Boolean(rpcRes.has_entered),
            canReview: Boolean(rpcRes.can_review),
            alreadyReviewed: Boolean(rpcRes.already_reviewed),
            existingReview: rpcRes.existing_review || null,
            verifiedBookingId: rpcRes.verified_booking_id || null,
          };
        }
      } catch {
        // Fallback a consulta directa si la RPC aún no fue migrada
      }

      // 2. Fallback de verificación directa
      // 2.1 Buscar booking con qr_status = 'used'
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, qr_status, qr_validated_at, created_at')
        .eq('user_id', user.id)
        .eq('club_id', clubId)
        .eq('qr_status', 'used')
        .order('qr_validated_at', { ascending: false })
        .limit(1);

      let verifiedBookingId = bookings?.[0]?.id || null;

      // 2.2 Si no está directo en bookings, buscar en admission_logs con status 'approved'
      if (!verifiedBookingId) {
        const { data: admissions } = await supabase
          .from('admission_logs')
          .select('id, booking_id, status, bookings!inner(club_id, user_id)')
          .eq('status', 'approved')
          .eq('bookings.club_id', clubId)
          .eq('user_id', user.id)
          .limit(1);

        if (admissions && admissions.length > 0) {
          verifiedBookingId = admissions[0].booking_id;
        }
      }

      const hasEntered = Boolean(verifiedBookingId);

      // 2.3 Consultar si ya tiene opinión publicada
      const { data: existingReviewData } = await supabase
        .from('club_reviews')
        .select('id, club_id, user_id, rating, comment, created_at, booking_id')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .maybeSingle();

      return {
        authenticated: true,
        hasEntered,
        canReview: hasEntered,
        alreadyReviewed: Boolean(existingReviewData),
        existingReview: existingReviewData as ClubReview | null,
        verifiedBookingId,
      };
    } catch (err) {
      console.warn('[checkUserCanReviewClub] Error:', err);
      return { ...unverified, authenticated: true };
    }
  },

  /**
   * Publica o actualiza una opinión verificada con estrellas (1-5) y comentario opcional.
   */
  async submitClubReview(params: {
    clubId: string;
    rating: number;
    comment?: string;
  }): Promise<{ success: boolean; error?: string; review?: any }> {
    const { clubId, rating, comment } = params;

    if (!clubId) return { success: false, error: 'Discoteca no especificada.' };
    if (!rating || rating < 1 || rating > 5) {
      return { success: false, error: 'La calificación debe ser de 1 a 5 estrellas.' };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Debes iniciar sesión para calificar.' };
      }

      // 1. Intentar primero con RPC server-side autoritativa
      try {
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('submit_verified_club_review', {
          p_club_id: clubId,
          p_rating: Math.round(rating),
          p_comment: comment?.trim() || null,
        });

        if (!rpcErr && rpcRes) {
          if (!rpcRes.success) {
            return { success: false, error: rpcRes.error };
          }
          return { success: true, review: rpcRes };
        }
      } catch {
        // Fallback a ejecución directa si la RPC no existe aún
      }

      // 2. Verificación previa de entrada obligatoria (Regla Antifraude)
      const eligibility = await this.checkUserCanReviewClub(clubId);
      if (!eligibility.hasEntered || !eligibility.verifiedBookingId) {
        return {
          success: false,
          error:
            'Puedes consultar todas las opiniones. Para calificar esta discoteca, primero debes haber ingresado y tener una entrada registrada en Hangover.',
        };
      }

      const cleanComment = comment?.trim() || null;
      const cleanRating = Math.max(1, Math.min(5, Math.round(rating)));

      // 3. Upsert de la opinión
      const payload = {
        club_id: clubId,
        user_id: user.id,
        booking_id: eligibility.verifiedBookingId,
        rating: cleanRating,
        atmosphere: cleanRating,
        service: cleanRating,
        music: cleanRating,
        security: cleanRating,
        facilities: cleanRating,
        comment: cleanComment,
        recommend: cleanRating >= 4,
      };

      if (eligibility.alreadyReviewed && eligibility.existingReview?.id) {
        const { data: updated, error: updErr } = await supabase
          .from('club_reviews')
          .update({
            rating: cleanRating,
            atmosphere: cleanRating,
            service: cleanRating,
            music: cleanRating,
            security: cleanRating,
            facilities: cleanRating,
            comment: cleanComment,
            recommend: cleanRating >= 4,
          })
          .eq('id', eligibility.existingReview.id)
          .select()
          .single();

        if (updErr) throw updErr;

        // Recalcular rating de la discoteca
        await this.syncClubRatingStats(clubId);
        return { success: true, review: updated };
      } else {
        const { data: inserted, error: insErr } = await supabase
          .from('club_reviews')
          .insert(payload)
          .select()
          .single();

        if (insErr) throw insErr;

        // Recalcular rating de la discoteca
        await this.syncClubRatingStats(clubId);
        return { success: true, review: inserted };
      }
    } catch (err: any) {
      console.error('[submitClubReview] Error:', err);
      return { success: false, error: err?.message || 'Error al guardar tu calificación.' };
    }
  },

  /**
   * Sincroniza y recalcula el rating promedio y número de opiniones en public.clubs.
   */
  async syncClubRatingStats(clubId: string): Promise<void> {
    if (!clubId) return;
    try {
      const summary = await this.getClubReviews(clubId);
      await supabase
        .from('clubs')
        .update({
          rating: summary.averageRating,
          reviews_count: summary.totalCount,
        })
        .eq('id', clubId);
    } catch (err) {
      console.warn('[syncClubRatingStats] Error sincronizando rating:', err);
    }
  },
};


