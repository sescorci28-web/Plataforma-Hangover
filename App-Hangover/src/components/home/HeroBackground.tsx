import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Animated } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';

interface HeroBackgroundProps {
  videoSource?: string;
  fallbackImageUri?: string;
  children?: React.ReactNode;
}

const DEFAULT_NIGHTLIFE_VIDEO = 'https://assets.mixkit.co/videos/preview/mixkit-crowd-of-people-dancing-at-a-concert-40960-large.mp4';
const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1800&q=80';

export const HeroBackground: React.FC<HeroBackgroundProps> = ({
  videoSource = DEFAULT_NIGHTLIFE_VIDEO,
  fallbackImageUri = DEFAULT_FALLBACK_IMAGE,
  children,
}) => {
  const [fadeAnim] = useState(() => new Animated.Value(0));

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    const subscription = player.addListener('statusChange', (payload) => {
      if (payload.status === 'readyToPlay') {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player, fadeAnim]);

  return (
    <View style={styles.container}>
      {/* 1. IMAGEN DE FALLBACK DE CARGA INMEDIATA (EVITA PANTALLAS NEGRAS) */}
      <Image
        source={{ uri: fallbackImageUri }}
        style={styles.fallbackImage}
        resizeMode="cover"
      />

      {/* 2. VIDEO CINEMATOGRÁFICO CON FADE-IN SUAVE AL ESTAR LISTO */}
      <Animated.View style={[styles.videoWrapper, { opacity: fadeAnim }]}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
        />
      </Animated.View>

      {/* 3. CAPAS DE OVERLAY CINEMATOGRÁFICO DENSAS PARA MANTENER 100% LEGIBILIDAD */}
      <View style={styles.darkTintOverlay} />
      <View style={styles.purpleTintOverlay} />

      <LinearGradient
        colors={[
          'rgba(2, 2, 5, 0.75)',
          'rgba(2, 2, 5, 0.4)',
          'rgba(2, 2, 5, 0.85)',
          '#020205',
        ]}
        locations={[0, 0.35, 0.75, 1]}
        style={styles.gradientOverlay}
      />

      {/* CONTENIDO SUPERPUESTO */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#020205',
    overflow: 'hidden',
  },
  fallbackImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  videoWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  darkTintOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(2, 2, 5, 0.55)',
  },
  purpleTintOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(129, 140, 248, 0.06)',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
