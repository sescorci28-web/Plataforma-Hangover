// ============================================
// TIPOS Y MODELOS DE ESTADOS Y NOVEDADES
// ============================================

export type StoryType = 'announcement' | 'surprise' | 'backstage' | 'lineup' | 'promo' | 'info';
export type UpdateType = 'announcement' | 'surprise' | 'important' | 'update' | 'media';

export interface EventStory {
  id: string;
  eventId: string;
  type: StoryType;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  title: string;
  content: string;
  timeAgo: string;
  createdAt: string;
  isActive: boolean;
  authorName?: string;
  authorAvatar?: string;
}

export interface EventUpdate {
  id: string;
  eventId: string;
  type: UpdateType;
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  timeAgo: string;
  createdAt: string;
  isImportant: boolean;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  views: number;
  likes: number;
}

// ============================================
// DATOS MOCK DE ESTADOS (STORIES)
// ============================================

export const MOCK_EVENT_STORIES: Record<string, EventStory[]> = {
  'e1': [
    {
      id: 'st-e1-1',
      eventId: 'e1',
      type: 'surprise',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
      title: '👀 Sorpresa Neón de esta Noche',
      content: '¡Preparados! Los primeros 100 asistentes recibirán gafas neón edición limitada Hangover VIP.',
      timeAgo: 'Hace 2 horas',
      createdAt: '2026-10-28T18:00:00Z',
      isActive: true,
      authorName: 'Hangover Events',
      authorAvatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&q=80'
    },
    {
      id: 'st-e1-2',
      eventId: 'e1',
      type: 'lineup',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
      title: '🔥 DJ Tiësto en Pruebas de Soundcheck',
      content: '¡Montaje listo en La Fábrica! Tiësto arrancará su set especial a las 11:00 PM sin contratiempos.',
      timeAgo: 'Hace 4 horas',
      createdAt: '2026-10-28T16:00:00Z',
      isActive: true,
      authorName: 'Soundcrew Hangover',
      authorAvatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&q=80'
    },
    {
      id: 'st-e1-3',
      eventId: 'e1',
      type: 'promo',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80',
      title: '🎟️ Últimas Boletas VIP',
      content: 'Quedan menos del 15% de mesas VIP disponibles. Asegura tu acceso con servicio de botella.',
      timeAgo: 'Hace 5 horas',
      createdAt: '2026-10-28T15:00:00Z',
      isActive: true,
      authorName: 'Hangover Ticketing',
      authorAvatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&q=80'
    }
  ],
  'e2': [
    {
      id: 'st-e2-1',
      eventId: 'e2',
      type: 'announcement',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1574390353891-2f74ca31f9fc?w=800&q=80',
      title: '🎃 Concurso de Disfraces Confirmado',
      content: 'Premio de $2.000.000 COP en efectivo al mejor disfraz de la noche. Jurado a las 12:30 AM.',
      timeAgo: 'Hace 1 hora',
      createdAt: '2026-10-29T19:00:00Z',
      isActive: true,
      authorName: 'BAQ Night Crew',
      authorAvatar: 'https://images.unsplash.com/photo-1574390353891-2f74ca31f9fc?w=200&q=80'
    }
  ],
  'e3': [
    {
      id: 'st-e3-1',
      eventId: 'e3',
      type: 'backstage',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&q=80',
      title: '🔊 Prueba de Bajo en Díscolo',
      content: 'El sistema de sonido subwoofer de dos niveles listo para el perreo de esta noche.',
      timeAgo: 'Hace 3 horas',
      createdAt: '2026-11-04T17:00:00Z',
      isActive: true,
      authorName: 'Díscolo Staff',
      authorAvatar: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=200&q=80'
    }
  ],
  'e4': [
    {
      id: 'st-e4-1',
      eventId: 'e4',
      type: 'info',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1508215885820-4585e5610e28?w=800&q=80',
      title: '💃 Clase Gratis de Salsa a las 7:00 PM',
      content: 'Llega temprano a La Troja y aprovecha la clase de salsa brava incluida con tu entrada.',
      timeAgo: 'Hace 2 horas',
      createdAt: '2026-11-05T16:00:00Z',
      isActive: true,
      authorName: 'Tropical Fiestas',
      authorAvatar: 'https://images.unsplash.com/photo-1508215885820-4585e5610e28?w=200&q=80'
    }
  ]
};

// ============================================
// DATOS MOCK DE NOVEDADES (UPDATES FEED)
// ============================================

