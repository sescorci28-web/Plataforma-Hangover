import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ADAPTADOR DE ALMACENAMIENTO SEGURO MULTIPLATAFORMA (SECURE STORE EN NATIVO / LOCAL STORAGE EN WEB)
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        return Promise.resolve(localStorage.getItem(key));
      }
      return Promise.resolve(null);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL ||
  '';

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  '';

// LOG SEGURO DE VERIFICACIÓN DE CONFIGURACIÓN (REGLA: NO EXPONER KEY COMPLETA)
const maskedKey = supabaseAnonKey && supabaseAnonKey.length > 10
  ? `${supabaseAnonKey.slice(0, 6)}...${supabaseAnonKey.slice(-4)}`
  : supabaseAnonKey ? 'configurada' : 'no configurada';

console.log('[SUPABASE CONFIG] URL:', supabaseUrl || 'undefined');
console.log('[SUPABASE CONFIG] Key:', maskedKey);

// VALIDACIÓN CLARA DE VARIABLES DE ENTORNO
if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey.trim() === '') {
  console.warn(
    '[Supabase Error] Las variables EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY no están configuradas. Por favor verifica App-Hangover/.env y eas.json.'
  );
}

// CLIENTE OFICIAL CENTRALIZADO DE SUPABASE PARA APP-HANGOVER
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
