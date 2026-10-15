import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Sparkles, Search, ArrowRight } from 'lucide-react-native';

interface EventUnifiedSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  mode: 'ai' | 'traditional';
  onToggleMode: (mode: 'ai' | 'traditional') => void;
  isAnalyzing?: boolean;
}

export const EventUnifiedSearch: React.FC<EventUnifiedSearchProps> = ({
  value,
  onChangeText,
  onSubmit,
  mode,
  onToggleMode,
  isAnalyzing = false,
}) => {
  return (
    <View style={styles.container}>
      {/* BARRA DE BÚSQUEDA GRANDE INTELIGENTE */}
      <View style={[styles.searchBar, mode === 'ai' && styles.aiSearchBar]}>
        {mode === 'ai' ? (
          <Sparkles size={18} color="#818cf8" style={styles.searchIcon} />
        ) : (
          <Search size={18} color="#a1a1aa" style={styles.searchIcon} />
        )}

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder={
            mode === 'ai'
              ? '✨ ¿Qué plan estás buscando? (ej: fiesta este sábado)'
              : 'Buscar por artista, nombre o lugar...'
          }
          placeholderTextColor="#71717a"
          returnKeyType="search"
        />

        <TouchableOpacity
          style={[styles.submitButton, isAnalyzing && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={isAnalyzing}
          activeOpacity={0.85}
        >
          <ArrowRight size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* CONMUTADOR DE MODO DE BÚSQUEDA SUTIL */}
      <View style={styles.modeToggleRow}>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'ai' && styles.activeModeTab]}
          onPress={() => onToggleMode('ai')}
          activeOpacity={0.8}
        >
          <Sparkles size={12} color={mode === 'ai' ? '#818cf8' : '#71717a'} />
          <Text style={[styles.modeText, mode === 'ai' && styles.activeModeText]}>
            Modo IA
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, mode === 'traditional' && styles.activeModeTab]}
          onPress={() => onToggleMode('traditional')}
          activeOpacity={0.8}
        >
          <Search size={12} color={mode === 'traditional' ? '#818cf8' : '#71717a'} />
          <Text style={[styles.modeText, mode === 'traditional' && styles.activeModeText]}>
            Búsqueda manual
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    height: 52,
  },
  aiSearchBar: {
    backgroundColor: 'rgba(129, 140, 248, 0.04)',
    borderColor: 'rgba(129, 140, 248, 0.3)',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    paddingVertical: 8,
  },
  submitButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },

  modeToggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeModeTab: {
    backgroundColor: 'rgba(129, 140, 248, 0.12)',
  },
  modeText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '500',
  },
  activeModeText: {
    color: '#818cf8',
    fontWeight: 'bold',
  },
});
