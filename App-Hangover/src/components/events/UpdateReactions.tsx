import React from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';

interface UpdateReactionsProps {
  likes: number;
  isLiked: boolean;
  onToggleLike: () => void;
  compact?: boolean;
}

export const UpdateReactions: React.FC<UpdateReactionsProps> = ({
  likes,
  isLiked,
  onToggleLike,
  compact = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        compact && styles.compactButton,
        isLiked && styles.activeButton,
      ]}
      onPress={onToggleLike}
      activeOpacity={0.75}
    >
      <Text style={[styles.emoji, compact && styles.compactEmoji]}>❤️</Text>
      <Text style={[styles.countText, isLiked && styles.activeCountText]}>
        {likes}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  compactButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
  },
  activeButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  emoji: {
    fontSize: 14,
  },
  compactEmoji: {
    fontSize: 12,
  },
  countText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeCountText: {
    color: '#ef4444',
  },
});
