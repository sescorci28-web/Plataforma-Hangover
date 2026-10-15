// ============================================
// MODELOS Y TIPOS DE LA COMUNIDAD DEL EVENTO
// ============================================

export type ConnectionStatus = 'none' | 'pending_sent' | 'pending_received' | 'connected';
export type PresenceStatus = 'checked_in' | 'confirmed' | 'past_attendee';
export type EventStateStatus = 'upcoming' | 'live' | 'ended';

export interface CommunityMember {
  id: string;
  eventId: string;
  name: string;
  age?: number;
  city: string;
  avatarUrl: string;
  bio: string;
  statusText: string;
  presenceStatus: PresenceStatus;
  checkedInAt?: string;
  musicInterests: string[];
  pastEvents: string[];
  mutualConnectionsCount: number;
  connectionStatus: ConnectionStatus;
}

export interface EventCommunitySummary {
  eventId: string;
  totalPresent: number;
  stateStatus: EventStateStatus;
  statusHeadline: string;
  members: CommunityMember[];
}

// ============================================
// DATOS MOCK DE ASISTENTES DE LA COMUNIDAD
// ============================================

export const MOCK_COMMUNITY_MEMBERS: Record<string, EventCommunitySummary> = {
  'e1': {
    eventId: 'e1',
    totalPresent: 128,
    stateStatus: 'live',
    statusHeadline: '● EN VIVO · 128 personas presentes',
    members: [
      {
        id: 'mem-e1-1',
        eventId: 'e1',
        name: 'Laura Martínez',
        age: 24,
        city: 'Barranquilla',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
        bio: 'Amante del techno, los festivales al aire libre y conocer gente nueva con buena energía.',
        statusText: 'Está aquí ahora',
        presenceStatus: 'checked_in',
        checkedInAt: '2026-10-28T22:15:00Z',
        musicInterests: ['Techno', 'House', 'Melodic Techno'],
        pastEvents: ['Neon Nights VIP 2025', 'Summer Beach Fest', 'Díscolo Night'],
        mutualConnectionsCount: 4,
        connectionStatus: 'none'
      },
      {
        id: 'mem-e1-2',
        eventId: 'e1',
        name: 'Carlos Rodríguez',
        age: 27,
        city: 'Barranquilla',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80',
        bio: 'DJ aficionado y seguidor fiel de Tiësto. Nos vemos en la pista de baile.',
        statusText: 'Le gusta la música electrónica',
        presenceStatus: 'checked_in',
        checkedInAt: '2026-10-28T22:30:00Z',
        musicInterests: ['EDM', 'Electro House', 'Progressive'],
        pastEvents: ['Ultra Colombia', 'Neon Nights VIP'],
        mutualConnectionsCount: 2,
        connectionStatus: 'pending_sent'
      },
      {
        id: 'mem-e1-3',
        eventId: 'e1',
        name: 'Andrea Gómez',
        age: 22,
        city: 'Cartagena',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&q=80',
        bio: 'De visita en Barranquilla por el fin de semana. ¡Buscando parche para la fiesta!',
        statusText: 'Primera vez en Neon Nights',
        presenceStatus: 'checked_in',
        checkedInAt: '2026-10-28T22:45:00Z',
        musicInterests: ['House', 'Deep House', 'Afro House'],
        pastEvents: ['Cartagena Sunset', 'Boiler Room Col'],
        mutualConnectionsCount: 1,
        connectionStatus: 'pending_received'
      },
      {
        id: 'mem-e1-4',
        eventId: 'e1',
        name: 'Mateo Restrepo',
        age: 26,
        city: 'Medellín',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80',
        bio: 'Productor musical. Vine desde Medellín para ver el escenario de pantallas 360.',
        statusText: 'En zona VIP ahora',
        presenceStatus: 'checked_in',
        checkedInAt: '2026-10-28T22:00:00Z',
        musicInterests: ['Techno Peak Time', 'Hard Techno'],
        pastEvents: ['Ritvales Medellín', 'Neon Nights VIP'],
        mutualConnectionsCount: 5,
        connectionStatus: 'connected'
      },
      {
        id: 'mem-e1-5',
        eventId: 'e1',
        name: 'Sofia Vergara',
        age: 23,
        city: 'Barranquilla',
        avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&q=80',
        bio: 'Bailarina y amante del buen sonido. ¡La noche promete!',
        statusText: 'Está aquí ahora',
        presenceStatus: 'checked_in',
        checkedInAt: '2026-10-28T23:05:00Z',
        musicInterests: ['Tech House', 'Guaracha'],
        pastEvents: ['Díscolo Weekend'],
        mutualConnectionsCount: 3,
        connectionStatus: 'none'
      }
    ]
  },
  'e2': {
    eventId: 'e2',
    totalPresent: 85,
    stateStatus: 'upcoming',
    statusHeadline: 'Conoce a quienes asistirán a este evento',
    members: [
      {
        id: 'mem-e2-1',
        eventId: 'e2',
        name: 'Daniela Silva',
        age: 25,
        city: 'Barranquilla',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80',
        bio: '¡Preparando el mejor disfraz de la noche para el concurso!',
        statusText: 'Asistencia confirmada',
        presenceStatus: 'confirmed',
        musicInterests: ['Reggaeton', 'Urban', 'Cross'],
        pastEvents: ['Halloween Madness 2025', 'Carnaval BAQ'],
        mutualConnectionsCount: 3,
        connectionStatus: 'none'
      },
      {
        id: 'mem-e2-2',
        eventId: 'e2',
        name: 'Julian Orozco',
        age: 28,
        city: 'Barranquilla',
        avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&q=80',
        bio: 'Fanático de Trucupey. Nos vemos en la mesa principal.',
        statusText: 'Reserva VIP Lista',
        presenceStatus: 'confirmed',
        musicInterests: ['Salsa', 'Cross', 'Vallenato'],
        pastEvents: ['Trucupey Nights'],
        mutualConnectionsCount: 2,
        connectionStatus: 'pending_received'
      }
    ]
  },
  'e3': {
    eventId: 'e3',
    totalPresent: 94,
    stateStatus: 'ended',
    statusHeadline: 'Este evento terminó, pero puedes ver algunos asistentes',
    members: [
      {
        id: 'mem-e3-1',
        eventId: 'e3',
        name: 'Camila Torres',
        age: 23,
        city: 'Barranquilla',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80',
        bio: '¡Noche inolvidable en Díscolo! Esperando el próximo evento.',
        statusText: 'Asistió al evento',
        presenceStatus: 'past_attendee',
        musicInterests: ['Perreo', 'Reggaeton Old School'],
        pastEvents: ['Díscolo Perreo VIP'],
        mutualConnectionsCount: 6,
        connectionStatus: 'connected'
      }
    ]
  }
};

