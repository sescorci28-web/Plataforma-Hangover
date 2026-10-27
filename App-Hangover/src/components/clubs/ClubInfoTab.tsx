import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  SafeAreaView,
  Dimensions,
  Linking,
  Platform,
  ActivityIndicator,
  Share,
} from 'react-native';
import {
  MapPin,
  Clock,
  Globe,
  MessageCircle,
  CreditCard,
  Sparkles,
  Navigation,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Play,
  Film,
  Phone,
  ShieldCheck,
  Users,
  Share2,
  Calendar,
  Info,
  ExternalLink,
  Store,
} from 'lucide-react-native';
import Svg, { Rect, Path, Line, Circle } from 'react-native-svg';
import * as Clipboard from 'expo-clipboard';
import { useVideoPlayer, VideoView } from 'expo-video';

import { supabase } from '@/lib/supabase';
import { ClubDetail } from '@/types/club.types';
import { ClubTheme } from '@/constants/clubTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ----------------------------------------------------------------------------
// ICONOS SVG NATIVOS PARA REDES SOCIALES
// ----------------------------------------------------------------------------
function InstagramIcon({ size = 18, color = '#F900BF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect width={20} height={20} x="2" y="2" rx="5" ry="5" />
      <Path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <Line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </Svg>
  );
}

function TikTokIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </Svg>
  );
}

function WhatsAppIcon({ size = 18, color = '#10B981' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </Svg>
  );
}

function WazeIcon({ size = 18, color = '#38BDF8' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="9" />
      <Path d="M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 0 0 5 0" />
    </Svg>
  );
}

// ----------------------------------------------------------------------------
// TIPOS DE MEDIOS MULTIMEDIA
// ----------------------------------------------------------------------------
export interface ClubMediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  title: string;
  source: 'club' | 'storage' | 'event';
}

// ----------------------------------------------------------------------------
// REPRODUCTOR DE VIDEO A PANTALLA COMPLETA
// ----------------------------------------------------------------------------
function VideoPlayerItem({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.play();
  });

  return (
    <VideoView
      style={styles.fullscreenVideo}
      player={player}
      allowsPictureInPicture={true}
      nativeControls={true}
    />
  );
}

// ----------------------------------------------------------------------------
// VISOR MULTIMEDIA DE PANTALLA COMPLETA
// ----------------------------------------------------------------------------
interface ClubMediaViewerModalProps {
  visible: boolean;
  mediaItems: ClubMediaItem[];
  initialIndex: number;
  clubName: string;
  onClose: () => void;
}

