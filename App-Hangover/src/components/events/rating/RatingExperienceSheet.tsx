import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  TextInput, ScrollView, Pressable 
} from 'react-native';
import { X, Sparkles, Check, ArrowRight } from 'lucide-react-native';
import { EventRatingStars } from './EventRatingStars';

interface RatingExperienceSheetProps {
  visible: boolean;
  eventTitle: string;
  eventDate: string;
  onClose: () => void;
  onSubmitRating: (rating: number, tags: string[], comment: string) => void;
}

const RATING_TAGS = [
  'Música',
  'Ambiente',
  'Organización',
  'Seguridad',
  'Ubicación',
  'Sonido & Luces',
];

const RATING_LABELS: Record<number, string> = {
  1: '1 de 5 estrellas — Deficiente',
  2: '2 de 5 estrellas — Regular',
  3: '3 de 5 estrellas — Bueno',
  4: '4 de 5 estrellas — ¡Muy Bueno!',
  5: '5 de 5 estrellas — ¡Excelente / Inolvidable!',
};

export const RatingExperienceSheet: React.FC<RatingExperienceSheetProps> = ({
  visible,
  eventTitle,
  eventDate,
  onClose,
  onSubmitRating,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedScore, setSelectedScore] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [commentText, setCommentText] = useState<string>('');

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleStep1Continue = () => {
    if (selectedScore === 0) return;
    setStep(2);
  };

  const handleFinalSubmit = () => {
    if (selectedScore === 0) return;
    onSubmitRating(selectedScore, selectedTags, commentText);
    // Reset internal state
    setStep(1);
    setSelectedScore(0);
    setSelectedTags([]);
    setCommentText('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheetContent} onPress={(e) => e.stopPropagation()}>
          {/* HANDLE DE ARRASTRE */}
          <View style={styles.sheetHandle} />

          {/* HEADER */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color="#818cf8" />
                <Text style={styles.badgeLabel}>EXPERIENCIA PENDIENTE</Text>
              </View>
              <Text style={styles.eventTitle} numberOfLines={1}>{eventTitle}</Text>
              <Text style={styles.eventDate} numberOfLines={1}>{eventDate}</Text>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* PASO 1: CALIFICACIÓN GENERAL OBLIGATORIA (1-5 ESTRELLAS) */}
            {step === 1 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>¿Cómo estuvo tu experiencia en el evento?</Text>

                <View style={styles.starsWrapper}>
                  <EventRatingStars
                    rating={selectedScore}
                    onRatingChange={(score) => setSelectedScore(score)}
                    size={36}
                  />
                </View>

                {selectedScore > 0 && (
                  <Text style={styles.scoreText}>
                    {RATING_LABELS[selectedScore]}
                  </Text>
                )}

                <TouchableOpacity
                  style={[styles.actionButton, selectedScore === 0 && styles.actionButtonDisabled]}
                  disabled={selectedScore === 0}
                  onPress={handleStep1Continue}
                  activeOpacity={0.85}
                >
                  <Text style={styles.actionButtonText}>Continuar</Text>
                  <ArrowRight size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* PASO 2: DETALLES OPCIONALES (TAGS Y COMENTARIO) */}
            {step === 2 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>¿Quieres contar un poco más? (Opcional)</Text>
                <Text style={styles.subTitle}>¿Qué fue lo mejor del evento?</Text>

                <View style={styles.tagsGrid}>
                  {RATING_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <TouchableOpacity
                        key={tag}
                        style={[styles.tagChip, isSelected && styles.selectedTagChip]}
                        onPress={() => handleToggleTag(tag)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.tagText, isSelected && styles.selectedTagText]}>
                          {tag}
                        </Text>
                        {isSelected && <Check size={12} color="#818cf8" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.subTitle}>Comentario u opinión (Opcional):</Text>
                <TextInput
                  style={styles.commentInput}
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Escribe tu opinión sobre el evento..."
                  placeholderTextColor="#71717a"
                  multiline
                  numberOfLines={3}
                />

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleFinalSubmit}
                  activeOpacity={0.85}
                >
                  <Sparkles size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Finalizar experiencia</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 14,
    marginBottom: 16,
  },
  badgeLabel: {
    color: '#818cf8',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  eventTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  eventDate: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollBody: {},
  stepContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  stepTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subTitle: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 8,
  },

  starsWrapper: {
    marginVertical: 12,
  },
  scoreText: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    marginBottom: 10,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  selectedTagChip: {
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
    borderColor: 'rgba(129, 140, 248, 0.35)',
  },
  tagText: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedTagText: {
    color: '#818cf8',
    fontWeight: 'bold',
  },

  commentInput: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 12,
    color: '#fff',
    fontSize: 13,
    textAlignVertical: 'top',
    height: 70,
    marginBottom: 20,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
  },
  actionButtonDisabled: {
    opacity: 0.4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
