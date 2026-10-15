import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Megaphone } from 'lucide-react-native';

import { 
  EventUpdate, registerUpdateView, toggleUpdateLike 

} from '@/data/mockEventUpdates';
import { EventUpdateCard } from './EventUpdateCard';
import { EventUpdateViewer } from './EventUpdateViewer';

interface EventUpdatesSectionProps {
  updates: EventUpdate[];
}

export const EventUpdatesSection: React.FC<EventUpdatesSectionProps> = ({ updates: initialUpdates }) => {
  const [updatesList, setUpdatesList] = useState<EventUpdate[]>(initialUpdates);
  const [viewedUpdateIds, setViewedUpdateIds] = useState<Set<string>>(new Set());
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});
  
  const [selectedUpdate, setSelectedUpdate] = useState<EventUpdate | null>(null);
  const [viewerVisible, setViewerVisible] = useState<boolean>(false);

  useEffect(() => {
    setUpdatesList(initialUpdates);
  }, [initialUpdates]);

  if (!updatesList || updatesList.length === 0) return null;

  // Lógica para registrar visualización única por sesión
  const handleOpenUpdate = (update: EventUpdate) => {
    let updatedUpdate = { ...update };

    if (!viewedUpdateIds.has(update.id)) {
      const nextViewedSet = new Set(viewedUpdateIds);
      nextViewedSet.add(update.id);
      setViewedUpdateIds(nextViewedSet);

      const nextViewsCount = update.views + 1;
      updatedUpdate.views = nextViewsCount;

      setUpdatesList((prevList) =>
        prevList.map((item) => (item.id === update.id ? { ...item, views: nextViewsCount } : item))
      );

      registerUpdateView(update.id);
    }

    setSelectedUpdate(updatedUpdate);
    setViewerVisible(true);
  };

  // Lógica para alternar el me gusta (like toggle)
  const handleToggleLike = (updateId: string) => {
    const isCurrentlyLiked = !!userLikes[updateId];

    setUpdatesList((prevList) =>
      prevList.map((item) => {
        if (item.id !== updateId) return item;

        const nextLikes = isCurrentlyLiked ? Math.max(0, item.likes - 1) : item.likes + 1;
        const updatedItem = { ...item, likes: nextLikes };

        if (selectedUpdate && selectedUpdate.id === updateId) {
          setSelectedUpdate(updatedItem);
        }

        return updatedItem;
      })
    );

    setUserLikes((prev) => ({
      ...prev,
      [updateId]: !isCurrentlyLiked,
    }));

    toggleUpdateLike(updateId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Megaphone size={16} color="#818cf8" />
          <Text style={styles.sectionTitle}>Actualizaciones en Vivo</Text>
        </View>
        <Text style={styles.updateCount}>{updatesList.length} publicaciones</Text>
      </View>

      <View style={styles.feedList}>
        {updatesList.map((item) => (
          <EventUpdateCard
            key={item.id}
            update={item}
            isLiked={!!userLikes[item.id]}
            onPress={() => handleOpenUpdate(item)}
            onToggleLike={() => handleToggleLike(item.id)}
          />
        ))}
      </View>

      {/* VISOR MODAL EN DETALLE */}
      <EventUpdateViewer
        visible={viewerVisible}
        update={selectedUpdate}
        isLiked={selectedUpdate ? !!userLikes[selectedUpdate.id] : false}
        onClose={() => setViewerVisible(false)}
        onToggleLike={() => {
          if (selectedUpdate) {
            handleToggleLike(selectedUpdate.id);
          }
        }}
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
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  updateCount: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '600',
  },
  feedList: {
    gap: 12,
  },
});
