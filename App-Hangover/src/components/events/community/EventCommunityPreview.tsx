import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Users, ChevronRight, Sparkles } from 'lucide-react-native';

import { 
  CommunityMember, EventCommunitySummary, 
  ConnectionStatus 

} from '@/data/mockEventCommunity';
import { CommunityMemberCard } from './CommunityMemberCard';
import { CommunityMemberProfile } from './CommunityMemberProfile';
import { CommunityEmptyState } from './CommunityEmptyState';

interface EventCommunityPreviewProps {
  community: EventCommunitySummary;
}

export const EventCommunityPreview: React.FC<EventCommunityPreviewProps> = ({
  community,
}) => {
  const router = useRouter();
  const [members, setMembers] = useState<CommunityMember[]>(community.members);
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);
  const [profileVisible, setProfileVisible] = useState(false);

  const handleUpdateConnection = (
    memberId: string, 
    action: 'send' | 'cancel' | 'accept' | 'ignore' | 'remove'
  ) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== memberId) return m;

        let nextStatus: ConnectionStatus = m.connectionStatus;
        if (action === 'send') nextStatus = 'pending_sent';
        else if (action === 'cancel') nextStatus = 'none';
        else if (action === 'accept') nextStatus = 'connected';
        else if (action === 'ignore') nextStatus = 'none';
        else if (action === 'remove') nextStatus = 'none';

        const updated = { ...m, connectionStatus: nextStatus };
        if (selectedMember && selectedMember.id === memberId) {
          setSelectedMember(updated);
        }
        return updated;
      })
    );
  };

  const previewMembers = members.slice(0, 4);

  return (
    <View style={styles.container}>
      {/* HEADER DE SECCIÓN */}
      <View style={styles.headerRow}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Users size={16} color="#818cf8" />
            <Text style={styles.sectionTitle}>Comunidad del Evento</Text>
          </View>
          <Text style={styles.subtitle}>Personas que están viviendo esta experiencia</Text>
        </View>

        <TouchableOpacity
          style={styles.seeAllButton}
          onPress={() => router.push(`/events/${community.eventId}/community` as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.seeAllText}>Ver todo</Text>
          <ChevronRight size={14} color="#818cf8" />
        </TouchableOpacity>
      </View>

      {/* BANNER DE ESTADO DE PRESENCIA CON AVATARES SUPERPUESTOS */}
      <View style={styles.headlineBanner}>
        <View style={styles.headlineLeft}>
          {community.stateStatus === 'live' && <View style={styles.liveDot} />}
          <Text style={[styles.headlineText, community.stateStatus === 'live' && styles.liveHeadlineText]}>
            {community.statusHeadline}
          </Text>
        </View>

        {/* AVATARES SUPERPUESTOS */}
        <View style={styles.stackedAvatarsRow}>
          {previewMembers.map((m, i) => (
            <Image
              key={m.id}
              source={{ uri: m.avatarUrl }}
              style={[styles.stackedAvatar, { zIndex: 10 - i, marginLeft: i > 0 ? -12 : 0 }]}
            />
          ))}
        </View>
      </View>

      {/* LISTA PREVIEW DE ASISTENTES */}
      {previewMembers.length > 0 ? (
        <View style={styles.cardsList}>
          {previewMembers.map((member) => (
            <CommunityMemberCard
              key={member.id}
              member={member}
              onPress={() => {
                setSelectedMember(member);
                setProfileVisible(true);
              }}
              onSendRequest={() => handleUpdateConnection(member.id, 'send')}
              onCancelRequest={() => handleUpdateConnection(member.id, 'cancel')}
              onAcceptRequest={() => handleUpdateConnection(member.id, 'accept')}
              onIgnoreRequest={() => handleUpdateConnection(member.id, 'ignore')}
              onRemoveConnection={() => handleUpdateConnection(member.id, 'remove')}
            />
          ))}
        </View>
      ) : (
        <CommunityEmptyState />
      )}

      {/* BOTÓN INFERIOR EXPLORAR COMUNIDAD */}
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => router.push(`/events/${community.eventId}/community` as any)}
        activeOpacity={0.85}
      >
        <Sparkles size={14} color="#818cf8" />
        <Text style={styles.exploreButtonText}>Explorar Comunidad Completa</Text>
        <ChevronRight size={14} color="#818cf8" />
      </TouchableOpacity>

      {/* MODAL DE PERFIL SOCIAL RESUMIDO */}
      <CommunityMemberProfile
        visible={profileVisible}
        member={selectedMember}
        onClose={() => setProfileVisible(false)}
        onSendRequest={() => selectedMember && handleUpdateConnection(selectedMember.id, 'send')}
        onCancelRequest={() => selectedMember && handleUpdateConnection(selectedMember.id, 'cancel')}
        onAcceptRequest={() => selectedMember && handleUpdateConnection(selectedMember.id, 'accept')}
        onIgnoreRequest={() => selectedMember && handleUpdateConnection(selectedMember.id, 'ignore')}
        onRemoveConnection={() => selectedMember && handleUpdateConnection(selectedMember.id, 'remove')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 2,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(129,140,248,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  seeAllText: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: 'bold',
  },

  headlineBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  headlineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  headlineText: {
    color: '#d4d4d8',
    fontSize: 11,
    fontWeight: '600',
  },
  liveHeadlineText: {
    color: '#10b981',
    fontWeight: 'bold',
  },

  stackedAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackedAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#020205',
  },

  cardsList: {
    gap: 10,
    marginBottom: 12,
  },

  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(129,140,248,0.08)',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.2)',
  },
  exploreButtonText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
