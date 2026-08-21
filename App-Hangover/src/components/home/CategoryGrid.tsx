import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Calendar, Building2, Sparkles, Users } from 'lucide-react-native';

const CATEGORIES = [
  {
    id: 'events',
    title: 'Eventos',
    subtitle: 'Cartelera en vivo',
    icon: Calendar,
    color: '#818cf8',
    bgColor: 'rgba(129, 140, 248, 0.1)',
  },
  {
    id: 'clubs',
    title: 'Discotecas',
    subtitle: 'Salas y VIP',
    icon: Building2,
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.1)',
  },
  {
    id: 'services',
    title: 'Servicios',
    subtitle: 'DJs y sonido',
    icon: Sparkles,
    color: '#c084fc',
    bgColor: 'rgba(192, 132, 252, 0.1)',
  },
  {
    id: 'connect',
    title: 'Connect',
    subtitle: 'Conecta en vivo',
    icon: Users,
    color: '#2dd4bf',
    bgColor: 'rgba(45, 212, 191, 0.1)',
  },
];

export const CategoryGrid = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>¿QUÉ DESEAS HACER HOY?</Text>
        <Text style={styles.headerTitle}>EXPLORA LA NOCHE</Text>
      </View>

      <View style={styles.grid}>
        {CATEGORIES.map((category) => (
          <TouchableOpacity 
            key={category.id} 
            style={styles.card}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: category.bgColor }]}>
              <category.icon size={20} color={category.color} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.subtitle}>{category.subtitle}</Text>
              <Text style={styles.title}>{category.title}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 20,
  },
  headerSubtitle: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    height: 140,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    gap: 2,
  },
  subtitle: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
