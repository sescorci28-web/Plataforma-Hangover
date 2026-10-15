import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, 
  ScrollView, Modal, KeyboardAvoidingView, Platform, Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, User, AtSign, Calendar, Mail, Lock, Phone, MapPin, 
  Globe, Eye, EyeOff, ChevronDown, CheckSquare, Square, AlertCircle, CheckCircle2, UserCheck, X 
} from 'lucide-react-native';
import { authService } from '@/services/auth.service';
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

export default function RegisterScreen() {
  const router = useRouter();

  // 10 Campos Obligatorios
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  
  // Fecha de nacimiento
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [selectedCountryObj, setSelectedCountryObj] = useState(COUNTRY_OPTIONS[0]);
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState(COUNTRY_OPTIONS[0].cities[0]);

  // Contraseñas visibles/ocultas
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Modales de Selección (Dropdowns)
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);

  // Checkboxes
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  // Disponibilidad de Username y Estado de Carga
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ available: boolean | null; message: string | null }>({ available: null, message: null });
  const [loading, setLoading] = useState(false);
  const [underageError, setUnderageError] = useState(false);

  // Comprobar disponibilidad de username
  const handleCheckUsername = async (val: string) => {
    const clean = val.trim().toLowerCase();
    setUsername(val);
    if (!clean) {
      setUsernameStatus({ available: null, message: null });
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

    setCheckingUsername(true);
    const { available, error } = await authService.checkUsernameAvailability(clean);
    setCheckingUsername(false);

    if (error) {
      setUsernameStatus({ available: false, message: error });
    } else if (available) {
      setUsernameStatus({ available: true, message: '✓ Nombre de usuario disponible' });
    } else {
      setUsernameStatus({ available: false, message: '✕ Este nombre de usuario ya está en uso' });
    }
  };

  // Calcular edad exacta
  const calculateAge = (day: number, month: number, year: number): number => {
    const today = new Date();
    let age = today.getFullYear() - year;
    const m = (today.getMonth() + 1) - month;
    if (m < 0 || (m === 0 && today.getDate() < day)) {
      age--;
    }
    return age;
  };

  const handleRegister = async () => {
    setUnderageError(false);

    // 1. Validaciones requeridas
    if (
      !fullName.trim() ||
      !username.trim() ||
      !birthDay.trim() ||
      !birthMonth.trim() ||
      !birthYear.trim() ||
      !gender ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim() ||
      !selectedCountryObj.name ||
      !phone.trim() ||
      !city.trim()
    ) {
      showAlert('Campos Incompletos', 'Todos los campos marcados son obligatorios para registrarte.');
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
      showAlert('Nombre de usuario ocupado', 'Este nombre de usuario ya está en uso. Por favor elige otro.');
      return;
    }

    // 3. Validar Edad >= 18 años estrictamente
    const d = parseInt(birthDay, 10);
    const m = parseInt(birthMonth, 10);
    const y = parseInt(birthYear, 10);

    if (isNaN(d) || isNaN(m) || isNaN(y) || d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > new Date().getFullYear()) {
      showAlert('Fecha de Nacimiento Inválida', 'Por favor ingresa un día, mes y año válidos (DD/MM/AAAA).');
      return;
    }

    const calculatedAge = calculateAge(d, m, y);
    if (calculatedAge < 18) {
      setUnderageError(true);
      showAlert(
        'Acceso Denegado (Menor de Edad)',
        'Hangover es una plataforma exclusiva para mayores de 18 años.'
      );
      return;
    }

    // 4. Validar Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showAlert('Correo electrónico inválido', 'Por favor ingresa una dirección de correo válida.');
      return;
    }

    // 5. Validar Contraseña
    if (password.length < 6) {
      showAlert('Contraseña corta', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Las contraseñas no coinciden', 'La contraseña y la confirmación deben ser exactamente iguales.');
      return;
    }

    // 6. Validar Términos y Privacidad
    if (!acceptTerms || !acceptPrivacy) {
      showAlert('Aceptación Requerida', 'Debes aceptar los Términos y Condiciones y la Política de Privacidad.');
      return;
    }

    const formattedBirthDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const formattedPhone = `${selectedCountryObj.code} ${phone.trim()}`;

    setLoading(true);

    const { user, profile, requiresEmailConfirmation, error } = await authService.signUp({
      fullName: fullName.trim(),
      username: cleanUsername,
      birthDate: formattedBirthDate,
      gender,
      email: email.trim(),
      password,
      accountType: 'user',
      country: selectedCountryObj.name,
      phone: formattedPhone,
      city: city.trim(),
    });

    setLoading(false);

    if (error) {
      showAlert('Error de Registro', error);
      return;
    }

    if (requiresEmailConfirmation) {
      showAlert(
        'Confirmación Requerida',
        'Tu cuenta ha sido registrada. Por favor revisa tu correo electrónico para confirmar tu dirección antes de iniciar sesión.',
        () => router.replace('/login')
      );
    } else {
      showAlert(
        '¡Bienvenido a Hangover!',
        'Tu cuenta de usuario se ha creado exitosamente.',
        () => router.replace('/')
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* HEADER SUPERIOR CON BOTÓN DE REGRESO Y LOGO DE HANGOVER */}
        <View style={styles.headerBar}>
          <TouchableOpacity 
            style={styles.backButtonRound} 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Image 
            source={require('@/assets/images/hangover-logo-horizontal.png')} 
            style={styles.headerLogoImage} 
            resizeMode="contain" 
          />
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* TÍTULO Y SUBTÍTULO */}
          <View style={styles.titleSection}>
            <Text style={styles.overlineText}>REGISTRO DE USUARIO</Text>
            <Text style={styles.mainTitleText}>
              Crea tu <Text style={styles.titleGradientText}>cuenta</Text>
            </Text>
            <Text style={styles.subtitleText}>
              Únete a Hangover y vive la mejor experiencia nocturna.
            </Text>
          </View>

          {/* MENSAJE DE ADVERTENCIA POR EDAD < 18 */}
          {underageError && (
            <View style={styles.underageBanner}>
              <AlertCircle size={20} color="#ef4444" style={{ marginRight: 8 }} />
              <Text style={styles.underageBannerText}>
                Hangover es una plataforma exclusiva para mayores de 18 años.
              </Text>
            </View>
          )}

          {/* FORMULARIO DE CAMPOS */}
          <View style={styles.formContainer}>
            {/* 1. NOMBRE COMPLETO */}
            <View style={styles.fieldWrapper}>
              <User size={20} color="#F900BF" style={styles.fieldIconLeft} />
              <TextInput
                style={styles.fieldInput}
                placeholder="Nombre completo"
                placeholderTextColor="#64748b"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            {/* 2. NOMBRE DE USUARIO */}
            <View style={styles.fieldWrapperGroup}>
              <View style={styles.fieldWrapper}>
                <AtSign size={20} color="#F900BF" style={styles.fieldIconLeft} />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Nombre de usuario"
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
            <View style={styles.fieldWrapper}>
              <Calendar size={20} color="#F900BF" style={styles.fieldIconLeft} />
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
              <Calendar size={18} color="#64748b" style={styles.fieldIconRight} />
            </View>

            {/* 4. CORREO ELECTRÓNICO */}
            <View style={styles.fieldWrapper}>
              <Mail size={20} color="#F900BF" style={styles.fieldIconLeft} />
              <TextInput
                style={styles.fieldInput}
                placeholder="Correo electrónico"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* 5. CONTRASEÑA */}
            <View style={styles.fieldWrapper}>
              <Lock size={20} color="#F900BF" style={styles.fieldIconLeft} />
              <TextInput
                style={styles.fieldInput}
                placeholder="Contraseña"
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                {showPassword ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
              </TouchableOpacity>
            </View>

            {/* 6. CONFIRMAR CONTRASEÑA */}
            <View style={styles.fieldWrapper}>
              <Lock size={20} color="#F900BF" style={styles.fieldIconLeft} />
              <TextInput
                style={styles.fieldInput}
                placeholder="Confirmar contraseña"
                placeholderTextColor="#64748b"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                {showConfirmPassword ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
              </TouchableOpacity>
            </View>

            {/* 7. NÚMERO DE TELÉFONO */}
            <View style={styles.fieldWrapperPhone}>
              <TouchableOpacity 
                style={styles.phoneCountryPrefix} 
                onPress={() => setShowCountryModal(true)}
              >
                <Phone size={18} color="#F900BF" style={{ marginRight: 6 }} />
                <Text style={styles.flagText}>{selectedCountryObj.flag}</Text>
                <Text style={styles.prefixCodeText}>{selectedCountryObj.code}</Text>
                <ChevronDown size={14} color="#64748b" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
              <View style={styles.phoneVerticalLine} />
              <TextInput
                style={styles.phoneFieldInput}
                placeholder="Número de teléfono"
                placeholderTextColor="#64748b"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            {/* 8. PAÍS */}
            <TouchableOpacity 
              style={styles.fieldWrapperSelector}
              onPress={() => setShowCountryModal(true)}
              activeOpacity={0.8}
            >
              <Globe size={20} color="#F900BF" style={styles.fieldIconLeft} />
              <Text style={selectedCountryObj.name ? styles.selectorTextActive : styles.selectorTextPlaceholder}>
                {selectedCountryObj.name ? `${selectedCountryObj.flag} ${selectedCountryObj.name}` : 'País'}
              </Text>
              <ChevronDown size={20} color="#64748b" style={styles.fieldIconRight} />
            </TouchableOpacity>

            {/* 9. CIUDAD */}
            <TouchableOpacity 
              style={styles.fieldWrapperSelector}
              onPress={() => setShowCityModal(true)}
              activeOpacity={0.8}
            >
              <MapPin size={20} color="#F900BF" style={styles.fieldIconLeft} />
              <Text style={city ? styles.selectorTextActive : styles.selectorTextPlaceholder}>
                {city || 'Ciudad'}
              </Text>
              <ChevronDown size={20} color="#64748b" style={styles.fieldIconRight} />
            </TouchableOpacity>

            {/* 10. GÉNERO */}
            <TouchableOpacity 
              style={styles.fieldWrapperSelector}
              onPress={() => setShowGenderModal(true)}
              activeOpacity={0.8}
            >
              <UserCheck size={20} color="#F900BF" style={styles.fieldIconLeft} />
              <Text style={gender ? styles.selectorTextActive : styles.selectorTextPlaceholder}>
                {gender || 'Género'}
              </Text>
              <ChevronDown size={20} color="#64748b" style={styles.fieldIconRight} />
            </TouchableOpacity>

            {/* CHECKBOXES TÉRMINOS Y PRIVACIDAD */}
            <View style={styles.checkboxesGroup}>
              <TouchableOpacity 
                style={styles.checkboxRow} 
                onPress={() => setAcceptTerms(!acceptTerms)}
                activeOpacity={0.8}
              >
                {acceptTerms ? (
                  <CheckSquare size={22} color="#F900BF" />
                ) : (
                  <Square size={22} color="#475569" />
                )}
                <Text style={styles.checkboxLabelText}>
                  Acepto los <Text style={styles.checkboxHighlight}>Términos y Condiciones</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.checkboxRow} 
                onPress={() => setAcceptPrivacy(!acceptPrivacy)}
                activeOpacity={0.8}
              >
                {acceptPrivacy ? (
                  <CheckSquare size={22} color="#F900BF" />
                ) : (
                  <Square size={22} color="#475569" />
                )}
                <Text style={styles.checkboxLabelText}>
                  Acepto la <Text style={styles.checkboxHighlight}>Política de Privacidad</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* BOTÓN GRADIENTE PRINCIPAL */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleRegister}
              disabled={loading}
              style={styles.submitTouchWrapper}
            >
              <LinearGradient
                colors={['#4700D8', '#9900F0', '#F900BF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.gradientButtonText}>Crear cuenta  →</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* PIE DE PÁGINA INICIAR SESIÓN */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                ¿Ya tienes una cuenta?{' '}
                <Text 
                  style={styles.footerLinkBold}
                  onPress={() => router.push('/login')}
                >
                  Inicia sesión
                </Text>
              </Text>
            </View>
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButtonRound: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLogoImage: {
    width: 140,
    height: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 24,
  },
  overlineText: {
    color: '#A855F7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 4,
  },
  mainTitleText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  titleGradientText: {
    color: '#F900BF',
  },
  subtitleText: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  underageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  underageBannerText: {
    flex: 1,
    color: '#ef4444',
    fontSize: 13,
    fontWeight: 'bold',
  },
  formContainer: {
    gap: 14,
  },
  fieldWrapperGroup: {
    gap: 4,
  },
  fieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0921',
    borderColor: 'rgba(153, 0, 240, 0.25)',
    borderWidth: 1,
    borderRadius: 16,
    height: 54,
    paddingHorizontal: 16,
  },
  fieldWrapperSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0921',
    borderColor: 'rgba(153, 0, 240, 0.25)',
    borderWidth: 1,
    borderRadius: 16,
    height: 54,
    paddingHorizontal: 16,
  },
  fieldWrapperPhone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0921',
    borderColor: 'rgba(153, 0, 240, 0.25)',
    borderWidth: 1,
    borderRadius: 16,
    height: 54,
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
  eyeButton: {
    padding: 6,
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
  dateInputsInline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateSegmentInput: {
    color: '#FFFFFF',
    fontSize: 15,
    width: 34,
    textAlign: 'center',
  },
  dateDivider: {
    color: '#64748b',
    fontSize: 16,
    marginHorizontal: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    paddingLeft: 4,
    marginTop: 2,
  },
  statusSuccess: {
    color: '#34d399',
  },
  statusError: {
    color: '#ef4444',
  },
  checkboxesGroup: {
    gap: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkboxLabelText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  checkboxHighlight: {
    color: '#F900BF',
    fontWeight: 'bold',
  },
  submitTouchWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: '#F900BF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  gradientButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  footerLinkBold: {
    color: '#F900BF',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0F0921',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(153, 0, 240, 0.3)',
    padding: 20,
    paddingBottom: 40,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  modalItemSelected: {
    backgroundColor: 'rgba(249, 0, 191, 0.12)',
  },
  modalItemText: {
    color: '#94a3b8',
    fontSize: 15,
  },
  modalItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
