import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ImageBackground, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Ticket, MapPin, Calendar, Lock, ShieldCheck, CheckCircle, Sparkles, QrCode } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { EventInfo } from '@/data/mockEvents';
import { eventService } from '@/services/event.service';
import { checkoutService, CheckoutResult } from '@/services/checkout.service';
import { showAlert } from '@/utils/alert';

const formatPrice = (p: number) => `$${p.toLocaleString('es-CO')}`;

interface ParsedTicket {
  name: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export default function EventCheckoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const params = useLocalSearchParams<{ summary: string; total: string; batchId?: string }>();
  const router = useRouter();

  const [processing, setProcessing] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [checkoutResultData, setCheckoutResultData] = useState<CheckoutResult | null>(null);

  // EVENTO REAL DESDE SUPABASE
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

  const fetchEventData = useCallback(async () => {
    if (!id) return;
    setLoadingEvent(true);
    const { event: fetchedEvent } = await eventService.getEventById(String(id));
    setEvent(fetchedEvent);
    setLoadingEvent(false);
  }, [id]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  if (loadingEvent) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#818cf8" />
        <Text style={[styles.errorText, { marginTop: 16 }]}>Cargando resumen de compra...</Text>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.errorText}>Evento no encontrado en Supabase</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backLink}>Volver</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Parse selection from params
  const tickets: ParsedTicket[] = (params.summary || '')
    .split('|')
    .filter(Boolean)
    .map(entry => {
      const [name, qty, price] = entry.split(':');
      const q = parseInt(qty ?? '0');
      const p = parseInt(price ?? '0');
      return { name: name ?? '', qty: q, unitPrice: p, subtotal: q * p };
    });

  const firstTicket = tickets[0] || { name: 'Entrada General', qty: 1, unitPrice: 50000, subtotal: 50000 };
  const totalQty = tickets.reduce((acc, t) => acc + t.qty, 0);

  const subtotal = parseInt(params.total ?? '0') || firstTicket.subtotal;
  const serviceFee = Math.round(subtotal * 0.05);
  const total = subtotal + serviceFee;

  const handlePay = async () => {
    if (processing) return;

    setProcessing(true);

    try {
      const result = await checkoutService.simulateCheckoutPayment({
        eventId: typeof id === 'string' ? id : '',
        ticketBatchId: params.batchId || null,
        ticketBatchName: firstTicket.name,
        unitPrice: firstTicket.unitPrice,
        quantity: totalQty > 0 ? totalQty : 1,
      });

      if (!result.success) {
        setProcessing(false);
        showAlert('Atención', result.error || 'No se pudo completar la simulación de compra.');
        return;
      }

      setCheckoutResultData(result);
      setSuccessModalVisible(true);
    } catch (err: any) {
      showAlert('Error', err?.message || 'Error al procesar la simulación de pago.');
    } finally {
      setProcessing(false);
    }
  };

  const handleGoToProfileTickets = () => {
    setSuccessModalVisible(false);
    router.replace('/profile' as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* HEADER */}
        <SafeAreaView edges={['top']} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} disabled={processing}>
            <ArrowLeft size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Resumen de Compra</Text>
          <View style={{ width: 38 }} />
        </SafeAreaView>

        {/* BANNER INFORMATIVO MODO PRUEBA */}
        <View style={styles.testModeBanner}>
          <Sparkles size={16} color="#A855F7" style={{ marginRight: 8 }} />
          <Text style={styles.testModeText}>
            <Text style={{ fontWeight: '900', color: '#F900BF' }}>MODO DE PRUEBA: </Text>
            Esta compra es simulada. No se realizará ningún cobro real, pero tu entrada se creará realmente en Supabase.
          </Text>
        </View>

        {/* EVENTO MINI CARD */}
        <View style={styles.content}>
          <View style={styles.eventCard}>
            <ImageBackground source={{ uri: event.imageUrl }} style={styles.eventThumb} imageStyle={{ borderRadius: 12 }}>
              <LinearGradient colors={['transparent', 'rgba(2,2,5,0.9)']} style={styles.eventThumbGradient} />
            </ImageBackground>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
              <View style={styles.eventMetaRow}>
                <Calendar size={12} color="#818cf8" />
                <Text style={styles.eventMeta}>{event.date}</Text>
              </View>
              <View style={styles.eventMetaRow}>
                <MapPin size={12} color="#818cf8" />
                <Text style={styles.eventMeta} numberOfLines={1}>{event.location}</Text>
              </View>
            </View>
          </View>

          {/* ORDEN DE TICKETS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tu Orden</Text>
            {tickets.map((t, i) => (
              <View key={i} style={styles.orderRow}>
                <View style={styles.orderIconBox}>
                  <Ticket size={16} color="#818cf8" />
                </View>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderName}>{t.name}</Text>
                  <Text style={styles.orderUnit}>{formatPrice(t.unitPrice)} × {t.qty}</Text>
                </View>
                <Text style={styles.orderSubtotal}>{formatPrice(t.subtotal)}</Text>
              </View>
            ))}
          </View>

          {/* DESGLOSE DE PRECIOS */}
          <View style={styles.priceBreakdown}>
            <View style={styles.priceRow}>
              <Text style={styles.priceRowLabel}>Subtotal entradas</Text>
              <Text style={styles.priceRowValue}>{formatPrice(subtotal)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceRowLabel}>Cargo por servicio (5%)</Text>
              <Text style={styles.priceRowValue}>{formatPrice(serviceFee)}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceTotalLabel}>TOTAL A PAGAR</Text>
              <Text style={styles.priceTotalValue}>{formatPrice(total)}</Text>
            </View>
          </View>

          {/* GARANTÍAS */}
          <View style={styles.guaranteeBox}>
            <View style={styles.guaranteeRow}>
              <ShieldCheck size={16} color="#34d399" />
              <Text style={styles.guaranteeText}>Tickets 100% oficiales del organizador</Text>
            </View>
            <View style={styles.guaranteeRow}>
              <CheckCircle size={16} color="#34d399" />
              <Text style={styles.guaranteeText}>QR único e intransferible generado al pagar</Text>
            </View>
            <View style={styles.guaranteeRow}>
              <Lock size={16} color="#34d399" />
              <Text style={styles.guaranteeText}>Transacción simulada encriptada</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerTotal}>{formatPrice(total)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.payBtn, processing && styles.payBtnDisabled]}
          onPress={handlePay}
          disabled={processing}
          activeOpacity={0.85}
        >
          {processing ? (
            <>
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.payBtnText}>Procesando...</Text>
            </>
          ) : (
            <>
              <Lock size={16} color="#fff" />
              <Text style={styles.payBtnText}>Pagar Ahora (Simular)</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* MODAL CONFIRMACIÓN DE COMPRA EXITOSA */}
      <Modal visible={successModalVisible} transparent animationType="slide" onRequestClose={handleGoToProfileTickets}>
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <CheckCircle size={44} color="#34d399" />
            </View>
            <Text style={styles.successTitle}>¡Entrada Confirmada!</Text>
            <Text style={styles.successSubtitle}>
              Tu entrada se ha registrado exitosamente en tu perfil de Hangover.
            </Text>

            <View style={styles.successDetailsBox}>
              <Text style={styles.successEventName}>{event.title}</Text>
              <Text style={styles.successClubName}>📍 {event.location}</Text>
              <Text style={styles.successTicketType}>🎟️ {firstTicket.name} ({totalQty}x)</Text>
              
              <View style={styles.successTokenBadge}>
                <QrCode size={14} color="#F900BF" style={{ marginRight: 6 }} />
                <Text style={styles.successTokenText}>
                  {checkoutResultData?.qrCode || 'HGVR-ACCES-VIP'}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.viewTicketBtn} onPress={handleGoToProfileTickets} activeOpacity={0.85}>
              <Text style={styles.viewTicketBtnText}>Ver mi entrada</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020205' },
  safeArea: { flex: 1, backgroundColor: '#020205', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#fff', fontSize: 18, marginBottom: 12 },
  backLink: { color: '#818cf8', fontSize: 16, fontWeight: 'bold' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#020205',
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  content: { padding: 20 },

  eventCard: { flexDirection: 'row', gap: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 32 },
  eventThumb: { width: 80, height: 80, borderRadius: 12, overflow: 'hidden' },
  eventThumbGradient: { flex: 1, borderRadius: 12 },
  eventInfo: { flex: 1, justifyContent: 'center', gap: 8 },
  eventTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  eventMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eventMeta: { color: '#a1a1aa', fontSize: 12, flex: 1 },

  section: { marginBottom: 24 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },

  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  orderIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(129,140,248,0.1)', alignItems: 'center', justifyContent: 'center' },
  orderInfo: { flex: 1 },
  orderName: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  orderUnit: { color: '#71717a', fontSize: 12 },
  orderSubtotal: { color: '#34d399', fontSize: 16, fontWeight: 'bold' },

  priceBreakdown: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 24 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  priceRowLabel: { color: '#a1a1aa', fontSize: 14 },
  priceRowValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  priceDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 8 },
  priceTotalLabel: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  priceTotalValue: { color: '#34d399', fontSize: 22, fontWeight: '900' },

  guaranteeBox: { backgroundColor: 'rgba(52,211,153,0.05)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(52,211,153,0.15)', gap: 12, marginBottom: 24 },
  guaranteeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  guaranteeText: { color: '#a1a1aa', fontSize: 13 },

  placeholderNotice: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderStyle: 'dashed' },
  placeholderTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  placeholderText: { color: '#71717a', fontSize: 13, lineHeight: 20 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#05050A', paddingHorizontal: 24, paddingVertical: 20,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingBottom: 36,
  },
  footerLabel: { color: '#71717a', fontSize: 11 },
  footerTotal: { color: '#34d399', fontSize: 22, fontWeight: '900' },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#4f46e5', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16,
    shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  payBtnDisabled: {
    backgroundColor: 'rgba(79, 70, 229, 0.4)',
    shadowOpacity: 0,
  },
  payBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' },

  testModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderColor: 'rgba(249, 0, 191, 0.35)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 20,
    marginTop: 12,
  },
  testModeText: {
    flex: 1,
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 2, 5, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successCard: {
    width: '100%',
    backgroundColor: '#0F0921',
    borderColor: 'rgba(153, 0, 240, 0.4)',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
  },
  successSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  successDetailsBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(153, 0, 240, 0.25)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  successEventName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
    textAlign: 'center',
  },
  successClubName: {
    color: '#FF85B3',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  successTicketType: {
    color: '#A855F7',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 12,
  },
  successTokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(249, 0, 191, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  successTokenText: {
    color: '#F900BF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
  viewTicketBtn: {
    width: '100%',
    height: 50,
    backgroundColor: '#9900F0',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewTicketBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
