import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Modal, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronDown, Check } from 'lucide-react-native';

import { EventInfo } from '@/data/mockEvents';
import { MOCK_EVENT_METRICS, MOCK_PROMOTION_CAMPAIGNS } from '@/data/mockEventDiscoveryData';
import { EventDiscoveryEngine } from '@/services/eventDiscoveryEngine';
import { defaultRecommendationEngine, RecommendationResult } from '@/services/eventRecommendationEngine';
import { eventService } from '@/services/event.service';

import { EventCard } from '@/components/events/EventCard';
import { EventHeader } from '@/components/events/home/EventHeader';
import { SmartSearchBar } from '@/components/events/home/SmartSearchBar';
import { EssentialCategoryPills } from '@/components/events/home/EssentialCategoryPills';

import { TrendingEventsSection } from '@/components/events/home/TrendingEventsSection';
import { MostSearchedSection } from '@/components/events/home/MostSearchedSection';
import { UpcomingEventsSection } from '@/components/events/home/UpcomingEventsSection';
import { SponsoredEventsSection } from '@/components/events/home/SponsoredEventsSection';

import { AIRecommendationResults } from '@/components/events/ai/AIRecommendationResults';
import { PlanDiscoveryModal } from '@/components/events/ai/PlanDiscoveryModal';
import { useResponsive } from '@/hooks/useResponsive';

import { getUserPendingExperiences, submitUserRating, MOCK_USER_RATINGS } from '@/data/mockRatingData';
import { PendingEventRatingCard } from '@/components/events/rating/PendingEventRatingCard';
import { RatingExperienceSheet } from '@/components/events/rating/RatingExperienceSheet';
import { RequiredRatingModal } from '@/components/events/rating/RequiredRatingModal';

const SORT_OPTIONS = [
  { value: 'upcoming', label: 'Más próximos' },
  { value: 'popular', label: 'Más populares' },
  { value: 'rating', label: 'Mayor calificación' },
  { value: 'price-asc', label: 'Menor precio' },
  { value: 'price-desc', label: 'Mayor precio' },
];

const getMinPrice = (event: EventInfo) => {
  const active = event.ticketBatches.filter(b => b.status === 'active');
  if (active.length === 0) return Infinity;
  return Math.min(...active.map(b => b.price));
};

const isEventInCategory = (event: EventInfo, cat: string) => {
  if (cat === 'Todos') return true;
  if (cat === 'envivo') {
    return event.category === 'crossover' || event.title.toLowerCase().includes('vivo') || event.description.toLowerCase().includes('vivo');
  }
  if (cat === 'techno') {
    return event.category === 'electronica' || event.title.toLowerCase().includes('techno') || event.description.toLowerCase().includes('techno');
  }
  return event.category === cat;
};

