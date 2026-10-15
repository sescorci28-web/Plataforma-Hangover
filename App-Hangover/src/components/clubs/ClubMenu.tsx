import React from 'react';
import { View, Text, StyleSheet, SectionList } from 'react-native';
import { MenuCategory } from '@/data/mockClubs';

interface ClubMenuProps {
  menu: MenuCategory[];
}

export const ClubMenu = ({ menu }: ClubMenuProps) => {
  if (!menu || menu.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>La carta no está disponible temporalmente.</Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={menu.map(cat => ({ title: cat.category, data: cat.items }))}
      keyExtractor={(item) => item.id}
      scrollEnabled={false} // Al ir dentro de un ScrollView principal, no debe scrollear internamente
      renderSectionHeader={({ section: { title } }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <View style={styles.menuItem}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDescription}>{item.description}</Text>
          </View>
          <Text style={styles.itemPrice}>${item.price}</Text>
        </View>
      )}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  sectionHeader: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  itemInfo: {
    flex: 1,
    paddingRight: 16,
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    color: '#a1a1aa',
    fontSize: 12,
  },
  itemPrice: {
    color: '#34d399',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
  },
  emptyText: {
    color: '#a1a1aa',
    fontSize: 14,
  },
});
