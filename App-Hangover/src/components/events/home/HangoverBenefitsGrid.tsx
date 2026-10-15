import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, Users, Ticket, Zap } from 'lucide-react-native';

const BENEFITS = [
  {
    id: '1',
    icon: Ticket,
    color: '#818cf8',
    title: 'Entradas seguras',
    desc: 'QR único anti-fraude y acceso instantáneo.',
  },
  {
    id: '2',
    icon: Users,
    color: '#ec4899',
    title: 'Conecta con tu gente',
    desc: 'Descubre quién asistirá e interactúa en vivo.',
  },
  {
    id: '3',
    icon: ShieldCheck,
    color: '#10b981',
    title: 'Eventos verificados',
    desc: 'Organizadores y venues 100% auténticos.',
  },
  {
    id: '4',
    icon: Zap,
    color: '#fbbf24',
    title: 'Actualizaciones en vivo',
    desc: 'Historias y novedades en tiempo real.',
  },
];

export const HangoverBenefitsGrid: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>¿Por qué Hangover?</Text>

      <View style={styles.grid}>
        {BENEFITS.map((b) => {
          const Icon = b.icon;
          return (
            <View key={b.id} style={styles.card}>
              <View style={[styles.iconCircle, { backgroundColor: `${b.color}15` }]}>
                <Icon size={16} color={b.color} />
              </View>
              <Text style={styles.title}>{b.title}</Text>
              <Text style={styles.desc}>{b.desc}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  desc: {
    color: '#71717a',
    fontSize: 10,
    lineHeight: 14,
  },
});
