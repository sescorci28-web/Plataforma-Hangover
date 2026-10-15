import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

import { CommunityMember } from '@/data/mockEventCommunity';
import { ConnectionButton } from './ConnectionButton';

interface CommunityMemberCardProps {
  member: CommunityMember;
  onPress: () => void;
  onSendRequest: () => void;
  onCancelRequest: () => void;
  onAcceptRequest: () => void;
  onIgnoreRequest: () => void;
  onRemoveConnection: () => void;
}

export const CommunityMemberCard: React.FC<CommunityMemberCardProps> = ({
  member,
  onPress,
  onSendRequest,
  onCancelRequest,
  onAcceptRequest,
  onIgnoreRequest,
  onRemoveConnection,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.leftRow}>
        {/* AVATAR CON INDICADOR DE PRESENCIA */}
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: member.avatarUrl }} style={styles.avatar} />
          {member.presenceStatus === 'checked_in' && (
            <View style={styles.liveDotRing}>
              <View style={styles.liveDotInner} />
            </View>
          )}
        </View>

        {/* INFORMACIÓN DEL ASISTENTE */}
        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{member.name}</Text>
            {member.age && <Text style={styles.age}>· {member.age}</Text>}
          </View>

          <Text style={styles.statusText}>{member.statusText}</Text>

          {/* TAGS RÁPIDOS DE INTERESES MUSICALES */}
          <View style={styles.interestsRow}>
            {member.musicInterests.slice(0, 2).map((interest, idx) => (
              <View key={idx} style={styles.interestTag}>
                <Text style={styles.interestTagText}>🎵 {interest}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* BOTÓN CONECTAR / ACCIONES DUALES */}
      <View style={styles.actionCol}>
        <ConnectionButton
          status={member.connectionStatus}
          memberName={member.name}
          onSendRequest={onSendRequest}
          onCancelRequest={onCancelRequest}
          onAcceptRequest={onAcceptRequest}
          onIgnoreRequest={onIgnoreRequest}
          onRemoveConnection={onRemoveConnection}
          compact={true}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.025)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#18181b',
    borderWidth: 1.5,
    borderColor: 'rgba(129,140,248,0.3)',
  },
  liveDotRing: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#020205',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },

  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  age: {
    color: '#71717a',
    fontSize: 12,
  },
  statusText: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },

  interestsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  interestTag: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  interestTagText: {
    color: '#d4d4d8',
    fontSize: 9,
    fontWeight: '500',
  },

  actionCol: {
    marginLeft: 8,
  },
});
