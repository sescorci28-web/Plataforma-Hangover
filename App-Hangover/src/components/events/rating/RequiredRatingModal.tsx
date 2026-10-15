import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  TextInput, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, Check, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { EventRatingStars } from './EventRatingStars';

interface RequiredRatingModalProps {
  visible: boolean;
  eventTitle: string;
  eventDate: string;
  eventImageUrl?: string;
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

export const RequiredRatingModal: React.FC<RequiredRatingModalProps> = ({
  visible,
  eventTitle,
  eventDate,
  onSubmitRating,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedScore, setSelectedScore] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [commentText, setCommentText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
    if (selectedScore === 0 || isSubmitting) return;

    setIsSubmitting(true);
    onSubmitRating(selectedScore, selectedTags, commentText);

    // Reset local state after submission
    setTimeout(() => {
      setStep(1);
      setSelectedScore(0);
      setSelectedTags([]);
      setCommentText('');
      setIsSubmitting(false);
    }, 100);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      hardwareAccelerated
    >
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {/* HEADER DEL BLOQUEO ELEGANTE */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <View style={styles.requiredBadge}>
                <ShieldCheck size={14} color="#ec4899" />
                <Text style={styles.requiredBadgeText}>ASISTENCIA VERIFICADA · CIERRE DE EXPERIENCIA</Text>
              </View>
            </View>

            <Text style={styles.eventTitle}>{eventTitle}</Text>
            <Text style={styles.eventDate}>{eventDate}</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* PASO 1: SELECCIÓN OBLIGATORIA DE 1 A 5 ESTRELLAS */}
            {step === 1 && (
              <View style={styles.stepBox}>
                <Text style={styles.stepHeading}>¿Cómo estuvo tu experiencia?</Text>
                <Text style={styles.stepHint}>
                  Selecciona una calificación de 1 a 5 estrellas para continuar usando Hangover.
                </Text>

                <View style={styles.starsWrapper}>
                  <EventRatingStars
                    rating={selectedScore}
                    onRatingChange={(score) => setSelectedScore(score)}
                    size={42}
                    readOnly={isSubmitting}
                  />
                </View>

                {selectedScore > 0 ? (
                  <Text style={styles.scoreText}>{RATING_LABELS[selectedScore]}</Text>
                ) : (
                  <Text style={styles.placeholderHint}>Toca las estrellas para calificar</Text>
                )}

                <TouchableOpacity
                  style={[styles.submitButton, selectedScore === 0 && styles.submitButtonDisabled]}
                  disabled={selectedScore === 0 || isSubmitting}
                  onPress={handleStep1Continue}
                  activeOpacity={0.85}
                >
                  <Text style={styles.submitButtonText}>Continuar</Text>
                  <ArrowRight size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* PASO 2: COMENTARIO Y TAGS OPCIONALES */}
            {step === 2 && (
              <View style={styles.stepBox}>
                <Text style={styles.stepHeading}>¿Quieres agregar más detalles? (Opcional)</Text>
                <Text style={styles.subLabel}>¿Qué fue lo mejor del evento?</Text>

                <View style={styles.tagsGrid}>
                  {RATING_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <TouchableOpacity
                        key={tag}
                        style={[styles.tagChip, isSelected && styles.selectedTagChip]}
                        onPress={() => handleToggleTag(tag)}
                        disabled={isSubmitting}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.tagText, isSelected && styles.selectedTagText]}>
                          {tag}
                        </Text>
                        {isSelected && <Check size={12} color="#ec4899" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.subLabel}>Comentario (Opcional):</Text>
                <TextInput
                  style={styles.commentInput}
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Escribe algo sobre la música, el ambiente..."
                  placeholderTextColor="#71717a"
                  editable={!isSubmitting}
                  multiline
                  numberOfLines={3}
                />

                <TouchableOpacity
                  style={[styles.finalButton, isSubmitting && styles.submitButtonDisabled]}
                  disabled={isSubmitting}
                  onPress={handleFinalSubmit}
                  activeOpacity={0.85}
                >
                  <Sparkles size={16} color="#fff" />
                  <Text style={styles.finalButtonText}>
                    {isSubmitting ? 'Guardando...' : 'Finalizar experiencia'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020205',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  badgeRow: {
    marginBottom: 10,
  },
  requiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  requiredBadgeText: {
    color: '#ec4899',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  eventTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  eventDate: {
    color: '#818cf8',
    fontSize: 13,
    marginTop: 4,
  },

  scrollContent: {
    padding: 24,
    justifyContent: 'center',
  },
  stepBox: {
    alignItems: 'center',
  },
  stepHeading: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepHint: {
    color: '#a1a1aa',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },

  starsWrapper: {
    marginVertical: 20,
  },
  scoreText: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  placeholderHint: {
    color: '#71717a',
    fontSize: 12,
    marginBottom: 24,
  },

  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ec4899',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
  },
  submitButtonDisabled: {
    opacity: 0.35,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },

  subLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginTop: 12,
    marginBottom: 10,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    marginBottom: 12,
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
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    borderColor: 'rgba(236, 72, 153, 0.35)',
  },
  tagText: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedTagText: {
    color: '#ec4899',
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
    height: 80,
    marginBottom: 24,
  },
  finalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
  },
  finalButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
