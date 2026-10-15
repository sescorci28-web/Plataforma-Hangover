import React, { useState, useEffect, useCallback } from 'react';
import { 
  Modal, View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, ActivityIndicator, Image, KeyboardAvoidingView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Search, X, ArrowLeft, User as UserIcon, Calendar, 
  MapPin, Sparkles, ChevronRight, Music2, Star, Disc 
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { 
  searchService, GlobalSearchResults, SearchProfileResult, 
  SearchEventResult, SearchClubResult, SearchServiceResult 
} from '@/services/search.service';
import { supabase } from '@/lib/supabase';

interface GlobalSearchModalProps {
  visible: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ visible, onClose }: GlobalSearchModalProps) {
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [results, setResults] = useState<GlobalSearchResults>({
    profiles: [],
    events: [],
    clubs: [],
    services: [],
  });

  // Obtener ID del usuario actual al abrir modal
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  // 1. Debounce de 300ms para evitar consultas a Supabase en cada tecla
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // 2. Ejecución de búsqueda al cambiar debouncedQuery
  useEffect(() => {
    let active = true;

    async function performSearch() {
      const clean = debouncedQuery.trim();
      if (clean.length < 2) {
        setResults({ profiles: [], events: [], clubs: [], services: [] });
        setLoading(false);
        return;
      }

      setLoading(true);
      const res = await searchService.searchAll(clean);
      if (active) {
        setResults(res);
        setLoading(false);
      }
    }

    performSearch();

    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    setResults({ profiles: [], events: [], clubs: [], services: [] });
  };

  const handleClose = () => {
    handleClear();
    onClose();
  };

  // NAVEGACIÓN A PERFIL DE USUARIO / ORGANIZADOR
  const handleSelectProfile = (profile: SearchProfileResult) => {
    // A. Al tocar el resultado
    console.log('SEARCH RESULT:', {
      full_name: profile.full_name,
      username: profile.username,
      id: profile.id,
    });

    handleClose();
    let targetRoute = '';
    if (currentUserId && profile.id === currentUserId) {
      targetRoute = '/profile';
      // B. Justo antes de navegar
      console.log('NAVIGATING TO PROFILE:', {
        id: profile.id,
        'ruta completa': targetRoute,
      });
      router.push(targetRoute as any);
    } else if (profile.role === 'provider' || profile.provider_type) {
      targetRoute = `/organizers/${profile.id}`;
      // B. Justo antes de navegar
      console.log('NAVIGATING TO PROFILE:', {
        id: profile.id,
        'ruta completa': targetRoute,
      });
      router.push(targetRoute as any);
    } else {
      targetRoute = `/profile/${profile.id}`;
      // B. Justo antes de navegar
      console.log('NAVIGATING TO PROFILE:', {
        id: profile.id,
        'ruta completa': targetRoute,
      });
      router.push(targetRoute as any);
    }
  };

  // NAVEGACIÓN A DETALLE DE EVENTO CON UUID REAL
  const handleSelectEvent = (eventItem: SearchEventResult) => {
    handleClose();
    router.push(`/events/${eventItem.id}` as any);
  };

  // NAVEGACIÓN A DETALLE DE DISCOTECA CON ID REAL
  const handleSelectClub = (club: SearchClubResult) => {
    handleClose();
    router.push(`/clubs/${club.id}` as any);
  };

  // NAVEGACIÓN A SERVICIOS CON ID REAL
  const handleSelectService = (serviceItem: SearchServiceResult) => {
    handleClose();
    router.push('/services' as any);
  };

  const hasResults = 
    results.profiles.length > 0 || 
    results.events.length > 0 || 
    results.clubs.length > 0 || 
    results.services.length > 0;

  const isSearching = debouncedQuery.trim().length >= 2;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* BARRA DE BÚSQUEDA CABECERA */}
          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={handleClose} style={styles.backBtn} activeOpacity={0.7}>
              <ArrowLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.searchInputWrapper}>
              <Search size={18} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar usuarios, eventos, clubs, servicios..."
                placeholderTextColor="#64748b"
                value={query}
                onChangeText={setQuery}
                autoFocus={true}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
                  <X size={16} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* INDICADOR DE CARGA */}
          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#9900F0" />
              <Text style={styles.loadingText}>Buscando en Hangover...</Text>
            </View>
          )}

          {/* ÁREA DE CONTENIDO Y RESULTADOS */}
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ESTADO 1: BÚSQUEDA VACÍA */}
            {!isSearching && !loading && (
              <View style={styles.emptyPromptBox}>
                <View style={styles.promptIconCircle}>
                  <Sparkles size={28} color="#F900BF" />
                </View>
                <Text style={styles.promptTitle}>Buscador Global Hangover</Text>
                <Text style={styles.promptSubtitle}>
                  Encuentra usuarios (@username), eventos exclusivos, discotecas destacadas y servicios profesionales.
                </Text>

                <View style={styles.tagsRow}>
                  <TouchableOpacity onPress={() => setQuery('@')} style={styles.suggestionChip}>
                    <Text style={styles.suggestionChipText}>@usuarios</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setQuery('Barranquilla')} style={styles.suggestionChip}>
                    <Text style={styles.suggestionChipText}>Barranquilla</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setQuery('DJ')} style={styles.suggestionChip}>
                    <Text style={styles.suggestionChipText}>DJ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setQuery('Fiesta')} style={styles.suggestionChip}>
                    <Text style={styles.suggestionChipText}>Fiestas</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ESTADO 2: SIN RESULTADOS */}
            {isSearching && !loading && !hasResults && (
              <View style={styles.noResultsBox}>
                <Disc size={40} color="#64748b" style={{ marginBottom: 12 }} />
                <Text style={styles.noResultsTitle}>No encontramos resultados</Text>
                <Text style={styles.noResultsSubtitle}>
                  Intenta buscar con otra palabra clave como 'dj', 'barranquilla' o el @username de tu amigo.
                </Text>
              </View>
            )}

            {/* ESTADO 3: RESULTADOS AGRUPADOS */}
            {isSearching && !loading && hasResults && (
              <View style={styles.resultsContainer}>

                {/* SECCIÓN 1: USUARIOS / PERFILES */}
                {results.profiles.length > 0 && (
                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionHeaderTitle}>USUARIOS ({results.profiles.length})</Text>
                    {results.profiles.map((profile) => (
                      <TouchableOpacity
                        key={profile.id}
                        style={styles.resultRowItem}
                        onPress={() => handleSelectProfile(profile)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.avatarCircle}>
                          {profile.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
                          ) : (
                            <UserIcon size={20} color="#94a3b8" />
                          )}
                        </View>
                        <View style={styles.resultItemBody}>
                          <Text style={styles.itemMainTitle} numberOfLines={1}>
                            {profile.full_name || 'Usuario Hangover'}
                          </Text>
                          <Text style={styles.itemSubtitle}>
                            {profile.username ? `@${profile.username}` : '@usuario'} 
                            {profile.city ? ` · ${profile.city}` : ''}
                          </Text>
                        </View>
                        <ChevronRight size={18} color="#64748b" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* SECCIÓN 2: EVENTOS */}
                {results.events.length > 0 && (
                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionHeaderTitle}>EVENTOS ({results.events.length})</Text>
                    {results.events.map((eventItem) => (
                      <TouchableOpacity
                        key={eventItem.id}
                        style={styles.resultRowItem}
                        onPress={() => handleSelectEvent(eventItem)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.thumbSquare}>
                          {eventItem.image_url ? (
                            <Image source={{ uri: eventItem.image_url }} style={styles.thumbImg} />
                          ) : (
                            <Calendar size={20} color="#9900F0" />
                          )}
                        </View>
                        <View style={styles.resultItemBody}>
                          <Text style={styles.itemMainTitle} numberOfLines={1}>
                            {eventItem.title}
                          </Text>
                          <Text style={styles.itemSubtitle} numberOfLines={1}>
                            📍 {eventItem.location || 'Ubicación no especificada'}
                            {eventItem.category ? ` · ${eventItem.category}` : ''}
                          </Text>
                          {eventItem.ticket_price ? (
                            <Text style={styles.priceTag}>
                              Desde ${eventItem.ticket_price.toLocaleString()}
                            </Text>
                          ) : null}
                        </View>
                        <ChevronRight size={18} color="#64748b" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* SECCIÓN 3: DISCOTECAS / CLUBS */}
                {results.clubs.length > 0 && (
                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionHeaderTitle}>DISCOTECAS ({results.clubs.length})</Text>
                    {results.clubs.map((club) => (
                      <TouchableOpacity
                        key={club.id}
                        style={styles.resultRowItem}
                        onPress={() => handleSelectClub(club)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.thumbSquare}>
                          {club.logo || club.banner_image ? (
                            <Image source={{ uri: club.logo || club.banner_image || '' }} style={styles.thumbImg} />
                          ) : (
                            <Music2 size={20} color="#F900BF" />
                          )}
                        </View>
                        <View style={styles.resultItemBody}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.itemMainTitle} numberOfLines={1}>
                              {club.name}
                            </Text>
                            {club.rating ? (
                              <View style={styles.ratingBadge}>
                                <Star size={10} color="#fbbf24" fill="#fbbf24" />
                                <Text style={styles.ratingText}>{club.rating}</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.itemSubtitle} numberOfLines={1}>
                            {club.city || 'Ciudad'}{club.address ? ` · ${club.address}` : ''}
                          </Text>
                        </View>
                        <ChevronRight size={18} color="#64748b" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* SECCIÓN 4: SERVICIOS */}
                {results.services.length > 0 && (
                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionHeaderTitle}>SERVICIOS ({results.services.length})</Text>
                    {results.services.map((serviceItem) => (
                      <TouchableOpacity
                        key={serviceItem.id}
                        style={styles.resultRowItem}
                        onPress={() => handleSelectService(serviceItem)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.thumbSquare}>
                          {serviceItem.image_url ? (
                            <Image source={{ uri: serviceItem.image_url }} style={styles.thumbImg} />
                          ) : (
                            <Sparkles size={20} color="#60a5fa" />
                          )}
                        </View>
                        <View style={styles.resultItemBody}>
                          <Text style={styles.itemMainTitle} numberOfLines={1}>
                            {serviceItem.title}
                          </Text>
                          <Text style={styles.itemSubtitle} numberOfLines={1}>
                            {serviceItem.category || 'Servicio'}{serviceItem.base_city ? ` · ${serviceItem.base_city}` : ''}
                          </Text>
                          {serviceItem.price ? (
                            <Text style={styles.priceTag}>
                              Tarifa ${serviceItem.price.toLocaleString()}
                            </Text>
                          ) : null}
                        </View>
                        <ChevronRight size={18} color="#64748b" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05020E',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(153, 0, 240, 0.2)',
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(15, 9, 33, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0921',
    borderColor: 'rgba(153, 0, 240, 0.3)',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  clearBtn: {
    padding: 4,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(15, 9, 33, 0.6)',
    gap: 8,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyPromptBox: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  promptIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(249, 0, 191, 0.12)',
    borderColor: 'rgba(249, 0, 191, 0.3)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  promptTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  promptSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  suggestionChip: {
    backgroundColor: '#0F0921',
    borderColor: 'rgba(153, 0, 240, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  suggestionChipText: {
    color: '#FF85B3',
    fontSize: 12,
    fontWeight: '700',
  },
  noResultsBox: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noResultsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  noResultsSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  resultsContainer: {
    gap: 24,
  },
  sectionBox: {
    gap: 8,
  },
  sectionHeaderTitle: {
    color: '#9900F0',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  resultRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0921',
    borderColor: 'rgba(153, 0, 240, 0.2)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A003D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 44,
    height: 44,
  },
  thumbSquare: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#1A003D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  thumbImg: {
    width: 46,
    height: 46,
  },
  resultItemBody: {
    flex: 1,
    gap: 2,
  },
  itemMainTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  itemSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  priceTag: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
