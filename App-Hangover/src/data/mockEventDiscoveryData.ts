import { EventMetrics, PromotionCampaign } from '@/services/eventDiscoveryEngine';

// ============================================
// MÉTRICAS MOCK DE DESCUBRIMIENTO Y ENGAGEMENT
// ============================================

export const MOCK_EVENT_METRICS: Record<string, EventMetrics> = {
  'e1': {
    eventId: 'e1',
    views: 2450,
    searches: 1250,
    favorites: 184,
    shares: 92,
    ticketsSold: 218,
    ticketVelocity: 24,    // 24 boletas/hora
    recentGrowthPct: 38,   // +38% interés esta semana
  },
  'e2': {
    eventId: 'e2',
    views: 1890,
    searches: 980,
    favorites: 142,
    shares: 68,
    ticketsSold: 145,
    ticketVelocity: 18,
    recentGrowthPct: 45,   // +45% interés esta semana
  },
  'e3': {
    eventId: 'e3',
    views: 1120,
    searches: 640,
    favorites: 78,
    shares: 34,
    ticketsSold: 94,
    ticketVelocity: 12,
    recentGrowthPct: 22,
  },
  'e4': {
    eventId: 'e4',
    views: 750,
    searches: 420,
    favorites: 45,
    shares: 18,
    ticketsSold: 62,
    ticketVelocity: 8,
    recentGrowthPct: 14,
  },
};

// ============================================
// CAMPAÑAS PATROCINADAS MOCK (MONETIZACIÓN)
// ============================================

export const MOCK_PROMOTION_CAMPAIGNS: PromotionCampaign[] = [
  {
    id: 'camp-1',
    eventId: 'e1',
    sponsoredLabel: 'PATROCINADO',
    placement: 'featured',
    sponsoredBoost: 1.5,
    status: 'active',
  },
];
