import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import {
  ShoppingBag,
  Wine,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCw,
  Sparkles,
  MapPin,
  Receipt,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  HelpCircle,
  Eye,
  Check,
  Info,
  Calendar,
} from 'lucide-react-native';
import { ClubTheme } from '@/constants/clubTheme';
import { clubService } from '@/services/club.service';
import type { VenueOrder, VenueOrderItem } from '@/types/club.types';
import type { VenueAccount, VenueAccountEntry } from '@/types/venueAccount';

export type OrderFilter = 'all' | 'in_prep' | 'ready' | 'delivered' | 'completed';

export interface ClubOrdersSectionProps {
  clubId: string;
  clubName?: string;
  orders: VenueOrder[];
  entries?: VenueAccountEntry[];
  account?: VenueAccount | null;
  onNavigateToMenu?: () => void;
  onNavigateToAccount?: () => void;
  onOrderConfirmed?: () => void;
  onRefreshOrders?: () => Promise<void>;
}

export const ClubOrdersSection: React.FC<ClubOrdersSectionProps> = ({
  clubId,
  clubName = 'Discoteca',
  orders = [],
  entries = [],
  account = null,
  onNavigateToMenu,
  onNavigateToAccount,
  onOrderConfirmed,
  onRefreshOrders,
}) => {
  // Filtro activo
  const [activeFilter, setActiveFilter] = useState<OrderFilter>('all');

  // Estado de confirmación en curso (ID de comanda confirmándose)
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);

  // Comanda seleccionada para el modal de detalle completo
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<VenueOrder | null>(null);

  // Set de IDs de comandas con lista de productos expandida
  const [expandedItemOrders, setExpandedItemOrders] = useState<Record<string, boolean>>({});

  // Formato monetario en pesos colombianos
  const formatCOP = (val?: number | null) => {
    return `$${Math.round(val || 0).toLocaleString('es-CO')} COP`;
  };

  // Formato estándar de número de comanda (ej: #ORD-1027-48E5)
  const formatOrderNumber = (num?: string | null) => {
    if (!num) return '#ORD-XXXX';
    return num.startsWith('#') ? num : `#${num}`;
  };

  // Formato de hora legible (ej: 10:45 PM)
  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Formato de fecha y hora completa para auditoría
  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return 'No registrado';
    try {
      const d = new Date(isoString);
      return `${d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })} • ${d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return isoString;
    }
  };

  // --------------------------------------------------------------------------
  // CÁLCULO DE RESUMEN COMPACTO (KPIS CON DATOS REALES)
  // --------------------------------------------------------------------------
  const activeCount = useMemo(() => {
    return orders.filter((o) =>
      ['pending', 'accepted', 'in_preparation', 'ready', 'delivered'].includes(o.status)
    ).length;
  }, [orders]);

  const readyAndDeliveredCount = useMemo(() => {
    return orders.filter((o) => ['ready', 'delivered'].includes(o.status)).length;
  }, [orders]);

  const completedCount = useMemo(() => {
    return orders.filter((o) => o.status === 'completed').length;
  }, [orders]);

  // Contadores por filtro individual
  const filterCounts = useMemo(() => {
    return {
      all: orders.length,
      in_prep: orders.filter((o) => ['pending', 'accepted', 'in_preparation'].includes(o.status)).length,
      ready: orders.filter((o) => o.status === 'ready').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      completed: orders.filter((o) => o.status === 'completed').length,
    };
  }, [orders]);

  // Lista de pedidos filtrada
  const filteredOrders = useMemo(() => {
    switch (activeFilter) {
      case 'in_prep':
        return orders.filter((o) => ['pending', 'accepted', 'in_preparation'].includes(o.status));
      case 'ready':
        return orders.filter((o) => o.status === 'ready');
      case 'delivered':
        return orders.filter((o) => o.status === 'delivered');
      case 'completed':
        return orders.filter((o) => o.status === 'completed');
      case 'all':
      default:
        return orders;
    }
  }, [orders, activeFilter]);

  // Toggle para expandir/contraer lista larga de productos en una tarjeta
  const toggleExpandOrderItems = (orderId: string) => {
    setExpandedItemOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // Metadatos visuales y semánticos según el estado del pedido
  const getOrderMeta = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pendiente',
          color: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.25)',
          icon: Clock,
          tagline: 'En cola de espera en la barra',
        };
      case 'accepted':
        return {
          label: 'Aceptado',
          color: '#38BDF8',
          bg: 'rgba(56, 189, 248, 0.12)',
          border: 'rgba(56, 189, 248, 0.25)',
          icon: Clock,
          tagline: 'Tomado por el bartender',
        };
      case 'in_preparation':
        return {
          label: 'En preparación',
          color: '#A78BFA',
          bg: 'rgba(153, 0, 240, 0.15)',
          border: 'rgba(153, 0, 240, 0.3)',
          icon: RotateCw,
          tagline: 'El bar está preparando tu pedido',
        };
      case 'ready':
        return {
          label: '¡Listo para entrega!',
          color: '#10B981',
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.35)',
          icon: Sparkles,
          tagline: 'Listo en barra o camino a tu mesa',
        };
      case 'delivered':
        return {
          label: 'Por confirmar',
          color: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.18)',
          border: 'rgba(245, 158, 11, 0.4)',
          icon: AlertTriangle,
          tagline: 'Entregado físicamente • Requiere tu confirmación',
        };
      case 'completed':
        return {
          label: 'Entrega confirmada',
          color: '#10B981',
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.2)',
          icon: CheckCircle2,
          tagline: 'Recepción verificada • Cargo asentado en cuenta',
        };
      case 'rejected':
      case 'cancelled':
        return {
          label: 'Cancelado',
          color: '#EF4444',
          bg: 'rgba(239, 68, 68, 0.12)',
          border: 'rgba(239, 68, 68, 0.25)',
          icon: X,
          tagline: 'Pedido anulado sin cargo contable',
        };
      default:
        return {
          label: status,
          color: '#A1A1AA',
          bg: 'rgba(255, 255, 255, 0.08)',
          border: 'rgba(255, 255, 255, 0.12)',
          icon: Clock,
          tagline: 'Estado actualizado',
        };
    }
  };

  // Buscar movimiento de ledger asociado a una comanda
  const getEntryForOrder = (orderId: string) => {
    return entries.find((e) => e.order_id === orderId);
  };

  // --------------------------------------------------------------------------
  // CONFIRMAR RECEPCIÓN CON DIÁLOGO EXPLÍCITO Y PROTECCIÓN CONTRA DUPLICADOS
  // --------------------------------------------------------------------------
  const handleConfirmReception = (order: VenueOrder) => {
    const formattedNum = formatOrderNumber(order.order_number);
    Alert.alert(
      'Confirmar Recepción de Comanda',
      `¿Ya recibiste físicamente los productos de la comanda ${formattedNum}?\n\nAl confirmar, se registrará el cargo de ${formatCOP(order.total || order.total_amount)} en tu cuenta de estancia.`,
      [
        {
          text: 'Aún no lo recibo',
          style: 'cancel',
        },
        {
          text: 'Sí, confirmar recepción',
          style: 'default',
          onPress: async () => {
            setConfirmingOrderId(order.id);
            try {
              const res = await clubService.confirmOrderDelivery(order.id);
              if (res.success) {
                if (onOrderConfirmed) {
                  onOrderConfirmed();
                }
                Alert.alert(
                  '¡Comanda Verificada! 🎉',
                  `Tu pedido ${formattedNum} ha sido confirmado exitosamente y el cargo quedó registrado en tu cuenta de estancia.`
                );
              } else {
                Alert.alert('Aviso al confirmar', res.error || 'No se pudo confirmar la entrega.');
              }
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Error de conexión con el servidor.');
            } finally {
              setConfirmingOrderId(null);
            }
          },
        },
      ]
    );
  };

  // Reportar problema con la comanda
  const handleReportProblem = (order: VenueOrder) => {
    const formattedNum = formatOrderNumber(order.order_number);
    Alert.alert(
      'Atención en Sala • Soporte de Pedido',
      `Si tienes algún inconveniente con la comanda ${formattedNum} (productos faltantes o demora), por favor acércate a la barra principal o solicítale asistencia al mesero de tu zona indicando tu número de pedido.\n\nUbicación registrada: ${order.table_or_location || 'Salón general'}.`,
      [{ text: 'Entendido', style: 'default' }]
    );
  };

  return (
    <View style={styles.container}>
      {/* ==================================================================== */}
      {/* 1. ENCABEZADO DE MIS PEDIDOS CON BOTÓN + NUEVO PEDIDO                  */}
      {/* ==================================================================== */}
      <View style={styles.headerBox}>
        <View style={styles.headerMainRow}>
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Mis pedidos</Text>
            <Text style={styles.headerSubtitle}>
              Consulta tus comandas y sigue cada entrega.
            </Text>
          </View>

          {onNavigateToMenu && (
            <TouchableOpacity
              style={styles.newOrderBtn}
              activeOpacity={0.82}
              onPress={onNavigateToMenu}
            >
              <Plus size={15} color="#FFFFFF" strokeWidth={2.6} />
              <Text style={styles.newOrderBtnText}>Nuevo pedido</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* RESUMEN COMPACTO (3 KPIS REALES) */}
        <View style={styles.kpiContainer}>
          <View style={[styles.kpiCard, styles.kpiCardActive]}>
            <View style={styles.kpiIconWrapper}>
              <RotateCw size={13} color="#A78BFA" />
            </View>
            <View style={styles.kpiTextGroup}>
              <Text style={styles.kpiNumber}>{activeCount}</Text>
              <Text style={styles.kpiLabel}>Activos</Text>
            </View>
          </View>

          <View
            style={[
              styles.kpiCard,
              readyAndDeliveredCount > 0 ? styles.kpiCardAlert : styles.kpiCardNeutral,
            ]}
          >
            <View
              style={[
                styles.kpiIconWrapper,
                readyAndDeliveredCount > 0 && styles.kpiIconWrapperAlert,
              ]}
            >
              <Sparkles
                size={13}
                color={readyAndDeliveredCount > 0 ? '#F59E0B' : '#71717A'}
              />
            </View>
            <View style={styles.kpiTextGroup}>
              <Text
                style={[
                  styles.kpiNumber,
                  readyAndDeliveredCount > 0 && styles.kpiNumberAlert,
                ]}
              >
                {readyAndDeliveredCount}
              </Text>
              <Text style={styles.kpiLabel}>Por recibir</Text>
            </View>
          </View>

          <View style={[styles.kpiCard, styles.kpiCardCompleted]}>
            <View style={[styles.kpiIconWrapper, styles.kpiIconWrapperSuccess]}>
              <CheckCircle2 size={13} color="#10B981" />
            </View>
            <View style={styles.kpiTextGroup}>
              <Text style={[styles.kpiNumber, styles.kpiNumberSuccess]}>
                {completedCount}
              </Text>
              <Text style={styles.kpiLabel}>Completados</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ==================================================================== */}
      {/* 2. FILTROS DINÁMICOS CON DESPLAZAMIENTO HORIZONTAL                   */}
      {/* ==================================================================== */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
        >
          {[
            { key: 'all' as OrderFilter, label: 'Todos', count: filterCounts.all },
            { key: 'in_prep' as OrderFilter, label: 'En preparación', count: filterCounts.in_prep },
            { key: 'ready' as OrderFilter, label: 'Listos', count: filterCounts.ready },
            { key: 'delivered' as OrderFilter, label: 'Por confirmar', count: filterCounts.delivered },
            { key: 'completed' as OrderFilter, label: 'Completados', count: filterCounts.completed },
          ].map((tab) => {
            const isSelected = activeFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterTab, isSelected && styles.filterTabSelected]}
                activeOpacity={0.78}
                onPress={() => setActiveFilter(tab.key)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    isSelected && styles.filterTabTextSelected,
                  ]}
                >
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View
                    style={[
                      styles.filterBadge,
                      isSelected && styles.filterBadgeSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterBadgeText,
                        isSelected && styles.filterBadgeTextSelected,
                      ]}
                    >
                      {tab.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ==================================================================== */}
      {/* 3. LISTADO DINÁMICO DE TARJETAS DE PEDIDOS                           */}
      {/* ==================================================================== */}
      {filteredOrders.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <View style={styles.emptyIconCircle}>
            <ShoppingBag size={28} color="#9900F0" />
          </View>
          <Text style={styles.emptyTitle}>No hay pedidos aquí</Text>
          <Text style={styles.emptySubtitle}>
            {activeFilter === 'all'
              ? 'Aún no has enviado comandas durante esta estancia. Explora la carta y pide tus bebidas favoritas.'
              : activeFilter === 'in_prep'
              ? 'No tienes bebidas en proceso de preparación en este momento.'
              : activeFilter === 'ready'
              ? 'No tienes pedidos pendientes de entrega por parte del personal.'
              : activeFilter === 'delivered'
              ? 'No tienes pedidos pendientes de confirmación física.'
              : 'Aún no tienes pedidos completados en esta jornada.'}
          </Text>
          {onNavigateToMenu && (
            <TouchableOpacity
              style={styles.emptyActionBtn}
              activeOpacity={0.85}
              onPress={onNavigateToMenu}
            >
              <Wine size={15} color="#FFFFFF" />
              <Text style={styles.emptyActionBtnText}>Explorar Carta</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.ordersList}>
          {filteredOrders.map((order) => {
            const meta = getOrderMeta(order.status);
            const StatusIcon = meta.icon;
            const isDelivered = order.status === 'delivered';
            const isCompleted = order.status === 'completed';
            const isReady = order.status === 'ready';
            const isInPrep = ['in_preparation', 'accepted'].includes(order.status);
            const isPending = order.status === 'pending';
            const isCancelled = ['cancelled', 'rejected'].includes(order.status);
            const isConfirming = confirmingOrderId === order.id;

            const items = order.items || [];
            const hasMultipleItems = items.length > 2;
            const isExpanded = Boolean(expandedItemOrders[order.id]);
            const visibleItems = hasMultipleItems && !isExpanded ? items.slice(0, 2) : items;
            const hiddenCount = items.length - 2;

            // Movimiento contable vinculado si existe
            const associatedEntry = getEntryForOrder(order.id);

            return (
              <View
                key={order.id}
                style={[
                  styles.orderCard,
                  isDelivered && styles.orderCardDelivered,
                  isReady && styles.orderCardReady,
                ]}
              >
                {/* -------------------------------------------------------- */}
                {/* BLOQUE A: CABECERA (ORDEN, MESA, HORA Y BADGE)           */}
                {/* -------------------------------------------------------- */}
                <View style={styles.cardHeaderBlock}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.orderNumberText}>
                      {formatOrderNumber(order.order_number)}
                    </Text>
                    {order.table_or_location ? (
                      <View style={styles.tableTag}>
                        <MapPin size={11} color="#A1A1AA" />
                        <Text style={styles.tableTagText} numberOfLines={1}>
                          {order.table_or_location}
                        </Text>
                      </View>
                    ) : null}
                    <View style={styles.timeTag}>
                      <Clock size={11} color="#71717A" />
                      <Text style={styles.timeTagText}>{formatTime(order.created_at)}</Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: meta.bg, borderColor: meta.border },
                    ]}
                  >
                    <StatusIcon size={12} color={meta.color} />
                    <Text style={[styles.statusPillText, { color: meta.color }]}>
                      {meta.label}
                    </Text>
                  </View>
                </View>

                {/* -------------------------------------------------------- */}
                {/* BLOQUE B: PRODUCTOS AGRUPADOS Y ORDENADOS                */}
                {/* -------------------------------------------------------- */}
                <View style={styles.productsBlock}>
                  {items.length === 0 ? (
                    <Text style={styles.noProductsText}>Consumo en salón</Text>
                  ) : (
                    visibleItems.map((it, idx) => (
                      <View key={it.id || idx} style={styles.productRow}>
                        <View style={styles.productLeftCol}>
                          <View style={styles.quantityBadge}>
                            <Text style={styles.quantityBadgeText}>{it.quantity}×</Text>
                          </View>
                          <View style={styles.productNameCol}>
                            <Text style={styles.productName} numberOfLines={1}>
                              {it.product_name}
                            </Text>
                            {it.variant_name ? (
                              <Text style={styles.productVariant}>
                                {it.variant_name}
                              </Text>
                            ) : null}
                          </View>
                        </View>

                        <Text style={styles.productPrice}>
                          {formatCOP(it.subtotal || it.unit_price * it.quantity)}
                        </Text>
                      </View>
                    ))
                  )}

                  {/* Toggle para mostrar más de 2 productos */}
                  {hasMultipleItems && (
                    <TouchableOpacity
                      style={styles.expandProductsBtn}
                      activeOpacity={0.7}
                      onPress={() => toggleExpandOrderItems(order.id)}
                    >
                      <Text style={styles.expandProductsBtnText}>
                        {isExpanded
                          ? 'Ocultar productos'
                          : `Ver ${hiddenCount} producto${hiddenCount > 1 ? 's' : ''} más`}
                      </Text>
                      {isExpanded ? (
                        <ChevronUp size={13} color="#C4B5FD" />
                      ) : (
                        <ChevronDown size={13} color="#C4B5FD" />
                      )}
                    </TouchableOpacity>
                  )}

                  {/* Nota del cliente si existe */}
                  {order.notes ? (
                    <View style={styles.notesCallout}>
                      <Info size={12} color="#A78BFA" />
                      <Text style={styles.notesCalloutText} numberOfLines={2}>
                        Nota: {order.notes}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* -------------------------------------------------------- */}
                {/* BLOQUE C: TOTAL Y ESTADO DEL CARGO EN CUENTA             */}
                {/* -------------------------------------------------------- */}
                <View style={styles.financialBlock}>
                  <View style={styles.financialTopRow}>
                    <View>
                      <Text style={styles.financialLabel}>TOTAL COMANDA</Text>
                      <Text style={styles.financialAmount}>
                        {formatCOP(order.total || order.total_amount || 0)}
                      </Text>
                    </View>

                    <View style={styles.financialRightCol}>
                      <Text style={styles.orderTimestamp}>
                        {formatTime(order.created_at)}
                      </Text>
                      {onNavigateToAccount && (
                        <TouchableOpacity
                          style={styles.viewLedgerBtn}
                          activeOpacity={0.75}
                          onPress={() => {
                            if (onNavigateToAccount) onNavigateToAccount();
                          }}
                        >
                          <Receipt size={12} color="#F900BF" />
                          <Text style={styles.viewLedgerBtnText}>Ver en cuenta</Text>
                          <ChevronRight size={10} color="#F900BF" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Claridad contable: Diferenciar entrega de pago */}
                  <View style={styles.accountingNoticeRow}>
                    <View style={styles.accountingNoticeIconBox}>
                      {isCompleted ? (
                        <Check size={11} color="#10B981" />
                      ) : isDelivered ? (
                        <Clock size={11} color="#F59E0B" />
                      ) : isCancelled ? (
                        <X size={11} color="#EF4444" />
                      ) : (
                        <Clock size={11} color="#71717A" />
                      )}
                    </View>
                    <Text style={styles.accountingNoticeText}>
                      {isCompleted
                        ? 'Cargo asentado en cuenta de estancia • Se liquida al salir'
                        : isDelivered
                        ? 'Pendiente de confirmación física para asentar el cargo'
                        : isCancelled
                        ? 'Comanda anulada sin cargo contable'
                        : 'En preparación • Sin cargo en cuenta hasta entrega física'}
                    </Text>
                  </View>
                </View>

                {/* -------------------------------------------------------- */}
                {/* BLOQUE D: ACCIONES SEGÚN EL ESTADO REAL                  */}
                {/* -------------------------------------------------------- */}
                <View style={styles.actionsBlock}>
                  {/* D.1 Estado: Pendiente */}
                  {isPending && (
                    <View style={styles.stateNoticeCard}>
                      <Clock size={14} color="#F59E0B" />
                      <Text style={styles.stateNoticeText}>
                        En cola: Tu comanda fue enviada a la barra y está en espera de bartender.
                      </Text>
                    </View>
                  )}

                  {/* D.2 Estado: En preparación o aceptado */}
                  {isInPrep && (
                    <View style={styles.stateNoticeCard}>
                      <RotateCw size={14} color="#A78BFA" />
                      <Text style={styles.stateNoticeText}>
                        El personal del bar está preparando tus bebidas en este momento.
                      </Text>
                    </View>
                  )}

                  {/* D.3 Estado: Listo para entrega */}
                  {isReady && (
                    <View style={[styles.stateNoticeCard, styles.stateNoticeCardReady]}>
                      <Sparkles size={15} color="#10B981" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.stateNoticeTitleReady}>¡Tu pedido está listo!</Text>
                        <Text style={styles.stateNoticeDescReady}>
                          Ya puedes acercarte a la barra o el mesero va en camino a tu ubicación.
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* D.4 Estado: Entregado (Por confirmar recepción física) */}
                  {isDelivered && (
                    <View style={styles.deliveryConfirmationCard}>
                      <View style={styles.deliveryPromptRow}>
                        <View style={styles.deliveryPromptIconCircle}>
                          <AlertTriangle size={16} color="#F59E0B" />
                        </View>
                        <View style={styles.deliveryPromptTextCol}>
                          <Text style={styles.deliveryPromptTitle}>
                            ¿Ya recibiste tu pedido?
                          </Text>
                          <Text style={styles.deliveryPromptDesc}>
                            El personal registró la entrega física. Confirma para verificar tu comanda.
                          </Text>
                        </View>
                      </View>

                      <View style={styles.deliveryActionsRow}>
                        <TouchableOpacity
                          style={styles.confirmReceiptBtn}
                          activeOpacity={0.84}
                          disabled={isConfirming}
                          onPress={() => handleConfirmReception(order)}
                        >
                          {isConfirming ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <CheckCircle2 size={16} color="#FFFFFF" />
                              <Text style={styles.confirmReceiptBtnText}>
                                Confirmar recepción
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.problemSecondaryBtn}
                          activeOpacity={0.75}
                          onPress={() => handleReportProblem(order)}
                        >
                          <HelpCircle size={14} color="#A1A1AA" />
                          <Text style={styles.problemSecondaryBtnText}>
                            Tengo un problema
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* D.5 Estado: Completado (Éxito y ver detalle) */}
                  {isCompleted && (
                    <View style={styles.completedRow}>
                      <View style={styles.completedBadgeTag}>
                        <Check size={12} color="#10B981" />
                        <Text style={styles.completedBadgeTagText}>Entrega confirmada</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.viewDetailBtn}
                        activeOpacity={0.75}
                        onPress={() => setSelectedOrderForDetail(order)}
                      >
                        <Eye size={13} color="#C4B5FD" />
                        <Text style={styles.viewDetailBtnText}>Ver detalle completo</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* D.6 Estado: Cancelado */}
                  {isCancelled && (
                    <View style={styles.cancelledRow}>
                      <View style={styles.cancelledBadgeTag}>
                        <X size={12} color="#EF4444" />
                        <Text style={styles.cancelledBadgeTagText}>
                          Pedido anulado por el bar
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.viewDetailBtn}
                        activeOpacity={0.75}
                        onPress={() => setSelectedOrderForDetail(order)}
                      >
                        <Eye size={13} color="#C4B5FD" />
                        <Text style={styles.viewDetailBtnText}>Ver detalle</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* ==================================================================== */}
      {/* 4. MODAL DE DETALLE EXPANDIBLE DEL PEDIDO (VISTA COMPLETA)            */}
      {/* ==================================================================== */}
      <Modal
        visible={Boolean(selectedOrderForDetail)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedOrderForDetail(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSelectedOrderForDetail(null)}
        >
          <Pressable
            style={styles.modalContentCard}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedOrderForDetail && (
              <>
                {/* HEADER MODAL */}
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalOrderNumber}>
                      {formatOrderNumber(selectedOrderForDetail.order_number)}
                    </Text>
                    <Text style={styles.modalClubName}>{clubName}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setSelectedOrderForDetail(null)}
                  >
                    <X size={18} color="#A1A1AA" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.modalBody}
                  showsVerticalScrollIndicator={false}
                >
                  {/* TIMELINE DE PROGRESO DEL PEDIDO */}
                  <View style={styles.timelineCard}>
                    <Text style={styles.timelineSectionTitle}>PROGRESO DE LA COMANDA</Text>
                    <View style={styles.timelineRow}>
                      {[
                        { key: 'pending', label: 'Creado' },
                        { key: 'in_prep', label: 'Preparando' },
                        { key: 'ready', label: 'Listo' },
                        { key: 'delivered', label: 'Entregado' },
                        { key: 'completed', label: 'Confirmado' },
                      ].map((step, sIdx) => {
                        const statusOrder = [
                          'pending',
                          'accepted',
                          'in_preparation',
                          'ready',
                          'delivered',
                          'completed',
                        ];
                        const currentStatusIdx = statusOrder.indexOf(selectedOrderForDetail.status);
                        const isDone =
                          step.key === 'pending'
                            ? currentStatusIdx >= 0
                            : step.key === 'in_prep'
                            ? currentStatusIdx >= 1
                            : step.key === 'ready'
                            ? currentStatusIdx >= 3
                            : step.key === 'delivered'
                            ? currentStatusIdx >= 4
                            : currentStatusIdx >= 5;

                        return (
                          <View key={step.key} style={styles.timelineStepCol}>
                            <View
                              style={[
                                styles.timelineStepCircle,
                                isDone && styles.timelineStepCircleDone,
                              ]}
                            >
                              {isDone ? (
                                <Check size={11} color="#FFFFFF" strokeWidth={2.5} />
                              ) : (
                                <View style={styles.timelineStepInnerDot} />
                              )}
                            </View>
                            <Text
                              style={[
                                styles.timelineStepLabel,
                                isDone && styles.timelineStepLabelDone,
                              ]}
                            >
                              {step.label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  {/* DESGLOSE DE PRODUCTOS Y NOTAS */}
                  <View style={styles.modalItemsSection}>
                    <Text style={styles.modalSectionLabel}>PRODUCTOS ORDENADOS</Text>
                    {(selectedOrderForDetail.items || []).map((it, i) => (
                      <View key={it.id || i} style={styles.modalItemRow}>
                        <View style={styles.modalItemLeft}>
                          <Text style={styles.modalItemQty}>{it.quantity}×</Text>
                          <View>
                            <Text style={styles.modalItemName}>{it.product_name}</Text>
                            {it.variant_name ? (
                              <Text style={styles.modalItemVariant}>
                                {it.variant_name}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                        <Text style={styles.modalItemPrice}>
                          {formatCOP(it.subtotal || it.unit_price * it.quantity)}
                        </Text>
                      </View>
                    ))}

                    {selectedOrderForDetail.notes ? (
                      <View style={styles.modalNotesBox}>
                        <Info size={12} color="#A78BFA" />
                        <Text style={styles.modalNotesText}>
                          Instrucciones: {selectedOrderForDetail.notes}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* RESUMEN FINANCIERO */}
                  <View style={styles.modalSummarySection}>
                    <View style={styles.modalSummaryLine}>
                      <Text style={styles.modalSummaryLabel}>Subtotal comanda</Text>
                      <Text style={styles.modalSummaryValue}>
                        {formatCOP(selectedOrderForDetail.total || selectedOrderForDetail.total_amount)}
                      </Text>
                    </View>

                    <View style={[styles.modalSummaryLine, styles.modalTotalLine]}>
                      <Text style={styles.modalTotalLabel}>TOTAL</Text>
                      <Text style={styles.modalTotalValue}>
                        {formatCOP(selectedOrderForDetail.total || selectedOrderForDetail.total_amount)}
                      </Text>
                    </View>

                    <View style={styles.modalChargeBadgeRow}>
                      <Receipt size={13} color="#10B981" />
                      <Text style={styles.modalChargeBadgeText}>
                        {selectedOrderForDetail.status === 'completed'
                          ? 'Cargo asentado en cuenta de estancia'
                          : 'Pendiente de entrega para registro contable'}
                      </Text>
                    </View>
                  </View>

                  {/* DETALLES DE AUDITORÍA Y FECHAS */}
                  <View style={styles.modalAuditSection}>
                    <Text style={styles.modalSectionLabel}>DATOS DE AUDITORÍA</Text>

                    <View style={styles.auditRow}>
                      <Text style={styles.auditKey}>Ubicación / Mesa:</Text>
                      <Text style={styles.auditVal}>
                        {selectedOrderForDetail.table_or_location || 'General'}
                      </Text>
                    </View>

                    <View style={styles.auditRow}>
                      <Text style={styles.auditKey}>Hora de creación:</Text>
                      <Text style={styles.auditVal}>
                        {formatDateTime(selectedOrderForDetail.created_at)}
                      </Text>
                    </View>

                    {selectedOrderForDetail.delivered_at && (
                      <View style={styles.auditRow}>
                        <Text style={styles.auditKey}>Hora de entrega física:</Text>
                        <Text style={styles.auditVal}>
                          {formatDateTime(selectedOrderForDetail.delivered_at)}
                        </Text>
                      </View>
                    )}

                    {selectedOrderForDetail.confirmed_at && (
                      <View style={styles.auditRow}>
                        <Text style={styles.auditKey}>Confirmación cliente:</Text>
                        <Text style={styles.auditVal}>
                          {formatDateTime(selectedOrderForDetail.confirmed_at)}
                        </Text>
                      </View>
                    )}
                  </View>
                </ScrollView>

                {/* BOTÓN INFERIOR DE ACCIÓN */}
                <View style={styles.modalFooter}>
                  {onNavigateToAccount && (
                    <TouchableOpacity
                      style={styles.modalActionPrimaryBtn}
                      activeOpacity={0.84}
                      onPress={() => {
                        setSelectedOrderForDetail(null);
                        if (onNavigateToAccount) onNavigateToAccount();
                      }}
                    >
                      <Receipt size={15} color="#FFFFFF" />
                      <Text style={styles.modalActionPrimaryBtnText}>
                        Ver en Mi cuenta
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 24,
  },

  // --------------------------------------------------------------------------
  // ENCABEZADO Y KPIS
  // --------------------------------------------------------------------------
  headerBox: {
    backgroundColor: '#120E22',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(153, 0, 240, 0.2)',
    marginBottom: 14,
  },
  headerMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitleCol: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#A1A1AA',
    marginTop: 3,
  },
  newOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9900F0',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#9900F0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  newOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  kpiContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  kpiCardActive: {
    borderColor: 'rgba(153, 0, 240, 0.3)',
    backgroundColor: 'rgba(153, 0, 240, 0.08)',
  },
  kpiCardAlert: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  kpiCardNeutral: {
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  kpiCardCompleted: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.07)',
  },
  kpiIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiIconWrapperAlert: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  kpiIconWrapperSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  kpiTextGroup: {
    flex: 1,
  },
  kpiNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  kpiNumberAlert: {
    color: '#F59E0B',
  },
  kpiNumberSuccess: {
    color: '#10B981',
  },
  kpiLabel: {
    fontSize: 10,
    color: '#A1A1AA',
    fontWeight: '500',
  },

  // --------------------------------------------------------------------------
  // FILTROS SEGMENTADOS
  // --------------------------------------------------------------------------
  filtersWrapper: {
    marginBottom: 14,
  },
  filtersScrollContent: {
    paddingHorizontal: 2,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161228',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 7,
  },
  filterTabSelected: {
    backgroundColor: '#9900F0',
    borderColor: '#F900BF',
    shadowColor: '#9900F0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 3,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  filterTabTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  filterBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A1A1AA',
  },
  filterBadgeTextSelected: {
    color: '#FFFFFF',
  },

  // --------------------------------------------------------------------------
  // LISTA Y TARJETAS DE PEDIDOS
  // --------------------------------------------------------------------------
  ordersList: {
    gap: 14,
  },
  orderCard: {
    backgroundColor: '#141026',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(153, 0, 240, 0.18)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 2,
  },
  orderCardDelivered: {
    borderColor: 'rgba(245, 158, 11, 0.55)',
    backgroundColor: '#181222',
  },
  orderCardReady: {
    borderColor: 'rgba(16, 185, 129, 0.45)',
  },

  // BLOQUE A: CABECERA
  cardHeaderBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  orderNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  tableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  tableTagText: {
    fontSize: 11,
    color: '#D4D4D8',
    fontWeight: '500',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  timeTagText: {
    fontSize: 11,
    color: '#A1A1AA',
    fontWeight: '500',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 5,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // BLOQUE B: PRODUCTOS
  productsBlock: {
    paddingVertical: 12,
    gap: 8,
  },
  noProductsText: {
    fontSize: 13,
    color: '#71717A',
    fontStyle: 'italic',
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
    marginRight: 10,
  },
  quantityBadge: {
    backgroundColor: 'rgba(153, 0, 240, 0.22)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  quantityBadgeText: {
    color: '#F900BF',
    fontWeight: '800',
    fontSize: 12,
  },
  productNameCol: {
    flex: 1,
  },
  productName: {
    color: '#F4F4F5',
    fontSize: 13,
    fontWeight: '600',
  },
  productVariant: {
    color: '#A1A1AA',
    fontSize: 11,
    marginTop: 1,
  },
  productPrice: {
    color: '#E4E4E7',
    fontSize: 13,
    fontWeight: '700',
  },
  expandProductsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    marginTop: 4,
  },
  expandProductsBtnText: {
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '600',
  },
  notesCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#A78BFA',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 7,
    marginTop: 4,
  },
  notesCalloutText: {
    color: '#DDD6FE',
    fontSize: 11,
    flex: 1,
  },

  // BLOQUE C: TOTAL Y CUENTA
  financialBlock: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  financialTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  financialLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A1A1AA',
    letterSpacing: 0.5,
  },
  financialAmount: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  financialRightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  orderTimestamp: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '500',
  },
  viewLedgerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 0, 191, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(249, 0, 191, 0.25)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  viewLedgerBtnText: {
    fontSize: 11,
    color: '#F900BF',
    fontWeight: '700',
  },
  accountingNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  accountingNoticeIconBox: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountingNoticeText: {
    fontSize: 11,
    color: '#A1A1AA',
    flex: 1,
  },

  // BLOQUE D: ACCIONES SEGÚN EL ESTADO
  actionsBlock: {
    marginTop: 12,
  },
  stateNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  stateNoticeText: {
    fontSize: 12,
    color: '#D4D4D8',
    flex: 1,
    lineHeight: 16,
  },
  stateNoticeCardReady: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  stateNoticeTitleReady: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  stateNoticeDescReady: {
    fontSize: 11,
    color: '#A7F3D0',
    marginTop: 2,
    lineHeight: 15,
  },

  // CONFIRMACIÓN DE ENTREGA EN DELIVERED
  deliveryConfirmationCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    gap: 12,
  },
  deliveryPromptRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  deliveryPromptIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  deliveryPromptTextCol: {
    flex: 1,
  },
  deliveryPromptTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F59E0B',
  },
  deliveryPromptDesc: {
    fontSize: 11,
    color: '#FDE68A',
    marginTop: 3,
    lineHeight: 16,
  },
  deliveryActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmReceiptBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9900F0',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 7,
    shadowColor: '#9900F0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmReceiptBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  problemSecondaryBtn: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1934',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 5,
  },
  problemSecondaryBtnText: {
    color: '#D4D4D8',
    fontSize: 12,
    fontWeight: '600',
  },

  // COMPLETADO
  completedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  completedBadgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  completedBadgeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  viewDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 5,
  },
  viewDetailBtnText: {
    fontSize: 12,
    color: '#C4B5FD',
    fontWeight: '600',
  },

  // CANCELADO
  cancelledRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  cancelledBadgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  cancelledBadgeTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },

  // ESTADO VACÍO
  emptyStateCard: {
    backgroundColor: '#141026',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(153, 0, 240, 0.15)',
    marginVertical: 10,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(153, 0, 240, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9900F0',
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 7,
    marginTop: 18,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // --------------------------------------------------------------------------
  // MODAL DE DETALLE EXPANDIBLE
  // --------------------------------------------------------------------------
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContentCard: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: '#141026',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(153, 0, 240, 0.3)',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalOrderNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  modalClubName: {
    fontSize: 12,
    color: '#A78BFA',
    fontWeight: '600',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 18,
  },

  // TIMELINE
  timelineCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 16,
  },
  timelineSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A1A1AA',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineStepCol: {
    alignItems: 'center',
    flex: 1,
  },
  timelineStepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineStepCircleDone: {
    backgroundColor: '#10B981',
  },
  timelineStepInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#71717A',
  },
  timelineStepLabel: {
    fontSize: 10,
    color: '#71717A',
    fontWeight: '600',
  },
  timelineStepLabelDone: {
    color: '#E4E4E7',
  },

  // ITEMS EN MODAL
  modalItemsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 16,
    gap: 10,
  },
  modalSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A1A1AA',
    letterSpacing: 0.6,
  },
  modalItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 10,
  },
  modalItemQty: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F900BF',
    backgroundColor: 'rgba(249, 0, 191, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modalItemName: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalItemVariant: {
    fontSize: 11,
    color: '#A1A1AA',
  },
  modalItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalNotesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(153, 0, 240, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#9900F0',
    padding: 8,
    borderRadius: 6,
    gap: 6,
    marginTop: 4,
  },
  modalNotesText: {
    fontSize: 11,
    color: '#DDD6FE',
    flex: 1,
  },

  // RESUMEN FINANCIERO MODAL
  modalSummarySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 16,
    gap: 8,
  },
  modalSummaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalSummaryLabel: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  modalSummaryValue: {
    fontSize: 13,
    color: '#D4D4D8',
    fontWeight: '600',
  },
  modalTotalLine: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalChargeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingTop: 6,
  },
  modalChargeBadgeText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },

  // AUDITORÍA
  modalAuditSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 16,
    gap: 8,
  },
  auditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  auditKey: {
    fontSize: 11,
    color: '#71717A',
  },
  auditVal: {
    fontSize: 11,
    color: '#D4D4D8',
    fontWeight: '500',
  },

  // FOOTER MODAL
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalActionPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9900F0',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 7,
  },
  modalActionPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
