import React from 'react';
import { 
  Modal, View, Text, StyleSheet, TouchableOpacity, Image, 
  SafeAreaView, Dimensions, Share 
} from 'react-native';
import { X, Trash2, Share2, Sparkles, Film, Image as ImageIcon } from 'lucide-react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { UserMoment } from '@/services/moments.service';
import { showAlert } from '@/utils/alert';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MomentViewerModalProps {
  visible: boolean;
  moment: UserMoment | null;
  onClose: () => void;
  onDeleteMoment?: (momentId: string) => void;
}

function VideoPlayerItem({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.play();
  });

  return (
    <VideoView
      style={styles.fullMedia}
      player={player}
      allowsPictureInPicture={true}
      nativeControls={true}
    />
  );
}

export function MomentViewerModal({
  visible,
  moment,
  onClose,
  onDeleteMoment,
}: MomentViewerModalProps) {
  if (!moment) return null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: moment.caption 
          ? `✨ Momento en Hangover: "${moment.caption}"`
          : '✨ ¡Mira este momento en la app de Hangover!',
      });
    } catch (err) {
      // Ignorar cancelación
    }
  };

  const handleDelete = () => {
    showAlert(
      'Eliminar momento',
      '¿Estás seguro de que deseas eliminar este momento?',
      () => {
        if (onDeleteMoment) {
          onDeleteMoment(moment.id);
        }
        onClose();
      }
    );
  };

  const formattedDate = new Date(moment.createdAt).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* BARRA SUPERIOR DE CONTROLES */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconCircleBtn} onPress={onClose} activeOpacity={0.8}>
            <X size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.typeBadge}>
            {moment.type === 'image' ? (
              <ImageIcon size={14} color="#FF85B3" style={{ marginRight: 4 }} />
            ) : (
              <Film size={14} color="#A855F7" style={{ marginRight: 4 }} />
            )}
            <Text style={styles.typeBadgeText}>
              {moment.type === 'image' ? 'Foto' : 'Vídeo'}
            </Text>
          </View>

          <View style={styles.rightActionsRow}>
            <TouchableOpacity style={styles.iconCircleBtn} onPress={handleShare} activeOpacity={0.8}>
              <Share2 size={18} color="#FFFFFF" />
            </TouchableOpacity>

            {moment.isCustom && onDeleteMoment && (
              <TouchableOpacity style={styles.deleteCircleBtn} onPress={handleDelete} activeOpacity={0.8}>
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* VISUALIZADOR PRINCIPAL (FOTO O VÍDEO) */}
        <View style={styles.mediaContainer}>
          {moment.type === 'image' ? (
            <Image
              source={{ uri: moment.uri }}
              style={styles.fullMedia}
              resizeMode="contain"
            />
          ) : (
            <VideoPlayerItem uri={moment.uri} />
          )}
        </View>

        {/* PIE DE PÁGINA (DESCRIPCIÓN Y FECHA) */}
        <View style={styles.bottomOverlay}>
          {moment.caption ? (
            <Text style={styles.captionText}>{moment.caption}</Text>
          ) : (
            <View style={styles.brandRow}>
              <Sparkles size={14} color="#F900BF" style={{ marginRight: 6 }} />
              <Text style={styles.brandText}>Hangover Moment</Text>
            </View>
          )}

          <Text style={styles.dateText}>Publicado el {formattedDate}</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05020E',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    zIndex: 20,
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 9, 33, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 9, 33, 0.8)',
    borderColor: 'rgba(153, 0, 240, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mediaContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  fullMedia: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  bottomOverlay: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'rgba(5, 2, 14, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(153, 0, 240, 0.2)',
    gap: 6,
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    color: '#FF85B3',
    fontSize: 13,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#94a3b8',
    fontSize: 12,
  },
});
