import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Flame, ChevronRight } from 'lucide-react-native';

import { TrendingResult } from '@/services/eventDiscoveryEngine';
import { useResponsive } from '@/hooks/useResponsive';
import { EventCard } from '@/components/events/EventCard';

interface TrendingEventsSectionProps {
  trendingResults: TrendingResult[];
  onSelectEvent: (id: string) => void;
  onSeeAll?: () => void;
}

export const TrendingEventsSection: React.FC<TrendingEventsSectionProps> = ({
  trendingResults,
  onSelectEvent,
  onSeeAll,
}) => {
  const { cardWidthHorizontal, screenPadding } = useResponsive();

  if (trendingResults.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* HEADER DE SECCIÓN */}
      <View style={[styles.headerRow, { paddingHorizontal: screenPadding }]}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Flame size={16} color="#ef4444" />
            <Text style={styles.sectionTitle}>En tendencia</Text>
          </View>
          <Text style={styles.subtitle} numberOfLines={1}>Lo que está creciendo ahora en la ciudad</Text>
        </View>

        {onSeeAll && (
          <TouchableOpacity style={styles.seeAllButton} onPress={onSeeAll} activeOpacity={0.8}>
            <Text style={styles.seeAllText}>Ver todos</Text>
            <ChevronRight size={14} color="#818cf8" />
          </TouchableOpacity>
        )}
      </View>

      {/* CARRUSEL HORIZONTAL CON EVENT CARD EDITORIAL */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: screenPadding }]}
      >
        {trendingResults.map((item) => (
          <EventCard
            key={item.event.id}
            event={item.event}
            variant="trending"
            metrics={{ recentGrowthPct: item.metrics.recentGrowthPct }}
            cardWidth={cardWidthHorizontal}
            cardHeight={160}
            onPress={() => onSelectEvent(item.event.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 2,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  seeAllText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollContent: {
    gap: 14,
  },
});
