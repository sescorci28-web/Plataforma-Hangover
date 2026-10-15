import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, Modal, Image, TouchableWithoutFeedback, 
  TouchableOpacity, Animated, Dimensions 

} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X, ChevronLeft, ChevronRight, Sparkles, Megaphone, Gift, Flame, Radio } from 'lucide-react-native';

import { EventStory, StoryType } from '@/data/mockEventUpdates';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 segundos por historia

interface EventStoryViewerProps {
  visible: boolean;
  stories: EventStory[];
  initialIndex: number;
  onClose: () => void;
}

export const EventStoryViewer: React.FC<EventStoryViewerProps> = ({
  visible,
  stories,
  initialIndex,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, visible]);

  useEffect(() => {
    if (!visible || stories.length === 0) return;

    progressAnim.setValue(0);
    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        handleNext();
      }
    });

    return () => animation.stop();
  }, [currentIndex, visible]);

  if (!visible || !stories || stories.length === 0) return null;

  const currentStory = stories[currentIndex] || stories[0];

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      progressAnim.setValue(0);
    }
  };

  const handleTapScreen = (evt: any) => {
    const touchX = evt.nativeEvent.locationX;
    if (touchX < SCREEN_WIDTH / 3) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  const getBadgeText = (type: StoryType) => {
    switch (type) {
      case 'surprise': return 'SORPRESA NEÓN';
      case 'lineup': return 'LINE-UP UPDATE';
      case 'promo': return 'BOLETA VIP';
      case 'announcement': return 'ANUNCIO OFICIAL';
      default: return 'NOVEDAD EN VIVO';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalContainer}>
        {/* MEDIA DE FONDO */}
        <Image source={{ uri: currentStory.mediaUrl }} style={styles.backgroundImage} />
        
        {/* OVERLAYS Y DEGRADADOS */}
        <LinearGradient
          colors={['rgba(2,2,5,0.75)', 'transparent', 'rgba(2,2,5,0.92)']}
          style={styles.gradientOverlay}
        >
          <SafeAreaView style={styles.safeArea}>
            
            {/* ── BARRAS DE PROGRESO ── */}
            <View style={styles.progressRow}>
              {stories.map((s, idx) => {
                let progressWidth: any = '0%';
                if (idx < currentIndex) {
                  progressWidth = '100%';
                } else if (idx === currentIndex) {
                  progressWidth = progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  });
                }
                return (
                  <View key={s.id} style={styles.progressTrack}>
                    <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                  </View>
                );
              })}
            </View>

            {/* ── HEADER DEL AUTOR & BOTÓN DE CIERRE ── */}
            <View style={styles.headerRow}>
              <View style={styles.authorBox}>
                {currentStory.authorAvatar ? (
                  <Image source={{ uri: currentStory.authorAvatar }} style={styles.authorAvatar} />
                ) : (
                  <View style={styles.authorAvatarFallback}>
                    <Text style={styles.authorInitial}>H</Text>
                  </View>
                )}
                <View>
                  <Text style={styles.authorName}>{currentStory.authorName || 'Hangover Events'}</Text>
                  <Text style={styles.storyTimeAgo}>{currentStory.timeAgo}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* ── ZONA TÁCTIL PARA NAVEGAR HISTORIAS (IZQ / DER) ── */}
            <TouchableWithoutFeedback onPress={handleTapScreen}>
              <View style={styles.touchArea}>
                {/* Indicadores sutiles laterales */}
                {currentIndex > 0 && (
                  <View style={[styles.arrowHint, { left: 12 }]}>
                    <ChevronLeft size={24} color="rgba(255,255,255,0.4)" />
                  </View>
                )}
                {currentIndex < stories.length - 1 && (
                  <View style={[styles.arrowHint, { right: 12 }]}>
                    <ChevronRight size={24} color="rgba(255,255,255,0.4)" />
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>

            {/* ── CARD INFERIOR DE CONTENIDO DE LA STORY ── */}
            <View style={styles.contentCard}>
              <View style={styles.badgeRow}>
                <Sparkles size={12} color="#818cf8" />
                <Text style={styles.badgeText}>{getBadgeText(currentStory.type)}</Text>
              </View>
              <Text style={styles.storyTitle}>{currentStory.title}</Text>
              <Text style={styles.storyContent}>{currentStory.content}</Text>
            </View>

          </SafeAreaView>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#020205',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    resizeMode: 'cover',
  },
  gradientOverlay: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },

  progressRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#818cf8',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  authorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#818cf8',
  },
  authorAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  authorName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  storyTimeAgo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  touchArea: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  arrowHint: {
    position: 'absolute',
    top: '45%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 6,
    borderRadius: 20,
  },

  contentCard: {
    backgroundColor: 'rgba(2,2,5,0.85)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(129,140,248,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.3)',
  },
  badgeText: {
    color: '#818cf8',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  storyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  storyContent: {
    color: '#d4d4d8',
    fontSize: 13,
    lineHeight: 20,
  },
});
