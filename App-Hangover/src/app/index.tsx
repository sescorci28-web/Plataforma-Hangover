import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* HEADER BÁSICO */}
      <View style={styles.header}>
        <Text style={styles.headerLogo}>HANGOVER</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.badgeText}>BETA</Text>
        </View>
      </View>

      {/* CONTENIDO PRINCIPAL */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* INDICADOR DE ARRANQUE SOLICITADO */}
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>✅ APP HANGOVER ARRANCÓ CORRECTAMENTE</Text>
        </View>

        {/* HERO SECTION (Estático puro) */}
        <View style={styles.heroSection}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>✨ VIVE LA MEJOR EXPERIENCIA SOCIAL</Text>
          </View>
          <Text style={styles.heroTitle}>ELEVA TUS NOCHES</Text>
          <Text style={styles.heroSubtitle}>A OTRO NIVEL</Text>
          <Text style={styles.heroDesc}>
            Descubre eventos únicos, discotecas exclusivas y reserva mesas VIP.
          </Text>
          
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
              <Text style={styles.primaryBtnText}>📅 EXPLORAR EVENTOS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.8}>
              <Text style={styles.secondaryBtnText}>🏢 EXPLORAR DISCOTECAS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CATEGORÍAS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionOverline}>¿QUÉ DESEAS HACER HOY?</Text>
          <Text style={styles.sectionTitleText}>EXPLORA LA NOCHE</Text>
        </View>

        <View style={styles.grid}>
          <TouchableOpacity style={[styles.gridCard, { borderColor: 'rgba(129, 140, 248, 0.2)' }]}>
            <Text style={styles.cardEmoji}>🎉</Text>
            <View>
              <Text style={styles.cardSubtitle}>Cartelera en vivo</Text>
              <Text style={styles.cardTitle}>Eventos</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.gridCard, { borderColor: 'rgba(168, 85, 247, 0.2)' }]}>
            <Text style={styles.cardEmoji}>🍾</Text>
            <View>
              <Text style={styles.cardSubtitle}>Salas y VIP</Text>
              <Text style={styles.cardTitle}>Discotecas</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.gridCard, { borderColor: 'rgba(192, 132, 252, 0.2)' }]}>
            <Text style={styles.cardEmoji}>🎧</Text>
            <View>
              <Text style={styles.cardSubtitle}>DJs y sonido</Text>
              <Text style={styles.cardTitle}>Servicios</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.gridCard, { borderColor: 'rgba(45, 212, 191, 0.2)' }]}>
            <Text style={styles.cardEmoji}>🔥</Text>
            <View>
              <Text style={styles.cardSubtitle}>Conecta en vivo</Text>
              <Text style={styles.cardTitle}>Connect</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* EVENTOS DESTACADOS (Scroll Horizontal) */}
        <View style={[styles.sectionHeader, { marginTop: 40 }]}>
          <View>
            <Text style={styles.sectionOverline}>CARTELERA EXCLUSIVA</Text>
            <Text style={styles.sectionTitleText}>EVENTOS DESTACADOS</Text>
          </View>
          <TouchableOpacity><Text style={styles.seeAllText}>Ver todos →</Text></TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          <View style={styles.eventCard}>
            <View style={[styles.placeholderImage, { backgroundColor: '#1e1e2d' }]} />
            <View style={styles.eventInfo}>
              <Text style={styles.eventDate}>VIE, 28 OCT • BARRANQUILLA</Text>
              <Text style={styles.eventTitle}>Neon Nights VIP</Text>
              <Text style={styles.eventPrice}>Desde $50</Text>
            </View>
          </View>
          
          <View style={styles.eventCard}>
            <View style={[styles.placeholderImage, { backgroundColor: '#2d1e2d' }]} />
            <View style={styles.eventInfo}>
              <Text style={styles.eventDate}>SAB, 29 OCT • CARTAGENA</Text>
              <Text style={styles.eventTitle}>Halloween Madness</Text>
              <Text style={styles.eventPrice}>Desde $80</Text>
            </View>
          </View>
        </ScrollView>

        {/* DISCOTECAS DESTACADAS (Scroll Horizontal) */}
        <View style={[styles.sectionHeader, { marginTop: 40 }]}>
          <View>
            <Text style={styles.sectionOverline}>TEMPLOS DE LA MÚSICA</Text>
            <Text style={styles.sectionTitleText}>DISCOTECAS DESTACADAS</Text>
          </View>
          <TouchableOpacity><Text style={styles.seeAllText}>Ver todas →</Text></TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          <View style={styles.clubCard}>
            <View style={[styles.placeholderImage, { backgroundColor: '#1e2d27', height: 120 }]} />
            <View style={styles.clubInfo}>
              <Text style={styles.eventDate}>BARRANQUILLA</Text>
              <Text style={styles.eventTitle}>La Fábrica</Text>
              <Text style={styles.clubRating}>⭐ 5.0</Text>
            </View>
          </View>

          <View style={styles.clubCard}>
            <View style={[styles.placeholderImage, { backgroundColor: '#2d1e1e', height: 120 }]} />
            <View style={styles.clubInfo}>
              <Text style={styles.eventDate}>BARRANQUILLA</Text>
              <Text style={styles.eventTitle}>Trucupey</Text>
              <Text style={styles.clubRating}>⭐ 4.8</Text>
            </View>
          </View>
        </ScrollView>
        
        {/* Espacio final */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* NAVEGACIÓN INFERIOR (MOCK) */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={[styles.navText, styles.navTextActive]}>🏠 Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>🔍 Explorar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>🔥 Connect</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>👤 Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020205',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerLogo: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  headerBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  statusBox: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    alignItems: 'center',
  },
  statusText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: 'bold',
  },
  heroSection: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  heroBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  heroBadgeText: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroSubtitle: {
    color: '#a855f7',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroDesc: {
    color: '#a1a1aa',
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 24,
    lineHeight: 18,
  },
  heroActions: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionOverline: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 4,
  },
  sectionTitleText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  seeAllText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    height: 120,
    justifyContent: 'space-between',
  },
  cardEmoji: {
    fontSize: 24,
  },
  cardSubtitle: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  horizontalScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  eventCard: {
    width: 260,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    marginRight: 16,
  },
  placeholderImage: {
    width: '100%',
    height: 140,
  },
  eventInfo: {
    padding: 16,
  },
  eventDate: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  eventTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  eventPrice: {
    color: '#34d399',
    fontSize: 14,
    fontWeight: '900',
  },
  clubCard: {
    width: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    marginRight: 16,
  },
  clubInfo: {
    padding: 16,
  },
  clubRating: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#05050A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  navText: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '600',
  },
  navTextActive: {
    color: '#fff',
    fontWeight: '900',
  }
});
