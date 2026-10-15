export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface MenuCategory {
  category: string;
  items: MenuItem[];
}

export interface ClubInfo {
  id: string;
  name: string;
  verified: boolean;
  location: string;
  hours: string;
  description: string;
  category: string;
  rating: number;
  imageUrl: string;
  gallery: string[];
  upcomingEvents: string[]; // Simulado
  menu: MenuCategory[];
}

/**
 * @deprecated Los datos simulados de discotecas han sido retirados en favor de registros reales de Supabase.
 * Se conserva este array vacío para mantener compatibilidad con cualquier importación residual mientras se completa la migración.
 */
export const MOCK_CLUBS: ClubInfo[] = [];

