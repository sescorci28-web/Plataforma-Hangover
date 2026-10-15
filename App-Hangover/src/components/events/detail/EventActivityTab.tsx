import React from 'react';
import { View, StyleSheet } from 'react-native';
import { EventUpdate } from '@/data/mockEventUpdates';
import { EventUpdatesSection } from '@/components/events/EventUpdatesSection';

interface EventActivityTabProps {
  updates: EventUpdate[];
}

export const EventActivityTab: React.FC<EventActivityTabProps> = ({ updates }) => {
  return (
    <View style={styles.container}>
      <EventUpdatesSection updates={updates} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
});
