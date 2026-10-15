import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Flame, Gift, Megaphone, Radio } from 'lucide-react-native';

import { EventStory, StoryType } from '@/data/mockEventUpdates';

interface EventStoriesProps {
  stories: EventStory[];
  onSelectStory: (story: EventStory, index: number) => void;
}

const getStoryBadgeIcon = (type: StoryType) => {
  switch (type) {
    case 'surprise':
      return <Gift size={10} color="#fff" />;
    case 'lineup':
      return <Flame size={10} color="#fff" />;
    case 'promo':
      return <Sparkles size={10} color="#fff" />;
    case 'announcement':
      return <Megaphone size={10} color="#fff" />;
    default:
      return <Radio size={10} color="#fff" />;
  }
};

export const EventStories: React.FC<EventStoriesProps> = ({ stories, onSelectStory }) => {
  if (!stories || stories.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Sparkles size={14} color="#818cf8" />
          <Text style={styles.title}>ESTADOS DEL EVENTO</Text>
        </View>
        <Text style={styles.subText}>Toca para ver en vivo</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {stories.map((story, index) => (
          <TouchableOpacity
            key={story.id}
            style={styles.storyItem}
            onPress={() => onSelectStory(story, index)}
            activeOpacity={0.85}
          >
            {/* ARO NEÓN DEGRADADO */}
            <LinearGradient
              colors={['#818cf8', '#c084fc', '#ec4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientRing}
            >
              <View style={styles.innerAvatarContainer}>
                <Image source={{ uri: story.mediaUrl }} style={styles.avatarImage} />
              </View>
            </LinearGradient>

            {/* BADGE DE TIPO SOBRE LA STORY */}
            <View style={styles.badgeContainer}>
              {getStoryBadgeIcon(story.type)}
            </View>

            <Text style={styles.storyTitle} numberOfLines={1}>
              {story.title.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim()}
            </Text>
            <Text style={styles.storyTime}>{story.timeAgo}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subText: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scrollContent: {
    gap: 14,
    paddingRight: 10,
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
  },
  gradientRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerAvatarContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#020205',
    overflow: 'hidden',
    backgroundColor: '#18181b',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    position: 'absolute',
    top: 48,
    right: 6,
    backgroundColor: '#4f46e5',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#020205',
  },
  storyTitle: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  storyTime: {
    color: '#71717a',
    fontSize: 8,
    marginTop: 1,
  },
});
