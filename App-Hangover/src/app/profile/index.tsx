import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogIn, AlertCircle, RefreshCw } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { authService, UserProfile } from '@/services/auth.service';
import { ticketService, UserBookingTicket } from '@/services/ticket.service';
import { BottomNav } from '@/components/layout/BottomNav';
import { showAlert } from '@/utils/alert';

import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileTabsNav, ProfileTabType } from '@/components/profile/ProfileTabsNav';
import { UserQRModal } from '@/components/profile/UserQRModal';
import { SettingsModal } from '@/components/profile/SettingsModal';
import { UserTicketsModal } from '@/components/profile/UserTicketsModal';
import { CreateMomentModal } from '@/components/profile/CreateMomentModal';
import { MomentViewerModal } from '@/components/profile/MomentViewerModal';
import { momentsService, UserMoment } from '@/services/moments.service';

/**
 * Calcula las iniciales del nombre completo (ej: "Sergio Corcho" -> "SC")
 */
function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Formatea una fecha YYYY-MM-DD o ISO a formato legible DD/MM/AAAA.
 */
function formatDate(dateString?: string | null): string {
  if (!dateString) return 'No registrada';
  try {
    const cleanDate = dateString.split('T')[0];
    const [year, month, day] = cleanDate.split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    return dateString;
  } catch {
    return dateString;
  }
}

