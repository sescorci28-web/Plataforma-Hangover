import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Calendar, Flame, Eye, Star, Sparkles } from 'lucide-react-native';
import { EventInfo } from '@/data/mockEvents';

export type EventCardVariant = 'trending' | 'popular' | 'upcoming' | 'sponsored' | 'default';

interface EventCardProps {
  event: EventInfo;
  onPress: () => void;
  variant?: EventCardVariant;
  metrics?: {
    recentGrowthPct?: number;
    searchCount?: number;
    sponsoredLabel?: string;
  };
  cardWidth?: number;
  cardHeight?: number;
}

const getMinPrice = (event: EventInfo): number | null => {
  const activeBatches = event.ticketBatches.filter(b => b.status === 'active');
  if (activeBatches.length === 0) return null;
  return Math.min(...activeBatches.map(b => b.price));
};

const formatPrice = (price: number) => `$${Math.round(price / 1000)}K`;

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onPress,
  variant = 'default',
  metrics,
  cardWidth,
  cardHeight = 170,
}) => {
  const minPrice = getMinPrice(event);

  // Renderizar máximo 1 solo badge contextual sobre la imagen
  const renderContextBadge = () => {
    if (variant === 'trending') {
      const growthPct = metrics?.recentGrowthPct || 38;
      return (
        <View style={styles.trendBadge}>
          <Flame size={10} color="#f87171" />
          <Text style={styles.trendBadgeText}>+{growthPct}% esta semana</Text>
        </View>
      );
    }

    if (variant === 'popular') {
      const count = metrics?.searchCount || 1300;
      const countFormatted = count >= 1000 ? `${(count / 1000).toFixed(1)}K` : `${count}`;
      return (
        <View style={styles.popularBadge}>
          <Eye size={10} color="#38bdf8" />
          <Text style={styles.popularBadgeText}>{countFormatted} búsquedas</Text>
        </View>
      );
    }

    if (variant === 'sponsored') {
      const label = metrics?.sponsoredLabel || 'PATROCINADO';
      return (
        <View style={styles.sponsoredBadge}>
          <Sparkles size={10} color="#fbbf24" />
          <Text style={styles.sponsoredBadgeText}>{label}</Text>
        </View>
      );
    }

    if (event.rating > 0) {
      return (
        <View style={styles.ratingBadge}>
          <Star size={10} color="#fbbf24" fill="#fbbf24" />
          <Text style={styles.ratingBadgeText}>{event.rating}</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[
        styles.cardContainer,
        cardWidth ? { width: cardWidth } : { width: '100%' },
      ]}
    >
      {/* ── 1. IMAGEN PROTAGONISTA ── */}
      <ImageBackground
        source={{ uri: event.imageUrl }}
        style={[styles.imageBackground, { height: cardHeight }]}
        imageStyle={{ borderRadius: 14 }}
      >
        <LinearGradient
          colors={['rgba(2,2,5,0.3)', 'transparent', 'rgba(2,2,5,0.85)']}
          style={styles.imageGradient}
        >
          {/* BADGES EN LA PARTE SUPERIOR SOBRE LA IMAGEN */}
          <View style={styles.topBadgesRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{event.category.toUpperCase()}</Text>
            </View>

            {renderContextBadge()}
          </View>
        </LinearGradient>
      </ImageBackground>

      {/* ── 2. INFORMACIÓN LIMPIA DEBAJO DE LA IMAGEN (SIN BORDES PESADOS NI SEPARADORES) ── */}
      <View style={styles.detailsContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>

        <View style={styles.metaRow}>
          <Calendar size={11} color="#818cf8" />
          <Text style={styles.metaText} numberOfLines={1}>
            {event.date.split('·')[0]}
          </Text>
          <Text style={styles.metaDot}>·</Text>
          <MapPin size={11} color="#818cf8" />
          <Text style={styles.metaText} numberOfLines={1}>
            {event.location.split(',')[0]}
          </Text>
        </View>

        <View style={styles.priceRow}>
          {minPrice ? (
            <Text style={styles.priceText}>Desde {formatPrice(minPrice)}</Text>
          ) : (
            <Text style={styles.soldOutText}>Agotado</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 16,
  },
  imageBackground: {
    width: '100%',
    backgroundColor: '#18181b',
  },
  imageGradient: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
    borderRadius: 14,
  },
  topBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: 'rgba(2, 2, 5, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryText: {
    color: '#818cf8',
    fontSize: 9,
    fontWeight: 'bold',
  },

  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  trendBadgeText: {
    color: '#f87171',
    fontSize: 9,
    fontWeight: 'bold',
  },

  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  popularBadgeText: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: 'bold',
  },

  sponsoredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  sponsoredBadgeText: {
    color: '#fbbf24',
    fontSize: 9,
    fontWeight: 'bold',
  },

  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },

  detailsContainer: {
    paddingTop: 8,
    paddingHorizontal: 2,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 19,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metaText: {
    color: '#a1a1aa',
    fontSize: 11,
    flexShrink: 1,
  },
  metaDot: {
    color: '#52525b',
    fontSize: 11,
  },

  priceRow: {
    alignItems: 'flex-start',
    marginTop: 2,
  },
  priceText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
  },
  soldOutText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
