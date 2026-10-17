import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Building2, ArrowLeft } from 'lucide-react-native';

import { supabase } from '@/lib/supabase';
import { clubService } from '@/services/club.service';
import { eventService } from '@/services/event.service';
import { EventInfo } from '@/data/mockEvents';
import {
  ClubDetail,
  ClubMenuItem,
  ClubTable,
  ClubConnectStats,
  ClubBookingItem,
} from '@/types/club.types';
import { ClubTheme } from '@/constants/clubTheme';

import { ClubHero } from '@/components/clubs/ClubHero';
import { ClubNavigationTabs, ProfileTabType } from '@/components/clubs/ClubNavigationTabs';
import { ClubInfoTab } from '@/components/clubs/ClubInfoTab';
import { ClubMenuTab } from '@/components/clubs/ClubMenuTab';
import { ClubEventsTab } from '@/components/clubs/ClubEventsTab';
import { ClubCommunityTab } from '@/components/clubs/ClubCommunityTab';
import { ClubBookingsTab } from '@/components/clubs/ClubBookingsTab';

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Estados de datos
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [menuItems, setMenuItems] = useState<ClubMenuItem[]>([]);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [tables, setTables] = useState<ClubTable[]>([]);
  const [connectStats, setConnectStats] = useState<ClubConnectStats>({
    activeConnectCount: 0,
    visibleConnectCount: 0,
    occupancyStatus: 'Baja ocupación',
    occupancyColor: ClubTheme.colors.success,
    attendees: [],
  });
  const [userBookings, setUserBookings] = useState<ClubBookingItem[]>([]);

  // Estados de sesión
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userFullName, setUserFullName] = useState('');

  // Estados de control de UI
  const [activeTab, setActiveTab] = useState<ProfileTabType>('info');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. Cargar usuario autenticado
  const checkAuth = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();
        if (profile?.full_name) {
          setUserFullName(profile.full_name);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  // 2. Cargar todos los datos reales desde Supabase
  const loadClubData = useCallback(async (showLoader = false) => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    if (showLoader) setIsLoading(true);

    try {
      // 2.1 Cargar información del Club
      const { club: fetchedClub, error: clubError } = await clubService.getClubDetail(String(id));

      if (clubError || !fetchedClub) {
        setClub(null);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      setClub(fetchedClub);

      // 2.2 Consultar recursos vinculados
      const realClubId = fetchedClub.id;

      const [menuRes, tablesRes, eventsRes, statsRes, bookingsRes] = await Promise.all([
        clubService.getClubMenuItems(realClubId),
        clubService.getClubTables(realClubId),
        eventService.getEventsByClubId(realClubId),
        clubService.getClubConnectStats(realClubId),
        clubService.getUserClubBookings(realClubId),
      ]);

      setMenuItems(menuRes.items || []);
      setTables(tablesRes.tables || []);
      setEvents(eventsRes.events || []);
      setConnectStats(statsRes);
      setUserBookings(bookingsRes || []);
    } catch (err) {
      console.error('[ClubDetailScreen] Error cargando datos:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    checkAuth();
    loadClubData(true);
  }, [checkAuth, loadClubData]);

  // 3. Suscripciones Realtime de Supabase para reflejar cambios administrados desde Hangover Business
  useEffect(() => {
    if (!club?.id) return;

    const clubId = club.id;
    const channelName = `realtime-club-profile-${clubId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clubs', filter: `id=eq.${clubId}` },
        () => {
          loadClubData(false);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'club_tables', filter: `club_id=eq.${clubId}` },
        () => {
          clubService.getClubTables(clubId).then((res) => {
            if (res.tables) setTables(res.tables);
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'club_menu_items', filter: `club_id=eq.${clubId}` },
        () => {
          clubService.getClubMenuItems(clubId).then((res) => {
            if (res.items) setMenuItems(res.items);
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `club_id=eq.${clubId}` },
        () => {
          clubService.getUserClubBookings(clubId).then((res) => {
            setUserBookings(res);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [club?.id, loadClubData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadClubData(false);
  }, [loadClubData]);

  const handleBookCover = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Iniciar Sesión Requerido',
        'Inicia sesión con tu cuenta de usuario para comprar tu entrada de cover.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar Sesión', onPress: () => router.push('/(auth)/login' as any) },
        ]
      );
      return;
    }

    if (!club) return;

    const todayStr = new Date().toISOString().split('T')[0];

    Alert.alert(
      'Adquirir Entrada de Cover',
      `¿Deseas confirmar la compra del cover para ${club.name} por $${club.cover_price.toLocaleString('es-CO')} COP para hoy?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar y Adquirir',
          onPress: async () => {
            const { success, error } = await clubService.buyClubCover({
              clubId: club.id,
              clubSlug: club.slug,
              providerId: club.provider_id,
              ownerId: club.owner_id,
              customerName: userFullName || 'Cliente Hangover',
              visitDate: todayStr,
              guestCount: 1,
              coverPrice: club.cover_price,
            });

            if (success) {
              Alert.alert('¡Entrada de Cover Creada!', 'Tu cover ha sido registrado exitosamente. Puedes revisar tu código QR en la sección de Reservas.');
              loadClubData(false);
              setActiveTab('bookings');
            } else {
              Alert.alert('Error', error || 'No se pudo procesar la solicitud.');
            }
          },
        },
      ]
    );
  };

  // Render: Cargando
  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={ClubTheme.colors.primary} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </SafeAreaView>
    );
  }

  // Render: Discoteca no encontrada o no publicada
  if (!club) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <View style={styles.notFoundCircle}>
          <Building2 size={30} color={ClubTheme.colors.danger} />
        </View>
        <Text style={styles.notFoundTitle}>Discoteca no disponible</Text>
        <Text style={styles.notFoundSubtitle}>
          El establecimiento que buscas no existe o no está activo públicamente en la plataforma.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={16} color="#ffffff" />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        bounces={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={[1]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={ClubTheme.colors.primary}
            colors={[ClubTheme.colors.primary, ClubTheme.colors.accent]}
          />
        }
      >
        {/* Index 0: PORTADA / HERO LIMPIO */}
        <ClubHero
          club={club}
          onBack={() => router.back()}
          onSelectTab={(tab) => setActiveTab(tab)}
          onBookCover={club.cover_price > 0 ? handleBookCover : undefined}
        />

        {/* Index 1: NAVEGACIÓN PRINCIPAL (Sticky Header) */}
        <ClubNavigationTabs
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          eventsCount={events.length}
          tablesCount={tables.length}
          menuItemsCount={menuItems.length}
        />

        {/* Index 2: CONTENIDO SEGÚN LA PESTAÑA ACTIVA */}
        {activeTab === 'info' && <ClubInfoTab club={club} />}

        {activeTab === 'menu' && <ClubMenuTab items={menuItems} />}

        {activeTab === 'events' && (
          <ClubEventsTab
            club={club}
            events={events}
            onBookCover={club.cover_price > 0 ? handleBookCover : undefined}
          />
        )}

        {activeTab === 'community' && (
          <ClubCommunityTab
            club={club}
            stats={connectStats}
            isAuthenticated={isAuthenticated}
          />
        )}

        {activeTab === 'bookings' && (
          <ClubBookingsTab
            club={club}
            tables={tables}
            userBookings={userBookings}
            isAuthenticated={isAuthenticated}
            userFullName={userFullName}
            onBookingCreated={() => loadClubData(false)}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ClubTheme.colors.bg,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: ClubTheme.colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  notFoundCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ClubTheme.colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundTitle: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  notFoundSubtitle: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ClubTheme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: ClubTheme.radii.md,
    marginTop: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
