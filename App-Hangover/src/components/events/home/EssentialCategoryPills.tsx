import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Disc, Flame, Mic, Sparkles, Music, Layers, Radio, ChevronRight } from 'lucide-react-native';
import { useResponsive } from '@/hooks/useResponsive';

interface CategoryPill {
  id: string;
  name: string;
  value: string;
  icon: React.ElementType;
}

const ESSENTIAL_CATEGORIES: CategoryPill[] = [
  { id: 'all', name: 'Todos', value: 'Todos', icon: Layers },
  { id: 'electro', name: 'Electrónica', value: 'electronica', icon: Disc },
  { id: 'reggaeton', name: 'Reggaetón', value: 'reggaeton', icon: Flame },
  { id: 'envivo', name: 'En vivo', value: 'envivo', icon: Mic },
  { id: 'crossover', name: 'Crossover', value: 'crossover', icon: Sparkles },
  { id: 'salsa', name: 'Salsa', value: 'salsa', icon: Music },
  { id: 'techno', name: 'Techno', value: 'techno', icon: Radio },
];

interface EssentialCategoryPillsProps {
  selectedCategory: string;
  onSelectCategory: (val: string) => void;
}

export const EssentialCategoryPills: React.FC<EssentialCategoryPillsProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const { screenPadding } = useResponsive();

  return (
    <View style={styles.container}>
      {/* ENCABEZADO DE CATEGORÍAS RESPONSIVE */}
      <View style={[styles.headerRow, { paddingHorizontal: screenPadding }]}>
        <Text style={styles.headerTitle}>CATEGORÍAS</Text>
        <TouchableOpacity onPress={() => onSelectCategory('Todos')} activeOpacity={0.8} style={styles.seeAllRow}>
          <Text style={styles.seeAllText}>Todas</Text>
          <ChevronRight size={12} color="#818cf8" />
        </TouchableOpacity>
      </View>

      {/* CARRUSEL DE PILLS COMPACTAS CON ICONOS LUCIDE */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: screenPadding }]}
      >
        {ESSENTIAL_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.value;
          const Icon = cat.icon;

          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.pill, isSelected && styles.selectedPill]}
              onPress={() => onSelectCategory(cat.value)}
              activeOpacity={0.8}
            >
              <Icon size={12} color={isSelected ? '#818cf8' : '#71717a'} />
              <Text style={[styles.pillText, isSelected && styles.selectedPillText]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: 'bold',
  },

  scrollContent: {
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectedPill: {
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
    borderColor: 'rgba(129, 140, 248, 0.35)',
  },
  pillText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '500',
  },
  selectedPillText: {
    color: '#818cf8',
    fontWeight: 'bold',
  },
});
