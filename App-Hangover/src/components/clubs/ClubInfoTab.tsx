import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import {
  MapPin,
  Clock,
  Globe,
  MessageCircle,
  CreditCard,
  Sparkles,
  Navigation,
} from 'lucide-react-native';
import Svg, { Rect, Path, Line } from 'react-native-svg';
import { ClubDetail } from '@/types/club.types';
import { ClubTheme } from '@/constants/clubTheme';

function InstagramIcon({ size = 18, color = '#ec4899' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect width={20} height={20} x="2" y="2" rx="5" ry="5" />
      <Path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <Line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </Svg>
  );
}

interface ClubInfoTabProps {
  club: ClubDetail;
}

export const ClubInfoTab: React.FC<ClubInfoTabProps> = ({ club }) => {
  const handleOpenMaps = () => {
    const query = encodeURIComponent(`${club.name} ${club.address || ''} ${club.city}`);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    });
  };

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

  const handleOpenWebsite = () => {
    if (!club.website) return;
    let url = club.website.trim();
    if (!url.startsWith('http')) url = `https://${url}`;
    Linking.openURL(url).catch(() => {});
  };

  const hasSocials = Boolean(club.whatsapp || club.instagram || club.website);

  return (
    <View style={styles.container}>
      {/* 1. SECCIÓN: SOBRE EL LUGAR */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionHeading}>Sobre el lugar</Text>
        <Text style={styles.description}>
          {club.description || 'Discoteca asociada a la red oficial de Hangover.'}
        </Text>

        {/* Amenidades y características en una sola fila orgánica */}
        {club.amenities && club.amenities.length > 0 && (
          <View style={styles.amenitiesWrap}>
            {club.amenities.map((item, idx) => (
              <View key={idx} style={styles.amenityChip}>
                <Sparkles size={11} color={ClubTheme.colors.primary} />
                <Text style={styles.amenityText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Galería si existen fotos reales */}
        {club.gallery && club.gallery.length > 0 && (
          <View style={styles.galleryContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
              {club.gallery.map((imgUrl, i) => (
                <Image key={i} source={{ uri: imgUrl }} style={styles.galleryThumb} resizeMode="cover" />
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* 2. SECCIÓN: HORARIOS Y UBICACIÓN */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionHeading}>Horarios & Ubicación</Text>

        {club.opening_hours && (
          <View style={styles.infoRow}>
            <Clock size={16} color={ClubTheme.colors.accent} />
            <Text style={styles.infoRowText}>{club.opening_hours}</Text>
          </View>
        )}

        {club.address && (
          <View style={styles.infoRow}>
            <MapPin size={16} color={ClubTheme.colors.primary} />
            <Text style={styles.infoRowText}>{club.address}, {club.city}</Text>
          </View>
        )}

        {/* Botón de cómo llegar */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleOpenMaps}
          activeOpacity={0.8}
        >
          <Navigation size={15} color="#ffffff" />
          <Text style={styles.actionButtonText}>Cómo llegar (Google Maps / Waze)</Text>
        </TouchableOpacity>

        {/* Pagos y Precios compactos */}
        <View style={styles.paymentRow}>
          <CreditCard size={15} color={ClubTheme.colors.textMuted} />
          <Text style={styles.paymentText}>
            Precios {club.price_range || '$$'} • Acepta: {club.payment_methods.join(', ')}
          </Text>
        </View>
      </View>

      {/* 3. SECCIÓN: CANALES DE CONTACTO (Solo si existen) */}
      {hasSocials && (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Contacto & Redes</Text>
          <View style={styles.socialButtonsRow}>
            {club.whatsapp && (
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleOpenWhatsApp}
                activeOpacity={0.8}
              >
                <MessageCircle size={16} color={ClubTheme.colors.success} />
                <Text style={styles.socialButtonText}>WhatsApp</Text>
              </TouchableOpacity>
            )}

            {club.instagram && (
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleOpenInstagram}
                activeOpacity={0.8}
              >
                <InstagramIcon size={16} color="#ec4899" />
                <Text style={styles.socialButtonText}>Instagram</Text>
              </TouchableOpacity>
            )}

            {club.website && (
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleOpenWebsite}
                activeOpacity={0.8}
              >
                <Globe size={16} color={ClubTheme.colors.accent} />
                <Text style={styles.socialButtonText}>Web</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 20,
  },
  sectionBlock: {
    backgroundColor: ClubTheme.colors.surface,
    borderRadius: ClubTheme.radii.lg,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
    padding: 18,
    gap: 12,
  },
  sectionHeading: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  description: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  amenitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 4,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: ClubTheme.colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: ClubTheme.radii.full,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
  },
  amenityText: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  galleryContainer: {
    marginTop: 6,
  },
  galleryScroll: {
    gap: 8,
  },
  galleryThumb: {
    width: 130,
    height: 90,
    borderRadius: ClubTheme.radii.md,
    backgroundColor: '#181822',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoRowText: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  actionButton: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ClubTheme.colors.surfaceElevated,
    borderRadius: ClubTheme.radii.md,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
    marginTop: 4,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  paymentText: {
    color: ClubTheme.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  socialButton: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: ClubTheme.radii.md,
    backgroundColor: ClubTheme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
  },
  socialButtonText: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
});
