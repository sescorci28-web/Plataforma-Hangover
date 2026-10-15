import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Building2 } from 'lucide-react-native';
import { ClubInfo } from '@/data/mockClubs';
import { ClubCard } from './ClubCard';
import { useRouter } from 'expo-router';

interface ClubListProps {
  clubs: ClubInfo[];
  refreshing?: boolean;
  onRefresh?: () => void;
  emptyMessage?: string;
}

export const ClubList = ({ clubs, refreshing = false, onRefresh, emptyMessage = 'No se encontraron discotecas' }: ClubListProps) => {
  const router = useRouter();

  return (
    <FlatList
      data={clubs}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ClubCard 
          club={item} 
          onPress={() => router.push(`/clubs/${item.id}` as any)} 
        />
      )}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#818cf8"
            colors={['#818cf8']}
          />
        ) : undefined
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Building2 size={28} color="#818cf8" />
          </View>
          <Text style={styles.emptyTitle}>{emptyMessage}</Text>
          <Text style={styles.emptySubtitle}>
            Pronto se sumarán nuevos templos de la música y la noche. Vuelve a consultar más tarde.
          </Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#71717a',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});

