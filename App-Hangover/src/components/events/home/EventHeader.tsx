import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react-native';
import { useResponsive } from '@/hooks/useResponsive';

interface EventHeaderProps {
  onBack: () => void;
  onOpenSort: () => void;
}

export const EventHeader: React.FC<EventHeaderProps> = ({ onBack, onOpenSort }) => {
  const { screenPadding, topInset } = useResponsive();

  return (
    <View style={[styles.container, { paddingHorizontal: screenPadding, paddingTop: Math.max(topInset, 8) }]}>
      {/* BARRA SUPERIOR DE NAVEGACIÓN Y FILTROS */}
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.iconButton} onPress={onBack} activeOpacity={0.8}>
          <ArrowLeft size={18} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.filterPill} onPress={onOpenSort} activeOpacity={0.8}>
          <SlidersHorizontal size={14} color="#818cf8" />
          <Text style={styles.filterPillText}>Filtrar</Text>
        </TouchableOpacity>
      </View>

      {/* TITULO Y SUBTITULO DE ALTA JERARQUÍA */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>EVENTOS</Text>
        <Text style={styles.subtitle} numberOfLines={1}>Descubre tu próximo plan</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(129, 140, 248, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.25)',
  },
  filterPillText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  titleContainer: {},
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#a1a1aa',
    fontSize: 13,
    marginTop: 2,
  },
});
