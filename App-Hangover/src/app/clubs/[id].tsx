import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  AppState,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Building2, ArrowLeft, ShieldCheck } from 'lucide-react-native';

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
  VenueOrder,
} from '@/types/club.types';
import { ClubTheme } from '@/constants/clubTheme';

import { ClubHero } from '@/components/clubs/ClubHero';
import { ClubNavigationTabs, ProfileTabType } from '@/components/clubs/ClubNavigationTabs';
import { ClubInfoTab } from '@/components/clubs/ClubInfoTab';
import { ClubMenuTab } from '@/components/clubs/ClubMenuTab';
import { ClubExperienceTab } from '@/components/clubs/ClubExperienceTab';
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
  const [hasActivePresence, setHasActivePresence] = useState(false);
  const [userVenueOrders, setUserVenueOrders] = useState<VenueOrder[]>([]);

  // Estados de sesión
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userFullName, setUserFullName] = useState('');

  // Estados de control de UI
  const [activeTab, setActiveTab] = useState<ProfileTabType>('info');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);

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
    setMenuLoading(true);
    setMenuError(null);

    try {
      // 2.1 Cargar información del Club
      const { club: fetchedClub, error: clubError } = await clubService.getClubDetail(String(id));

      if (clubError || !fetchedClub) {
        setClub(null);
        setIsLoading(false);
        setIsRefreshing(false);
        setMenuLoading(false);
        return;
      }

      setClub(fetchedClub);

      // 2.2 Consultar recursos vinculados
      const realClubId = fetchedClub.id;

      const [menuRes, tablesRes, eventsRes, statsRes, bookingsRes, presenceRes, ordersRes] = await Promise.all([
        clubService.getClubMenuItems(realClubId),
        clubService.getClubTables(realClubId),
        eventService.getEventsByClubId(realClubId),
        clubService.getClubConnectStats(realClubId),
        clubService.getUserClubBookings(realClubId),
        clubService.checkUserPresenceInClub(realClubId),
        clubService.getUserActiveVenueOrders(realClubId),
      ]);

      if (menuRes.error) {
        setMenuError(menuRes.error);
        setMenuItems([]);
      } else {
        setMenuError(null);
        setMenuItems(menuRes.items || []);
      }

      setTables(tablesRes.tables || []);
      setEvents(eventsRes.events || []);
      setConnectStats(statsRes);
      setUserBookings(bookingsRes || []);
      setHasActivePresence(Boolean(presenceRes));
      setUserVenueOrders(ordersRes || []);
    } catch (err) {
      console.error('[ClubDetailScreen] Error cargando datos:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setMenuLoading(false);
    }
  }, [id]);

  useEffect(() => {
    checkAuth();
    loadClubData(true);
  }, [checkAuth, loadClubData]);

  // Actualización automática al enfocar o regresar a la pantalla de perfil
  useFocusEffect(
    useCallback(() => {
      if (id) {
        loadClubData(false);
      }
    }, [id, loadClubData])
  );

  // Recuperación automática al volver desde segundo plano (AppState: background -> active)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && id) {
        loadClubData(false);
      }
    });
    return () => {
      subscription.remove();
    };
  }, [id, loadClubData]);

  const handleRetryMenu = useCallback(async (silent = false) => {
    if (!club?.id) return;
    if (!silent) setMenuLoading(true);
    setMenuError(null);
    try {
      const res = await clubService.getClubMenuItems(club.id);
      if (res.error) {
        setMenuError(res.error);
        setMenuItems([]);
      } else {
        setMenuError(null);
        setMenuItems(res.items || []);
      }
    } catch (err: any) {
      setMenuError(err?.message || 'Error al consultar la carta');
    } finally {
      if (!silent) setMenuLoading(false);
    }
  }, [club?.id]);

  // Valor animado para la transición suave de entrada del contenido de la pestaña
  const tabContentFade = useRef(new Animated.Value(1)).current;

  // Al cambiar de pestaña o volver a la carta / experiencia, refrescar los datos desde Supabase
  const handleSelectTab = useCallback(
    (tab: ProfileTabType) => {
      tabContentFade.setValue(0.55);
      setActiveTab(tab);
      Animated.timing(tabContentFade, {
        toValue: 1,
        duration: 210,
        useNativeDriver: true,
      }).start();

      if (tab === 'menu' && club?.id) {
        handleRetryMenu(menuItems.length > 0);
        clubService.checkUserPresenceInClub(club.id).then(setHasActivePresence);
        clubService.getUserActiveVenueOrders(club.id).then(setUserVenueOrders);
      } else if (tab === 'experience' && club?.id) {
        clubService.checkUserPresenceInClub(club.id).then(setHasActivePresence);
        clubService.getUserActiveVenueOrders(club.id).then(setUserVenueOrders);
      }
    },
    [club?.id, handleRetryMenu, menuItems.length, tabContentFade]
  );

  // Manejadores de eventos Realtime para public.club_menu_items (Dashboard Web)
  const handleRealtimeInsert = useCallback(
    (newItem: any) => {
      if (!newItem || !club?.id || newItem.club_id !== club.id || !newItem.active) return;
      const rawCategory = newItem.category || 'General';
      const formattedCat = rawCategory.trim().charAt(0).toUpperCase() + rawCategory.trim().slice(1).toLowerCase();
      const formatted: ClubMenuItem = {
        id: newItem.id,
        club_id: newItem.club_id,
        category: formattedCat,
        name: (newItem.name || 'Producto').trim(),
        description: newItem.description || null,
        price: Number(newItem.price || 0),
        image_url: newItem.image_url || null,
        active: Boolean(newItem.active),
        featured: Boolean(newItem.featured),
        available: newItem.available !== false,
      };
      setMenuItems((prev) => {
        if (prev.some((i) => i.id === formatted.id)) {
          return prev.map((i) => (i.id === formatted.id ? formatted : i));
        }
        return [formatted, ...prev];
      });
      handleRetryMenu(true);
    },
    [club?.id, handleRetryMenu]
  );

  const handleRealtimeUpdate = useCallback(
    (updatedItem: any) => {
      if (!updatedItem || !club?.id || updatedItem.club_id !== club.id) return;
      if (!updatedItem.active) {
        setMenuItems((prev) => prev.filter((i) => i.id !== updatedItem.id));
      } else {
        const rawCategory = updatedItem.category || 'General';
        const formattedCat = rawCategory.trim().charAt(0).toUpperCase() + rawCategory.trim().slice(1).toLowerCase();
        const formatted: ClubMenuItem = {
          id: updatedItem.id,
          club_id: updatedItem.club_id,
          category: formattedCat,
          name: (updatedItem.name || 'Producto').trim(),
          description: updatedItem.description || null,
          price: Number(updatedItem.price || 0),
          image_url: updatedItem.image_url || null,
          active: Boolean(updatedItem.active),
          featured: Boolean(updatedItem.featured),
          available: updatedItem.available !== false,
        };
        setMenuItems((prev) => {
          const exists = prev.some((i) => i.id === formatted.id);
          if (exists) {
            return prev.map((i) => (i.id === formatted.id ? formatted : i));
          }
          return [formatted, ...prev];
        });
      }
      handleRetryMenu(true);
    },
    [club?.id, handleRetryMenu]
  );

  const handleRealtimeDelete = useCallback(
    (oldItem: any) => {
      const deletedId = oldItem?.id;
      if (deletedId) {
        setMenuItems((prev) => prev.filter((i) => i.id !== deletedId));
      }
      handleRetryMenu(true);
    },
    [handleRetryMenu]
  );

  // Manejadores de eventos Realtime para public.menu_products (APK Hangover Business)
  const handleMenuProductRealtimeInsert = useCallback(
    (newItem: any) => {
      if (!newItem || !club?.id || newItem.club_id !== club.id) return;
      if (newItem.status !== 'published') return;
      const rawCategory = newItem.product_type || 'General';
      const formattedCat = rawCategory.trim().charAt(0).toUpperCase() + rawCategory.trim().slice(1).toLowerCase();
      const formatted: ClubMenuItem = {
        id: newItem.id,
        club_id: newItem.club_id,
        category: formattedCat,
        name: (newItem.name || 'Producto').trim(),
        description: newItem.description || null,
        price: Number(newItem.base_price || 0),
        image_url: newItem.image_url || null,
        active: newItem.status === 'published',
        featured: Boolean(newItem.is_featured),
        available: newItem.is_available !== false,
      };
      setMenuItems((prev) => {
        const withoutDup = prev.filter(
          (i) => i.id !== formatted.id && i.name.toLowerCase() !== formatted.name.toLowerCase()
        );
        return [formatted, ...withoutDup];
      });
      handleRetryMenu(true);
    },
    [club?.id, handleRetryMenu]
  );

  const handleMenuProductRealtimeUpdate = useCallback(
    (updatedItem: any) => {
      if (!updatedItem || !club?.id || updatedItem.club_id !== club.id) return;
      if (updatedItem.status !== 'published') {
        setMenuItems((prev) => prev.filter((i) => i.id !== updatedItem.id));
      } else {
        const rawCategory = updatedItem.product_type || 'General';
        const formattedCat = rawCategory.trim().charAt(0).toUpperCase() + rawCategory.trim().slice(1).toLowerCase();
        const formatted: ClubMenuItem = {
          id: updatedItem.id,
          club_id: updatedItem.club_id,
          category: formattedCat,
          name: (updatedItem.name || 'Producto').trim(),
          description: updatedItem.description || null,
          price: Number(updatedItem.base_price || 0),
          image_url: updatedItem.image_url || null,
          active: updatedItem.status === 'published',
          featured: Boolean(updatedItem.is_featured),
          available: updatedItem.is_available !== false,
        };
        setMenuItems((prev) => {
          const exists = prev.some((i) => i.id === formatted.id);
          if (exists) {
            return prev.map((i) => (i.id === formatted.id ? formatted : i));
          }
          const withoutNameDup = prev.filter(
            (i) => i.name.toLowerCase() !== formatted.name.toLowerCase()
          );
          return [formatted, ...withoutNameDup];
        });
      }
      handleRetryMenu(true);
    },
    [club?.id, handleRetryMenu]
  );

  const handleMenuProductRealtimeDelete = useCallback(
    (oldItem: any) => {
      const deletedId = oldItem?.id;
      if (deletedId) {
        setMenuItems((prev) => prev.filter((i) => i.id !== deletedId));
      }
      handleRetryMenu(true);
    },
    [handleRetryMenu]
  );

  // 3. Suscripciones Realtime de Supabase para reflejar cambios administrados desde Hangover Business
  useEffect(() => {
    if (!club?.id) return;

    const clubId = club.id;
    const channelName = `realtime-club-profile-${clubId}`;

    // Limpiar cualquier canal preexistente con este topic para evitar listeners duplicados
    const existingChannels = supabase.getChannels();
    existingChannels.forEach((ch) => {
      if (ch.topic === `realtime:${channelName}`) {
        supabase.removeChannel(ch);
      }
    });

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
      // Eventos para productos creados/editados desde la APK de Hangover Business
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'menu_products', filter: `club_id=eq.${clubId}` },
        (payload) => {
          handleMenuProductRealtimeInsert(payload.new);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'menu_products', filter: `club_id=eq.${clubId}` },
        (payload) => {
          handleMenuProductRealtimeUpdate(payload.new);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'menu_products' },
        (payload) => {
          handleMenuProductRealtimeDelete(payload.old);
        }
      )
      // Eventos para categorías del menú de Hangover Business
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_categories', filter: `club_id=eq.${clubId}` },
        () => {
          handleRetryMenu(true);
        }
      )
      // Eventos para public.club_menu_items (Dashboard Web)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'club_menu_items', filter: `club_id=eq.${clubId}` },
        (payload) => {
          handleRealtimeInsert(payload.new);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'club_menu_items', filter: `club_id=eq.${clubId}` },
        (payload) => {
          handleRealtimeUpdate(payload.new);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'club_menu_items' },
        (payload) => {
          handleRealtimeDelete(payload.old);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `club_id=eq.${clubId}` },
        () => {
          clubService.getUserClubBookings(clubId).then((res) => {
            setUserBookings(res);
          });
          clubService.checkUserPresenceInClub(clubId).then(setHasActivePresence);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'connect_presence', filter: `club_id=eq.${clubId}` },
        () => {
          clubService.checkUserPresenceInClub(clubId).then(setHasActivePresence);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'venue_orders', filter: `club_id=eq.${clubId}` },
        () => {
          clubService.getUserActiveVenueOrders(clubId).then(setUserVenueOrders);
        }
      )
      .subscribe((status, error) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Conectado a canal para club ${clubId}`);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`[Realtime] Estado de canal: ${status}`, error?.message);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    club?.id,
    loadClubData,
    handleRetryMenu,
    handleRealtimeInsert,
    handleRealtimeUpdate,
    handleRealtimeDelete,
    handleMenuProductRealtimeInsert,
    handleMenuProductRealtimeUpdate,
    handleMenuProductRealtimeDelete,
  ]);

  // Complemento de sincronización activa en segundo plano mientras la carta esté abierta
  useEffect(() => {
    if (activeTab !== 'menu' || !club?.id) return;

    const interval = setInterval(() => {
      handleRetryMenu(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeTab, club?.id, handleRetryMenu]);

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
          onSelectTab={handleSelectTab}
          onBookCover={club.cover_price > 0 ? handleBookCover : undefined}
        />

        {/* Index 1: NAVEGACIÓN PRINCIPAL (Sticky Header) */}
        <ClubNavigationTabs
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          eventsCount={events.length}
          tablesCount={tables.length}
          menuItemsCount={menuItems.length}
          experienceCount={userVenueOrders.filter((o) => ['pending', 'accepted', 'in_preparation', 'ready', 'delivered'].includes(o.status)).length}
          communityCount={connectStats?.activeConnectCount || 0}
        />

        {/* Indicador de Presencia Validada en Puerta */}
        {hasActivePresence && club.isOpen && (
          <View style={styles.presenceActiveBanner}>
            <ShieldCheck size={16} color="#10B981" />
            <Text style={styles.presenceActiveBannerText}>
              Acceso validado en puerta • Estás dentro de {club.name}
            </Text>
          </View>
        )}

        {/* Index 2: CONTENIDO SEGÚN LA PESTAÑA ACTIVA CON TRANSICIÓN ANIMADA */}
        <Animated.View style={{ opacity: tabContentFade, flex: 1 }}>
          {activeTab === 'info' && <ClubInfoTab club={club} />}

          {activeTab === 'menu' && (
            <ClubMenuTab
              clubId={club.id}
              clubName={club.name}
              items={menuItems}
              isLoading={menuLoading}
              error={menuError}
              isClubOpen={club.isOpen}
              hasActivePresence={hasActivePresence}
              userOrders={userVenueOrders}
              customerName={userFullName || 'Cliente Hangover'}
              onRetry={() => handleRetryMenu(false)}
              onNavigateToExperience={() => handleSelectTab('experience')}
              onOrderPlaced={() => {
                clubService.getUserActiveVenueOrders(club.id).then(setUserVenueOrders);
              }}
              onOrderConfirmed={() => {
                clubService.getUserActiveVenueOrders(club.id).then(setUserVenueOrders);
              }}
              onStayFinalized={() => {
                setHasActivePresence(false);
                loadClubData(false);
              }}
            />
          )}

          {activeTab === 'experience' && (
            <ClubExperienceTab
              clubId={club.id}
              clubName={club.name}
              hasActivePresence={hasActivePresence}
              isClubOpen={club.isOpen}
              orders={userVenueOrders}
              onOrderConfirmed={() => {
                clubService.getUserActiveVenueOrders(club.id).then(setUserVenueOrders);
              }}
              onStayFinalized={() => {
                setHasActivePresence(false);
                loadClubData(false);
                handleSelectTab('info');
              }}
              onNavigateToMenu={() => handleSelectTab('menu')}
            />
          )}

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
        </Animated.View>
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
  presenceActiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  presenceActiveBannerText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
});
