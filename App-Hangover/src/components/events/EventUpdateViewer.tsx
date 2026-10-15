import React from 'react';
import { 
  View, Text, StyleSheet, Modal, Image, ScrollView, 
  TouchableOpacity 

} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, Clock, Megaphone, Gift, Flame, ShieldAlert, Video } from 'lucide-react-native';

import { EventUpdate, UpdateType } from '@/data/mockEventUpdates';
import { UpdateReactions } from './UpdateReactions';

interface EventUpdateViewerProps {
  visible: boolean;
  update: EventUpdate | null;
  isLiked: boolean;
  onClose: () => void;
  onToggleLike: () => void;
}

const renderTypeBadge = (type: UpdateType) => {
  switch (type) {
    case 'important':
      return (
        <View style={[styles.badge, styles.importantBadge]}>
          <ShieldAlert size={14} color="#ef4444" />
          <Text style={[styles.badgeText, { color: '#ef4444' }]}>IMPORTANTE</Text>
        </View>
      );
    case 'surprise':
      return (
        <View style={[styles.badge, styles.surpriseBadge]}>
          <Gift size={14} color="#ec4899" />
          <Text style={[styles.badgeText, { color: '#ec4899' }]}>SORPRESA</Text>
        </View>
      );
    case 'media':
      return (
        <View style={[styles.badge, styles.mediaBadge]}>
          <Video size={14} color="#a855f7" />
          <Text style={[styles.badgeText, { color: '#a855f7' }]}>MULTIMEDIA</Text>
        </View>
      );
    case 'update':
      return (
        <View style={[styles.badge, styles.updateBadge]}>
          <Flame size={14} color="#fbbf24" />
          <Text style={[styles.badgeText, { color: '#fbbf24' }]}>ACTUALIZACIÓN</Text>
        </View>
      );
    default:
      return (
        <View style={[styles.badge, styles.announcementBadge]}>
          <Megaphone size={14} color="#818cf8" />
          <Text style={[styles.badgeText, { color: '#818cf8' }]}>ANUNCIO</Text>
        </View>
      );
  }
};

export const EventUpdateViewer: React.FC<EventUpdateViewerProps> = ({
  visible,
  update,
  isLiked,
  onClose,
  onToggleLike,
}) => {
  if (!visible || !update) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          
          {/* HEADER CON BOTÓN DE REGRESO */}
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={onClose} activeOpacity={0.8}>
              <ArrowLeft size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Publicación del Evento</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* BADGE Y TIEMPO */}
            <View style={styles.metaRow}>
              {renderTypeBadge(update.type)}
              <View style={styles.timeBox}>
                <Clock size={12} color="#71717a" />
                <Text style={styles.timeText}>{update.timeAgo}</Text>
              </View>
            </View>

            {/* TÍTULO COMPLETO */}
            <Text style={styles.title}>{update.title}</Text>

            {/* BLOQUE DE AUTOR */}
            <View style={styles.authorBox}>
              {update.authorAvatar ? (
                <Image source={{ uri: update.authorAvatar }} style={styles.authorAvatar} />
              ) : (
                <View style={styles.authorAvatarFallback}>
                  <Text style={styles.authorInitial}>H</Text>
                </View>
              )}
              <View>
                <Text style={styles.authorName}>{update.authorName}</Text>
                <Text style={styles.authorRole}>{update.authorRole}</Text>
              </View>
            </View>

            {/* MULTIMEDIA A TAMAÑO COMPLETO */}
            {update.mediaUrl && (
              <View style={styles.mediaContainer}>
                <Image source={{ uri: update.mediaUrl }} style={styles.mediaImage} />
              </View>
            )}

            {/* CONTENIDO TEXTUAL DETALLADO */}
            <View style={styles.contentCard}>
              <Text style={styles.contentText}>{update.content}</Text>
            </View>

            {/* INDICADOR DE VISTAS DE SESIÓN */}
            <View style={styles.viewsBanner}>
              <Eye size={16} color="#818cf8" />
              <Text style={styles.viewsBannerText}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{update.views}</Text> personas han visto esta actualización
              </Text>
            </View>

            {/* REACCIÓN ÚNICA DE ME GUSTA */}
            <View style={styles.reactionsSection}>
              <Text style={styles.reactionsTitle}>REACCIONA A ESTA PUBLICACIÓN</Text>
              <View style={styles.reactionsWrapper}>
                <UpdateReactions
                  likes={update.likes}
                  isLiked={isLiked}
                  onToggleLike={onToggleLike}
                  compact={false}
                />
              </View>
            </View>

          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020205',
  },
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  importantBadge: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  surpriseBadge: {
    backgroundColor: 'rgba(236,72,153,0.12)',
    borderColor: 'rgba(236,72,153,0.3)',
  },
  mediaBadge: {
    backgroundColor: 'rgba(168,85,247,0.12)',
    borderColor: 'rgba(168,85,247,0.3)',
  },
  updateBadge: {
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderColor: 'rgba(251,191,36,0.3)',
  },
  announcementBadge: {
    backgroundColor: 'rgba(129,140,248,0.12)',
    borderColor: 'rgba(129,140,248,0.3)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    color: '#71717a',
    fontSize: 12,
  },

  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 16,
    lineHeight: 30,
  },

  authorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#818cf8',
  },
  authorAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  authorName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  authorRole: {
    color: '#818cf8',
    fontSize: 12,
    marginTop: 2,
  },

  mediaContainer: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  contentCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  contentText: {
    color: '#d4d4d8',
    fontSize: 15,
    lineHeight: 24,
  },

  viewsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(129,140,248,0.1)',
    padding: 14,
    borderRadius: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.2)',
  },
  viewsBannerText: {
    color: '#a1a1aa',
    fontSize: 13,
  },

  reactionsSection: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  reactionsTitle: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  reactionsWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
});
