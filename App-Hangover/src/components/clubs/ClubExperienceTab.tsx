import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  Pressable,
} from 'react-native';
import {
  Wallet,
  ShoppingBag,
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  Banknote,
  LogOut,
  Info,
  ChevronRight,
  ShieldCheck,
  RotateCw,
  X,
  ExternalLink,
  Wine,
  Sparkles,
  MapPin,
  Check,
  Moon,
  QrCode,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { clubService } from '@/services/club.service';
import { ClubTheme } from '@/constants/clubTheme';
import { ClubOrdersSection } from './ClubOrdersSection';
import type { VenueAccount, VenueAccountEntry } from '@/types/venueAccount';
import type { VenueOrder } from '@/types/club.types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type ExperienceSubTab = 'account' | 'orders';
export type OrderFilter = 'all' | 'in_prep' | 'ready' | 'delivered' | 'completed';

export interface ClubExperienceTabProps {
  clubId: string;
  clubName?: string;
  hasActivePresence: boolean;
  isClubOpen?: boolean;
  orders: VenueOrder[];
  initialSubTab?: ExperienceSubTab;
  onOrderConfirmed?: () => void;
  onStayFinalized?: () => void;
  onNavigateToMenu?: () => void;
}

export const ClubExperienceTab: React.FC<ClubExperienceTabProps> = ({
  clubId,
  clubName = 'Discoteca',
  hasActivePresence,
  isClubOpen = true,
  orders = [],
  initialSubTab = 'account',
  onOrderConfirmed,
  onStayFinalized,
  onNavigateToMenu,
}) => {
  // Pestaña interna activa: 'account' (Mi cuenta) | 'orders' (Mis pedidos)
  const [activeSubTab, setActiveSubTab] = useState<ExperienceSubTab>(initialSubTab);

  // Estado operativo local de la discoteca (abierta / cerrada)
  const [isClubOpenState, setIsClubOpenState] = useState<boolean>(isClubOpen);

  useEffect(() => {
    if (isClubOpen !== undefined) {
      setIsClubOpenState(isClubOpen);
    }
  }, [isClubOpen]);

  // Filtro de pedidos
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');

  // Estados de cuenta y ledger
  const [account, setAccount] = useState<VenueAccount | null>(null);
  const [entries, setEntries] = useState<VenueAccountEntry[]>([]);
  const [stayStatus, setStayStatus] = useState<string>('inactive');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Estados de acciones
  const [isFinalizingStay, setIsFinalizingStay] = useState<boolean>(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState<boolean>(false);
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);

  // Referencia para evitar actualizaciones en componentes desmontados
  const isMountedRef = useRef<boolean>(true);

  // 1. Consulta autoritativa de la cuenta en el servidor
  const fetchAccountData = useCallback(async (manual = false) => {
    if (!clubId) {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
      return;
    }

    if (manual) setIsRefreshing(true);

    try {
      const res = await clubService.getMyActiveVenueAccount(clubId);
      if (isMountedRef.current) {
        if (!res.error) {
          setAccount(res.account);
          setEntries(res.entries || []);
          if (res.isClubOpen !== undefined) {
            setIsClubOpenState(res.isClubOpen);
          }
          if (res.stayStatus) {
            setStayStatus(res.stayStatus);
          } else if (res.account?.status === 'closed') {
            setStayStatus('finalized');
          } else {
            setStayStatus('inactive');
          }
        } else {
          console.warn('[ClubExperienceTab] Error al consultar cuenta:', res.error);
        }
      }
    } catch (err) {
      console.error('[ClubExperienceTab] Excepción al consultar cuenta:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [clubId]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchAccountData();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchAccountData]);

  // 2. Suscripción Realtime limpia y segura (sin error 'after subscribe()')
  useEffect(() => {
    if (!clubId) return;

    let isMounted = true;
    let activeChannel: RealtimeChannel | null = null;

    const setupSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isMounted) return;

        // Topic con timestamp único para prevenir colisiones en la caché del cliente
        const channelTopic = `user_venue_account_${clubId}_${user.id}_${Date.now()}`;
        const channel = supabase.channel(channelTopic);

        // REGISTRAR TODOS LOS LISTENERS ANTES DE SUBSCRIBE()
        channel
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'clubs',
              filter: `id=eq.${clubId}`,
            },
            (payload) => {
              const updatedModules = (payload.new as any)?.modules_config;
              if (updatedModules && updatedModules.is_open !== undefined) {
                const newIsOpen = Boolean(updatedModules.is_open);
                setIsClubOpenState(newIsOpen);
              }
              if (isMounted) fetchAccountData();
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'connect_presence',
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              if (isMounted) fetchAccountData();
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'venue_accounts',
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              if (isMounted) fetchAccountData();
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
              if (isMounted) fetchAccountData();
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'venue_orders',
              filter: `customer_id=eq.${user.id}`,
            },
            () => {
              if (isMounted) {
                fetchAccountData();
                if (onOrderConfirmed) onOrderConfirmed();
              }
            }
          );

        if (!isMounted) {
          supabase.removeChannel(channel);
          return;
        }

        channel.subscribe();
        activeChannel = channel;
      } catch (err) {
        console.warn('[ClubExperienceTab] Error en realtime:', err);
      }
    };

    setupSubscription();

    return () => {
      isMounted = false;
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
        activeChannel = null;
      }
    };
  }, [clubId, fetchAccountData]);

  // Formato monetario en pesos colombianos
  const formatCOP = (val: number) => {
    return `$${Math.round(val || 0).toLocaleString('es-CO')} COP`;
  };

  // Formato de hora
  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const balance = Number(account?.balance || 0);
  const totalCharged = Number(account?.total_charged || 0);
  const totalPaid = Number(account?.total_paid || 0);
  const hasOutstandingBalance = balance > 0;

  // Estado autoritativo de estancia finalizada
  const isStayFinalized = useMemo(() => {
    if (stayStatus === 'finalized' || stayStatus === 'closed_by_club') return true;
    if (account?.status === 'closed') return true;
    if (!hasActivePresence && account?.status !== 'open' && account?.status !== 'pending_payment' && (entries.length > 0 || totalPaid > 0)) {
      return true;
    }
    return false;
  }, [stayStatus, account?.status, hasActivePresence, entries.length, totalPaid]);

  // Estado de estancia activa dentro de la discoteca (autoritativo: presencia viva y club abierto)
  const isStayActive = useMemo(() => {
    return isClubOpenState && hasActivePresence && !isStayFinalized && (stayStatus === 'active' || stayStatus === 'pending_payment' || account?.status === 'open');
  }, [isClubOpenState, hasActivePresence, isStayFinalized, stayStatus, account?.status]);

  // Estado previo a la validación de entrada (cover comprado o sin entrar todavía)
  const isPreAdmission = useMemo(() => {
    return !isStayActive && !isStayFinalized && isClubOpenState;
  }, [isStayActive, isStayFinalized, isClubOpenState]);

  // Filtrado de pedidos según la pestaña seleccionada
  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return orders;
    if (orderFilter === 'in_prep') {
      return orders.filter((o) => ['pending', 'accepted', 'in_preparation'].includes(o.status));
    }
    if (orderFilter === 'ready') {
      return orders.filter((o) => o.status === 'ready');
    }
    if (orderFilter === 'delivered') {
      return orders.filter((o) => o.status === 'delivered');
    }
    if (orderFilter === 'completed') {
      return orders.filter((o) => o.status === 'completed');
    }
    return orders;
  }, [orders, orderFilter]);

  // Cantidad de pedidos activos o por confirmar
  const activeOrdersCount = useMemo(() => {
    return orders.filter((o) => ['pending', 'accepted', 'in_preparation', 'ready', 'delivered'].includes(o.status)).length;
  }, [orders]);

  // Confirmar recepción física de comanda
  const handleConfirmOrder = async (order: VenueOrder) => {
    setConfirmingOrderId(order.id);
    try {
      const res = await clubService.confirmOrderDelivery(order.id);
      if (res.success) {
        // Recargar de inmediato la cuenta y notificar al padre
        await fetchAccountData();
        if (onOrderConfirmed) {
          onOrderConfirmed();
        }
        Alert.alert(
          '¡Pedido Confirmado! 🎉',
          `La comanda #${order.order_number} ha sido confirmada y asentada en tu cuenta de estancia.`
        );
      } else {
        Alert.alert('Error al confirmar', res.error || 'No se pudo confirmar la entrega.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Error de conexión.');
    } finally {
      if (isMountedRef.current) {
        setConfirmingOrderId(null);
      }
    }
  };

  // Finalizar estancia voluntaria con control estricto de saldo
  const handleFinalizeStay = async () => {
    // 1. Bloqueo inmediato en interfaz si existe saldo pendiente
    if (hasOutstandingBalance) {
      Alert.alert(
        '⛔ Salida Bloqueada por Saldo Pendiente',
        `Tienes un saldo pendiente de ${formatCOP(balance)}. Debes cancelarlo en el bar antes de salir.`,
        [
          { text: 'Ver cómo pagar', onPress: () => setIsPaymentModalVisible(true) },
          { text: 'Entendido', style: 'cancel' },
        ]
      );
      return;
    }

    Alert.alert(
      'Finalizar Estancia',
      `¿Deseas concluir tu estancia en ${clubName}? El sistema verificará en el servidor que no tengas saldos pendientes.`,
      [
        { text: 'Permanecer en el local', style: 'cancel' },
        {
          text: 'Sí, finalizar estancia',
          style: 'default',
          onPress: async () => {
            // Deshabilita inmediatamente el botón e indica carga
            setIsFinalizingStay(true);
            try {
              const res = await clubService.finalizeVenueStay(clubId);
              if (!res.success) {
                if (res.code === 'STAY_ALREADY_FINALIZED') {
                  setStayStatus('finalized');
                  if (account) setAccount({ ...account, status: 'closed' });
                  await fetchAccountData();
                  if (onStayFinalized) {
                    onStayFinalized();
                  }
                  Alert.alert(
                    'Estancia Finalizada',
                    res.error || 'La estancia ya ha finalizado anteriormente.',
                    [{ text: 'Entendido' }]
                  );
                } else if (res.code === 'OUTSTANDING_BALANCE_CLUB_CLOSED') {
                  setIsClubOpenState(false);
                  setStayStatus('closed_by_club_with_debt');
                  await fetchAccountData();
                  Alert.alert(
                    'Discoteca Cerrada • Saldo Pendiente',
                    res.error || `La discoteca ha cerrado y tu estancia ha finalizado, pero tienes un saldo pendiente de ${formatCOP(res.balance || balance)}. Puedes pagarlo desde Mi Cuenta.`,
                    [
                      { text: 'Pagar saldo', onPress: () => setIsPaymentModalVisible(true) },
                      { text: 'Entendido', style: 'cancel' },
                    ]
                  );
                } else if (res.code === 'OUTSTANDING_BALANCE') {
                  await fetchAccountData();
                  Alert.alert(
                    '⛔ Salida Bloqueada por Saldo Pendiente',
                    res.error || `Tienes un saldo pendiente de ${formatCOP(res.balance || balance)}. Debes cancelarlo en el bar antes de salir.`,
                    [
                      { text: 'Ver cómo pagar', onPress: () => setIsPaymentModalVisible(true) },
                      { text: 'Entendido', style: 'cancel' },
                    ]
                  );
                } else if (res.code === 'ORDERS_PENDING') {
                  Alert.alert(
                    '⏳ Comandas Pendientes',
                    res.error || 'Tienes comandas activas o por confirmar. Confirma su recepción antes de salir.',
                    [{ text: 'Ver pedidos', onPress: () => setActiveSubTab('orders') }, { text: 'Entendido' }]
                  );
                } else {
                  Alert.alert('Error al salir', res.error || 'No se pudo autorizar la finalización de estancia.');
                }
              } else {
                // ÉXITO: Solo después de confirmación del servidor actualizamos estado a finalizado
                setStayStatus('finalized');
                if (account) {
                  setAccount({
                    ...account,
                    status: 'closed',
                    balance: 0,
                    closed_at: res.closed_at || new Date().toISOString(),
                  });
                }
                Alert.alert(
                  '✅ Estancia Finalizada',
                  res.message || '¡Gracias por visitarnos! Tu cuenta ha sido cerrada con éxito.',
                  [
                    {
                      text: 'Aceptar',
                      onPress: () => {
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
              if (isMountedRef.current) {
                setIsFinalizingStay(false);
              }
            }
          },
        },
      ]
    );
  };

  // Metadatos de estados de pedidos
  const getOrderMeta = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Pendiente', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', desc: 'Recibido en el bar' };
      case 'accepted':
        return { label: 'Aceptado', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)', desc: 'Aceptado por bartender' };
      case 'in_preparation':
        return { label: 'En Preparación', color: '#A78BFA', bg: 'rgba(153, 0, 240, 0.2)', desc: 'Alistando bebidas' };
      case 'ready':
        return { label: '¡Listo para Entrega!', color: '#10B981', bg: 'rgba(16, 185, 129, 0.2)', desc: 'Listo en barra o camino a mesa' };
      case 'delivered':
        return { label: 'Por Confirmar', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.2)', desc: 'Entregado físicamente' };
      case 'completed':
        return { label: 'Completado', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', desc: 'Recepción confirmada' };
      case 'rejected':
      case 'cancelled':
        return { label: 'Cancelado', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', desc: 'Pedido anulado' };
      default:
        return { label: status, color: ClubTheme.colors.textSecondary, bg: ClubTheme.colors.surfaceElevated, desc: 'Actualizado' };
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. SELECTOR PRINCIPAL DE SUB-PESTAÑAS (MI CUENTA / MIS PEDIDOS) */}
      <View style={styles.segmentedTabBar}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSubTab === 'account' && styles.segmentBtnActive]}
          activeOpacity={0.8}
          onPress={() => setActiveSubTab('account')}
        >
          <Wallet size={16} color={activeSubTab === 'account' ? '#FFFFFF' : '#A1A1AA'} />
          <Text style={[styles.segmentText, activeSubTab === 'account' && styles.segmentTextActive]}>
            Mi cuenta
          </Text>
          {hasOutstandingBalance && (
            <View style={styles.segmentDebtDot} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSubTab === 'orders' && styles.segmentBtnActive]}
          activeOpacity={0.8}
          onPress={() => setActiveSubTab('orders')}
        >
          <ShoppingBag size={16} color={activeSubTab === 'orders' ? '#FFFFFF' : '#A1A1AA'} />
          <Text style={[styles.segmentText, activeSubTab === 'orders' && styles.segmentTextActive]}>
            Mis pedidos
          </Text>
          {activeOrdersCount > 0 && (
            <View style={styles.segmentBadge}>
              <Text style={styles.segmentBadgeText}>{activeOrdersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ==================================================================== */}
      {/* 2. SUB-PESTAÑA: MI CUENTA                                             */}
      {/* ==================================================================== */}
      {activeSubTab === 'account' && (
        <View style={styles.subTabContent}>
          {/* A. ENCABEZADO DE CUENTA */}
          <View style={styles.accountHeaderBox}>
            <View style={styles.accountHeaderTopRow}>
              <View style={styles.clubTitleCol}>
                <Text style={styles.accountHeaderTitle}>Mi cuenta de estancia</Text>
                <Text style={styles.accountClubName} numberOfLines={1}>
                  {clubName}
                </Text>
              </View>

              <View style={styles.accountBadgesRow}>
                {isStayActive && (
                  <View style={styles.presencePill}>
                    <ShieldCheck size={12} color="#10B981" />
                    <Text style={styles.presencePillText}>Acceso validado</Text>
                  </View>
                )}

                {isStayFinalized && isClubOpenState && (
                  <View style={styles.presencePillFinalized}>
                    <CheckCircle2 size={12} color="#A78BFA" />
                    <Text style={styles.presencePillFinalizedText}>Estancia finalizada</Text>
                  </View>
                )}

                {!isClubOpenState && (
                  <View style={styles.presencePillClosed}>
                    <Moon size={12} color="#A78BFA" />
                    <Text style={styles.presencePillClosedText}>Discoteca cerrada</Text>
                  </View>
                )}

                {isPreAdmission && (
                  <View style={styles.presencePillPreAdmission}>
                    <Clock size={12} color="#F59E0B" />
                    <Text style={styles.presencePillPreAdmissionText}>Por ingresar</Text>
                  </View>
                )}

                <View
                  style={[
                    styles.statusPill,
                    balance === 0 && (totalPaid > 0 || isStayFinalized) && styles.statusPillPaid,
                    hasOutstandingBalance && styles.statusPillDebt,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      balance === 0 && (totalPaid > 0 || isStayFinalized) && styles.statusPillTextPaid,
                      hasOutstandingBalance && styles.statusPillTextDebt,
                    ]}
                  >
                    {!isClubOpenState && !hasOutstandingBalance
                      ? 'Cerrada'
                      : isStayFinalized && !hasOutstandingBalance
                      ? 'Finalizada'
                      : account?.status === 'closed'
                      ? 'Finalizada'
                      : balance === 0 && totalPaid > 0
                      ? 'Saldada'
                      : hasOutstandingBalance
                      ? 'Saldo Pendiente'
                      : isStayActive
                      ? 'Abierta'
                      : 'Por ingresar'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* AVISO DESTACADO CUANDO LA DISCOTECA HA CERRADO */}
          {!isClubOpenState && (
            <View style={styles.clubClosedStayNoticeCard}>
              <View style={styles.clubClosedStayHeaderRow}>
                <View style={styles.clubClosedIconCircle}>
                  <Moon size={18} color="#A78BFA" />
                </View>
                <View style={styles.clubClosedTextCol}>
                  <Text style={styles.clubClosedStayTitle}>
                    La discoteca ha cerrado y tu estancia ha finalizado
                  </Text>
                  {hasOutstandingBalance ? (
                    <Text style={styles.clubClosedStaySubtitleDebt}>
                      Tu cuenta sigue pendiente de pago. Puedes consultar tus consumos y pagar el saldo desde Mi cuenta.
                    </Text>
                  ) : (
                    <Text style={styles.clubClosedStaySubtitleClean}>
                      Tu estancia ha concluido sin saldos pendientes. ¡Gracias por visitarnos!
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* B. RESUMEN FINANCIERO: HERO CARD CON SALDO PENDIENTE */}
          <View style={[styles.heroFinancialCard, hasOutstandingBalance && styles.heroFinancialCardDebt]}>
            <Text style={[styles.heroDebtLabel, hasOutstandingBalance && styles.heroDebtLabelWarning]}>
              {hasOutstandingBalance ? 'SALDO PENDIENTE POR PAGAR' : 'SALDO TOTAL PENDIENTE'}
            </Text>
            <Text style={[styles.heroDebtAmount, !hasOutstandingBalance && styles.heroDebtAmountZero]}>
              {formatCOP(balance)}
            </Text>

            {hasOutstandingBalance ? (
              <View style={styles.debtWarningChip}>
                <AlertTriangle size={13} color="#F59E0B" />
                <Text style={styles.debtWarningChipText}>
                  Debes cancelar este saldo antes de solicitar la finalización de estancia.
                </Text>
              </View>
            ) : (
              <View style={styles.clearAccountChip}>
                <CheckCircle2 size={13} color="#10B981" />
                <Text style={styles.clearAccountChipText}>
                  ¡Cuenta al día! No tienes consumos pendientes de pago.
                </Text>
              </View>
            )}

            {/* 3 INDICADORES COMPACTOS */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiTitle}>TOTAL CONSUMIDO</Text>
                <Text style={styles.kpiValueNeutral}>{formatCOP(totalCharged)}</Text>
              </View>

              <View style={styles.kpiDivider} />

              <View style={styles.kpiItem}>
                <Text style={styles.kpiTitle}>PAGOS VERIFICADOS</Text>
                <Text style={styles.kpiValueGreen}>{formatCOP(totalPaid)}</Text>
              </View>

              <View style={styles.kpiDivider} />

              <View style={styles.kpiItem}>
                <Text style={[styles.kpiTitle, hasOutstandingBalance && { color: '#F59E0B' }]}>
                  SALDO PENDIENTE
                </Text>
                <Text style={[styles.kpiValueDebt, !hasOutstandingBalance && styles.kpiValueGreen]}>
                  {formatCOP(balance)}
                </Text>
              </View>
            </View>
          </View>

          {/* C. ACCIONES PRINCIPALES DE CUENTA */}
          <View style={styles.accountActionsRow}>
            {hasOutstandingBalance && (
              <TouchableOpacity
                style={styles.payPrimaryBtn}
                activeOpacity={0.85}
                onPress={() => setIsPaymentModalVisible(true)}
              >
                <CreditCard size={15} color="#FFFFFF" />
                <Text style={styles.payPrimaryBtnText}>Pagar saldo pendiente</Text>
              </TouchableOpacity>
            )}

            {!isClubOpenState ? (
              <View style={styles.stayFinalizedNoticeCard}>
                <Moon size={15} color="#A78BFA" />
                <Text style={styles.stayFinalizedNoticeText}>
                  Estancia finalizada: la discoteca cerró
                </Text>
              </View>
            ) : isStayFinalized ? (
              <View
                style={[
                  styles.stayFinalizedNoticeCard,
                  !hasOutstandingBalance && styles.stayFinalizedNoticeCardSuccess,
                ]}
              >
                <CheckCircle2
                  size={15}
                  color={hasOutstandingBalance ? '#F59E0B' : '#10B981'}
                />
                <Text
                  style={[
                    styles.stayFinalizedNoticeText,
                    !hasOutstandingBalance && styles.stayFinalizedNoticeTextSuccess,
                  ]}
                >
                  {hasOutstandingBalance
                    ? 'Estancia finalizada • Saldo pendiente'
                    : 'Estancia finalizada • Cuenta al día'}
                </Text>
              </View>
            ) : isStayActive ? (
              <TouchableOpacity
                style={[
                  styles.exitSecondaryBtn,
                  !hasOutstandingBalance && styles.exitSecondaryBtnSuccess,
                  hasOutstandingBalance && styles.exitSecondaryBtnBlocked,
                ]}
                activeOpacity={0.8}
                disabled={isFinalizingStay}
                onPress={handleFinalizeStay}
              >
                {isFinalizingStay ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <LogOut size={15} color={hasOutstandingBalance ? '#F87171' : '#FFFFFF'} />
                    <Text
                      style={[
                        styles.exitSecondaryBtnText,
                        hasOutstandingBalance && styles.exitSecondaryBtnTextBlocked,
                      ]}
                    >
                      Finalizar estancia
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.preAdmissionNoticeCard}>
                <View style={styles.preAdmissionIconCircle}>
                  <QrCode size={18} color="#9900F0" />
                </View>
                <View style={styles.preAdmissionTextCol}>
                  <Text style={styles.preAdmissionTitle}>
                    Valida tu QR en la entrada
                  </Text>
                  <Text style={styles.preAdmissionDesc}>
                    Para activar tu estancia y comanda en sala, el personal de puerta debe validar tu código QR.
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* D. MOVIMIENTOS DE CUENTA (LEDGER INMUTABLE) */}
          <View style={styles.ledgerCard}>
            <View style={styles.ledgerHeader}>
              <View style={styles.ledgerTitleGroup}>
                <Receipt size={16} color="#9900F0" />
                <Text style={styles.ledgerTitle}>Movimientos de la estancia</Text>
              </View>
              <View style={styles.ledgerCountBadge}>
                <Text style={styles.ledgerCountText}>{entries.length}</Text>
              </View>
            </View>

            {entries.length === 0 ? (
              <View style={styles.emptyStateBox}>
                <Receipt size={28} color="#71717A" />
                <Text style={styles.emptyStateTitle}>Sin consumos confirmados</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Cuando recibas un pedido en tu mesa y confirmes su entrega, el cargo aparecerá aquí automáticamente.
                </Text>
                {onNavigateToMenu && (
                  <TouchableOpacity style={styles.emptyActionBtn} onPress={onNavigateToMenu}>
                    <Wine size={14} color="#FFFFFF" />
                    <Text style={styles.emptyActionBtnText}>Explorar Carta</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.entriesList}>
                {entries.map((entry) => {
                  const isPayment = entry.entry_type === 'payment';
                  return (
                    <View key={entry.id} style={styles.entryItem}>
                      <View style={styles.entryLeftCol}>
                        <View style={[styles.entryIconBox, isPayment && styles.entryIconBoxPayment]}>
                          {isPayment ? (
                            <Banknote size={15} color="#10B981" />
                          ) : (
                            <Receipt size={15} color="#A78BFA" />
                          )}
                        </View>
                        <View style={styles.entryTextCol}>
                          <Text style={styles.entryConcept} numberOfLines={2}>
                            {entry.items_summary || (isPayment ? `Pago en caja (${entry.payment_method || 'Caja'})` : 'Consumo en sala')}
                          </Text>
                          <View style={styles.entrySubRow}>
                            <Text style={styles.entryTime}>
                              {formatTime(entry.created_at)}
                            </Text>
                            {entry.order_id && (
                              <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => setActiveSubTab('orders')}
                                style={styles.orderLinkChip}
                              >
                                <Text style={styles.orderLinkChipText}>Ver comanda</Text>
                                <ChevronRight size={10} color="#C4B5FD" />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </View>

                      <View style={styles.entryRightCol}>
                        <Text style={[styles.entryAmount, isPayment ? styles.entryAmountPayment : styles.entryAmountCharge]}>
                          {isPayment ? '-' : '+'}
                          {formatCOP(entry.amount)}
                        </Text>
                        <View style={[styles.entryTypeBadge, isPayment && styles.entryTypeBadgePayment]}>
                          <Text style={[styles.entryTypeBadgeText, isPayment && styles.entryTypeBadgeTextPayment]}>
                            {isPayment ? 'Pago verificado' : 'Cargo confirmado'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      )}

      {/* ==================================================================== */}
      {/* 3. SUB-PESTAÑA: MIS PEDIDOS EN VIVO (REDISEÑO PREMIUM)              */}
      {/* ==================================================================== */}
      {activeSubTab === 'orders' && (
        <View style={styles.subTabContent}>
          <ClubOrdersSection
            clubId={clubId}
            clubName={clubName}
            orders={orders}
            entries={entries}
            account={account}
            onNavigateToMenu={onNavigateToMenu}
            onNavigateToAccount={() => setActiveSubTab('account')}
            onOrderConfirmed={async () => {
              await fetchAccountData();
              if (onOrderConfirmed) onOrderConfirmed();
            }}
            onRefreshOrders={async () => {
              await fetchAccountData();
              if (onOrderConfirmed) onOrderConfirmed();
            }}
          />
        </View>
      )}

      {/* ==================================================================== */}
      {/* 4. MODAL INFORMATIVO DE PAGO                                         */}
      {/* ==================================================================== */}
      <Modal
        visible={isPaymentModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPaymentModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalSheetHeader}>
              <View style={styles.modalSheetTitleGroup}>
                <CreditCard size={18} color="#9900F0" />
                <Text style={styles.modalSheetTitle}>Pagar saldo de estancia</Text>
              </View>
              <TouchableOpacity onPress={() => setIsPaymentModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalSheetBody} showsVerticalScrollIndicator={false}>
              <View style={styles.modalDebtCard}>
                <Text style={styles.modalDebtCardLabel}>SALDO PENDIENTE ACTUAL</Text>
                <Text style={styles.modalDebtCardAmount}>{formatCOP(balance)}</Text>
                <Text style={styles.modalDebtCardClub}>{clubName}</Text>
              </View>

              <View style={styles.paymentMethodCard}>
                <View style={styles.methodIconBox}>
                  <Banknote size={20} color="#10B981" />
                </View>
                <View style={styles.methodInfoCol}>
                  <Text style={styles.methodTitle}>Pago en Caja o Barra</Text>
                  <Text style={styles.methodDesc}>
                    Acércate a la barra o caja e indica tu nombre. Puedes abonar o cancelar en efectivo, datáfono o QR Bancolombia/Nequi.
                  </Text>
                  <Text style={styles.methodAuditNote}>
                    • El cajero registrará el pago verificado y se reflejará en tiempo real.
                  </Text>
                </View>
              </View>

              <View style={styles.gatewayNoticeCard}>
                <View style={styles.gatewayNoticeHeader}>
                  <Info size={15} color="#38BDF8" />
                  <Text style={styles.gatewayNoticeTitle}>Hangover Pay en línea (En Integración)</Text>
                </View>
                <Text style={styles.gatewayNoticeDesc}>
                  La pasarela de pago virtual directa se encuentra en homologación. Por seguridad, no se admiten cobros ficticios o no confirmados por el servidor.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalDismissBtn}
              activeOpacity={0.85}
              onPress={() => setIsPaymentModalVisible(false)}
            >
              <Text style={styles.modalDismissBtnText}>Entendido</Text>
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
  // 1. SELECTOR PRINCIPAL DE PESTAÑAS
  segmentedTabBar: {
    flexDirection: 'row',
    backgroundColor: '#13111C',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(153, 0, 240, 0.25)',
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#4700D8',
    shadowColor: '#9900F0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 3,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  segmentDebtDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  segmentBadge: {
    backgroundColor: '#F900BF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  segmentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subTabContent: {
    gap: 14,
  },

  // 2. MI CUENTA
  accountHeaderBox: {
    backgroundColor: '#1A1726',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  accountHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clubTitleCol: {
    flex: 1,
  },
  accountHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A1A1AA',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  accountClubName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  accountBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  presencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  presencePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  statusPillPaid: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusPillDebt: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
  },
  statusPillTextPaid: {
    color: '#10B981',
  },
  statusPillTextDebt: {
    color: '#F59E0B',
  },

  // HERO RESUMEN FINANCIERO
  heroFinancialCard: {
    backgroundColor: '#1E1B2E',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(153, 0, 240, 0.35)',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  heroFinancialCardDebt: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: '#201A24',
  },
  heroDebtLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A1A1AA',
    letterSpacing: 0.8,
  },
  heroDebtLabelWarning: {
    color: '#F59E0B',
  },
  heroDebtAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FDE68A',
    marginVertical: 6,
  },
  heroDebtAmountZero: {
    color: '#10B981',
  },
  debtWarningChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 14,
  },
  debtWarningChipText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#FDE68A',
    flex: 1,
    lineHeight: 14,
  },
  clearAccountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 14,
  },
  clearAccountChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#A7F3D0',
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#14121F',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
  },
  kpiDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  kpiTitle: {
    fontSize: 8,
    fontWeight: '700',
    color: '#71717A',
    marginBottom: 3,
    letterSpacing: 0.4,
  },
  kpiValueNeutral: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F4F4F5',
  },
  kpiValueGreen: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981',
  },
  kpiValueDebt: {
    fontSize: 12,
    fontWeight: '900',
    color: '#F59E0B',
  },

  // ACCIONES PRINCIPALES
  accountActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  payPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#9900F0',
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: '#9900F0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  payPrimaryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  exitSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#27272A',
    borderRadius: 12,
    paddingVertical: 12,
  },
  exitSecondaryBtnSuccess: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  exitSecondaryBtnBlocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  exitSecondaryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  exitSecondaryBtnTextBlocked: {
    color: '#F87171',
  },

  // MOVIMIENTOS DE CUENTA (LEDGER)
  ledgerCard: {
    backgroundColor: '#1A1726',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  ledgerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  ledgerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ledgerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ledgerCountBadge: {
    backgroundColor: 'rgba(153, 0, 240, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ledgerCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C4B5FD',
  },
  entriesList: {
    paddingHorizontal: 16,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  entryLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 10,
  },
  entryIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(153, 0, 240, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryIconBoxPayment: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  entryTextCol: {
    flex: 1,
  },
  entryConcept: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F4F4F5',
  },
  entrySubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  entryTime: {
    fontSize: 10,
    color: '#71717A',
  },
  orderLinkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(249, 0, 191, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  orderLinkChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#F900BF',
  },
  entryRightCol: {
    alignItems: 'flex-end',
  },
  entryAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  entryAmountCharge: {
    color: '#F4F4F5',
  },
  entryAmountPayment: {
    color: '#10B981',
  },
  entryTypeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  entryTypeBadgePayment: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  entryTypeBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#A1A1AA',
  },
  entryTypeBadgeTextPayment: {
    color: '#10B981',
  },
  emptyStateBox: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  emptyStateSubtitle: {
    fontSize: 11,
    color: '#71717A',
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 260,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#9900F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 8,
  },
  emptyActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // 3. MIS PEDIDOS EN SALA
  ordersHeaderBox: {
    backgroundColor: '#1A1726',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  ordersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ordersSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ordersSectionSubtitle: {
    fontSize: 11,
    color: '#A1A1AA',
    marginTop: 2,
  },
  newOrderShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#9900F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  newOrderShortcutBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filtersScroll: {
    gap: 6,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#14121F',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  filterPillActive: {
    backgroundColor: '#4700D8',
    borderColor: '#9900F0',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  filterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  filterBadgeActive: {
    backgroundColor: '#F900BF',
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#A1A1AA',
  },
  filterBadgeTextActive: {
    color: '#FFFFFF',
  },
  ordersList: {
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#1A1726',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: 14,
  },
  orderCardDelivered: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: '#1F1B24',
  },
  orderCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#14121F',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  locationChipText: {
    fontSize: 10,
    color: '#A1A1AA',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  orderItemsBox: {
    backgroundColor: '#14121F',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  orderItemLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderItemQuantity: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F900BF',
    width: 24,
  },
  orderItemName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#F4F4F5',
  },
  orderItemSubtotal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A1A1AA',
  },
  noItemsText: {
    fontSize: 11,
    color: '#71717A',
  },
  orderNotesBox: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  orderNotesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F900BF',
  },
  orderNotesText: {
    fontSize: 10,
    color: '#A1A1AA',
    flex: 1,
  },
  orderCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  orderTotalLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 0.4,
  },
  orderTotalValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 1,
  },
  orderFooterRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  orderTimeText: {
    fontSize: 10,
    color: '#71717A',
  },
  seeAccountLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  seeAccountLinkText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F900BF',
  },
  confirmDeliveryBanner: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    gap: 10,
  },
  confirmDeliveryHeaderRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  confirmDeliveryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FDE68A',
  },
  confirmDeliverySubtitle: {
    fontSize: 10,
    color: '#FDE68A',
    lineHeight: 14,
    marginTop: 2,
  },
  confirmDeliveryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 10,
  },
  confirmDeliveryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 10,
  },
  completedBannerText: {
    fontSize: 10,
    color: '#A7F3D0',
    fontWeight: '600',
  },
  emptyOrdersCard: {
    backgroundColor: '#1A1726',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(153, 0, 240, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyOrdersTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyOrdersDesc: {
    fontSize: 11,
    color: '#71717A',
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 240,
  },
  emptyExploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#9900F0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  emptyExploreBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // 4. MODAL DE PAGO
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalSheet: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#1A1726',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(153, 0, 240, 0.35)',
    padding: 18,
  },
  modalSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalSheetTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalSheetTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSheetBody: {
    marginBottom: 14,
  },
  modalDebtCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  modalDebtCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.6,
  },
  modalDebtCardAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FDE68A',
    marginVertical: 4,
  },
  modalDebtCardClub: {
    fontSize: 11,
    color: '#A1A1AA',
  },
  paymentMethodCard: {
    flexDirection: 'row',
    backgroundColor: '#14121F',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    padding: 12,
    gap: 12,
    marginBottom: 10,
  },
  methodIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfoCol: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  methodDesc: {
    fontSize: 11,
    color: '#A1A1AA',
    lineHeight: 15,
  },
  methodAuditNote: {
    fontSize: 10,
    color: '#A7F3D0',
    marginTop: 4,
  },
  gatewayNoticeCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    padding: 12,
    gap: 4,
  },
  gatewayNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gatewayNoticeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  gatewayNoticeDesc: {
    fontSize: 10,
    color: '#BAE6FD',
    lineHeight: 14,
  },
  modalDismissBtn: {
    backgroundColor: '#9900F0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDismissBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  presencePillClosed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  presencePillClosedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C4B5FD',
  },
  clubClosedStayNoticeCard: {
    backgroundColor: '#0F0E1E',
    borderWidth: 1,
    borderColor: 'rgba(153, 0, 240, 0.35)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  clubClosedStayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  clubClosedIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(153, 0, 240, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  clubClosedTextCol: {
    flex: 1,
  },
  clubClosedStayTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  clubClosedStaySubtitleDebt: {
    color: '#FCD34D',
    fontSize: 12,
    lineHeight: 17,
  },
  clubClosedStaySubtitleClean: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 17,
  },
  stayFinalizedNoticeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  stayFinalizedNoticeCardSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  stayFinalizedNoticeText: {
    color: '#C4B5FD',
    fontSize: 13,
    fontWeight: '700',
  },
  stayFinalizedNoticeTextSuccess: {
    color: '#34D399',
  },
  presencePillFinalized: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  presencePillFinalizedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C4B5FD',
  },
  clubClosedOrdersNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  clubClosedOrdersNoticeText: {
    color: '#C4B5FD',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  preAdmissionNoticeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(153, 0, 240, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(153, 0, 240, 0.25)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  preAdmissionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(153, 0, 240, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preAdmissionTextCol: {
    flex: 1,
  },
  preAdmissionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  preAdmissionDesc: {
    color: '#A1A1AA',
    fontSize: 11,
    lineHeight: 15,
  },
  presencePillPreAdmission: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  presencePillPreAdmissionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FDE68A',
  },
});
