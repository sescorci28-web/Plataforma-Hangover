import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar, ChevronRight } from 'lucide-react-native';

import { UpcomingResult } from '@/services/eventDiscoveryEngine';
import { useResponsive } from '@/hooks/useResponsive';
import { EventCard } from '@/components/events/EventCard';

interface UpcomingEventsSectionProps {
  upcomingResults: UpcomingResult[];
  onSelectEvent: (id: string) => void;
  onSeeAll?: () => void;
}

export const UpcomingEventsSection: React.FC<UpcomingEventsSectionProps> = ({
  upcomingResults,
  onSelectEvent,
  onSeeAll,
}) => {
  const { cardWidthHorizontal, screenPadding } = useResponsive();

  if (upcomingResults.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* HEADER DE SECCIÓN */}
      <View style={[styles.headerRow, { paddingHorizontal: screenPadding }]}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Calendar size={16} color="#818cf8" />
            <Text style={styles.sectionTitle}>Próximamente</Text>
          </View>
          <Text style={styles.subtitle} numberOfLines={1}>Próximos eventos en agenda</Text>
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
        {upcomingResults.map((item) => (
          <EventCard
            key={item.event.id}
            event={item.event}
            variant="upcoming"
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
