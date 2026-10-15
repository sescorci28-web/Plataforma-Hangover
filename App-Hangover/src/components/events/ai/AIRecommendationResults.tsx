import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { Sparkles, Flame, CheckCircle, MapPin, Calendar, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { RecommendationResult } from '@/services/eventRecommendationEngine';

interface AIRecommendationResultsProps {
  results: RecommendationResult[];
  onSelectEvent: (eventId: string) => void;
  onClear: () => void;
  query: string;
}

const formatPrice = (p: number) => `$${p.toLocaleString('es-CO')}`;

export const AIRecommendationResults: React.FC<AIRecommendationResultsProps> = ({
  results,
  onSelectEvent,
  onClear,
  query,
}) => {
  if (results.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Sparkles size={22} color="#ec4899" />
        <Text style={styles.emptyTitle}>Sin coincidencias exactas</Text>
        <Text style={styles.emptySubtitle}>
          No encontramos un evento que coincida al 100% con "{query}", pero prueba buscando por género o categoría.
        </Text>
        <TouchableOpacity style={styles.resetButton} onPress={onClear}>
          <Text style={styles.resetButtonText}>Ver todos los eventos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER DE RESULTADOS IA */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Sparkles size={16} color="#818cf8" />
            <Text style={styles.sectionTitle}>Recomendados para ti</Text>
          </View>
          <Text style={styles.queryMeta} numberOfLines={1}>
            Basado en: "{query}"
          </Text>
        </View>

        <TouchableOpacity style={styles.clearButton} onPress={onClear} activeOpacity={0.8}>
          <Text style={styles.clearButtonText}>Limpiar IA</Text>
        </TouchableOpacity>
      </View>

      {/* LISTA DE TARJETAS CON RECOMENDACIÓN */}
      <View style={styles.resultsList}>
        {results.map((rec) => {
          const { event, score, matchReasons, explanation } = rec;
          const minPrice = Math.min(...event.ticketBatches.filter((b) => b.status === 'active').map((b) => b.price));

          return (
            <TouchableOpacity
              key={event.id}
              style={styles.card}
              onPress={() => onSelectEvent(event.id)}
              activeOpacity={0.9}
            >
              {/* IMAGEN DE PORTADA CON BADGE DE COMPATIBILIDAD */}
              <ImageBackground
                source={{ uri: event.imageUrl }}
                style={styles.cardImage}
                imageStyle={{ borderRadius: 16 }}
              >
                <LinearGradient
                  colors={['rgba(2,2,5,0.2)', 'rgba(2,2,5,0.85)']}
                  style={styles.cardGradient}
                >
                  <View style={styles.badgeRow}>
                    <View style={styles.matchBadge}>
                      <Flame size={11} color="#ec4899" />
                      <Text style={styles.matchBadgeText}>{score}% COMPATIBLE</Text>
                    </View>

                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{event.category.toUpperCase()}</Text>
                    </View>
                  </View>

                  <View>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <View style={styles.metaRow}>
                      <Calendar size={11} color="#818cf8" />
                      <Text style={styles.metaText}>{event.date}</Text>
                      <Text style={styles.metaDot}>·</Text>
                      <MapPin size={11} color="#818cf8" />
                      <Text style={styles.metaText}>{event.location.split(',')[0]}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </ImageBackground>

              {/* CUERPO DE LA RECOMENDACIÓN (EXPLICACIÓN Y PUNTOS CLAVE) */}
              <View style={styles.cardBody}>
                <Text style={styles.explanationText}>"{explanation}"</Text>

                {/* RAZONES DE MATCH */}
                <View style={styles.reasonsRow}>
                  {matchReasons.slice(0, 3).map((reason, idx) => (
                    <View key={idx} style={styles.reasonChip}>
                      <CheckCircle size={10} color="#10b981" />
                      <Text style={styles.reasonText}>{reason}</Text>
                    </View>
                  ))}
                </View>

                {/* FOOTER TARJETA PRECIO Y CTA */}
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.priceLabel}>Entradas desde</Text>
                    <Text style={styles.priceValue}>{formatPrice(minPrice)}</Text>
                  </View>
                  <View style={styles.ctaButton}>
                    <Text style={styles.ctaText}>Ver detalles</Text>
                    <ArrowRight size={12} color="#818cf8" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
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
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  queryMeta: {
    color: '#71717a',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  clearButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  clearButtonText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: 'bold',
  },

  resultsList: {
    gap: 14,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.2)',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 170,
  },
  cardGradient: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(236, 72, 153, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.35)',
  },
  matchBadgeText: {
    color: '#ec4899',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  categoryBadge: {
    backgroundColor: 'rgba(2, 2, 5, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    color: '#818cf8',
    fontSize: 9,
    fontWeight: 'bold',
  },

  eventTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#d4d4d8',
    fontSize: 11,
  },
  metaDot: {
    color: '#71717a',
  },

  cardBody: {
    padding: 12,
  },
  explanationText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
    marginBottom: 8,
  },

  reasonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  reasonText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '500',
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  priceLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  priceValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  ctaText: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: 'bold',
  },

  emptyContainer: {
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 20,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#71717a',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  resetButtonText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