export const MOCK_EVENT_UPDATES: Record<string, EventUpdate[]> = {
  'e1': [
    {
      id: 'up-e1-1',
      eventId: 'e1',
      type: 'important',
      title: '🚨 Ingreso por Puerta Norte & Validación QR',
      content: 'Para agilizar el acceso, la fila VIP ingresará por el portón principal y la fila General por la calle 70. Recuerda tener tu código QR descargado sin necesidad de internet en tu aplicación de Hangover.',
      timeAgo: 'Hace 1 hora',
      createdAt: '2026-10-28T19:00:00Z',
      isImportant: true,
      authorName: 'Equipo de Logística',
      authorRole: 'Hangover Security',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
      views: 342,
      likes: 124
    },
    {
      id: 'up-e1-2',
      eventId: 'e1',
      type: 'surprise',
      title: '🎁 Gafas Neón LED de Regalo en Puerta',
      content: 'El patrocinador oficial entregará 100 accesorios brillantes LED a los primeros asistentes en validar su entrada. ¡Llega temprano!',
      timeAgo: 'Hace 3 horas',
      createdAt: '2026-10-28T17:00:00Z',
      isImportant: false,
      authorName: 'Marketing Hangover',
      authorRole: 'Host',
      authorAvatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&q=80',
      views: 218,
      likes: 98
    },
    {
      id: 'up-e1-3',
      eventId: 'e1',
      type: 'announcement',
      title: '📢 Apertura de Puertas a las 10:00 PM PUNTUAL',
      content: 'El primer DJ set iniciará a las 10:15 PM. Recomendamos llegar con anticipación para evitar aglomeraciones en la entrada.',
      timeAgo: 'Hace 6 horas',
      createdAt: '2026-10-28T14:00:00Z',
      isImportant: false,
      authorName: 'Hangover Events',
      authorRole: 'Organizador Oficial',
      authorAvatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&q=80',
      views: 185,
      likes: 54
    },
    {
      id: 'up-e1-4',
      eventId: 'e1',
      type: 'media',
      title: '🎥 Vistazo al Escenario Láser de Esta Noche',
      content: 'Se completó con éxito la calibración de pantallas de 360 grados y los efectos especiales de CO2.',
      mediaUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
      mediaType: 'image',
      timeAgo: 'Hace 8 horas',
      createdAt: '2026-10-28T12:00:00Z',
      isImportant: false,
      authorName: 'Producción Visual',
      authorRole: 'Stage Director',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
      views: 429,
      likes: 215
    }
  ],
  'e2': [
    {
      id: 'up-e2-1',
      eventId: 'e2',
      type: 'important',
      title: '⚠️ Código de Vestimenta: Disfraz Obligatorio',
      content: 'Por políticas de la temática Halloween Madness, no se permitirá el ingreso en ropa casual sin caracterización o accesorio alusivo.',
      timeAgo: 'Hace 2 horas',
      createdAt: '2026-10-29T18:00:00Z',
      isImportant: true,
      authorName: 'Trucupey Staff',
      authorRole: 'Acceso',
      views: 156,
      likes: 42
    },
    {
      id: 'up-e2-2',
      eventId: 'e2',
      type: 'surprise',
      title: '🎁 $2.000.000 COP al Mejor Disfraz',
      content: 'El jurado tomará fotos a los semifinalistas entre las 11:00 PM y 12:30 AM.',
      timeAgo: 'Hace 4 horas',
      createdAt: '2026-10-29T16:00:00Z',
      isImportant: false,
      authorName: 'BAQ Night Crew',
      authorRole: 'Organizador',
      views: 290,
      likes: 138
    }
  ],
  'e3': [
    {
      id: 'up-e3-1',
      eventId: 'e3',
      type: 'announcement',
      title: '📢 2x1 en Cócteles de Bienvenida de 10 PM a 11:30 PM',
      content: 'Promoción válida en barra principal presentando la manilla de entrada.',
      timeAgo: 'Hace 1 hora',
      createdAt: '2026-11-04T19:00:00Z',
      isImportant: false,
      authorName: 'Díscolo Bar',
      authorRole: 'Barras',
      views: 112,
      likes: 67
    }
  ],
  'e4': [
    {
      id: 'up-e4-1',
      eventId: 'e4',
      type: 'update',
      title: '🔥 La Orquesta Salsa Mayor arranca 8:30 PM',
      content: 'Show de 15 músicos en vivo divididos en dos tandas de pura salsa brava.',
      timeAgo: 'Hace 3 horas',
      createdAt: '2026-11-05T15:00:00Z',
      isImportant: false,
      authorName: 'Tropical Fiestas',
      authorRole: 'Organizador',
      views: 178,
      likes: 85
    }
  ]
};

// ============================================
// FUNCIONES AUXILIARES (SUPABASE READY)
// ============================================

export function getEventStories(eventId: string): EventStory[] {
  return MOCK_EVENT_STORIES[eventId] || [
    {
      id: `st-default-${eventId}`,
      eventId,
      type: 'announcement',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
      title: '✨ Evento Confirmado en Hangover',
      content: '¡Todo preparado para ofrecer la mejor noche del fin de semana! Revisa los avisos importantes.',
      timeAgo: 'Reciente',
      createdAt: new Date().toISOString(),
      isActive: true,
      authorName: 'Hangover Official'
    }
  ];
}

export function getEventUpdates(eventId: string): EventUpdate[] {
  return MOCK_EVENT_UPDATES[eventId] || [
    {
      id: `up-default-${eventId}`,
      eventId,
      type: 'announcement',
      title: '📢 Evento Confirmado & Venta de Entradas Activa',
      content: 'Recuerda revisar la ubicación y llevar tu documento de identidad físico para validar tu acceso en puerta.',
      timeAgo: 'Hace unas horas',
      createdAt: new Date().toISOString(),
      isImportant: false,
      authorName: 'Hangover Staff',
      authorRole: 'Organizador',
      views: 54,
      likes: 18
    }
  ];
}

export async function registerUpdateView(updateId: string, userId?: string): Promise<{ success: boolean }> {
  return { success: true };
}

export async function toggleUpdateLike(updateId: string, userId?: string): Promise<{ success: boolean }> {
  return { success: true };
}