export default function ProfileScreen() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estado del Tab activo
  const [activeTab, setActiveTab] = useState<ProfileTabType>('momentos');

  // Estado del Modal de QR y entrada seleccionada desde public.bookings
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedTicketForQR, setSelectedTicketForQR] = useState<UserBookingTicket | null>(null);

  // Estado del Modal de Configuración
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  // Estado del Modal de Entradas (Mis Entradas)
  const [ticketsModalVisible, setTicketsModalVisible] = useState(false);

  // Estado de Entradas Reales
  const [tickets, setTickets] = useState<UserBookingTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setTicketsLoading(true);
    setTicketsError(null);
    const { tickets: fetchedTickets, error: tErr } = await ticketService.getMyTickets();
    if (tErr) {
      setTicketsError(tErr);
    } else {
      setTickets(fetchedTickets);
    }
    setTicketsLoading(false);
  }, []);

  // Estado de Momentos (Fotos y Vídeos)
  const [moments, setMoments] = useState<UserMoment[]>([]);
  const [createMomentModalVisible, setCreateMomentModalVisible] = useState(false);
  const [selectedMomentForViewer, setSelectedMomentForViewer] = useState<UserMoment | null>(null);

  const fetchMoments = useCallback(async (uId: string) => {
    const fetchedMoments = await momentsService.getMoments(uId);
    setMoments(fetchedMoments);
  }, []);

  const handleCreateMoment = async (type: 'image' | 'video', uri: string, caption?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showAlert('Sesión requerida', 'Debes iniciar sesión para publicar un momento.');
      return;
    }
    const newMoment = await momentsService.addMoment(user.id, { type, uri, caption });
    setMoments((prev) => [newMoment, ...prev]);
    showAlert('Momento publicado', 'Tu momento ha sido publicado exitosamente en Mis momentos.');
  };

  const handleDeleteMoment = async (momentId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const updated = await momentsService.deleteMoment(user.id, momentId);
    setMoments(updated);
  };

  const loadUserData = useCallback(async () => {
    setErrorMessage(null);
    try {
      // 1. Obtener usuario autenticado directamente desde Supabase Auth
      const { data: { user }, error: authUserError } = await supabase.auth.getUser();

      if (authUserError || !user) {
        setProfile(null);
        setEmail(null);
        setTickets([]);
        setMoments([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setEmail(user.email || null);

      // 2. Obtener los datos del perfil desde public.profiles
      const { profile: userProfile, error: profileErr } = await authService.getCurrentProfile(user.id);

      if (profileErr) {
        setErrorMessage(profileErr);
      } else {
        setProfile(userProfile);
      }

      // 3. Obtener entradas reales del usuario desde public.bookings
      await fetchTickets();

      // 4. Obtener momentos (fotos y vídeos) del usuario
      await fetchMoments(user.id);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al obtener los datos del perfil.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchTickets, fetchMoments]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  const handleOpenTicketQR = (ticket: UserBookingTicket) => {
    setSelectedTicketForQR(ticket);
    setQrModalVisible(true);
  };

  const handleOpenGeneralQR = () => {
    setSelectedTicketForQR(null);
    setQrModalVisible(true);
  };

  const handleOpenTicketsTab = () => {
    setTicketsModalVisible(true);
  };

  const handleSignOut = async () => {
    showAlert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas salir de tu cuenta de Hangover?',
      async () => {
        setLoading(true);
        await authService.signOut();
        setProfile(null);
        setEmail(null);
        setTickets([]);
        setLoading(false);
        router.replace('/login');
      }
    );
  };

  const handleShareProfile = async () => {
    const userHandle = profile?.username ? `@${profile.username}` : 'Usuario';
    try {
      await Share.share({
        message: `¡Mira mi perfil en Hangover! Sigue mis noches y eventos con ${userHandle}. Descarga la app de Hangover.`,
      });
    } catch (err) {
      // Ignorar error de cancelación de compartir
    }
  };

  const handleShowToast = (title: string, message: string) => {
    showAlert(title, message);
  };

  // 1. ESTADO DE CARGA INITIAL
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#9900F0" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
        <BottomNav />
      </SafeAreaView>
    );
  }

  // 2. ESTADO USUARIO NO AUTENTICADO
  if (!profile && !email && !loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.centerContainer}>
          <View style={styles.authBannerBox}>
            <View style={styles.iconCircleWarning}>
              <LogIn size={28} color="#FF85B3" />
            </View>
            <Text style={styles.authBannerTitle}>Acceso a Tu Perfil</Text>
            <Text style={styles.authBannerSubtitle}>
              Inicia sesión con tu cuenta de usuario para explorar tus experiencias en Hangover.
            </Text>
            <TouchableOpacity
              style={styles.primaryAuthButton}
              activeOpacity={0.8}
              onPress={() => router.push('/login')}
            >
              <LogIn size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryAuthButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
        <BottomNav />
      </SafeAreaView>
    );
  }

  // PREPARACIÓN DE DATOS REALES (SIN MOCK DATA)
  const fullName = profile?.full_name?.trim() || 'Usuario Hangover';
  const username = profile?.username?.trim() ? `@${profile.username.trim()}` : '@usuario';
  const userInitials = getInitials(profile?.full_name);
  const displayAvatarUrl = profile?.avatar_url?.trim() || null;
  const formattedBirthDate = formatDate(profile?.birth_date);
  
  // Cálculo de entradas próximas reales desde bookings
  const activeTicketsCount = tickets.filter(t => {
    const isUsed = t.qr_status === 'used' || t.status === 'COMPLETED' || t.status === 'completed';
    const isCancelled = t.qr_status === 'cancelled' || t.status === 'CANCELLED' || t.status === 'cancelled' || t.status === 'REJECTED';
    return !isUsed && !isCancelled;
  }).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#9900F0"
            colors={['#9900F0', '#F900BF']}
          />
        }
      >
        {/* BANNER DE ERROR SI OCURRE ALGUN FALLO DE PERFIL */}
        {errorMessage && (
          <View style={styles.errorBanner}>
            <AlertCircle size={20} color="#ef4444" style={{ marginRight: 10 }} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
            <TouchableOpacity onPress={loadUserData} style={styles.retryButton}>
              <RefreshCw size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}

        {/* A. CABECERA PORTADA Y DATOS DE USUARIO */}
        <ProfileHeader
          fullName={fullName}
          username={username}
          avatarUrl={displayAvatarUrl}
          initials={userInitials}
          city={profile?.city}
          country={profile?.country}
          bio={profile?.bio}
          instagram={profile?.instagram}
          tiktok={profile?.tiktok}
          twitter={profile?.twitter}
          onOpenQR={handleOpenGeneralQR}
          onShare={handleShareProfile}
          onEditPress={() => router.push('/edit-profile')}
          onSettingsPress={() => setSettingsModalVisible(true)}
          isOwnProfile={true}
        />

        {/* B. NAVEGACIÓN DE TABS PROPIA DE HANGOVER CON ENTRADAS Y MOMENTOS REALES */}
        <ProfileTabsNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onCreateMoment={() => setCreateMomentModalVisible(true)}
          moments={moments}
          onSelectMoment={(m) => setSelectedMomentForViewer(m)}
          tickets={tickets}
          ticketsLoading={ticketsLoading}
          ticketsError={ticketsError}
          onRetryTickets={fetchTickets}
          onSelectTicketQR={handleOpenTicketQR}
          activeTicketsCount={activeTicketsCount}
          onShowToast={handleShowToast}
          onOpenTickets={handleOpenTicketsTab}
        />
      </ScrollView>

      {/* MODAL CREAR MOMENTO (SUBIR FOTOS Y VÍDEOS) */}
      <CreateMomentModal
        visible={createMomentModalVisible}
        onClose={() => setCreateMomentModalVisible(false)}
        onSubmitMoment={handleCreateMoment}
      />

      {/* MODAL VISUALIZADOR DE MOMENTOS A PANTALLA COMPLETA */}
      <MomentViewerModal
        visible={!!selectedMomentForViewer}
        moment={selectedMomentForViewer}
        onClose={() => setSelectedMomentForViewer(null)}
        onDeleteMoment={handleDeleteMoment}
      />

      {/* MODAL LISTADO DE ENTRADAS Y FILTROS (MIS ENTRADAS) */}
      <UserTicketsModal
        visible={ticketsModalVisible}
        onClose={() => setTicketsModalVisible(false)}
        tickets={tickets}
        loading={ticketsLoading}
        error={ticketsError}
        onRetry={fetchTickets}
        onSelectTicketQR={handleOpenTicketQR}
      />

      {/* MODAL CÓDIGO QR REAL DESDE PUBLIC.BOOKINGS */}
      <UserQRModal
        visible={qrModalVisible}
        fullName={fullName}
        username={username}
        qrCode={selectedTicketForQR ? (selectedTicketForQR.qr_code || selectedTicketForQR.id) : null}
        eventName={selectedTicketForQR ? (selectedTicketForQR.event?.title || selectedTicketForQR.event_name || 'Entrada Hangover') : null}
        clubName={selectedTicketForQR ? (selectedTicketForQR.club?.name || selectedTicketForQR.event?.club?.name || null) : null}
        ticketType={selectedTicketForQR ? (selectedTicketForQR.ticket_batch?.name || 'Entrada General') : null}
        status={selectedTicketForQR ? (selectedTicketForQR.qr_status || selectedTicketForQR.status) : null}
        onClose={() => {
          setQrModalVisible(false);
          setSelectedTicketForQR(null);
        }}
      />

      {/* MODAL AJUSTES Y CONFIGURACIÓN */}
      <SettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        email={email}
        phone={profile?.phone}
        gender={profile?.gender}
        birthDate={formattedBirthDate}
        onSignOut={handleSignOut}
        onShowToast={handleShowToast}
      />

      {/* BARRA INFERIOR DE NAVEGACIÓN */}
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#05020E',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 110,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 14,
    fontWeight: '600',
  },
  authBannerBox: {
    width: '100%',
    backgroundColor: '#0F0921',
    borderColor: 'rgba(153, 0, 240, 0.3)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  iconCircleWarning: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(249, 0, 191, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(249, 0, 191, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  authBannerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  authBannerSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  primaryAuthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    paddingHorizontal: 24,
    backgroundColor: '#9900F0',
    borderRadius: 16,
    width: '100%',
  },
  primaryAuthButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 20,
    marginTop: 10,
  },
  errorBannerText: {
    flex: 1,
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  retryButton: {
    padding: 6,
  },
});
