import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Share, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User as UserIcon, RefreshCw, AlertCircle } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { authService, UserProfile } from '@/services/auth.service';
import { momentsService, UserMoment } from '@/services/moments.service';
import { BottomNav } from '@/components/layout/BottomNav';
import { showAlert } from '@/utils/alert';

import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileTabsNav, ProfileTabType } from '@/components/profile/ProfileTabsNav';
import { MomentViewerModal } from '@/components/profile/MomentViewerModal';

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

export default function UserPublicProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const targetId = Array.isArray(id) ? id[0] : id;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notFoundState, setNotFoundState] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTabType>('momentos');

  const [moments, setMoments] = useState<UserMoment[]>([]);
  const [selectedMomentForViewer, setSelectedMomentForViewer] = useState<UserMoment | null>(null);

  const loadProfileData = useCallback(async () => {
    // C. Al abrir el perfil
    console.log('PROFILE ROUTE PARAM:', {
      'id recibido': targetId || null,
    });

    if (!targetId) {
      setNotFoundState(true);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setErrorMessage(null);

    try {
      // 1. Obtener usuario autenticado actual para ver si es su propio perfil
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        if (user.id === targetId) {
          router.replace('/profile' as any);
          return;
        }
      }

      const activeUserId = user?.id || null;
      console.log('PROFILE PUBLIC DEBUG:', {
        targetId: targetId || null,
        currentUserId: activeUserId,
        isOwnProfile: activeUserId === targetId,
      });

      // D. Antes de consultar Supabase
      console.log('PROFILE QUERY:', {
        'id utilizado': targetId,
      });

      // 2. Consulta segura a public.profiles con columnas públicas existentes únicamente
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, city, country, role, provider_type, bio, social_instagram, social_tiktok')
        .eq('id', targetId)
        .maybeSingle();

      // E. Después de Supabase
      console.log('PROFILE QUERY RESULT:', {
        'error.message': error?.message || null,
        'error.code': error?.code || null,
        'si data existe': !!data,
        'id del perfil recibido': data?.id || null,
      });

      console.log('PUBLIC AVATAR DEBUG:', {
        targetId: targetId || null,
        full_name: data?.full_name || null,
        avatar_url: data?.avatar_url || null,
      });

      console.log('PROFILE BIO DEBUG:', {
        id: data?.id,
        full_name: data?.full_name,
        bio: data?.bio ?? null,
      });

      console.log('PROFILE DATA DEBUG:', {
        id: data?.id || null,
        full_name: data?.full_name || null,
        username: data?.username || null,
        bio: data?.bio || null,
        avatar_url: data?.avatar_url || null,
        city: data?.city || null,
        country: data?.country || null,
      });

      if (error || !data) {
        setProfile(null);
        setNotFoundState(true);
      } else {
        const formattedProfile = {
          ...data,
          onboarding_completed: true,
          phone: null,
          instagram: data.social_instagram || null,
          tiktok: data.social_tiktok || null,
          twitter: null,
        } as UserProfile;
        setProfile(formattedProfile);
        setNotFoundState(false);

        // 3. Cargar momentos públicos del usuario usando su targetId UUID real
        const fetchedMoments = await momentsService.getMoments(targetId);
        console.log('PROFILE MOMENTS DEBUG:', {
          targetId,
          currentUserId: activeUserId,
          count: fetchedMoments.length,
          error: null,
        });
        setMoments(fetchedMoments);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al cargar el perfil.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [targetId, router]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfileData();
  };

  const toggleFollow = () => {
    setIsFollowing(!isFollowing);
    const userName = profile?.full_name || (profile?.username ? `@${profile.username}` : 'este usuario');
    showAlert(
      !isFollowing ? '¡Siguiendo!' : 'Dejaste de seguir',
      !isFollowing 
        ? `Ahora sigues a ${userName} en Hangover.` 
        : `Ya no sigues a ${userName}`
    );
  };

  const handleShareProfile = async () => {
    const userHandle = profile?.username ? `@${profile.username}` : (profile?.full_name || 'Usuario');
    try {
      await Share.share({
        message: `¡Mira el perfil de ${userHandle} en Hangover! Conéctate y vive la mejor vida nocturna.`,
      });
    } catch (err) {
      // Ignorar cancelación
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

  // 2. ESTADO SI PERFIL NO EXISTE
  if (notFoundState || !profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.centerContainer}>
          <UserIcon size={56} color="#64748b" style={{ marginBottom: 16 }} />
          <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '900', marginBottom: 8, textAlign: 'center' }}>
            Perfil no encontrado
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 20 }}>
            El usuario seleccionado no existe o no se encuentra disponible en Hangover.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#9900F0', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 }}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>Volver atrás</Text>
          </TouchableOpacity>
        </View>
        <BottomNav />
      </SafeAreaView>
    );
  }

  const fullName = profile.full_name?.trim() || 'Usuario Hangover';
  const username = profile.username?.trim() ? `@${profile.username.trim()}` : '@usuario';
  const userInitials = getInitials(profile.full_name);
  const displayAvatarUrl = profile.avatar_url?.trim() || null;

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
        {errorMessage && (
          <View style={styles.errorBanner}>
            <AlertCircle size={20} color="#ef4444" style={{ marginRight: 10 }} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
            <TouchableOpacity onPress={loadProfileData} style={styles.retryButton}>
              <RefreshCw size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}

        {/* CABECERA CON MISMA INTERFAZ VISUAL (MODO PERFIL PÚBLICO) */}
        <ProfileHeader
          fullName={fullName}
          username={username}
          avatarUrl={displayAvatarUrl}
          initials={userInitials}
          city={profile.city}
          country={profile.country}
          bio={profile.bio}
          instagram={profile.instagram}
          tiktok={profile.tiktok}
          twitter={profile.twitter}
          onShare={handleShareProfile}
          isOwnProfile={false}
          isFollowing={isFollowing}
          onToggleFollow={toggleFollow}
        />

        {/* PESTAÑAS DEL PERFIL CON MOMENTOS */}
        <ProfileTabsNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          moments={moments}
          onSelectMoment={(m) => setSelectedMomentForViewer(m)}
          tickets={[]}
          ticketsLoading={false}
          ticketsError={null}
          activeTicketsCount={0}
          onShowToast={handleShowToast}
          isOwnProfile={false}
        />
      </ScrollView>

      {/* VISUALIZADOR DE MOMENTOS A PANTALLA COMPLETA */}
      <MomentViewerModal
        visible={!!selectedMomentForViewer}
        moment={selectedMomentForViewer}
        onClose={() => setSelectedMomentForViewer(null)}
      />

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
