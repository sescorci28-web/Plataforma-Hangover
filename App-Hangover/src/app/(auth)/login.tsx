import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, Lock, LogIn, Sparkles, HelpCircle } from 'lucide-react-native';
import { authService } from '@/services/auth.service';
import { supabase } from '@/lib/supabase';
import { showAlert } from '@/utils/alert';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('Campos requeridos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    const { session, profile, error } = await authService.signIn(email.trim(), password);
    setLoading(false);

    if (error) {
      showAlert('Error de inicio de sesión', error);
      return;
    }

    // Login exitoso -> Ir a la pantalla de Inicio
    router.replace('/');
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      showAlert(
        'Recuperación de contraseña',
        'Por favor ingresa tu correo electrónico en el campo superior y vuelve a presionar este botón.'
      );
      return;
    }

    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setResetLoading(false);

    if (error) {
      showAlert('Error', error.message);
    } else {
      showAlert(
        'Enlace Enviado',
        `Se ha enviado un correo a ${email.trim()} con instrucciones para restablecer tu contraseña.`
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HANGOVER ACCESO</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* LOGO & SIMBOLO HANGOVER */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/hangover-logo-horizontal.png')} 
            style={{ width: 200, height: 64, resizeMode: 'contain', marginBottom: 4 }} 
          />
          <Text style={styles.brandSubtitle}>NIGHTLIFE EXPERIENCE</Text>
        </View>

        <Text style={styles.mainTitle}>Iniciar Sesión</Text>
        <Text style={styles.subtitle}>
          Ingresa a tu cuenta para explorar los mejores eventos, reservar mesas y acceder a tus entradas VIP.
        </Text>

        <View style={styles.form}>
          {/* CAMPO EMAIL */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
            <View style={styles.inputWrapper}>
              <Mail size={20} color="#FF85B3" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* CAMPO CONTRASEÑA */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>CONTRASEÑA</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color="#FF85B3" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          {/* OLVIDASTE TU CONTRASEÑA */}
          <TouchableOpacity
            style={styles.forgotButton}
            onPress={handleForgotPassword}
            disabled={resetLoading}
          >
            <HelpCircle size={14} color="#FF85B3" style={{ marginRight: 6 }} />
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {/* BOTÓN INGRESAR */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            activeOpacity={0.8}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <LogIn size={20} color="#fff" />
                <Text style={styles.buttonText}>Entrar a Hangover</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ENLACE REGISTRO DIRECTO */}
        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => router.push('/register')}
        >
          <Text style={styles.registerLinkText}>
            ¿No tienes una cuenta? <Text style={styles.registerLinkBold}>Regístrate</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020205' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(153, 0, 240, 0.12)',
  },
  headerTitle: {
    color: '#FF85B3',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  content: { flex: 1 },
  contentContainer: { padding: 24, paddingBottom: 40 },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(153, 0, 240, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(249, 0, 191, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
  },
  brandSubtitle: {
    color: '#F900BF',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginTop: 2,
  },
  mainTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
    marginTop: 12,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 28,
  },
  form: {
    gap: 18,
    marginBottom: 28,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: '#FF85B3',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0B1F',
    borderColor: 'rgba(153, 0, 240, 0.25)',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  forgotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
  forgotText: {
    color: '#FF85B3',
    fontSize: 13,
    fontWeight: '600',
  },
  button: {
    flexDirection: 'row',
    height: 54,
    backgroundColor: '#9900F0',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    shadowColor: '#F900BF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  registerLinkText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  registerLinkBold: {
    color: '#F900BF',
    fontWeight: 'bold',
  },
});
