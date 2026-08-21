import React from 'react';
import { StyleSheet, Text, View, ImageBackground, TouchableOpacity, Dimensions } from 'react-native';
import { Calendar, Building2, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { height } = Dimensions.get('window');

export const HeroSection = () => {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1800&q=80' }}
        style={styles.backgroundImage}
        imageStyle={{ opacity: 0.4 }}
      >
        <LinearGradient
          colors={['rgba(2,2,5,0.4)', 'rgba(2,2,5,1)']}
          style={styles.gradient}
        >
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
              <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
                <Calendar size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>EXPLORAR EVENTOS</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8}>
                <Building2 size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.secondaryButtonText}>EXPLORAR DISCOTECAS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: height * 0.75,
    width: '100%',
    backgroundColor: '#000',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
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
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(99, 102, 241, 0.25)',
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
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitleGlow: {
    color: '#a855f7',
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -1,
  },
  description: {
    color: '#a1a1aa',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    maxWidth: '90%',
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
