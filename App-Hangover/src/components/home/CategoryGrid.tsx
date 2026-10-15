import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Calendar, Building2, Sparkles, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const CATEGORY_PAIRS = [
  [
    {
      id: 'events',
      title: 'Eventos',
      subtitle: 'CARTELERA EN VIVO',
      icon: Calendar,
      color: '#818cf8',
      bgColor: 'rgba(129, 140, 248, 0.12)',
      route: '/events',
    },
    {
      id: 'clubs',
      title: 'Discotecas',
      subtitle: 'SALAS Y MESAS VIP',
      icon: Building2,
      color: '#a855f7',
      bgColor: 'rgba(168, 85, 247, 0.12)',
      route: '/clubs',
    },
  ],
  [
    {
      id: 'services',
      title: 'Servicios',
      subtitle: 'DJS, SONIDO & SHOWS',
      icon: Sparkles,
      color: '#c084fc',
      bgColor: 'rgba(192, 132, 252, 0.12)',
      route: '/services',
    },
    {
      id: 'connect',
      title: 'Connect',
      subtitle: 'COMUNIDAD EN VIVO',
      icon: Users,
      color: '#2dd4bf',
      bgColor: 'rgba(45, 212, 191, 0.12)',
      route: '/connect',
    },
  ],
];

export const CategoryGrid = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>¿QUÉ DESEAS HACER HOY?</Text>
        <Text style={styles.headerTitle}>Explora la Noche</Text>
      </View>

      <View style={styles.gridContainer}>
        {CATEGORY_PAIRS.map((rowItems, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {rowItems.map((category) => (
              <TouchableOpacity 
                key={category.id} 
                style={styles.card}
                activeOpacity={0.75}
                onPress={() => router.push(category.route as any)}
              >
                <View style={[styles.iconContainer, { backgroundColor: category.bgColor }]}>
                  <category.icon size={18} color={category.color} />
                </View>

                <View style={styles.textContainer}>
                  <Text style={styles.subtitle} numberOfLines={1}>{category.subtitle}</Text>
                  <Text style={styles.title} numberOfLines={1}>{category.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    width: '100%',
  },
  header: {
    marginBottom: 14,
  },
  headerSubtitle: {
    color: '#818cf8',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  gridContainer: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#18181b',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    height: 104,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    gap: 1,
  },
  subtitle: {
    color: '#818cf8',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
