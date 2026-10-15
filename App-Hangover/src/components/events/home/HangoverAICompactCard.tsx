import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Sparkles, ArrowRight, HelpCircle, Calendar, Flame, Disc, Users, Tag, Crown } from 'lucide-react-native';

interface HangoverAICompactCardProps {
  onSelectSuggestion: (query: string) => void;
  onOpenDiscovery: () => void;
}

const COMPACT_SUGGESTIONS = [
  { id: '1', label: 'Hoy', query: 'Quiero salir hoy', icon: Calendar },
  { id: '2', label: 'Quiero bailar', query: 'Quiero bailar reggaeton', icon: Flame },
  { id: '3', label: 'Electrónica', query: 'Quiero música electrónica este fin de semana', icon: Disc },
  { id: '4', label: 'Conocer gente', query: 'Quiero conocer gente nueva y salir de fiesta', icon: Users },
  { id: '5', label: 'Económico', query: 'Busco algo barato', icon: Tag },
  { id: '6', label: 'Premium', query: 'Quiero un plan premium VIP', icon: Crown },
];

export const HangoverAICompactCard: React.FC<HangoverAICompactCardProps> = ({
  onSelectSuggestion,
  onOpenDiscovery,
}) => {
  return (
    <View style={styles.container}>
      {/* TARJETA COMPACTA DE INTRODUCCIÓN IA */}
      <TouchableOpacity style={styles.card} onPress={onOpenDiscovery} activeOpacity={0.85}>
        <View style={styles.cardHeader}>
          <View style={styles.brandRow}>
            <Sparkles size={14} color="#818cf8" />
            <Text style={styles.brandTitle}>HANGOVER AI</Text>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NUEVO</Text>
            </View>
          </View>

          <View style={styles.tryButton}>
            <Text style={styles.tryButtonText}>Probar ahora</Text>
            <ArrowRight size={12} color="#818cf8" />
          </View>
        </View>

        <Text style={styles.cardDescription}>
          Encuentra el plan perfecto según lo que tienes en mente.
        </Text>
      </TouchableOpacity>

      {/* CHIPS RÁPIDOS COMPACTOS CON ICONOS SUTILES */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        <TouchableOpacity
          style={[styles.chip, styles.discoveryChip]}
          onPress={onOpenDiscovery}
          activeOpacity={0.8}
        >
          <HelpCircle size={12} color="#ec4899" />
          <Text style={styles.discoveryChipText}>No sé qué hacer</Text>
        </TouchableOpacity>

        {COMPACT_SUGGESTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <TouchableOpacity
              key={s.id}
              style={styles.chip}
              onPress={() => onSelectSuggestion(s.query)}
              activeOpacity={0.8}
            >
              <Icon size={12} color="#818cf8" />
              <Text style={styles.chipText}>{s.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.2)',
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  newBadge: {
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  newBadgeText: {
    color: '#ec4899',
    fontSize: 8,
    fontWeight: 'bold',
  },
  tryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tryButtonText: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardDescription: {
    color: '#a1a1aa',
    fontSize: 11,
  },

  chipsRow: {
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  chipText: {
    color: '#d4d4d8',
    fontSize: 11,
    fontWeight: '500',
  },
  discoveryChip: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    borderColor: 'rgba(236, 72, 153, 0.25)',
  },
  discoveryChipText: {
    color: '#ec4899',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
