import { supabase } from './supabase';
import Constants from 'expo-constants';

/**
 * Función de prueba mínima no destructiva de conectividad con Supabase.
 * Comprueba la disponibilidad del servicio Auth sin modificar datos ni tablas.
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const url =
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
      Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL;
    const anonKey =
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
      Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      const msg = '[Supabase] Advertencia: Las variables de entorno EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY están vacías o no fueron cargadas.';
      console.warn(msg);
      return { success: false, message: msg };
    }

    // Consulta de lectura no destructiva al servicio Auth
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      const errorMsg = `[Supabase] Error de conexión: ${error.message}`;
      console.error(errorMsg);
      return { success: false, message: errorMsg };
    }

    const successMsg = '[Supabase] Conexión exitosa. Servicio Auth respondiendo correctamente.';
    console.log(successMsg);
    return { success: true, message: successMsg };
  } catch (err: any) {
    const catchMsg = `[Supabase] Error de conexión: ${err?.message || 'Error desconocido de red o servidor'}`;
    console.error(catchMsg);
    return { success: false, message: catchMsg };
  }
}
