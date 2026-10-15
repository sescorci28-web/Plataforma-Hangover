import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { Star, MapPin, Calendar, Users, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { EventInfo } from '@/data/mockEvents';

interface FeaturedEventsCarouselProps {
  events: EventInfo[];
  onSelectEvent: (id: string) => void;
  onSeeAll: () => void;
}

const formatPrice = (p: number) => `$${Math.round(p / 1000)}K`;

export const FeaturedEventsCarousel: React.FC<FeaturedEventsCarouselProps> = ({
  events,
  onSelectEvent,
  onSeeAll,
}) => {
  const featured = events.filter((e) => e.isFeatured || e.isTrending).slice(0, 5);

  return (
    <View style={styles.container}>
      {/* HEADER DE SECCIÓN */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Star size={16} color="#fbbf24" fill="#fbbf24" />
          <Text style={styles.sectionTitle}>Eventos Destacados</Text>
        </View>

        <TouchableOpacity style={styles.seeAllButton} onPress={onSeeAll} activeOpacity={0.8}>
          <Text style={styles.seeAllText}>Ver todos</Text>
          <ChevronRight size={14} color="#818cf8" />
        </TouchableOpacity>
      </View>

      {/* CARRUSEL HORIZONTAL */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {featured.map((event) => {
          const activeBatches = event.ticketBatches.filter((b) => b.status === 'active');
          const minPrice = activeBatches.length > 0 ? Math.min(...activeBatches.map((b) => b.price)) : 0;

          return (
            <TouchableOpacity
              key={event.id}
              style={styles.card}
              onPress={() => onSelectEvent(event.id)}
              activeOpacity={0.9}
            >
              <ImageBackground
                source={{ uri: event.imageUrl }}
                style={styles.cardImage}
                imageStyle={{ borderRadius: 16 }}
              >
                <LinearGradient
                  colors={['rgba(2,2,5,0.2)', 'rgba(2,2,5,0.9)']}
                  style={styles.cardGradient}
                >
                  <View style={styles.topBadgeRow}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{event.category.toUpperCase()}</Text>
                    </View>
                    <View style={styles.ratingBadge}>
                      <Star size={10} color="#fbbf24" fill="#fbbf24" />
                      <Text style={styles.ratingText}>{event.rating}</Text>
                    </View>
                  </View>

                  <View>
                    <Text style={styles.eventTitle} numberOfLines={1}>
                      {event.title}
                    </Text>

                    <View style={styles.metaRow}>
                      <Calendar size={11} color="#818cf8" />
                      <Text style={styles.metaText}>{event.date.split('·')[0]}</Text>
                      <Text style={styles.dot}>·</Text>
                      <MapPin size={11} color="#818cf8" />
                      <Text style={styles.metaText} numberOfLines={1}>{event.location.split(',')[0]}</Text>
                    </View>

                    <View style={styles.bottomRow}>
                      <View style={styles.attendeesBadge}>
                        <Users size={10} color="#34d399" />
                        <Text style={styles.attendeesText}>{event.attendeeCount} asistiendo</Text>
                      </View>

                      {minPrice > 0 && (
                        <Text style={styles.priceText}>Desde {formatPrice(minPrice)}</Text>
                      )}
                    </View>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: 'bold',
  },

  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    width: 230,
    height: 170,
    borderRadius: 16,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
    borderRadius: 16,
  },
  topBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.3)',
  },
  categoryText: {
    color: '#818cf8',
    fontSize: 8,
    fontWeight: 'bold',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  eventTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  metaText: {
    color: '#d4d4d8',
    fontSize: 10,
  },
  dot: {
    color: '#71717a',
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendeesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  attendeesText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: '600',
  },
  priceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
});
