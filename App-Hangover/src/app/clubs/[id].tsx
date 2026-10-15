import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Clock, Star, BadgeCheck, Share2, Calendar, Ticket, ChevronRight, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { ClubInfo } from '@/data/mockClubs';
import { clubService } from '@/services/club.service';
import { ClubMenu } from '@/components/clubs/ClubMenu';
import { eventService } from '@/services/event.service';
import { EventInfo } from '@/data/mockEvents';
import { supabase } from '@/lib/supabase';

const formatPrice = (p?: number) => {
  if (p === undefined || p === null || p === 0) return 'Entrada Libre';
  return `$${p.toLocaleString('es-CO')}`;
};

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [club, setClub] = useState<ClubInfo | null>(null);
  const [isLoadingClub, setIsLoadingClub] = useState(true);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  // 1. Cargar datos reales de la discoteca desde Supabase mediante clubService
  useEffect(() => {
    let isMounted = true;

    async function loadClub() {
      if (!id) {
        setIsLoadingClub(false);
        return;
      }

      setIsLoadingClub(true);
      try {
        const { club: fetchedClub, error } = await clubService.getClubById(String(id));
        if (isMounted) {
          if (!error && fetchedClub) {
            setClub(fetchedClub);
          } else {
            setClub(null);
          }
          setIsLoadingClub(false);
        }
      } catch {
        if (isMounted) {
          setClub(null);
          setIsLoadingClub(false);
        }
      }
    }

    loadClub();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // 2. Cargar eventos reales publicados de esta discoteca
  useEffect(() => {
    let isMounted = true;

    async function loadClubEvents() {
      if (!id) {
        setIsLoadingEvents(false);
        return;
      }

      setIsLoadingEvents(true);
      const { events: fetchedEvents, error } = await eventService.getEventsByClubId(String(id));

      if (isMounted) {
        if (!error && fetchedEvents) {
          setEvents(fetchedEvents);
        } else {
          setEvents([]);
        }
        setIsLoadingEvents(false);
      }
    }

    loadClubEvents();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleReserve = () => {
    Alert.alert('Próximamente', 'El flujo de reservas VIP y mesas estará disponible en la próxima versión.');
  };

  if (isLoadingClub) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#818cf8" />
        <Text style={[styles.loadingText, { marginTop: 12 }]}>Cargando discoteca...</Text>
      </SafeAreaView>
    );
  }

  if (!club) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.errorText}>Discoteca no encontrada</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        <ImageBackground source={{ uri: club.imageUrl }} style={styles.heroImage}>
          <LinearGradient
            colors={['rgba(2,2,5,0.5)', 'transparent', '#020205']}
            style={styles.heroGradient}
          >
            <SafeAreaView edges={['top']} style={styles.header}>
              <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                <ArrowLeft size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Share2 size={24} color="#fff" />
              </TouchableOpacity>
            </SafeAreaView>
          </LinearGradient>
        </ImageBackground>

        <View style={styles.content}>
          <View style={styles.topBadges}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{club.category.toUpperCase()}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Star size={14} color="#fbbf24" fill="#fbbf24" />
              <Text style={styles.ratingText}>{club.rating}</Text>
            </View>
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.title}>{club.name}</Text>
            {club.verified && <BadgeCheck size={28} color="#38bdf8" fill="#fff" />}
          </View>

          <View style={styles.infoBox}>
            <View style={styles.infoItem}>
              <Clock size={20} color="#818cf8" />
              <View>
                <Text style={styles.infoLabel}>Horarios</Text>
                <Text style={styles.infoValue}>{club.hours}</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <MapPin size={20} color="#818cf8" />
              <View>
                <Text style={styles.infoLabel}>Ubicación</Text>
                <Text style={styles.infoValue}>{club.location}</Text>
              </View>
            </View>
          </View>

          {/* SECCIÓN ACERCA DEL LUGAR */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Acerca del lugar</Text>
            <Text style={styles.description}>{club.description}</Text>
          </View>

          {/* SECCIÓN PRÓXIMOS EVENTOS REALES */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderTitleGroup}>
                <Calendar size={20} color="#818cf8" />
                <Text style={styles.sectionTitle}>Próximos eventos</Text>
              </View>
              {events.length > 0 && (
                <View style={styles.eventCountBadge}>
                  <Text style={styles.eventCountText}>{events.length}</Text>
                </View>
              )}
            </View>

            {isLoadingEvents ? (
              <View style={styles.eventsLoadingContainer}>
                <ActivityIndicator size="small" color="#818cf8" />
                <Text style={styles.eventsLoadingText}>Buscando eventos...</Text>
              </View>
            ) : events.length === 0 ? (
              <View style={styles.emptyEventsBox}>
                <View style={styles.emptyIconCircle}>
                  <Sparkles size={24} color="#6366f1" />
                </View>
                <Text style={styles.emptyTitle}>No hay eventos próximos</Text>
                <Text style={styles.emptySubtitle}>
                  Esta discoteca no tiene eventos programados por el momento. ¡Vuelve pronto para enterarte de nuevas fechas!
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
                      <Image source={{ uri: eventItem.imageUrl }} style={styles.eventFlyer} />
                      <View style={styles.eventDetails}>
                        <View style={styles.eventBadgeRow}>
                          <View style={styles.eventCategoryBadge}>
                            <Text style={styles.eventCategoryText}>{eventItem.category}</Text>
                          </View>
                          <Text style={styles.eventPriceText}>{formatPrice(price)}</Text>
                        </View>
                        <Text style={styles.eventTitle} numberOfLines={1}>
                          {eventItem.title}
                        </Text>
                        <View style={styles.eventMetaRow}>
                          <Clock size={13} color="#a1a1aa" />
                          <Text style={styles.eventMetaText} numberOfLines={1}>
                            {eventItem.date}
                          </Text>
                        </View>
                        <View style={styles.eventMetaRow}>
                          <MapPin size={13} color="#a1a1aa" />
                          <Text style={styles.eventMetaText} numberOfLines={1}>
                            {eventItem.location}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.eventArrowContainer}>
                        <ChevronRight size={18} color="#818cf8" />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* SECCIÓN CARTA */}
          {club.menu && club.menu.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Carta & Precios VIP</Text>
              <ClubMenu menu={club.menu} />
            </View>
          )}
        </View>
      </ScrollView>

      {/* FOOTER DE RESERVA */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.reserveButton} onPress={handleReserve} activeOpacity={0.8}>
          <Text style={styles.reserveButtonText}>Reservar Mesa VIP</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020205' },
  safeArea: { flex: 1, backgroundColor: '#020205', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#fff', fontSize: 18, marginBottom: 16 },
  loadingText: { color: '#a1a1aa', fontSize: 14 },
  backText: { color: '#818cf8', fontSize: 16, fontWeight: 'bold' },
  heroImage: { width: '100%', height: 400 },
  heroGradient: { flex: 1, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
  iconButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  content: { padding: 20, marginTop: -20 },
  topBadges: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: { color: '#818cf8', fontSize: 10, fontWeight: 'bold' },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8,
  },
  ratingText: { color: '#fbbf24', fontSize: 14, fontWeight: 'bold' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  title: { color: '#fff', fontSize: 30, fontWeight: '900', letterSpacing: -1, flex: 1 },
  infoBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 32,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  infoDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 16 },
  infoLabel: { color: '#a1a1aa', fontSize: 12, marginBottom: 4 },
  infoValue: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  section: { marginBottom: 32 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  eventCountBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  eventCountText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: { color: '#a1a1aa', fontSize: 14, lineHeight: 24 },
  eventsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
  },
  eventsLoadingText: {
    color: '#a1a1aa',
    fontSize: 13,
  },
  emptyEventsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#71717a',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  eventsList: {
    gap: 12,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  eventFlyer: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: '#18181b',
  },
  eventDetails: {
    flex: 1,
    gap: 4,
  },
  eventBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventCategoryBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  eventCategoryText: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: '700',
  },
  eventPriceText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '800',
  },
  eventTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventMetaText: {
    color: '#a1a1aa',
    fontSize: 12,
    flex: 1,
  },
  eventArrowContainer: {
    paddingLeft: 4,
  },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#05050A',
    paddingHorizontal: 24, paddingVertical: 20,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 36, // SafeArea padding
  },
  reserveButton: {
    backgroundColor: '#818cf8',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#818cf8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  reserveButtonText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});
