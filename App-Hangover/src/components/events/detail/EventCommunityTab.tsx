import React from 'react';
import { View, StyleSheet } from 'react-native';
import { EventCommunitySummary } from '@/data/mockEventCommunity';
import { EventCommunityPreview } from '@/components/events/community/EventCommunityPreview';

interface EventCommunityTabProps {
  community: EventCommunitySummary;
}

export const EventCommunityTab: React.FC<EventCommunityTabProps> = ({ community }) => {
  return (
    <View style={styles.container}>
      <EventCommunityPreview community={community} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
});
