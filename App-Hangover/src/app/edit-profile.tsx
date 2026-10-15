import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, 
  ScrollView, Modal, KeyboardAvoidingView, Platform, Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, User, AtSign, Calendar, Mail, Phone, MapPin, 
  Globe, ChevronDown, AlertCircle, CheckCircle2, UserCheck, X, Lock, Camera,
  FileText, Music2, Share2
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { authService, UserProfile } from '@/services/auth.service';
import { showAlert } from '@/utils/alert';

const GENDER_OPTIONS = [
  'Hombre',
  'Mujer',
  'No binario',
  'Otro',
  'Prefiero no decirlo',
];

const COUNTRY_OPTIONS = [
  { name: 'Colombia', code: '+57', flag: '🇨🇴', cities: ['Barranquilla', 'Bogotá', 'Medellín', 'Cali', 'Cartagena', 'Santa Marta', 'Bucaramanga', 'Pereira'] },
  { name: 'México', code: '+52', flag: '🇲🇽', cities: ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Cancún', 'Puebla'] },
  { name: 'Argentina', code: '+54', flag: '🇦🇷', cities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza'] },
  { name: 'Chile', code: '+56', flag: '🇨🇱', cities: ['Santiago', 'Valparaíso', 'Concepción'] },
  { name: 'Perú', code: '+51', flag: '🇵🇪', cities: ['Lima', 'Cusco', 'Arequipa', 'Trujillo'] },
  { name: 'España', code: '+34', flag: '🇪🇸', cities: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Ibiza'] },
  { name: 'Estados Unidos', code: '+1', flag: '🇺🇸', cities: ['Miami', 'New York', 'Los Angeles', 'Las Vegas', 'Orlando'] },
];

function calculateAge(day: number, month: number, year: number): number {
  const today = new Date();
  let age = today.getFullYear() - year;
  const m = (today.getMonth() + 1) - month;
  if (m < 0 || (m === 0 && today.getDate() < day)) {
    age--;
  }
  return age;
}

export default function EditProfileScreen() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [initialUsername, setInitialUsername] = useState('');
  const [email, setEmail] = useState('');

  // Birth Date
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');

  // Demographics
  const [gender, setGender] = useState('');
  const [selectedCountryObj, setSelectedCountryObj] = useState(COUNTRY_OPTIONS[0]);
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Bio & Social Networks
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [twitter, setTwitter] = useState('');

  // Dropdown Modals
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);

  // Username validation state
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ available: boolean | null; message: string | null }>({ available: null, message: null });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load User Data
  const loadUserData = useCallback(async () => {
    setInitialLoading(true);
    setErrorMessage(null);
    try {
      const { data: { user }, error: authUserErr } = await supabase.auth.getUser();

      if (authUserErr || !user) {
        showAlert('Sesión expirada', 'Tu sesión ha expirado. Inicia sesión nuevamente.', () => {
          router.replace('/login');
        });
        return;
      }

      setUserId(user.id);
      setEmail(user.email || '');

      const { profile, error: profileErr } = await authService.getCurrentProfile(user.id);

      if (profileErr) {
        setErrorMessage(profileErr);
      } else if (profile) {
        setFullName(profile.full_name || '');
        const currentUname = profile.username || '';
        setUsername(currentUname);
        setInitialUsername(currentUname);

        // Parse birth_date (YYYY-MM-DD)
        if (profile.birth_date) {
          const parts = profile.birth_date.split('T')[0].split('-');
          if (parts.length === 3) {
            setBirthYear(parts[0]);
            setBirthMonth(parts[1]);
            setBirthDay(parts[2]);
          }
        }

        setGender(profile.gender || '');
        setAvatarUrl(profile.avatar_url || '');

        // Bio & Social Networks
        setBio(profile.bio || '');
        setInstagram(profile.instagram || '');
        setTiktok(profile.tiktok || '');
        setTwitter(profile.twitter || '');

        // Match Country & City
        const userCountry = profile.country?.trim() || 'Colombia';
        const foundCountry = COUNTRY_OPTIONS.find(
          (c) => c.name.toLowerCase() === userCountry.toLowerCase()
        ) || COUNTRY_OPTIONS[0];

        setSelectedCountryObj(foundCountry);

        // Parse Phone
        const userPhone = profile.phone || '';
        // If phone includes country prefix like "+57 3001234567", strip prefix if possible
        const cleanedPhone = userPhone.replace(foundCountry.code, '').trim();
        setPhone(cleanedPhone || userPhone);

        setCity(profile.city?.trim() || foundCountry.cities[0] || '');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al cargar los datos del perfil.');
    } finally {
      setInitialLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Selección de foto de perfil desde la Galería
  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showAlert('Permiso Requerido', 'Necesitamos acceso a tu galería para cambiar tu foto de perfil.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUrl(result.assets[0].uri);
      }
    } catch (err: any) {
      showAlert('Error de Galería', 'No se pudo seleccionar la imagen de la galería.');
    }
  };

  // Username validation handler
  const handleCheckUsername = async (val: string) => {
    const clean = val.trim().toLowerCase();
    setUsername(val);

    if (!clean) {
      setUsernameStatus({ available: false, message: 'El nombre de usuario es obligatorio.' });
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(clean)) {
      setUsernameStatus({
        available: false,
        message: '3-20 caracteres (letras, números y _). Sin espacios.',
      });
      return;
    }

    // If unchanged from initial username, it's available for the user
    if (clean === initialUsername.toLowerCase()) {
      setUsernameStatus({ available: true, message: '✓ Tu nombre de usuario actual' });
      return;
    }

    setCheckingUsername(true);
    const { available, error } = await authService.checkUsernameAvailability(clean, userId || undefined);
    setCheckingUsername(false);

    if (error) {
      setUsernameStatus({ available: false, message: error });
    } else if (available) {
      setUsernameStatus({ available: true, message: '✓ Nombre de usuario disponible' });
    } else {
      setUsernameStatus({ available: false, message: 'Este nombre de usuario ya está en uso.' });
    }
  };

  // Submit Handler
  const handleSaveProfile = async () => {
    setErrorMessage(null);

    if (!userId) {
      showAlert('Error de Sesión', 'Tu sesión ha expirado. Inicia sesión nuevamente.');
      return;
    }

    // 1. Validaciones básicas
    if (
      !fullName.trim() ||
      !username.trim() ||
      !birthDay.trim() ||
      !birthMonth.trim() ||
      !birthYear.trim() ||
      !gender ||
      !selectedCountryObj.name ||
      !phone.trim() ||
      !city.trim()
    ) {
      showAlert('Campos Incompletos', 'Por favor completa todos los campos obligatorios.');
      return;
    }

    // 2. Validar Username
    const cleanUsername = username.trim().toLowerCase();
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(cleanUsername)) {
      showAlert('Nombre de usuario inválido', 'El username debe tener entre 3 y 20 caracteres sin espacios, usando solo letras, números y guion bajo.');
      return;
    }

    if (usernameStatus.available === false) {
      showAlert('Nombre de usuario ocupado', 'Este nombre de usuario ya está en uso.');
      return;
    }

    // 3. Validar Fecha de Nacimiento y Mayoría de Edad (>= 18)
    const d = parseInt(birthDay, 10);
    const m = parseInt(birthMonth, 10);
    const y = parseInt(birthYear, 10);

    if (isNaN(d) || isNaN(m) || isNaN(y) || d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > new Date().getFullYear()) {
      showAlert('Fecha de Nacimiento Inválida', 'Por favor ingresa un día, mes y año válidos (DD/MM/AAAA).');
      return;
    }

    const calculatedAge = calculateAge(d, m, y);
    if (calculatedAge < 18) {
      showAlert(
        'Modificación de Edad no permitida',
        'No puedes modificar tu fecha de nacimiento a una edad menor de 18 años.'
      );
      return;
    }

    const formattedBirthDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const formattedPhone = `${selectedCountryObj.code} ${phone.trim()}`;

    setSaving(true);

    let finalAvatarUrl: string | null = avatarUrl.trim() || null;

    // Si el usuario seleccionó una nueva foto local (file:// o content://), subirla a Supabase Storage
    if (finalAvatarUrl && (finalAvatarUrl.startsWith('file://') || finalAvatarUrl.startsWith('content://'))) {
      const { publicUrl, error: uploadErr } = await authService.uploadAvatarImage(userId, finalAvatarUrl);
      if (uploadErr) {
        showAlert('Error al subir foto', `No se pudo subir la foto a Supabase Storage: ${uploadErr}`);
        setSaving(false);
        return;
      }
      if (publicUrl) {
        finalAvatarUrl = publicUrl;
      }
    }

    const { profile: updatedProfile, error: updateErr } = await authService.updateProfile(userId, {
      fullName: fullName.trim(),
      username: cleanUsername,
      birthDate: formattedBirthDate,
      gender,
      phone: formattedPhone,
      country: selectedCountryObj.name,
      city: city.trim(),
      avatarUrl: finalAvatarUrl,
      bio: bio.trim() || null,
      instagram: instagram.trim() || null,
      tiktok: tiktok.trim() || null,
      twitter: twitter.trim() || null,
    });

    setSaving(false);

    if (updateErr) {
      showAlert('Error al guardar', updateErr);
      return;
    }

    showAlert(
      'Perfil Actualizado',
      'Perfil actualizado correctamente.',
      () => {
        router.back();
      }
    );
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#9900F0" />
          <Text style={styles.loadingText}>Cargando datos de perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* HEADER BAR CON BOTÓN DE REGRESO Y BOTÓN CANCELAR */}
        <View style={styles.headerBar}>
          <TouchableOpacity 
            style={styles.backButtonRound} 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>EDITAR PERFIL</Text>

          <TouchableOpacity 
            style={styles.cancelTextButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* BANNER DE ERROR SI OCURRE ALGUN FALLO */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <AlertCircle size={20} color="#ef4444" style={{ marginRight: 8 }} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* VISTA PREVIA Y CAMBIO DIRECTO DE AVATAR DESDE GALERÍA */}
          <View style={styles.avatarSection}>
            <TouchableOpacity 
              style={styles.avatarOuterFrame}
              onPress={handlePickImage}
              activeOpacity={0.8}
            >
              <View style={styles.avatarGradientBorder}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <User size={40} color="#94a3b8" />
                  </View>
                )}
              </View>

              {/* BOTÓN SUPERPUESTO DE CÁMARA */}
              <View style={styles.cameraBadgeButton}>
                <Camera size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.7} style={{ marginTop: 8 }}>
              <Text style={styles.changePhotoText}>Cambiar foto de perfil</Text>
            </TouchableOpacity>
          </View>

          {/* FORMULARIO DE EDICIÓN */}
          <View style={styles.formContainer}>
            {/* 1. NOMBRE COMPLETO */}
            <View style={styles.fieldWrapperGroup}>
              <Text style={styles.fieldLabel}>Nombre Completo</Text>
              <View style={styles.fieldWrapper}>
                <User size={18} color="#F900BF" style={styles.fieldIconLeft} />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Nombre completo"
                  placeholderTextColor="#64748b"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* 2. NOMBRE DE USUARIO */}
            <View style={styles.fieldWrapperGroup}>
              <Text style={styles.fieldLabel}>Nombre de Usuario (Username)</Text>
              <View style={styles.fieldWrapper}>
                <AtSign size={18} color="#F900BF" style={styles.fieldIconLeft} />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Username"
                  placeholderTextColor="#64748b"
                  value={username}
                  onChangeText={handleCheckUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {checkingUsername && <ActivityIndicator size="small" color="#F900BF" />}
              </View>
              {usernameStatus.message && (
                <Text style={[styles.statusText, usernameStatus.available ? styles.statusSuccess : styles.statusError]}>
                  {usernameStatus.message}
                </Text>
              )}
            </View>

            {/* 3. FECHA DE NACIMIENTO */}
            <View style={styles.fieldWrapperGroup}>
              <Text style={styles.fieldLabel}>Fecha de Nacimiento (Mayor de 18 años)</Text>
              <View style={styles.fieldWrapper}>
                <Calendar size={18} color="#F900BF" style={styles.fieldIconLeft} />
                <View style={styles.dateInputsInline}>
                  <TextInput
                    style={styles.dateSegmentInput}
                    placeholder="DD"
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={birthDay}
                    onChangeText={setBirthDay}
                  />
                  <Text style={styles.dateDivider}>/</Text>
                  <TextInput
                    style={styles.dateSegmentInput}
                    placeholder="MM"
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={birthMonth}
                    onChangeText={setBirthMonth}
                  />
                  <Text style={styles.dateDivider}>/</Text>
                  <TextInput
                    style={[styles.dateSegmentInput, { width: 55 }]}
                    placeholder="AAAA"
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                    maxLength={4}
                    value={birthYear}
                    onChangeText={setBirthYear}
                  />
                </View>
              </View>
            </View>

            {/* 4. CORREO ELECTRÓNICO (NO EDITABLE) */}
            <View style={styles.fieldWrapperGroup}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.fieldLabelNoMargin}>Correo Electrónico</Text>
                <Text style={styles.readOnlyBadge}>(No editable)</Text>
              </View>
              <View style={[styles.fieldWrapper, styles.fieldWrapperDisabled]}>
                <Mail size={18} color="#64748b" style={styles.fieldIconLeft} />
                <TextInput
                  style={[styles.fieldInput, styles.fieldInputDisabled]}
                  value={email}
                  editable={false}
                />
                <Lock size={16} color="#64748b" style={styles.fieldIconRight} />
              </View>
            </View>

            {/* 5. TELÉFONO */}
            <View style={styles.fieldWrapperGroup}>
              <Text style={styles.fieldLabel}>Número de Teléfono</Text>
              <View style={styles.fieldWrapperPhone}>
                <TouchableOpacity 
                  style={styles.phoneCountryPrefix} 
                  onPress={() => setShowCountryModal(true)}
                >
                  <Phone size={16} color="#F900BF" style={{ marginRight: 4 }} />
                  <Text style={styles.flagText}>{selectedCountryObj.flag}</Text>
                  <Text style={styles.prefixCodeText}>{selectedCountryObj.code}</Text>
                  <ChevronDown size={14} color="#64748b" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
                <View style={styles.phoneVerticalLine} />
                <TextInput
                  style={styles.phoneFieldInput}
                  placeholder="Teléfono"
                  placeholderTextColor="#64748b"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* 6. PAÍS */}
            <View style={styles.fieldWrapperGroup}>
              <Text style={styles.fieldLabel}>País</Text>
              <TouchableOpacity 
                style={styles.fieldWrapperSelector}
                onPress={() => setShowCountryModal(true)}
                activeOpacity={0.8}
              >
                <Globe size={18} color="#F900BF" style={styles.fieldIconLeft} />
                <Text style={selectedCountryObj.name ? styles.selectorTextActive : styles.selectorTextPlaceholder}>
                  {selectedCountryObj.name ? `${selectedCountryObj.flag} ${selectedCountryObj.name}` : 'Selecciona tu país'}
                </Text>
                <ChevronDown size={18} color="#64748b" style={styles.fieldIconRight} />
              </TouchableOpacity>
            </View>

            {/* 7. CIUDAD */}
            <View style={styles.fieldWrapperGroup}>
              <Text style={styles.fieldLabel}>Ciudad</Text>
              <TouchableOpacity 
                style={styles.fieldWrapperSelector}
                onPress={() => setShowCityModal(true)}
                activeOpacity={0.8}
              >
                <MapPin size={18} color="#F900BF" style={styles.fieldIconLeft} />
                <Text style={city ? styles.selectorTextActive : styles.selectorTextPlaceholder}>
                  {city || 'Selecciona tu ciudad'}
                </Text>
                <ChevronDown size={18} color="#64748b" style={styles.fieldIconRight} />
              </TouchableOpacity>
            </View>

            {/* 8. GÉNERO */}
            <View style={styles.fieldWrapperGroup}>
              <Text style={styles.fieldLabel}>Género</Text>
              <TouchableOpacity 
                style={styles.fieldWrapperSelector}
                onPress={() => setShowGenderModal(true)}
                activeOpacity={0.8}
              >
                <UserCheck size={18} color="#F900BF" style={styles.fieldIconLeft} />
                <Text style={gender ? styles.selectorTextActive : styles.selectorTextPlaceholder}>
                  {gender || 'Selecciona tu género'}
                </Text>
                <ChevronDown size={18} color="#64748b" style={styles.fieldIconRight} />
              </TouchableOpacity>
            </View>

            {/* 9. DESCRIPCIÓN DEL PERFIL (BIO) */}
            <View style={styles.fieldWrapperGroup}>
              <Text style={styles.fieldLabel}>Descripción de tu perfil (Bio)</Text>
              <View style={[styles.fieldWrapper, { height: 84, alignItems: 'flex-start', paddingTop: 12 }]}>
                <FileText size={18} color="#F900BF" style={[styles.fieldIconLeft, { marginTop: 2 }]} />
                <TextInput
                  style={[styles.fieldInput, { height: 60, textAlignVertical: 'top' }]}
                  placeholder="Buenas noches, mejores historias."
                  placeholderTextColor="#64748b"
                  value={bio}
                  onChangeText={setBio}
                  multiline={true}
                  numberOfLines={3}
                  maxLength={160}
                />
              </View>
            </View>

            {/* 10. REDES SOCIALES */}
            <View style={{ marginTop: 8, gap: 14 }}>
              <Text style={styles.socialSectionTitle}>Redes Sociales</Text>

              {/* INSTAGRAM */}
              <View style={styles.fieldWrapperGroup}>
                <Text style={styles.fieldLabel}>Instagram</Text>
                <View style={styles.fieldWrapper}>
                  <AtSign size={18} color="#F900BF" style={styles.fieldIconLeft} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="@tu_usuario_instagram"
                    placeholderTextColor="#64748b"
                    value={instagram}
                    onChangeText={setInstagram}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* TIKTOK */}
              <View style={styles.fieldWrapperGroup}>
                <Text style={styles.fieldLabel}>TikTok</Text>
                <View style={styles.fieldWrapper}>
                  <Music2 size={18} color="#A855F7" style={styles.fieldIconLeft} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="@tu_usuario_tiktok"
                    placeholderTextColor="#64748b"
                    value={tiktok}
                    onChangeText={setTiktok}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* TWITTER / X */}
              <View style={styles.fieldWrapperGroup}>
                <Text style={styles.fieldLabel}>Twitter / X</Text>
                <View style={styles.fieldWrapper}>
                  <Share2 size={18} color="#60a5fa" style={styles.fieldIconLeft} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="@tu_usuario_twitter"
                    placeholderTextColor="#64748b"
                    value={twitter}
                    onChangeText={setTwitter}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            </View>

            {/* BOTÓN GRADIENTE GUARDAR CAMBIOS */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSaveProfile}
              disabled={saving}
              style={styles.submitTouchWrapper}
            >
              <LinearGradient
                colors={['#4700D8', '#9900F0', '#F900BF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.gradientButtonText}>Guardar cambios</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* BOTÓN SECUNDARIO CANCELAR */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              style={styles.cancelSecondaryButton}
            >
              <Text style={styles.cancelSecondaryButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL SELECTOR DE GÉNERO */}
      <Modal visible={showGenderModal} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowGenderModal(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona tu Género</Text>
              <TouchableOpacity onPress={() => setShowGenderModal(false)}>
                <X size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            {GENDER_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.modalItem, gender === item && styles.modalItemSelected]}
                onPress={() => {
                  setGender(item);
                  setShowGenderModal(false);
                }}
              >
                <Text style={[styles.modalItemText, gender === item && styles.modalItemTextSelected]}>
                  {item}
                </Text>
                {gender === item && <CheckCircle2 size={18} color="#F900BF" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL SELECTOR DE PAÍS */}
      <Modal visible={showCountryModal} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowCountryModal(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona tu País</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <X size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 320 }}>
              {COUNTRY_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c.name}
                  style={[styles.modalItem, selectedCountryObj.name === c.name && styles.modalItemSelected]}
                  onPress={() => {
                    setSelectedCountryObj(c);
                    setCity(c.cities[0]);
                    setShowCountryModal(false);
                  }}
                >
                  <Text style={{ fontSize: 18, marginRight: 10 }}>{c.flag}</Text>
                  <Text style={[styles.modalItemText, selectedCountryObj.name === c.name && styles.modalItemTextSelected, { flex: 1 }]}>
                    {c.name} ({c.code})
                  </Text>
                  {selectedCountryObj.name === c.name && <CheckCircle2 size={18} color="#F900BF" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL SELECTOR DE CIUDAD */}
      <Modal visible={showCityModal} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowCityModal(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ciudades de {selectedCountryObj.name}</Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <X size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {selectedCountryObj.cities.map((ct) => (
                <TouchableOpacity
                  key={ct}
                  style={[styles.modalItem, city === ct && styles.modalItemSelected]}
                  onPress={() => {
                    setCity(ct);
                    setShowCityModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, city === ct && styles.modalItemTextSelected, { flex: 1 }]}>
                    📍 {ct}
                  </Text>
                  {city === ct && <CheckCircle2 size={18} color="#F900BF" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#05020E',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 14,
    fontWeight: '600',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButtonRound: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  cancelTextButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  cancelText: {
    color: '#FF85B3',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  errorBannerText: {
    flex: 1,
    color: '#ef4444',
    fontSize: 13,
    fontWeight: 'bold',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarOuterFrame: {
    position: 'relative',
    alignSelf: 'center',
  },
  avatarGradientBorder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#0F0921',
    borderWidth: 2,
    borderColor: '#9900F0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#0F0921',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadgeButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0F0921',
    borderColor: '#F900BF',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    color: '#FF85B3',
    fontSize: 13,
    fontWeight: '700',
  },
  formContainer: {
    gap: 16,
  },
  fieldWrapperGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 2,
  },
  socialSectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 6,
  },
  fieldLabelNoMargin: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 6,
  },
  readOnlyBadge: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  fieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0921',
    borderColor: 'rgba(153, 0, 240, 0.25)',
    borderWidth: 1,
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 16,
  },
  fieldWrapperDisabled: {
    backgroundColor: 'rgba(15, 9, 33, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  fieldWrapperSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0921',
    borderColor: 'rgba(153, 0, 240, 0.25)',
    borderWidth: 1,
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 16,
  },
  fieldWrapperPhone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0921',
    borderColor: 'rgba(153, 0, 240, 0.25)',
    borderWidth: 1,
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 14,
  },
  fieldIconLeft: {
    marginRight: 12,
  },
  fieldIconRight: {
    marginLeft: 8,
  },
  fieldInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  fieldInputDisabled: {
    color: '#64748b',
  },
  dateInputsInline: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateSegmentInput: {
    width: 36,
    color: '#FFFFFF',
    fontSize: 15,
    textAlign: 'center',
  },
  dateDivider: {
    color: '#64748b',
    fontSize: 16,
    marginHorizontal: 4,
  },
  selectorTextPlaceholder: {
    flex: 1,
    color: '#64748b',
    fontSize: 15,
  },
  selectorTextActive: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  phoneCountryPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagText: {
    fontSize: 16,
    marginRight: 4,
  },
  prefixCodeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  phoneVerticalLine: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: 12,
  },
  phoneFieldInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    marginLeft: 4,
  },
  statusSuccess: {
    color: '#34d399',
  },
  statusError: {
    color: '#ef4444',
  },
  submitTouchWrapper: {
    marginTop: 10,
  },
  gradientButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cancelSecondaryButton: {
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  cancelSecondaryButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 2, 14, 0.85)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0F0921',
    borderColor: 'rgba(153, 0, 240, 0.4)',
    borderTopWidth: 1.5,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  modalItemSelected: {
    backgroundColor: 'rgba(153, 0, 240, 0.15)',
  },
  modalItemText: {
    color: '#cbd5e1',
    fontSize: 15,
    fontWeight: '600',
  },
  modalItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
