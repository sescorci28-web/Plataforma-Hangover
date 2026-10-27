import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { X, Sparkles, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';

interface UserQRModalProps {
  visible: boolean;
  fullName: string;
  username: string;
  onClose: () => void;
  qrCode?: string | null;
  eventName?: string | null;
  clubName?: string | null;
  ticketType?: string | null;
  status?: string | null;
}

export function UserQRModal({
  visible,
  fullName,
  username,
  onClose,
  qrCode,
  eventName,
  clubName,
  ticketType,
  status,
}: UserQRModalProps) {
  const displayQrCode = qrCode || 'HGVR-USER-ACCESS';
  const displayEventName = eventName || 'Acceso Perfil Hangover';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
          {/* HEADER MODAL */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
              <Sparkles size={18} color="#F900BF" style={{ marginRight: 6 }} />
              <Text style={styles.modalTitle} numberOfLines={1}>
                {eventName ? 'CÓDIGO DE ENTRADA' : 'MI CÓDIGO HANGOVER'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* DETALLES DEL EVENTO O CLUB SI EXISTE */}
          {eventName && (
            <View style={styles.ticketDetailsHeaderBox}>
              <Text style={styles.eventTitleText} numberOfLines={1}>{displayEventName}</Text>
              {clubName && <Text style={styles.clubSubtitleText}>📍 {clubName}</Text>}
              {ticketType && <Text style={styles.ticketTypeBadgeText}>🎟️ {ticketType}</Text>}
            </View>
          )}

          {/* TARJETA QR DE ACCESO NOCTURNO */}
          <View style={styles.qrContainer}>
            <LinearGradient
              colors={['#4700D8', '#9900F0', '#F900BF']}
              style={styles.qrGradientBorder}
            >
              <View style={styles.qrWhiteBox}>
                <QRCode
                  value={displayQrCode}
                  size={180}
                  color="#05020E"
                  backgroundColor="#FFFFFF"
                />
              </View>
            </LinearGradient>

            {/* CÓDIGO ALFANUMÉRICO REAL DE LA ENTRADA */}
            <View style={styles.qrCodeTokenBadge}>
              <Text style={styles.qrCodeTokenText}>{displayQrCode}</Text>
            </View>

            <Text style={styles.userNameText}>{fullName}</Text>
            <Text style={styles.usernameText}>{username}</Text>

            <View style={styles.verifiedRow}>
              <ShieldCheck size={14} color={status === 'used' ? '#64748b' : '#34d399'} style={{ marginRight: 4 }} />
              <Text style={[styles.verifiedText, status === 'used' && { color: '#94a3b8' }]}>
                {status === 'used' ? 'Ticket Utilizado' : status === 'cancelled' ? 'Ticket Cancelado' : 'Acceso VIP Valido • +18'}
              </Text>
            </View>
          </View>

          {/* INSTRUCCIONES */}
          <Text style={styles.instructionText}>
            Presenta este código en la entrada del evento o discoteca para verificar tu perfil y validar tu acceso.
          </Text>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 2, 14, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#0F0921',
    borderColor: 'rgba(153, 0, 240, 0.4)',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  closeButton: {
    padding: 4,
  },
  ticketDetailsHeaderBox: {
    width: '100%',
    backgroundColor: 'rgba(71, 0, 216, 0.2)',
    borderColor: 'rgba(249, 0, 191, 0.3)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  eventTitleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  clubSubtitleText: {
    color: '#FF85B3',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  ticketTypeBadgeText: {
    color: '#A855F7',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrGradientBorder: {
    padding: 12,
    borderRadius: 24,
    marginBottom: 12,
  },
  qrWhiteBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
  },
  qrCodeTokenBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(153, 0, 240, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 12,
  },
  qrCodeTokenText: {
    color: '#F900BF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  userNameText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 2,
  },
  usernameText: {
    color: '#A855F7',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructionText: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
