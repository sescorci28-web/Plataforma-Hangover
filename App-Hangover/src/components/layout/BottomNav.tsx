import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Home, Map, Users, User } from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/')}>
        <Home size={24} color={pathname === '/' ? '#fff' : '#71717a'} />
        <Text style={[styles.navText, pathname === '/' && styles.navTextActive]}>Inicio</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/explore')}>
        <Map size={24} color={pathname === '/explore' ? '#fff' : '#71717a'} />
        <Text style={[styles.navText, pathname === '/explore' && styles.navTextActive]}>Explorar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/connect' as any)}>
        <Users size={24} color={pathname === '/connect' ? '#fff' : '#71717a'} />
        <Text style={[styles.navText, pathname === '/connect' && styles.navTextActive]}>Connect</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/profile' as any)}>
        <User size={24} color={pathname === '/profile' ? '#fff' : '#71717a'} />
        <Text style={[styles.navText, pathname === '/profile' && styles.navTextActive]}>Perfil</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#05050A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 4,
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
