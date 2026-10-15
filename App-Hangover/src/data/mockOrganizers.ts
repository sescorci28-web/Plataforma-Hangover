// ============================================
// TIPOS Y MODELOS DE ORGANIZADOR / ANFITRIÓN
// ============================================

export interface PastOrganizerEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  imageUrl: string;
  status: 'completed';
  attendeesCount: number;
  rating: number;
}

export interface OrganizerMedia {
  id: string;
  title: string;
  type: 'aftermovie' | 'highlight' | 'clip';
  thumbnailUrl: string;
  duration: string;
  viewsCount: number;
}

export interface OrganizerGalleryImage {
  id: string;
  imageUrl: string;
  caption: string;
  eventName: string;
}

export interface UpcomingOrganizerEvent {
  eventId: string;
  title: string;
  date: string;
  location: string;
  imageUrl: string;
  priceFrom: number;
}

export interface OrganizerSocials {
  instagram?: string;
  facebook?: string;
  website?: string;
  tiktok?: string;
  whatsapp?: string;
}

export interface OrganizerProfile {
  id: string;
  name: string;
  companyName: string;
  bio: string;
  fullBio: string;
  avatarUrl: string;
  bannerUrl: string;
  rating: number;
  reviewsCount: number;
  eventsCount: number;
  followersCount: number;
  verified: boolean;
  yearsOfExperience: number;
  city: string;
  eventTypes: string[];
  socials: OrganizerSocials;
  pastEvents: PastOrganizerEvent[];
  media: OrganizerMedia[];
  gallery: OrganizerGalleryImage[];
  upcomingEvents: UpcomingOrganizerEvent[];
}

// ============================================
// CATÁLOGO ESTÁTICO DE ORGANIZADORES
// ============================================

