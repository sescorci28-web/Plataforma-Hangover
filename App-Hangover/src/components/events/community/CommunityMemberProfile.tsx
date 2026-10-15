import React from 'react';
import { 
  View, Text, StyleSheet, Modal, Image, ScrollView, 
  TouchableOpacity 

} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Music, Calendar, Users, ShieldCheck } from 'lucide-react-native';

import { CommunityMember } from '@/data/mockEventCommunity';
import { ConnectionButton } from './ConnectionButton';

interface CommunityMemberProfileProps {
  visible: boolean;
  member: CommunityMember | null;
  onClose: () => void;
  onSendRequest: () => void;
  onCancelRequest: () => void;
  onAcceptRequest: () => void;
  onIgnoreRequest: () => void;
  onRemoveConnection: () => void;
}

export const CommunityMemberProfile: React.FC<CommunityMemberProfileProps> = ({
  visible,
  member,
  onClose,
  onSendRequest,
  onCancelRequest,
  onAcceptRequest,
  onIgnoreRequest,
  onRemoveConnection,
}) => {
  if (!visible || !member) return null;

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
          {/* HEADER CON BOTÓN DE CIERRE */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Perfil del Asistente</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* HEROPROFILE / AVATAR CON ESTADO DE PRESENCIA */}
            <View style={styles.heroBox}>
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: member.avatarUrl }} style={styles.avatar} />
                {member.presenceStatus === 'checked_in' && (
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveBadgeText}>PRESENTE EN EL EVENTO</Text>
                  </View>
                )}
              </View>

              <Text style={styles.name}>{member.name}</Text>
              <Text style={styles.locationMeta}>
                {member.age ? `${member.age} años · ` : ''}{member.city}
              </Text>

              {/* BOTÓN CONECTAR CON NUEVA MÁQUINA DE ESTADOS */}
              <View style={styles.actionRow}>
                <ConnectionButton
                  status={member.connectionStatus}
                  memberName={member.name}
                  onSendRequest={onSendRequest}
                  onCancelRequest={onCancelRequest}
                  onAcceptRequest={onAcceptRequest}
                  onIgnoreRequest={onIgnoreRequest}
                  onRemoveConnection={onRemoveConnection}
                  compact={false}
                />
              </View>
            </View>

            {/* BIOGRAFÍA */}
            <View style={styles.sectionCard}>
              <Text style={styles.cardTitle}>Sobre mí</Text>
              <Text style={styles.bioText}>"{member.bio}"</Text>
            </View>

            {/* INTERESES MUSICALES */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <Music size={16} color="#818cf8" />
                <Text style={styles.cardTitle}>Intereses Musicales</Text>
              </View>
              <View style={styles.tagsContainer}>
                {member.musicInterests.map((genre, idx) => (
                  <View key={idx} style={styles.genreTag}>
                    <Text style={styles.genreTagText}>🎵 {genre}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* EVENTOS ASISTIDOS */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <Calendar size={16} color="#ec4899" />
                <Text style={styles.cardTitle}>Eventos Recientes</Text>
              </View>
              <View style={styles.eventsList}>
                {member.pastEvents.map((ev, idx) => (
                  <View key={idx} style={styles.eventItem}>
                    <Text style={styles.eventDot}>•</Text>
                    <Text style={styles.eventName}>{ev}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* CONEXIONES EN COMÚN */}
            {member.mutualConnectionsCount > 0 && (
              <View style={styles.mutualCard}>
                <Users size={16} color="#818cf8" />
                <Text style={styles.mutualText}>
                  Tienen <Text style={{ color: '#fff', fontWeight: 'bold' }}>{member.mutualConnectionsCount}</Text> amigos o conexiones en común
                </Text>
              </View>
            )}

            {/* GARANTÍA DE PRIVACIDAD HANGOVER CONNECT */}
            <View style={styles.privacyCard}>
              <ShieldCheck size={16} color="#34d399" />
              <Text style={styles.privacyText}>
                Perfil verificado por presencia física en Hangover.
              </Text>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  heroBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#818cf8',
    backgroundColor: '#18181b',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: -12,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  liveBadgeText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  name: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  locationMeta: {
    color: '#71717a',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  actionRow: {
    width: '100%',
    maxWidth: 240,
  },

  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bioText: {
    color: '#d4d4d8',
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },

  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  genreTag: {
    backgroundColor: 'rgba(129,140,248,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.25)',
  },
  genreTagText: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '600',
  },

  eventsList: {
    gap: 6,
    marginTop: 6,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDot: {
    color: '#ec4899',
    fontSize: 14,
  },
  eventName: {
    color: '#d4d4d8',
    fontSize: 12,
  },

  mutualCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(129,140,248,0.08)',
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.2)',
  },
  mutualText: {
    color: '#a1a1aa',
    fontSize: 12,
    flex: 1,
  },

  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    marginTop: 10,
  },
  privacyText: {
    color: '#71717a',
    fontSize: 11,
  },
});
