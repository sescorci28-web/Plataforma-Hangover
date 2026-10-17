import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Calendar,
  MapPin,
  ChevronRight,
  Ticket,
} from 'lucide-react-native';
import { EventInfo } from '@/data/mockEvents';
import { ClubDetail } from '@/types/club.types';
import { ClubTheme } from '@/constants/clubTheme';

interface ClubEventsTabProps {
  club: ClubDetail;
  events: EventInfo[];
  onBookCover?: () => void;
}

const formatPrice = (p?: number) => {
  if (p === undefined || p === null || p === 0) return 'Entrada Libre';
  return `$${p.toLocaleString('es-CO')}`;
};

export const ClubEventsTab: React.FC<ClubEventsTabProps> = ({
  club,
  events,
  onBookCover,
}) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* 1. COVER PASS REGULAR (Si está configurado) */}
      {club.cover_price > 0 && onBookCover && (
        <View style={styles.coverPassCard}>
          <View style={styles.coverPassLeft}>
            <View style={styles.coverIconBadge}>
              <Ticket size={16} color={ClubTheme.colors.primary} />
            </View>
            <View style={styles.coverPassInfo}>
              <Text style={styles.coverPassTitle}>Pase de Entrada Regular (Cover)</Text>
              <Text style={styles.coverPassPrice}>
                ${club.cover_price.toLocaleString('es-CO')} COP por persona
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.coverBuyButton}
            onPress={onBookCover}
            activeOpacity={0.8}
          >
            <Text style={styles.coverBuyButtonText}>Adquirir</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 2. LISTA DE EVENTOS PROGRAMADOS */}
      <View style={styles.eventsSection}>
        <Text style={styles.sectionTitle}>
          Próximos eventos {events.length > 0 ? `(${events.length})` : ''}
        </Text>

        {events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Calendar size={28} color={ClubTheme.colors.textMuted} />
            <Text style={styles.emptyTitle}>Sin eventos programados</Text>
            <Text style={styles.emptySubtitle}>
              {club.name} no tiene fiestas especiales publicadas en este momento. Puedes reservar mesa para cualquier fin de semana regular.
            </Text>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {events.map((eventItem) => {
              const price = eventItem.ticketBatches?.[0]?.price ?? (eventItem as any).ticketPrice ?? 0;
              return (
                <TouchableOpacity
                  key={eventItem.id}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/events/${eventItem.id}` as any)}
                  style={styles.eventCard}
                >
                  <Image source={{ uri: eventItem.imageUrl }} style={styles.eventFlyer} resizeMode="cover" />
                  <View style={styles.eventDetails}>
                    <Text style={styles.eventCategory}>
                      {eventItem.category ? eventItem.category.toUpperCase() : 'EVENTO'}
                    </Text>

                    <Text style={styles.eventTitle} numberOfLines={2}>
                      {eventItem.title}
                    </Text>

                    <View style={styles.eventMetaRow}>
                      <Calendar size={12} color={ClubTheme.colors.accent} />
                      <Text style={styles.eventMetaText} numberOfLines={1}>
                        {eventItem.date}
                      </Text>
                    </View>

                    <Text style={styles.eventPrice}>
                      {formatPrice(price)}
                    </Text>
                  </View>

                  <ChevronRight size={18} color={ClubTheme.colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 18,
  },
  coverPassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ClubTheme.colors.surface,
    borderRadius: ClubTheme.radii.lg,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
    padding: 14,
    gap: 12,
  },
  coverPassLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  coverIconBadge: {
    width: 38,
    height: 38,
    borderRadius: ClubTheme.radii.md,
    backgroundColor: ClubTheme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPassInfo: {
    flex: 1,
    gap: 2,
  },
  coverPassTitle: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  coverPassPrice: {
    color: ClubTheme.colors.success,
    fontSize: 12,
    fontWeight: '800',
  },
  coverBuyButton: {
    backgroundColor: ClubTheme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: ClubTheme.radii.md,
  },
  coverBuyButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  eventsSection: {
    gap: 12,
  },
  sectionTitle: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  eventsList: {
    gap: 10,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ClubTheme.colors.surface,
    borderRadius: ClubTheme.radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
    gap: 12,
  },
  eventFlyer: {
    width: 72,
    height: 72,
    borderRadius: ClubTheme.radii.md,
    backgroundColor: '#181822',
  },
  eventDetails: {
    flex: 1,
    gap: 3,
  },
  eventCategory: {
    color: ClubTheme.colors.accent,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  eventTitle: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  eventMetaText: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
    flex: 1,
  },
  eventPrice: {
    color: ClubTheme.colors.success,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: ClubTheme.colors.surface,
    borderRadius: ClubTheme.radii.lg,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
    gap: 10,
  },
  emptyTitle: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
