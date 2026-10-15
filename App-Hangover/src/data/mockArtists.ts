// ============================================
// TIPOS Y MODELOS DE ARTISTA
// ============================================

export interface ArtistTrack {
  id: string;
  title: string;
  album?: string;
  duration: string;
  releaseYear: string;
  coverUrl: string;
  playsCount: number;
  genre: string;
  previewAudioUrl?: string; // Arquitectura lista para audio streaming futuro
}

export interface ArtistSet {
  id: string;
  title: string;
  recordedAt: string;
  duration: string;
  coverUrl: string;
  playsCount: number;
  genre: string;
}

export interface ArtistVideo {
  id: string;
  title: string;
  recordedAt: string;
  duration: string;
  viewsCount: number;
  thumbnailUrl: string;
  videoUrl?: string;
}

export interface ArtistSocials {
  instagram?: string;
  spotify?: string;
  soundcloud?: string;
  youtube?: string;
  tiktok?: string;
}

export interface UpcomingArtistEvent {
  eventId: string;
  eventTitle: string;
  date: string;
  location: string;
  performanceTime: string;
  imageUrl: string;
}

export interface ArtistProfile {
  id: string;
  name: string;
  stageName?: string;
  role: string;
  genres: string[];
  location: string;
  bio: string;
  fullBio: string;
  avatarUrl: string;
  bannerUrl: string;
  rating: number;
  followersCount: number;
  verified: boolean;
  socials: ArtistSocials;
  tracks: ArtistTrack[];
  sets: ArtistSet[];
  videos: ArtistVideo[];
  upcomingEvents: UpcomingArtistEvent[];
}

// ============================================
// CATALOGO ESTÁTICO DE ARTISTAS
// ============================================

