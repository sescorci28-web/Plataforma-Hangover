import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Sparkles,
  Users,
  CalendarDays,
  CheckCircle2,
  Clock,
  CircleDollarSign,
  Send,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ClubBookingItem, ClubDetail, ClubTable } from '@/types/club.types';
import { clubService } from '@/services/club.service';
import { ClubTheme } from '@/constants/clubTheme';

interface ClubBookingsTabProps {
  club: ClubDetail;
  tables: ClubTable[];
  userBookings: ClubBookingItem[];
  isAuthenticated: boolean;
  userFullName?: string;
  onBookingCreated?: () => void;
}

export const ClubBookingsTab: React.FC<ClubBookingsTabProps> = ({
  club,
  tables,
  userBookings,
  isAuthenticated,
  userFullName = '',
  onBookingCreated,
}) => {
  const router = useRouter();

  // Estados del formulario
  const [customerName, setCustomerName] = useState(userFullName);
  const [reservationDate, setReservationDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [guestCount, setGuestCount] = useState('2');
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccessMessage, setBookingSuccessMessage] = useState<string | null>(null);

  const selectedTable = useMemo(() => {
    return tables.find((t) => t.id === selectedTableId);
  }, [tables, selectedTableId]);

  const handleSubmitBooking = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Iniciar Sesión',
        'Inicia sesión con tu cuenta de usuario para enviar una solicitud de reserva.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar Sesión', onPress: () => router.push('/(auth)/login' as any) },
        ]
      );
      return;
    }

    if (!customerName.trim()) {
      Alert.alert('Falta información', 'Por favor ingresa el nombre de la persona titular de la reserva.');
      return;
    }

    if (!reservationDate) {
      Alert.alert('Falta información', 'Por favor indica la fecha en que deseas asistir.');
      return;
    }

    const guests = parseInt(guestCount, 10);
    if (isNaN(guests) || guests < 1) {
      Alert.alert('Dato Inválido', 'La cantidad de personas debe ser al menos 1.');
      return;
    }

    setIsSubmitting(true);
    setBookingSuccessMessage(null);

    const { success, error } = await clubService.createClubBooking({
      clubId: club.id,
      clubSlug: club.slug,
      providerId: club.provider_id,
      ownerId: club.owner_id,
      customerName: customerName.trim(),
      reservationDate,
      guestCount: guests,
      tableZone: selectedTable?.zone || undefined,
      tableNumber: selectedTable?.table_number || undefined,
      comment: comment.trim() || undefined,
    });

    setIsSubmitting(false);

    if (success) {
      setBookingSuccessMessage('Solicitud enviada exitosamente. El club revisará la disponibilidad y actualizará el estado de tu reserva.');
      setComment('');
      if (onBookingCreated) {
        onBookingCreated();
      }
    } else {
      Alert.alert('No se pudo enviar la solicitud', error || 'Ocurrió un error al procesar la reserva. Por favor intenta de nuevo.');
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'confirmed' || s === 'confirmada' || s === 'aprobada') {
      return { text: 'Confirmada', color: ClubTheme.colors.success, bg: ClubTheme.colors.successLight };
    }
    if (s === 'rejected' || s === 'rechazada' || s === 'cancelled') {
      return { text: 'Rechazada', color: ClubTheme.colors.danger, bg: ClubTheme.colors.dangerLight };
    }
    return { text: 'Pendiente de aprobación', color: ClubTheme.colors.warning, bg: ClubTheme.colors.warningLight };
  };

  return (
    <View style={styles.container}>
      {/* 1. TUS SOLICITUDES PREVIAS EN ESTE LOCAL (SI EXISTEN) */}
      {userBookings.length > 0 && (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Tus solicitudes en {club.name}</Text>
          <View style={styles.bookingsList}>
            {userBookings.map((b) => {
              const badge = getStatusBadge(b.status);
              return (
                <View key={b.id} style={styles.bookingHistoryCard}>
                  <View style={styles.historyRow}>
                    <View style={styles.dateGroup}>
                      <Clock size={13} color={ClubTheme.colors.accent} />
                      <Text style={styles.historyDate}>{b.reservation_date}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.statusPillText, { color: badge.color }]}>{badge.text}</Text>
                    </View>
                  </View>
                  {b.notes ? <Text style={styles.historyNotes}>{b.notes}</Text> : null}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 2. MESAS Y PALCOS CONFIGURADOS */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionHeading}>Mesas & Palcos</Text>

        {tables.length === 0 ? (
          <Text style={styles.emptyText}>
            Este local no tiene mesas numeradas en el sistema. Puedes enviar una solicitud de reserva general completando el formulario.
          </Text>
        ) : (
          <View style={styles.tablesList}>
            {tables.map((table) => {
              const isSelected = selectedTableId === table.id;
              const isFree = (table.status || 'Libre').toLowerCase() === 'libre';

              return (
                <TouchableOpacity
                  key={table.id}
                  style={[
                    styles.tableCard,
                    isSelected && styles.tableCardSelected,
                    !isFree && styles.tableCardUnavailable,
                  ]}
                  onPress={() => {
                    if (isFree) {
                      setSelectedTableId(isSelected ? '' : table.id);
                    } else {
                      Alert.alert('Mesa Ocupada', `Esta mesa está marcada como ${table.status}.`);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.tableTop}>
                    <Text style={styles.tableName}>
                      {table.name || `Mesa ${table.table_number}`}
                    </Text>
                    <View style={[styles.availabilityDot, isFree ? styles.dotFree : styles.dotOccupied]} />
                  </View>

                  <Text style={styles.tableZone}>{table.zone || 'General'}</Text>

                  <View style={styles.tableInfoRow}>
                    {table.capacity ? (
                      <View style={styles.infoBadge}>
                        <Users size={12} color={ClubTheme.colors.textSecondary} />
                        <Text style={styles.infoBadgeText}>{table.capacity} pers.</Text>
                      </View>
                    ) : null}

                    {table.min_spend ? (
                      <View style={styles.infoBadge}>
                        <CircleDollarSign size={12} color={ClubTheme.colors.success} />
                        <Text style={styles.infoBadgeText}>Consumo min. ${table.min_spend.toLocaleString('es-CO')}</Text>
                      </View>
                    ) : null}
                  </View>

                  {table.conditions ? (
                    <Text style={styles.tableConditions} numberOfLines={2}>
                      {table.conditions}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* 3. FORMULARIO DE RESERVA */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionHeading}>Enviar Solicitud de Reserva</Text>

        {bookingSuccessMessage ? (
          <View style={styles.successState}>
            <CheckCircle2 size={28} color={ClubTheme.colors.success} />
            <Text style={styles.successHeading}>¡Solicitud enviada!</Text>
            <Text style={styles.successDescription}>{bookingSuccessMessage}</Text>
            <TouchableOpacity
              style={styles.newRequestButton}
              onPress={() => setBookingSuccessMessage(null)}
            >
              <Text style={styles.newRequestButtonText}>Nueva solicitud</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formContainer}>
            {selectedTable && (
              <View style={styles.selectedBanner}>
                <Sparkles size={14} color={ClubTheme.colors.primary} />
                <Text style={styles.selectedBannerText}>
                  Mesa: {selectedTable.name || `#${selectedTable.table_number}`} ({selectedTable.zone || 'General'})
                </Text>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nombre del titular</Text>
              <TextInput
                style={styles.textInput}
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Tu nombre y apellido"
                placeholderTextColor={ClubTheme.colors.textMuted}
              />
            </View>

            <View style={styles.fieldsRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Fecha de visita</Text>
                <TextInput
                  style={styles.textInput}
                  value={reservationDate}
                  onChangeText={setReservationDate}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={ClubTheme.colors.textMuted}
                />
              </View>

              <View style={[styles.fieldGroup, { width: 90 }]}>
                <Text style={styles.fieldLabel}>Personas</Text>
                <TextInput
                  style={styles.textInput}
                  value={guestCount}
                  onChangeText={setGuestCount}
                  keyboardType="number-pad"
                  placeholder="2"
                  placeholderTextColor={ClubTheme.colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Notas especiales o botellas preferidas (opcional)</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                value={comment}
                onChangeText={setComment}
                placeholder="Ej: Cumpleaños, botella de Tequila, preferencia de ubicación..."
                placeholderTextColor={ClubTheme.colors.textMuted}
                multiline
                numberOfLines={2}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmitBooking}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={ClubTheme.colors.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Send size={16} color="#ffffff" />
                    <Text style={styles.submitButtonText}>Enviar Solicitud</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Tu reserva queda registrada como solicitud pendiente. El establecimiento la confirmará según la disponibilidad de mesas del día.
            </Text>
          </View>
        )}
      </View>
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
    gap: 14,
  },
  sectionHeading: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  bookingsList: {
    gap: 8,
  },
  bookingHistoryCard: {
    backgroundColor: ClubTheme.colors.surfaceElevated,
    borderRadius: ClubTheme.radii.md,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyDate: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ClubTheme.radii.full,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  historyNotes: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
  },
  tablesList: {
    gap: 10,
  },
  tableCard: {
    backgroundColor: ClubTheme.colors.surfaceElevated,
    borderRadius: ClubTheme.radii.md,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
    padding: 14,
    gap: 6,
  },
  tableCardSelected: {
    borderColor: ClubTheme.colors.primary,
    backgroundColor: ClubTheme.colors.primaryLight,
  },
  tableCardUnavailable: {
    opacity: 0.5,
  },
  tableTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableName: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotFree: {
    backgroundColor: ClubTheme.colors.success,
  },
  dotOccupied: {
    backgroundColor: ClubTheme.colors.danger,
  },
  tableZone: {
    color: ClubTheme.colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  tableInfoRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ClubTheme.radii.sm,
  },
  infoBadgeText: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  tableConditions: {
    color: ClubTheme.colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  emptyText: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  formContainer: {
    gap: 12,
  },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ClubTheme.colors.primaryLight,
    padding: 10,
    borderRadius: ClubTheme.radii.md,
    borderWidth: 1,
    borderColor: ClubTheme.colors.borderActive,
  },
  selectedBannerText: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldLabel: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  textInput: {
    height: 44,
    backgroundColor: ClubTheme.colors.bg,
    borderRadius: ClubTheme.radii.md,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
    paddingHorizontal: 12,
    color: ClubTheme.colors.textPrimary,
    fontSize: 13,
  },
  textAreaInput: {
    height: 64,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  submitButton: {
    height: ClubTheme.touchTarget.minHeight,
    borderRadius: ClubTheme.radii.md,
    overflow: 'hidden',
    marginTop: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  disclaimer: {
    color: ClubTheme.colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  successState: {
    alignItems: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  successHeading: {
    color: ClubTheme.colors.success,
    fontSize: 16,
    fontWeight: '800',
  },
  successDescription: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  newRequestButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: ClubTheme.radii.md,
    backgroundColor: ClubTheme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
  },
  newRequestButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
