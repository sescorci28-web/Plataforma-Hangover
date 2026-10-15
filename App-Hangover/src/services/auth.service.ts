import { supabase } from '@/lib/supabase';
import * as SecureStore from 'expo-secure-store';

export type AccountType = 'user' | 'event_organizer' | 'club' | 'service_provider';

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  username: string;
  birthDate: string; // Formato YYYY-MM-DD
  gender: string;
  accountType: AccountType;
  phone: string;
  country: string;
  city: string;
}

export interface UserProfile {
  id: string;
  role: 'user' | 'provider' | 'admin';
  provider_type: 'club' | 'event_organizer' | 'service_provider' | null;
  onboarding_completed: boolean;
  full_name: string | null;
  username?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  avatar_url: string | null;
  phone: string | null;
  country?: string | null;
  city: string | null;
  bio?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  twitter?: string | null;
  website?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateProfileParams {
  fullName: string;
  username: string;
  birthDate: string; // Formato YYYY-MM-DD
  gender: string;
  phone: string;
  country: string;
  city: string;
  avatarUrl?: string | null;
  bio?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  twitter?: string | null;
  website?: string | null;
}

/**
 * Convierte el tipo de cuenta seleccionado en la app al par (role, provider_type) de Supabase.
 */
export function mapAccountTypeToRoles(accountType: AccountType): {
  role: 'user' | 'provider';
  provider_type: 'club' | 'event_organizer' | 'service_provider' | null;
} {
  switch (accountType) {
    case 'event_organizer':
      return { role: 'provider', provider_type: 'event_organizer' };
    case 'club':
      return { role: 'provider', provider_type: 'club' };
    case 'service_provider':
      return { role: 'provider', provider_type: 'service_provider' };
    case 'user':
    default:
      return { role: 'user', provider_type: null };
  }
}

/**
 * Convierte los códigos de error técnicos de Supabase / PostgREST en mensajes claros para el usuario final.
 */

export function translateAuthError(error: any): string {
  if (!error) return 'Ocurrió un error inesperado.';

  const message = (typeof error === 'string' ? error : error?.message || '').toLowerCase();
  const code = error?.code || error?.status;

  if (message.includes('user already registered') || message.includes('already exists')) {
    return 'Este correo electrónico ya está registrado. Intenta iniciar sesión.';
  }
  if (message.includes('invalid login credentials') || message.includes('invalid_credentials')) {
    return 'Correo electrónico o contraseña incorrectos.';
  }
  if (message.includes('email not confirmed')) {
    return 'Tu correo electrónico aún no ha sido confirmado. Por favor revisa tu bandeja de entrada.';
  }
  if (message.includes('password should be at least') || message.includes('password is too short')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (message.includes('row-level security') || code === '42501') {
    return 'Revisa tu correo electrónico para confirmar tu cuenta y habilitar el perfil.';
  }
  if (message.includes('unique constraint') || message.includes('idx_profiles_username') || message.includes('profiles_username_key')) {
    return 'Este nombre de usuario ya está en uso.';
  }
  if (message.includes('network') || message.includes('fetch failed')) {
    return 'No pudimos actualizar tu perfil. Revisa tu conexión e inténtalo nuevamente.';
  }
  if (message.includes('jwt expired') || message.includes('session expired') || message.includes('auth session missing')) {
    return 'Tu sesión ha expirado. Inicia sesión nuevamente.';
  }

  return typeof error === 'string' ? error : error.message || 'Error al procesar la solicitud.';
}

/**
 * Servicio Centralizado de Autenticación y Gestión de Perfiles para App-Hangover
 */
export const authService = {
  /**
   * Comprueba la disponibilidad del nombre de usuario de forma insensible a mayúsculas/minúsculas.
   * Si se provee currentUserId, ignora el registro del usuario actual (permite conservar su username).
   */
  async checkUsernameAvailability(username: string, currentUserId?: string): Promise<{ available: boolean; error: string | null }> {
    try {
      const cleanUsername = username.trim().toLowerCase();
      if (!cleanUsername || cleanUsername.length < 3) {
        return { available: false, error: 'El nombre de usuario debe tener al menos 3 caracteres.' };
      }

      let query = supabase
        .from('profiles')
        .select('id')
        .ilike('username', cleanUsername);

      if (currentUserId) {
        query = query.neq('id', currentUserId);
      }

      const { data, error } = await query.maybeSingle();

      if (error && error.code !== 'PGRST116') {
        return { available: false, error: translateAuthError(error) };
      }

      return { available: !data, error: null };
    } catch (err: any) {
      return { available: false, error: translateAuthError(err) };
    }
  },

  /**
   * Registro exclusivo de nuevo usuario con los 10 campos requeridos.
   */
  async signUp(params: SignUpParams): Promise<{ user: any; profile: UserProfile | null; requiresEmailConfirmation?: boolean; error: string | null }> {
    try {
      const { role, provider_type } = mapAccountTypeToRoles(params.accountType);
      const cleanUsername = params.username.trim().toLowerCase();

      // 1. Verificar disponibilidad de username antes de intentar el registro
      const { available, error: availabilityError } = await this.checkUsernameAvailability(cleanUsername);
      if (!available) {
        return { user: null, profile: null, error: availabilityError || 'Este nombre de usuario ya está en uso.' };
      }

      // 2. Crear usuario en Supabase Auth con metadata completa para el trigger de base de datos
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: params.email.trim(),
        password: params.password,
        options: {
          data: {
            full_name: params.fullName.trim(),
            username: cleanUsername,
            role,
            provider_type,
            birth_date: params.birthDate,
            gender: params.gender,
            phone: params.phone.trim(),
            country: params.country.trim(),
            city: params.city.trim(),
          },
        },
      });

      if (authError) {
        return { user: null, profile: null, error: translateAuthError(authError) };
      }

      const user = authData.user;
      if (!user) {
        return { user: null, profile: null, error: 'No se pudo generar la cuenta de usuario.' };
      }

      const profileData: UserProfile = {
        id: user.id,
        role,
        provider_type,
        onboarding_completed: true,
        full_name: params.fullName.trim(),
        username: cleanUsername,
        birth_date: params.birthDate,
        gender: params.gender,
        avatar_url: null,
        phone: params.phone.trim(),
        country: params.country.trim(),
        city: params.city.trim(),
      };

      // Si Supabase requiere confirmación de email (session es null), no intentamos upsert directo desde el cliente
      // para evitar bloqueos por RLS cuando auth.uid() es null.
      const requiresConfirmation = !authData.session;

      if (!requiresConfirmation) {
        // Intentar upsert explícito de respaldo desde el cliente
        const { data: insertedProfile, error: profileError } = await supabase
          .from('profiles')
          .upsert(profileData)
          .select()
          .single();

        if (!profileError && insertedProfile) {
          return { user, profile: insertedProfile as UserProfile, requiresEmailConfirmation: false, error: null };
        }
      }

      return { user, profile: profileData, requiresEmailConfirmation: requiresConfirmation, error: null };
    } catch (err: any) {
      return { user: null, profile: null, error: translateAuthError(err) };
    }
  },

