import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Calendar, Building2, Sparkles, ArrowLeft, ChevronRight } from 'lucide-react-native';
import { AccountType } from '@/services/auth.service';

interface OptionCard {
  type: AccountType;
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
}

const ACCOUNT_OPTIONS: OptionCard[] = [
  {
    type: 'user',
    title: 'Usuario',
    subtitle: 'ASISTENTE / CLUBBER',
    description: 'Descubre eventos, reserva mesas VIP, compra tickets y vive la experiencia nocturna.',
    icon: User,
    color: '#818cf8',
    bgColor: 'rgba(129, 140, 248, 0.12)',
  },
  {
    type: 'event_organizer',
    title: 'Organizador',
    subtitle: 'PRODUCTOR DE EVENTOS',
    description: 'Crea, publica y gestiona cartelera de eventos, boletería, aforos y promociones.',
    icon: Calendar,
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.12)',
  },
  {
    type: 'club',
    title: 'Discoteca / Club',
    subtitle: 'ESTABLECIMIENTO VIP',
    description: 'Administra tu local, reserva de mesas, comandas en vivo y lista de invitados.',
    icon: Building2,
    color: '#c084fc',
    bgColor: 'rgba(192, 132, 252, 0.12)',
  },
  {
    type: 'service_provider',
    title: 'Prestador de Servicios',
    subtitle: 'SHOWS, DJS & SONIDO',
    description: 'Ofrece tus servicios de DJ, sonido, luces o producción para eventos y fiestas.',
    icon: Sparkles,
    color: '#2dd4bf',
    bgColor: 'rgba(45, 212, 191, 0.12)',
  },
];

export default function AccountTypeScreen() {
  const router = useRouter();

  const handleSelectType = (type: AccountType) => {
    router.push({
      pathname: '/register',
      params: { type },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>REGISTRO DE CUENTA</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.tagline}>¿CÓMO QUIERES USAR HANGOVER?</Text>
        <Text style={styles.mainTitle}>Selecciona tu Perfil</Text>
        <Text style={styles.description}>
          Elige la opción que mejor se adapte a tu rol para ofrecerte las herramientas ideales.
        </Text>

        <View style={styles.cardsContainer}>
          {ACCOUNT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => handleSelectType(option.type)}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: option.bgColor }]}>
                  <option.icon size={22} color={option.color} />
                </View>
                <View style={styles.titleBox}>
                  <Text style={[styles.subtitle, { color: option.color }]}>{option.subtitle}</Text>
                  <Text style={styles.cardTitle}>{option.title}</Text>
                </View>
                <ChevronRight size={20} color="#52525b" />
              </View>

              <Text style={styles.cardDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.loginLink}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.loginLinkText}>
            ¿Ya tienes una cuenta? <Text style={styles.loginLinkBold}>Inicia Sesión</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020205' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  content: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  tagline: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  mainTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  description: {
    color: '#a1a1aa',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  cardsContainer: {
    gap: 14,
    marginBottom: 28,
  },
  card: {
    backgroundColor: '#18181b',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  titleBox: {
    flex: 1,
  },
  subtitle: {
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  cardDescription: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loginLinkText: {
    color: '#a1a1aa',
    fontSize: 14,
  },
  loginLinkBold: {
    color: '#818cf8',
    fontWeight: 'bold',
  },
});
