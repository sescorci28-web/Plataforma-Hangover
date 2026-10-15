export type RatingStatus =
  | 'not_eligible' // El usuario no asistió o no tiene asistencia verificada
  | 'available'    // El usuario asistió y el evento está activo (calificación voluntaria)
  | 'pending'      // El evento finalizó y tiene calificación pendiente
  | 'reminded'     // Se enviaron recordatorios de la experiencia pendiente
  | 'required'     // La calificación es obligatoria para cerrar la experiencia pendiente
  | 'completed';   // El usuario completó exitosamente la calificación

export interface EventAttendance {
  eventId: string;
  userId: string;
  hasTicket: boolean;
  checkedIn: boolean;
  attended: boolean;
  checkedInAt?: string;
}

export interface EventUserRating {
  eventId: string;
  userId: string;
  rating: number; // 1 a 5 estrellas
  tags?: string[]; // Ej: ['Música', 'Ambiente', 'Organización', 'Seguridad', 'Ubicación']
  comment?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PendingRatingExperience {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventImageUrl: string;
  ratingStatus: RatingStatus;
}
