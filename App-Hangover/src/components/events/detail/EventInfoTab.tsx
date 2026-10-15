import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, 
  Modal, ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Star, Clock, Shirt, ShieldAlert, Car, Crown, Wine, 
  MapPin, Navigation, ChevronDown, ChevronUp, ChevronRight, 
  X, Music 
} from 'lucide-react-native';

import { EventInfo, LineupArtist, FaqItem } from '@/data/mockEvents';
import { EventCountdownMobile } from '@/components/events/EventCountdownMobile';
import { useResponsive } from '@/hooks/useResponsive';

interface EventInfoTabProps {
  event: EventInfo;
  occupancyPct: number;
  openMaps: () => void;
}

export const EventInfoTab: React.FC<EventInfoTabProps> = ({
  event,
  occupancyPct,
  openMaps,
}) => {
  const router = useRouter();
  const { isCompact } = useResponsive();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [lineupModalVisible, setLineupModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      {/* ── 1. CUADRÍCULA DE ESTADÍSTICAS SIMÉTRICA 2x2 ── */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel} numberOfLines={1}>RATING</Text>
          <View style={styles.statValueRow}>
            <Star size={12} color="#fbbf24" fill="#fbbf24" />
            <Text style={styles.statValue}>{event.rating}</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel} numberOfLines={1}>ASISTENTES</Text>
          <Text style={styles.statValue}>{event.attendeeCount}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel} numberOfLines={1}>OCUPACIÓN</Text>
          <Text style={[styles.statValue, occupancyPct >= 85 ? { color: '#f97316' } : {}]}>
            {occupancyPct}%
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel} numberOfLines={1}>VISTAS</Text>
          <Text style={styles.statValue}>
            {event.views >= 1000 ? `${(event.views / 1000).toFixed(1)}K` : event.views}
          </Text>
        </View>
      </View>

      {/* ── 2. COUNTDOWN COMPACTO ── */}
      <View style={styles.countdownSection}>
        <View style={styles.countdownBox}>
          <EventCountdownMobile dateISO={event.dateISO} />
        </View>
      </View>

      {/* ── 3. SOBRE EL EVENTO ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre el Evento</Text>
        <Text style={styles.description}>{event.description}</Text>
      </View>

      {/* ── SERVICIOS Y RESTRICCIONES ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Servicios y Restricciones</Text>
        <View style={styles.amenitiesGrid}>
          <View style={styles.amenityItem}>
            <Clock size={16} color="#818cf8" />
            <View style={{ flex: 1 }}>
              <Text style={styles.amenityLabel}>Horario</Text>
              <Text style={styles.amenityValue}>{event.openTime} — {event.closeTime}</Text>
            </View>
          </View>
          <View style={styles.amenityItem}>
            <Shirt size={16} color="#34d399" />
            <View style={{ flex: 1 }}>
              <Text style={styles.amenityLabel}>Dress Code</Text>
              <Text style={styles.amenityValue}>{event.dressCode}</Text>
            </View>
          </View>
          <View style={styles.amenityItem}>
            <ShieldAlert size={16} color="#fbbf24" />
            <View style={{ flex: 1 }}>
              <Text style={styles.amenityLabel}>Edad Mínima</Text>
              <Text style={styles.amenityValue}>{event.minAge}</Text>
            </View>
          </View>
        </View>

        <View style={styles.amenityTagsRow}>
          {event.amenities.hasParking && (
            <View style={styles.amenityTag}><Car size={11} color="#38bdf8" /><Text style={[styles.amenityTagText, { color: '#38bdf8' }]}>Parqueadero</Text></View>
          )}
          {event.amenities.hasVipZone && (
            <View style={styles.amenityTag}><Crown size={11} color="#a855f7" /><Text style={[styles.amenityTagText, { color: '#a855f7' }]}>Zona VIP</Text></View>
          )}
          {event.amenities.hasTablesModule && (
            <View style={styles.amenityTag}><Wine size={11} color="#fbbf24" /><Text style={[styles.amenityTagText, { color: '#fbbf24' }]}>Servicio Botella</Text></View>
          )}
          {event.amenities.isAdultsOnly && (
            <View style={styles.amenityTag}><ShieldAlert size={11} color="#ef4444" /><Text style={[styles.amenityTagText, { color: '#ef4444' }]}>+18 Obligatorio</Text></View>
          )}
        </View>
      </View>

      {/* ── MAPA UBICACIÓN ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ubicación</Text>
        <View style={styles.mapPlaceholder}>
          <View style={styles.mapPingOuter} />
          <View style={styles.mapPingInner}>
            <MapPin size={16} color="#fff" />
          </View>
        </View>
        <TouchableOpacity style={styles.mapsButton} onPress={openMaps} activeOpacity={0.8}>
          <Navigation size={14} color="#818cf8" />
          <Text style={styles.mapsButtonText}>Abrir en Google Maps</Text>
        </TouchableOpacity>
      </View>

      {/* ── LINE-UP & DJS ── */}
      {event.lineup && event.lineup.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Music size={16} color="#818cf8" />
              <Text style={styles.sectionTitle}>Line-Up & DJs</Text>
            </View>
            <TouchableOpacity onPress={() => setLineupModalVisible(true)}>
              <Text style={styles.seeAllText}>Ver completo →</Text>
            </TouchableOpacity>
          </View>

          {/* PREVIEW DE ARTISTAS EN FILA COMPACTA */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lineupPreviewRow}>
            {event.lineup.map((artist: LineupArtist) => (
              <TouchableOpacity
                key={artist.id}
                style={styles.compactArtistItem}
                onPress={() => router.push(`/artists/${artist.id}` as any)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: artist.imageUrl }} style={styles.compactArtistAvatar} />
                <Text style={styles.compactArtistName} numberOfLines={1}>{artist.name}</Text>
                <Text style={styles.compactArtistRole} numberOfLines={1}>{artist.performanceTime}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── MODAL FULL LINEUP ── */}
      <Modal visible={lineupModalVisible} animationType="slide" transparent={false} onRequestClose={() => setLineupModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Line-Up Completo</Text>
            <TouchableOpacity onPress={() => setLineupModalVisible(false)} style={styles.closeButton}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {event.lineup && event.lineup.map((artist: LineupArtist) => (
              <TouchableOpacity
                key={artist.id}
                style={styles.modalArtistRow}
                onPress={() => {
                  setLineupModalVisible(false);
                  router.push(`/artists/${artist.id}` as any);
                }}
              >
                <Image source={{ uri: artist.imageUrl }} style={styles.modalArtistAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalArtistName}>{artist.name}</Text>
                  <Text style={styles.modalArtistTime}>{artist.performanceTime}</Text>
                  <Text style={styles.modalArtistGenre} numberOfLines={2}>{artist.description}</Text>
                </View>
                <ChevronRight size={18} color="#71717a" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* ── FAQ Y PREGUNTAS FRECUENTES ── */}
      {event.faqs && event.faqs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>
          <View style={styles.faqList}>
            {event.faqs.map((item: FaqItem, idx: number) => {
              const isOpen = openFaqIndex === idx;
              return (
                <View key={idx} style={styles.faqCard}>
                  <TouchableOpacity
                    style={styles.faqHeader}
                    onPress={() => setOpenFaqIndex(isOpen ? null : idx)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.faqQuestion} numberOfLines={2}>{item.question}</Text>
                    {isOpen ? <ChevronUp size={16} color="#818cf8" /> : <ChevronDown size={16} color="#71717a" />}
                  </TouchableOpacity>
                  {isOpen && (
                    <Text style={styles.faqAnswer}>{item.answer}</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },

  /* GRIDA SIMÉTRICA DE ESTADÍSTICAS 2x2 */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  statCard: {
    width: '48.5%',
    height: 54,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },

  /* COUNTDOWN COMPACTO */
  countdownSection: {
    marginBottom: 8,
  },
  countdownBox: {
    backgroundColor: 'rgba(129,140,248,0.04)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.18)',
  },

  /* SECCIONES */
  section: {
    marginTop: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#a1a1aa',
    fontSize: 13,
    lineHeight: 22,
  },

  /* AMENIDADES Y SERVICIOS */
  amenitiesGrid: {
    gap: 8,
    marginBottom: 10,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  amenityLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  amenityValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  amenityTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  amenityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  amenityTagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },

  /* MAPA */
  mapPlaceholder: {
    height: 100,
    backgroundColor: '#18181b',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  mapPingOuter: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(129,140,248,0.25)',
  },
  mapPingInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(129,140,248,0.1)',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.25)',
  },
  mapsButtonText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: 'bold',
  },

  /* LINEUP PREVIEW */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  seeAllText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lineupPreviewRow: {
    gap: 10,
  },
  compactArtistItem: {
    width: 80,
    alignItems: 'center',
  },
  compactArtistAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#18181b',
    marginBottom: 4,
  },
  compactArtistName: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  compactArtistRole: {
    color: '#71717a',
    fontSize: 9,
    textAlign: 'center',
  },

  /* MODAL LINEUP */
  modalContainer: {
    flex: 1,
    backgroundColor: '#020205',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalArtistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  modalArtistAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#18181b',
  },
  modalArtistName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalArtistGenre: {
    color: '#818cf8',
    fontSize: 11,
    marginTop: 2,
  },
  modalArtistTime: {
    color: '#71717a',
    fontSize: 10,
    marginTop: 2,
  },

  /* FAQ */
  faqList: {
    gap: 8,
  },
  faqCard: {
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  faqQuestion: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  faqAnswer: {
    color: '#a1a1aa',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
});