export const MOCK_ARTISTS: Record<string, ArtistProfile> = {
  'l1-1': {
    id: 'l1-1',
    name: 'DJ Tiësto',
    stageName: 'Tiësto',
    role: 'DJ & Producer Internacional',
    genres: ['EDM', 'Progressive House', 'Trance'],
    location: 'Breda, Países Bajos',
    bio: 'Ícono mundial de la música electrónica, pionero del EDM y ganador del Grammy.',
    fullBio: 'Tijs Michiel Verwest, conocido mundialmente como Tiësto, es un DJ y productor neerlandés. Es considerado por publicaciones especializadas como una de las mayores leyendas de la música electrónica de todos los tiempos. Con más de tres décadas de trayectoria, encabeza los festivales más importantes del planeta como Tomorrowland, Ultra Music Festival y EDC.',
    avatarUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80',
    rating: 4.98,
    followersCount: 1450000,
    verified: true,
    socials: {
      instagram: 'tiesto',
      spotify: 'tiesto',
      soundcloud: 'tiesto',
      youtube: 'tiesto'
    },
    tracks: [
      {
        id: 'tr-1',
        title: 'The Business',
        album: 'Drive',
        duration: '2:44',
        releaseYear: '2020',
        coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80',
        playsCount: 1250000000,
        genre: 'Deep House / Dance'
      },
      {
        id: 'tr-2',
        title: '10:35 (feat. Tate McRae)',
        album: 'Drive',
        duration: '2:52',
        releaseYear: '2022',
        coverUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&q=80',
        playsCount: 680000000,
        genre: 'Dance Pop'
      },
      {
        id: 'tr-3',
        title: 'Red Lights',
        album: 'A Town Called Paradise',
        duration: '4:22',
        releaseYear: '2014',
        coverUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&q=80',
        playsCount: 450000000,
        genre: 'Progressive House'
      }
    ],
    sets: [
      {
        id: 'set-1',
        title: 'Live @ Tomorrowland Belgium 2025 (Mainstage)',
        recordedAt: 'Boom, Bélgica',
        duration: '1h 15m',
        coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80',
        playsCount: 3400000,
        genre: 'EDM Mainstage'
      },
      {
        id: 'set-2',
        title: 'Club Life 850 — Special Sunset Set',
        recordedAt: 'Ibiza, España',
        duration: '2h 00m',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
        playsCount: 1850000,
        genre: 'Tech House & Future Rave'
      }
    ],
    videos: [
      {
        id: 'vid-1',
        title: 'Tiësto — Live at Ultra Music Festival Miami 2025',
        recordedAt: 'Miami, USA',
        duration: '58:20',
        viewsCount: 5200000,
        thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&q=80'
      },
      {
        id: 'vid-2',
        title: 'Behind The Scenes — World Tour 2025',
        recordedAt: 'Documental',
        duration: '14:15',
        viewsCount: 980000,
        thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80'
      }
    ],
    upcomingEvents: [
      {
        eventId: 'e1',
        eventTitle: 'Neon Nights VIP',
        date: 'VIE, 28 OCT • 10:00 PM',
        location: 'La Fábrica, Barranquilla',
        performanceTime: '11:00 PM - 1:00 AM',
        imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80'
      }
    ]
  },
  'l1-2': {
    id: 'l1-2',
    name: 'Martin Garrix',
    stageName: 'Martin Garrix',
    role: 'DJ & Productor de EDM',
    genres: ['Electro House', 'Future Bass', 'Progressive House'],
    location: 'Amstelveen, Países Bajos',
    bio: 'Reconocido número 1 mundial en DJ Mag, creador del himno Animals.',
    fullBio: 'Martijn Gerard Garritsen, conocido comercialmente como Martin Garrix, es un DJ, remixer y productor musical neerlandés. Alcanzó la fama internacional a los 17 años con su sencillo Animals. Es el fundador del sello STMPD RCRDS y figura principal de los más grandes festivales del planeta.',
    avatarUrl: 'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1200&q=80',
    rating: 4.96,
    followersCount: 1890000,
    verified: true,
    socials: {
      instagram: 'martingarrix',
      spotify: 'martingarrix',
      youtube: 'martingarrix'
    },
    tracks: [
      {
        id: 'tr-mg1',
        title: 'Animals',
        album: 'Gold Skies EP',
        duration: '5:04',
        releaseYear: '2013',
        coverUrl: 'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=300&q=80',
        playsCount: 1600000000,
        genre: 'Electro House'
      },
      {
        id: 'tr-mg2',
        title: 'In the Name of Love (feat. Bebe Rexha)',
        album: 'Single',
        duration: '3:15',
        releaseYear: '2016',
        coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80',
        playsCount: 1400000000,
        genre: 'Future Bass'
      }
    ],
    sets: [
      {
        id: 'set-mg1',
        title: 'STMPD RCRDS Showcase — RAI Amsterdam',
        recordedAt: 'Amsterdam Dance Event',
        duration: '1h 45m',
        coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80',
        playsCount: 2900000,
        genre: 'Progressive & Future House'
      }
    ],
    videos: [
      {
        id: 'vid-mg1',
        title: 'Martin Garrix Live @ Ushuaïa Ibiza 2025',
        recordedAt: 'Ibiza, España',
        duration: '1h 30m',
        viewsCount: 4100000,
        thumbnailUrl: 'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=500&q=80'
      }
    ],
    upcomingEvents: [
      {
        eventId: 'e1',
        eventTitle: 'Neon Nights VIP',
        date: 'VIE, 28 OCT • 10:00 PM',
        location: 'La Fábrica, Barranquilla',
        performanceTime: '1:00 AM - 3:00 AM',
        imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80'
      }
    ]
  },
  'l2-1': {
    id: 'l2-1',
    name: 'DJ Kaleb',
    stageName: 'Kaleb',
    role: 'DJ & Productor Crossover',
    genres: ['Crossover', 'Reggaeton', 'Electro Dance'],
    location: 'Barranquilla, Colombia',
    bio: 'Referente número 1 del crossover y la rumba en la Costa Caribe colombiana.',
    fullBio: 'DJ Kaleb es uno de los DJs más influyentes en el circuito nocturno de Barranquilla y Cartagena. Con más de 10 años haciendo vibrar los mejores clubes y festivales de la región, destaca por sus mezclas en vivo cargadas de energía, perreo y beats electrónicos.',
    avatarUrl: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1574390353891-2f74ca31f9fc?w=1200&q=80',
    rating: 4.88,
    followersCount: 48500,
    verified: true,
    socials: {
      instagram: 'djkaleb.co',
      spotify: 'djkaleb',
      soundcloud: 'djkaleb-mixes'
    },
    tracks: [
      {
        id: 'tr-k1',
        title: 'Caribe Night Beats (Extended Mix)',
        album: 'Costa Vibes EP',
        duration: '3:40',
        releaseYear: '2025',
        coverUrl: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=300&q=80',
        playsCount: 125000,
        genre: 'Afro House / Crossover'
      }
    ],
    sets: [
      {
        id: 'set-k1',
        title: 'Halloween Edition — Rumba Live Set 2025',
        recordedAt: 'Trucupey Club',
        duration: '1h 20m',
        coverUrl: 'https://images.unsplash.com/photo-1574390353891-2f74ca31f9fc?w=400&q=80',
        playsCount: 89000,
        genre: 'Crossover Live'
      }
    ],
    videos: [
      {
        id: 'vid-k1',
        title: 'DJ Kaleb Live Performance — Carnaval Fest',
        recordedAt: 'Barranquilla',
        duration: '24:10',
        viewsCount: 145000,
        thumbnailUrl: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=500&q=80'
      }
    ],
    upcomingEvents: [
      {
        eventId: 'e2',
        eventTitle: 'Halloween Madness',
        date: 'SAB, 29 OCT • 9:00 PM',
        location: 'Trucupey, Barranquilla',
        performanceTime: '10:00 PM - 12:00 AM',
        imageUrl: 'https://images.unsplash.com/photo-1574390353891-2f74ca31f9fc?w=800&q=80'
      }
    ]
  },
  'l2-2': {
    id: 'l2-2',
    name: 'DJ Mauro',
    stageName: 'Mauro Live',
    role: 'DJ & Sound Selector Urban-Electro',
    genres: ['Urban Dance', 'Reggaeton Old School', 'Guaracha'],
    location: 'Medellín / Barranquilla',
    bio: 'Especialista en fusionar ritmos urbanos contemporáneos y sintetizadores electrónicos.',
    fullBio: 'DJ Mauro ha llevado el sonido urbano a otro nivel en las noches colombianas. Sus sets combinan transiciones perfectas entre reggaeton clásico, guaracha de alta fidelidad y house latino.',
    avatarUrl: 'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1574390353891-2f74ca31f9fc?w=1200&q=80',
    rating: 4.82,
    followersCount: 32000,
    verified: false,
    socials: {
      instagram: 'djmaurolive',
      soundcloud: 'mauro-mix'
    },
    tracks: [
      {
        id: 'tr-m1',
        title: 'Fuego Callejero',
        duration: '3:10',
        releaseYear: '2024',
        coverUrl: 'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=300&q=80',
        playsCount: 94000,
        genre: 'Guaracha Electro'
      }
    ],
    sets: [
      {
        id: 'set-m1',
        title: 'Midnight Perreo & Electro Mix 2025',
        recordedAt: 'Discoteca Díscolo',
        duration: '1h 05m',
        coverUrl: 'https://images.unsplash.com/photo-1574390353891-2f74ca31f9fc?w=400&q=80',
        playsCount: 62000,
        genre: 'Urban Flow'
      }
    ],
    videos: [],
    upcomingEvents: [
      {
        eventId: 'e2',
        eventTitle: 'Halloween Madness',
        date: 'SAB, 29 OCT • 9:00 PM',
        location: 'Trucupey, Barranquilla',
        performanceTime: '12:00 AM - 2:00 AM',
        imageUrl: 'https://images.unsplash.com/photo-1574390353891-2f74ca31f9fc?w=800&q=80'
      }
    ]
  },
  'l3-1': {
    id: 'l3-1',
    name: 'DJ Jota',
    stageName: 'Jota Perreo',
    role: 'El Rey del Perreo Clásico',
    genres: ['Reggaeton 2000s', 'Dancehall', 'Dembow'],
    location: 'Barranquilla, Colombia',
    bio: 'Residente principal de las noches de reggaeton más concurridas de la ciudad.',
    fullBio: 'DJ Jota es el encargado de encender la pista con lo mejor del reggaeton de la vieja y nueva escuela. Su selección musical garantiza energía ininterrumpida hasta el amanecer.',
    avatarUrl: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=1200&q=80',
    rating: 4.91,
    followersCount: 54000,
    verified: true,
    socials: {
      instagram: 'djjotabaq',
      spotify: 'djjota'
    },
    tracks: [
      {
        id: 'tr-j1',
        title: 'Perreo Bellaco (Bootleg Mix)',
        duration: '3:30',
        releaseYear: '2025',
        coverUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=300&q=80',
        playsCount: 210000,
        genre: 'Reggaeton'
      }
    ],
    sets: [
      {
        id: 'set-j1',
        title: 'TBT Reggaeton 2000s — Live Mix',
        recordedAt: 'Díscolo Miramar',
        duration: '1h 30m',
        coverUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=400&q=80',
        playsCount: 145000,
        genre: 'Perreo Clásico'
      }
    ],
    videos: [],
    upcomingEvents: [
      {
        eventId: 'e3',
        eventTitle: 'Perreo Intenso',
        date: 'VIE, 04 NOV • 10:00 PM',
        location: 'Discoteca Díscolo, Barranquilla',
        performanceTime: '10:30 PM - 1:00 AM',
        imageUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&q=80'
      }
    ]
  },
  'l3-2': {
    id: 'l3-2',
    name: 'DJ Flow',
    stageName: 'Flow Urbano',
    role: 'DJ & Beatmaker Latino',
    genres: ['Trap Latino', 'Drill', 'Perreo'],
    location: 'Cartagena, Colombia',
    bio: 'Beatmaker y DJ innovador con remixes virales en plataformas digitales.',
    fullBio: 'DJ Flow ha colaborado con los principales exponentes emergentes del género urbano en el Caribe. Sus presentaciones son conocidas por la potencia de sus graves y producciones en vivo.',
    avatarUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=1200&q=80',
    rating: 4.79,
    followersCount: 28000,
    verified: false,
    socials: {
      instagram: 'djflowofficial',
      youtube: 'djflowbeats'
    },
    tracks: [],
    sets: [
      {
        id: 'set-fl1',
        title: 'Midnight Perreo & Drill session',
        recordedAt: 'Discoteca Díscolo',
        duration: '1h 10m',
        coverUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=400&q=80',
        playsCount: 51000,
        genre: 'Drill & Reggaeton'
      }
    ],
    videos: [],
    upcomingEvents: [
      {
        eventId: 'e3',
        eventTitle: 'Perreo Intenso',
        date: 'VIE, 04 NOV • 10:00 PM',
        location: 'Discoteca Díscolo, Barranquilla',
        performanceTime: '1:00 AM - 4:00 AM',
        imageUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&q=80'
      }
    ]
  },
  'l4-1': {
    id: 'l4-1',
    name: 'Orquesta La Salsa Mayor',
    stageName: 'La Salsa Mayor',
    role: 'Orquesta de Salsa Brava en Vivo',
    genres: ['Salsa Brava', 'Son Montuno', 'Mambo'],
    location: 'Barranquilla, Colombia',
    bio: 'Agrupación insignia de salsa con más de 15 músicos en escena y percusión en vivo.',
    fullBio: 'Orquesta La Salsa Mayor lleva más de 15 años deleitando a los amantes de la buena salsa en Colombia. Reconocidos por su potente sección de vientos y el auténtico sabor caribeño en cada uno de sus conciertos.',
    avatarUrl: 'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1508215885820-4585e5610e28?w=1200&q=80',
    rating: 4.95,
    followersCount: 89000,
    verified: true,
    socials: {
      instagram: 'lasalsamayor.baq',
      spotify: 'lasalsamayor',
      youtube: 'lasalsamayoroficial'
    },
    tracks: [
      {
        id: 'tr-sm1',
        title: 'Pregón de la 44 (En Vivo)',
        album: 'Sabor de la Arenosa',
        duration: '5:12',
        releaseYear: '2023',
        coverUrl: 'https://images.unsplash.com/photo-1508215885820-4585e5610e28?w=300&q=80',
        playsCount: 380000,
        genre: 'Salsa Brava'
      }
    ],
    sets: [
      {
        id: 'set-sm1',
        title: 'Concierto en Vivo — La Troja Fest',
        recordedAt: 'La Troja Barranquilla',
        duration: '1h 50m',
        coverUrl: 'https://images.unsplash.com/photo-1508215885820-4585e5610e28?w=400&q=80',
        playsCount: 240000,
        genre: 'Salsa en Vivo'
      }
    ],
    videos: [
      {
        id: 'vid-sm1',
        title: 'La Salsa Mayor — Homenaje a la Salsa Brava (En Vivo)',
        recordedAt: 'Barranquilla',
        duration: '45:30',
        viewsCount: 650000,
        thumbnailUrl: 'https://images.unsplash.com/photo-1508215885820-4585e5610e28?w=500&q=80'
      }
    ],
    upcomingEvents: [
      {
        eventId: 'e4',
        eventTitle: 'Salsa & Flow',
        date: 'SAB, 05 NOV • 8:00 PM',
        location: 'La Troja, Barranquilla',
        performanceTime: '8:30 PM - 11:00 PM',
        imageUrl: 'https://images.unsplash.com/photo-1508215885820-4585e5610e28?w=800&q=80'
      }
    ]
  },
  'l4-2': {
    id: 'l4-2',
    name: 'DJ Salsero',
    stageName: 'El DJ Salsero',
    role: 'Coleccionista & Sound Selector Salsero',
    genres: ['Salsa Clásica', 'Vinyl Session', 'Boogaloo'],
    location: 'Barranquilla, Colombia',
    bio: 'Maestro de la salsa en vinilo y preservador del sonido clásico del Caribe.',
    fullBio: 'DJ Salsero posee una de las colecciones de vinilos de salsa más valiosas de la región caribe. Sus mezclas transportan a la época dorada de la Fania All Stars con sonido analógico de alta pureza.',
    avatarUrl: 'https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1508215885820-4585e5610e28?w=1200&q=80',
    rating: 4.89,
    followersCount: 22000,
    verified: false,
    socials: {
      instagram: 'djsalserobaq'
    },
    tracks: [],
    sets: [
      {
        id: 'set-sal1',
        title: 'Salsa en Vinilo — Noche Trojera 2025',
        recordedAt: 'La Troja',
        duration: '2h 15m',
        coverUrl: 'https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=400&q=80',
        playsCount: 98000,
        genre: 'Salsa Vinyl Set'
      }
    ],
    videos: [],
    upcomingEvents: [
      {
        eventId: 'e4',
        eventTitle: 'Salsa & Flow',
        date: 'SAB, 05 NOV • 8:00 PM',
        location: 'La Troja, Barranquilla',
        performanceTime: '11:00 PM - 2:00 AM',
        imageUrl: 'https://images.unsplash.com/photo-1508215885820-4585e5610e28?w=800&q=80'
      }
    ]
  }
};

