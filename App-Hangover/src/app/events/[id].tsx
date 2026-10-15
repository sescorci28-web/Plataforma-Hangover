import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Linking, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Share2, MapPin, Clock, Flame, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { EventInfo } from '@/data/mockEvents';
import { eventService } from '@/services/event.service';
import { getEventStories, getEventUpdates, EventStory } from '@/data/mockEventUpdates';
import { getEventCommunity } from '@/data/mockEventCommunity';
import { EventStories } from '@/components/events/EventStories';
import { EventStoryViewer } from '@/components/events/EventStoryViewer';

import { EventDetailTabs, DetailTabType } from '@/components/events/detail/EventDetailTabs';
import { EventInfoTab } from '@/components/events/detail/EventInfoTab';
import { EventActivityTab } from '@/components/events/detail/EventActivityTab';
import { EventCommunityTab } from '@/components/events/detail/EventCommunityTab';
import { useResponsive } from '@/hooks/useResponsive';

import { getUserRatingStatus, submitUserRating, MOCK_USER_RATINGS } from '@/data/mockRatingData';
import { PendingEventRatingCard } from '@/components/events/rating/PendingEventRatingCard';
import { RatingExperienceSheet } from '@/components/events/rating/RatingExperienceSheet';
import { RequiredRatingModal } from '@/components/events/rating/RequiredRatingModal';

