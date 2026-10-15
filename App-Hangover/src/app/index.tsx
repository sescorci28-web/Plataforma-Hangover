import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { clubService } from '@/services/club.service';
import { ClubInfo } from '@/data/mockClubs';

import { HeroSection } from '@/components/home/HeroSection';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { BottomNav } from '@/components/layout/BottomNav';
import { GlobalSearchModal } from '@/components/search/GlobalSearchModal';

export default function HomeScreen() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [featuredClubs, setFeaturedClubs] = useState<ClubInfo[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        if (!session) {
          router.replace('/login');
        } else {
          setIsAuthenticated(true);
        }
      } catch (err) {
        if (mounted) router.replace('/login');
      } finally {
        if (mounted) setCheckingAuth(false);
      }
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false);
        router.replace('/login');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setIsAuthenticated(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadFeaturedClubs() {
      try {
        const { clubs, error } = await clubService.getFeaturedClubs(6);
        if (mounted && !error && clubs) {
          setFeaturedClubs(clubs);
        }
      } catch {
        if (mounted) setFeaturedClubs([]);
      } finally {
        if (mounted) setIsLoadingClubs(false);
      }
    }

    if (isAuthenticated) {
      loadFeaturedClubs();
    }

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  if (checkingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9900F0" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* HEADER BÁSICO MEJORADO */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLogo}>HANGOVER</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.badgeText}>BETA</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => setSearchModalVisible(true)}
            activeOpacity={0.7}
          >
            <Search size={20} color="#a1a1aa" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Bell size={20} color="#a1a1aa" />
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENIDO PRINCIPAL */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>

        {/* HERO SECTION REUTILIZADO */}
        <View style={{ marginHorizontal: -20, marginTop: -12 }}>
          <HeroSection />
        </View>

        {/* CATEGORÍAS REUTILIZADAS EN GRID DE 2 COLUMNAS 100% ANCHO */}
        <View style={{ marginTop: 8 }}>
          <CategoryGrid />
        </View>

        {/* EVENTOS DESTACADOS (Scroll Horizontal) */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionOverline}>CARTELERA EXCLUSIVA</Text>
            <Text style={styles.sectionTitleText}>EVENTOS DESTACADOS</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/events' as any)}>
            <Text style={styles.seeAllText}>Ver todos →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          <View style={styles.eventCard}>
            <View style={[styles.placeholderImage, { backgroundColor: '#1e1e2d' }]} />
            <View style={styles.eventInfo}>
              <Text style={styles.eventDate}>VIE, 28 OCT • BARRANQUILLA</Text>
              <Text style={styles.eventTitle}>Neon Nights VIP</Text>
              <Text style={styles.eventPrice}>Desde $50.000</Text>
            </View>
          </View>

          <View style={styles.eventCard}>
            <View style={[styles.placeholderImage, { backgroundColor: '#2d1e2d' }]} />
            <View style={styles.eventInfo}>
              <Text style={styles.eventDate}>SAB, 29 OCT • CARTAGENA</Text>
              <Text style={styles.eventTitle}>Halloween Madness</Text>
              <Text style={styles.eventPrice}>Desde $80.000</Text>
            </View>
          </View>
        </ScrollView>

        {/* DISCOTECAS DESTACADAS (Scroll Horizontal) */}
        <View style={[styles.sectionHeader, { marginTop: 32 }]}>
          <View>
            <Text style={styles.sectionOverline}>TEMPLOS DE LA MÚSICA</Text>
            <Text style={styles.sectionTitleText}>DISCOTECAS DESTACADAS</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/clubs' as any)}>
            <Text style={styles.seeAllText}>Ver todas →</Text>
          </TouchableOpacity>
        </View>

        {isLoadingClubs ? (
          <View style={styles.clubsLoadingBox}>
            <ActivityIndicator size="small" color="#818cf8" />
            <Text style={styles.clubsLoadingText}>Cargando discotecas...</Text>
          </View>
        ) : featuredClubs.length === 0 ? (
          <View style={styles.clubsEmptyBox}>
            <Text style={styles.clubsEmptyTitle}>Próximamente más discotecas</Text>
            <Text style={styles.clubsEmptyText}>Estamos sumando los mejores clubes nocturnos.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {featuredClubs.map((clubItem) => (
              <TouchableOpacity
                key={clubItem.id}
                activeOpacity={0.8}
                onPress={() => router.push(`/clubs/${clubItem.id}` as any)}
                style={styles.clubCard}
              >
                <Image
                  source={{ uri: clubItem.imageUrl }}
                  style={styles.clubCardImage}
                  resizeMode="cover"
                />
                <View style={styles.clubInfo}>
                  <Text style={styles.eventDate} numberOfLines={1}>{clubItem.location.toUpperCase()}</Text>
                  <Text style={styles.eventTitle} numberOfLines={1}>{clubItem.name}</Text>
                  <Text style={styles.clubRating}>⭐ {clubItem.rating.toFixed(1)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Espacio final para evitar solapamiento con BottomNav */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL DE BÚSQUEDA GLOBAL */}
      <GlobalSearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
      />

      {/* NAVEGACIÓN INFERIOR (COMPONENTE COMPARTIDO) */}
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020205',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  headerLogo: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  headerBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 90,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionOverline: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 4,
  },
  sectionTitleText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  seeAllText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: 'bold',
  },
  horizontalScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  eventCard: {
    width: 260,
    backgroundColor: '#18181b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginRight: 14,
  },
  placeholderImage: {
    width: '100%',
    height: 130,
  },
  eventInfo: {
    padding: 14,
  },
  eventDate: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  eventTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  eventPrice: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '900',
  },
  clubCard: {
    width: 200,
    backgroundColor: '#18181b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginRight: 14,
  },
  clubInfo: {
    padding: 14,
  },
  clubRating: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 6,
  },
  clubCardImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#1e1e2d',
  },
  clubsLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
    paddingHorizontal: 4,
  },
  clubsLoadingText: {
    color: '#a1a1aa',
    fontSize: 13,
  },
  clubsEmptyBox: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    marginTop: 8,
  },
  clubsEmptyTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  clubsEmptyText: {
    color: '#71717a',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#020205',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
