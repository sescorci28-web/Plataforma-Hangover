import { supabase } from '@/lib/supabase';
import { ClubInfo, MenuCategory, MenuItem } from '@/data/mockClubs';

const DEFAULT_CLUB_BANNER = 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80';

/**
 * Mapea un registro de la tabla public.clubs a la interfaz ClubInfo utilizada por la UI de React Native.
 */
export function mapSupabaseClubToClubInfo(dbClub: any, menuCategories: MenuCategory[] = []): ClubInfo {
  const addressParts = [dbClub.address, dbClub.city].filter(Boolean);
  const location = addressParts.length > 0 ? addressParts.join(', ') : (dbClub.city || 'Ubicación por confirmar');

  // Fallback seguro de imagen: banner_image -> hero_image -> logo -> DEFAULT_CLUB_BANNER
  const imageUrl = dbClub.banner_image || dbClub.hero_image || dbClub.logo || DEFAULT_CLUB_BANNER;

  const gallery: string[] = [];
  if (dbClub.logo && dbClub.logo !== imageUrl) {
    gallery.push(dbClub.logo);
  }
  if (Array.isArray(dbClub.gallery)) {
    gallery.push(...dbClub.gallery);
  }

  return {
    id: dbClub.id,
    name: dbClub.name || 'Discoteca Hangover',
    verified: true,
    location,
    hours: dbClub.opening_hours || 'Jue - Sáb: 9:00 PM - 4:00 AM',
    description: dbClub.description || 'Discoteca exclusiva asociada a la plataforma Hangover.',
    category: dbClub.club_type || 'Discoteca',
    rating: typeof dbClub.rating === 'number' && dbClub.rating > 0 ? dbClub.rating : 5.0,
    imageUrl,
    gallery,
    upcomingEvents: [],
    menu: menuCategories,
  };
}

/**
 * Agrupa los items de club_menu_items en categorías de menú MenuCategory[].
 */
function groupMenuItems(rawItems: any[]): MenuCategory[] {
  if (!rawItems || rawItems.length === 0) return [];

  const groups: Record<string, MenuItem[]> = {};

  for (const item of rawItems) {
    const categoryName = item.category || 'Carta General';
    if (!groups[categoryName]) {
      groups[categoryName] = [];
    }
    groups[categoryName].push({
      id: item.id,
      name: item.name || 'Producto',
      description: item.description || '',
      price: Number(item.price ?? 0),
    });
  }

  return Object.keys(groups).map((category) => ({
    category,
    items: groups[category],
  }));
}

export const clubService = {
  /**
   * Obtiene la lista de discotecas reales publicadas (active = true y status = 'published').
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
   * Obtiene una discoteca real por su UUID, incluyendo su carta/menú si existen ítems en Supabase.
   */
  async getClubById(clubId: string): Promise<{ club: ClubInfo | null; error: string | null }> {
    try {
      if (!clubId) {
        return { club: null, error: 'ID de discoteca no proporcionado.' };
      }

      // Consulta del registro principal de la discoteca
      const { data: dbClub, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .eq('active', true)
        .eq('status', 'published')
        .single();

      if (clubError || !dbClub) {
        // Si no se encuentra con status = 'published', intentamos buscar por id para no romper navegación interna si está activa
        const { data: fallbackClub } = await supabase
          .from('clubs')
          .select('*')
          .eq('id', clubId)
          .single();

        if (!fallbackClub) {
          return { club: null, error: clubError?.message || 'Discoteca no encontrada en Supabase.' };
        }

        // Cargar ítems de menú de la discoteca si existen
        let menuCategories: MenuCategory[] = [];
        try {
          const { data: menuData } = await supabase
            .from('club_menu_items')
            .select('*')
            .eq('club_id', clubId)
            .eq('is_available', true);

          if (menuData && menuData.length > 0) {
            menuCategories = groupMenuItems(menuData);
          }
        } catch {
          // Si la tabla no está disponible o falla, simplemente dejamos el menú vacío
        }

        return { club: mapSupabaseClubToClubInfo(fallbackClub, menuCategories), error: null };
      }

      // Cargar ítems de menú de la discoteca
      let menuCategories: MenuCategory[] = [];
      try {
        const { data: menuData } = await supabase
          .from('club_menu_items')
          .select('*')
          .eq('club_id', clubId)
          .eq('is_available', true);

        if (menuData && menuData.length > 0) {
          menuCategories = groupMenuItems(menuData);
        }
      } catch {
        // Menú opcional
      }

      return { club: mapSupabaseClubToClubInfo(dbClub, menuCategories), error: null };
    } catch (err: any) {
      console.error('[clubService] Error al consultar detalle de club:', err?.message);
      return { club: null, error: err?.message || 'Error al consultar la discoteca.' };
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
};
