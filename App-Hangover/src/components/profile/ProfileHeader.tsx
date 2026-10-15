import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ChevronLeft, Settings, Camera, MapPin, 
  User, Share2, QrCode, Music2, AtSign, Heart
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface ProfileHeaderProps {
  fullName: string;
  username: string;
  avatarUrl: string | null;
  initials: string;
  city?: string | null;
  country?: string | null;
  bio?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  twitter?: string | null;
  onOpenQR?: () => void;
  onShare: () => void;
  onEditPress?: () => void;
  onSettingsPress?: () => void;
  isOwnProfile?: boolean;
  isFollowing?: boolean;
  onToggleFollow?: () => void;
}

export function ProfileHeader({
  fullName,
  username,
  avatarUrl,
  initials,
  city,
  country,
  bio,
  instagram,
  tiktok,
  twitter,
  onOpenQR,
  onShare,
  onEditPress,
  onSettingsPress,
  isOwnProfile = true,
  isFollowing = false,
  onToggleFollow,
}: ProfileHeaderProps) {
  const router = useRouter();

  const locationText = city
    ? `${city}${country ? `, ${country}` : ''}`
    : country || null;

  return (
    <View style={styles.container}>
      {/* 1. PORTADA VISUAL INMERSIVA (HERO COVER) */}
      <View style={styles.coverContainer}>
        <LinearGradient
          colors={['#2D006B', '#4700D8', '#1A003D', '#05020E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        
        {/* TEXTO Y FRASES DECORATIVAS NEON DE FONDO */}
        <View style={styles.coverOverlayText}>
          <Text style={styles.coverTaglineSub}>HANGOVER</Text>
          <Text style={styles.coverTaglineSub2}>HAZ QUE SUCEDA</Text>
          <Text style={styles.coverNeonQuote}>Good People{"\n"}Better Nights</Text>
        </View>

        {/* CONTROLES SUPERIORES SOBRE LA PORTADA */}
        <View style={styles.coverControls}>
          <TouchableOpacity 
            style={styles.circleIconButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <ChevronLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {isOwnProfile && onSettingsPress ? (
            <TouchableOpacity 
              style={styles.circleIconButton}
              onPress={onSettingsPress}
              activeOpacity={0.8}
            >
              <Settings size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* 2. IDENTIDAD Y AVATAR SOBREPUESTO */}
      <View style={styles.identitySection}>
        {/* AVATAR CON GLOOW Y BORDE NEON */}
        <View style={styles.avatarOuterFrame}>
          <LinearGradient
            colors={['#F900BF', '#9900F0', '#4700D8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradientBorder}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarInitialsContainer}>
                <Text style={styles.avatarInitialsText}>{initials}</Text>
              </View>
            )}
          </LinearGradient>

          {/* BOTÓN DE CÁMARA SUPERPUESTO (SOLO EN PERFIL PROPIO) */}
          {isOwnProfile && (
            <TouchableOpacity style={styles.cameraBadgeButton} activeOpacity={0.8}>
              <Camera size={14} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* DATOS DEL USUARIO */}
        <View style={styles.userDetailsBox}>
          <Text style={styles.nameText} numberOfLines={1}>{fullName}</Text>
          <Text style={styles.usernameText}>{username}</Text>

          {/* BIO O FRASE (SI EXISTE) */}
          {bio && bio.trim().length > 0 ? (
            <Text style={styles.bioText} numberOfLines={3}>{bio.trim()}</Text>
          ) : isOwnProfile ? (
            <Text style={styles.bioText}>Buenas noches, mejores historias.</Text>
          ) : null}

          {/* UBICACIÓN */}
          {locationText && (
            <View style={styles.locationRow}>
              <MapPin size={14} color="#A855F7" style={{ marginRight: 4 }} />
              <Text style={styles.locationText}>{locationText}</Text>
            </View>
          )}

          {/* ENLACES A REDES SOCIALES */}
          {(instagram || tiktok || twitter) && (
            <View style={styles.socialRow}>
              {instagram ? (
                <View style={styles.socialPill}>
                  <AtSign size={12} color="#F900BF" style={{ marginRight: 4 }} />
                  <Text style={styles.socialPillText}>@{instagram.replace(/^@/, '')}</Text>
                </View>
              ) : null}
              {tiktok ? (
                <View style={styles.socialPill}>
                  <Music2 size={12} color="#A855F7" style={{ marginRight: 4 }} />
                  <Text style={styles.socialPillText}>@{tiktok.replace(/^@/, '')}</Text>
                </View>
              ) : null}
              {twitter ? (
                <View style={styles.socialPill}>
                  <Share2 size={12} color="#60a5fa" style={{ marginRight: 4 }} />
                  <Text style={styles.socialPillText}>@{twitter.replace(/^@/, '')}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>
      </View>

      {/* 3. FILA DE BOTONES PRINCIPALES */}
      <View style={styles.actionsRow}>
        {isOwnProfile ? (
          <>
            {onEditPress && (
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={onEditPress}
                activeOpacity={0.8}
              >
                <User size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.actionButtonText}>Editar perfil</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={onShare}
              activeOpacity={0.8}
            >
              <Share2 size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.actionButtonText}>Compartir</Text>
            </TouchableOpacity>

            {onOpenQR && (
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={onOpenQR}
                activeOpacity={0.8}
              >
                <QrCode size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.actionButtonText}>Mi QR</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                { backgroundColor: isFollowing ? 'rgba(255, 255, 255, 0.15)' : '#9900F0', borderColor: isFollowing ? 'rgba(255, 255, 255, 0.3)' : '#9900F0' }
              ]} 
              onPress={onToggleFollow}
              activeOpacity={0.8}
            >
              <Heart size={16} color="#FFFFFF" fill={isFollowing ? '#FFFFFF' : 'transparent'} style={{ marginRight: 6 }} />
              <Text style={styles.actionButtonText}>{isFollowing ? 'Siguiendo' : 'Seguir'}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={onShare}
              activeOpacity={0.8}
            >
              <Share2 size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.actionButtonText}>Compartir</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#05020E',
  },
  coverContainer: {
    height: 180,
    position: 'relative',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    overflow: 'hidden',
  },
  coverOverlayText: {
    position: 'absolute',
    top: 24,
    left: 20,
    right: 20,
  },
  coverTaglineSub: {
    color: 'rgba(255, 255, 255, 0.25)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
  },
  coverTaglineSub2: {
    color: 'rgba(255, 255, 255, 0.15)',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 10,
  },
  coverNeonQuote: {
    position: 'absolute',
    right: 0,
    top: 0,
    color: 'rgba(249, 0, 191, 0.45)',
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    textAlign: 'right',
    lineHeight: 24,
    letterSpacing: -0.5,
  },
  coverControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  circleIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(5, 2, 14, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  identitySection: {
    paddingHorizontal: 20,
    marginTop: -48,
    marginBottom: 20,
    flexDirection: 'column',
  },
  avatarOuterFrame: {
    position: 'relative',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  avatarGradientBorder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F900BF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarImg: {
    width: 98,
    height: 98,
    borderRadius: 49,
  },
  avatarInitialsContainer: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: '#0F0921',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialsText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cameraBadgeButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0F0921',
    borderColor: 'rgba(249, 0, 191, 0.6)',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetailsBox: {
    gap: 4,
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  usernameText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(153, 0, 240, 0.15)',
    borderColor: 'rgba(153, 0, 240, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  badgeText: {
    color: '#FF85B3',
    fontSize: 11,
    fontWeight: 'bold',
  },
  bioText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  socialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 9, 33, 0.8)',
    borderColor: 'rgba(153, 0, 240, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  socialPillText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    backgroundColor: '#0F0921',
    borderColor: 'rgba(153, 0, 240, 0.25)',
    borderWidth: 1,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
