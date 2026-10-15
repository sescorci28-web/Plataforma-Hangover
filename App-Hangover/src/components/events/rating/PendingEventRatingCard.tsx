import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Sparkles, ArrowRight, Clock, Star } from 'lucide-react-native';
import { RatingStatus } from '@/types/rating';

interface PendingEventRatingCardProps {
  eventTitle: string;
  eventDate: string;
  eventImageUrl: string;
  ratingStatus: RatingStatus;
  onPressRate: () => void;
}

export const PendingEventRatingCard: React.FC<PendingEventRatingCardProps> = ({
  eventTitle,
  eventDate,
  eventImageUrl,
  ratingStatus,
  onPressRate,
}) => {
  const isRequired = ratingStatus === 'required';

  return (
    <View style={[styles.cardContainer, isRequired && styles.requiredCard]}>
      <Image source={{ uri: eventImageUrl }} style={styles.eventImage} />

      <View style={styles.cardContent}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, isRequired ? styles.requiredBadge : styles.pendingBadge]}>
            <Sparkles size={10} color={isRequired ? '#ec4899' : '#818cf8'} />
            <Text style={[styles.badgeText, { color: isRequired ? '#ec4899' : '#818cf8' }]}>
              {isRequired ? 'CALIFICACIÓN OBLIGATORIA' : 'EXPERIENCIA PENDIENTE'}
            </Text>
          </View>
        </View>

        <Text style={styles.eventTitle} numberOfLines={1}>{eventTitle}</Text>
        <Text style={styles.eventDate} numberOfLines={1}>{eventDate}</Text>
        <Text style={styles.subHint}>¿Cómo estuvo tu experiencia en el evento?</Text>

        <TouchableOpacity
          style={[styles.rateButton, isRequired && styles.requiredButton]}
          onPress={onPressRate}
          activeOpacity={0.85}
        >
          <Star size={13} color="#fff" fill="#fff" />
          <Text style={styles.rateButtonText}>Calificar ahora</Text>
          <ArrowRight size={13} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(129, 140, 248, 0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.2)',
    padding: 12,
    gap: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  requiredCard: {
    backgroundColor: 'rgba(236, 72, 153, 0.05)',
    borderColor: 'rgba(236, 72, 153, 0.35)',
  },
  eventImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#18181b',
  },
  cardContent: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pendingBadge: {
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
  },
  requiredBadge: {
    backgroundColor: 'rgba(236, 72, 153, 0.18)',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  eventTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  eventDate: {
    color: '#818cf8',
    fontSize: 11,
    marginTop: 1,
  },
  subHint: {
    color: '#71717a',
    fontSize: 10,
    marginTop: 2,
    marginBottom: 8,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  requiredButton: {
    backgroundColor: '#ec4899',
  },
  rateButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
