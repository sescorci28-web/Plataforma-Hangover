import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, Ticket } from 'lucide-react-native';
import { UserTicketsSection } from './UserTicketsSection';
import { UserBookingTicket } from '@/services/ticket.service';

interface UserTicketsModalProps {
  visible: boolean;
  onClose: () => void;
  tickets: UserBookingTicket[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectTicketQR: (ticket: UserBookingTicket) => void;
}

export function UserTicketsModal({
  visible,
  onClose,
  tickets,
  loading,
  error,
  onRetry,
  onSelectTicketQR,
}: UserTicketsModalProps) {
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
              <Ticket size={22} color="#F900BF" style={{ marginRight: 8 }} />
              <Text style={styles.modalTitle}>MIS ENTRADAS</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* CONTENIDO CON LISTA DE ENTRADAS Y FILTROS */}
          <ScrollView 
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <UserTicketsSection
              tickets={tickets}
              loading={loading}
              error={error}
              onRetry={onRetry}
              onSelectTicketQR={onSelectTicketQR}
            />
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
    paddingBottom: 20,
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 15,
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
  },
});
