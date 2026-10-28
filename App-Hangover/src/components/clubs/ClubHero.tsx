import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Share,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Share2,
  MapPin,
  Star,
  Heart,
} from 'lucide-react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ClubDetail } from '@/types/club.types';
import { ClubTheme } from '@/constants/clubTheme';
import { clubService } from '@/services/club.service';

interface ClubHeroProps {
  club: ClubDetail;
  onBack: () => void;
  onSelectTab: (tab: 'info' | 'menu' | 'events' | 'community' | 'bookings') => void;
  onBookCover?: () => void;
  isAuthenticated?: boolean;
  isFollowing?: boolean;
  onToggleFollow?: () => void;
  onOpenReviews?: () => void;
}

export const ClubHero: React.FC<ClubHeroProps> = ({
  club,
  onBack,
  onSelectTab,
  onBookCover,
  isAuthenticated = false,
  isFollowing: initialIsFollowing = false,
  onToggleFollow,
  onOpenReviews,
}) => {
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  const hasVideo = Boolean(club.video_hero);
  const player = useVideoPlayer(club.video_hero || '', (p) => {
    p.loop = true;
    p.muted = true;
    if (club.video_hero) {
      p.play();
    }
  });

  useEffect(() => {
    if (!hasVideo) return;
    const subscription = player.addListener('statusChange', (payload) => {
      if (payload.status === 'readyToPlay') {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player, fadeAnim, hasVideo]);

  const handleShare = async () => {
    try {
      const shareUrl = `https://plataforma-hangover.vercel.app/discotecas/${club.slug || club.id}`;
      await Share.share({
        title: club.name,
        message: `Te invito a conocer ${club.name} en Hangover: ${shareUrl}`,
        url: shareUrl,
      });
    } catch {
      // Ignorar cancelación del usuario
    }
  };

  const handleFollowPress = async () => {
    if (onToggleFollow) {
      onToggleFollow();
      return;
    }

    if (!isAuthenticated) {
      Alert.alert(
        'Iniciar sesión',
        'Inicia sesión con tu cuenta para seguir a tus discotecas favoritas y recibir avisos de sus eventos.',
        [{ text: 'Entendido', style: 'cancel' }]
      );
      return;
    }

    const previousState = isFollowing;
    const nextState = !previousState;
    // Respuesta optimista inmediata
    setIsFollowing(nextState);
    setFollowLoading(true);

    try {
      const res = await clubService.toggleFollowClub(club.id, previousState);
      if (!res.success) {
        setIsFollowing(previousState);
        Alert.alert('No se pudo actualizar', res.error || 'Ocurrió un error al guardar tu preferencia.');
      }
    } catch (err: any) {
      setIsFollowing(previousState);
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. FOTOGRAFÍA / VIDEO CINEMATOGRÁFICO */}
      <View style={styles.mediaContainer}>
        <Image
          source={{ uri: club.imageUrl }}
          style={styles.heroMedia}
          resizeMode="cover"
        />

        {hasVideo && (
          <Animated.View style={[styles.videoWrapper, { opacity: fadeAnim }]}>
            <VideoView
              player={player}
              style={styles.heroMedia}
              contentFit="cover"
              nativeControls={false}
            />
          </Animated.View>
        )}

        {/* Gradiente oscuro inferior para legibilidad limpia */}
        <LinearGradient
          colors={['rgba(4, 4, 7, 0.4)', 'transparent', '#040407']}
          locations={[0, 0.4, 1]}
          style={styles.gradientOverlay}
        />

        {/* Barra superior con botón de regreso */}
        <View style={styles.floatingTopBar}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.circleIconButton}
            activeOpacity={0.8}
            accessibilityLabel="Volver al catálogo"
          >
            <ArrowLeft size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. INFORMACIÓN ESENCIAL DE LA DISCOTECA */}
      <View style={styles.content}>
        {/* Fila de metadatos sutiles: Ciudad y Estado de apertura */}
        <View style={styles.metaRow}>
          <View style={styles.locationPill}>
            <MapPin size={13} color={ClubTheme.colors.accent} />
            <Text style={styles.locationText}>{club.city}</Text>
          </View>

          <View style={[styles.statusDot, club.isOpen ? styles.statusDotOpen : styles.statusDotClosed]} />
          <Text style={[styles.statusText, club.isOpen ? styles.statusTextOpen : styles.statusTextClosed]}>
            {club.isOpen ? 'Abierto ahora' : 'Cerrado ahora'}
          </Text>
        </View>

        {/* Nombre de la discoteca */}
        <Text style={styles.title} numberOfLines={2}>
          {club.name}
        </Text>

        {/* 3. NUEVA FILA DE ACCIONES COMPACTAS: SEGUIR, CALIFICACIÓN Y COMPARTIR */}
        <View style={styles.actionsRow}>
          {/* ACCIÓN 1: SEGUIR / SIGUIENDO */}
          <TouchableOpacity
            style={[
              styles.compactActionButton,
              isFollowing && styles.compactActionButtonFollowing,
            ]}
            onPress={handleFollowPress}
            activeOpacity={0.75}
            disabled={followLoading}
            accessibilityLabel={isFollowing ? 'Dejar de seguir discoteca' : 'Seguir discoteca'}
          >
            <Heart
              size={15}
              color={isFollowing ? '#ec4899' : '#ffffff'}
              fill={isFollowing ? '#ec4899' : 'transparent'}
            />
            <Text
              style={[
                styles.compactActionText,
                isFollowing && styles.compactActionTextFollowing,
              ]}
            >
              {isFollowing ? 'Siguiendo' : 'Seguir'}
            </Text>
          </TouchableOpacity>

          {/* ACCIÓN 2: CALIFICACIÓN */}
          <TouchableOpacity
            style={styles.compactActionButton}
            onPress={onOpenReviews}
            activeOpacity={0.75}
            accessibilityLabel="Ver calificaciones y opiniones"
          >
            <Star size={15} color="#fbbf24" fill="#fbbf24" />
            <Text style={styles.compactActionText}>
              {club.rating > 0 ? club.rating.toFixed(1) : 'Calificación'}
              {club.reviews_count > 0 ? ` (${club.reviews_count})` : ''}
            </Text>
          </TouchableOpacity>

          {/* ACCIÓN 3: COMPARTIR */}
          <TouchableOpacity
            style={styles.compactActionButton}
            onPress={handleShare}
            activeOpacity={0.75}
            accessibilityLabel="Compartir discoteca"
          >
            <Share2 size={15} color="#ffffff" />
            <Text style={styles.compactActionText}>Compartir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: ClubTheme.colors.bg,
  },
  mediaContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
    backgroundColor: '#09090f',
  },
  heroMedia: {
    width: '100%',
    height: '100%',
  },
  videoWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingTopBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  circleIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(4, 4, 7, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotOpen: {
    backgroundColor: ClubTheme.colors.success,
  },
  statusDotClosed: {
    backgroundColor: ClubTheme.colors.textMuted,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextOpen: {
    color: ClubTheme.colors.success,
  },
  statusTextClosed: {
    color: ClubTheme.colors.textMuted,
  },
  title: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  compactActionButton: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 6,
  },
  compactActionButtonFollowing: {
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    borderColor: 'rgba(236, 72, 153, 0.28)',
  },
  compactActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  compactActionTextFollowing: {
    color: '#f472b6',
    fontWeight: '800',
  },
});

