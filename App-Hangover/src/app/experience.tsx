import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Sparkles,
  Wine,
  ShieldCheck,
  CreditCard,
  Clock,
  Compass,
  QrCode,
  ArrowRight,
  MapPin,
  Lock,
} from 'lucide-react-native';

import { supabase } from '@/lib/supabase';
import { clubService } from '@/services/club.service';
import { ClubTheme } from '@/constants/clubTheme';
import { VenueOrder } from '@/types/club.types';
import { ClubExperienceTab } from '@/components/clubs/ClubExperienceTab';
import { BottomNav } from '@/components/layout/BottomNav';

export default function ExperienceScreen() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeStay, setActiveStay] = useState<{
    clubId: string;
    clubName: string;
    hasActivePresence: boolean;
    isClubOpen: boolean;
    hasPendingDebt?: boolean;
    accountBalance?: number;
  } | null>(null);
  const [orders, setOrders] = useState<VenueOrder[]>([]);

  // 1. Validar autenticación y cargar la estancia activa
  const checkStay = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAuthenticated(false);
        setActiveStay(null);
        setOrders([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      setIsAuthenticated(true);
      const stay = await clubService.getUserActiveStay();

      if (stay) {
        setActiveStay(stay);
        const activeOrders = await clubService.getUserActiveVenueOrders(stay.clubId);
        setOrders(activeOrders);
      } else {
        setActiveStay(null);
        setOrders([]);
      }
    } catch (err) {
      console.warn('[ExperienceScreen] Error cargando estancia:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkStay(true);
  }, [checkStay]);

  useFocusEffect(
    useCallback(() => {
      checkStay(false);
    }, [checkStay])
  );

  // Escuchar en realtime cambios en la discoteca activa
  useEffect(() => {
    if (!activeStay?.clubId) return;

    const channel = supabase
      .channel(`experience_club_sync_${activeStay.clubId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clubs',
          filter: `id=eq.${activeStay.clubId}`,
        },
        () => {
          checkStay(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeStay?.clubId, checkStay]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    checkStay(false);
  }, [checkStay]);

  // Pantalla de carga
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={ClubTheme.colors.primary} />
          <Text style={styles.loadingText}>Cargando tu experiencia...</Text>
        </View>
        <BottomNav />
      </SafeAreaView>
    );
  }

  // Si no está autenticado
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MI EXPERIENCIA</Text>
        </View>

        <View style={styles.authEmptyContent}>
          <View style={styles.heroIconCircle}>
            <Lock size={32} color="#F900BF" />
          </View>
          <Text style={styles.authTitle}>Inicia Sesión en Hangover</Text>
          <Text style={styles.authSubtitle}>
            Para acceder a tu cuenta de consumo por estancia, tus pedidos en vivo y confirmaciones, inicia sesión con tu cuenta.
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/login' as any)}
          >
            <Text style={styles.primaryBtnText}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>

        <BottomNav />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {activeStay ? (
        // EXPERIENCIA EN UNA DISCOTECA
        <View style={styles.activeStayContainer}>
          {/* Header superior de discoteca */}
          <View style={styles.activeHeader}>
            <View style={styles.activeHeaderLeft}>
              {activeStay.isClubOpen ? (
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>EN VIVO</Text>
                </View>
              ) : (
                <View style={[styles.liveIndicator, { backgroundColor: 'rgba(167, 139, 250, 0.15)', borderColor: 'rgba(167, 139, 250, 0.3)' }]}>
                  <Text style={[styles.liveText, { color: '#C4B5FD' }]}>CERRADA</Text>
                </View>
              )}
              <Text style={styles.activeClubName} numberOfLines={1}>
                {activeStay.clubName}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.goToMenuBtn}
              activeOpacity={0.8}
              onPress={() => router.push(`/clubs/${activeStay.clubId}` as any)}
            >
              <Wine size={14} color="#FFFFFF" />
              <Text style={styles.goToMenuBtnText}>Ver Carta</Text>
            </TouchableOpacity>
          </View>

          {/* Componente central de Mi Experiencia con pestañas Mi Cuenta y Mis Pedidos */}
          <View style={styles.experienceContentWrapper}>
            <ClubExperienceTab
              clubId={activeStay.clubId}
              clubName={activeStay.clubName}
              hasActivePresence={activeStay.hasActivePresence}
              isClubOpen={activeStay.isClubOpen}
              orders={orders}
              onOrderConfirmed={() => {
                clubService.getUserActiveVenueOrders(activeStay.clubId).then(setOrders);
              }}
              onStayFinalized={() => {
                setActiveStay(null);
                setOrders([]);
                checkStay(false);
              }}
              onNavigateToMenu={() => {
                router.push(`/clubs/${activeStay.clubId}` as any);
              }}
            />
          </View>
        </View>
      ) : (
        // ESTADO VACÍO ELEGANTE: SIN ESTANCIA ACTIVA
        <ScrollView
          style={styles.emptyScrollView}
          contentContainerStyle={styles.emptyScrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={ClubTheme.colors.primary}
              colors={[ClubTheme.colors.primary, ClubTheme.colors.accent]}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>MI EXPERIENCIA</Text>
          </View>

          <View style={styles.emptyHeroCard}>
            <View style={styles.heroGlowCircle}>
              <Sparkles size={40} color="#F900BF" />
            </View>

            <Text style={styles.emptyHeroTitle}>Sin Estancia Activa</Text>
            <Text style={styles.emptyHeroSubtitle}>
              Tu cuenta de consumo personal y tus pedidos en vivo se activan automáticamente cuando el personal de la discoteca valida tu entrada QR en puerta.
            </Text>

            {/* Tarjetas de Beneficios */}
            <View style={styles.benefitsRow}>
              <View style={styles.benefitCard}>
                <View style={styles.benefitIconBox}>
                  <CreditCard size={18} color="#A78BFA" />
                </View>
                <Text style={styles.benefitTitle}>Cuenta Única</Text>
                <Text style={styles.benefitDesc}>
                  Cargos directos sin entregar tarjetas físicas ni cédulas en la barra.
                </Text>
              </View>

              <View style={styles.benefitCard}>
                <View style={styles.benefitIconBox}>
                  <Wine size={18} color="#F900BF" />
                </View>
                <Text style={styles.benefitTitle}>Pedidos en Vivo</Text>
                <Text style={styles.benefitDesc}>
                  Comandas a tu mesa o barra con seguimiento de preparación.
                </Text>
              </View>
            </View>

            <View style={styles.singleBenefitCard}>
              <ShieldCheck size={18} color="#10B981" />
              <View style={{ flex: 1 }}>
                <Text style={styles.singleBenefitTitle}>Pagos Verificados y Salida Segura</Text>
                <Text style={styles.singleBenefitDesc}>
                  Paga tu saldo acumulado con Nequi, Daviplata o tarjeta antes de salir del establecimiento.
                </Text>
              </View>
            </View>

            {/* Botones de Acción */}
            <View style={styles.emptyActionsCol}>
              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.85}
                onPress={() => router.push('/explore')}
              >
                <Compass size={18} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Explorar Discotecas</Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                activeOpacity={0.85}
                onPress={() => router.push('/profile' as any)}
              >
                <QrCode size={18} color="#A78BFA" />
                <Text style={styles.secondaryBtnText}>Ver Mis Entradas y Covers</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Navegación inferior fija */}
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020205',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2,
  },
  activeStayContainer: {
    flex: 1,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#0A0A14',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(153, 0, 240, 0.25)',
  },
  activeHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  activeClubName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  goToMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(153, 0, 240, 0.3)',
    borderWidth: 1,
    borderColor: '#9900F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  goToMenuBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  experienceContentWrapper: {
    flex: 1,
  },
  emptyScrollView: {
    flex: 1,
  },
  emptyScrollContent: {
    paddingBottom: 40,
  },
  emptyHeroCard: {
    margin: 20,
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#0D0D1A',
    borderWidth: 1,
    borderColor: 'rgba(153, 0, 240, 0.25)',
    alignItems: 'center',
  },
  heroGlowCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(249, 0, 191, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(249, 0, 191, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyHeroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyHeroSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 24,
  },
  benefitsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 12,
  },
  benefitCard: {
    flex: 1,
    backgroundColor: '#121226',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
  },
  benefitIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  benefitTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  benefitDesc: {
    color: '#9CA3AF',
    fontSize: 11,
    lineHeight: 15,
  },
  singleBenefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 16,
    padding: 14,
    width: '100%',
    marginBottom: 24,
  },
  singleBenefitTitle: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  singleBenefitDesc: {
    color: '#D1D5DB',
    fontSize: 11,
    lineHeight: 15,
  },
  emptyActionsCol: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#9900F0',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowColor: '#9900F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16162E',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  secondaryBtnText: {
    color: '#C4B5FD',
    fontSize: 14,
    fontWeight: '700',
  },
  authEmptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  heroIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(249, 0, 191, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  authTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  authSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 290,
  },
});
