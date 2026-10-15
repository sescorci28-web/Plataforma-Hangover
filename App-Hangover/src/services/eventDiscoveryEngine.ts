import { EventInfo } from '@/data/mockEvents';

// ============================================
// MODELOS Y TIPOS DE DESCUBRIMIENTO Y MONETIZACIÓN
// ============================================

export interface EventMetrics {
  eventId: string;
  views: number;
  searches: number;
  favorites: number;
  shares: number;
  ticketsSold: number;
  ticketVelocity: number;    // Boletas vendidas por hora
  recentGrowthPct: number;   // % de crecimiento semanal (ej: 38 para +38%)
  trendScore?: number;       // Calculado por el motor
}

export interface PromotionCampaign {
  id: string;
  eventId: string;
  sponsoredLabel: 'PATROCINADO' | 'PROMOCIONADO';
  placement: 'featured' | 'trending' | 'category';
  sponsoredBoost: number;
  status: 'active' | 'paused';
}

export interface TrendingResult {
  event: EventInfo;
  metrics: EventMetrics;
  trendScore: number;
  badgeText: string;
}

export interface MostSearchedResult {
  event: EventInfo;
  metrics: EventMetrics;
  searchCount: number;
  badgeText: string;
}

export interface UpcomingResult {
  event: EventInfo;
  badgeText: string;
}

export interface SponsoredResult {
  event: EventInfo;
  campaign: PromotionCampaign;
  badgeText: string;
}

// ============================================
// ALGORITMO DE CÁLCULO DE TREND SCORE ORGÁNICO
// ============================================

export function calculateTrendScore(metrics: EventMetrics): number {
  const growthFactor = (metrics.recentGrowthPct || 0) * 0.4;
  const velocityFactor = (metrics.ticketVelocity || 0) * 0.3;
  const searchFactor = (metrics.searches || 0) * 0.005;
  const engagementFactor = ((metrics.favorites || 0) + (metrics.shares || 0)) * 0.1;

  const rawScore = growthFactor + velocityFactor + searchFactor + engagementFactor;
  return Math.round(Math.min(Math.max(rawScore, 10), 99));
}

// ============================================
// MOTOR DE DESCUBRIMIENTO (DISCOVERY ENGINE)
// ============================================

export class EventDiscoveryEngine {
  /**
   * Obtiene eventos en tendencia ordenados por Trend Score orgánico
   */
  static getTrendingEvents(
    events: EventInfo[],
    metricsMap: Record<string, EventMetrics>
  ): TrendingResult[] {
    const list: TrendingResult[] = events.map((event) => {
      const metrics = metricsMap[event.id] || {
        eventId: event.id,
        views: event.views,
        searches: 250,
        favorites: 45,
        shares: 20,
        ticketsSold: event.attendeeCount,
        ticketVelocity: 8,
        recentGrowthPct: 15,
      };

      const trendScore = calculateTrendScore(metrics);
      const growthPct = metrics.recentGrowthPct || 15;

      return {
        event,
        metrics: { ...metrics, trendScore },
        trendScore,
        badgeText: `🔥 +${growthPct}% interés esta semana`,
      };
    });

    return list.sort((a, b) => b.trendScore - a.trendScore);
  }

  /**
   * Obtiene eventos más buscados por volumen total de búsquedas
   */
  static getMostSearchedEvents(
    events: EventInfo[],
    metricsMap: Record<string, EventMetrics>
  ): MostSearchedResult[] {
    const list: MostSearchedResult[] = events.map((event) => {
      const metrics = metricsMap[event.id] || {
        eventId: event.id,
        views: event.views,
        searches: 300,
        favorites: 50,
        shares: 10,
        ticketsSold: event.attendeeCount,
        ticketVelocity: 5,
        recentGrowthPct: 10,
      };

      const count = metrics.searches;
      const countFormatted = count >= 1000 ? `${(count / 1000).toFixed(1)}K` : `${count}`;

      return {
        event,
        metrics,
        searchCount: count,
        badgeText: `👀 ${countFormatted} búsquedas`,
      };
    });

    return list.sort((a, b) => b.searchCount - a.searchCount);
  }

  /**
   * Obtiene eventos próximos filtrando pasados y ordenando por fechaISO
   */
  static getUpcomingEvents(events: EventInfo[]): UpcomingResult[] {
    const now = new Date().getTime();
    
    const list: UpcomingResult[] = events
      .filter((e) => new Date(e.dateISO).getTime() >= now - 86400000) // Incluye hoy y futuros
      .map((event) => ({
        event,
        badgeText: `📅 ${event.date.split('·')[0]}`,
      }));

    return list.sort(
      (a, b) => new Date(a.event.dateISO).getTime() - new Date(b.event.dateISO).getTime()
    );
  }

  /**
   * Obtiene eventos patrocinados / promocionados con etiqueta transparente PATROCINADO
   */
  static getSponsoredEvents(
    events: EventInfo[],
    campaigns: PromotionCampaign[]
  ): SponsoredResult[] {
    const activeCampaigns = campaigns.filter((c) => c.status === 'active');

    const list: SponsoredResult[] = [];
    activeCampaigns.forEach((camp) => {
      const event = events.find((e) => e.id === camp.eventId);
      if (event) {
        list.push({
          event,
          campaign: camp,
          badgeText: camp.sponsoredLabel,
        });
      }
    });

    return list;
  }
}
