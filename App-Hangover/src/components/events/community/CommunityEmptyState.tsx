import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Users } from 'lucide-react-native';

interface CommunityEmptyStateProps {
  title?: string;
  subtitle?: string;
}

export const CommunityEmptyState: React.FC<CommunityEmptyStateProps> = ({
  title = 'La comunidad se activará durante el evento',
  subtitle = 'Una vez ingreses al evento y valides tu QR, podrás conectar con otros asistentes presentes.',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Users size={24} color="#818cf8" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(129,140,248,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: '#71717a',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
