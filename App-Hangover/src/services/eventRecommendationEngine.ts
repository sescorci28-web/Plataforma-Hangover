import { EventInfo } from '@/data/mockEvents';

export interface RecommendationResult {
  event: EventInfo;
  score: number;             // 0 a 100%
  matchReasons: string[];    // Puntos clave de coincidencia
  explanation: string;       // Explicación natural corta
}

export interface EventRecommendationService {
  recommend(query: string, events: EventInfo[]): RecommendationResult[];
}

// Helper para normalizar texto (quitar tildes y caracteres especiales)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getMinPrice(event: EventInfo): number {
  const active = event.ticketBatches.filter((b) => b.status === 'active');
  if (active.length === 0) return 0;
  return Math.min(...active.map((b) => b.price));
}

export class LocalEventRecommendationService implements EventRecommendationService {
  recommend(query: string, events: EventInfo[]): RecommendationResult[] {
    const normQuery = normalizeText(query.trim());

    if (!normQuery) {
      return events.map((e) => ({
        event: e,
        score: 75,
        matchReasons: ['Popular entre la comunidad', 'Evento disponible'],
        explanation: 'Basado en los eventos más destacados del momento.',
      }));
    }

    // 1. EXTRAER INTENCIONES Y PALABRAS CLAVE
    const isToday = normQuery.includes('hoy');
    const isTomorrow = normQuery.includes('manana');
    const isSaturday = normQuery.includes('sabado');
    const isFriday = normQuery.includes('viernes');
    const isWeekend = normQuery.includes('fin de semana') || normQuery.includes('weekend') || isFriday || isSaturday;

    const wantsElectronic = normQuery.includes('electronica') || normQuery.includes('techno') || normQuery.includes('house') || normQuery.includes('guaracha');
    const wantsReggaeton = normQuery.includes('reggaeton') || normQuery.includes('perreo') || normQuery.includes('urbano');
    const wantsSalsa = normQuery.includes('salsa');
    const wantsCrossover = normQuery.includes('crossover') || normQuery.includes('variado');

    const isCheap = normQuery.includes('barato') || normQuery.includes('economico') || normQuery.includes('gratis') || normQuery.includes('descuento');
    const isPremium = normQuery.includes('premium') || normQuery.includes('vip') || normQuery.includes('exclusivo') || normQuery.includes('lujo');

    const wantsSocial = normQuery.includes('conocer gente') || normQuery.includes('gente') || normQuery.includes('social') || normQuery.includes('amigos');
    const wantsPrendido = normQuery.includes('prendido') || normQuery.includes('ambiente') || normQuery.includes('mucha gente') || normQuery.includes('bailar') || normQuery.includes('fiesta');

    // 2. SCORING Y EVALUACIÓN DE CADA EVENTO
    const results: RecommendationResult[] = events.map((event) => {
      let score = 40; // Puntaje base
      const reasons: string[] = [];
      const normTitle = normalizeText(event.title);
      const normCategory = normalizeText(event.category);
      const normDesc = normalizeText(event.description);
      const minPrice = getMinPrice(event);

      // COINCIDENCIA DE MÚSICA / GÉNERO
      if (wantsElectronic && (normCategory === 'electronica' || normTitle.includes('neon') || normDesc.includes('techno'))) {
        score += 30;
        reasons.push('Música electrónica');
      } else if (wantsReggaeton && (normCategory === 'reggaeton' || normTitle.includes('perreo') || normDesc.includes('reggaeton'))) {
        score += 30;
        reasons.push('Reggaetón y perreo');
      } else if (wantsSalsa && normCategory === 'salsa') {
        score += 30;
        reasons.push('Salsa y música en vivo');
      } else if (wantsCrossover && normCategory === 'crossover') {
        score += 30;
        reasons.push('Música variada crossover');
      }

      // COINCIDENCIA DE DÍA / FECHA
      if (isSaturday && (event.date.includes('SAB') || event.date.includes('29 OCT'))) {
        score += 25;
        reasons.push('Este sábado');
      } else if (isFriday && (event.date.includes('VIE') || event.date.includes('28 OCT'))) {
        score += 25;
        reasons.push('Este viernes');
      } else if (isWeekend) {
        score += 20;
        reasons.push('Fin de semana');
      } else if (isToday || isTomorrow) {
        score += 15;
        reasons.push('Próximo en agenda');
      }

      // COINCIDENCIA DE PRESUPUESTO
      if (isCheap && minPrice <= 50) {
        score += 20;
        reasons.push('Precio accesible');
      } else if (isPremium && (minPrice >= 70 || event.amenities.hasVipZone)) {
        score += 20;
        reasons.push('Experiencia VIP Premium');
      }

      // COINCIDENCIA AMBIENTAL / SOCIAL
      if (wantsSocial && event.attendeeCount >= 100) {
        score += 15;
        reasons.push(`${event.attendeeCount} personas confirmadas`);
      }
      if (wantsPrendido && (event.isTrending || event.attendeeCount >= 150)) {
        score += 15;
        reasons.push('Ambiente prendido');
      }

      // BONIFICACIÓN POR POPULARIDAD / OCUPACIÓN
      if (event.rating >= 4.8) {
        score += 5;
      }

      // CAP EN 98% MAX
      const finalScore = Math.min(Math.max(score, 65), 98);

      // GENERACIÓN DE EXPLICACIÓN CORTA Y NATURAL
      let explanation = 'Evento altamente recomendado para ti.';
      if (reasons.length > 0) {
        explanation = `Coincide con tu búsqueda por ${reasons.slice(0, 2).join(' y ')}.`;
      }

      return {
        event,
        score: finalScore,
        matchReasons: reasons.length > 0 ? reasons : ['Alta preferencia del público', 'Excelente ambiente'],
        explanation,
      };
    });

    // 3. ORDENAR POR PUNTAJE DE COMPATIBILIDAD DESCENDENTE
    return results.sort((a, b) => b.score - a.score);
  }
}

// Instancia singleton por defecto
export const defaultRecommendationEngine = new LocalEventRecommendationService();