// ============================================
// FUNCIONES AUXILIARES (SUPABASE READY)
// ============================================

export function getEventCommunity(eventId: string): EventCommunitySummary {
  return MOCK_COMMUNITY_MEMBERS[eventId] || {
    eventId,
    totalPresent: 45,
    stateStatus: 'upcoming',
    statusHeadline: 'Conoce a las personas que asistirán a este evento',
    members: [
      {
        id: `mem-default-${eventId}-1`,
        eventId,
        name: 'Asistente Hangover',
        age: 24,
        city: 'Barranquilla',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
        bio: 'Disfrutando la vida nocturna de la ciudad.',
        statusText: 'Confirmado',
        presenceStatus: 'confirmed',
        musicInterests: ['Crossover', 'Electrónica'],
        pastEvents: ['Hangover Party'],
        mutualConnectionsCount: 1,
        connectionStatus: 'none'
      }
    ]
  };
}

/**
 * Transición conceptual de estados de conexión simulando la futura tabla `connections` en Supabase:
 * status enum: 'pending', 'accepted', 'rejected', 'cancelled'
 */
export async function updateConnectionState(
  memberId: string,
  action: 'send' | 'cancel' | 'accept' | 'ignore' | 'remove'
): Promise<ConnectionStatus> {
  switch (action) {
    case 'send': return 'pending_sent';
    case 'cancel': return 'none';
    case 'accept': return 'connected';
    case 'ignore': return 'none';
    case 'remove': return 'none';
    default: return 'none';
  }
}