const formatPrice = (p: number) => `$${p.toLocaleString('es-CO')}`;
const pct = (sold: number, cap: number) => Math.round((sold / cap) * 100);

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { screenPadding, topInset, safeBottomPadding, isCompact } = useResponsive();

  const [activeTab, setActiveTab] = useState<DetailTabType>('info');
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  // EVENTO REAL DESDE SUPABASE
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

  // ESTADO DE CALIFICACIÓN
  const [ratingSheetVisible, setRatingSheetVisible] = useState(false);
  const [refreshRatingState, setRefreshRatingState] = useState(0);

  const fetchEventData = useCallback(async () => {
    if (!id) return;
    setLoadingEvent(true);
    const { event: fetchedEvent } = await eventService.getEventById(String(id));
    setEvent(fetchedEvent);
    setLoadingEvent(false);
  }, [id]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  if (loadingEvent) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#818cf8" />
        <Text style={[styles.errorText, { marginTop: 16 }]}>Cargando información del evento...</Text>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.errorText}>Evento no encontrado en Supabase</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const occupancyPct = pct(event.attendeeCount, event.capacity);
  const stories = getEventStories(event.id);
  const updates = getEventUpdates(event.id);
  const community = getEventCommunity(event.id);

  // OBTENER ESTADO DE CALIFICACIÓN DEL USUARIO
  const ratingStatus = getUserRatingStatus(event.id);
  const userRatingObj = MOCK_USER_RATINGS[event.id];

  const handleSelectStory = (_story: EventStory, index: number) => {
    setSelectedStoryIndex(index);
    setStoryViewerVisible(true);
  };

  const openMaps = () => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`);
  };

  // MANEJO AL TOCAR EL RATING PROMEDIO DE LA PÁGINA
  const handleRatingPress = () => {
    if (ratingStatus === 'not_eligible') {
      Alert.alert(
        'Calificación Verificada',
        'Solo disponible para asistentes verificados con entrada validada en el evento.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    if (ratingStatus === 'completed' && userRatingObj) {
      Alert.alert(
        'Tu Calificación',
        `Has calificado este evento con ${userRatingObj.rating} de 5 estrellas.\n¿Deseas actualizar tu opinión?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Editar', onPress: () => setRatingSheetVisible(true) },
        ]
      );
      return;
    }

    setRatingSheetVisible(true);
  };

  const handleSubmitRating = (score: number, tags: string[], comment: string) => {
    submitUserRating(event.id, 'current-user-1', score, tags, comment);
    setRatingSheetVisible(false);
    setRefreshRatingState((prev) => prev + 1);
    Alert.alert('¡Calificación Registrada!', 'Gracias por calificar tu experiencia en Hangover.');
  };

  const locationParts = event.location.split(',');
  const mainLocation = locationParts[0]?.trim() || event.location;
  const subLocation = locationParts.slice(1).join(',').trim();

  const isPendingRating = ratingStatus === 'pending' || ratingStatus === 'reminded';
  const isRequiredRating = ratingStatus === 'required';

  return (
    <View style={styles.container}>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: safeBottomPadding + 90 }}
      >
        {/* ── NIVEL 1: HERO & INFORMACIÓN ESENCIAL RESPONSIVE ── */}
        <ImageBackground source={{ uri: event.imageUrl }} style={[styles.heroImage, isCompact && { height: 320 }]}>
          <LinearGradient
            colors={['rgba(2,2,5,0.6)', 'transparent', '#020205']}
            style={styles.heroGradient}
          >
            {/* SAFE AREA SUPERIOR INDEPENDIENTE DEL SISTEMA */}
            <View style={[styles.heroHeader, { paddingTop: Math.max(topInset, 16), paddingHorizontal: screenPadding }]}>
              <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.8}>
                <ArrowLeft size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
                <Share2 size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ImageBackground>

        <View style={[styles.content, { paddingHorizontal: screenPadding }]}>
          {/* BADGES */}
          <View style={styles.badgesRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{event.category.toUpperCase()}</Text>
            </View>
            {event.isTrending && (
              <View style={styles.trendingBadge}>
                <Flame size={11} color="#ec4899" />
                <Text style={styles.trendingText}>Trending</Text>
              </View>
            )}

            {/* BLOQUE INTERACTIVO DE RATING OFICIAL DE ASISTENTES */}
            <TouchableOpacity
              style={styles.ratingBadgePill}
              onPress={handleRatingPress}
              activeOpacity={0.8}
            >
              <Star size={11} color="#fbbf24" fill="#fbbf24" />
              <Text style={styles.ratingText}>{event.rating}</Text>
              <Text style={styles.ratingSub}>({event.reviewsCount})</Text>
            </TouchableOpacity>
          </View>

          {/* TÍTULO DEL EVENTO */}
          <Text style={[styles.title, isCompact && { fontSize: 24 }]}>{event.title}</Text>

          {/* TARJETA DE EXPERIENCIA PENDIENTE (SI APLICA) */}
          {(isPendingRating || isRequiredRating) && (
            <PendingEventRatingCard
              eventTitle={event.title}
              eventDate={event.date}
              eventImageUrl={event.imageUrl}
              ratingStatus={ratingStatus}
              onPressRate={() => setRatingSheetVisible(true)}
            />
          )}

          {/* TARJETA DE INFORMACIÓN RÁPIDA (FECHA Y UBICACIÓN) */}
          <View style={styles.infoBox}>
            <View style={styles.infoItem}>
              <View style={styles.infoIconCol}>
                <Clock size={18} color="#818cf8" />
              </View>
              <View style={styles.infoTextCol}>
                <Text style={styles.infoLabel}>FECHA Y HORA</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{event.date}</Text>
                <Text style={styles.infoSub}>{event.openTime} — {event.closeTime}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <View style={styles.infoIconCol}>
                <MapPin size={18} color="#818cf8" />
              </View>
              <View style={styles.infoTextCol}>
                <Text style={styles.infoLabel}>UBICACIÓN</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{mainLocation}</Text>
                {subLocation ? <Text style={styles.infoSub} numberOfLines={1}>{subLocation}</Text> : null}
              </View>
            </View>
          </View>

          {/* 🌟 ESTADOS DEL EVENTO (STORIES ESENCIALES SUPERIORES) */}
          <EventStories stories={stories} onSelectStory={handleSelectStory} />

          {/* ── NIVEL 2: BARRA DE NAVEGACIÓN INTERNA POR PESTAÑAS ── */}
          <EventDetailTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            updatesCount={updates.length}
            communityCount={community.totalPresent}
          />

          {/* ── CONTENIDO DINÁMICO SEGÚN LA PESTAÑA SELECCIONADA ── */}
          {activeTab === 'info' && (
            <EventInfoTab
              event={event}
              occupancyPct={occupancyPct}
              openMaps={openMaps}
            />
          )}

          {activeTab === 'activity' && (
            <EventActivityTab updates={updates} />
          )}

          {activeTab === 'community' && (
            <EventCommunityTab community={community} />
          )}
        </View>
      </ScrollView>

      {/* ── FOOTER CTA FIJO DE COMPRA CON SAFE AREA INFERIOR ── */}
      <View style={[styles.footer, { paddingHorizontal: screenPadding, paddingBottom: Math.max(safeBottomPadding, 14) }]}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={styles.footerLabel}>Entradas disponibles</Text>
          <Text style={styles.footerPrice} numberOfLines={1}>
            Desde {formatPrice(Math.min(...event.ticketBatches.filter(b=>b.status==='active').map(b=>b.price)))}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.buyButton}
          onPress={() => router.push(`/events/${event.id}/tickets` as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.buyButtonText}>Seleccionar Entradas</Text>
        </TouchableOpacity>
      </View>

      {/* ── SHEET DE CALIFICACIÓN VOLUNTARIA / PENDIENTE ── */}
      <RatingExperienceSheet
        visible={ratingSheetVisible}
        eventTitle={event.title}
        eventDate={event.date}
        onClose={() => setRatingSheetVisible(false)}
        onSubmitRating={handleSubmitRating}
      />

      {/* ── MODAL ELEGANTE OBLIGATORIO DE CALIFICACIÓN (CUANDO ratingStatus === 'required') ── */}
      <RequiredRatingModal
        visible={isRequiredRating}
        eventTitle={event.title}
        eventDate={event.date}
        onSubmitRating={handleSubmitRating}
      />

      {/* ── VISOR MODAL DE STORIES ── */}
      <EventStoryViewer
        visible={storyViewerVisible}
        stories={stories}
        initialIndex={selectedStoryIndex}
        onClose={() => setStoryViewerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020205' },
  safeArea: { flex: 1, backgroundColor: '#020205', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#fff', fontSize: 18, marginBottom: 12 },
  backLink: { color: '#818cf8', fontSize: 16, fontWeight: 'bold' },

  heroImage: { width: '100%', height: 350 },
  heroGradient: { flex: 1, justifyContent: 'space-between' },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  iconButton: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },

  content: { marginTop: -20 },

  badgesRow: { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' },
  categoryBadge: { backgroundColor: 'rgba(99,102,241,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  categoryText: { color: '#818cf8', fontSize: 9, fontWeight: 'bold' },
  trendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(236,72,153,0.12)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  trendingText: { color: '#ec4899', fontSize: 9, fontWeight: 'bold' },

  ratingBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  ratingText: { color: '#fbbf24', fontSize: 10, fontWeight: 'bold' },
  ratingSub: { color: '#71717a', fontSize: 9, fontWeight: '500' },

  title: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5, marginBottom: 14 },

  infoBox: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 16 },
  infoItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoIconCol: { width: 22, alignItems: 'center', paddingTop: 2 },
  infoTextCol: { flex: 1 },
  infoDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 12 },
  infoLabel: { color: '#71717a', fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  infoValue: { color: '#fff', fontSize: 13, fontWeight: 'bold', lineHeight: 18 },
  infoSub: { color: '#a1a1aa', fontSize: 11, marginTop: 2 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(2,2,5,0.96)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  footerLabel: { color: '#71717a', fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' },
  footerPrice: { color: '#fff', fontSize: 17, fontWeight: '900', marginTop: 1 },
  buyButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12,
  },
  buyButtonText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
});
