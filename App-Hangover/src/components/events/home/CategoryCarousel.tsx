import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ChevronRight, Disc, Flame, Mic, Sparkles, Music, Radio } from 'lucide-react-native';

interface CategoryItem {
  id: string;
  name: string;
  value: string;
  icon: React.ElementType;
}

const CATEGORIES_DATA: CategoryItem[] = [
  { id: 'cat-1', name: 'Electrónica', value: 'electronica', icon: Disc },
  { id: 'cat-2', name: 'Reggaetón', value: 'reggaeton', icon: Flame },
  { id: 'cat-3', name: 'En Vivo', value: 'crossover', icon: Mic },
  { id: 'cat-4', name: 'Crossover', value: 'crossover', icon: Sparkles },
  { id: 'cat-5', name: 'Salsa', value: 'salsa', icon: Music },
  { id: 'cat-6', name: 'Techno', value: 'electronica', icon: Radio },
];

interface CategoryCarouselProps {
  selectedCategory: string;
  onSelectCategory: (val: string) => void;
}

export const CategoryCarousel: React.FC<CategoryCarouselProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <View style={styles.container}>
      {/* HEADER DE SECCIÓN */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Categorías</Text>
        <TouchableOpacity
          style={styles.seeAllButton}
          onPress={() => onSelectCategory('Todos')}
          activeOpacity={0.8}
        >
          <Text style={styles.seeAllText}>Ver todas</Text>
          <ChevronRight size={14} color="#818cf8" />
        </TouchableOpacity>
      </View>

      {/* CARRUSEL HORIZONTAL DE CATEGORÍAS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES_DATA.map((cat) => {
          const isSelected = selectedCategory === cat.value;
          const Icon = cat.icon;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.card, isSelected && styles.selectedCard]}
              onPress={() => onSelectCategory(cat.value)}
              activeOpacity={0.8}
            >
              <Icon size={14} color={isSelected ? '#818cf8' : '#71717a'} />
              <Text style={[styles.name, isSelected && styles.selectedName]}>
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
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: 'bold',
  },

  scrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  selectedCard: {
    backgroundColor: 'rgba(129, 140, 248, 0.12)',
    borderColor: 'rgba(129, 140, 248, 0.3)',
  },
  name: {
    color: '#d4d4d8',
    fontSize: 12,
    fontWeight: '500',
  },
  selectedName: {
    color: '#818cf8',
    fontWeight: 'bold',
  },
});
