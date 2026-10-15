import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import {
  Ticket as TicketIcon, QrCode, Calendar, Clock,
  MapPin, AlertCircle, RefreshCw, CheckCircle2, XCircle
} from 'lucide-react-native';
import { UserBookingTicket } from '@/services/ticket.service';

interface UserTicketsSectionProps {
  tickets: UserBookingTicket[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectTicketQR: (ticket: UserBookingTicket) => void;
}

type TicketFilterType = 'all' | 'active' | 'used' | 'past';

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'Fecha por confirmar';
  try {
    const cleanDate = dateStr.split('T')[0];
    const [year, month, day] = cleanDate.split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null) return 'COP $0';
  return `COP $${amount.toLocaleString('es-CO')}`;
}

export function UserTicketsSection({
  tickets,
  loading,
  error,
  onRetry,
  onSelectTicketQR,
}: UserTicketsSectionProps) {
  const [filter, setFilter] = useState<TicketFilterType>('all');

  // Categorización real de entradas basada estrictamente en status y qr_status de public.bookings
  const isTicketUsed = (t: UserBookingTicket) =>
    t.qr_status === 'used' || t.status === 'COMPLETED' || t.status === 'completed';

  const isTicketCancelled = (t: UserBookingTicket) =>
    t.qr_status === 'cancelled' ||
    t.status === 'CANCELLED' || t.status === 'cancelled' ||
    t.status === 'REJECTED' || t.status === 'rejected' ||
    t.status === 'EXPIRED' || t.status === 'expired';

  const isTicketActive = (t: UserBookingTicket) =>
    !isTicketUsed(t) && !isTicketCancelled(t);

  const activeTickets = tickets.filter(isTicketActive);
  const usedTickets = tickets.filter(isTicketUsed);
  const pastTickets = tickets.filter(isTicketCancelled);

  const filteredTickets = filter === 'active'
    ? activeTickets
    : filter === 'used'
    ? usedTickets
    : filter === 'past'
    ? pastTickets
    : tickets;

  // ESTADO DE CARGA DE ENTRADAS DESDE BOOKINGS
  if (loading) {
    return (
      <View style={styles.stateCard}>
        <ActivityIndicator size="small" color="#9900F0" />
        <Text style={styles.stateLoadingText}>Cargando tus entradas desde tu cuenta...</Text>
      </View>
    );
  }

  // ESTADO DE ERROR AL CONSULTAR SUPABASE
  if (error) {
    return (
      <View style={styles.stateCardError}>
        <AlertCircle size={24} color="#ef4444" style={{ marginBottom: 8 }} />
        <Text style={styles.stateErrorTitle}>No pudimos cargar tus entradas</Text>
        <Text style={styles.stateErrorSub}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.8}>
          <RefreshCw size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ESTADO VACÍO REAL (SIN BOOKINGS EN LA BASE DE DATOS)
  if (tickets.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <View style={styles.emptyIconCircle}>
          <TicketIcon size={32} color="#A855F7" />
        </View>
        <Text style={styles.emptyTitle}>No tienes entradas todavía</Text>
        <Text style={styles.emptySub}>
          Tus entradas para eventos y reservas en Hangover se guardarán automáticamente aquí con tu código QR oficial.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER Y FILTROS SEGÚN DATOS REALES DE BOOKINGS */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Mis entradas ({tickets.length})</Text>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
            Todas ({tickets.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'active' && styles.filterChipActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterChipText, filter === 'active' && styles.filterChipTextActive]}>
            Próximas ({activeTickets.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'used' && styles.filterChipActive]}
          onPress={() => setFilter('used')}
        >
          <Text style={[styles.filterChipText, filter === 'used' && styles.filterChipTextActive]}>
            Usadas ({usedTickets.length})
          </Text>
        </TouchableOpacity>

        {pastTickets.length > 0 && (
          <TouchableOpacity
            style={[styles.filterChip, filter === 'past' && styles.filterChipActive]}
            onPress={() => setFilter('past')}
          >
            <Text style={[styles.filterChipText, filter === 'past' && styles.filterChipTextActive]}>
              Expiradas ({pastTickets.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* LISTADO DE TARJETAS DE ENTRADA PROVENIENTES DE PUBLIC.BOOKINGS */}
      <View style={styles.ticketsList}>
        {filteredTickets.map((t) => {
          const used = isTicketUsed(t);
          const cancelled = isTicketCancelled(t);
          const clubName = t.club?.name || t.event?.club?.name;
          const eventTitle = t.event?.title || t.event_name || 'Evento Hangover';
          const ticketTypeName = t.ticket_batch?.name || 'Entrada General';
          const displayPrice = t.total_amount ?? t.ticket_batch?.price;
          const eventDate = t.event_date || t.event?.date;
          const eventTime = t.event_time || t.event?.start_time;

          return (
            <View key={t.id} style={[styles.ticketCard, (used || cancelled) && styles.ticketCardInactive]}>
              {/* HEADER DE LA TARJETA */}
              <View style={styles.ticketTopRow}>
                <View style={styles.eventInfoBox}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {eventTitle}
                  </Text>
                  {clubName && (
                    <View style={styles.locationRow}>
                      <MapPin size={12} color="#F900BF" style={{ marginRight: 4 }} />
                      <Text style={styles.clubName}>{clubName}</Text>
                    </View>
                  )}
                </View>

                {/* INSIGNIA DE ESTADO */}
                <View style={[
                  styles.statusBadge,
                  used ? styles.statusBadgeUsed : cancelled ? styles.statusBadgeCancelled : styles.statusBadgeActive
                ]}>
                  {used ? (
                    <CheckCircle2 size={12} color="#94a3b8" style={{ marginRight: 4 }} />
                  ) : cancelled ? (
                    <XCircle size={12} color="#ef4444" style={{ marginRight: 4 }} />
                  ) : (
                    <TicketIcon size={12} color="#34d399" style={{ marginRight: 4 }} />
                  )}
                  <Text style={[
                    styles.statusBadgeText,
                    used ? styles.statusBadgeTextUsed : cancelled ? styles.statusBadgeTextCancelled : styles.statusBadgeTextActive
                  ]}>
                    {used ? 'Utilizada' : cancelled ? 'Expirada' : 'Próxima'}
                  </Text>
                </View>
              </View>

              {/* DETALLES DE FECHA Y HORA */}
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Calendar size={13} color="#94a3b8" style={{ marginRight: 4 }} />
                  <Text style={styles.detailText}>{formatDate(eventDate)}</Text>
                </View>

                {eventTime && (
                  <View style={styles.detailItem}>
                    <Clock size={13} color="#94a3b8" style={{ marginRight: 4 }} />
                    <Text style={styles.detailText}>{eventTime}</Text>
                  </View>
                )}
              </View>

              <View style={styles.ticketMetaRow}>
                <Text style={styles.ticketTypeName}>
                  🎟️ {ticketTypeName}
                </Text>
                {displayPrice !== undefined && (
                  <Text style={styles.ticketPriceText}>{formatCurrency(displayPrice)}</Text>
                )}
              </View>

              {/* BOTÓN PROTAGÓNICO [ VER QR ] CON EL QR_CODE REAL */}
              <TouchableOpacity
                style={[styles.verQrButton, (used || cancelled) && styles.verQrButtonDisabled]}
                onPress={() => onSelectTicketQR(t)}
                activeOpacity={0.8}
              >
                <QrCode size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.verQrButtonText}>VER QR</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  headerRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterChip: {
    backgroundColor: '#0F0921',
    borderColor: 'rgba(153, 0, 240, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  filterChipActive: {
    backgroundColor: '#9900F0',
    borderColor: '#F900BF',
  },
  filterChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  ticketsList: {
    gap: 14,
  },
  ticketCard: {
    backgroundColor: '#0F0921',
    borderColor: 'rgba(153, 0, 240, 0.35)',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    position: 'relative',
  },
  ticketCardInactive: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.8,
  },
  ticketTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  eventInfoBox: {
    flex: 1,
    marginRight: 8,
  },
  eventTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clubName: {
    color: '#FF85B3',
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  statusBadgeUsed: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
  },
  statusBadgeCancelled: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusBadgeTextActive: {
    color: '#34d399',
  },
  statusBadgeTextUsed: {
    color: '#94a3b8',
  },
  statusBadgeTextCancelled: {
    color: '#ef4444',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  ticketMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 14,
  },
  ticketTypeName: {
    color: '#A855F7',
    fontSize: 13,
    fontWeight: '800',
  },
  ticketPriceText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  verQrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9900F0',
    borderRadius: 14,
    height: 44,
  },
  verQrButtonDisabled: {
    backgroundColor: 'rgba(153, 0, 240, 0.4)',
  },
  verQrButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  stateCard: {
    backgroundColor: '#0F0921',
    borderColor: 'rgba(153, 0, 240, 0.2)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  stateLoadingText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },
  stateCardError: {
    backgroundColor: '#0F0921',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  stateErrorTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  stateErrorSub: {
    color: '#ef4444',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#0F0921',
    borderColor: 'rgba(153, 0, 240, 0.25)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySub: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
