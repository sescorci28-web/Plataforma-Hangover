import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Plus, Minus, Lock, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { EventInfo, TicketBatch } from '@/data/mockEvents';
import { eventService } from '@/services/event.service';

const formatPrice = (p: number) => `$${p.toLocaleString('es-CO')}`;
const pctSold = (sold: number, cap: number) => Math.round((sold / cap) * 100);

interface Selection {
  [batchId: string]: number; // quantity
}

export default function EventTicketsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [selection, setSelection] = useState<Selection>({});

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
        <Text style={[styles.errorText, { marginTop: 16 }]}>Cargando opciones de entradas...</Text>
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

  const changeQty = (batchId: string, delta: number, max: number) => {
    setSelection(prev => {
      const cur = prev[batchId] ?? 0;
      const next = Math.max(0, Math.min(cur + delta, max));
      return { ...prev, [batchId]: next };
    });
  };

  const { totalItems, totalPrice, selectedBatches } = useMemo(() => {
    let totalItems = 0;
    let totalPrice = 0;
    const selectedBatches: Array<{ batch: TicketBatch; qty: number }> = [];
    event.ticketBatches.forEach(b => {
      const qty = selection[b.id] ?? 0;
      if (qty > 0) {
        totalItems += qty;
        totalPrice += qty * b.price;
        selectedBatches.push({ batch: b, qty });
      }
    });
    return { totalItems, totalPrice, selectedBatches };
  }, [selection, event.ticketBatches]);

  const handleContinue = () => {
    // Serialize selection to params
    const params = selectedBatches
      .map(s => `${s.batch.name}:${s.qty}:${s.batch.price}`)
      .join('|');
    const selectedBatch = selectedBatches[0]?.batch;
    router.push({
      pathname: `/events/${event.id}/checkout` as any,
      params: {
        eventId: event.id,
        batchId: selectedBatch?.id || null,
        summary: params,
        total: String(totalPrice)
      }
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* MINI HERO */}
        <ImageBackground source={{ uri: event.imageUrl }} style={styles.miniHero}>
          <LinearGradient colors={['rgba(2,2,5,0.55)', '#020205']} style={styles.miniHeroGradient}>
            <SafeAreaView edges={['top']} style={styles.header}>
              <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <ArrowLeft size={22} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle} numberOfLines={1}>{event.title}</Text>
                <Text style={styles.headerSub}>{event.date}</Text>
              </View>
              <View style={{ width: 38 }} />
            </SafeAreaView>
          </LinearGradient>
        </ImageBackground>

        <View style={styles.content}>
          <Text style={styles.pageTitle}>Selecciona tus Entradas</Text>
          <Text style={styles.pageSubtitle}>Elige el tipo y cantidad de entradas para continuar.</Text>

          {/* TICKET BATCHES */}
          {event.ticketBatches.map(batch => {
            const qty = selection[batch.id] ?? 0;
            const available = batch.capacity - batch.soldCount;
            const soldPct = pctSold(batch.soldCount, batch.capacity);
            const isSoldOut = batch.status === 'sold_out';
            const isSelected = qty > 0;

            return (
              <View
                key={batch.id}
                style={[
                  styles.batchCard,
                  isSoldOut && styles.batchCardSoldOut,
                  isSelected && styles.batchCardSelected,
                ]}
              >
                <View style={styles.batchTop}>
                  <View style={styles.batchInfo}>
                    <Text style={[styles.batchName, isSoldOut && styles.dimText]}>{batch.name}</Text>
                    <Text style={[styles.batchDesc, isSoldOut && styles.dimText]}>{batch.description}</Text>
                  </View>
                  <View style={styles.batchPriceCol}>
                    <Text style={[styles.batchPrice, isSoldOut && styles.dimText]}>
                      {formatPrice(batch.price)}
                    </Text>
                    {isSoldOut ? (
                      <View style={styles.soldOutBadge}><Text style={styles.soldOutText}>AGOTADO</Text></View>
                    ) : (
                      <Text style={styles.availableText}>{available} disp.</Text>
                    )}
                  </View>
                </View>

                {/* BARRA DE PROGRESO */}
                {!isSoldOut && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${soldPct}%` as any, backgroundColor: soldPct >= 85 ? '#f97316' : '#4f46e5' }]} />
                    </View>
                    <Text style={styles.progressText}>{soldPct}% vendido</Text>
                  </View>
                )}

                {/* SELECTOR DE CANTIDAD */}
                {!isSoldOut && (
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      style={[styles.qtyBtn, qty === 0 && styles.qtyBtnDisabled]}
                      onPress={() => changeQty(batch.id, -1, batch.maxPerOrder)}
                      disabled={qty === 0}
                    >
                      <Minus size={16} color={qty === 0 ? '#444' : '#fff'} />
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{qty}</Text>
                    <TouchableOpacity
                      style={[styles.qtyBtn, qty >= batch.maxPerOrder && styles.qtyBtnDisabled]}
                      onPress={() => changeQty(batch.id, 1, batch.maxPerOrder)}
                      disabled={qty >= batch.maxPerOrder}
                    >
                      <Plus size={16} color={qty >= batch.maxPerOrder ? '#444' : '#fff'} />
                    </TouchableOpacity>
                    <Text style={styles.maxNote}>Máx {batch.maxPerOrder} por orden</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* FOOTER DINÁMICO */}
      <View style={styles.footer}>
        <View>
          {totalItems > 0 ? (
            <>
              <Text style={styles.footerLabel}>{totalItems} entrada{totalItems !== 1 ? 's' : ''} seleccionada{totalItems !== 1 ? 's' : ''}</Text>
              <Text style={styles.footerTotal}>{formatPrice(totalPrice)}</Text>
            </>
          ) : (
            <Text style={styles.footerEmpty}>Elige al menos 1 entrada</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.continueBtn, totalItems === 0 && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={totalItems === 0}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>Continuar</Text>
          <ChevronRight size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020205' },
  safeArea: { flex: 1, backgroundColor: '#020205', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#fff', fontSize: 18, marginBottom: 12 },
  backLink: { color: '#818cf8', fontSize: 16, fontWeight: 'bold' },

  miniHero: { width: '100%', height: 180 },
  miniHeroGradient: { flex: 1, justifyContent: 'flex-start' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  headerSub: { color: '#a1a1aa', fontSize: 11, marginTop: 2 },

  content: { padding: 20 },
  pageTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 8 },
  pageSubtitle: { color: '#71717a', fontSize: 14, marginBottom: 24 },

  batchCard: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  batchCardSoldOut: { opacity: 0.5 },
  batchCardSelected: { borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,0.06)' },
  batchTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  batchInfo: { flex: 1 },
  batchName: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  batchDesc: { color: '#a1a1aa', fontSize: 12, lineHeight: 18 },
  batchPriceCol: { alignItems: 'flex-end' },
  batchPrice: { color: '#34d399', fontSize: 20, fontWeight: '900', marginBottom: 4 },
  dimText: { color: '#555' },
  soldOutBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  soldOutText: { color: '#71717a', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  availableText: { color: '#71717a', fontSize: 11 },

  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  progressTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressText: { color: '#71717a', fontSize: 10, width: 60, textAlign: 'right' },

  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  qtyBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  qtyBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.02)' },
  qtyValue: { color: '#fff', fontSize: 20, fontWeight: '900', minWidth: 24, textAlign: 'center' },
  maxNote: { color: '#71717a', fontSize: 11, flex: 1, textAlign: 'right' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#05050A', paddingHorizontal: 24, paddingVertical: 20,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingBottom: 36,
  },
  footerLabel: { color: '#a1a1aa', fontSize: 12 },
  footerTotal: { color: '#34d399', fontSize: 22, fontWeight: '900' },
  footerEmpty: { color: '#71717a', fontSize: 13, fontStyle: 'italic' },
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#4f46e5', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16,
    shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  continueBtnDisabled: { backgroundColor: '#1e1e2d', shadowOpacity: 0 },
  continueBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' },
});