  /**
   * Inicio de sesión con Email y Contraseña.
   */
  async signIn(email: string, password: string): Promise<{ session: any; profile: UserProfile | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { session: null, profile: null, error: translateAuthError(error) };
      }

      // Obtener perfil del usuario tras login exitoso
      const profileResult = await this.getCurrentProfile(data.user.id);
      return { session: data.session, profile: profileResult.profile, error: null };
    } catch (err: any) {
      return { session: null, profile: null, error: translateAuthError(err) };
    }
  },

  /**
   * Obtiene el perfil actual desde public.profiles por ID de usuario.
   */
  async getCurrentProfile(userId?: string): Promise<{ profile: UserProfile | null; error: string | null }> {
    try {
      let targetId = userId;
      let userAuthData: any = null;

      const { data: { user } } = await supabase.auth.getUser();
      if (user && (!targetId || targetId === user.id)) {
        targetId = user.id;
        userAuthData = user;
      }

      if (!targetId) {
        return { profile: null, error: 'No hay usuario autenticado.' };
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single();

      if (error && !data) {
        return { profile: null, error: translateAuthError(error) };
      }

      const profile = (data || { id: targetId }) as UserProfile;

      // Leer campos extendidos (bio, redes sociales) desde SecureStore local y user_metadata
      let extraData: any = {};
      try {
        const key = `hangover_profile_extra_${targetId}`;
        const stored = await SecureStore.getItemAsync(key);
        if (stored) {
          extraData = JSON.parse(stored);
        }
      } catch (e) {
        // Ignorar lectura local
      }

      const userMetadata = userAuthData?.user_metadata || {};

      profile.bio = profile.bio || extraData.bio || userMetadata.bio || null;
      profile.instagram = profile.instagram || extraData.instagram || userMetadata.instagram || null;
      profile.tiktok = profile.tiktok || extraData.tiktok || userMetadata.tiktok || null;
      profile.twitter = profile.twitter || extraData.twitter || userMetadata.twitter || null;
      profile.website = profile.website || extraData.website || userMetadata.website || null;

      return { profile, error: null };
    } catch (err: any) {
      return { profile: null, error: translateAuthError(err) };
    }
  },

  /**
   * Actualiza los datos del perfil del usuario autenticado en public.profiles.
   * Respeta estrictamente los campos editables y no modifica roles, provider_type ni IDs.
   */
  async updateProfile(userId: string, params: UpdateProfileParams): Promise<{ profile: UserProfile | null; error: string | null }> {
    try {
      if (!userId) {
        return { profile: null, error: 'Tu sesión ha expirado. Inicia sesión nuevamente.' };
      }

      const cleanUsername = params.username.trim().toLowerCase();

      // 1. Validar disponibilidad de username excluyendo al usuario actual
      const { available, error: availabilityError } = await this.checkUsernameAvailability(cleanUsername, userId);
      if (!available) {
        return { profile: null, error: availabilityError || 'Este nombre de usuario ya está en uso.' };
      }

      const extraObj = {
        bio: params.bio ? params.bio.trim() : null,
        instagram: params.instagram ? params.instagram.trim() : null,
        tiktok: params.tiktok ? params.tiktok.trim() : null,
        twitter: params.twitter ? params.twitter.trim() : null,
        website: params.website ? params.website.trim() : null,
      };

      // 2. Guardar datos extendidos en SecureStore local
      try {
        const key = `hangover_profile_extra_${userId}`;
        await SecureStore.setItemAsync(key, JSON.stringify(extraObj));
      } catch (e) {
        console.warn('Error al guardar datos extendidos de perfil en SecureStore:', e);
      }

      // 3. Guardar datos extendidos en Supabase Auth user_metadata
      try {
        await supabase.auth.updateUser({
          data: extraObj,
        });
      } catch (e) {
        console.warn('Error al actualizar user_metadata:', e);
      }

      // 4. Construir objeto de actualización para public.profiles
      const updatePayload: Record<string, any> = {
        full_name: params.fullName.trim(),
        username: cleanUsername,
        birth_date: params.birthDate,
        gender: params.gender,
        phone: params.phone.trim(),
        country: params.country.trim(),
        city: params.city.trim(),
        avatar_url: params.avatarUrl ? params.avatarUrl.trim() : null,
        updated_at: new Date().toISOString(),
      };

      if (params.bio !== undefined) updatePayload.bio = extraObj.bio;
      if (params.instagram !== undefined) updatePayload.social_instagram = extraObj.instagram;
      if (params.tiktok !== undefined) updatePayload.social_tiktok = extraObj.tiktok;

      let { data, error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId)
        .select()
        .single();

      // Si la tabla no tiene las columnas adicionales de redes, intentar actualizar al menos los campos estándar incluyendo bio
      if (error && (error.message.includes('column') || error.code === 'PGRST204')) {
        const fallbackPayload = {
          full_name: params.fullName.trim(),
          username: cleanUsername,
          birth_date: params.birthDate,
          gender: params.gender,
          phone: params.phone.trim(),
          country: params.country.trim(),
          city: params.city.trim(),
          avatar_url: params.avatarUrl ? params.avatarUrl.trim() : null,
          bio: extraObj.bio,
          updated_at: new Date().toISOString(),
        };
        const retry = await supabase
          .from('profiles')
          .update(fallbackPayload)
          .eq('id', userId)
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        return { profile: null, error: translateAuthError(error) };
      }

      const resProfile = (data || { id: userId }) as UserProfile;
      resProfile.bio = extraObj.bio;
      resProfile.instagram = extraObj.instagram;
      resProfile.tiktok = extraObj.tiktok;
      resProfile.twitter = extraObj.twitter;
      resProfile.website = extraObj.website;

      return { profile: resProfile, error: null };
    } catch (err: any) {
      return { profile: null, error: translateAuthError(err) };
    }
  },

  /**
   * Suba la imagen local seleccionada por el usuario al bucket 'avatars' de Supabase Storage
   * y devuelve su URL pública accesible desde cualquier dispositivo.
   */
  async uploadAvatarImage(userId: string, localUri: string): Promise<{ publicUrl: string | null; error: string | null }> {
    if (!localUri || localUri.trim() === '') {
      return { publicUrl: null, error: null };
    }

    // Si ya es una URL remota http/https, no requiere subirse de nuevo
    if (localUri.startsWith('http://') || localUri.startsWith('https://')) {
      return { publicUrl: localUri, error: null };
    }

    try {
      // 1. Obtener blob/bytes de la imagen local
      const response = await fetch(localUri);
      const blob = await response.blob();

      // 2. Extraer extensión del archivo
      const uriParts = localUri.split('.');
      const fileExt = uriParts.length > 1 ? uriParts[uriParts.length - 1].toLowerCase() : 'jpeg';
      const cleanExt = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExt) ? fileExt : 'jpeg';

      // 3. Crear nombre único dentro del bucket avatars alineado con la política RLS (foldername[1] = userId)
      const filePath = `${userId}/avatar_${Date.now()}.${cleanExt}`;

      console.log('AUTH USER DEBUG:', {
        userId: userId || null,
      });

      // 4. Subir a Supabase Storage (bucket avatars)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: `image/${cleanExt === 'jpg' ? 'jpeg' : cleanExt}`,
          upsert: true,
        });

      if (uploadError) {
        console.log('AVATAR UPLOAD ERROR:', {
          message: uploadError.message || null,
          status: (uploadError as any)?.status || (uploadError as any)?.statusCode || null,
          name: uploadError.name || null,
        });
        console.warn('Error en uploadAvatarImage:', uploadError.message);
        return { publicUrl: null, error: uploadError.message };
      }

      // 5. Obtener URL pública remota
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        return { publicUrl: null, error: 'No se pudo obtener la URL pública de la foto.' };
      }

      return { publicUrl: publicUrlData.publicUrl, error: null };
    } catch (err: any) {
      console.warn('Excepción en uploadAvatarImage:', err);
      return { publicUrl: null, error: err?.message || 'Error al procesar la subida de la imagen.' };
    }
  },

  /**
   * Cierra la sesión activa.
   */
  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error ? translateAuthError(error) : null };
    } catch (err: any) {
      return { error: translateAuthError(err) };
    }
  },
};

