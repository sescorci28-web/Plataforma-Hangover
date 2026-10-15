import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Megaphone, Gift, Flame, ShieldAlert, Video, Clock, Eye } from 'lucide-react-native';

import { EventUpdate, UpdateType } from '@/data/mockEventUpdates';
import { UpdateReactions } from './UpdateReactions';

interface EventUpdateCardProps {
  update: EventUpdate;
  isLiked: boolean;
  onPress: () => void;
  onToggleLike: () => void;
}

const renderTypeBadge = (type: UpdateType) => {
  switch (type) {
    case 'important':
      return (
        <View style={[styles.badge, styles.importantBadge]}>
          <ShieldAlert size={12} color="#ef4444" />
          <Text style={[styles.badgeText, { color: '#ef4444' }]}>IMPORTANTE</Text>
        </View>
      );
    case 'surprise':
      return (
        <View style={[styles.badge, styles.surpriseBadge]}>
          <Gift size={12} color="#ec4899" />
          <Text style={[styles.badgeText, { color: '#ec4899' }]}>SORPRESA</Text>
        </View>
      );
    case 'media':
      return (
        <View style={[styles.badge, styles.mediaBadge]}>
          <Video size={12} color="#a855f7" />
          <Text style={[styles.badgeText, { color: '#a855f7' }]}>MULTIMEDIA</Text>
        </View>
      );
    case 'update':
      return (
        <View style={[styles.badge, styles.updateBadge]}>
          <Flame size={12} color="#fbbf24" />
          <Text style={[styles.badgeText, { color: '#fbbf24' }]}>ACTUALIZACIÓN</Text>
        </View>
      );
    default:
      return (
        <View style={[styles.badge, styles.announcementBadge]}>
          <Megaphone size={12} color="#818cf8" />
          <Text style={[styles.badgeText, { color: '#818cf8' }]}>ANUNCIO</Text>
        </View>
      );
  }
};

export const EventUpdateCard: React.FC<EventUpdateCardProps> = ({
  update,
  isLiked,
  onPress,
  onToggleLike,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        update.isImportant && styles.importantCard,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* BADGE Y TIEMPO */}
      <View style={styles.cardHeader}>
        {renderTypeBadge(update.type)}
        <View style={styles.timeBox}>
          <Clock size={11} color="#71717a" />
          <Text style={styles.timeText}>{update.timeAgo}</Text>
        </View>
      </View>

      {/* TÍTULO Y CONTENIDO */}
      <Text style={styles.title}>{update.title}</Text>
      <Text style={styles.content} numberOfLines={3}>{update.content}</Text>

      {/* PREVISUALIZACIÓN MULTIMEDIA OPCIONAL */}
      {update.mediaUrl && (
        <View style={styles.mediaContainer}>
          <Image source={{ uri: update.mediaUrl }} style={styles.mediaImage} />
        </View>
      )}

      {/* PIE DE TARJETA: VISTAS Y REACCIÓN */}
      <View style={styles.footerRow}>
        <View style={styles.viewsBox}>
          <Eye size={12} color="#818cf8" />
          <Text style={styles.viewsText}>{update.views}</Text>
        </View>

        <UpdateReactions
          likes={update.likes}
          isLiked={isLiked}
          onToggleLike={onToggleLike}
          compact={true}
        />
      </View>

      {/* AUTOR */}
      <View style={styles.authorRow}>
        <View style={styles.authorDot} />
        <Text style={styles.authorText}>
          {update.authorName} <Text style={styles.authorRole}>({update.authorRole})</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  importantCard: {
    backgroundColor: 'rgba(239,68,68,0.04)',
    borderColor: 'rgba(239,68,68,0.3)',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    color: '#71717a',
    fontSize: 10,
  },

  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  content: {
    color: '#a1a1aa',
    fontSize: 13,
    lineHeight: 20,
  },

  mediaContainer: {
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  viewsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(129,140,248,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  viewsText: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: 'bold',
  },

  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  authorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#818cf8',
  },
  authorText: {
    color: '#d4d4d8',
    fontSize: 11,
    fontWeight: '600',
  },
  authorRole: {
    color: '#71717a',
    fontWeight: 'normal',
  },
});
