import * as SecureStore from 'expo-secure-store';

export interface UserMoment {
  id: string;
  type: 'image' | 'video';
  uri: string;
  caption?: string;
  createdAt: string;
  isCustom?: boolean;
}

const STORAGE_KEY_PREFIX = 'hangover_moments_v1_';

export const momentsService = {
  /**
   * Obtiene los momentos del usuario almacenados localmente.
   */
  async getMoments(userId: string): Promise<UserMoment[]> {
    try {
      const key = `${STORAGE_KEY_PREFIX}${userId}`;
      const json = await SecureStore.getItemAsync(key);
      if (json) {
        const saved: UserMoment[] = JSON.parse(json);
        if (Array.isArray(saved)) {
          return saved;
        }
      }
    } catch (err) {
      console.warn('Error al leer momentos de SecureStore:', err);
    }
    return [];
  },

  /**
   * Agrega un nuevo momento (foto o vídeo) al listado del usuario.
   */
  async addMoment(
    userId: string, 
    newMomentData: { type: 'image' | 'video'; uri: string; caption?: string }
  ): Promise<UserMoment> {
    const current = await this.getMoments(userId);

    const newMoment: UserMoment = {
      id: `moment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: newMomentData.type,
      uri: newMomentData.uri,
      caption: newMomentData.caption?.trim() || undefined,
      createdAt: new Date().toISOString(),
      isCustom: true,
    };

    const updated = [newMoment, ...current];

    try {
      const key = `${STORAGE_KEY_PREFIX}${userId}`;
      await SecureStore.setItemAsync(key, JSON.stringify(updated));
    } catch (err) {
      console.warn('Error al guardar momento en SecureStore:', err);
    }

    return newMoment;
  },

  /**
   * Elimina un momento por su ID.
   */
  async deleteMoment(userId: string, momentId: string): Promise<UserMoment[]> {
    const current = await this.getMoments(userId);
    const updated = current.filter(m => m.id !== momentId);

    try {
      const key = `${STORAGE_KEY_PREFIX}${userId}`;
      await SecureStore.setItemAsync(key, JSON.stringify(updated));
    } catch (err) {
      console.warn('Error al eliminar momento de SecureStore:', err);
    }

    return updated;
  },
};
