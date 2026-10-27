import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
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
  History,
  X,
  ChevronRight,
  Search,
  Filter,
  QrCode,
  Ban,
  Ticket,
  CalendarCheck,
  ShieldCheck,
  Layers,
  Info,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ClubBookingItem, ClubDetail, ClubTable } from '@/types/club.types';
import { clubService } from '@/services/club.service';
import { ClubTheme } from '@/constants/clubTheme';
import { supabase } from '@/lib/supabase';
import { UserQRModal } from '@/components/profile/UserQRModal';

export type BookingsSubTab = 'requests' | 'tables' | 'history';

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

  // 1. Navegación interna entre apartados
  const [activeSection, setActiveSection] = useState<BookingsSubTab>('requests');

  // 2. Estados para filtros de historial
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'confirmed' | 'cancelled' | 'rejected'>('all');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'vip' | 'cover'>('all');

  // 3. Detalle de solicitud seleccionada (Modal)
  const [selectedBooking, setSelectedBooking] = useState<ClubBookingItem | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);

  // 4. Estados del formulario de nueva reserva
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

  // Actualizar nombre si cambia el usuario autenticado
  useEffect(() => {
    if (userFullName && !customerName) {
      setCustomerName(userFullName);
    }
  }, [userFullName]);

  // Sincronización en tiempo real vía Supabase Realtime
  useEffect(() => {
    if (!club?.id) return;

    const channel = supabase
      .channel(`club-bookings-sync-${club.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `club_id=eq.${club.id}`,
        },
        () => {
          onBookingCreated?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [club?.id, onBookingCreated]);

  // Partición lógica: Solicitudes Actuales vs Historial
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const { activeBookings, historyBookings } = useMemo(() => {
    const active: ClubBookingItem[] = [];
    const history: ClubBookingItem[] = [];

    userBookings.forEach((b) => {
      const s = (b.status || '').toLowerCase().trim();
      const q = (b.qr_status || '').toLowerCase().trim();
      const isUsed = q === 'used';
      const isCancelled = s === 'cancelled' || s === 'cancelada';
      const isRejected = s === 'rejected' || s === 'rechazada';

      if (isUsed || isCancelled || isRejected) {
        history.push(b);
      } else {
        // Si está pendiente o confirmada pero no consumida
        active.push(b);
      }
    });

    return { activeBookings: active, historyBookings: history };
  }, [userBookings]);

  // Contadores reales de solicitudes actuales
  const counters = useMemo(() => {
    let pending = 0;
    let confirmed = 0;
    let upcoming = 0;

    activeBookings.forEach((b) => {
      const s = (b.status || '').toLowerCase().trim();
      if (s === 'pending' || s === 'pendiente') {
        pending++;
      }
      if (s === 'confirmed' || s === 'confirmada' || s === 'paid' || s === 'accepted' || s === 'aprobada') {
        confirmed++;
      }
      if (b.reservation_date && b.reservation_date >= todayStr) {
        upcoming++;
      }
    });

    return { pending, confirmed, upcoming };
  }, [activeBookings, todayStr]);

  // Mesa seleccionada en el formulario
  const selectedTable = useMemo(() => {
    return tables.find((t) => t.id === selectedTableId);
  }, [tables, selectedTableId]);

  // Historial filtrado
  const filteredHistory = useMemo(() => {
    return historyBookings.filter((b) => {
      // Filtro por búsqueda de texto
      if (historySearch.trim()) {
        const query = historySearch.toLowerCase().trim();
        const notesMatch = (b.notes || '').toLowerCase().includes(query);
        const idMatch = b.id.toLowerCase().includes(query);
        const typeMatch = (b.booking_type || '').toLowerCase().includes(query);
        if (!notesMatch && !idMatch && !typeMatch) return false;
      }

      // Filtro por estado
      const s = (b.status || '').toLowerCase().trim();
      const q = (b.qr_status || '').toLowerCase().trim();

      if (historyStatusFilter === 'confirmed') {
        if (q !== 'used' && s !== 'confirmed' && s !== 'paid' && s !== 'completed') return false;
      } else if (historyStatusFilter === 'cancelled') {
        if (s !== 'cancelled' && s !== 'cancelada') return false;
      } else if (historyStatusFilter === 'rejected') {
        if (s !== 'rejected' && s !== 'rechazada') return false;
      }

      // Filtro por tipo
      const t = (b.booking_type || '').toLowerCase();
      if (historyTypeFilter === 'vip' && t !== 'club_vip') return false;
      if (historyTypeFilter === 'cover' && t !== 'club_cover') return false;

      return true;
    });
  }, [historyBookings, historySearch, historyStatusFilter, historyTypeFilter]);

  // Etiquetas visuales discretas de estado
  const getStatusBadge = (status: string, qrStatus?: string) => {
    const s = (status || '').toLowerCase().trim();
    const q = (qrStatus || '').toLowerCase().trim();

    if (q === 'used') {
      return {
        text: 'Finalizada',
        color: '#A855F7',
        bg: 'rgba(168, 85, 247, 0.12)',
      };
    }
    if (s === 'confirmed' || s === 'confirmada' || s === 'paid' || s === 'accepted' || s === 'aprobada') {
      return {
        text: 'Confirmada',
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.12)',
      };
    }
    if (s === 'rejected' || s === 'rechazada') {
      return {
        text: 'Rechazada',
        color: '#EF4444',
        bg: 'rgba(239, 68, 68, 0.12)',
      };
    }
    if (s === 'cancelled' || s === 'cancelada') {
      return {
        text: 'Cancelada',
        color: '#9CA3AF',
        bg: 'rgba(156, 163, 175, 0.12)',
      };
    }
    return {
      text: 'Pendiente de aprobación',
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.12)',
    };
  };

  // Información del tipo de solicitud
  const getBookingTypeInfo = (bookingType: string) => {
    const t = (bookingType || '').toLowerCase();
    if (t === 'club_vip') {
      return {
        label: 'Reserva de Mesa / Palco',
        shortLabel: 'Mesa / Palco',
        Icon: Sparkles,
        color: '#C026D3',
      };
    }
    if (t === 'club_cover') {
      return {
        label: 'Cover Individual',
        shortLabel: 'Cover',
        Icon: Ticket,
        color: '#818CF8',
      };
    }
    return {
      label: 'Reserva General',
      shortLabel: 'Reserva',
      Icon: CalendarDays,
      color: '#38BDF8',
    };
  };

  // Manejar envío de nueva reserva
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
      setSelectedTableId('');
      onBookingCreated?.();
    } else {
      Alert.alert('No se pudo enviar la solicitud', error || 'Ocurrió un error al procesar la reserva. Por favor intenta de nuevo.');
    }
  };

  // Manejar cancelación de solicitud pendiente por el cliente
  const handleCancelBooking = (booking: ClubBookingItem) => {
    Alert.alert(
      'Cancelar solicitud',
      `¿Estás seguro de que deseas cancelar tu solicitud de reserva en ${club.name}?`,
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            const { success, error } = await clubService.cancelUserClubBooking(booking.id);
            setIsCancelling(false);

            if (success) {
              Alert.alert('Solicitud cancelada', 'Tu solicitud ha sido cancelada correctamente.');
              setSelectedBooking(null);
              onBookingCreated?.();
            } else {
              Alert.alert('Error', error || 'No se pudo cancelar la solicitud. Intenta de nuevo.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* ── CABECERA DE LA SECCIÓN CON ACCESO RÁPIDO A HISTORIAL ── */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Reservas & Solicitudes</Text>
          <Text style={styles.headerSubtitle}>
            {activeSection === 'requests'
              ? 'Tus solicitudes activas y seguimiento'
              : activeSection === 'tables'
              ? 'Mesas, palcos y condiciones de reserva'
              : 'Historial de registros anteriores'}
          </Text>
        </View>

        {/* Icono de historial / reloj rápido */}
        <TouchableOpacity
          style={[
            styles.historyIconButton,
            activeSection === 'history' && styles.historyIconButtonActive,
          ]}
          onPress={() => {
            setActiveSection(activeSection === 'history' ? 'requests' : 'history');
          }}
          accessibilityRole="button"
          accessibilityLabel="Historial de reservas"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <History
            size={18}
            color={activeSection === 'history' ? '#FFFFFF' : ClubTheme.colors.textSecondary}
          />
          {historyBookings.length > 0 && (
            <View style={styles.historyBadgeDot}>
              <Text style={styles.historyBadgeText}>{historyBookings.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── NAVEGACIÓN INTERNA MINIMALISTA ENTRE APARTADOS (3 PESTAÑAS) ── */}
      <View style={styles.subTabsContainer}>
        <TouchableOpacity
          style={[
            styles.subTabButton,
            activeSection === 'requests' && styles.subTabButtonActive,
          ]}
          onPress={() => setActiveSection('requests')}
          activeOpacity={0.7}
        >
          <CalendarDays
            size={15}
            color={activeSection === 'requests' ? '#FFFFFF' : ClubTheme.colors.textSecondary}
          />
          <Text
            style={[
              styles.subTabText,
              activeSection === 'requests' && styles.subTabTextActive,
            ]}
          >
            Mis solicitudes
          </Text>
          {activeBookings.length > 0 && (
            <View style={styles.subTabCounter}>
              <Text style={styles.subTabCounterText}>{activeBookings.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.subTabButton,
            activeSection === 'tables' && styles.subTabButtonActive,
          ]}
          onPress={() => setActiveSection('tables')}
          activeOpacity={0.7}
        >
          <Layers
            size={15}
            color={activeSection === 'tables' ? '#FFFFFF' : ClubTheme.colors.textSecondary}
          />
          <Text
            style={[
              styles.subTabText,
              activeSection === 'tables' && styles.subTabTextActive,
            ]}
          >
            Mesas y palcos
          </Text>
          {tables.length > 0 && (
            <View style={styles.subTabCounterNeutral}>
              <Text style={styles.subTabCounterNeutralText}>{tables.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.subTabButton,
            activeSection === 'history' && styles.subTabButtonActive,
          ]}
          onPress={() => setActiveSection('history')}
          activeOpacity={0.7}
        >
          <Clock
            size={15}
            color={activeSection === 'history' ? '#FFFFFF' : ClubTheme.colors.textSecondary}
          />
          <Text
            style={[
              styles.subTabText,
              activeSection === 'history' && styles.subTabTextActive,
            ]}
          >
            Historial
          </Text>
        </TouchableOpacity>
      </View>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 1. APARTADO: MIS SOLICITUDES ACTUALES                          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'requests' && (
        <View style={styles.sectionBody}>
          {/* Contadores reales y compactos */}
          <View style={styles.countersRow}>
            <View style={styles.counterCard}>
              <Text style={[styles.counterNumber, { color: '#F59E0B' }]}>
                {counters.pending}
              </Text>
              <Text style={styles.counterLabel}>Pendientes</Text>
            </View>

            <View style={styles.counterCard}>
              <Text style={[styles.counterNumber, { color: '#10B981' }]}>
                {counters.confirmed}
              </Text>
              <Text style={styles.counterLabel}>Confirmadas</Text>
            </View>

            <View style={styles.counterCard}>
              <Text style={[styles.counterNumber, { color: '#818CF8' }]}>
                {counters.upcoming}
              </Text>
              <Text style={styles.counterLabel}>Próximas</Text>
            </View>
          </View>

          {/* Lista de solicitudes actuales */}
          {activeBookings.length === 0 ? (
            <View style={styles.emptyCard}>
              <CalendarCheck size={36} color={ClubTheme.colors.textMuted} />
              <Text style={styles.emptyTitle}>Todo al día</Text>
              <Text style={styles.emptySubtitle}>
                No tienes solicitudes pendientes de atención en {club.name}. Puedes explorar las mesas disponibles y solicitar tu reserva cuando desees.
              </Text>
              <TouchableOpacity
                style={styles.emptyActionButton}
                onPress={() => setActiveSection('tables')}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyActionButtonText}>Ver mesas y palcos</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cardsList}>
              {activeBookings.map((booking) => {
                const badge = getStatusBadge(booking.status, booking.qr_status);
                const typeInfo = getBookingTypeInfo(booking.booking_type);
                const TypeIcon = typeInfo.Icon;

                return (
                  <TouchableOpacity
                    key={booking.id}
                    style={styles.bookingCard}
                    onPress={() => setSelectedBooking(booking)}
                    activeOpacity={0.85}
                  >
                    {/* Fila superior: Tipo y Estado */}
                    <View style={styles.cardHeader}>
                      <View style={styles.typeBadge}>
                        <TypeIcon size={13} color={typeInfo.color} />
                        <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>
                          {typeInfo.shortLabel}
                        </Text>
                      </View>

                      <View style={[styles.statusTag, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.statusTagText, { color: badge.color }]}>
                          {badge.text}
                        </Text>
                      </View>
                    </View>

                    {/* Fila intermedia: Fecha, Personas y Discoteca */}
                    <View style={styles.cardBody}>
                      <View style={styles.metaRow}>
                        <Clock size={13} color={ClubTheme.colors.textSecondary} />
                        <Text style={styles.dateText}>{booking.reservation_date}</Text>
                        <Text style={styles.dotSeparator}>•</Text>
                        <Users size={13} color={ClubTheme.colors.textSecondary} />
                        <Text style={styles.peopleText}>
                          {booking.number_of_people}{' '}
                          {booking.number_of_people === 1 ? 'persona' : 'personas'}
                        </Text>
                      </View>

                      {booking.notes ? (
                        <Text style={styles.cardNotes} numberOfLines={1}>
                          {booking.notes}
                        </Text>
                      ) : null}
                    </View>

                    {/* Fila inferior: Importe y Acción */}
                    <View style={styles.cardFooter}>
                      <Text style={styles.amountText}>
                        {booking.total_amount > 0
                          ? `$ ${booking.total_amount.toLocaleString('es-CO')}`
                          : 'Sin cobro anticipado'}
                      </Text>

                      <View style={styles.detailLinkRow}>
                        <Text style={styles.detailLinkText}>Ver detalle</Text>
                        <ChevronRight size={14} color={ClubTheme.colors.accent} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Botón flotante para crear nueva solicitud si hay reservas activas */}
          {activeBookings.length > 0 && (
            <TouchableOpacity
              style={styles.newBookingPrompt}
              onPress={() => setActiveSection('tables')}
              activeOpacity={0.8}
            >
              <Sparkles size={15} color={ClubTheme.colors.primary} />
              <Text style={styles.newBookingPromptText}>
                ¿Deseas reservar otra mesa o palco?
              </Text>
              <ChevronRight size={14} color={ClubTheme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 2. APARTADO: MESAS Y PALCOS DISPONIBLES                        */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'tables' && (
        <View style={styles.sectionBody}>
          {/* Catálogo de mesas disponibles */}
          <View style={styles.subSectionHeader}>
            <Text style={styles.subSectionTitle}>Mesas y Palcos del Club</Text>
            <Text style={styles.subSectionDesc}>
              Selecciona una mesa para preconfigurar tu solicitud de reserva
            </Text>
          </View>

          {tables.length === 0 ? (
            <View style={styles.infoNoticeCard}>
              <Info size={18} color={ClubTheme.colors.accent} />
              <Text style={styles.infoNoticeText}>
                Este establecimiento no dispone de mesas numeradas individualmente en el sistema. Puedes enviar una solicitud de reserva general en el formulario a continuación.
              </Text>
            </View>
          ) : (
            <View style={styles.tablesGrid}>
              {tables.map((table) => {
                const isSelected = selectedTableId === table.id;
                const isFree = (table.status || 'Libre').toLowerCase() === 'libre';

                return (
                  <TouchableOpacity
                    key={table.id}
                    style={[
                      styles.tableCardItem,
                      isSelected && styles.tableCardItemSelected,
                      !isFree && styles.tableCardItemOccupied,
                    ]}
                    onPress={() => {
                      if (isFree) {
                        setSelectedTableId(isSelected ? '' : table.id);
                      } else {
                        Alert.alert(
                          'Mesa no disponible',
                          `La mesa ${table.name || table.table_number} está actualmente marcada como ${table.status}.`
                        );
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.tableCardHeader}>
                      <Text style={styles.tableCardTitle} numberOfLines={1}>
                        {table.name || `Mesa ${table.table_number}`}
                      </Text>
                      <View
                        style={[
                          styles.statusDotSmall,
                          isFree ? styles.statusDotFree : styles.statusDotOccupied,
                        ]}
                      />
                    </View>

                    <Text style={styles.tableCardZone}>{table.zone || 'General'}</Text>

                    <View style={styles.tableFeaturesRow}>
                      {table.capacity ? (
                        <View style={styles.featurePill}>
                          <Users size={11} color={ClubTheme.colors.textSecondary} />
                          <Text style={styles.featurePillText}>{table.capacity} pers.</Text>
                        </View>
                      ) : null}

                      {table.min_spend ? (
                        <View style={styles.featurePill}>
                          <CircleDollarSign size={11} color={ClubTheme.colors.success} />
                          <Text style={styles.featurePillText}>
                            Mín. ${table.min_spend.toLocaleString('es-CO')}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {table.conditions ? (
                      <Text style={styles.tableConditionsText} numberOfLines={2}>
                        {table.conditions}
                      </Text>
                    ) : null}

                    {/* Botón de acción en la tarjeta */}
                    <View
                      style={[
                        styles.tableSelectButton,
                        isSelected && styles.tableSelectButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tableSelectButtonText,
                          isSelected && styles.tableSelectButtonTextActive,
                        ]}
                      >
                        {!isFree
                          ? 'Ocupada'
                          : isSelected
                          ? 'Mesa seleccionada ✓'
                          : 'Seleccionar para reservar'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Formulario de Solicitud de Reserva */}
          <View style={styles.formContainerCard}>
            <View style={styles.formHeader}>
              <Sparkles size={16} color={ClubTheme.colors.primary} />
              <Text style={styles.formTitle}>Enviar Solicitud de Reserva</Text>
            </View>

            {bookingSuccessMessage ? (
              <View style={styles.successStateCard}>
                <CheckCircle2 size={30} color={ClubTheme.colors.success} />
                <Text style={styles.successHeading}>¡Solicitud enviada con éxito!</Text>
                <Text style={styles.successDescription}>{bookingSuccessMessage}</Text>
                <TouchableOpacity
                  style={styles.newRequestButton}
                  onPress={() => {
                    setBookingSuccessMessage(null);
                    setActiveSection('requests');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.newRequestButtonText}>Ver mis solicitudes</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.formFieldsBlock}>
                {selectedTable && (
                  <View style={styles.selectedTableNotice}>
                    <View style={styles.selectedTableTextGroup}>
                      <Text style={styles.selectedTableNoticeLabel}>Mesa seleccionada:</Text>
                      <Text style={styles.selectedTableNoticeValue}>
                        {selectedTable.name || `#${selectedTable.table_number}`} (Zona {selectedTable.zone || 'General'})
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setSelectedTableId('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={15} color={ClubTheme.colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nombre del titular</Text>
                  <TextInput
                    style={styles.inputField}
                    value={customerName}
                    onChangeText={setCustomerName}
                    placeholder="Tu nombre completo"
                    placeholderTextColor={ClubTheme.colors.textMuted}
                  />
                </View>

                <View style={styles.inputsRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Fecha de visita</Text>
                    <TextInput
                      style={styles.inputField}
                      value={reservationDate}
                      onChangeText={setReservationDate}
                      placeholder="AAAA-MM-DD"
                      placeholderTextColor={ClubTheme.colors.textMuted}
                    />
                  </View>

                  <View style={[styles.inputGroup, { width: 95 }]}>
                    <Text style={styles.inputLabel}>Personas</Text>
                    <TextInput
                      style={styles.inputField}
                      value={guestCount}
                      onChangeText={setGuestCount}
                      keyboardType="number-pad"
                      placeholder="2"
                      placeholderTextColor={ClubTheme.colors.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Notas especiales (opcional)</Text>
                  <TextInput
                    style={[styles.inputField, styles.textAreaField]}
                    value={comment}
                    onChangeText={setComment}
                    placeholder="Ej: Cumpleaños, botella de Tequila, ubicación preferida..."
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
                        <Send size={15} color="#ffffff" />
                        <Text style={styles.submitButtonText}>Enviar Solicitud</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.disclaimerText}>
                  Tu reserva queda como solicitud pendiente. El establecimiento confirmará la disponibilidad y te notificará su estado.
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 3. APARTADO: HISTORIAL DE RESERVAS                             */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'history' && (
        <View style={styles.sectionBody}>
          {/* Barra de búsqueda */}
          <View style={styles.searchBox}>
            <Search size={15} color={ClubTheme.colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={historySearch}
              onChangeText={setHistorySearch}
              placeholder="Buscar en historial por nota o tipo..."
              placeholderTextColor={ClubTheme.colors.textMuted}
            />
            {historySearch.length > 0 && (
              <TouchableOpacity onPress={() => setHistorySearch('')}>
                <X size={14} color={ClubTheme.colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filtros por estado */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsRow}
          >
            <TouchableOpacity
              style={[
                styles.filterPill,
                historyStatusFilter === 'all' && styles.filterPillActive,
              ]}
              onPress={() => setHistoryStatusFilter('all')}
            >
              <Text
                style={[
                  styles.filterPillText,
                  historyStatusFilter === 'all' && styles.filterPillTextActive,
                ]}
              >
                Todos ({historyBookings.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterPill,
                historyStatusFilter === 'confirmed' && styles.filterPillActive,
              ]}
              onPress={() => setHistoryStatusFilter('confirmed')}
            >
              <Text
                style={[
                  styles.filterPillText,
                  historyStatusFilter === 'confirmed' && styles.filterPillTextActive,
                ]}
              >
                Finalizadas / Usadas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterPill,
                historyStatusFilter === 'cancelled' && styles.filterPillActive,
              ]}
              onPress={() => setHistoryStatusFilter('cancelled')}
            >
              <Text
                style={[
                  styles.filterPillText,
                  historyStatusFilter === 'cancelled' && styles.filterPillTextActive,
                ]}
              >
                Canceladas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterPill,
                historyStatusFilter === 'rejected' && styles.filterPillActive,
              ]}
              onPress={() => setHistoryStatusFilter('rejected')}
            >
              <Text
                style={[
                  styles.filterPillText,
                  historyStatusFilter === 'rejected' && styles.filterPillTextActive,
                ]}
              >
                Rechazadas
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Lista de registros del historial */}
          {filteredHistory.length === 0 ? (
            <View style={styles.emptyCard}>
              <Clock size={36} color={ClubTheme.colors.textMuted} />
              <Text style={styles.emptyTitle}>Todavía no hay registros</Text>
              <Text style={styles.emptySubtitle}>
                {historySearch || historyStatusFilter !== 'all' || historyTypeFilter !== 'all'
                  ? 'No hay registros que coincidan con los filtros aplicados.'
                  : 'Las reservas y solicitudes anteriores que sean finalizadas o canceladas aparecerán aquí.'}
              </Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {filteredHistory.map((item) => {
                const badge = getStatusBadge(item.status, item.qr_status);
                const typeInfo = getBookingTypeInfo(item.booking_type);
                const TypeIcon = typeInfo.Icon;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.historyItemCard}
                    onPress={() => setSelectedBooking(item)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.historyItemLeft}>
                      <View style={styles.historyIconCircle}>
                        <TypeIcon size={14} color={typeInfo.color} />
                      </View>
                      <View style={styles.historyItemInfo}>
                        <Text style={styles.historyItemTitle}>{typeInfo.label}</Text>
                        <View style={styles.historyItemMeta}>
                          <Text style={styles.historyItemDate}>{item.reservation_date}</Text>
                          <Text style={styles.dotSeparator}>•</Text>
                          <Text style={styles.historyItemPeople}>
                            {item.number_of_people} pers.
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.historyItemRight}>
                      <View style={[styles.statusTag, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.statusTagText, { color: badge.color }]}>
                          {badge.text}
                        </Text>
                      </View>
                      <ChevronRight size={14} color={ClubTheme.colors.textMuted} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 4. MODAL: DETALLE COMPLETO DE LA SOLICITUD                     */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {selectedBooking && (
        <Modal
          visible={Boolean(selectedBooking)}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedBooking(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedBooking(null)}
          >
            <View
              style={styles.modalContent}
              onStartShouldSetResponder={() => true}
            >
              {/* Cabecera del modal */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalHeading}>Detalle de Solicitud</Text>
                  <Text style={styles.modalRefText}>
                    Ref: #{selectedBooking.id.slice(0, 8).toUpperCase()}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedBooking(null)}
                >
                  <X size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScroll}
                showsVerticalScrollIndicator={false}
              >
                {/* Badge de estado principal */}
                {(() => {
                  const badge = getStatusBadge(selectedBooking.status, selectedBooking.qr_status);
                  const typeInfo = getBookingTypeInfo(selectedBooking.booking_type);
                  const TypeIcon = typeInfo.Icon;

                  return (
                    <View style={styles.modalStatusBlock}>
                      <View style={[styles.modalStatusPill, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.modalStatusPillText, { color: badge.color }]}>
                          {badge.text}
                        </Text>
                      </View>
                      <Text style={styles.modalClubName}>{club.name}</Text>
                    </View>
                  );
                })()}

                {/* Cuadrícula de datos */}
                <View style={styles.modalDetailsGrid}>
                  <View style={styles.modalDetailItem}>
                    <Text style={styles.modalDetailLabel}>TIPO</Text>
                    <Text style={styles.modalDetailValue}>
                      {getBookingTypeInfo(selectedBooking.booking_type).label}
                    </Text>
                  </View>

                  <View style={styles.modalDetailItem}>
                    <Text style={styles.modalDetailLabel}>FECHA DE VISITA</Text>
                    <Text style={styles.modalDetailValue}>{selectedBooking.reservation_date}</Text>
                  </View>

                  <View style={styles.modalDetailItem}>
                    <Text style={styles.modalDetailLabel}>PERSONAS</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedBooking.number_of_people} asistentes
                    </Text>
                  </View>

                  <View style={styles.modalDetailItem}>
                    <Text style={styles.modalDetailLabel}>IMPORTE / ANTICIPO</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedBooking.total_amount > 0
                        ? `$ ${selectedBooking.total_amount.toLocaleString('es-CO')}`
                        : 'Sin cobro anticipado'}
                    </Text>
                  </View>
                </View>

                {/* Notas especiales si existen */}
                {selectedBooking.notes ? (
                  <View style={styles.modalNotesBlock}>
                    <Text style={styles.modalDetailLabel}>NOTAS DEL CLIENTE</Text>
                    <Text style={styles.modalNotesText}>{selectedBooking.notes}</Text>
                  </View>
                ) : null}

                {/* Código QR si la reserva está confirmada */}
                {(() => {
                  const isConfirmed =
                    ['confirmed', 'confirmada', 'paid', 'accepted', 'aprobada'].includes(
                      (selectedBooking.status || '').toLowerCase()
                    );

                  if (isConfirmed && selectedBooking.qr_code) {
                    return (
                      <View style={styles.modalQrBanner}>
                        <ShieldCheck size={20} color="#10B981" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.modalQrTitle}>Pase de acceso activo</Text>
                          <Text style={styles.modalQrSub}>
                            Código: {selectedBooking.qr_code}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.modalQrButton}
                          onPress={() => setQrModalVisible(true)}
                        >
                          <QrCode size={14} color="#FFFFFF" />
                          <Text style={styles.modalQrButtonText}>Ver QR</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  }
                  return null;
                })()}

                {/* Acciones permitidas según el estado */}
                {(() => {
                  const s = (selectedBooking.status || '').toLowerCase().trim();
                  if (s === 'pending' || s === 'pendiente') {
                    return (
                      <View style={styles.modalActionsArea}>
                        <TouchableOpacity
                          style={[
                            styles.cancelActionButton,
                            isCancelling && styles.cancelActionButtonDisabled,
                          ]}
                          onPress={() => handleCancelBooking(selectedBooking)}
                          disabled={isCancelling}
                          activeOpacity={0.8}
                        >
                          {isCancelling ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                          ) : (
                            <>
                              <Ban size={15} color="#EF4444" />
                              <Text style={styles.cancelActionButtonText}>
                                Cancelar solicitud
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                        <Text style={styles.actionNoteText}>
                          Puedes cancelar tu solicitud mientras esté pendiente de aprobación por el establecimiento.
                        </Text>
                      </View>
                    );
                  }

                  return (
                    <View style={styles.readOnlyNotice}>
                      <Text style={styles.readOnlyNoticeText}>
                        Registro en modo consulta • No editable
                      </Text>
                    </View>
                  );
                })()}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Modal QR oficial del usuario si pulsa ver QR */}
      {selectedBooking && qrModalVisible && (
        <UserQRModal
          visible={qrModalVisible}
          fullName={userFullName || 'Titular de reserva'}
          username={selectedBooking.id.slice(0, 8)}
          onClose={() => setQrModalVisible(false)}
          qrCode={selectedBooking.qr_code}
          clubName={club.name}
          ticketType={getBookingTypeInfo(selectedBooking.booking_type).label}
          status={selectedBooking.status}
        />
      )}
    </View>
  );
};

// ----------------------------------------------------------------------------
// ESTILOS MINIMALISTAS Y PROFESIONALES DE RESERVAS (HANGOVER USERS)
// ----------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },

  // CABECERA
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  historyIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  historyIconButtonActive: {
    backgroundColor: ClubTheme.colors.primary,
  },
  historyBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: ClubTheme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 4,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },

  // NAVEGACIÓN INTERNA (3 PESTAÑAS)
  subTabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 3,
    gap: 4,
  },
  subTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 11,
  },
  subTabButtonActive: {
    backgroundColor: 'rgba(192, 38, 211, 0.16)',
  },
  subTabText: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  subTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  subTabCounter: {
    backgroundColor: ClubTheme.colors.primary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  subTabCounterText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  subTabCounterNeutral: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  subTabCounterNeutralText: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },

  sectionBody: {
    gap: 14,
  },

  // CONTADORES SUPERIORES
  countersRow: {
    flexDirection: 'row',
    gap: 10,
  },
  counterCard: {
    flex: 1,
    backgroundColor: ClubTheme.colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: ClubTheme.radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
  },
  counterNumber: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  counterLabel: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },

  // TARJETAS DE SOLICITUDES
  cardsList: {
    gap: 10,
  },
  bookingCard: {
    backgroundColor: ClubTheme.colors.surface,
    borderRadius: ClubTheme.radii.lg,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardBody: {
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  dotSeparator: {
    color: ClubTheme.colors.textMuted,
    fontSize: 12,
  },
  peopleText: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  cardNotes: {
    color: ClubTheme.colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  amountText: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  detailLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailLinkText: {
    color: ClubTheme.colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },

  newBookingPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: ClubTheme.radii.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  newBookingPromptText: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },

  // ESTADO VACÍO
  emptyCard: {
    backgroundColor: ClubTheme.colors.surface,
    borderRadius: ClubTheme.radii.lg,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
  },
  emptyTitle: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  emptySubtitle: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
  },
  emptyActionButton: {
    marginTop: 8,
    backgroundColor: ClubTheme.colors.surfaceElevated,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: ClubTheme.radii.md,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
  },
  emptyActionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // MESAS Y PALCOS
  subSectionHeader: {
    gap: 2,
  },
  subSectionTitle: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  subSectionDesc: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
  },
  infoNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(129, 140, 248, 0.08)',
    borderRadius: ClubTheme.radii.md,
    padding: 12,
  },
  infoNoticeText: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  tablesGrid: {
    gap: 10,
  },
  tableCardItem: {
    backgroundColor: ClubTheme.colors.surface,
    borderRadius: ClubTheme.radii.md,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
  },
  tableCardItemSelected: {
    borderColor: ClubTheme.colors.primary,
    backgroundColor: ClubTheme.colors.primaryLight,
  },
  tableCardItemOccupied: {
    opacity: 0.55,
  },
  tableCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableCardTitle: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  statusDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotFree: {
    backgroundColor: ClubTheme.colors.success,
  },
  statusDotOccupied: {
    backgroundColor: ClubTheme.colors.danger,
  },
  tableCardZone: {
    color: ClubTheme.colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  tableFeaturesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ClubTheme.radii.sm,
  },
  featurePillText: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  tableConditionsText: {
    color: ClubTheme.colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  tableSelectButton: {
    marginTop: 4,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: ClubTheme.radii.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tableSelectButtonActive: {
    backgroundColor: ClubTheme.colors.primary,
  },
  tableSelectButtonText: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  tableSelectButtonTextActive: {
    color: '#FFFFFF',
  },

  // FORMULARIO DE RESERVA
  formContainerCard: {
    backgroundColor: ClubTheme.colors.surface,
    borderRadius: ClubTheme.radii.lg,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formTitle: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  formFieldsBlock: {
    gap: 12,
  },
  selectedTableNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ClubTheme.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: ClubTheme.radii.md,
    borderWidth: 1,
    borderColor: ClubTheme.colors.borderActive,
  },
  selectedTableTextGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  selectedTableNoticeLabel: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  selectedTableNoticeValue: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  inputGroup: {
    gap: 5,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputLabel: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  inputField: {
    height: 44,
    backgroundColor: ClubTheme.colors.bg,
    borderRadius: ClubTheme.radii.md,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
    paddingHorizontal: 12,
    color: ClubTheme.colors.textPrimary,
    fontSize: 13,
  },
  textAreaField: {
    height: 60,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  submitButton: {
    height: ClubTheme.touchTarget.minHeight,
    borderRadius: ClubTheme.radii.md,
    overflow: 'hidden',
    marginTop: 4,
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
  disclaimerText: {
    color: ClubTheme.colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  successStateCard: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  successHeading: {
    color: ClubTheme.colors.success,
    fontSize: 15,
    fontWeight: '800',
  },
  successDescription: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  newRequestButton: {
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: ClubTheme.radii.md,
    backgroundColor: ClubTheme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
  },
  newRequestButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // HISTORIAL
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ClubTheme.colors.surface,
    borderRadius: ClubTheme.radii.md,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
  },
  searchInput: {
    flex: 1,
    color: ClubTheme.colors.textPrimary,
    fontSize: 13,
  },
  filterPillsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  filterPillActive: {
    backgroundColor: 'rgba(192, 38, 211, 0.2)',
  },
  filterPillText: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  historyList: {
    gap: 8,
  },
  historyItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: ClubTheme.colors.surface,
    padding: 12,
    borderRadius: ClubTheme.radii.md,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  historyIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyItemInfo: {
    gap: 2,
    flex: 1,
  },
  historyItemTitle: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  historyItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  historyItemDate: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 11,
  },
  historyItemPeople: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 11,
  },
  historyItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // MODAL DE DETALLE
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: ClubTheme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: ClubTheme.colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalHeading: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  modalRefText: {
    color: ClubTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    gap: 16,
  },
  modalStatusBlock: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  modalStatusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  modalStatusPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  modalClubName: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  modalDetailsGrid: {
    backgroundColor: ClubTheme.colors.bg,
    borderRadius: ClubTheme.radii.md,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
  },
  modalDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalDetailLabel: {
    color: ClubTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalDetailValue: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  modalNotesBlock: {
    backgroundColor: ClubTheme.colors.bg,
    borderRadius: ClubTheme.radii.md,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
  },
  modalNotesText: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  modalQrBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: ClubTheme.radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  modalQrTitle: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '800',
  },
  modalQrSub: {
    color: '#34D399',
    fontSize: 11,
    marginTop: 2,
  },
  modalQrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modalQrButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  modalActionsArea: {
    gap: 8,
    marginTop: 6,
  },
  cancelActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: ClubTheme.radii.md,
    paddingVertical: 12,
  },
  cancelActionButtonDisabled: {
    opacity: 0.5,
  },
  cancelActionButtonText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  actionNoteText: {
    color: ClubTheme.colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  readOnlyNotice: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  readOnlyNoticeText: {
    color: ClubTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
});
