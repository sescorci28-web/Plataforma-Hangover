import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Sparkles, PartyPopper, Disc, Users, Wine, Flame, ArrowRight, Tag, Crown, Calendar } from 'lucide-react-native';

interface PlanDiscoveryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPlan: (query: string) => void;
}

const QUICK_AI_CHIPS = [
  { id: 'q1', label: 'Hoy', query: 'Quiero salir hoy', icon: Calendar },
  { id: 'q2', label: 'Reggaetón', query: 'Quiero bailar reggaeton', icon: Flame },
  { id: 'q3', label: 'Electrónica', query: 'Quiero música electrónica este fin de semana', icon: Disc },
  { id: 'q4', label: 'Conocer gente', query: 'Quiero conocer gente nueva', icon: Users },
  { id: 'q5', label: 'Económico', query: 'Busco algo barato', icon: Tag },
  { id: 'q6', label: 'VIP / Premium', query: 'Quiero un plan VIP exclusivo', icon: Crown },
];

const PLAN_OPTIONS = [
  { id: '1', title: 'Fiesta en vivo', icon: PartyPopper, query: 'Quiero fiesta con ambiente y música en vivo' },
  { id: '2', title: 'Bailar reggaetón', icon: Disc, query: 'Quiero bailar reggaeton' },
  { id: '3', title: 'Música electrónica', icon: Disc, query: 'Quiero música electrónica techno house' },
  { id: '4', title: 'Conocer gente nueva', icon: Users, query: 'Quiero conocer gente nueva en el evento' },
  { id: '5', title: 'Algo exclusivo / VIP', icon: Wine, query: 'Quiero un plan premium VIP reservado' },
  { id: '6', title: 'Lo más prendido', icon: Flame, query: 'Quiero lo más prendido y lleno de gente' },
];

const BUDGET_OPTIONS = [
  { id: 'b1', label: 'Económico', tag: 'barato', icon: Tag },
  { id: 'b2', label: 'Normal', tag: 'normal', icon: Tag },
  { id: 'b3', label: 'Premium', tag: 'premium', icon: Crown },
  { id: 'b4', label: 'Me da igual', tag: '', icon: Sparkles },
];

export const PlanDiscoveryModal: React.FC<PlanDiscoveryModalProps> = ({
  visible,
  onClose,
  onSelectPlan,
}) => {
  const [selectedPlanQuery, setSelectedPlanQuery] = useState<string | null>(null);
  const [selectedBudgetTag, setSelectedBudgetTag] = useState<string>('');

  const handleQuickChipPress = (query: string) => {
    onSelectPlan(query);
    onClose();
  };

  const handleFinishDiscovery = () => {
    if (!selectedPlanQuery) return;
    const finalQuery = `${selectedPlanQuery} ${selectedBudgetTag}`.trim();
    onSelectPlan(finalQuery);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {/* HEADER DEL CENTRO DE COMANDO HANGOVER AI */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.aiBadgeIcon}>
                <Sparkles size={16} color="#818cf8" />
              </View>
              <View>
                <Text style={styles.headerTitle}>HANGOVER AI</Text>
                <Text style={styles.headerSubtitle}>Asistente Inteligente de Eventos</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* SECCIÓN 1: BÚSQUEDA RÁPIDA CON UN TOQUE */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionLabel}>BÚSQUEDA RÁPIDA DE IA</Text>
              <Text style={styles.sectionHeading}>Toca una opción para encontrar plan directo:</Text>
              <View style={styles.quickChipsGrid}>
                {QUICK_AI_CHIPS.map((chip) => {
                  const Icon = chip.icon;
                  return (
                    <TouchableOpacity
                      key={chip.id}
                      style={styles.quickChip}
                      onPress={() => handleQuickChipPress(chip.query)}
                      activeOpacity={0.8}
                    >
                      <Icon size={12} color="#818cf8" />
                      <Text style={styles.quickChipText}>{chip.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* SECCIÓN 2: PASO 1 ASISTIDO */}
            <View style={styles.stepBox}>
              <Text style={styles.stepTitle}>ASISTENTE GUIADO · PASO 1 DE 2</Text>
              <Text style={styles.stepHeading}>¿Qué ambiente buscas hoy?</Text>
              <View style={styles.optionsGrid}>
                {PLAN_OPTIONS.map((item) => {
                  const isSelected = selectedPlanQuery === item.query;
                  const Icon = item.icon;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.optionCard, isSelected && styles.selectedOptionCard]}
                      onPress={() => setSelectedPlanQuery(item.query)}
                      activeOpacity={0.8}
                    >
                      <Icon size={18} color={isSelected ? '#ec4899' : '#818cf8'} />
                      <Text style={[styles.optionTitle, isSelected && styles.selectedOptionTitle]}>
                        {item.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* SECCIÓN 3: PASO 2 PRESUPUESTO */}
            <View style={styles.stepBox}>
              <Text style={styles.stepTitle}>ASISTENTE GUIADO · PASO 2 DE 2</Text>
              <Text style={styles.stepHeading}>¿Cuál es tu presupuesto aproximado?</Text>
              <View style={styles.budgetRow}>
                {BUDGET_OPTIONS.map((b) => {
                  const isSelected = selectedBudgetTag === b.tag;
                  const Icon = b.icon;
                  return (
                    <TouchableOpacity
                      key={b.id}
                      style={[styles.budgetChip, isSelected && styles.selectedBudgetChip]}
                      onPress={() => setSelectedBudgetTag(b.tag)}
                      activeOpacity={0.8}
                    >
                      <Icon size={12} color={isSelected ? '#818cf8' : '#71717a'} />
                      <Text style={[styles.budgetText, isSelected && styles.selectedBudgetText]}>
                        {b.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* FOOTER ACCIÓN DE IA */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, !selectedPlanQuery && styles.disabledButton]}
              disabled={!selectedPlanQuery}
              onPress={handleFinishDiscovery}
              activeOpacity={0.85}
            >
              <Sparkles size={16} color="#fff" />
              <Text style={styles.submitButtonText}>Encontrar mi plan ideal</Text>
              <ArrowRight size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020205',
  },
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  aiBadgeIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.3)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: '#71717a',
    fontSize: 11,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContent: {
    padding: 20,
  },
  sectionBox: {
    marginBottom: 24,
    backgroundColor: 'rgba(129, 140, 248, 0.04)',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.15)',
  },
  sectionLabel: {
    color: '#818cf8',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionHeading: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  quickChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickChipText: {
    color: '#d4d4d8',
    fontSize: 11,
    fontWeight: '600',
  },

  stepBox: {
    marginBottom: 24,
  },
  stepTitle: {
    color: '#818cf8',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  stepHeading: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 14,
  },

  optionsGrid: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.025)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  selectedOptionCard: {
    backgroundColor: 'rgba(236,72,153,0.12)',
    borderColor: 'rgba(236,72,153,0.4)',
  },
  optionTitle: {
    color: '#d4d4d8',
    fontSize: 13,
    fontWeight: '600',
  },
  selectedOptionTitle: {
    color: '#fff',
    fontWeight: 'bold',
  },

  budgetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  budgetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  selectedBudgetChip: {
    backgroundColor: 'rgba(129,140,248,0.18)',
    borderColor: 'rgba(129,140,248,0.35)',
  },
  budgetText: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedBudgetText: {
    color: '#818cf8',
    fontWeight: 'bold',
  },

  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 14,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
