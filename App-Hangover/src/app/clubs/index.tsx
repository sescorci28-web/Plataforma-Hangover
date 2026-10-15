import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { ClubInfo } from '@/data/mockClubs';
import { clubService } from '@/services/club.service';
import { ClubList } from '@/components/clubs/ClubList';
import { SearchBar } from '@/components/ui/SearchBar';

const BASE_CATEGORIES = ['Todas', 'Discoteca', 'Crossover', 'Electrónica', 'Reggaeton', 'Tropical'];

export default function ClubsIndexScreen() {
  const router = useRouter();
  const [clubs, setClubs] = useState<ClubInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  const loadClubs = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const { clubs: fetchedClubs, error } = await clubService.getClubs();
      if (!error && fetchedClubs) {
        setClubs(fetchedClubs);
      } else {
        setClubs([]);
      }
    } catch {
      setClubs([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadClubs(true);
  }, [loadClubs]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadClubs(false);
  }, [loadClubs]);

  // Extraer categorías dinámicamente si los registros tienen tipos específicos
  const categories = useMemo(() => {
    const set = new Set(BASE_CATEGORIES);
    clubs.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [clubs]);

  const filteredClubs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clubs.filter((club) => {
      const matchesSearch = !q ||
        club.name.toLowerCase().includes(q) ||
        club.location.toLowerCase().includes(q) ||
        club.description.toLowerCase().includes(q);

      const matchesCategory = selectedCategory === 'Todas' ||
        club.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [clubs, search, selectedCategory]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/')}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerLogo}>DISCOTECAS</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.searchContainer}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar por nombre o zona..." />
        
        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(item) => item}
            renderItem={({ item, index }) => (
              <TouchableOpacity 
                style={[
                  styles.filterChip, 
                  selectedCategory === item && styles.filterChipActive,
                  index === 0 && { marginLeft: 20 },
                  index === categories.length - 1 && { marginRight: 20 }
                ]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text style={[styles.filterText, selectedCategory === item && styles.filterTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#818cf8" />
          <Text style={styles.loadingText}>Cargando discotecas disponibles...</Text>
        </View>
      ) : (
        <ClubList 
          clubs={filteredClubs} 
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          emptyMessage={search ? 'No se encontraron resultados para tu búsqueda' : 'No hay discotecas disponibles por el momento'}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020205' },
  header: { 
    flexDirection: 'row',
    paddingHorizontal: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.05)', 
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  backButton: { padding: 4 },
  spacer: { width: 32 },
  headerLogo: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  searchContainer: {
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  filtersContainer: {
    marginTop: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#818cf8',
  },
  filterText: { color: '#a1a1aa', fontSize: 12, fontWeight: 'bold' },
  filterTextActive: { color: '#818cf8' },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#a1a1aa',
    fontSize: 13,
  },
});