export const MOCK_ORGANIZERS: Record<string, OrganizerProfile> = {
  'org-1': {
    id: 'org-1',
    name: 'Hangover Events',
    companyName: 'Hangover Entertainment Group',
    bio: 'Organizadores oficiales de los mejores eventos nocturnos y festivales VIP de la Costa Caribe.',
    fullBio: 'Hangover Events es la productora de entretenimiento nocturno líder en Barranquilla y la región Caribe. Fundada en 2020, hemos revolucionado la experiencia nocturna mediante festivales temáticos con tecnología de iluminación de última generación, DJ sets internacionales y zonas VIP de primer nivel.',
    avatarUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80',
    rating: 4.92,
    reviewsCount: 154,
    eventsCount: 23,
    followersCount: 38400,
    verified: true,
    yearsOfExperience: 6,
    city: 'Barranquilla, Colombia',
    eventTypes: ['Electrónica VIP', 'Festivales Temáticos', 'Experiencias Neón', 'Private Lounges'],
    socials: {
      instagram: 'hangover.events',
      website: 'https://hangover.app',
      tiktok: 'hangover.events'
    },
    pastEvents: [
      {
        id: 'pe-1',
        title: 'Neon Nights 2025 Edition',
        date: '15 MAY 2025',
        location: 'La Fábrica, Barranquilla',
        imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80',
        status: 'completed',
        attendeesCount: 340,
        rating: 4.9
      },
      {
        id: 'pe-2',
        title: 'Summer Glow Festival',
        date: '20 ENE 2025',
        location: 'Koralia Beach, Santa Marta',
        imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80',
        status: 'completed',
        attendeesCount: 520,
        rating: 4.95
      },
      {
        id: 'pe-3',
        title: 'Midnight Velvet Lounge',
        date: '31 DIC 2024',
        location: 'Hilton Rooftop, Barranquilla',
        imageUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=600&q=80',
        status: 'completed',
        attendeesCount: 290,
        rating: 4.85
      }
    ],
    media: [
      {
        id: 'med-1',
        title: 'Official Aftermovie — Neon Nights 2025 (4K)',
        type: 'aftermovie',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80',
        duration: '03:45',
        viewsCount: 24500
      },
      {
        id: 'med-2',
        title: 'Highlights & VIP Experience — Summer Glow',
        type: 'highlight',
        thumbnailUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80',
        duration: '01:50',
        viewsCount: 18200
      }
    ],
    gallery: [
      {
        id: 'gal-1',
        imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80',
        caption: 'Escenario Principal Neon Nights',
        eventName: 'Neon Nights 2025'
      },
      {
        id: 'gal-2',
        imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80',
        caption: 'Zona VIP & Coctelería de Autor',
        eventName: 'Summer Glow Festival'
      },
      {
        id: 'gal-3',
        imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
        caption: 'Luces Láser & Producción Visual',
        eventName: 'Neon Nights 2025'
      }
    ],
    upcomingEvents: [
      {
        eventId: 'e1',
        title: 'Neon Nights VIP',
        date: 'VIE, 28 OCT • 10:00 PM',
        location: 'La Fábrica, Barranquilla',
        imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
        priceFrom: 55000
      }
    ]
  },

  'org-2': {
    id: 'org-2',
    name: 'Barranquilla Night Crew',
    companyName: 'BAQ Nightlife Crew S.A.S.',
    bio: 'Productores de entretenimiento nocturno premium. Especializados en eventos temáticos únicos.',
    fullBio: 'Barranquilla Night Crew es un colectivo de productores de eventos temáticos masivos como celebraciones de Halloween, fiestas retro y festivales universitarios premium.',
    avatarUrl: 'https://images.unsplash.com/photo-1574390353891-2f74ca31f9fc?w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1574390353891-2f74ca31f9fc?w=1200&q=80',
    rating: 4.78,
    reviewsCount: 98,
    eventsCount: 11,
    followersCount: 19200,
    verified: true,
    yearsOfExperience: 4,
    city: 'Barranquilla, Colombia',
    eventTypes: ['Eventos Temáticos', 'Halloween Rumba', 'Crossover', 'Fiestas Universitarias'],
    socials: {
      instagram: 'baq.nightcrew',
      tiktok: 'baqnightcrew'
    },
    pastEvents: [
      {
        id: 'pe-baq-1',
        title: 'Halloween Spooktacular 2024',
        date: '31 OCT 2024',
        location: 'Trucupey Club, Barranquilla',
        imageUrl: 'https://images.unsplash.com/photo-1574390353891-2f74ca31f9fc?w=600&q=80',
        status: 'completed',
        attendeesCount: 280,
        rating: 4.8
      }
    ],
    media: [
      {
        id: 'med-baq-1',
        title: 'Recap Halloween Costume Contest',
        type: 'highlight',
        thumbnailUrl: 'https://images.unsplash.com/photo-1574390353891-2f74ca31f9fc?w=600&q=80',
        duration: '02:15',
        viewsCount: 11200
      }
    ],
    gallery: [
      {
        id: 'gal-baq-1',
        imageUrl: 'https://images.unsplash.com/photo-1574390353891-2f74ca31f9fc?w=600&q=80',
        caption: 'Decoración inmersiva de terror',
        eventName: 'Halloween Spooktacular'
      }
    ],
    upcomingEvents: [
      {
        eventId: 'e2',
        title: 'Halloween Madness',
        date: 'SAB, 29 OCT • 9:00 PM',
        location: 'Trucupey, Barranquilla',
        imageUrl: 'https://images.unsplash.com/photo-1574390353891-2f74ca31f9fc?w=800&q=80',
        priceFrom: 80000
      }
    ]
  },

  'org-3': {
    id: 'org-3',
    name: 'Díscolo Producciones',
    companyName: 'Discoteca Díscolo S.A.S.',
    bio: 'La discoteca más moderna del norte de Barranquilla. Organizamos las mejores noches de reggaeton y urbano.',
    fullBio: 'Díscolo Producciones gestiona las noches temáticas de Discoteca Díscolo en el centro comercial Miramar. Especializados en conciertos de reggaeton, urban nights y presentaciones de artistas locales.',
    avatarUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=1200&q=80',
    rating: 4.75,
    reviewsCount: 82,
    eventsCount: 8,
    followersCount: 15600,
    verified: true,
    yearsOfExperience: 3,
    city: 'Barranquilla, Colombia',
    eventTypes: ['Reggaeton', 'Urban Nights', 'Club Parties'],
    socials: {
      instagram: 'discolo.baq'
    },
    pastEvents: [
      {
        id: 'pe-disc-1',
        title: 'Perreo Bellaco Volume 1',
        date: '12 SEP 2025',
        location: 'Díscolo Miramar',
        imageUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=600&q=80',
        status: 'completed',
        attendeesCount: 210,
        rating: 4.7
      }
    ],
    media: [],
    gallery: [],
    upcomingEvents: [
      {
        eventId: 'e3',
        title: 'Perreo Intenso',
        date: 'VIE, 04 NOV • 10:00 PM',
        location: 'Discoteca Díscolo, Barranquilla',
        imageUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&q=80',
        priceFrom: 40000
      }
    ]
  },

  'org-4': {
    id: 'org-4',
    name: 'Tropical Fiestas BAQ',
    companyName: 'Tropical Fiestas & Cultura Caribe',
    bio: 'Promotores de la cultura tropical y salsera en Barranquilla. Más de 10 años celebrando la música del Caribe.',
    fullBio: 'Tropical Fiestas BAQ celebra la tradición musical caribeña mediante festivales de salsa brava, noches de orquestas en vivo y eventos folclóricos premium.',
    avatarUrl: 'https://images.unsplash.com/photo-1508215885820-4585e5610e28?w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1508215885820-4585e5610e28?w=1200&q=80',
    rating: 4.88,
    reviewsCount: 210,
    eventsCount: 42,
    followersCount: 26500,
    verified: true,
    yearsOfExperience: 10,
    city: 'Barranquilla, Colombia',
    eventTypes: ['Salsa Brava', 'Orquestas en Vivo', 'Festivales Tropicales'],
    socials: {
      instagram: 'tropicalfiestas.baq'
    },
    pastEvents: [
      {
        id: 'pe-trop-1',
        title: 'Salsa al Parque BAQ 2024',
        date: '10 AGO 2024',
        location: 'La Troja, Barranquilla',
        imageUrl: 'https://images.unsplash.com/photo-1508215885820-4585e5610e28?w=600&q=80',
        status: 'completed',
        attendeesCount: 450,
        rating: 4.9
      }
    ],
    media: [],
    gallery: [],
    upcomingEvents: [
      {
        eventId: 'e4',
        title: 'Salsa & Flow',
        date: 'SAB, 05 NOV • 8:00 PM',
        location: 'La Troja, Barranquilla',
        imageUrl: 'https://images.unsplash.com/photo-1508215885820-4585e5610e28?w=800&q=80',
        priceFrom: 30000
      }
    ]
  }
};

// Función auxiliar para obtener perfil de organizador por ID desde el catálogo estático
export function getOrganizerById(id: string): OrganizerProfile | null {
  if (id && MOCK_ORGANIZERS[id]) {
    return MOCK_ORGANIZERS[id];
  }
  return null;
}

