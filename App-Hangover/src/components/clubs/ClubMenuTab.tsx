import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import {
  Wine,
  Sparkles,
} from 'lucide-react-native';
import { ClubMenuItem } from '@/types/club.types';
import { ClubTheme } from '@/constants/clubTheme';

interface ClubMenuTabProps {
  items: ClubMenuItem[];
}

export const ClubMenuTab: React.FC<ClubMenuTabProps> = ({ items }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Categorías presentes en los productos
  const categories = useMemo(() => {
    const list = ['Todos'];
    const catSet = new Set<string>();
    items.forEach((item) => {
      if (item.category && item.category.trim()) {
        catSet.add(item.category.trim());
      }
    });
    return [...list, ...Array.from(catSet)];
  }, [items]);

  // Filtrado
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'Todos') return items;
    return items.filter((item) => item.category.toLowerCase() === selectedCategory.toLowerCase());
  }, [items, selectedCategory]);

  if (!items || items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Wine size={24} color={ClubTheme.colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Carta digital no publicada</Text>
        <Text style={styles.emptySubtitle}>
          Esta discoteca aún no ha añadido sus productos o botellas a la carta digital.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. SELECTOR DE CATEGORÍAS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.8}
            >
              <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 2. LISTADO LIMPIO DE PRODUCTOS */}
      <View style={styles.itemsList}>
        {filteredItems.map((item) => (
          <View
            key={item.id}
            style={[styles.productCard, !item.available && styles.productCardUnavailable]}
          >
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.productImage} resizeMode="cover" />
            ) : (
              <View style={styles.placeholderIcon}>
                <Wine size={20} color={ClubTheme.colors.textMuted} />
              </View>
            )}

            <View style={styles.productDetails}>
              <View style={styles.titleRow}>
                <Text style={styles.productName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.featured && (
                  <Sparkles size={13} color="#fbbf24" />
                )}
              </View>

              {item.description ? (
                <Text style={styles.productDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}

              <View style={styles.priceRow}>
                <Text style={styles.productPrice}>
                  ${item.price.toLocaleString('es-CO')}
                </Text>
                {!item.available && (
                  <Text style={styles.soldOutText}>Agotado</Text>
                )}
              </View>
            </View>
          </View>
        ))}

        {filteredItems.length === 0 && (
          <View style={styles.noResultsBox}>
            <Text style={styles.noResultsText}>
              No hay productos disponibles en esta categoría.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    gap: 14,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: ClubTheme.radii.full,
    backgroundColor: ClubTheme.colors.surface,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
  },
  categoryChipSelected: {
    backgroundColor: ClubTheme.colors.surfaceElevated,
    borderColor: ClubTheme.colors.primary,
  },
  categoryChipText: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryChipTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  itemsList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: ClubTheme.colors.surface,
    borderRadius: ClubTheme.radii.lg,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
    padding: 12,
    gap: 12,
    alignItems: 'center',
  },
  productCardUnavailable: {
    opacity: 0.5,
  },
  productImage: {
    width: 68,
    height: 68,
    borderRadius: ClubTheme.radii.md,
    backgroundColor: '#161622',
  },
  placeholderIcon: {
    width: 68,
    height: 68,
    borderRadius: ClubTheme.radii.md,
    backgroundColor: ClubTheme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productDetails: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productName: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  productDescription: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  productPrice: {
    color: ClubTheme.colors.success,
    fontSize: 14,
    fontWeight: '800',
  },
  soldOutText: {
    color: ClubTheme.colors.danger,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  noResultsBox: {
    padding: 24,
    alignItems: 'center',
  },
  noResultsText: {
    color: ClubTheme.colors.textMuted,
    fontSize: 13,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: ClubTheme.colors.surface,
    borderRadius: ClubTheme.radii.lg,
    borderWidth: 1,
    borderColor: ClubTheme.colors.border,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ClubTheme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: ClubTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
