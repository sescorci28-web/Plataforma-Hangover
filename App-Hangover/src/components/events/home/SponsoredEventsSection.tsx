import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Star } from 'lucide-react-native';

import { SponsoredResult } from '@/services/eventDiscoveryEngine';
import { useResponsive } from '@/hooks/useResponsive';
import { EventCard } from '@/components/events/EventCard';

interface SponsoredEventsSectionProps {
  sponsoredResults: SponsoredResult[];
  onSelectEvent: (id: string) => void;
}

export const SponsoredEventsSection: React.FC<SponsoredEventsSectionProps> = ({
  sponsoredResults,
  onSelectEvent,
}) => {
  const { cardWidthHorizontal, screenPadding } = useResponsive();

  if (sponsoredResults.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* HEADER DE SECCIÓN PATROCINADA */}
      <View style={[styles.headerRow, { paddingHorizontal: screenPadding }]}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Star size={16} color="#fbbf24" fill="#fbbf24" />
            <Text style={styles.sectionTitle}>Eventos destacados</Text>
          </View>
          <Text style={styles.subtitle} numberOfLines={1}>Promociones verificadas de organizadores</Text>
        </View>
      </View>

      {/* CARRUSEL HORIZONTAL CON EVENT CARD EDITORIAL */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: screenPadding }]}
      >
        {sponsoredResults.map((item) => (
          <EventCard
            key={item.event.id}
            event={item.event}
            variant="sponsored"
            metrics={{ sponsoredLabel: item.campaign.sponsoredLabel }}
            cardWidth={Math.max(cardWidthHorizontal, 220)}
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
  scrollContent: {
    gap: 14,
  },
});