export default function EventsListScreen() {
  const router = useRouter();
  const { screenPadding, safeBottomPadding } = useResponsive();

  // EVENTOS REALES DESDE SUPABASE
  const [realEvents, setRealEvents] = useState<EventInfo[]>([]);
  const [loadingRealEvents, setLoadingRealEvents] = useState(true);

  // ESTADO BÚSQUEDA TRADICIONAL & IA
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState('upcoming');
  const [showSort, setShowSort] = useState(false);

  // ESTADO HANGOVER AI
  const [isAIActive, setIsAIActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResults, setAiResults] = useState<RecommendationResult[]>([]);
  const [discoveryModalVisible, setDiscoveryModalVisible] = useState(false);

  // ESTADO DE CALIFICACIONES PENDIENTES / OBLIGATORIAS
  const [selectedPendingEventId, setSelectedPendingEventId] = useState<string | null>(null);
  const [ratingSheetVisible, setRatingSheetVisible] = useState(false);
  const [refreshRatingState, setRefreshRatingState] = useState(0);

  // CONSULTA REAL A SUPABASE (PUBLIC.EVENTS)
  const fetchRealEventsFromSupabase = useCallback(async () => {
    setLoadingRealEvents(true);
    const { events, error } = await eventService.getEvents();
    if (!error) {
      setRealEvents(events);
    }
    setLoadingRealEvents(false);
  }, []);

  useEffect(() => {
    fetchRealEventsFromSupabase();
  }, [fetchRealEventsFromSupabase]);

  const sortLabel = SORT_OPTIONS.find(s => s.value === sortBy)?.label ?? 'Ordenar';

  // EXPERIENCIAS PENDIENTES DE CALIFICACIÓN DEL USUARIO
  const pendingExperiences = useMemo(() => {
    return getUserPendingExperiences('current-user-1');
  }, [refreshRatingState]);

  const requiredExperience = useMemo(() => {
    return pendingExperiences.find((p) => p.ratingStatus === 'required' && !MOCK_USER_RATINGS[p.eventId]);
  }, [pendingExperiences]);

  // OBTENCIÓN DE RESULTADOS REACTIVOS UTILIZANDO REAL_EVENTS DE SUPABASE
  const trendingResults = useMemo(() => {
    const allTrending = EventDiscoveryEngine.getTrendingEvents(realEvents, MOCK_EVENT_METRICS);
    return allTrending.filter((item) => isEventInCategory(item.event, selectedCategory));
  }, [realEvents, selectedCategory, refreshRatingState]);

  const searchedResults = useMemo(() => {
    const allSearched = EventDiscoveryEngine.getMostSearchedEvents(realEvents, MOCK_EVENT_METRICS);
    return allSearched.filter((item) => isEventInCategory(item.event, selectedCategory));
  }, [realEvents, selectedCategory, refreshRatingState]);

  const upcomingResults = useMemo(() => {
    const allUpcoming = EventDiscoveryEngine.getUpcomingEvents(realEvents);
    return allUpcoming.filter((item) => isEventInCategory(item.event, selectedCategory));
  }, [realEvents, selectedCategory, refreshRatingState]);

  const sponsoredResults = useMemo(() => {
    const allSponsored = EventDiscoveryEngine.getSponsoredEvents(realEvents, MOCK_PROMOTION_CAMPAIGNS);
    return allSponsored.filter((item) => isEventInCategory(item.event, selectedCategory));
  }, [realEvents, selectedCategory, refreshRatingState]);

  // EJECUCIÓN DE BÚSQUEDA INTELIGENTE
  const handleExecuteSearch = (queryToRun?: string) => {
    const q = queryToRun !== undefined ? queryToRun : search;
    if (!q.trim()) return;

    setSearch(q);
    setIsAnalyzing(true);

    setTimeout(() => {
      const results = defaultRecommendationEngine.recommend(q, realEvents);
      setAiResults(results);
      setIsAIActive(true);
      setIsAnalyzing(false);
    }, 200);
  };

  const handleClearAI = () => {
    setSearch('');
    setAiResults([]);
    setIsAIActive(false);
  };

  const handleSelectCategory = (catVal: string) => {
    setSelectedCategory(catVal);
    if (isAIActive) {
      setIsAIActive(false);
    }
  };

  const handleSubmitRating = (eventId: string, score: number, tags: string[], comment: string) => {
    submitUserRating(eventId, 'current-user-1', score, tags, comment);
    setRatingSheetVisible(false);
    setSelectedPendingEventId(null);
    setRefreshRatingState((prev) => prev + 1);
    Alert.alert('¡Calificación Registrada!', 'Tu opinión ayuda a mejorar las recomendaciones de Hangover.');
  };

  // FILTRADO DE LA CARTELERA GENERAL POR BÚSQUEDA Y CATEGORÍA (UTILIZANDO EVENTOS REALES DE SUPABASE)
  const filteredEvents = realEvents
    .filter((event) => {
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        event.title.toLowerCase().includes(q) ||
        event.location.toLowerCase().includes(q) ||
        event.lineup.some(l => l.name.toLowerCase().includes(q));

      const matchesCategory = isEventInCategory(event, selectedCategory);
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular': return b.attendeeCount - a.attendeeCount;
        case 'rating':  return b.rating - a.rating;
        case 'price-asc': return getMinPrice(a) - getMinPrice(b);
        case 'price-desc': return getMinPrice(b) - getMinPrice(a);
        default:
          return new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime();
      }
    });

  const activePendingEvent = realEvents.find((e) => e.id === selectedPendingEventId);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: safeBottomPadding + 40 }]}
      >
        
        {/* ── 1. CABECERA PRINCIPAL ── */}
        <EventHeader
          onBack={() => router.push('/')}
          onOpenSort={() => setShowSort(true)}
        />

        {/* ── 2. BÚSQUEDA INTELIGENTE CON HANGOVER AI ── */}
        <SmartSearchBar
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            if (isAIActive && !text) setIsAIActive(false);
          }}
          onSubmit={() => handleExecuteSearch()}
          onOpenDiscovery={() => setDiscoveryModalVisible(true)}
          isAnalyzing={isAnalyzing}
        />

        {/* ── 🌟 EXPERIENCIAS PENDIENTES DE CALIFICACIÓN DE ASISTENTES ── */}
        {pendingExperiences.length > 0 && !isAIActive && (
          <View style={{ paddingHorizontal: screenPadding }}>
            {pendingExperiences.map((exp) => (
              <PendingEventRatingCard
                key={exp.eventId}
                eventTitle={exp.eventTitle}
                eventDate={exp.eventDate}
                eventImageUrl={exp.eventImageUrl}
                ratingStatus={exp.ratingStatus}
                onPressRate={() => {
                  setSelectedPendingEventId(exp.eventId);
                  setRatingSheetVisible(true);
                }}
              />
            ))}
          </View>
        )}

        {/* ── 3. CATEGORÍAS ESENCIALES (INTERACTIVAS) ── */}
        <EssentialCategoryPills
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
        />

        {/* INDICADOR DE ANÁLISIS DE IA */}
        {isAnalyzing && (
          <View style={[styles.analyzingBox, { marginHorizontal: screenPadding }]}>
            <ActivityIndicator size="small" color="#818cf8" />
            <Text style={styles.analyzingText}>Buscando el mejor plan para ti...</Text>
          </View>
        )}

        {/* VISTA DE RESULTADOS DE RECOMENDACIÓN DE IA */}
        {isAIActive && !isAnalyzing ? (
          <View style={{ paddingHorizontal: screenPadding }}>
            <AIRecommendationResults
              results={aiResults}
              onSelectEvent={(eventId) => router.push(`/events/${eventId}` as any)}
              onClear={handleClearAI}
              query={search}
            />
          </View>
        ) : (
          <>
            {/* ── 4. 🔥 EVENTOS EN TENDENCIA ── */}
            <TrendingEventsSection
              trendingResults={trendingResults}
              onSelectEvent={(eventId) => router.push(`/events/${eventId}` as any)}
            />

            {/* ── 5. 👀 MÁS BUSCADOS ── */}
            <MostSearchedSection
              searchedResults={searchedResults}
              onSelectEvent={(eventId) => router.push(`/events/${eventId}` as any)}
            />

            {/* ── 6. 📅 PRÓXIMAMENTE ── */}
            <UpcomingEventsSection
              upcomingResults={upcomingResults}
              onSelectEvent={(eventId) => router.push(`/events/${eventId}` as any)}
            />

            {/* ── 7. ⭐ DESTACADOS PATROCINADOS ── */}
            <SponsoredEventsSection
              sponsoredResults={sponsoredResults}
              onSelectEvent={(eventId) => router.push(`/events/${eventId}` as any)}
            />

            {/* ── 8. CARTELERA COMPLETA DE EVENTOS ── */}
            <View style={[styles.listSection, { paddingHorizontal: screenPadding }]}>
              <View style={styles.resultsRow}>
                <Text style={styles.resultsCount} numberOfLines={1}>
                  {selectedCategory === 'Todos' ? 'Todos los eventos' : `Categoría: ${selectedCategory}`} ({filteredEvents.length})
                </Text>
                <TouchableOpacity style={styles.sortPill} onPress={() => setShowSort(true)} activeOpacity={0.8}>
                  <Text style={styles.sortPillText}>{sortLabel}</Text>
                  <ChevronDown size={14} color="#818cf8" />
                </TouchableOpacity>
              </View>

              <View style={styles.listContainer}>
                {filteredEvents.map((item) => (
                  <EventCard
                    key={item.id}
                    event={item}
                    onPress={() => router.push(`/events/${item.id}` as any)}
                  />
                ))}
              </View>
            </View>
          </>
        )}

      </ScrollView>

      {/* SHEET DE CALIFICACIÓN PENDIENTE DE ASISTENCIA */}
      {activePendingEvent && (
        <RatingExperienceSheet
          visible={ratingSheetVisible}
          eventTitle={activePendingEvent.title}
          eventDate={activePendingEvent.date}
          onClose={() => {
            setRatingSheetVisible(false);
            setSelectedPendingEventId(null);
          }}
          onSubmitRating={(score, tags, comment) => {
            handleSubmitRating(activePendingEvent.id, score, tags, comment);
          }}
        />
      )}

      {/* MODAL OBLIGATORIO DE CALIFICACIÓN (SOLO CUANDO EXISTA UNA EXPERIENCIA 'required' Y NO HAYA SIDO CALIFICADA) */}
      {Boolean(requiredExperience) && (
        <RequiredRatingModal
          visible={true}
          eventTitle={requiredExperience!.eventTitle}
          eventDate={requiredExperience!.eventDate}
          onSubmitRating={(score, tags, comment) => {
            handleSubmitRating(requiredExperience!.eventId, score, tags, comment);
          }}
        />
      )}

      {/* MODAL ASISTIDO "¿NO SABES QUÉ HACER?" */}
      <PlanDiscoveryModal
        visible={discoveryModalVisible}
        onClose={() => setDiscoveryModalVisible(false)}
        onSelectPlan={(planQuery) => {
          handleExecuteSearch(planQuery);
        }}
      />

      {/* MODAL DE ORDENAMIENTO DE EVENTOS */}
      <Modal visible={showSort} transparent animationType="slide" onRequestClose={() => setShowSort(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowSort(false)}>
          <View style={styles.sortSheet}>
            <View style={styles.sortHandle} />
            <Text style={styles.sortSheetTitle}>Ordenar por</Text>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={styles.sortOption}
                onPress={() => {
                  setSortBy(opt.value);
                  setShowSort(false);
                }}
              >
                <Text style={[styles.sortOptionText, sortBy === opt.value && styles.sortOptionTextActive]}>
                  {opt.label}
                </Text>
                {sortBy === opt.value && <Check size={18} color="#818cf8" />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020205',
  },
  scrollContent: {},

  analyzingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: 'rgba(129, 140, 248, 0.08)',
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.2)',
  },
  analyzingText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '600',
  },

  listSection: {
    marginBottom: 20,
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsCount: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: 'bold',
    flexShrink: 1,
    marginRight: 8,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  sortPillText: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: 'bold',
  },

  listContainer: {
    gap: 14,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sortSheet: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  sortHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sortSheetTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  sortOptionText: {
    color: '#a1a1aa',
    fontSize: 14,
  },
  sortOptionTextActive: {
    color: '#818cf8',
    fontWeight: 'bold',
  },
});
