import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground, Linking, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Share2, MapPin, Star, Play, Music, Radio, Tv, Calendar, CheckCircle2, Heart, ExternalLink, Disc, Sparkles, Clock, Eye } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { getArtistById, ArtistTrack, ArtistSet, ArtistVideo } from '@/data/mockArtists';

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export default function ArtistProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const artist = getArtistById(id as string);
  
  const [activeTab, setActiveTab] = useState<'info' | 'music' | 'events'>('music');
  const [musicContentType, setMusicContentType] = useState<'tracks' | 'sets' | 'videos'>('tracks');
  const [isFollowing, setIsFollowing] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `¡Mira el perfil de ${artist.name} en Hangover! ${artist.bio}`,
      });
    } catch (error) {
      // silencioso
    }
  };

  const toggleFollow = () => {
    setIsFollowing(!isFollowing);
    Alert.alert(
      !isFollowing ? '¡Siguiendo!' : 'Dejaste de seguir',
      !isFollowing ? `Ahora recibirás notificaciones de los próximos eventos de ${artist.name}` : `Ya no sigues a ${artist.name}`
    );
  };

  const handlePlaySample = (itemTitle: string) => {
    Alert.alert(
      'Muestra de Audio / Video',
      `Simulación de reproducción para "${itemTitle}".\nLa arquitectura está lista para streaming de audio/video en el futuro.`
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* ── BANNER HERO & AVATAR ── */}
        <ImageBackground source={{ uri: artist.bannerUrl }} style={styles.bannerImage}>
          <LinearGradient
            colors={['rgba(2,2,5,0.4)', 'rgba(2,2,5,0.7)', '#020205']}
            style={styles.bannerGradient}
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

            {/* ARTIST HERO META */}
            <View style={styles.heroContent}>
              <Image source={{ uri: artist.avatarUrl }} style={styles.avatar} />
              <View style={styles.heroInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={styles.artistName}>{artist.name}</Text>
                  {artist.verified && <CheckCircle2 size={18} color="#818cf8" fill="#4f46e5" />}
                </View>
                <Text style={styles.artistRole}>{artist.role}</Text>
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <MapPin size={12} color="#a1a1aa" />
                    <Text style={styles.metaText}>{artist.location}</Text>
                  </View>
                  <Text style={styles.metaDot}>·</Text>
                  <View style={styles.metaItem}>
                    <Star size={12} color="#fbbf24" fill="#fbbf24" />
                    <Text style={styles.ratingText}>{artist.rating}</Text>
                  </View>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.followersText}>{formatNumber(artist.followersCount)} Fans</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>

        {/* ── GENRES TAGS ── */}
        <View style={styles.genresContainer}>
          {artist.genres.map((genre, idx) => (
            <View key={idx} style={styles.genreChip}>
              <Sparkles size={10} color="#818cf8" />
              <Text style={styles.genreText}>{genre}</Text>
            </View>
          ))}
        </View>

        {/* ── NAVEGACIÓN POR PESTAÑAS (TABS) ── */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'music' && styles.activeTabButton]}
            onPress={() => setActiveTab('music')}
          >
            <Disc size={16} color={activeTab === 'music' ? '#818cf8' : '#71717a'} />
            <Text style={[styles.tabText, activeTab === 'music' && styles.activeTabText]}>Música & Sets</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'events' && styles.activeTabButton]}
            onPress={() => setActiveTab('events')}
          >
            <Calendar size={16} color={activeTab === 'events' ? '#818cf8' : '#71717a'} />
            <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>
              Eventos ({artist.upcomingEvents.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'info' && styles.activeTabButton]}
            onPress={() => setActiveTab('info')}
          >
            <Sparkles size={16} color={activeTab === 'info' ? '#818cf8' : '#71717a'} />
            <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>Bio & Info</Text>
          </TouchableOpacity>
        </View>

        {/* ── CONTENIDO SEGÚN LA PESTAÑA SELECCIONADA ── */}
        <View style={styles.tabContentContainer}>
          
          {/* 🎵 PESTAÑA: MÚSICA & SETS */}
          {activeTab === 'music' && (
            <View>
              {/* SUB-TABS: TRACKS / SETS / VIDEOS */}
              <View style={styles.subTabsRow}>
                <TouchableOpacity
                  style={[styles.subTab, musicContentType === 'tracks' && styles.activeSubTab]}
                  onPress={() => setMusicContentType('tracks')}
                >
                  <Music size={14} color={musicContentType === 'tracks' ? '#fff' : '#71717a'} />
                  <Text style={[styles.subTabText, musicContentType === 'tracks' && styles.activeSubTabText]}>
                    Tracks ({artist.tracks.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.subTab, musicContentType === 'sets' && styles.activeSubTab]}
                  onPress={() => setMusicContentType('sets')}
                >
                  <Radio size={14} color={musicContentType === 'sets' ? '#fff' : '#71717a'} />
                  <Text style={[styles.subTabText, musicContentType === 'sets' && styles.activeSubTabText]}>
                    DJ Sets ({artist.sets.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.subTab, musicContentType === 'videos' && styles.activeSubTab]}
                  onPress={() => setMusicContentType('videos')}
                >
                  <Tv size={14} color={musicContentType === 'videos' ? '#fff' : '#71717a'} />
                  <Text style={[styles.subTabText, musicContentType === 'videos' && styles.activeSubTabText]}>
                    Videos ({artist.videos.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* CONTENIDO TRACKS */}
              {musicContentType === 'tracks' && (
                <View style={styles.listSection}>
                  {artist.tracks.length === 0 ? (
                    <Text style={styles.emptyText}>No hay tracks lanzados aún.</Text>
                  ) : (
                    artist.tracks.map((track) => (
                      <View key={track.id} style={styles.mediaCard}>
                        <Image source={{ uri: track.coverUrl }} style={styles.mediaCover} />
                        <View style={styles.mediaInfo}>
                          <Text style={styles.mediaTitle} numberOfLines={1}>{track.title}</Text>
                          <Text style={styles.mediaSub}>
                            {track.album ? `${track.album} · ` : ''}{track.genre}
                          </Text>
                          <View style={styles.mediaStats}>
                            <Clock size={11} color="#71717a" />
                            <Text style={styles.mediaStatText}>{track.duration}</Text>
                            <Text style={styles.metaDot}>·</Text>
                            <Text style={styles.mediaStatText}>{formatNumber(track.playsCount)} plays</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.playButton}
                          onPress={() => handlePlaySample(track.title)}
                        >
                          <Play size={16} color="#fff" fill="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* CONTENIDO SETS */}
              {musicContentType === 'sets' && (
                <View style={styles.listSection}>
                  {artist.sets.length === 0 ? (
                    <Text style={styles.emptyText}>No hay DJ Sets registrados aún.</Text>
                  ) : (
                    artist.sets.map((set) => (
                      <View key={set.id} style={styles.mediaCard}>
                        <Image source={{ uri: set.coverUrl }} style={styles.mediaCover} />
                        <View style={styles.mediaInfo}>
                          <View style={styles.liveBadge}>
                            <Radio size={10} color="#ec4899" />
                            <Text style={styles.liveBadgeText}>LIVE SET</Text>
                          </View>
                          <Text style={styles.mediaTitle} numberOfLines={1}>{set.title}</Text>
                          <Text style={styles.mediaSub}>📍 {set.recordedAt}</Text>
                          <View style={styles.mediaStats}>
                            <Clock size={11} color="#71717a" />
                            <Text style={styles.mediaStatText}>{set.duration}</Text>
                            <Text style={styles.metaDot}>·</Text>
                            <Text style={styles.mediaStatText}>{formatNumber(set.playsCount)} escuchas</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.playButton}
                          onPress={() => handlePlaySample(set.title)}
                        >
                          <Play size={16} color="#fff" fill="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* CONTENIDO VIDEOS */}
              {musicContentType === 'videos' && (
                <View style={styles.listSection}>
                  {artist.videos.length === 0 ? (
                    <Text style={styles.emptyText}>No hay videos publicados aún.</Text>
                  ) : (
                    artist.videos.map((vid) => (
                      <TouchableOpacity
                        key={vid.id}
                        style={styles.videoCard}
                        onPress={() => handlePlaySample(vid.title)}
                        activeOpacity={0.85}
                      >
                        <Image source={{ uri: vid.thumbnailUrl }} style={styles.videoThumbnail} />
                        <View style={styles.videoOverlay}>
                          <View style={styles.videoPlayIcon}>
                            <Play size={20} color="#fff" fill="#fff" />
                          </View>
                          <View style={styles.videoDurationBadge}>
                            <Text style={styles.videoDurationText}>{vid.duration}</Text>
                          </View>
                        </View>
                        <View style={styles.videoDetails}>
                          <Text style={styles.videoTitle} numberOfLines={2}>{vid.title}</Text>
                          <View style={styles.mediaStats}>
                            <Eye size={12} color="#71717a" />
                            <Text style={styles.mediaStatText}>{formatNumber(vid.viewsCount)} vistas</Text>
                            <Text style={styles.metaDot}>·</Text>
                            <Text style={styles.mediaStatText}>{vid.recordedAt}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}

              {/* CARD DE ARQUITECTURA DE PROMOCIÓN */}
              <View style={styles.promoBanner}>
                <Sparkles size={20} color="#818cf8" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.promoBannerTitle}>Plataforma de Promoción de Artistas</Text>
                  <Text style={styles.promoBannerText}>
                    En futuras actualizaciones, los artistas validados podrán subir sus propios tracks, promocionar live sets y sincronizar su agenda en vivo.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* 📅 PESTAÑA: PRÓXIMOS EVENTOS */}
          {activeTab === 'events' && (
            <View style={styles.listSection}>
              <Text style={styles.sectionHeaderTitle}>Próximas Presentaciones</Text>
              {artist.upcomingEvents.length === 0 ? (
                <Text style={styles.emptyText}>Este artista no tiene próximos eventos programados.</Text>
              ) : (
                artist.upcomingEvents.map((evt) => (
                  <TouchableOpacity
                    key={evt.eventId}
                    style={styles.upcomingEventCard}
                    onPress={() => router.push(`/events/${evt.eventId}` as any)}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: evt.imageUrl }} style={styles.eventImage} />
                    <View style={styles.eventCardBody}>
                      <View style={styles.eventTimeBadge}>
                        <Clock size={11} color="#818cf8" />
                        <Text style={styles.eventTimeBadgeText}>{evt.performanceTime}</Text>
                      </View>
                      <Text style={styles.eventCardTitle}>{evt.eventTitle}</Text>
                      <Text style={styles.eventCardDate}>{evt.date}</Text>
                      <View style={styles.eventCardLocation}>
                        <MapPin size={12} color="#71717a" />
                        <Text style={styles.eventCardLocationText}>{evt.location}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.goToEventButton}
                        onPress={() => router.push(`/events/${evt.eventId}` as any)}
                      >
                        <Text style={styles.goToEventButtonText}>Ver Evento & Boletas →</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* ℹ️ PESTAÑA: BIO & INFO */}
          {activeTab === 'info' && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionHeaderTitle}>Biografía Profesional</Text>
              <Text style={styles.fullBioText}>{artist.fullBio}</Text>

              <View style={styles.infoGrid}>
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardLabel}>GÉNEROS PRINCIPALES</Text>
                  <Text style={styles.infoCardValue}>{artist.genres.join(', ')}</Text>
                </View>
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardLabel}>ORIGEN / RESIDENCIA</Text>
                  <Text style={styles.infoCardValue}>{artist.location}</Text>
                </View>
              </View>

              {/* REDES SOCIALES */}
              <Text style={[styles.sectionHeaderTitle, { marginTop: 24 }]}>Redes Sociales & Links</Text>
              <View style={styles.socialsRow}>
                {artist.socials.instagram && (
                  <TouchableOpacity
                    style={styles.socialChip}
                    onPress={() => Linking.openURL(`https://instagram.com/${artist.socials.instagram}`)}
                  >
                    <ExternalLink size={14} color="#ec4899" />
                    <Text style={styles.socialChipText}>@{artist.socials.instagram}</Text>
                  </TouchableOpacity>
                )}
                {artist.socials.spotify && (
                  <TouchableOpacity
                    style={styles.socialChip}
                    onPress={() => Linking.openURL(`https://open.spotify.com/artist/${artist.socials.spotify}`)}
                  >
                    <ExternalLink size={14} color="#34d399" />
                    <Text style={styles.socialChipText}>Spotify</Text>
                  </TouchableOpacity>
                )}
                {artist.socials.soundcloud && (
                  <TouchableOpacity
                    style={styles.socialChip}
                    onPress={() => Linking.openURL(`https://soundcloud.com/${artist.socials.soundcloud}`)}
                  >
                    <ExternalLink size={14} color="#f97316" />
                    <Text style={styles.socialChipText}>SoundCloud</Text>
                  </TouchableOpacity>
                )}
                {artist.socials.youtube && (
                  <TouchableOpacity
                    style={styles.socialChip}
                    onPress={() => Linking.openURL(`https://youtube.com/${artist.socials.youtube}`)}
                  >
                    <ExternalLink size={14} color="#ef4444" />
                    <Text style={styles.socialChipText}>YouTube</Text>
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

  bannerImage: { width: '100%', height: 280 },
  bannerGradient: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 20 },
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
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#4f46e5', backgroundColor: '#18181b' },
  heroInfo: { flex: 1 },
  artistName: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  artistRole: { color: '#818cf8', fontSize: 12, fontWeight: 'bold', marginTop: 2, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: '#a1a1aa', fontSize: 11 },
  ratingText: { color: '#fbbf24', fontSize: 11, fontWeight: 'bold' },
  followersText: { color: '#34d399', fontSize: 11, fontWeight: 'bold' },
  metaDot: { color: '#52525b', fontSize: 12 },

  genresContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  genreChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(129,140,248,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(129,140,248,0.2)' },
  genreText: { color: '#818cf8', fontSize: 10, fontWeight: 'bold' },

  tabsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 20 },
  tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTabButton: { borderBottomColor: '#4f46e5' },
  tabText: { color: '#71717a', fontSize: 12, fontWeight: 'bold' },
  activeTabText: { color: '#fff' },

  tabContentContainer: { padding: 20 },

  subTabsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  subTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.03)', paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  activeSubTab: { backgroundColor: 'rgba(99,102,241,0.2)', borderColor: '#6366f1' },
  subTabText: { color: '#71717a', fontSize: 11, fontWeight: 'bold' },
  activeSubTabText: { color: '#fff' },

  listSection: { gap: 12 },
  mediaCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  mediaCover: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#27272a' },
  mediaInfo: { flex: 1 },
  mediaTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  mediaSub: { color: '#818cf8', fontSize: 11, marginTop: 2 },
  mediaStats: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  mediaStatText: { color: '#71717a', fontSize: 10 },
  playButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center' },

  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(236,72,153,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 2 },
  liveBadgeText: { color: '#ec4899', fontSize: 8, fontWeight: 'bold' },

  videoCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  videoThumbnail: { width: '100%', height: 170, backgroundColor: '#18181b' },
  videoOverlay: { ...StyleSheet.absoluteFill, height: 170, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  videoPlayIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(79,70,229,0.9)', justifyContent: 'center', alignItems: 'center' },
  videoDurationBadge: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  videoDurationText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  videoDetails: { padding: 14 },
  videoTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  promoBanner: { flexDirection: 'row', gap: 12, backgroundColor: 'rgba(99,102,241,0.08)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)', marginTop: 20 },
  promoBannerTitle: { color: '#fff', fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  promoBannerText: { color: '#a1a1aa', fontSize: 11, lineHeight: 16 },

  emptyText: { color: '#71717a', fontSize: 13, textAlign: 'center', paddingVertical: 20 },

  sectionHeaderTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  upcomingEventCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 12 },
  eventImage: { width: '100%', height: 130, backgroundColor: '#18181b' },
  eventCardBody: { padding: 16 },
  eventTimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(129,140,248,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 8 },
  eventTimeBadgeText: { color: '#818cf8', fontSize: 10, fontWeight: 'bold' },
  eventCardTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  eventCardDate: { color: '#34d399', fontSize: 12, fontWeight: 'bold', marginBottom: 6 },
  eventCardLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14 },
  eventCardLocationText: { color: '#71717a', fontSize: 11 },
  goToEventButton: { backgroundColor: 'rgba(79,70,229,0.2)', borderWidth: 1, borderColor: '#4f46e5', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  goToEventButtonText: { color: '#818cf8', fontSize: 12, fontWeight: 'bold' },

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
