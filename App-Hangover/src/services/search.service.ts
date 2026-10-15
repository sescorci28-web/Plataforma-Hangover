import { supabase } from '@/lib/supabase';

export interface SearchProfileResult {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  city: string | null;
  role: string | null;
  provider_type: string | null;
}

export interface SearchEventResult {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  category: string | null;
  event_date: string | null;
  image_url: string | null;
  ticket_price: number | null;
}

export interface SearchClubResult {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  city: string | null;
  address: string | null;
  club_type: string | null;
  logo: string | null;
  banner_image: string | null;
  rating: number | null;
}

export interface SearchServiceResult {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  category: string | null;
  base_city: string | null;
  price: number | null;
  image_url: string | null;
  provider_id: string | null;
}

export interface GlobalSearchResults {
  profiles: SearchProfileResult[];
  events: SearchEventResult[];
  clubs: SearchClubResult[];
  services: SearchServiceResult[];
}

/**
 * Sanea el término de búsqueda para evitar que comillas, comas o paréntesis
 * rompan la sintaxis de la expresión .or() de PostgREST en Supabase.
 */
function sanitizeSearchTerm(input: string): string {
  if (!input) return '';
  return input
    .replace(/"/g, '')
    .replace(/,/g, ' ')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .trim();
}

export const searchService = {
  /**
   * Realiza la búsqueda global simultánea en public.profiles, public.events, public.clubs y public.services.
   */
  async searchAll(queryText: string): Promise<GlobalSearchResults> {
    const rawClean = queryText ? queryText.trim() : '';

    if (!rawClean || rawClean.length < 2) {
      return {
        profiles: [],
        events: [],
        clubs: [],
        services: [],
      };
    }

    // 1. Limpiar el prefijo @ si la búsqueda empieza con @ (ej. @sergio -> sergio)
    const strippedQuery = rawClean.startsWith('@') ? rawClean.slice(1).trim() : rawClean;
    const safeTerm = sanitizeSearchTerm(strippedQuery);

    if (safeTerm.length < 2) {
      return {
        profiles: [],
        events: [],
        clubs: [],
        services: [],
      };
    }

    // 2. Envolver el patrón entre comillas dobles para que PostgREST maneje correctamente espacios e insensibilidad a mayúsculas/minúsculas
    const pattern = `"%${safeTerm}%"`;

    try {
      const [profilesRes, eventsRes, clubsRes, servicesRes] = await Promise.all([
        // 1. USUARIOS / PERFILES (Límite aumentado a 20 con proyección segura explícita)
        supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, city, role, provider_type')
          .or(`full_name.ilike.${pattern},username.ilike.${pattern},city.ilike.${pattern}`)
          .limit(20),

        // 2. EVENTOS
        supabase
          .from('events')
          .select('id, title, description, location, category, event_date, image_url, ticket_price')
          .or(`title.ilike.${pattern},description.ilike.${pattern},location.ilike.${pattern},category.ilike.${pattern}`)
          .limit(5),

        // 3. DISCOTECAS / CLUBS (Criterio coherente con catálogo: active=true y status='published')
        supabase
          .from('clubs')
          .select('id, name, slug, description, city, address, club_type, logo, banner_image, rating')
          .eq('active', true)
          .eq('status', 'published')
          .or(`name.ilike.${pattern},slug.ilike.${pattern},description.ilike.${pattern},city.ilike.${pattern},address.ilike.${pattern},club_type.ilike.${pattern}`)
          .limit(5),

        // 4. SERVICIOS
        supabase
          .from('services')
          .select('id, title, slug, description, category, base_city, price, image_url, provider_id')
          .or(`title.ilike.${pattern},slug.ilike.${pattern},description.ilike.${pattern},category.ilike.${pattern},base_city.ilike.${pattern}`)
          .limit(5),
      ]);

      return {
        profiles: (profilesRes.data as SearchProfileResult[]) || [],
        events: (eventsRes.data as SearchEventResult[]) || [],
        clubs: (clubsRes.data as SearchClubResult[]) || [],
        services: (servicesRes.data as SearchServiceResult[]) || [],
      };
    } catch (err) {
      console.error('Error en búsqueda global searchService:', err);
      return {
        profiles: [],
        events: [],
        clubs: [],
        services: [],
      };
    }
  },
};
