import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  TextInput, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Search } from 'lucide-react-native';

import { EventInfo } from '@/data/mockEvents';
import { eventService } from '@/services/event.service';
import { 
  getEventCommunity, CommunityMember, 
  ConnectionStatus 
} from '@/data/mockEventCommunity';
import { CommunityMemberCard } from '@/components/events/community/CommunityMemberCard';
import { CommunityMemberProfile } from '@/components/events/community/CommunityMemberProfile';
import { CommunityEmptyState } from '@/components/events/community/CommunityEmptyState';

type FilterType = 'all' | 'live' | 'connected' | 'requests';

export default function EventCommunityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // EVENTO REAL DESDE SUPABASE
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

  const fetchEventData = useCallback(async () => {
    if (!id) return;
    setLoadingEvent(true);
    const { event: fetchedEvent } = await eventService.getEventById(String(id));
    setEvent(fetchedEvent);
    setLoadingEvent(false);
  }, [id]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  const community = getEventCommunity(id as string);
  const [members, setMembers] = useState<CommunityMember[]>(community.members);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

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

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.musicInterests.some((genre) => genre.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeFilter === 'live') {
      return m.presenceStatus === 'checked_in';
    }
    if (activeFilter === 'connected') {
      return m.connectionStatus === 'connected';
    }
    if (activeFilter === 'requests') {
      return m.connectionStatus === 'pending_received' || m.connectionStatus === 'pending_sent';
    }

    return true;
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* HEADER CON REGRESO */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
            <ArrowLeft size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Comunidad del Evento</Text>
            {event && <Text style={styles.headerSubtitle}>{event.title}</Text>}
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* BUSCADOR */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <Search size={16} color="#71717a" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre o género musical..."
              placeholderTextColor="#71717a"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* FILTROS RÁPIDOS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'all' && styles.activeFilterChip]}
              onPress={() => setActiveFilter('all')}
            >
              <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>
                Todos ({members.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'live' && styles.activeFilterChip]}
              onPress={() => setActiveFilter('live')}
            >
              <Text style={[styles.filterText, activeFilter === 'live' && styles.activeFilterText]}>
                ● Presentes ahora
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'requests' && styles.activeFilterChip]}
              onPress={() => setActiveFilter('requests')}
            >
              <Text style={[styles.filterText, activeFilter === 'requests' && styles.activeFilterText]}>
                Solicitudes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'connected' && styles.activeFilterChip]}
              onPress={() => setActiveFilter('connected')}
            >
              <Text style={[styles.filterText, activeFilter === 'connected' && styles.activeFilterText]}>
                Conectados
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* LISTADO DE COMUNIDAD */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {filteredMembers.length > 0 ? (
            <View style={styles.listContainer}>
              {filteredMembers.map((member) => (
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
            <CommunityEmptyState
              title="No se encontraron asistentes"
              subtitle="Intenta ajustar tus criterios de búsqueda o filtros."
            />
          )}
        </ScrollView>

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
      </SafeAreaView>
    </View>
  );
}

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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#818cf8',
    fontSize: 11,
    marginTop: 2,
  },

  searchSection: {
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    padding: 0,
  },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  activeFilterChip: {
    backgroundColor: 'rgba(129,140,248,0.15)',
    borderColor: 'rgba(129,140,248,0.3)',
  },
  filterText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#818cf8',
    fontWeight: 'bold',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  listContainer: {
    gap: 10,
  },
});