function ClubMediaViewerModal({
  visible,
  mediaItems,
  initialIndex,
  clubName,
  onClose,
}: ClubMediaViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, mediaItems.length - 1)));
    }
  }, [visible, initialIndex, mediaItems.length]);

  if (!visible || mediaItems.length === 0) return null;

  const currentMedia = mediaItems[currentIndex] || mediaItems[0];

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(mediaItems.length - 1); // Wrap
    }
  };

  const handleNext = () => {
    if (currentIndex < mediaItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0); // Wrap
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Mira este contenido de ${clubName} en Hangover:\n${currentMedia.url}`,
      });
    } catch {
      // Ignorar
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.viewerContainer}>
        {/* BARRA SUPERIOR DE CONTROLES */}
        <View style={styles.viewerTopBar}>
          <TouchableOpacity
            style={styles.viewerCloseBtn}
            onPress={onClose}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            accessibilityLabel="Cerrar visor de fotos"
          >
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.viewerHeaderCenter}>
            <Text style={styles.viewerClubName} numberOfLines={1}>
              {clubName}
            </Text>
            <Text style={styles.viewerCounter}>
              {currentIndex + 1} de {mediaItems.length}
              {currentMedia.type === 'video' ? ' • Video' : ''}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.viewerShareBtn}
            onPress={handleShare}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            accessibilityLabel="Compartir contenido"
          >
            <Share2 size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ÁREA CENTRAL DE VISUALIZACIÓN */}
        <View style={styles.viewerMediaArea}>
          {currentMedia.type === 'video' ? (
            <VideoPlayerItem uri={currentMedia.url} />
          ) : (
            <Image
              source={{ uri: currentMedia.url }}
              style={styles.viewerImage}
              resizeMode="contain"
            />
          )}

          {/* CONTROLES DE NAVEGACIÓN FLOTANTES */}
          {mediaItems.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.viewerNavArrow, styles.viewerNavArrowLeft]}
                onPress={handlePrev}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                accessibilityLabel="Foto anterior"
              >
                <ChevronLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.viewerNavArrow, styles.viewerNavArrowRight]}
                onPress={handleNext}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                accessibilityLabel="Foto siguiente"
              >
                <ChevronRight size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* BARRA INFERIOR CON TÍTULO Y MINIATURAS */}
        <View style={styles.viewerBottomBar}>
          {currentMedia.title ? (
            <Text style={styles.viewerMediaTitle} numberOfLines={1}>
              {currentMedia.title}
            </Text>
          ) : null}

          {/* Carrusel de miniaturas */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.viewerThumbsContent}
          >
            {mediaItems.map((item, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <TouchableOpacity
                  key={item.id + idx}
                  style={[
                    styles.viewerThumbItem,
                    isSelected && styles.viewerThumbItemSelected,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setCurrentIndex(idx)}
                >
                  <Image source={{ uri: item.url }} style={styles.viewerThumbImg} />
                  {item.type === 'video' && (
                    <View style={styles.viewerThumbVideoOverlay}>
                      <Film size={10} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ----------------------------------------------------------------------------
// ESTRUCTURA DE DÍAS Y HORARIOS PARSEADOS
// ----------------------------------------------------------------------------
interface DaySchedule {
  dayName: string;
  hours: string;
  isToday: boolean;
  isClosed: boolean;
}

const ORDERED_DAYS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

// ----------------------------------------------------------------------------
// COMPONENTE PRINCIPAL CLUB INFO TAB
// ----------------------------------------------------------------------------
interface ClubInfoTabProps {
  club: ClubDetail;
}

export const ClubInfoTab: React.FC<ClubInfoTabProps> = ({ club }) => {
  // Estados para expandir descripción y horarios
  const [isDescExpanded, setIsDescExpanded] = useState<boolean>(false);
  const [isHoursExpanded, setIsHoursExpanded] = useState<boolean>(false);

  // Estado para retroalimentación de copiado de dirección
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);

  // Estados del visor multimedia
  const [isViewerVisible, setIsViewerVisible] = useState<boolean>(false);
  const [viewerInitialIndex, setViewerInitialIndex] = useState<number>(0);

  // Lista de medios multimedia combinada (club + storage oficial)
  const [mediaList, setMediaList] = useState<ClubMediaItem[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState<boolean>(false);

  // 1. CARGA INTELIGENTE Y AUTÓNOMA DE MEDIOS MULTIMEDIA DESDE SUPABASE
  useEffect(() => {
    let isMounted = true;

    const loadOfficialMedia = async () => {
      setIsLoadingMedia(true);
      const items: ClubMediaItem[] = [];
      const seenUrls = new Set<string>();

      const addMediaItem = (url?: string | null, type: 'image' | 'video' = 'image', title = '', source: 'club' | 'storage' | 'event' = 'club') => {
        if (!url || seenUrls.has(url)) return;
        seenUrls.add(url);
        items.push({
          id: url,
          url,
          type,
          title,
          source,
        });
      };

      // 1.1 Medios directos del registro del club
      if (club.video_hero) {
        addMediaItem(club.video_hero, 'video', 'Video destacado', 'club');
      }
      if (club.hero_image) {
        addMediaItem(club.hero_image, 'image', 'Portada principal', 'club');
      }
      if (club.banner_image) {
        addMediaItem(club.banner_image, 'image', 'Ambiente del lugar', 'club');
      }
      if (club.logo) {
        addMediaItem(club.logo, 'image', 'Logo oficial', 'club');
      }
      if (Array.isArray(club.gallery)) {
        club.gallery.forEach((gUrl, idx) => {
          if (gUrl) {
            const isVid = gUrl.endsWith('.mp4') || gUrl.endsWith('.mov') || gUrl.endsWith('.webm');
            addMediaItem(gUrl, isVid ? 'video' : 'image', `Espacio ${idx + 1}`, 'club');
          }
        });
      }

      // 1.2 Medios adicionales publicados en Storage ('club-media')
      try {
        const folders = ['cover', 'events', 'gallery'];
        for (const f of folders) {
          const { data: files } = await supabase.storage
            .from('club-media')
            .list(`clubs/${club.id}/${f}`, { limit: 10 });

          if (files && isMounted) {
            for (const file of files) {
              if (!file.name || file.name.startsWith('.')) continue;
              const { data: urlData } = supabase.storage
                .from('club-media')
                .getPublicUrl(`clubs/${club.id}/${f}/${file.name}`);

              if (urlData?.publicUrl) {
                const isVid = file.name.endsWith('.mp4') || file.name.endsWith('.mov');
                const title = f === 'events' ? 'Evento en sala' : f === 'cover' ? 'Ambiente' : 'Galería';
                addMediaItem(urlData.publicUrl, isVid ? 'video' : 'image', title, 'storage');
              }
            }
          }
        }
      } catch (err) {
        console.warn('[ClubInfoTab] Nota: no se pudieron listar archivos extra de storage:', err);
      }

      if (isMounted) {
        setMediaList(items);
        setIsLoadingMedia(false);
      }
    };

    loadOfficialMedia();

    return () => {
      isMounted = false;
    };
  }, [club.id, club.hero_image, club.banner_image, club.logo, club.video_hero, club.gallery]);

  // 2. PARSEO ELEGANTE DE HORARIOS DE APERTURA SEMANALES
  const weeklySchedule: DaySchedule[] = useMemo(() => {
    // Determinar día actual en Colombia (UTC-5) de forma segura para Hermes
    let currentDayIndex = 0;
    try {
      const now = new Date();
      // Cálculo numérico directo de UTC-5 (evita incompatibilidades de date string en Hermes)
      const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
      const colombiaTime = new Date(utcTime - 3600000 * 5);
      const dayVal = colombiaTime.getDay();
      currentDayIndex = !isNaN(dayVal) && dayVal >= 0 && dayVal <= 6 ? dayVal : now.getDay();
    } catch {
      currentDayIndex = new Date().getDay();
    }

    if (isNaN(currentDayIndex) || currentDayIndex < 0 || currentDayIndex > 6) {
      currentDayIndex = new Date().getDay();
    }
    if (isNaN(currentDayIndex) || currentDayIndex < 0 || currentDayIndex > 6) {
      currentDayIndex = 0;
    }

    const dayNameByIndex = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const todayName = dayNameByIndex[currentDayIndex] || 'Domingo';

    const rawHours = (club.opening_hours || '').trim();

    // Mapear cada uno de los 7 días ordenados de Lunes a Domingo
    return ORDERED_DAYS.map((day) => {
      const isToday = Boolean(day && todayName && day.toLowerCase() === todayName.toLowerCase());
      let hours = 'Cerrado';
      let isClosed = true;

      if (rawHours) {
        // Buscar coincidencia en la cadena de texto (ej: "Jueves 20:00 - 03:00")
        const lowerRaw = rawHours.toLowerCase();
        const lowerDay = day.toLowerCase();
        // Abreviaciones (ej: jue, vie, sab, dom)
        const shortDay = lowerDay.substring(0, 3);

        const regex = new RegExp(`(${lowerDay}|${shortDay})[^,\\n\\|]*`, 'i');
        const match = lowerRaw.match(regex);

        if (match && match[0]) {
          const matchedStr = match[0];
          // Extraer la parte horaria después del nombre del día
          const timePart = matchedStr.replace(new RegExp(`^(${lowerDay}|${shortDay})\\s*[:\\-]?\\s*`, 'i'), '').trim();
          if (timePart && !timePart.toLowerCase().includes('cerrado')) {
            hours = timePart;
            isClosed = false;
          }
        }
      }

      return {
        dayName: day,
        hours,
        isToday,
        isClosed,
      };
    });
  }, [club.opening_hours]);

  // Filtrar los días a mostrar según si está expandido o colapsado
  const displayedSchedule = useMemo(() => {
    if (isHoursExpanded) return weeklySchedule;
    // En vista colapsada, mostrar hoy + los días que abren (o máximo 4)
    const openDays = weeklySchedule.filter((d) => !d.isClosed || d.isToday);
    return openDays.length > 0 ? openDays.slice(0, 4) : weeklySchedule.slice(0, 4);
  }, [weeklySchedule, isHoursExpanded]);

  // 3. ACCIONES DE NAVEGACIÓN Y MAPAS
  const destinationQuery = encodeURIComponent(`${club.name} ${club.address || ''} ${club.city || ''}`);

  const handleOpenGoogleMaps = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${destinationQuery}`,
      android: `geo:0,0?q=${destinationQuery}`,
      default: `https://www.google.com/maps/search/?api=1&query=${destinationQuery}`,
    });

    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${destinationQuery}`);
    });
  };

  const handleOpenWaze = () => {
    const wazeUrl = `https://waze.com/ul?q=${destinationQuery}&navigate=yes`;
    Linking.openURL(wazeUrl).catch(() => {
      handleOpenGoogleMaps();
    });
  };

  const handleCopyAddress = async () => {
    const fullAddress = [club.address, club.city].filter(Boolean).join(', ');
    if (!fullAddress) return;

    try {
      await Clipboard.setStringAsync(fullAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2400);
    } catch {
      // Ignorar fallback
    }
  };

  // 4. ACCIONES DE CONTACTO Y REDES
  const handleOpenWhatsApp = () => {
    if (!club.whatsapp) return;
    const clean = club.whatsapp.replace(/\D/g, '');
    const phone = clean.startsWith('57') ? clean : `57${clean}`;
    const text = encodeURIComponent(`Hola, quisiera más información sobre ${club.name} desde Hangover.`);
    Linking.openURL(`https://wa.me/${phone}?text=${text}`).catch(() => {});
  };

  const handleOpenInstagram = () => {
    if (!club.instagram) return;
    const username = club.instagram.replace('@', '').trim();
    Linking.openURL(`https://instagram.com/${username}`).catch(() => {});
  };

  const handleOpenTikTok = () => {
    if (!club.tiktok) return;
    const handle = club.tiktok.replace('@', '').trim();
    Linking.openURL(`https://tiktok.com/@${handle}`).catch(() => {});
  };

  const handleOpenWebsite = () => {
    if (!club.website) return;
    let url = club.website.trim();
    if (!url.startsWith('http')) url = `https://${url}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleCallPhone = () => {
    if (!club.whatsapp) return;
    const clean = club.whatsapp.replace(/\D/g, '');
    Linking.openURL(`tel:${clean}`).catch(() => {});
  };

  const hasAnySocial = Boolean(
    club.whatsapp || club.instagram || club.tiktok || club.website
  );

  const openViewerAtIndex = (index: number) => {
    setViewerInitialIndex(index);
    setIsViewerVisible(true);
  };

  // Descripción con límite para expandir
  const descriptionText = club.description?.trim() || '';
  const isLongDescription = descriptionText.length > 150;
  const renderedDescription =
    isLongDescription && !isDescExpanded
      ? `${descriptionText.substring(0, 150)}...`
      : descriptionText;

  return (
    <View style={styles.container}>
      {/* ==================================================================== */}
      {/* 1. PRESENTACIÓN DEL ESTABLECIMIENTO (COMPACT BRAND HEADER)           */}
      {/* ==================================================================== */}
      <View style={styles.cardSurface}>
        <View style={styles.brandRow}>
          {club.logo ? (
            <Image source={{ uri: club.logo }} style={styles.brandLogo} />
          ) : (
            <View style={styles.brandLogoPlaceholder}>
              <Store size={22} color="#9900F0" />
            </View>
          )}

          <View style={styles.brandInfoCol}>
            <Text style={styles.brandName} numberOfLines={1}>
              {club.name}
            </Text>
            <View style={styles.brandSubRow}>
              <Text style={styles.brandCategory}>{club.club_type || 'Discoteca'}</Text>
              <Text style={styles.brandDot}>•</Text>
              <Text style={styles.brandCity}>{club.city || 'Colombia'}</Text>
            </View>
          </View>
        </View>

        {/* Barra compacta de estado y acceso a fotos */}
        <View style={styles.brandStatusStrip}>
          <View
            style={[
              styles.liveStatusBadge,
              club.isOpen ? styles.liveStatusOpen : styles.liveStatusClosed,
            ]}
          >
            <View
              style={[
                styles.liveStatusDot,
                club.isOpen ? styles.liveStatusDotOpen : styles.liveStatusDotClosed,
              ]}
            />
            <Text
              style={[
                styles.liveStatusText,
                club.isOpen ? styles.liveStatusTextOpen : styles.liveStatusTextClosed,
              ]}
            >
              {club.isOpen ? 'Abierto ahora' : 'Cerrado por ahora'}
            </Text>
          </View>

          {mediaList.length > 0 && (
            <TouchableOpacity
              style={styles.mediaCountBadge}
              activeOpacity={0.8}
              onPress={() => openViewerAtIndex(0)}
            >
              <Sparkles size={12} color="#FF85B3" />
              <Text style={styles.mediaCountText}>
                {mediaList.length} {mediaList.length === 1 ? 'medio' : 'fotos y videos'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ==================================================================== */}
      {/* 2. SECCIÓN: SOBRE EL LUGAR                                           */}
      {/* ==================================================================== */}
      {descriptionText ? (
        <View style={styles.cardSurface}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Sobre el lugar</Text>
          </View>

          <Text style={styles.descriptionParagraph}>
            {renderedDescription}
          </Text>

          {isLongDescription && (
            <TouchableOpacity
              style={styles.expandTextBtn}
              activeOpacity={0.75}
              onPress={() => setIsDescExpanded(!isDescExpanded)}
            >
              <Text style={styles.expandTextBtnLabel}>
                {isDescExpanded ? 'Leer menos' : 'Leer descripción completa'}
              </Text>
              {isDescExpanded ? (
                <ChevronUp size={13} color="#C4B5FD" />
              ) : (
                <ChevronDown size={13} color="#C4B5FD" />
              )}
            </TouchableOpacity>
          )}

          {/* Imagen destacada de portada si existe */}
          {club.hero_image || club.banner_image ? (
            <TouchableOpacity
              style={styles.featuredCoverWrapper}
              activeOpacity={0.9}
              onPress={() => openViewerAtIndex(0)}
            >
              <Image
                source={{ uri: club.hero_image || club.banner_image || '' }}
                style={styles.featuredCoverImage}
                resizeMode="cover"
              />
              <View style={styles.featuredCoverOverlay}>
                <View style={styles.featuredCoverPill}>
                  <Sparkles size={11} color="#FFFFFF" />
                  <Text style={styles.featuredCoverPillText}>Ver foto completa</Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {/* ==================================================================== */}
      {/* 3. GALERÍA MULTIMEDIA INTERACTIVA («DESCUBRE EL LUGAR»)             */}
      {/* ==================================================================== */}
      <View style={styles.cardSurface}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>Descubre el lugar</Text>
            <Text style={styles.cardSubtitle}>
              Ambiente, espacios y momentos en vivo
            </Text>
          </View>

          {mediaList.length > 0 && (
            <TouchableOpacity
              style={styles.viewAllGalleryBtn}
              activeOpacity={0.8}
              onPress={() => openViewerAtIndex(0)}
            >
              <Text style={styles.viewAllGalleryBtnText}>
                Ver toda ({mediaList.length})
              </Text>
              <ChevronRight size={13} color="#F900BF" />
            </TouchableOpacity>
          )}
        </View>

        {isLoadingMedia && mediaList.length === 0 ? (
          <View style={styles.galleryLoadingBox}>
            <ActivityIndicator size="small" color="#9900F0" />
            <Text style={styles.galleryLoadingText}>Cargando galería oficial...</Text>
          </View>
        ) : mediaList.length === 0 ? (
          <View style={styles.emptyGalleryBox}>
            <Sparkles size={24} color="#71717A" />
            <Text style={styles.emptyGalleryTitle}>Galería en actualización</Text>
            <Text style={styles.emptyGallerySubtitle}>
              Próximamente fotos exclusivas del ambiente y eventos de {club.name}.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryCarouselContent}
          >
            {mediaList.map((item, idx) => (
              <TouchableOpacity
                key={item.id + idx}
                style={styles.galleryCard}
                activeOpacity={0.85}
                onPress={() => openViewerAtIndex(idx)}
              >
                <Image
                  source={{ uri: item.url }}
                  style={styles.galleryCardImage}
                  resizeMode="cover"
                />

                <View style={styles.galleryCardOverlay}>
                  {item.type === 'video' ? (
                    <View style={styles.videoBadgeTag}>
                      <Play size={10} color="#FFFFFF" fill="#FFFFFF" />
                      <Text style={styles.videoBadgeTagText}>Video</Text>
                    </View>
                  ) : null}

                  {item.title ? (
                    <View style={styles.galleryCardTitlePill}>
                      <Text style={styles.galleryCardTitleText} numberOfLines={1}>
                        {item.title}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* ==================================================================== */}
      {/* 4. HORARIOS DE APERTURA                                              */}
      {/* ==================================================================== */}
      <View style={styles.cardSurface}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeftGroup}>
            <View style={styles.headerIconCircle}>
              <Clock size={16} color="#A78BFA" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Horarios de apertura</Text>
              <Text style={styles.cardSubtitle}>
                Días y horas de servicio en barra y salón
              </Text>
            </View>
          </View>
        </View>

        {/* Tabla organizada de horarios */}
        <View style={styles.scheduleTable}>
          {displayedSchedule.map((schedule, i) => (
            <View
              key={schedule.dayName}
              style={[
                styles.scheduleRow,
                schedule.isToday && styles.scheduleRowToday,
                i === displayedSchedule.length - 1 && styles.scheduleRowLast,
              ]}
            >
              <View style={styles.scheduleDayCol}>
                <Text
                  style={[
                    styles.scheduleDayName,
                    schedule.isToday && styles.scheduleDayNameToday,
                  ]}
                >
                  {schedule.dayName}
                </Text>
                {schedule.isToday && (
                  <View style={styles.todayPill}>
                    <Text style={styles.todayPillText}>Hoy</Text>
                  </View>
                )}
              </View>

              <View style={styles.scheduleHoursCol}>
                <Text
                  style={[
                    styles.scheduleHoursText,
                    schedule.isClosed && styles.scheduleHoursClosed,
                    schedule.isToday && !schedule.isClosed && styles.scheduleHoursToday,
                  ]}
                >
                  {schedule.hours}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Botón para expandir/contraer los 7 días */}
        {weeklySchedule.length > 4 && (
          <TouchableOpacity
            style={styles.expandHoursBtn}
            activeOpacity={0.78}
            onPress={() => setIsHoursExpanded(!isHoursExpanded)}
          >
            <Text style={styles.expandHoursBtnText}>
              {isHoursExpanded ? 'Mostrar menos días' : 'Ver semana completa (7 días)'}
            </Text>
            {isHoursExpanded ? (
              <ChevronUp size={13} color="#C4B5FD" />
            ) : (
              <ChevronDown size={13} color="#C4B5FD" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* ==================================================================== */}
      {/* 5. UBICACIÓN Y CÓMO LLEGAR                                           */}
      {/* ==================================================================== */}
      <View style={styles.cardSurface}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeftGroup}>
            <View style={[styles.headerIconCircle, { backgroundColor: 'rgba(71, 0, 216, 0.2)' }]}>
              <MapPin size={16} color="#A78BFA" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Ubicación & Acceso</Text>
              <Text style={styles.cardSubtitle}>
                {club.city || 'Colombia'} • Dirección oficial
              </Text>
            </View>
          </View>
        </View>

        {/* Tarjeta de dirección legible */}
        <View style={styles.addressDisplayBox}>
          <View style={styles.addressIconWrap}>
            <MapPin size={18} color="#FF85B3" />
          </View>
          <View style={styles.addressTextCol}>
            <Text style={styles.addressMainText}>
              {club.address || 'Ubicación céntrica de la ciudad'}
            </Text>
            <Text style={styles.addressSubText}>
              {club.city ? `${club.city}, Colombia` : 'Colombia'}
            </Text>
          </View>
        </View>

        {/* Botón principal: Cómo llegar (Google Maps / Waze) */}
        <TouchableOpacity
          style={styles.primaryNavBtn}
          activeOpacity={0.84}
          onPress={handleOpenGoogleMaps}
        >
          <Navigation size={16} color="#FFFFFF" />
          <Text style={styles.primaryNavBtnText}>
            Cómo llegar (Google Maps / Waze)
          </Text>
        </TouchableOpacity>

        {/* Acciones secundarias: Waze y Copiar dirección */}
        <View style={styles.locationSecondaryActions}>
          <TouchableOpacity
            style={styles.secondaryActionBtn}
            activeOpacity={0.8}
            onPress={handleOpenWaze}
          >
            <WazeIcon size={14} color="#38BDF8" />
            <Text style={styles.secondaryActionBtnText}>Abrir en Waze</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryActionBtn,
              copiedAddress && styles.secondaryActionBtnSuccess,
            ]}
            activeOpacity={0.8}
            onPress={handleCopyAddress}
          >
            {copiedAddress ? (
              <>
                <Check size={14} color="#10B981" />
                <Text style={[styles.secondaryActionBtnText, { color: '#10B981' }]}>
                  ¡Copiada!
                </Text>
              </>
            ) : (
              <>
                <Copy size={14} color="#C4B5FD" />
                <Text style={styles.secondaryActionBtnText}>Copiar dirección</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ==================================================================== */}
      {/* 6. CONTACTO Y REDES SOCIALES                                         */}
      {/* ==================================================================== */}
      {hasAnySocial && (
        <View style={styles.cardSurface}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Contacto & Redes</Text>
              <Text style={styles.cardSubtitle}>
                Canales oficiales de atención y comunidad
              </Text>
            </View>
          </View>

          <View style={styles.socialChannelsGrid}>
            {/* WhatsApp */}
            {club.whatsapp ? (
              <TouchableOpacity
                style={styles.socialChannelCard}
                activeOpacity={0.8}
                onPress={handleOpenWhatsApp}
              >
                <View style={[styles.socialIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <WhatsAppIcon size={18} color="#10B981" />
                </View>
                <View style={styles.socialTextCol}>
                  <Text style={styles.socialChannelName}>WhatsApp</Text>
                  <Text style={styles.socialChannelHint}>Chat directo y reservas</Text>
                </View>
                <ChevronRight size={14} color="#71717A" />
              </TouchableOpacity>
            ) : null}

            {/* Instagram */}
            {club.instagram ? (
              <TouchableOpacity
                style={styles.socialChannelCard}
                activeOpacity={0.8}
                onPress={handleOpenInstagram}
              >
                <View style={[styles.socialIconCircle, { backgroundColor: 'rgba(249, 0, 191, 0.15)' }]}>
                  <InstagramIcon size={18} color="#F900BF" />
                </View>
                <View style={styles.socialTextCol}>
                  <Text style={styles.socialChannelName}>Instagram</Text>
                  <Text style={styles.socialChannelHint}>
                    {club.instagram.startsWith('@') ? club.instagram : `@${club.instagram}`}
                  </Text>
                </View>
                <ChevronRight size={14} color="#71717A" />
              </TouchableOpacity>
            ) : null}

            {/* TikTok */}
            {club.tiktok ? (
              <TouchableOpacity
                style={styles.socialChannelCard}
                activeOpacity={0.8}
                onPress={handleOpenTikTok}
              >
                <View style={[styles.socialIconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.12)' }]}>
                  <TikTokIcon size={18} color="#FFFFFF" />
                </View>
                <View style={styles.socialTextCol}>
                  <Text style={styles.socialChannelName}>TikTok</Text>
                  <Text style={styles.socialChannelHint}>Videos oficiales</Text>
                </View>
                <ChevronRight size={14} color="#71717A" />
              </TouchableOpacity>
            ) : null}

            {/* Sitio Web */}
            {club.website ? (
              <TouchableOpacity
                style={styles.socialChannelCard}
                activeOpacity={0.8}
                onPress={handleOpenWebsite}
              >
                <View style={[styles.socialIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <Globe size={18} color="#38BDF8" />
                </View>
                <View style={styles.socialTextCol}>
                  <Text style={styles.socialChannelName}>Sitio Web</Text>
                  <Text style={styles.socialChannelHint}>Página oficial</Text>
                </View>
                <ExternalLink size={14} color="#71717A" />
              </TouchableOpacity>
            ) : null}

            {/* Llamada telefónica directa si hay whatsapp o teléfono */}
            {club.whatsapp ? (
              <TouchableOpacity
                style={styles.socialChannelCard}
                activeOpacity={0.8}
                onPress={handleCallPhone}
              >
                <View style={[styles.socialIconCircle, { backgroundColor: 'rgba(167, 139, 250, 0.15)' }]}>
                  <Phone size={16} color="#A78BFA" />
                </View>
                <View style={styles.socialTextCol}>
                  <Text style={styles.socialChannelName}>Llamar directo</Text>
                  <Text style={styles.socialChannelHint}>Atención telefónica</Text>
                </View>
                <ChevronRight size={14} color="#71717A" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}

      {/* ==================================================================== */}
      {/* 7. INFORMACIÓN ADICIONAL Y CONDICIONES DE ACCESO                     */}
      {/* ==================================================================== */}
      <View style={styles.cardSurface}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>Información adicional</Text>
            <Text style={styles.cardSubtitle}>
              Políticas de acceso, métodos de pago y comodidades
            </Text>
          </View>
        </View>

        <View style={styles.additionalInfoGrid}>
          {/* Métodos de Pago */}
          <View style={styles.infoBlock}>
            <View style={styles.infoBlockTitleRow}>
              <CreditCard size={14} color="#C4B5FD" />
              <Text style={styles.infoBlockTitle}>Métodos de pago aceptados</Text>
            </View>
            <View style={styles.pillsWrap}>
              {(club.payment_methods || ['Efectivo', 'Tarjeta']).map((method, idx) => (
                <View key={idx} style={styles.infoPill}>
                  <Text style={styles.infoPillText}>{method}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Rango de Precios y Capacidad */}
          <View style={styles.twoColRow}>
            <View style={[styles.infoBlock, { flex: 1 }]}>
              <View style={styles.infoBlockTitleRow}>
                <Sparkles size={14} color="#F59E0B" />
                <Text style={styles.infoBlockTitle}>Precios</Text>
              </View>
              <Text style={styles.infoBlockValue}>
                {club.price_range || '$$'} (Moderado)
              </Text>
            </View>

            {club.capacity > 0 && (
              <View style={[styles.infoBlock, { flex: 1 }]}>
                <View style={styles.infoBlockTitleRow}>
                  <Users size={14} color="#38BDF8" />
                  <Text style={styles.infoBlockTitle}>Aforo</Text>
                </View>
                <Text style={styles.infoBlockValue}>
                  {club.capacity} personas
                </Text>
              </View>
            )}
          </View>

          {/* Políticas de Acceso y Edad */}
          <View style={styles.infoBlock}>
            <View style={styles.infoBlockTitleRow}>
              <ShieldCheck size={14} color="#10B981" />
              <Text style={styles.infoBlockTitle}>Condiciones de ingreso</Text>
            </View>
            <View style={styles.conditionsList}>
              <View style={styles.conditionItem}>
                <Check size={12} color="#10B981" />
                <Text style={styles.conditionText}>
                  +18 años únicamente • Cédula física o digital requerida
                </Text>
              </View>
              <View style={styles.conditionItem}>
                <Check size={12} color="#10B981" />
                <Text style={styles.conditionText}>
                  Código de vestimenta: Casual elegante
                </Text>
              </View>
              <View style={styles.conditionItem}>
                <Check size={12} color="#10B981" />
                <Text style={styles.conditionText}>
                  Derecho de admisión reservado según aforo
                </Text>
              </View>
            </View>
          </View>

          {/* Servicios y Comodidades (Amenities) */}
          {club.amenities && club.amenities.length > 0 && (
            <View style={styles.infoBlock}>
              <View style={styles.infoBlockTitleRow}>
                <Sparkles size={14} color="#F900BF" />
                <Text style={styles.infoBlockTitle}>Servicios disponibles</Text>
              </View>
              <View style={styles.pillsWrap}>
                {club.amenities.map((item, idx) => (
                  <View key={idx} style={styles.amenityPill}>
                    <Sparkles size={10} color="#F900BF" />
                    <Text style={styles.amenityPillText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* ==================================================================== */}
      {/* 8. MODAL VISOR MULTIMEDIA DE PANTALLA COMPLETA                       */}
      {/* ==================================================================== */}
      <ClubMediaViewerModal
        visible={isViewerVisible}
        mediaItems={mediaList}
        initialIndex={viewerInitialIndex}
        clubName={club.name}
        onClose={() => setIsViewerVisible(false)}
      />
    </View>
  );
};

// ----------------------------------------------------------------------------
// ESTILOS VISUALES PREMIUM
// ----------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 16,
  },

  // SUPERFICIE BASE DE TARJETA
  cardSurface: {
    backgroundColor: '#120E22',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(153, 0, 240, 0.18)',
    padding: 16,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },

  // CABECERA DE TARJETAS
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(153, 0, 240, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    color: '#A1A1AA',
    fontSize: 11,
    marginTop: 2,
  },

  // 1. PRESENTACIÓN DEL ESTABLECIMIENTO
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandLogo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(153, 0, 240, 0.4)',
    backgroundColor: '#1E1934',
  },
  brandLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(153, 0, 240, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(153, 0, 240, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandInfoCol: {
    flex: 1,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  brandCategory: {
    color: '#F900BF',
    fontSize: 12,
    fontWeight: '700',
  },
  brandDot: {
    color: '#71717A',
    fontSize: 12,
  },
  brandCity: {
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '500',
  },
  brandStatusStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  liveStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  liveStatusOpen: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  liveStatusClosed: {
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    borderColor: 'rgba(167, 139, 250, 0.25)',
  },
  liveStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveStatusDotOpen: {
    backgroundColor: '#10B981',
  },
  liveStatusDotClosed: {
    backgroundColor: '#A78BFA',
  },
  liveStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  liveStatusTextOpen: {
    color: '#10B981',
  },
  liveStatusTextClosed: {
    color: '#C4B5FD',
  },
  mediaCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(249, 0, 191, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(249, 0, 191, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  mediaCountText: {
    color: '#FF85B3',
    fontSize: 11,
    fontWeight: '700',
  },

  // 2. SOBRE EL LUGAR
  descriptionParagraph: {
    color: '#D4D4D8',
    fontSize: 13,
    lineHeight: 21,
  },
  expandTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  expandTextBtnLabel: {
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '700',
  },
  featuredCoverWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    height: 140,
    backgroundColor: '#1A162B',
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  featuredCoverImage: {
    width: '100%',
    height: '100%',
  },
  featuredCoverOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  featuredCoverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  featuredCoverPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // 3. GALERÍA MULTIMEDIA INTERACTIVA
  viewAllGalleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(249, 0, 191, 0.1)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(249, 0, 191, 0.25)',
  },
  viewAllGalleryBtnText: {
    color: '#F900BF',
    fontSize: 11,
    fontWeight: '700',
  },
  galleryCarouselContent: {
    gap: 10,
    paddingRight: 4,
    paddingTop: 4,
  },
  galleryCard: {
    width: 210,
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1E1934',
    borderWidth: 1,
    borderColor: 'rgba(153, 0, 240, 0.25)',
  },
  galleryCardImage: {
    width: '100%',
    height: '100%',
  },
  galleryCardOverlay: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  videoBadgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#9900F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  videoBadgeTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  galleryCardTitlePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  galleryCardTitleText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  galleryLoadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  galleryLoadingText: {
    color: '#A1A1AA',
    fontSize: 12,
  },
  emptyGalleryBox: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 6,
  },
  emptyGalleryTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyGallerySubtitle: {
    color: '#71717A',
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // 4. HORARIOS DE APERTURA
  scheduleTable: {
    backgroundColor: '#161228',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  scheduleRowToday: {
    backgroundColor: 'rgba(153, 0, 240, 0.12)',
  },
  scheduleRowLast: {
    borderBottomWidth: 0,
  },
  scheduleDayCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleDayName: {
    color: '#D4D4D8',
    fontSize: 13,
    fontWeight: '600',
  },
  scheduleDayNameToday: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  todayPill: {
    backgroundColor: '#9900F0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  todayPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  scheduleHoursCol: {
    alignItems: 'flex-end',
  },
  scheduleHoursText: {
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '600',
  },
  scheduleHoursToday: {
    color: '#10B981',
    fontWeight: '700',
  },
  scheduleHoursClosed: {
    color: '#71717A',
    fontWeight: '500',
  },
  expandHoursBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
  },
  expandHoursBtnText: {
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '700',
  },

  // 5. UBICACIÓN Y CÓMO LLEGAR
  addressDisplayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#161228',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  addressIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 0, 191, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressTextCol: {
    flex: 1,
  },
  addressMainText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  addressSubText: {
    color: '#A1A1AA',
    fontSize: 11,
    marginTop: 2,
  },
  primaryNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9900F0',
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#9900F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryNavBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  locationSecondaryActions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18132C',
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  secondaryActionBtnSuccess: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  secondaryActionBtnText: {
    color: '#D4D4D8',
    fontSize: 12,
    fontWeight: '700',
  },

  // 6. CONTACTO Y REDES
  socialChannelsGrid: {
    gap: 8,
  },
  socialChannelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161228',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  socialIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialTextCol: {
    flex: 1,
  },
  socialChannelName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  socialChannelHint: {
    color: '#A1A1AA',
    fontSize: 11,
    marginTop: 2,
  },

  // 7. INFORMACIÓN ADICIONAL
  additionalInfoGrid: {
    gap: 14,
  },
  infoBlock: {
    backgroundColor: '#161228',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 8,
  },
  infoBlockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoBlockTitle: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  infoBlockValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  infoPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  infoPillText: {
    color: '#E4E4E7',
    fontSize: 12,
    fontWeight: '600',
  },
  amenityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(249, 0, 191, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(249, 0, 191, 0.25)',
  },
  amenityPillText: {
    color: '#FF85B3',
    fontSize: 12,
    fontWeight: '600',
  },
  conditionsList: {
    gap: 6,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conditionText: {
    color: '#D4D4D8',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },

  // 8. VISOR MULTIMEDIA MODAL
  viewerContainer: {
    flex: 1,
    backgroundColor: '#090713',
    justifyContent: 'space-between',
  },
  viewerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  viewerCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerHeaderCenter: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 12,
  },
  viewerClubName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  viewerCounter: {
    color: '#A1A1AA',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  viewerShareBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerMediaArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  fullscreenVideo: {
    width: SCREEN_WIDTH,
    height: 340,
  },
  viewerNavArrow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  viewerNavArrowLeft: {
    left: 12,
  },
  viewerNavArrowRight: {
    right: 12,
  },
  viewerBottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 10,
  },
  viewerMediaTitle: {
    color: '#E4E4E7',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  viewerThumbsContent: {
    gap: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  viewerThumbItem: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#1E1934',
  },
  viewerThumbItemSelected: {
    borderColor: '#F900BF',
    transform: [{ scale: 1.05 }],
  },
  viewerThumbImg: {
    width: '100%',
    height: '100%',
  },
  viewerThumbVideoOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#9900F0',
    borderRadius: 4,
    padding: 2,
  },
});
