import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground, Linking, Share, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ArrowLeft, Share2, MapPin, Star, Calendar, CheckCircle2, Heart, 
  ExternalLink, Sparkles, Clock, Eye, Video, Image as ImageIcon, Briefcase, Award, ChevronRight, User as UserIcon
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { getOrganizerById, OrganizerProfile, PastOrganizerEvent, OrganizerMedia, OrganizerGalleryImage } from '@/data/mockOrganizers';
import { useResponsive } from '@/hooks/useResponsive';
import { supabase } from '@/lib/supabase';

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export default function OrganizerProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { screenPadding, heroHeight, safeBottomPadding, isCompact } = useResponsive();

  const [organizer, setOrganizer] = useState<OrganizerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'media' | 'gallery' | 'info'>('upcoming');
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    let active = true;
    const targetId = Array.isArray(id) ? id[0] : id;

    async function loadProfile() {
      if (!targetId) {
        if (active) {
          setNotFoundState(true);
          setLoading(false);
        }
        return;
      }

      // 1. Intentar cargar desde organizadores mock estáticos (ej. org-1)
      const mockOrg = getOrganizerById(targetId);
      if (mockOrg) {
        if (active) {
          setOrganizer(mockOrg);
          setNotFoundState(false);
          setLoading(false);
        }
        return;
      }

      // 2. Si no es un mock, consultar public.profiles en Supabase con el ID real
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, city, role, provider_type, bio, is_verified')
          .eq('id', targetId)
          .maybeSingle();

        if (error || !data) {
          if (active) {
            setOrganizer(null);
            setNotFoundState(true);
          }
        } else {
          if (active) {
            const displayName = data.full_name || (data.username ? `@${data.username}` : 'Usuario Hangover');
            const displayCompany = data.username ? `@${data.username}` : (data.provider_type || data.role || 'Usuario Registrado');
            const userBio = data.bio || 'Perfil oficial en la plataforma Hangover.';

            setOrganizer({
              id: data.id,
              name: displayName,
              companyName: displayCompany,
              bio: userBio,
              fullBio: userBio,
              avatarUrl: data.avatar_url || '',
              bannerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80',
              rating: 5.0,
              reviewsCount: 0,
              eventsCount: 0,
              followersCount: 0,
              verified: !!data.is_verified,
              yearsOfExperience: 1,
              city: data.city || 'Ciudad no especificada',
              eventTypes: [data.provider_type || data.role || 'Usuario'],
              socials: {
                instagram: data.username || undefined,
              },
              pastEvents: [],
              media: [],
              gallery: [],
              upcomingEvents: [],
            });
            setNotFoundState(false);
          }
        }
      } catch (err) {
        if (active) {
          setOrganizer(null);
          setNotFoundState(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [id]);

  const handleShare = async () => {
    if (!organizer) return;
    try {
      await Share.share({
        message: `Conoce a ${organizer.name} en Hangover: ${organizer.bio}`,
      });
    } catch (error) {
      // silencioso
    }
  };

  const toggleFollow = () => {
    if (!organizer) return;
    setIsFollowing(!isFollowing);
    Alert.alert(
      !isFollowing ? '¡Siguiendo!' : 'Dejaste de seguir',
      !isFollowing 
        ? `Ahora recibirás notificaciones de ${organizer.name}.` 
        : `Ya no sigues a ${organizer.name}`
    );
  };

  const handleMediaPlay = (title: string) => {
    Alert.alert(
      'Muestra de Video / Aftermovie',
      `Simulación de reproductor para "${title}".`
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#9900F0" />
        <Text style={{ color: '#a1a1aa', marginTop: 12, fontSize: 13, fontWeight: '600' }}>
          Cargando perfil...
        </Text>
      </View>
    );
  }

  if (notFoundState || !organizer) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <UserIcon size={56} color="#64748b" style={{ marginBottom: 16 }} />
        <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '900', marginBottom: 8, textAlign: 'center' }}>
          Perfil no encontrado
        </Text>
        <Text style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
          El usuario o perfil seleccionado no existe o no se encuentra disponible en Hangover.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: '#9900F0', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 }}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>Volver atrás</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: safeBottomPadding + 40 }}
      >
        {/* ── HERO BANNER & AVATAR RESPONSIVE ── */}
        <ImageBackground source={{ uri: organizer.bannerUrl }} style={[styles.bannerImage, { height: heroHeight - 40 }]}>
          <LinearGradient
            colors={['rgba(2,2,5,0.4)', 'rgba(2,2,5,0.75)', '#020205']}
            style={[styles.bannerGradient, { paddingHorizontal: screenPadding }]}
          >
            <SafeAreaView edges={['top']} style={styles.topHeader}>
              <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                <ArrowLeft size={22} color="#fff" />
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
                  <Share2 size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.followButton, isFollowing && styles.followingButton]}
                  onPress={toggleFollow}
                  activeOpacity={0.8}
                >
                  <Heart size={16} color="#fff" fill={isFollowing ? '#fff' : 'transparent'} />
                  <Text style={styles.followButtonText}>
                    {isFollowing ? 'Siguiendo' : 'Seguir'}
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>

            {/* ORGANIZER HERO META */}
            <View style={styles.heroContent}>
              {organizer.avatarUrl ? (
                <Image source={{ uri: organizer.avatarUrl }} style={[styles.avatar, isCompact && { width: 68, height: 68 }]} />
              ) : (
                <View style={[styles.avatar, isCompact && { width: 68, height: 68 }, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A003D' }]}>
                  <UserIcon size={isCompact ? 32 : 40} color="#94a3b8" />
                </View>
              )}
              <View style={styles.heroInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={[styles.organizerName, isCompact && { fontSize: 19 }]} numberOfLines={1}>{organizer.name}</Text>
                  {organizer.verified && <CheckCircle2 size={18} color="#818cf8" fill="#4f46e5" />}
                </View>
                <Text style={styles.companyName} numberOfLines={1}>{organizer.companyName}</Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Star size={11} color="#fbbf24" fill="#fbbf24" />
                    <Text style={styles.ratingText}>{organizer.rating}</Text>
                  </View>
                  <Text style={styles.metaDot}>·</Text>
                  <View style={styles.metaItem}>
                    <Text style={styles.followersText}>{formatNumber(organizer.followersCount)} seguidores</Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>

        {/* ── BARRA DE ESTADÍSTICAS RELEVANTES ── */}
        <View style={[styles.statsBar, { marginHorizontal: screenPadding }]}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{organizer.eventsCount}</Text>
            <Text style={styles.statLabel}>EVENTOS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{formatNumber(organizer.followersCount)}</Text>
            <Text style={styles.statLabel}>SEGUIDORES</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{organizer.yearsOfExperience} años</Text>
            <Text style={styles.statLabel}>EXPERIENCIA</Text>
          </View>
        </View>

        {/* ── NAVEGACIÓN POR PESTAÑAS (TABS) ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabsScroll, { paddingHorizontal: screenPadding }]}
        >
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'upcoming' && styles.activeTabButton]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Calendar size={14} color={activeTab === 'upcoming' ? '#fff' : '#71717a'} />
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
              Próximos ({organizer.upcomingEvents.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'past' && styles.activeTabButton]}
            onPress={() => setActiveTab('past')}
          >
            <Clock size={14} color={activeTab === 'past' ? '#fff' : '#71717a'} />
            <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
              Pasados ({organizer.pastEvents.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'media' && styles.activeTabButton]}
            onPress={() => setActiveTab('media')}
          >
            <Video size={14} color={activeTab === 'media' ? '#fff' : '#71717a'} />
            <Text style={[styles.tabText, activeTab === 'media' && styles.activeTabText]}>
              Aftermovies ({organizer.media.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'gallery' && styles.activeTabButton]}
            onPress={() => setActiveTab('gallery')}
          >
            <ImageIcon size={14} color={activeTab === 'gallery' ? '#fff' : '#71717a'} />
            <Text style={[styles.tabText, activeTab === 'gallery' && styles.activeTabText]}>
              Galería ({organizer.gallery.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'info' && styles.activeTabButton]}
            onPress={() => setActiveTab('info')}
          >
            <Briefcase size={14} color={activeTab === 'info' ? '#fff' : '#71717a'} />
            <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
              Biografía
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ── CONTENIDO DINÁMICO DE LA PESTAÑA SELECCIONADA ── */}
        <View style={[styles.tabContentContainer, { paddingHorizontal: screenPadding }]}>

          {/* 1. PESTAÑA: PRÓXIMOS EVENTOS */}
          {activeTab === 'upcoming' && (
            <View style={styles.listSection}>
              <Text style={styles.sectionHeaderTitle}>Próximas Experiencias</Text>
              {organizer.upcomingEvents.length === 0 ? (
                <Text style={styles.emptyText}>No hay eventos programados en este momento.</Text>
              ) : (
                organizer.upcomingEvents.map((event) => (
                  <TouchableOpacity
                    key={event.eventId}
                    style={styles.upcomingEventCard}
                    onPress={() => router.push(`/events/${event.eventId}` as any)}
                    activeOpacity={0.9}
                  >
                    <Image source={{ uri: event.imageUrl }} style={styles.eventImage} />
                    <View style={styles.eventCardBody}>
                      <Text style={styles.eventCardTitle} numberOfLines={1}>{event.title}</Text>
                      <Text style={styles.eventCardDate}>{event.date}</Text>
                      <View style={styles.eventCardLocation}>
                        <MapPin size={12} color="#71717a" />
                        <Text style={styles.eventCardLocationText} numberOfLines={1}>{event.location}</Text>
                      </View>
                      <View style={styles.eventCardFooter}>
                        <Text style={styles.priceText}>Desde ${event.priceFrom.toLocaleString()}</Text>
                        <View style={styles.goToEventButton}>
                          <Text style={styles.goToEventButtonText}>Ver evento</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* 2. PESTAÑA: EVENTOS PASADOS / HISTORIAL */}
          {activeTab === 'past' && (
            <View style={styles.listSection}>
              <Text style={styles.sectionHeaderTitle}>Trayectoria y Ediciones Anteriores</Text>
              {organizer.pastEvents.map((past: PastOrganizerEvent) => (
                <View key={past.id} style={styles.pastEventCard}>
                  <Image source={{ uri: past.imageUrl }} style={styles.pastEventImage} />
                  <View style={styles.pastEventBody}>
                    <View style={styles.pastBadge}>
                      <Text style={styles.pastBadgeText}>FINALIZADO</Text>
                    </View>
                    <Text style={styles.pastEventTitle} numberOfLines={1}>{past.title}</Text>
                    <Text style={styles.pastEventDate}>{past.date}</Text>
                    <Text style={styles.pastEventSub} numberOfLines={1}>{past.location}</Text>
                    <View style={styles.pastEventMetaRow}>
                      <Text style={styles.pastEventMeta}>{formatNumber(past.attendeesCount)} asistentes</Text>
                      <Text style={styles.metaDot}>·</Text>
                      <Star size={10} color="#fbbf24" fill="#fbbf24" />
                      <Text style={styles.pastEventRating}>{past.rating}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* 3. PESTAÑA: AFTERMOVIES Y MULTIMEDIA */}
          {activeTab === 'media' && (
            <View style={styles.listSection}>
              <Text style={styles.sectionHeaderTitle}>Aftermovies & Videos Oficiales</Text>
              {organizer.media.map((item: OrganizerMedia) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.mediaCard}
                  onPress={() => handleMediaPlay(item.title)}
                  activeOpacity={0.9}
                >
                  <ImageBackground source={{ uri: item.thumbnailUrl }} style={styles.mediaThumbnail}>
                    <View style={styles.mediaOverlay}>
                      <View style={styles.playCircle}>
                        <Video size={20} color="#fff" />
                      </View>
                      <View style={styles.durationTag}>
                        <Text style={styles.durationText}>{item.duration}</Text>
                      </View>
                    </View>
                  </ImageBackground>
                  <View style={styles.mediaDetails}>
                    <Text style={styles.mediaTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.mediaStats}>
                      <Eye size={12} color="#71717a" />
                      <Text style={styles.mediaStatText}>{formatNumber(item.viewsCount)} reproducciones</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 4. PESTAÑA: GALERÍA DE FOTOS */}
          {activeTab === 'gallery' && (
            <View style={styles.galleryGrid}>
              <Text style={styles.sectionHeaderTitle}>Galería de Fotografía</Text>
              {organizer.gallery.map((img: OrganizerGalleryImage) => (
                <View key={img.id} style={styles.galleryCard}>
                  <Image source={{ uri: img.imageUrl }} style={styles.galleryImage} />
                  <View style={styles.galleryCaptionBox}>
                    <Text style={styles.galleryCaption} numberOfLines={1}>{img.caption}</Text>
                    <Text style={styles.galleryEvent} numberOfLines={1}>{img.eventName}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* 5. PESTAÑA: INFORMACIÓN Y CONTACTO */}
          {activeTab === 'info' && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionHeaderTitle}>Sobre el Organizador</Text>
              <Text style={styles.fullBioText}>{organizer.fullBio || organizer.bio}</Text>

              <View style={styles.infoGrid}>
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardLabel}>NOMBRE LEGAL / EMPRESA</Text>
                  <Text style={styles.infoCardValue}>{organizer.companyName}</Text>
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoCardLabel}>UBICACIÓN DE OPERACIÓN</Text>
                  <Text style={styles.infoCardValue}>{organizer.city}</Text>
                </View>

                {organizer.socials?.website && (
                  <TouchableOpacity
                    style={styles.infoCard}
                    onPress={() => Linking.openURL(organizer.socials.website!)}
                  >
                    <Text style={styles.infoCardLabel}>SITIO WEB OFICIAL</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={[styles.infoCardValue, { color: '#818cf8' }]}>{organizer.socials.website}</Text>
                      <ExternalLink size={14} color="#818cf8" />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020205' },

  bannerImage: { width: '100%' },
  bannerGradient: { flex: 1, justifyContent: 'space-between' },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 },
  iconButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  followButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
  },
  followingButton: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  followButtonText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },

  heroContent: { flexDirection: 'row', gap: 16, alignItems: 'flex-end', marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 20, borderWidth: 3, borderColor: '#4f46e5', backgroundColor: '#18181b' },
  heroInfo: { flex: 1 },
  organizerName: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  companyName: { color: '#818cf8', fontSize: 12, fontWeight: 'bold', marginTop: 2, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: '#a1a1aa', fontSize: 11 },
  ratingText: { color: '#fbbf24', fontSize: 11, fontWeight: 'bold' },
  followersText: { color: '#34d399', fontSize: 11, fontWeight: 'bold' },
  metaDot: { color: '#52525b', fontSize: 12 },

  statsBar: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.02)', marginVertical: 16, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', justifyContent: 'space-around', alignItems: 'center' },
  statBox: { alignItems: 'center' },
  statNumber: { color: '#fff', fontSize: 14, fontWeight: '900' },
  statLabel: { color: '#71717a', fontSize: 9, fontWeight: 'bold', marginTop: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.08)' },

  tabsScroll: { gap: 10, marginBottom: 10 },
  tabButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  activeTabButton: { backgroundColor: 'rgba(99,102,241,0.2)', borderColor: '#6366f1' },
  tabText: { color: '#71717a', fontSize: 12, fontWeight: 'bold' },
  activeTabText: { color: '#fff' },

  tabContentContainer: { paddingTop: 10 },

  listSection: { gap: 12 },
  sectionHeaderTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  emptyText: { color: '#71717a', fontSize: 13, textAlign: 'center', paddingVertical: 20 },

  upcomingEventCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 12 },
  eventImage: { width: '100%', height: 130, backgroundColor: '#18181b' },
  eventCardBody: { padding: 16 },
  eventCardTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  eventCardDate: { color: '#34d399', fontSize: 12, fontWeight: 'bold', marginBottom: 6 },
  eventCardLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14 },
  eventCardLocationText: { color: '#71717a', fontSize: 11, flexShrink: 1 },
  eventCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 },
  priceText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  goToEventButton: { backgroundColor: '#4f46e5', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  goToEventButtonText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  pastEventCard: { flexDirection: 'row', gap: 14, backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  pastEventImage: { width: 72, height: 72, borderRadius: 12, backgroundColor: '#18181b' },
  pastEventBody: { flex: 1 },
  pastBadge: { backgroundColor: 'rgba(52,211,153,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 4 },
  pastBadgeText: { color: '#34d399', fontSize: 8, fontWeight: 'bold' },
  pastEventTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  pastEventDate: { color: '#818cf8', fontSize: 11, marginTop: 2 },
  pastEventSub: { color: '#71717a', fontSize: 11, marginTop: 2 },
  pastEventMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  pastEventMeta: { color: '#a1a1aa', fontSize: 10 },
  pastEventRating: { color: '#fbbf24', fontSize: 10, fontWeight: 'bold' },

  mediaCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  mediaThumbnail: { width: '100%', height: 160, backgroundColor: '#18181b' },
  mediaOverlay: { ...StyleSheet.absoluteFill, height: 160, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
  playCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center' },
  durationTag: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  durationText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  mediaDetails: { padding: 14 },
  mediaTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  mediaStats: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  mediaStatText: { color: '#71717a', fontSize: 11 },

  galleryGrid: { gap: 12 },
  galleryCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  galleryImage: { width: '100%', height: 180, backgroundColor: '#18181b' },
  galleryCaptionBox: { padding: 12 },
  galleryCaption: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  galleryEvent: { color: '#818cf8', fontSize: 11, marginTop: 2 },

  infoSection: {},
  fullBioText: { color: '#a1a1aa', fontSize: 13, lineHeight: 22, marginBottom: 20 },
  infoGrid: { gap: 10 },
  infoCard: { backgroundColor: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  infoCardLabel: { color: '#71717a', fontSize: 9, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  infoCardValue: { color: '#fff', fontSize: 13, fontWeight: '600' },
  socialsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  socialChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  socialChipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
