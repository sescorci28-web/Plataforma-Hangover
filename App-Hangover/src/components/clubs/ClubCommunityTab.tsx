import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Radio,
  Users,
  LogIn,
  Sparkles,
} from 'lucide-react-native';
import { ClubConnectStats, ClubDetail } from '@/types/club.types';
import { ClubTheme } from '@/constants/clubTheme';

interface ClubCommunityTabProps {
  club: ClubDetail;
  stats: ClubConnectStats;
  isAuthenticated: boolean;
}

export const ClubCommunityTab: React.FC<ClubCommunityTabProps> = ({
  club,
  stats,
  isAuthenticated,
}) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* 1. INDICADOR DE AMBIENTE EN VIVO */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Radio size={16} color={stats.occupancyColor} />
          <Text style={styles.statusTitle}>Ambiente en sala</Text>
          <View style={[styles.statusBadge, { borderColor: `${stats.occupancyColor}35`, backgroundColor: `${stats.occupancyColor}12` }]}>
            <View style={[styles.statusDot, { backgroundColor: stats.occupancyColor }]} />
            <Text style={[styles.statusBadgeText, { color: stats.occupancyColor }]}>
              {stats.occupancyStatus}
            </Text>
          </View>
        </View>

        <Text style={styles.statusDescription}>
          Basado en mesas activas y asistentes con presencia validada en tiempo real.
        </Text>
      </View>

      {/* 2. ASISTENTES VISIBLES EN CONNECT */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Users size={16} color={ClubTheme.colors.accent} />
          <Text style={styles.cardTitle}>
            Asistentes en Connect {stats.visibleConnectCount > 0 ? `(${stats.visibleConnectCount})` : ''}
          </Text>
        </View>

        {stats.attendees.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Aún no hay asistentes visibles en sala para hoy. Al ingresar con tu reserva o cover validado, podrás activar tu presencia y conectar con otras personas en el local.
            </Text>
          </View>
        ) : (
          <View style={styles.attendeesList}>
            {stats.attendees.map((att) => (
              <View key={att.id} style={styles.attendeeChip}>
                {att.avatarUrl ? (
                  <Image source={{ uri: att.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {att.fullName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={styles.attendeeName} numberOfLines={1}>
                  {att.fullName.split(' ')[0]}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 3. EXPLICACIÓN DIDÁCTICA DE HANGOVER CONNECT */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Sparkles size={16} color={ClubTheme.colors.primary} />
          <Text style={styles.infoTitle}>¿Cómo funciona Hangover Connect?</Text>
        </View>
        <Text style={styles.infoDescription}>
          Connect es la red social en vivo del local. Al validar tu código QR en la entrada de {club.name}, se habilita la sala privada donde podrás ver quién más está de rumba y entablar conversación de forma segura hasta el cierre del evento.
        </Text>

        {!isAuthenticated && (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login' as any)}
            activeOpacity={0.8}
          >
            <LogIn size={15} color="#ffffff" />
            <Text style={styles.loginButtonText}>Inicia sesión para habilitar tu perfil Connect</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  statusCard: {
    backgroundColor: ClubTheme.colors.surface,
    borderRadius: ClubTheme.radii.lg,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
    padding: 16,
    gap: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusTitle: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: ClubTheme.radii.full,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusDescription: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  card: {
    backgroundColor: ClubTheme.colors.surface,
    borderRadius: ClubTheme.radii.lg,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  attendeesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  attendeeChip: {
    alignItems: 'center',
    gap: 4,
    width: 54,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#181822',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ClubTheme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  attendeeName: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
  emptyState: {
    paddingVertical: 4,
  },
  emptyText: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: ClubTheme.colors.surface,
    borderRadius: ClubTheme.radii.lg,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
    padding: 16,
    gap: 10,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoTitle: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  infoDescription: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    borderRadius: ClubTheme.radii.md,
    backgroundColor: ClubTheme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
    marginTop: 4,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