// Función auxiliar para obtener perfil de artista por ID con fallback
export function getArtistById(id: string): ArtistProfile {
  if (MOCK_ARTISTS[id]) {
    return MOCK_ARTISTS[id];
  }
  // Generador dinámico de artista si el ID no existe en el mock
  return {
    id,
    name: 'Artista Hangover',
    stageName: 'Artist',
    role: 'DJ & Performer',
    genres: ['Electrónica', 'Crossover'],
    location: 'Barranquilla, Colombia',
    bio: 'Artista exclusivo de la plataforma Hangover Events.',
    fullBio: 'Artista profesional registrado en la red de talentos Hangover. Preparado para ofrecer espectáculos musicales de alta fidelidad en clubes y festivales.',
    avatarUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80',
    rating: 4.8,
    followersCount: 15000,
    verified: true,
    socials: {
      instagram: 'hangover.events'
    },
    tracks: [
      {
        id: 'tr-fallback-1',
        title: 'Hangover Anthem (Original Mix)',
        duration: '3:45',
        releaseYear: '2025',
        coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80',
        playsCount: 50000,
        genre: 'Dance'
      }
    ],
    sets: [
      {
        id: 'set-fallback-1',
        title: 'Hangover Live Session 2025',
        recordedAt: 'Mainstage',
        duration: '1h 00m',
        coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80',
        playsCount: 30000,
        genre: 'Live DJ Set'
      }
    ],
    videos: [],
    upcomingEvents: []
  };
}
