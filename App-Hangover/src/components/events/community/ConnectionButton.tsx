import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Alert } from 'react-native';
import { UserPlus, Clock, Check, X } from 'lucide-react-native';
import { ConnectionStatus } from '@/data/mockEventCommunity';

interface ConnectionButtonProps {
  status: ConnectionStatus;
  memberName?: string;
  onSendRequest: () => void;
  onCancelRequest: () => void;
  onAcceptRequest: () => void;
  onIgnoreRequest: () => void;
  onRemoveConnection?: () => void;
  compact?: boolean;
}

export const ConnectionButton: React.FC<ConnectionButtonProps> = ({
  status,
  memberName = 'este usuario',
  onSendRequest,
  onCancelRequest,
  onAcceptRequest,
  onIgnoreRequest,
  onRemoveConnection,
  compact = false,
}) => {

  const handlePressPendingSent = () => {
    Alert.alert(
      'Cancelar solicitud',
      `¿Deseas cancelar la solicitud de conexión enviada a ${memberName}?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Sí, cancelar', style: 'destructive', onPress: onCancelRequest },
      ]
    );
  };

  const handlePressConnected = () => {
    Alert.alert(
      'Conexión activa',
      `Actualmente estás conectado con ${memberName}.`,
      [
        { text: 'Cerrar', style: 'cancel' },
        { 
          text: 'Eliminar conexión', 
          style: 'destructive', 
          onPress: () => onRemoveConnection && onRemoveConnection() 
        },
      ]
    );
  };

  // ESTADO: SOLICITUD RECIBIDA (MOSTRAR BOTONES DUALES ACEPTAR / IGNORAR)
  if (status === 'pending_received') {
    return (
      <View style={[styles.dualRow, compact && styles.compactDualRow]}>
        <TouchableOpacity
          style={[styles.button, styles.acceptButton, compact && styles.compactButtonStyle]}
          onPress={onAcceptRequest}
          activeOpacity={0.8}
        >
          <Check size={compact ? 12 : 14} color="#fff" />
          <Text style={[styles.text, styles.acceptText, compact && styles.compactText]}>
            Aceptar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.ignoreButton, compact && styles.compactButtonStyle]}
          onPress={onIgnoreRequest}
          activeOpacity={0.8}
        >
          <X size={compact ? 12 : 14} color="#71717a" />
          <Text style={[styles.text, styles.ignoreText, compact && styles.compactText]}>
            Ignorar
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ESTADO: SOLICITUD ENVIADA (PENDING SENT)
  if (status === 'pending_sent') {
    return (
      <TouchableOpacity
        style={[styles.button, styles.pendingSentButton, compact && styles.compactButtonStyle]}
        onPress={handlePressPendingSent}
        activeOpacity={0.8}
      >
        <Check size={compact ? 12 : 14} color="#fbbf24" />
        <Text style={[styles.text, styles.pendingSentText, compact && styles.compactText]}>
          Solicitud enviada
        </Text>
      </TouchableOpacity>
    );
  }

  // ESTADO: CONECTADOS
  if (status === 'connected') {
    return (
      <TouchableOpacity
        style={[styles.button, styles.connectedButton, compact && styles.compactButtonStyle]}
        onPress={handlePressConnected}
        activeOpacity={0.8}
      >
        <Check size={compact ? 12 : 14} color="#10b981" />
        <Text style={[styles.text, styles.connectedText, compact && styles.compactText]}>
          Conectados
        </Text>
      </TouchableOpacity>
    );
  }

  // ESTADO: NONE (+ CONECTAR)
  return (
    <TouchableOpacity
      style={[styles.button, styles.connectButton, compact && styles.compactButtonStyle]}
      onPress={onSendRequest}
      activeOpacity={0.8}
    >
      <UserPlus size={compact ? 12 : 14} color="#fff" />
      <Text style={[styles.text, styles.connectText, compact && styles.compactText]}>
        Conectar
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  dualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactDualRow: {
    gap: 4,
  },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  compactButtonStyle: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },

  connectButton: {
    backgroundColor: '#6366f1',
    borderColor: '#818cf8',
  },
  pendingSentButton: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  acceptButton: {
    backgroundColor: '#10b981',
    borderColor: '#34d399',
  },
  ignoreButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  connectedButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },

  text: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  compactText: {
    fontSize: 10,
  },

  connectText: { color: '#fff' },
  pendingSentText: { color: '#fbbf24' },
  acceptText: { color: '#fff' },
  ignoreText: { color: '#a1a1aa' },
  connectedText: { color: '#10b981' },
});
