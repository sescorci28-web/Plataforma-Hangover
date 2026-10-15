import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Sparkles, ArrowRight } from 'lucide-react-native';
import { useResponsive } from '@/hooks/useResponsive';

interface SmartSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onOpenDiscovery?: () => void;
  isAnalyzing?: boolean;
}

export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  value,
  onChangeText,
  onSubmit,
  onOpenDiscovery,
  isAnalyzing = false,
}) => {
  const { screenPadding, isCompact } = useResponsive();

  return (
    <View style={[styles.container, { paddingHorizontal: screenPadding }]}>
      {/* BARRA DE BÚSQUEDA INTELIGENTE UNIFICADA HANGOVER AI */}
      <View style={styles.searchBar}>
        {onOpenDiscovery ? (
          <TouchableOpacity
            style={styles.aiIconButton}
            onPress={onOpenDiscovery}
            activeOpacity={0.75}
          >
            <Sparkles size={16} color="#818cf8" />
          </TouchableOpacity>
        ) : (
          <View style={styles.staticIconContainer}>
            <Sparkles size={16} color="#818cf8" />
          </View>
        )}

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder={isCompact ? "¿Qué plan buscas hoy?" : "¿Qué plan estás buscando?"}
          placeholderTextColor="#71717a"
          returnKeyType="search"
        />

        <TouchableOpacity
          style={[styles.submitButton, isAnalyzing && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={isAnalyzing}
          activeOpacity={0.85}
        >
          <ArrowRight size={14} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* LÍNEA PEQUEÑA DE INDICACIÓN */}
      <Text style={styles.subHint} numberOfLines={1}>
        Buscar manualmente o usar <Text style={{ color: '#818cf8', fontWeight: 'bold' }}>Hangover AI</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.25)',
    paddingHorizontal: 8,
    height: 48,
    marginBottom: 6,
  },
  aiIconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(129, 140, 248, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.25)',
    marginRight: 8,
  },
  staticIconContainer: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 6,
  },
  submitButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },

  subHint: {
    color: '#71717a',
    fontSize: 10,
    paddingLeft: 4,
  },
});
