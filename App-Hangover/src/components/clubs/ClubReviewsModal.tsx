import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  X,
  Star,
  ShieldCheck,
  Lock,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
} from 'lucide-react-native';
import { ClubTheme } from '@/constants/clubTheme';
import { clubService } from '@/services/club.service';
import {
  ClubReview,
  ClubReviewsSummary,
  ClubReviewEligibility,
} from '@/types/club.types';

interface ClubReviewsModalProps {
  visible: boolean;
  onClose: () => void;
  clubId: string;
  clubName: string;
  isAuthenticated: boolean;
  onReviewSubmitted?: () => void;
}

export const ClubReviewsModal: React.FC<ClubReviewsModalProps> = ({
  visible,
  onClose,
  clubId,
  clubName,
  isAuthenticated,
  onReviewSubmitted,
}) => {
  // Estados de consulta de datos
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<ClubReviewsSummary>({
    reviews: [],
    averageRating: 0,
    totalCount: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [eligibility, setEligibility] = useState<ClubReviewEligibility>({
    authenticated: false,
    hasEntered: false,
    canReview: false,
    alreadyReviewed: false,
    existingReview: null,
    verifiedBookingId: null,
  });

  // Filtro activo de estrellas: 0 = Todas, 1..5 = Estrellas específicas
  const [selectedFilter, setSelectedFilter] = useState<number>(0);

  // Formulario de calificación
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [commentText, setCommentText] = useState<string>('');
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cargar datos de opiniones y verificación antifraude
  const loadReviewsData = useCallback(async () => {
    if (!clubId) return;
    setLoading(true);
    setFormFeedback(null);
    try {
      const [sumRes, eligRes] = await Promise.all([
        clubService.getClubReviews(clubId),
        clubService.checkUserCanReviewClub(clubId),
      ]);

      setSummary(sumRes);
      setEligibility(eligRes);

      // Si el usuario ya tenía una opinión, precargar su calificación y comentario
      if (eligRes.alreadyReviewed && eligRes.existingReview) {
        setSelectedRating(eligRes.existingReview.rating || 5);
        setCommentText(eligRes.existingReview.comment || '');
      } else {
        setSelectedRating(5);
        setCommentText('');
      }
    } catch (err) {
      console.warn('[ClubReviewsModal] Error cargando opiniones:', err);
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    if (visible && clubId) {
      loadReviewsData();
    }
  }, [visible, clubId, loadReviewsData]);

  // Manejador de envío de opinión verificada
  const handleSubmitReview = async () => {
    if (!eligibility.canReview) {
      Alert.alert(
        'Acceso restringido',
        'Puedes consultar todas las opiniones. Para calificar esta discoteca, primero debes haber ingresado y tener una entrada registrada en Hangover.'
      );
      return;
    }

    if (selectedRating < 1 || selectedRating > 5) {
      Alert.alert('Calificación requerida', 'Por favor selecciona entre 1 y 5 estrellas.');
      return;
    }

    setSubmitting(true);
    setFormFeedback(null);
    try {
      const res = await clubService.submitClubReview({
        clubId,
        rating: selectedRating,
        comment: commentText.trim() || undefined,
      });

      if (!res.success) {
        setFormFeedback({ type: 'error', text: res.error || 'No se pudo guardar tu opinión.' });
        Alert.alert('No se pudo publicar', res.error || 'Ocurrió un error al guardar tu opinión.');
      } else {
        setFormFeedback({
          type: 'success',
          text: eligibility.alreadyReviewed ? '¡Tu opinión ha sido actualizada!' : '¡Gracias por compartir tu opinión!',
        });
        await loadReviewsData();
        if (onReviewSubmitted) {
          onReviewSubmitted();
        }
      }
    } catch (err: any) {
      setFormFeedback({ type: 'error', text: err?.message || 'Error inesperado' });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrado de opiniones en memoria
  const filteredReviews = useMemo(() => {
    if (selectedFilter === 0) return summary.reviews;
    return summary.reviews.filter((r) => Math.round(r.rating) === selectedFilter);
  }, [summary.reviews, selectedFilter]);

  // Formato relativo de fecha
  const formatRelativeDate = (dateString?: string | null) => {
    if (!dateString) return 'Reciente';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) return 'Hace un momento';
      if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
      if (diffDays === 1) return 'Ayer';
      if (diffDays < 7) return `Hace ${diffDays} días`;
      return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return 'Reciente';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ENCABEZADO SUPERIOR */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Opiniones y Calificaciones</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {clubName}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Cerrar opiniones"
          >
            <X size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={ClubTheme.colors.primary} />
            <Text style={styles.loadingText}>Cargando opiniones verificadas...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. RESUMEN VISUAL DE CALIFICACIONES Y BARRAS */}
            <View style={styles.summaryCard}>
              <View style={styles.ratingNumberBox}>
                <Text style={styles.bigRatingText}>
                  {summary.averageRating > 0 ? summary.averageRating.toFixed(1) : '—'}
                </Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      color="#fbbf24"
                      fill={star <= Math.round(summary.averageRating) ? '#fbbf24' : 'transparent'}
                    />
                  ))}
                </View>
                <Text style={styles.totalReviewsCount}>
                  {summary.totalCount === 1 ? '1 opinión' : `${summary.totalCount} opiniones`}
                </Text>
              </View>

              {/* Barras de distribución de 5 a 1 estrellas */}
              <View style={styles.distributionBox}>
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = summary.distribution[stars as 1 | 2 | 3 | 4 | 5] || 0;
                  const percentage = summary.totalCount > 0 ? (count / summary.totalCount) * 100 : 0;
                  return (
                    <TouchableOpacity
                      key={stars}
                      style={styles.distRow}
                      onPress={() => setSelectedFilter(selectedFilter === stars ? 0 : stars)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.distStarLabel}>
                        <Text style={styles.distStarNum}>{stars}</Text>
                        <Star size={10} color="#fbbf24" fill="#fbbf24" />
                      </View>
                      <View style={styles.distTrack}>
                        <View style={[styles.distFill, { width: `${percentage}%` }]} />
                      </View>
                      <Text style={styles.distCountText}>{count}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. CHIPS DE FILTRO RÁPIDO */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {[
                { label: 'Todas', value: 0 },
                { label: '5 ★', value: 5 },
                { label: '4 ★', value: 4 },
                { label: '3 ★', value: 3 },
                { label: '2 ★', value: 2 },
                { label: '1 ★', value: 1 },
              ].map((filter) => {
                const isSelected = selectedFilter === filter.value;
                return (
                  <TouchableOpacity
                    key={filter.value}
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}
                    onPress={() => setSelectedFilter(filter.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 3. SECCIÓN DE CALIFICAR (REGLA ANTIFRAUDE CON ADMISIÓN QR) */}
            <View style={styles.reviewSubmissionBox}>
              {!isAuthenticated ? (
                // 3.1 Usuario No Autenticado
                <View style={styles.noticeCardLocked}>
                  <View style={styles.noticeIconWrapper}>
                    <Lock size={18} color={ClubTheme.colors.accent} />
                  </View>
                  <View style={styles.noticeTextWrapper}>
                    <Text style={styles.noticeTitle}>Inicia sesión para calificar</Text>
                    <Text style={styles.noticeDescription}>
                      Inicia sesión con tu cuenta para calificar y compartir tu experiencia con la comunidad de Hangover.
                    </Text>
                  </View>
                </View>
              ) : !eligibility.hasEntered ? (
                // 3.2 Usuario Autenticado pero NUNCA ha ingresado con entrada QR a esta discoteca
                <View style={styles.noticeCardLocked}>
                  <View style={styles.noticeIconWrapper}>
                    <ShieldCheck size={20} color="#fbbf24" />
                  </View>
                  <View style={styles.noticeTextWrapper}>
                    <Text style={styles.noticeTitle}>Opiniones verificadas por asistencia</Text>
                    <Text style={styles.noticeDescription}>
                      Puedes consultar todas las opiniones. Para calificar esta discoteca, primero debes haber ingresado y tener una entrada registrada en Hangover.
                    </Text>
                  </View>
                </View>
              ) : (
                // 3.3 Usuario Verificado con Ingreso en Puerta Real
                <View style={styles.verifiedFormCard}>
                  <View style={styles.verifiedBadgeHeader}>
                    <ShieldCheck size={16} color="#10B981" />
                    <Text style={styles.verifiedBadgeHeaderText}>
                      {eligibility.alreadyReviewed ? 'Editar tu opinión verificada' : 'Tu entrada ha sido verificada en puerta'}
                    </Text>
                  </View>

                  <Text style={styles.formPromptText}>
                    {eligibility.alreadyReviewed
                      ? 'Puedes actualizar tu puntuación y comentario en cualquier momento:'
                      : `¿Cómo fue tu experiencia en ${clubName}?`}
                  </Text>

                  {/* Selector interactivo de estrellas 1-5 */}
                  <View style={styles.starPickerRow}>
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const isFilled = starVal <= selectedRating;
                      return (
                        <TouchableOpacity
                          key={starVal}
                          onPress={() => setSelectedRating(starVal)}
                          style={styles.starPickerButton}
                          activeOpacity={0.7}
                        >
                          <Star
                            size={32}
                            color={isFilled ? '#fbbf24' : '#374151'}
                            fill={isFilled ? '#fbbf24' : 'transparent'}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Campo de texto de opinión opcional */}
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Escribe tu opinión opcional (música, atención, ambiente)..."
                    placeholderTextColor={ClubTheme.colors.textMuted}
                    multiline
                    maxLength={1000}
                    value={commentText}
                    onChangeText={setCommentText}
                    textAlignVertical="top"
                  />

                  {/* Mensaje de retroalimentación en caso de éxito/error */}
                  {formFeedback && (
                    <View
                      style={[
                        styles.feedbackBanner,
                        formFeedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
                      ]}
                    >
                      {formFeedback.type === 'success' ? (
                        <CheckCircle2 size={16} color="#10B981" />
                      ) : (
                        <AlertCircle size={16} color="#EF4444" />
                      )}
                      <Text
                        style={[
                          styles.feedbackText,
                          formFeedback.type === 'success' ? styles.feedbackTextSuccess : styles.feedbackTextError,
                        ]}
                      >
                        {formFeedback.text}
                      </Text>
                    </View>
                  )}

                  {/* Botón de envío */}
                  <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={handleSubmitReview}
                    disabled={submitting}
                    activeOpacity={0.85}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Sparkles size={16} color="#ffffff" />
                        <Text style={styles.submitButtonText}>
                          {eligibility.alreadyReviewed ? 'Actualizar opinión' : 'Publicar opinión verificada'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* 4. LISTADO DE OPINIONES DE CLIENTES */}
            <View style={styles.reviewsListSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {selectedFilter === 0 ? 'Todas las opiniones' : `Opiniones de ${selectedFilter} estrellas`}
                </Text>
                <Text style={styles.sectionCounter}>{filteredReviews.length}</Text>
              </View>

              {filteredReviews.length === 0 ? (
                <View style={styles.emptyReviewsContainer}>
                  <MessageSquare size={36} color={ClubTheme.colors.textMuted} />
                  <Text style={styles.emptyTitle}>
                    {selectedFilter === 0 ? 'Sin opiniones aún' : `No hay opiniones con ${selectedFilter} estrellas`}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {selectedFilter === 0
                      ? 'Sé uno de los primeros en ingresar y compartir tu experiencia en esta discoteca.'
                      : 'Intenta seleccionar otro filtro para ver más comentarios.'}
                  </Text>
                </View>
              ) : (
                filteredReviews.map((review) => {
                  const authorName = review.profiles?.full_name || review.profiles?.username || 'Cliente Hangover';
                  const avatarUrl = review.profiles?.avatar_url;
                  const initialLetter = authorName.charAt(0).toUpperCase() || 'H';

                  return (
                    <View key={review.id} style={styles.reviewCard}>
                      {/* Cabecera de la reseña: Avatar, Nombre, Distintivo Verificado y Fecha */}
                      <View style={styles.reviewCardHeader}>
                        <View style={styles.authorRow}>
                          {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.authorAvatar} />
                          ) : (
                            <View style={styles.authorAvatarPlaceholder}>
                              <Text style={styles.avatarInitial}>{initialLetter}</Text>
                            </View>
                          )}
                          <View style={styles.authorInfo}>
                            <Text style={styles.authorName} numberOfLines={1}>
                              {authorName}
                            </Text>
                            {/* Distintivo de Entrada Verificada */}
                            <View style={styles.verifiedBadge}>
                              <ShieldCheck size={12} color="#10B981" />
                              <Text style={styles.verifiedBadgeText}>Visita verificada</Text>
                            </View>
                          </View>
                        </View>

                        <Text style={styles.reviewDate}>{formatRelativeDate(review.created_at)}</Text>
                      </View>

                      {/* Estrellas otorgadas */}
                      <View style={styles.reviewStarsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={13}
                            color="#fbbf24"
                            fill={star <= Math.round(review.rating) ? '#fbbf24' : 'transparent'}
                          />
                        ))}
                      </View>

                      {/* Comentario del cliente */}
                      {review.comment ? (
                        <Text style={styles.reviewCommentText}>{review.comment}</Text>
                      ) : null}
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050508',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: '#07070d',
  },
  headerTitleContainer: {
    flex: 1,
    marginRight: 16,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
    gap: 20,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d0d16',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  ratingNumberBox: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 88,
    gap: 4,
  },
  bigRatingText: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  totalReviewsCount: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  distributionBox: {
    flex: 1,
    gap: 4,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 18,
  },
  distStarLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    width: 22,
    justifyContent: 'flex-end',
  },
  distStarNum: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  distTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  distFill: {
    height: '100%',
    backgroundColor: '#fbbf24',
    borderRadius: 3,
  },
  distCountText: {
    color: ClubTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    width: 22,
    textAlign: 'right',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#12121e',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  filterChipActive: {
    backgroundColor: ClubTheme.colors.primary,
    borderColor: ClubTheme.colors.primary,
  },
  filterChipText: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  reviewSubmissionBox: {
    width: '100%',
  },
  noticeCardLocked: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.15)',
  },
  noticeIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  noticeTextWrapper: {
    flex: 1,
    gap: 4,
  },
  noticeTitle: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '700',
  },
  noticeDescription: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  verifiedFormCard: {
    backgroundColor: '#0d0d16',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  verifiedBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedBadgeHeaderText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700',
  },
  formPromptText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  starPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  starPickerButton: {
    padding: 4,
  },
  commentInput: {
    backgroundColor: '#050508',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    fontSize: 13,
    minHeight: 80,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  feedbackSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  feedbackError: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  feedbackText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  feedbackTextSuccess: {
    color: '#10B981',
  },
  feedbackTextError: {
    color: '#EF4444',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ClubTheme.colors.primary,
    height: 44,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  reviewsListSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionCounter: {
    color: ClubTheme.colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyReviewsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    gap: 10,
    backgroundColor: '#0a0a12',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: ClubTheme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 280,
  },
  reviewCard: {
    backgroundColor: '#0d0d16',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  authorAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1d1d2c',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  authorInfo: {
    flex: 1,
    gap: 2,
  },
  authorName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  reviewDate: {
    color: ClubTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  reviewStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  reviewCommentText: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
  },
});
