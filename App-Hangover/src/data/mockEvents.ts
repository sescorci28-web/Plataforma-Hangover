// ============================================
// TIPOS
// ============================================

export interface TicketBatch {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  soldCount: number;
  status: 'active' | 'sold_out' | 'coming_soon';
  maxPerOrder: number;
}

export interface LineupArtist {
  id: string;
  name: string;
  performanceTime: string;
  description: string;
  imageUrl: string;
}

export interface EventAmenities {
  hasParking: boolean;
  hasVipZone: boolean;
  hasTablesModule: boolean;
  isAdultsOnly: boolean;
  isFreeEntry: boolean;
}

export interface EventOrganizer {
  id: string;
  name: string;
  bio: string;
  avatarUrl: string | null;
  instagram: string | null;
  eventsCount: number;
  rating: number;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface EventInfo {
  id: string;
  title: string;
  date: string;               // Display string (e.g. "VIE, 28 OCT • 10:00 PM")
  dateISO: string;            // ISO string for countdown logic
  location: string;
  openTime: string;
  closeTime: string;
  dressCode: string;
  minAge: string;
  category: string;
  imageUrl: string;
  description: string;
  attendeeCount: number;
  capacity: number;
  views: number;
  rating: number;
  reviewsCount: number;
  isFeatured: boolean;
  isTrending: boolean;
  ticketBatches: TicketBatch[];
  lineup: LineupArtist[];
  amenities: EventAmenities;
  organizer: EventOrganizer;
  relatedEventIds: string[];
  faqs: FaqItem[];
}

// ============================================
// DATOS DE MUESTRA
// ============================================

const DEFAULT_FAQS: FaqItem[] = [
  {
    question: '¿Hay parqueadero disponible?',
    answer: 'Sí, el establecimiento cuenta con parqueadero privado vigilado y servicio de Valet Parking en la entrada principal.'
  },
  {
    question: '¿Aceptan tarjetas de crédito y pagos digitales?',
    answer: 'Sí, se aceptan todas las tarjetas de crédito (Visa, MasterCard, Amex) y métodos de pago digital.'
  },
  {
    question: '¿Se permite el reingreso al recinto?',
    answer: 'Por políticas de seguridad del local, una vez valides tu código QR de entrada y salgas, no se permitirá el reingreso con el mismo ticket.'
  },
  {
    question: '¿Existe restricción de edad?',
    answer: 'El evento es de ingreso exclusivo para mayores de edad (+18). Obligatorio presentar documento de identidad físico.'
  }
];

export const MOCK_EVENTS: EventInfo[] = [
  {
    id: '00000000-0000-4000-a000-000000000001',
    title: 'Neon Nights VIP',
    date: 'VIE, 28 OCT • 10:00 PM',
    dateISO: '2026-10-28T22:00:00',
    location: 'La Fábrica, Cra. 44 # 70-15, Barranquilla',
    openTime: '10:00 PM',
    closeTime: '4:00 AM',
    dressCode: 'Urbano Elegante',
    minAge: 'Exclusivo +18 (DNI requerido)',
    category: 'electronica',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
    description: 'La mejor fiesta de electrónica de la ciudad con luces neón y ambiente exclusivo. Tres pisos de música, zonas VIP y barras premium. DJ sets de más de 6 horas con artistas internacionales. El evento más esperado del año en Barranquilla.',
    attendeeCount: 218,
    capacity: 350,
    views: 1240,
    rating: 4.9,
    reviewsCount: 47,
    isFeatured: true,
    isTrending: true,
    ticketBatches: [
      {
        id: '00000000-0000-4000-b000-000000000101',
        name: '🎟️ Preventa Early Bird',
        description: 'Precio especial para los primeros en reservar. Acceso general.',
        price: 40000,
        capacity: 50,
        soldCount: 50,
        status: 'sold_out',
        maxPerOrder: 4
      },
      {
        id: '00000000-0000-4000-b000-000000000102',
        name: '⚡ General — Etapa 1',
        description: 'Acceso total al evento. Ingreso por fila general.',
        price: 55000,
        capacity: 200,
        soldCount: 168,
        status: 'active',
        maxPerOrder: 6
      },
      {
        id: '00000000-0000-4000-b000-000000000103',
        name: '👑 VIP Zone & Exclusive Lounge',
        description: 'Mesa VIP, servicio de botella, acceso exclusivo al lounge y vista privilegiada.',
        price: 120000,
        capacity: 100,
        soldCount: 40,
        status: 'active',
        maxPerOrder: 10
      }
    ],
    lineup: [
      {
        id: 'l1-1',
        name: 'DJ Tiësto',
        performanceTime: '11:00 PM - 1:00 AM',
        description: 'DJ y productor holandés, uno de los DJs más influyentes del mundo.',
        imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&q=80'
      },
      {
        id: 'l1-2',
        name: 'Martin Garrix',
        performanceTime: '1:00 AM - 3:00 AM',
        description: 'Productor holandés de 27 años, reconocido por su energético estilo de EDM.',
        imageUrl: 'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=200&q=80'
      }
    ],
    amenities: {
      hasParking: true,
      hasVipZone: true,
      hasTablesModule: true,
      isAdultsOnly: true,
      isFreeEntry: false
    },
    organizer: {
      id: 'org-1',
      name: 'Hangover Events',
      bio: 'Organizadores oficiales de los mejores eventos nocturnos de la costa caribe. Más de 5 años elevando la experiencia nocturna de Barranquilla.',
      avatarUrl: null,
      instagram: 'hangover.events',
      eventsCount: 23,
      rating: 4.9
    },
    relatedEventIds: ['00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000003'],
    faqs: DEFAULT_FAQS
  },
  {
    id: '00000000-0000-4000-a000-000000000002',
    title: 'Halloween Madness',
    date: 'SAB, 29 OCT • 9:00 PM',
    dateISO: '2026-10-29T21:00:00',
    location: 'Trucupey, Portal del Prado, Barranquilla',
    openTime: '9:00 PM',
    closeTime: '3:00 AM',
    dressCode: 'Disfraz Obligatorio',
    minAge: 'Mayores de 18 años (+18)',
    category: 'crossover',
    imageUrl: 'https://images.unsplash.com/photo-1574390353891-2f74ca31f9fc?w=800&q=80',
    description: 'Celebra Halloween con el mejor crossover de la ciudad. Concurso de disfraces con premios en efectivo. Decoración temática inmersiva, efectos especiales y dos escenarios simultáneos.',
    attendeeCount: 120,
    capacity: 300,
    views: 870,
    rating: 4.7,
    reviewsCount: 31,
    isFeatured: false,
    isTrending: true,
    ticketBatches: [
      {
        id: '00000000-0000-4000-b000-000000000201',
        name: '⚡ General',
        description: 'Acceso al evento. Disfraz obligatorio para ingresar.',
        price: 80000,
        capacity: 220,
        soldCount: 100,
        status: 'active',
        maxPerOrder: 6
      },
      {
        id: '00000000-0000-4000-b000-000000000202',
        name: '👑 VIP Premium',
        description: 'Mesa VIP, botella de bienvenida y acceso prioritario.',
        price: 180000,
        capacity: 80,
        soldCount: 20,
        status: 'active',
        maxPerOrder: 8
      }
    ],
    lineup: [
      {
        id: 'l2-1',
        name: 'DJ Kaleb',
        performanceTime: '10:00 PM - 12:00 AM',
        description: 'Referente del crossover en la costa caribe colombiana.',
        imageUrl: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=200&q=80'
      },
      {
        id: 'l2-2',
        name: 'DJ Mauro',
        performanceTime: '12:00 AM - 2:00 AM',
        description: 'Especialista en fusionar géneros urbanos y electrónica.',
        imageUrl: 'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=200&q=80'
      }
    ],
    amenities: {
      hasParking: true,
      hasVipZone: true,
      hasTablesModule: false,
      isAdultsOnly: true,
      isFreeEntry: false
    },
    organizer: {
      id: 'org-2',
      name: 'Barranquilla Night Crew',
      bio: 'Productores de entretenimiento nocturno premium. Especializados en eventos temáticos únicos en la ciudad.',
      avatarUrl: null,
      instagram: 'baq.nightcrew',
      eventsCount: 11,
      rating: 4.7
    },
    relatedEventIds: ['00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000004'],
    faqs: DEFAULT_FAQS
  },
  {
    id: '00000000-0000-4000-a000-000000000003',
    title: 'Perreo Intenso',
    date: 'VIE, 04 NOV • 10:00 PM',
    dateISO: '2026-11-04T22:00:00',
    location: 'Discoteca Díscolo, C.C. Miramar, Barranquilla',
    openTime: '10:00 PM',
    closeTime: '4:00 AM',
    dressCode: 'Urbano Chic',
    minAge: 'Exclusivo +18',
    category: 'reggaeton',
    imageUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&q=80',
    description: 'Solo reggaeton viejo y nuevo hasta el amanecer. Dos pisos de pura vibra urbana con los DJs más solicitados del género en la ciudad. Ambiente exclusivo y barras premium.',
    attendeeCount: 55,
    capacity: 200,
    views: 430,
    rating: 4.5,
    reviewsCount: 18,
    isFeatured: false,
    isTrending: false,
    ticketBatches: [
      {
        id: '00000000-0000-4000-b000-000000000301',
        name: '⚡ General',
        description: 'Acceso completo al evento.',
        price: 40000,
        capacity: 180,
        soldCount: 55,
        status: 'active',
        maxPerOrder: 8
      }
    ],
    lineup: [
      {
        id: 'l3-1',
        name: 'DJ Jota',
        performanceTime: '10:30 PM - 1:00 AM',
        description: 'Exponente número 1 del reggaeton en la costa caribe.',
        imageUrl: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=200&q=80'
      },
      {
        id: 'l3-2',
        name: 'DJ Flow',
        performanceTime: '1:00 AM - 4:00 AM',
        description: 'Especialista en perreo clásico y drill latino.',
        imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&q=80'
      }
    ],
    amenities: {
      hasParking: false,
      hasVipZone: true,
      hasTablesModule: false,
      isAdultsOnly: true,
      isFreeEntry: false
    },
    organizer: {
      id: 'org-3',
      name: 'Díscolo Producciones',
      bio: 'La disoteca más moderna del norte de Barranquilla. Organizamos las mejores noches de reggaeton y urbano de la ciudad.',
      avatarUrl: null,
      instagram: 'discolo.baq',
      eventsCount: 8,
      rating: 4.5
    },
    relatedEventIds: ['00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000004'],
    faqs: DEFAULT_FAQS
  },
  {
    id: '00000000-0000-4000-a000-000000000004',
    title: 'Salsa & Flow',
    date: 'SAB, 05 NOV • 8:00 PM',
    dateISO: '2026-11-05T20:00:00',
    location: 'La Troja, Barranquilla',
    openTime: '8:00 PM',
    closeTime: '2:00 AM',
    dressCode: 'Casual Elegante',
    minAge: 'Todo Público (con acompañante adulto menores)',
    category: 'salsa',
    imageUrl: 'https://images.unsplash.com/photo-1508215885820-4585e5610e28?w=800&q=80',
    description: 'Noche de salsa brava y ritmos tropicales con orquesta en vivo. Ven a bailar hasta que el cuerpo aguante. Clases de salsa gratuitas a las 7:00 PM para todos los asistentes con boleta.',
    attendeeCount: 180,
    capacity: 400,
    views: 2100,
    rating: 4.8,
    reviewsCount: 92,
    isFeatured: true,
    isTrending: false,
    ticketBatches: [
      {
        id: '00000000-0000-4000-b000-000000000401',
        name: '🎟️ General',
        description: 'Incluye acceso al evento y clase de salsa.',
        price: 30000,
        capacity: 300,
        soldCount: 160,
        status: 'active',
        maxPerOrder: 10
      },
      {
        id: '00000000-0000-4000-b000-000000000402',
        name: '🍾 Mesa con Botella',
        description: 'Mesa para 4 personas + botella incluida + acceso prioritario.',
        price: 250000,
        capacity: 100,
        soldCount: 20,
        status: 'active',
        maxPerOrder: 4
      }
    ],
    lineup: [
      {
        id: 'l4-1',
        name: 'Orquesta La Salsa Mayor',
        performanceTime: '8:30 PM - 11:00 PM',
        description: 'La orquesta de salsa más reconocida de la costa caribe con 15 músicos en tarima.',
        imageUrl: 'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=200&q=80'
      },
      {
        id: 'l4-2',
        name: 'DJ Salsero',
        performanceTime: '11:00 PM - 2:00 AM',
        description: 'El DJ que mejor mezcla salsa clásica y moderna del Caribe.',
        imageUrl: 'https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=200&q=80'
      }
    ],
    amenities: {
      hasParking: true,
      hasVipZone: false,
      hasTablesModule: true,
      isAdultsOnly: false,
      isFreeEntry: false
    },
    organizer: {
      id: 'org-4',
      name: 'Tropical Fiestas BAQ',
      bio: 'Promotores de la cultura tropical y salsera en Barranquilla. Llevamos más de 10 años celebrando la música del Caribe.',
      avatarUrl: null,
      instagram: 'tropicalfiestas.baq',
      eventsCount: 42,
      rating: 4.8
    },
    relatedEventIds: ['00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000003'],
    faqs: DEFAULT_FAQS
  }
];
