import { RatingStatus, EventAttendance, EventUserRating, PendingRatingExperience } from '@/types/rating';
import { MOCK_EVENTS } from './mockEvents';

// ============================================
// ASISTENCIAS SIMULADAS (MOCK CHECK-INS)
// ============================================
export const MOCK_ATTENDANCES: Record<string, EventAttendance> = {
  'e1': {
    eventId: 'e1',
    userId: 'current-user-1',
    hasTicket: true,
    checkedIn: true,
    attended: true,
    checkedInAt: '2026-08-25T22:30:00Z',
  },
  'e2': {
    eventId: 'e2',
    userId: 'current-user-1',
    hasTicket: true,
    checkedIn: true,
    attended: true,
    checkedInAt: '2026-08-20T21:00:00Z',
  },
  'e3': {
    eventId: 'e3',
    userId: 'current-user-1',
    hasTicket: false,
    checkedIn: false,
    attended: false,
  },
};

// ============================================
// CALIFICACIONES REGISTRADAS EN MEMORIA (FUENTE ÚNICA)
// ============================================
export const MOCK_USER_RATINGS: Record<string, EventUserRating> = {
  'e2': {
    eventId: 'e2',
    userId: 'current-user-1',
    rating: 5,
    tags: ['Música', 'Ambiente'],
    comment: '¡Increíble producción y sonido!',
    createdAt: '2026-08-21T10:00:00Z',
  },
};

// OVERRIDES DE ESTADO DE PRUEBA (VACÍO POR DEFECTO PARA NO BLOQUEAR LA NAVEGACIÓN)
export const MOCK_FORCE_STATUS_OVERRIDE: Record<string, RatingStatus | null> = {};

// FUNCIÓN DE PRUEBA CONTROLADA PARA SIMULAR ESTADO OBLIGATORIO
export function simulateRequiredRating(eventId: string = 'e1') {
  delete MOCK_USER_RATINGS[eventId];
  MOCK_FORCE_STATUS_OVERRIDE[eventId] = 'required';
}

// ============================================
// LÓGICA DE ELEGIBILIDAD Y ESTADOS
// ============================================
export function getUserRatingStatus(eventId: string, userId: string = 'current-user-1'): RatingStatus {
  // 1. SI EL USUARIO YA CALIFICÓ, EL ESTADO ES DEFINITIVAMENTE 'completed'
  if (MOCK_USER_RATINGS[eventId]) {
    return 'completed';
  }

  // 2. Si hay un override de prueba explícito
  if (MOCK_FORCE_STATUS_OVERRIDE[eventId]) {
    return MOCK_FORCE_STATUS_OVERRIDE[eventId]!;
  }

  // 3. Verificar asistencia
  const attendance = MOCK_ATTENDANCES[eventId];
  if (!attendance || !attendance.attended) {
    return 'not_eligible';
  }

  // 4. Verificar estado por fecha del evento
  const event = MOCK_EVENTS.find((e) => e.id === eventId);
  if (!event) return 'not_eligible';

  const eventTime = new Date(event.dateISO).getTime();
  const now = Date.now();
  const eventDuration = 6 * 60 * 60 * 1000; // 6 horas

  if (now < eventTime + eventDuration) {
    return 'available'; // Evento activo o en curso
  }

  return 'pending'; // Evento finalizado pendiente por calificar
}

// ============================================
// REGISTRO SÍNCRONO DE CALIFICACIÓN
// ============================================
export function submitUserRating(
  eventId: string,
  userId: string = 'current-user-1',
  rating: number,
  tags: string[] = [],
  comment: string = ''
): EventUserRating {
  const newRating: EventUserRating = {
    eventId,
    userId,
    rating,
    tags,
    comment,
    createdAt: new Date().toISOString(),
  };

  // 1. Guardar en la fuente de verdad única
  MOCK_USER_RATINGS[eventId] = newRating;

  // 2. Marcar override como completed y limpiar cualquier estado requerido
  MOCK_FORCE_STATUS_OVERRIDE[eventId] = 'completed';

  // 3. Actualizar rating promedio y conteo del evento
  const event = MOCK_EVENTS.find((e) => e.id === eventId);
  if (event) {
    const totalScore = event.rating * event.reviewsCount + rating;
    const newCount = event.reviewsCount + 1;
    event.reviewsCount = newCount;
    event.rating = Number((totalScore / newCount).toFixed(1));
  }

  return newRating;
}

// ============================================
// OBTENER EXPERIENCIAS PENDIENTES DEL USUARIO
// ============================================
export function getUserPendingExperiences(userId: string = 'current-user-1'): PendingRatingExperience[] {
  const result: PendingRatingExperience[] = [];

  for (const event of MOCK_EVENTS) {
    // Si ya fue calificado, NUNCA incluirlo en experiencias pendientes
    if (MOCK_USER_RATINGS[event.id]) continue;

    const status = getUserRatingStatus(event.id, userId);
    if (status === 'pending' || status === 'reminded' || status === 'required') {
      result.push({
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventImageUrl: event.imageUrl,
        ratingStatus: status,
      });
    }
  }

  return result;
}
