import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Sparkles, Search, HelpCircle, ArrowRight } from 'lucide-react-native';

interface HangoverAIBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSubmit: () => void;
  onSelectSuggestion: (suggestionText: string) => void;
  onOpenDiscovery: () => void;
  isAnalyzing: boolean;
}

const SUGGESTION_CHIPS = [
  { id: '1', label: '🔥 Algo para hoy', query: 'Quiero salir hoy' },
  { id: '2', label: '🎧 Música electrónica', query: 'Quiero música electrónica este fin de semana' },
  { id: '3', label: '👥 Conocer gente', query: 'Quiero conocer gente nueva y bailar' },
  { id: '4', label: '💰 Algo económico', query: 'Busco algo barato y divertido' },
  { id: '5', label: '💎 Plan premium', query: 'Quiero un plan premium exclusivo' },
  { id: '6', label: '🎉 Lo más prendido', query: 'Quiero una fiesta con mucho ambiente y gente' },
  { id: '7', label: '💃 Quiero bailar', query: 'Quiero bailar reggaeton' },
];

export const HangoverAIBar: React.FC<HangoverAIBarProps> = ({
  query,
  onQueryChange,
  onSubmit,
  onSelectSuggestion,
  onOpenDiscovery,
  isAnalyzing,
}) => {
  return (
    <View style={styles.container}>
      {/* BANNER HEADER IA */}
      <View style={styles.aiHeaderRow}>
        <View style={styles.badgeRow}>
          <Sparkles size={14} color="#818cf8" />
          <Text style={styles.aiTitle}>Hangover AI</Text>
          <View style={styles.betaBadge}>
            <Text style={styles.betaBadgeText}>INTELIGENTE</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.helpLink} onPress={onOpenDiscovery} activeOpacity={0.8}>
          <HelpCircle size={14} color="#ec4899" />
          <Text style={styles.helpLinkText}>¿No sabes qué hacer?</Text>
        </TouchableOpacity>
      </View>

      {/* INPUT INTELIGENTE CON LENGUAJE NATURAL */}
      <View style={styles.inputContainer}>
        <Sparkles size={18} color="#818cf8" style={{ marginLeft: 12 }} />
        <TextInput
          style={styles.input}
          placeholder="Ej: Quiero salir este sábado, escuchar electrónica y conocer gente..."
          placeholderTextColor="#71717a"
          value={query}
          onChangeText={onQueryChange}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={[styles.searchButton, isAnalyzing && styles.searchButtonDisabled]}
          onPress={onSubmit}
          disabled={isAnalyzing}
          activeOpacity={0.8}
        >
          <ArrowRight size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* CHIPS DE SUGERENCIAS RÁPIDAS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.suggestionsContainer}
      >
        <TouchableOpacity
          style={[styles.chip, styles.discoveryChip]}
          onPress={onOpenDiscovery}
          activeOpacity={0.8}
        >
          <Text style={styles.discoveryChipText}>❓ No sé qué hacer</Text>
        </TouchableOpacity>

        {SUGGESTION_CHIPS.map((chip) => (
          <TouchableOpacity
            key={chip.id}
            style={styles.chip}
            onPress={() => onSelectSuggestion(chip.query)}
            activeOpacity={0.8}
          >
            <Text style={styles.chipText}>{chip.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.25)',
    marginBottom: 20,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  betaBadge: {
    backgroundColor: 'rgba(129,140,248,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.3)',
  },
  betaBadgeText: {
    color: '#818cf8',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  helpLinkText: {
    color: '#ec4899',
    fontSize: 11,
    fontWeight: 'bold',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  searchButton: {
    backgroundColor: '#6366f1',
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },

  suggestionsContainer: {
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipText: {
    color: '#d4d4d8',
    fontSize: 11,
    fontWeight: '500',
  },
  discoveryChip: {
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  discoveryChipText: {
    color: '#ec4899',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
