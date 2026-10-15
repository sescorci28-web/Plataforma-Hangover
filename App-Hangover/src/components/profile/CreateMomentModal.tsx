import React, { useState } from 'react';
import { 
  Modal, View, Text, StyleSheet, TouchableOpacity, Image, 
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  X, Camera, Video, Image as ImageIcon, Film, 
  Sparkles, ArrowLeft, Check, AlertCircle 
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { showAlert } from '@/utils/alert';

interface CreateMomentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmitMoment: (type: 'image' | 'video', uri: string, caption?: string) => Promise<void>;
}

export function CreateMomentModal({
  visible,
  onClose,
  onSubmitMoment,
}: CreateMomentModalProps) {
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setSelectedUri(null);
    setSelectedType('image');
    setCaption('');
    setSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 1. Pick Image from Gallery
  const handlePickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showAlert('Permiso Requerido', 'Necesitamos acceso a la galería para subir tu momento.');
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setSelectedUri(res.assets[0].uri);
        setSelectedType('image');
      }
    } catch (err: any) {
      showAlert('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  // 2. Pick Video from Gallery
  const handlePickVideo = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showAlert('Permiso Requerido', 'Necesitamos acceso a la galería para subir tu vídeo.');
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setSelectedUri(res.assets[0].uri);
        setSelectedType('video');
      }
    } catch (err: any) {
      showAlert('Error', 'No se pudo seleccionar el vídeo.');
    }
  };

  // 3. Take Photo with Camera
  const handleTakePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        showAlert('Permiso Requerido', 'Necesitamos acceso a la cámara para tomar fotos.');
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setSelectedUri(res.assets[0].uri);
        setSelectedType('image');
      }
    } catch (err: any) {
      showAlert('Error', 'No se pudo tomar la foto con la cámara.');
    }
  };

  // 4. Record Video with Camera
  const handleRecordVideo = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        showAlert('Permiso Requerido', 'Necesitamos acceso a la cámara para grabar vídeos.');
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setSelectedUri(res.assets[0].uri);
        setSelectedType('video');
      }
    } catch (err: any) {
      showAlert('Error', 'No se pudo grabar el vídeo con la cámara.');
    }
  };

  // Submit Handler
  const handlePublish = async () => {
    if (!selectedUri) {
      showAlert('Selecciona un archivo', 'Selecciona o captura una foto o vídeo primero.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitMoment(selectedType, selectedUri, caption);
      resetForm();
      onClose();
    } catch (err: any) {
      showAlert('Error', 'No se pudo publicar el momento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity 
          style={styles.backdropTouchable} 
          activeOpacity={1} 
          onPress={handleClose} 
        />

        <View style={styles.sheetContainer}>
          {/* BARRA SUPERIOR */}
          <View style={styles.sheetHeader}>
            {selectedUri ? (
              <TouchableOpacity onPress={() => setSelectedUri(null)} style={styles.iconHeaderBtn}>
                <ArrowLeft size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <View style={styles.headerTitleBox}>
                <Sparkles size={18} color="#F900BF" style={{ marginRight: 6 }} />
                <Text style={styles.sheetTitle}>Nuevo Momento</Text>
              </View>
            )}

            {selectedUri && (
              <Text style={styles.sheetTitle}>Publicar Momento</Text>
            )}

            <TouchableOpacity onPress={handleClose} style={styles.iconHeaderBtn}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {!selectedUri ? (
            /* PASO 1: SELECCIÓN DE TIPO Y FUENTE (FOTO / VÍDEO) */
            <View style={styles.optionsContainer}>
              <Text style={styles.subtitleText}>
                Sube fotos o vídeos de tus mejores noches en Hangover ✨
              </Text>

              <View style={styles.optionsGrid}>
                {/* 1. FOTO DE GALERÍA */}
                <TouchableOpacity 
                  style={styles.optionCard} 
                  onPress={handlePickImage}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['rgba(153, 0, 240, 0.2)', 'rgba(249, 0, 191, 0.1)']}
                    style={styles.optionCardGradient}
                  >
                    <View style={[styles.optionIconCircle, { backgroundColor: 'rgba(249, 0, 191, 0.2)' }]}>
                      <ImageIcon size={26} color="#F900BF" />
                    </View>
                    <Text style={styles.optionTitle}>Foto de Galería</Text>
                    <Text style={styles.optionDesc}>Selecciona una imagen de tu carrete</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* 2. VÍDEO DE GALERÍA */}
                <TouchableOpacity 
                  style={styles.optionCard} 
                  onPress={handlePickVideo}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['rgba(71, 0, 216, 0.2)', 'rgba(153, 0, 240, 0.1)']}
                    style={styles.optionCardGradient}
                  >
                    <View style={[styles.optionIconCircle, { backgroundColor: 'rgba(153, 0, 240, 0.2)' }]}>
                      <Film size={26} color="#9900F0" />
                    </View>
                    <Text style={styles.optionTitle}>Vídeo de Galería</Text>
                    <Text style={styles.optionDesc}>Sube clips o reels de tu galería</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* 3. TOMAR FOTO CON CÁMARA */}
                <TouchableOpacity 
                  style={styles.optionCard} 
                  onPress={handleTakePhoto}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['rgba(249, 0, 191, 0.2)', 'rgba(71, 0, 216, 0.1)']}
                    style={styles.optionCardGradient}
                  >
                    <View style={[styles.optionIconCircle, { backgroundColor: 'rgba(255, 133, 179, 0.2)' }]}>
                      <Camera size={26} color="#FF85B3" />
                    </View>
                    <Text style={styles.optionTitle}>Tomar Foto</Text>
                    <Text style={styles.optionDesc}>Captura el momento ahora mismo</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* 4. GRABAR VÍDEO CON CÁMARA */}
                <TouchableOpacity 
                  style={styles.optionCard} 
                  onPress={handleRecordVideo}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['rgba(153, 0, 240, 0.2)', 'rgba(71, 0, 216, 0.15)']}
                    style={styles.optionCardGradient}
                  >
                    <View style={[styles.optionIconCircle, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
                      <Video size={26} color="#A855F7" />
                    </View>
                    <Text style={styles.optionTitle}>Grabar Vídeo</Text>
                    <Text style={styles.optionDesc}>Graba en vivo tus mejores clips</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* PASO 2: PREVISTA Y PUBLICAR MOMENTO */
            <ScrollView 
              contentContainerStyle={styles.previewContainer}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.mediaPreviewFrame}>
                {selectedType === 'image' ? (
                  <Image source={{ uri: selectedUri }} style={styles.previewMedia} resizeMode="cover" />
                ) : (
                  <View style={styles.videoPreviewPlaceholder}>
                    <Film size={48} color="#9900F0" style={{ marginBottom: 10 }} />
                    <Text style={styles.videoBadgeText}>Vídeo Seleccionado</Text>
                    <Text style={styles.videoBadgeSub}>Listo para publicar</Text>
                  </View>
                )}

                <View style={styles.typeBadgeTag}>
                  {selectedType === 'image' ? (
                    <ImageIcon size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                  ) : (
                    <Film size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                  )}
                  <Text style={styles.typeBadgeTagText}>
                    {selectedType === 'image' ? 'Foto' : 'Vídeo'}
                  </Text>
                </View>
              </View>

              <Text style={styles.fieldLabel}>Escribe un comentario o descripción (opcional)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.captionInput}
                  placeholder="¿Qué tal la noche en Hangover? ✨"
                  placeholderTextColor="#64748b"
                  value={caption}
                  onChangeText={setCaption}
                  multiline={true}
                  numberOfLines={2}
                  maxLength={120}
                />
              </View>

              <TouchableOpacity
                style={styles.publishTouch}
                activeOpacity={0.85}
                onPress={handlePublish}
                disabled={submitting}
              >
                <LinearGradient
                  colors={['#4700D8', '#9900F0', '#F900BF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.publishGradient}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.publishText}>Publicar en Mis momentos</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 2, 14, 0.85)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#0F0921',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderColor: 'rgba(153, 0, 240, 0.3)',
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 34,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  iconHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsContainer: {
    gap: 16,
  },
  subtitleText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 4,
  },
  optionsGrid: {
    gap: 12,
  },
  optionCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(153, 0, 240, 0.25)',
  },
  optionCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  optionIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  optionDesc: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  previewContainer: {
    gap: 16,
    paddingBottom: 10,
  },
  mediaPreviewFrame: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#05020E',
    borderWidth: 1,
    borderColor: 'rgba(249, 0, 191, 0.4)',
    position: 'relative',
  },
  previewMedia: {
    width: '100%',
    height: '100%',
  },
  videoPreviewPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(71, 0, 216, 0.15)',
  },
  videoBadgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  videoBadgeSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  typeBadgeTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 2, 14, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  fieldLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  inputWrapper: {
    backgroundColor: '#05020E',
    borderColor: 'rgba(153, 0, 240, 0.3)',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  captionInput: {
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  publishTouch: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
  },
  publishGradient: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  publishText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
