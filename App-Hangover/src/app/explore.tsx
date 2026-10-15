import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Map } from 'lucide-react-native';
import { BottomNav } from '@/components/layout/BottomNav';

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerLogo}>EXPLORAR</Text>
      </View>
      <View style={styles.content}>
        <Map size={48} color="#a855f7" style={{ marginBottom: 16 }} />
        <Text style={styles.title}>Mapa y Exploración</Text>
        <Text style={styles.subtitle}>Encuentra las mejores zonas de fiesta cerca de ti. Muy pronto.</Text>
      </View>
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020205' },
  header: { 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.05)', 
    alignItems: 'center',
    paddingVertical: 16,
  },
  headerLogo: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  subtitle: { color: '#a1a1aa', fontSize: 14, textAlign: 'center', lineHeight: 22 }
});
