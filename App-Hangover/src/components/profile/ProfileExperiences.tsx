import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ticket, Crown, ChevronRight } from 'lucide-react-native';

interface ProfileExperiencesProps {
  activeTicketsCount: number;
  onOpenTickets: () => void;
  onShowToast: (title: string, message: string) => void;
}

export function ProfileExperiences({
  activeTicketsCount,
  onOpenTickets,
  onShowToast,
}: ProfileExperiencesProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.mainSectionTitle}>Mis experiencias</Text>

      {/* 1. GRID TARJETAS DE DESTACADOS (2 COLUMNAS) */}
      <View style={styles.gridRow}>
        {/* MIS ENTRADAS */}
        <TouchableOpacity 
          style={styles.gridCard} 
          onPress={onOpenTickets}
          activeOpacity={0.8}
        >
          <View style={styles.gridIconCircle}>
            <Ticket size={20} color="#F900BF" />
          </View>
          <Text style={styles.gridCardTitle}>Mis entradas</Text>
          <Text style={styles.gridCardSub}>
            {activeTicketsCount > 0
              ? `${activeTicketsCount} ${activeTicketsCount === 1 ? 'entrada próxima' : 'entradas próximas'}`
              : 'Sin entradas próximas'}
          </Text>
          <ChevronRight size={16} color="#64748b" style={styles.gridChevron} />
        </TouchableOpacity>

        {/* RESERVAS DE MESA */}
        <TouchableOpacity 
          style={styles.gridCard} 
          onPress={() => onShowToast('Reservas de mesa', 'No tienes reservas de mesa activas actualmente.')}
          activeOpacity={0.8}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(153, 0, 240, 0.15)' }]}>
            <Crown size={20} color="#A855F7" />
          </View>
          <Text style={styles.gridCardTitle}>Reservas de mesa</Text>
          <Text style={styles.gridCardSub}>Gestiona tus reservas</Text>
          <ChevronRight size={16} color="#64748b" style={styles.gridChevron} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 14,
    marginBottom: 20,
  },
  mainSectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 2,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#0F0921',
    borderColor: 'rgba(153, 0, 240, 0.25)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    position: 'relative',
  },
  gridIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 0, 191, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  gridCardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  gridCardSub: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 14,
  },
  gridChevron: {
    position: 'absolute',
    top: 14,
    right: 12,
  },
});
