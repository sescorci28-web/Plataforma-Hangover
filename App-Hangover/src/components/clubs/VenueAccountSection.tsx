import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import {
  Wallet,
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  Banknote,
  LogOut,
  Info,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  RotateCw,
  X,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { clubService } from '@/services/club.service';
import { ClubTheme } from '@/constants/clubTheme';
import type { VenueAccount, VenueAccountEntry } from '@/types/venueAccount';

import type { RealtimeChannel } from '@supabase/supabase-js';

export interface VenueAccountSectionProps {
  clubId: string;
  clubName?: string;
  hasActivePresence: boolean;
  onStayFinalized?: () => void;
  onOrderConfirmed?: () => void;
  refreshTrigger?: number;
}

export const VenueAccountSection: React.FC<VenueAccountSectionProps> = ({
  clubId,
  clubName = 'Discoteca',
  hasActivePresence,
  onStayFinalized,
  onOrderConfirmed,
  refreshTrigger,
}) => {
  const [account, setAccount] = useState<VenueAccount | null>(null);
  const [entries, setEntries] = useState<VenueAccountEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isFinalizingStay, setIsFinalizingStay] = useState<boolean>(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState<boolean>(false);
  const [isEntriesExpanded, setIsEntriesExpanded] = useState<boolean>(true);

  // Consulta de la cuenta activa del usuario en este establecimiento
  const fetchAccountData = useCallback(async () => {
    if (!clubId) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await clubService.getMyActiveVenueAccount(clubId);
      if (res.error) {
        console.warn('[VenueAccountSection] Error al consultar cuenta:', res.error);
      } else {
        setAccount(res.account);
        setEntries(res.entries || []);
      }
    } catch (err) {
      console.error('[VenueAccountSection] Excepción al consultar cuenta:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [clubId]);

  useEffect(() => {
    fetchAccountData();
  }, [fetchAccountData]);

  // Recarga garantizada ante trigger de pedidos confirmados
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchAccountData();
    }
  }, [refreshTrigger, fetchAccountData]);

  // Suscripción en Tiempo Real para cambios en la cuenta y movimientos del ledger
  // Se registran todos los listeners ANTES de llamar a .subscribe()
  // y se limpian limpiamente con removeChannel para evitar el error 'after subscribe()'
  useEffect(() => {
    if (!clubId) return;

    let isMounted = true;
    let activeChannel: RealtimeChannel | null = null;

    const setupSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isMounted) return;

        // Topic único con timestamp para evitar colisión de canales suscritos en la caché de Supabase
        const channelTopic = `user_venue_account_${clubId}_${user.id}_${Date.now()}`;
        const channel = supabase.channel(channelTopic);

        // 1. REGISTRAR TODOS LOS LISTENERS ANTES DE SUBSCRIBE()
        channel
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'venue_accounts',
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              if (isMounted) {
                fetchAccountData();
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'venue_account_entries',
            },
            () => {
              if (isMounted) {
                fetchAccountData();
              }
            }
          );

        if (!isMounted) {
          supabase.removeChannel(channel);
          return;
        }

        // 2. INICIAR SUSCRIPCIÓN DESPUÉS DE REGISTRAR LISTENERS
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Canal suscrito exitosamente
          }
        });

        activeChannel = channel;
      } catch (err) {
        console.warn('[VenueAccountSection] Error configurando realtime:', err);
      }
    };

    setupSubscription();

    // 3. LIMPIEZA SÍNCRONA
    return () => {
      isMounted = false;
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
        activeChannel = null;
      }
    };
  }, [clubId, fetchAccountData]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchAccountData();
  };

  // Formateador de moneda en pesos colombianos
  const formatCOP = (amount: number) => {
    return `$${Math.round(amount || 0).toLocaleString('es-CO')} COP`;
  };

  // Formateador de hora
  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Control estricto de salida: Finalizar Estancia
  const handleFinalizeStay = async () => {
    Alert.alert(
      'Finalizar Estancia',
      `¿Deseas concluir tu estancia en ${clubName} y cerrar tu sesión presencial?`,
      [
        { text: 'Continuar en el local', style: 'cancel' },
        {
          text: 'Sí, finalizar estancia',
          style: 'default',
          onPress: async () => {
            setIsFinalizingStay(true);
            try {
              // Llamada autoritativa a la función del servidor
              const result = await clubService.finalizeVenueStay(clubId);

              if (!result.success) {
                // Si el servidor detectó saldo pendiente o comandas pendientes
                if (result.code === 'OUTSTANDING_BALANCE') {
                  Alert.alert(
                    '⛔ Salida Bloqueada por Saldo Pendiente',
                    result.error ||
                      `Tienes un saldo pendiente de ${formatCOP(
                        result.balance || account?.balance || 0
                      )}. Debes cancelarlo en el bar antes de salir.`,
                    [
                      {
                        text: 'Ver cómo pagar',
                        onPress: () => setIsPaymentModalVisible(true),
                      },
                      { text: 'Entendido', style: 'cancel' },
                    ]
                  );
                } else if (result.code === 'ORDERS_PENDING') {
                  Alert.alert(
                    '⏳ Comandas Pendientes de Entrega',
                    result.error ||
                      'Tienes pedidos en preparación o pendientes de entrega. Confirma la recepción antes de salir.',
                    [{ text: 'Entendido' }]
                  );
                } else {
                  Alert.alert(
                    'Error al finalizar estancia',
                    result.error || 'No se pudo autorizar la salida.'
                  );
                }
              } else {
                // Saldo cero validado por el servidor, estancia finalizada con éxito
                Alert.alert(
                  '✅ Estancia Finalizada',
                  result.message || '¡Gracias por visitarnos! Tu cuenta ha sido cerrada con éxito.',
                  [
                    {
                      text: 'Aceptar',
                      onPress: () => {
                        setAccount(null);
                        setEntries([]);
                        if (onStayFinalized) {
                          onStayFinalized();
                        }
                      },
                    },
                  ]
                );
              }
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Error de conexión con el servidor.');
            } finally {
              setIsFinalizingStay(false);
            }
          },
        },
      ]
    );
  };

  // Si no está presente y no tiene cuenta abierta, no renderizar la tarjeta
  if (!hasActivePresence && !account) {
    return null;
  }

  const balance = account ? Number(account.balance || 0) : 0;
  const totalCharged = account ? Number(account.total_charged || 0) : 0;
  const totalPaid = account ? Number(account.total_paid || 0) : 0;
  const hasOutstandingBalance = balance > 0;

  // Badge de Estado de la Cuenta
  const getStatusBadge = () => {
    if (!account) {
      return {
        label: 'Por Iniciar',
        color: ClubTheme.colors.textMuted,
        bg: 'rgba(255, 255, 255, 0.08)',
      };
    }
    if (account.status === 'closed') {
      return {
        label: 'Cerrada',
        color: ClubTheme.colors.textMuted,
        bg: 'rgba(255, 255, 255, 0.08)',
      };
    }
    if (balance === 0 && totalPaid > 0) {
      return {
        label: 'Saldada • Al día',
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.15)',
      };
    }
    if (hasOutstandingBalance) {
      return {
        label: 'Saldo Pendiente',
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.15)',
      };
    }
    return {
      label: 'Abierta',
      color: '#38BDF8',
      bg: 'rgba(56, 189, 248, 0.15)',
    };
  };

  const statusBadge = getStatusBadge();

  return (
    <View style={styles.container}>
      {/* 1. CABECERA DE LA SECCIÓN DE CUENTA */}
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View style={styles.titleWithIcon}>
            <View style={styles.iconCircle}>
              <Wallet size={18} color={ClubTheme.colors.primary} />
            </View>
            <View>
              <Text style={styles.sectionTitle}>MI CUENTA EN LA DISCOTECA</Text>
              <Text style={styles.clubSubtitle} numberOfLines={1}>
                {clubName}
              </Text>
            </View>
          </View>

          <View style={styles.headerRightActions}>
            <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>
                {statusBadge.label}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleManualRefresh}
              style={styles.refreshBtn}
              activeOpacity={0.7}
              disabled={isRefreshing}
            >
              <RotateCw
                size={14}
                color={ClubTheme.colors.textSecondary}
                style={isRefreshing ? { transform: [{ rotate: '45deg' }] } : undefined}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. TARJETAS DE SALDOS Y TOTALES AUTORITATIVOS */}
        <View style={styles.kpiContainer}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>TOTAL CONSUMIDO</Text>
            <Text style={styles.kpiValueNeutral}>{formatCOP(totalCharged)}</Text>
          </View>

          <View style={styles.kpiDivider} />

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>PAGOS VERIFICADOS</Text>
            <Text style={styles.kpiValuePaid}>{formatCOP(totalPaid)}</Text>
          </View>

          <View style={styles.kpiDivider} />

          <View
            style={[
              styles.kpiCard,
              hasOutstandingBalance && styles.kpiCardHighlightDebt,
            ]}
          >
            <Text
              style={[
                styles.kpiLabel,
                hasOutstandingBalance && styles.kpiLabelDebt,
              ]}
            >
              SALDO PENDIENTE
            </Text>
            <Text
              style={[
                styles.kpiValueDebt,
                !hasOutstandingBalance && styles.kpiValueZeroDebt,
              ]}
            >
              {formatCOP(balance)}
            </Text>
          </View>
        </View>

        {/* 3. AVISO DE CONTROL DE SALDO Y ESTADO DE VERIFICACIÓN */}
        {hasOutstandingBalance ? (
          <View style={styles.debtAlertBanner}>
            <AlertTriangle size={16} color="#F59E0B" />
            <Text style={styles.debtAlertText}>
              Tienes un saldo pendiente por pagar. Debes cancelarlo en el bar antes de poder
              finalizar tu estancia y salir.
            </Text>
          </View>
        ) : (
          <View style={styles.clearAccountBanner}>
            <CheckCircle2 size={15} color="#10B981" />
            <Text style={styles.clearAccountText}>
              ¡Cuenta al día! No tienes pagos pendientes de verificación en esta estancia.
            </Text>
          </View>
        )}

        {/* 4. ACCIONES PRINCIPALES: BOTÓN DE PAGO Y BOTÓN DE FINALIZAR ESTANCIA */}
        <View style={styles.actionsRow}>
          {hasOutstandingBalance && (
            <TouchableOpacity
              style={styles.payButton}
              activeOpacity={0.8}
              onPress={() => setIsPaymentModalVisible(true)}
            >
              <CreditCard size={15} color="#FFFFFF" />
              <Text style={styles.payButtonText}>Pagar saldo pendiente</Text>
            </TouchableOpacity>
          )}

          {hasActivePresence && account?.status === 'open' && (
            <TouchableOpacity
              style={[
                styles.exitButton,
                !hasOutstandingBalance && styles.exitButtonFullWidth,
                hasOutstandingBalance && styles.exitButtonBlocked,
              ]}
              activeOpacity={0.8}
              disabled={isFinalizingStay}
              onPress={handleFinalizeStay}
            >
              {isFinalizingStay ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <LogOut
                    size={15}
                    color={hasOutstandingBalance ? '#F87171' : '#FFFFFF'}
                  />
                  <Text
                    style={[
                      styles.exitButtonText,
                      hasOutstandingBalance && styles.exitButtonBlockedText,
                    ]}
                  >
                    Finalizar estancia
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 5. HISTORIAL DE CONSUMOS CONFIRMADOS (LEDGER INMUTABLE) */}
      <View style={styles.ledgerSection}>
        <TouchableOpacity
          style={styles.ledgerHeader}
          activeOpacity={0.7}
          onPress={() => setIsEntriesExpanded(!isEntriesExpanded)}
        >
          <View style={styles.ledgerHeaderLeft}>
            <Receipt size={16} color={ClubTheme.colors.primary} />
            <Text style={styles.ledgerHeaderTitle}>CONSUMOS Y MOVIMIENTOS</Text>
            <View style={styles.entriesBadge}>
              <Text style={styles.entriesBadgeText}>{entries.length}</Text>
            </View>
          </View>
          {isEntriesExpanded ? (
            <ChevronUp size={16} color={ClubTheme.colors.textMuted} />
          ) : (
            <ChevronDown size={16} color={ClubTheme.colors.textMuted} />
          )}
        </TouchableOpacity>

        {isEntriesExpanded && (
          <View style={styles.entriesList}>
            {entries.length === 0 ? (
              <View style={styles.emptyEntriesBox}>
                <Text style={styles.emptyEntriesText}>
                  Aún no tienes consumos confirmados en esta estancia. Cuando recibas un pedido en
                  tu mesa y confirmes su entrega, aparecerá aquí automáticamente.
                </Text>
              </View>
            ) : (
              entries.map((entry) => {
                const isCharge = entry.entry_type === 'charge';
                const isPayment = entry.entry_type === 'payment';

                return (
                  <View key={entry.id} style={styles.entryRow}>
                    <View style={styles.entryLeftCol}>
                      <View style={styles.entryIconBox}>
                        {isCharge ? (
                          <Receipt size={14} color="#A78BFA" />
                        ) : (
                          <Banknote size={14} color="#10B981" />
                        )}
                      </View>
                      <View style={styles.entryDetails}>
                        <Text style={styles.entrySummaryText} numberOfLines={2}>
                          {entry.items_summary ||
                            (isPayment
                              ? `Pago verificado (${entry.payment_method || 'Caja'})`
                              : 'Consumo en sala')}
                        </Text>
                        <Text style={styles.entryTimeText}>
                          {formatTime(entry.created_at)}
                          {entry.notes ? ` • ${entry.notes}` : ''}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.entryAmountText,
                        isPayment ? styles.entryAmountPayment : styles.entryAmountCharge,
                      ]}
                    >
                      {isPayment ? '-' : '+'}
                      {formatCOP(entry.amount)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        )}
      </View>

      {/* 6. MODAL INFORMATIVO DE PAGO Y MÉTODOS DISPONIBLES */}
      <Modal
        visible={isPaymentModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleGroup}>
                <CreditCard size={18} color={ClubTheme.colors.primary} />
                <Text style={styles.modalTitle}>Pago de Consumos en Sala</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsPaymentModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color={ClubTheme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.modalDebtBox}>
                <Text style={styles.modalDebtLabel}>SALDO PENDIENTE ACTUAL</Text>
                <Text style={styles.modalDebtValue}>{formatCOP(balance)}</Text>
                <Text style={styles.modalDebtClub}>Discoteca: {clubName}</Text>
              </View>

              <View style={styles.paymentMethodCard}>
                <View style={styles.methodIconBox}>
                  <Banknote size={20} color="#10B981" />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodTitle}>Pago en Barra o Caja del Bar</Text>
                  <Text style={styles.methodDescription}>
                    Acércate al bar e indica tu nombre o número de comanda. Puedes abonar o pagar
                    en efectivo, datáfono o QR Bancolombia/Nequi.
                  </Text>
                  <Text style={styles.methodAuditNote}>
                    • El personal registrará el pago verificado en el sistema y tu saldo se
                    actualizará aquí en tiempo real.
                  </Text>
                </View>
              </View>

              <View style={styles.gatewayPendingCard}>
                <View style={styles.gatewayPendingHeader}>
                  <Info size={16} color="#38BDF8" />
                  <Text style={styles.gatewayPendingTitle}>
                    Pago Virtual Hangover Pay (En Integración)
                  </Text>
                </View>
                <Text style={styles.gatewayPendingText}>
                  La pasarela de pago virtual directa con Wompi/Bancolombia se encuentra en proceso
                  de homologación para cobros en vivo. Por políticas de seguridad, no se admiten
                  pagos ficticios o no verificados por el servidor.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalConfirmBtn}
              activeOpacity={0.8}
              onPress={() => setIsPaymentModalVisible(false)}
            >
              <Text style={styles.modalConfirmBtnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  headerCard: {
    backgroundColor: '#1E1B2E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.4)',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F3F4F6',
    letterSpacing: 0.8,
  },
  clubSubtitle: {
    fontSize: 11,
    color: ClubTheme.colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  refreshBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  kpiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161324',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    alignItems: 'center',
  },
  kpiCardHighlightDebt: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    paddingVertical: 4,
  },
  kpiDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: ClubTheme.colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  kpiLabelDebt: {
    color: '#F59E0B',
  },
  kpiValueNeutral: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E5E7EB',
  },
  kpiValuePaid: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10B981',
  },
  kpiValueDebt: {
    fontSize: 13,
    fontWeight: '900',
    color: '#F59E0B',
  },
  kpiValueZeroDebt: {
    color: '#10B981',
  },
  debtAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  debtAlertText: {
    flex: 1,
    fontSize: 11,
    color: '#FDE68A',
    lineHeight: 16,
    fontWeight: '500',
  },
  clearAccountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  clearAccountText: {
    flex: 1,
    fontSize: 11,
    color: '#A7F3D0',
    lineHeight: 16,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  payButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ClubTheme.colors.primary,
    borderRadius: 12,
    paddingVertical: 11,
    shadowColor: ClubTheme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  payButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  exitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingVertical: 11,
  },
  exitButtonFullWidth: {
    flex: 1,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  exitButtonBlocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  exitButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  exitButtonBlockedText: {
    color: '#F87171',
  },
  ledgerSection: {
    marginTop: 10,
    backgroundColor: '#1A1826',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    overflow: 'hidden',
  },
  ledgerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  ledgerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ledgerHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E5E7EB',
    letterSpacing: 0.6,
  },
  entriesBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  entriesBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C4B5FD',
  },
  entriesList: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  emptyEntriesBox: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyEntriesText: {
    fontSize: 11,
    color: ClubTheme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  entryLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 10,
  },
  entryIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryDetails: {
    flex: 1,
  },
  entrySummaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F3F4F6',
  },
  entryTimeText: {
    fontSize: 10,
    color: ClubTheme.colors.textMuted,
    marginTop: 2,
  },
  entryAmountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  entryAmountCharge: {
    color: '#E5E7EB',
  },
  entryAmountPayment: {
    color: '#10B981',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#1E1B2E',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalBody: {
    marginBottom: 16,
  },
  modalDebtBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  modalDebtLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  modalDebtValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FDE68A',
    marginBottom: 4,
  },
  modalDebtClub: {
    fontSize: 11,
    color: ClubTheme.colors.textSecondary,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    backgroundColor: '#161324',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    padding: 14,
    gap: 12,
    marginBottom: 12,
  },
  methodIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 11,
    color: ClubTheme.colors.textSecondary,
    lineHeight: 16,
    marginBottom: 6,
  },
  methodAuditNote: {
    fontSize: 10,
    color: '#A7F3D0',
    lineHeight: 14,
  },
  gatewayPendingCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    padding: 14,
  },
  gatewayPendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  gatewayPendingTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  gatewayPendingText: {
    fontSize: 10,
    color: '#BAE6FD',
    lineHeight: 15,
  },
  modalConfirmBtn: {
    backgroundColor: ClubTheme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
