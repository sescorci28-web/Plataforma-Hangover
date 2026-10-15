import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { Calendar, Building2, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { HeroBackground } from './HeroBackground';

const { height } = Dimensions.get('window');

export const HeroSection = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <HeroBackground>
        <View style={styles.contentWrapper}>
          <View style={styles.content}>
            <View style={styles.badgeContainer}>
              <Sparkles size={14} color="#818cf8" style={styles.badgeIcon} />
              <Text style={styles.badgeText}>VIVE LA MEJOR EXPERIENCIA SOCIAL NOCTURNA</Text>
            </View>

            <Text style={styles.title}>ELEVA TUS NOCHES</Text>
            <Text style={styles.subtitleGlow}>A OTRO NIVEL</Text>

            <Text style={styles.description}>
              Descubre eventos únicos, discotecas exclusivas, reserva mesas VIP en caliente y contrata servicios de primer nivel para tus fiestas.
            </Text>

            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={styles.primaryButton} 
                activeOpacity={0.8}
                onPress={() => router.push('/events' as any)}
              >
                <Calendar size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>EXPLORAR EVENTOS</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryButton} 
                activeOpacity={0.8}
                onPress={() => router.push('/clubs' as any)}
              >
                <Building2 size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.secondaryButtonText}>EXPLORAR DISCOTECAS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </HeroBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: height * 0.75,
    width: '100%',
    backgroundColor: '#020205',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    marginTop: 40,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  badgeIcon: {
    marginRight: 6,
  },
  badgeText: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitleGlow: {
    color: '#818cf8',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    color: '#a1a1aa',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 320,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 14,
    borderRadius: 14,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
