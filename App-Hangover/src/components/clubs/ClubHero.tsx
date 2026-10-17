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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Share2,
  MapPin,
  Star,
  Sparkles,
  CalendarDays,
  Ticket,
} from 'lucide-react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ClubDetail } from '@/types/club.types';
import { ClubTheme } from '@/constants/clubTheme';

interface ClubHeroProps {
  club: ClubDetail;
  onBack: () => void;
  onSelectTab: (tab: 'info' | 'menu' | 'events' | 'community' | 'bookings') => void;
  onBookCover?: () => void;
}

export const ClubHero: React.FC<ClubHeroProps> = ({
  club,
  onBack,
  onSelectTab,
  onBookCover,
}) => {
  const [fadeAnim] = useState(() => new Animated.Value(0));

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
      // Ignorar cancelación
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

        {/* Barra de navegación superior fija sobre la imagen */}
        <View style={styles.floatingTopBar}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.circleIconButton}
            activeOpacity={0.8}
            accessibilityLabel="Volver al catálogo"
          >
            <ArrowLeft size={20} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            style={styles.circleIconButton}
            activeOpacity={0.8}
            accessibilityLabel="Compartir discoteca"
          >
            <Share2 size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. INFORMACIÓN ESENCIAL DE LA DISCOTECA */}
      <View style={styles.content}>
        {/* Fila de metadatos sutiles: Ciudad, Estado de apertura y Rating real */}
        <View style={styles.metaRow}>
          <View style={styles.locationPill}>
            <MapPin size={13} color={ClubTheme.colors.accent} />
            <Text style={styles.locationText}>{club.city}</Text>
          </View>

          <View style={[styles.statusDot, club.isOpen ? styles.statusDotOpen : styles.statusDotClosed]} />
          <Text style={[styles.statusText, club.isOpen ? styles.statusTextOpen : styles.statusTextClosed]}>
            {club.isOpen ? 'Abierto hoy' : 'Cerrado ahora'}
          </Text>

          {club.hasRealRating && (
            <>
              <Text style={styles.bulletSeparator}>•</Text>
              <View style={styles.ratingRow}>
                <Star size={12} color="#fbbf24" fill="#fbbf24" />
                <Text style={styles.ratingText}>
                  {club.rating.toFixed(1)}
                  {club.reviews_count > 0 ? ` (${club.reviews_count})` : ''}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Nombre de la discoteca */}
        <Text style={styles.title} numberOfLines={2}>
          {club.name}
        </Text>

        {/* 3. ACCIONES PRINCIPALES JERARQUIZADAS */}
        <View style={styles.actionsRow}>
          {/* Botón Principal: Reservar Mesa */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => onSelectTab('bookings')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={ClubTheme.colors.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryGradient}
            >
              <CalendarDays size={18} color="#ffffff" />
              <Text style={styles.primaryButtonText}>Reservar Mesa</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Botón Secundario: Adquirir Cover si está disponible, o Ver Carta */}
          {club.cover_price > 0 && onBookCover ? (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onBookCover}
              activeOpacity={0.8}
            >
              <Ticket size={16} color={ClubTheme.colors.primary} />
              <View>
                <Text style={styles.secondaryButtonLabel}>Cover</Text>
                <Text style={styles.secondaryButtonValue}>
                  ${club.cover_price.toLocaleString('es-CO')}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => onSelectTab('menu')}
              activeOpacity={0.8}
            >
              <Sparkles size={16} color={ClubTheme.colors.accent} />
              <Text style={styles.secondarySimpleText}>Ver Carta</Text>
            </TouchableOpacity>
          )}
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
    gap: 8,
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
  bulletSeparator: {
    color: ClubTheme.colors.textMuted,
    fontSize: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '700',
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
    gap: 10,
    paddingTop: 6,
  },
  primaryButton: {
    flex: 1,
    height: ClubTheme.touchTarget.minHeight,
    borderRadius: ClubTheme.radii.md,
    overflow: 'hidden',
  },
  primaryGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  secondaryButton: {
    height: ClubTheme.touchTarget.minHeight,
    paddingHorizontal: 14,
    borderRadius: ClubTheme.radii.md,
    backgroundColor: ClubTheme.colors.surface,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonLabel: {
    color: ClubTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  secondaryButtonValue: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  secondarySimpleText: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
});
