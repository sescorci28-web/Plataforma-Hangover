import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ServicesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerLogo}>SERVICIOS</Text>
        <View style={styles.spacer} />
      </View>
      <View style={styles.content}>
        <Sparkles size={48} color="#c084fc" style={{ marginBottom: 16 }} />
        <Text style={styles.title}>Servicios Exclusivos</Text>
        <Text style={styles.subtitle}>Contrata DJs, sonido, iluminación y más para tus fiestas privadas. Muy pronto.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020205' },
  header: { 
    flexDirection: 'row',
    paddingHorizontal: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.05)', 
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  spacer: {
    width: 32,
  },
  headerLogo: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  subtitle: { color: '#a1a1aa', fontSize: 14, textAlign: 'center', lineHeight: 22 }
});
