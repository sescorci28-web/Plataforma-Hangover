import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, MessagesSquare, Flame } from 'lucide-react-native';

import { MOCK_CHAT_ROOMS } from '@/data/mockConnect';
import { BottomNav } from '@/components/layout/BottomNav';

export default function ConnectScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLogo}>CONNECT</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity style={styles.tabActive}>
          <MessagesSquare size={16} color="#fff" />
          <Text style={styles.tabTextActive}>Salas de Eventos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabInactive}>
          <Users size={16} color="#71717a" />
          <Text style={styles.tabTextInactive}>Directos</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_CHAT_ROOMS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.roomCard} 
            activeOpacity={0.8}
            onPress={() => router.push(`/connect/chat/${item.id}` as any)}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.roomAvatar} />
            
            <View style={styles.roomInfo}>
              <View style={styles.roomHeader}>
                <Text style={styles.roomName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.timestamp}>{item.timestamp}</Text>
              </View>
              
              <View style={styles.roomFooter}>
                <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
                <View style={styles.activeUsersBadge}>
                  <Flame size={12} color="#fbbf24" />
                  <Text style={styles.activeUsersText}>{item.activeUsers}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020205' },
  header: { 
    paddingHorizontal: 20, 
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  liveText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  tabActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  tabInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  tabTextActive: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  tabTextInactive: { color: '#71717a', fontSize: 14, fontWeight: 'bold' },
  listContainer: { padding: 20, paddingBottom: 40 },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  roomAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  roomInfo: {
    flex: 1,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roomName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    color: '#71717a',
    fontSize: 12,
  },
  roomFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    color: '#a1a1aa',
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  activeUsersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  activeUsersText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: 'bold',
  }
});
