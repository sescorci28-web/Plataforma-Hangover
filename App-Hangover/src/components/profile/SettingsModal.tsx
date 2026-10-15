import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { 
  X, Settings, Heart, CreditCard, Lock, Settings2, 
  HelpCircle, ChevronRight, Eye, EyeOff, LogOut, Mail, Phone, Calendar, User 
} from 'lucide-react-native';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  email?: string | null;
  phone?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  onSignOut: () => void;
  onShowToast: (title: string, message: string) => void;
}

export function SettingsModal({
  visible,
  onClose,
  email,
  phone,
  gender,
  birthDate,
  onSignOut,
  onShowToast,
}: SettingsModalProps) {
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);

  const handleOptionPress = (title: string, message: string) => {
    onClose();
    onShowToast(title, message);
  };

  const handleSignOutPress = () => {
    onClose();
    onSignOut();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
          {/* HEADER MODAL */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Settings size={20} color="#A855F7" style={{ marginRight: 8 }} />
              <Text style={styles.modalTitle}>CONFIGURACIÓN Y AJUSTES</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* LISTA DE OPCIONES DE CONFIGURACIÓN */}
            <View style={styles.optionsListCard}>
              {/* FAVORITOS */}
              <TouchableOpacity 
                style={styles.optionItemRow}
                onPress={() => handleOptionPress('Favoritos', 'Próximamente podrás guardar tus discotecas y eventos favoritos.')}
                activeOpacity={0.8}
              >
                <View style={styles.optionIconBox}>
                  <Heart size={18} color="#FF85B3" />
                </View>
                <View style={styles.optionTextContent}>
                  <Text style={styles.optionItemTitle}>Favoritos</Text>
                  <Text style={styles.optionItemSub}>Lugares que te gustan</Text>
                </View>
                <ChevronRight size={18} color="#64748b" />
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              {/* MÉTODOS DE PAGO */}
              <TouchableOpacity 
                style={styles.optionItemRow}
                onPress={() => handleOptionPress('Métodos de pago', 'Gestión de tarjetas disponible próximamente.')}
                activeOpacity={0.8}
              >
                <View style={styles.optionIconBox}>
                  <CreditCard size={18} color="#A855F7" />
                </View>
                <View style={styles.optionTextContent}>
                  <Text style={styles.optionItemTitle}>Métodos de pago</Text>
                  <Text style={styles.optionItemSub}>Gestiona tus tarjetas y pagos</Text>
                </View>
                <ChevronRight size={18} color="#64748b" />
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              {/* INFORMACIÓN PERSONAL (DESPLEGABLE PROTEGIDO) */}
              <TouchableOpacity 
                style={styles.optionItemRow}
                onPress={() => setShowPersonalInfo(!showPersonalInfo)}
                activeOpacity={0.8}
              >
                <View style={[styles.optionIconBox, { backgroundColor: 'rgba(249, 0, 191, 0.15)' }]}>
                  <Lock size={18} color="#F900BF" />
                </View>
                <View style={styles.optionTextContent}>
                  <Text style={styles.optionItemTitle}>Información personal</Text>
                  <Text style={styles.optionItemSub}>Solo tú puedes ver esta información</Text>
                </View>
                {showPersonalInfo ? (
                  <EyeOff size={18} color="#F900BF" />
                ) : (
                  <Eye size={18} color="#64748b" />
                )}
              </TouchableOpacity>

              {/* SECCIÓN EXPANDIDA INFORMACIÓN SENSIBLE CUANDO ESTÁ ABIERTA */}
              {showPersonalInfo && (
                <View style={styles.personalDataExpandedBox}>
                  {/* EMAIL */}
                  <View style={styles.personalDataFieldRow}>
                    <Mail size={16} color="#FF85B3" style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.personalFieldLabel}>Correo Electrónico</Text>
                      <Text style={styles.personalFieldValue}>{email || 'No disponible'}</Text>
                    </View>
                  </View>

                  {/* TELÉFONO */}
                  <View style={styles.personalDataFieldRow}>
                    <Phone size={16} color="#FF85B3" style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.personalFieldLabel}>Teléfono</Text>
                      <Text style={styles.personalFieldValue}>{phone || 'No registrado'}</Text>
                    </View>
                  </View>

                  {/* GÉNERO */}
                  <View style={styles.personalDataFieldRow}>
                    <User size={16} color="#FF85B3" style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.personalFieldLabel}>Género</Text>
                      <Text style={styles.personalFieldValue}>{gender || 'No especificado'}</Text>
                    </View>
                  </View>

                  {/* FECHA NACIMIENTO */}
                  <View style={styles.personalDataFieldRow}>
                    <Calendar size={16} color="#FF85B3" style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.personalFieldLabel}>Fecha de Nacimiento</Text>
                      <Text style={styles.personalFieldValue}>{birthDate || 'No registrada'}</Text>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.rowDivider} />

              {/* PREFERENCIAS */}
              <TouchableOpacity 
                style={styles.optionItemRow}
                onPress={() => handleOptionPress('Preferencias', 'Ajustes de privacidad y notificaciones disponibles próximamente.')}
                activeOpacity={0.8}
              >
                <View style={styles.optionIconBox}>
                  <Settings2 size={18} color="#A855F7" />
                </View>
                <View style={styles.optionTextContent}>
                  <Text style={styles.optionItemTitle}>Preferencias</Text>
                  <Text style={styles.optionItemSub}>Notificaciones, privacidad y más</Text>
                </View>
                <ChevronRight size={18} color="#64748b" />
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              {/* SOPORTE */}
              <TouchableOpacity 
                style={styles.optionItemRow}
                onPress={() => handleOptionPress('Soporte y Ayuda', 'Contacta a nuestro equipo de soporte en soporte@hangover.com')}
                activeOpacity={0.8}
              >
                <View style={styles.optionIconBox}>
                  <HelpCircle size={18} color="#A855F7" />
                </View>
                <View style={styles.optionTextContent}>
                  <Text style={styles.optionItemTitle}>Soporte</Text>
                  <Text style={styles.optionItemSub}>Ayuda y más información</Text>
                </View>
                <ChevronRight size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* BOTÓN CERRAR SESIÓN */}
            <TouchableOpacity 
              style={styles.signOutButton} 
              onPress={handleSignOutPress}
              activeOpacity={0.85}
            >
              <LogOut size={18} color="#ef4444" style={{ marginRight: 10 }} />
              <Text style={styles.signOutButtonText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 2, 14, 0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#0F0921',
    borderColor: 'rgba(153, 0, 240, 0.4)',
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    width: '100%',
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
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  closeButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  scrollArea: {
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 20,
    gap: 16,
  },
  optionsListCard: {
    backgroundColor: 'rgba(5, 2, 14, 0.6)',
    borderColor: 'rgba(153, 0, 240, 0.25)',
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  optionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(153, 0, 240, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionTextContent: {
    flex: 1,
  },
  optionItemTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  optionItemSub: {
    color: '#94a3b8',
    fontSize: 12,
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  personalDataExpandedBox: {
    backgroundColor: 'rgba(15, 9, 33, 0.95)',
    borderColor: 'rgba(249, 0, 191, 0.3)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    padding: 16,
    gap: 12,
  },
  personalDataFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personalFieldLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  personalFieldValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(249, 0, 191, 0.4)',
    borderWidth: 1.5,
    borderRadius: 18,
    marginTop: 4,
  },
  signOutButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '900',
  },
});
