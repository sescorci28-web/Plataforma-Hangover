-- ==============================================================================
-- MIGRACIÓN: Sistema de Discotecas Seguidas, Calificaciones y Reseñas Verificadas
-- Archivo: supabase/migrations/20261028_verified_club_reviews_and_follows.sql
-- ==============================================================================
-- Reglas Antifraude y Modelo de Datos:
--  1. Cualquier usuario (incluso anónimo) puede consultar reseñas y calificaciones.
--  2. Únicamente usuarios autenticados que hayan ingresado físicamente a la discoteca
--     con entrada QR validada en puerta (bookings.qr_status = 'used' o
--     admission_logs.status = 'approved') pueden calificar y publicar opiniones.
--  3. Unicidad: Máximo 1 opinión por usuario por discoteca (si ya opinó, se actualiza).
--  4. Recalculo automático: Actualiza clubs.rating (promedio redondeado a 1 decimal)
--     y clubs.reviews_count.
--  5. Seguimiento: public.user_favorite_clubs para seguir/dejar de seguir discotecas.
-- ==============================================================================

-- 1. Asegurar restricción UNIQUE en public.club_reviews (club_id, user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'club_reviews_club_id_user_id_key'
  ) THEN
    -- Si existen duplicados históricos previos, conservar el más reciente antes de crear la restricción
    DELETE FROM public.club_reviews a
    USING public.club_reviews b
    WHERE a.id < b.id
      AND a.club_id = b.club_id
      AND a.user_id = b.user_id;

    ALTER TABLE public.club_reviews
    ADD CONSTRAINT club_reviews_club_id_user_id_key UNIQUE (club_id, user_id);
  END IF;
END $$;

-- 2. Asegurar que las columnas de sub-puntuaciones tengan valores por defecto si no se especifican
ALTER TABLE public.club_reviews
  ALTER COLUMN atmosphere SET DEFAULT 5,
  ALTER COLUMN service SET DEFAULT 5,
  ALTER COLUMN music SET DEFAULT 5,
  ALTER COLUMN security SET DEFAULT 5,
  ALTER COLUMN facilities SET DEFAULT 5,
  ALTER COLUMN rating SET DEFAULT 5;

-- 3. Habilitar RLS en public.club_reviews y public.user_favorite_clubs
ALTER TABLE public.club_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorite_clubs ENABLE ROW LEVEL SECURITY;

-- 3.1 Políticas RLS para public.club_reviews
DROP POLICY IF EXISTS "Permitir lectura publica de resenas" ON public.club_reviews;
CREATE POLICY "Permitir lectura publica de resenas"
  ON public.club_reviews
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir a usuarios gestionar sus propias resenas" ON public.club_reviews;
CREATE POLICY "Permitir a usuarios gestionar sus propias resenas"
  ON public.club_reviews
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3.2 Políticas RLS para public.user_favorite_clubs
DROP POLICY IF EXISTS "Permitir a usuarios ver sus discotecas seguidas" ON public.user_favorite_clubs;
CREATE POLICY "Permitir a usuarios ver sus discotecas seguidas"
  ON public.user_favorite_clubs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Permitir a usuarios seguir discotecas" ON public.user_favorite_clubs;
CREATE POLICY "Permitir a usuarios seguir discotecas"
  ON public.user_favorite_clubs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Permitir a usuarios dejar de seguir discotecas" ON public.user_favorite_clubs;
CREATE POLICY "Permitir a usuarios dejar de seguir discotecas"
  ON public.user_favorite_clubs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Función Trigger para sincronizar rating y reviews_count en public.clubs
CREATE OR REPLACE FUNCTION public.sync_club_rating_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_target_club_id UUID;
  v_avg_rating NUMERIC(3, 1) := 0;
  v_count INT := 0;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_target_club_id := OLD.club_id;
  ELSE
    v_target_club_id := NEW.club_id;
  END IF;

  SELECT
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0),
    COUNT(*)
  INTO
    v_avg_rating,
    v_count
  FROM public.club_reviews
  WHERE club_id = v_target_club_id;

  UPDATE public.clubs
  SET
    rating = v_avg_rating,
    reviews_count = v_count
  WHERE id = v_target_club_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_club_rating_stats ON public.club_reviews;
CREATE TRIGGER trg_sync_club_rating_stats
AFTER INSERT OR UPDATE OR DELETE ON public.club_reviews
FOR EACH ROW
EXECUTE FUNCTION public.sync_club_rating_stats();

-- 5. RPC Antifraude: Verificar si el usuario puede calificar la discoteca
CREATE OR REPLACE FUNCTION public.check_user_can_review_club(
  p_club_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_has_entered BOOLEAN := false;
  v_verified_booking_id UUID := NULL;
  v_existing_review RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'authenticated', false,
      'has_entered', false,
      'can_review', false,
      'already_reviewed', false,
      'existing_review', null
    );
  END IF;

  -- 1. Verificar si tiene entrada validada en puerta (qr_status = 'used') en bookings
  SELECT id INTO v_verified_booking_id
  FROM public.bookings
  WHERE user_id = v_user_id
    AND club_id = p_club_id
    AND qr_status = 'used'
  ORDER BY qr_validated_at DESC NULLS LAST, created_at DESC
  LIMIT 1;

  -- 2. Si no se encontró directo en bookings, buscar en admission_logs con status 'approved'
  IF v_verified_booking_id IS NULL THEN
    SELECT b.id INTO v_verified_booking_id
    FROM public.admission_logs a
    JOIN public.bookings b ON a.booking_id = b.id
    WHERE (a.user_id = v_user_id OR b.user_id = v_user_id)
      AND b.club_id = p_club_id
      AND a.status = 'approved'
    ORDER BY a.created_at DESC
    LIMIT 1;
  END IF;

  IF v_verified_booking_id IS NOT NULL THEN
    v_has_entered := true;
  END IF;

  -- 3. Verificar si ya tiene reseña previa
  SELECT id, rating, comment, created_at
  INTO v_existing_review
  FROM public.club_reviews
  WHERE user_id = v_user_id
    AND club_id = p_club_id
  LIMIT 1;

  RETURN jsonb_build_object(
    'authenticated', true,
    'has_entered', v_has_entered,
    'can_review', v_has_entered,
    'verified_booking_id', v_verified_booking_id,
    'already_reviewed', v_existing_review.id IS NOT NULL,
    'existing_review', CASE 
      WHEN v_existing_review.id IS NOT NULL THEN
        jsonb_build_object(
          'id', v_existing_review.id,
          'rating', v_existing_review.rating,
          'comment', v_existing_review.comment,
          'created_at', v_existing_review.created_at
        )
      ELSE NULL
    END
  );
END;
$$;

-- 6. RPC Antifraude: Publicar o actualizar calificación y opinión verificada
CREATE OR REPLACE FUNCTION public.submit_verified_club_review(
  p_club_id UUID,
  p_rating INT,
  p_comment TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_verified_booking_id UUID := NULL;
  v_review_id UUID;
  v_clean_comment TEXT;
  v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
  -- Validaciones de seguridad
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Debes iniciar sesión para publicar una opinión.');
  END IF;

  IF p_club_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ID de discoteca inválido.');
  END IF;

  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'La calificación debe ser de 1 a 5 estrellas.');
  END IF;

  v_clean_comment := NULLIF(TRIM(p_comment), '');
  IF v_clean_comment IS NOT NULL AND length(v_clean_comment) > 1000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'El comentario no puede exceder 1000 caracteres.');
  END IF;

  -- 1. Regla Antifraude: Verificar ingreso físico por QR
  SELECT id INTO v_verified_booking_id
  FROM public.bookings
  WHERE user_id = v_user_id
    AND club_id = p_club_id
    AND qr_status = 'used'
  ORDER BY qr_validated_at DESC NULLS LAST, created_at DESC
  LIMIT 1;

  IF v_verified_booking_id IS NULL THEN
    SELECT b.id INTO v_verified_booking_id
    FROM public.admission_logs a
    JOIN public.bookings b ON a.booking_id = b.id
    WHERE (a.user_id = v_user_id OR b.user_id = v_user_id)
      AND b.club_id = p_club_id
      AND a.status = 'approved'
    ORDER BY a.created_at DESC
    LIMIT 1;
  END IF;

  IF v_verified_booking_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'not_admitted', true,
      'error', 'Puedes consultar todas las opiniones. Para calificar esta discoteca, primero debes haber ingresado y tener una entrada registrada en Hangover.'
    );
  END IF;

  -- 2. Upsert de la opinión (1 por usuario por discoteca)
  INSERT INTO public.club_reviews (
    club_id,
    user_id,
    booking_id,
    rating,
    atmosphere,
    service,
    music,
    security,
    facilities,
    comment,
    recommend,
    created_at
  )
  VALUES (
    p_club_id,
    v_user_id,
    v_verified_booking_id,
    p_rating,
    p_rating,
    p_rating,
    p_rating,
    p_rating,
    p_rating,
    v_clean_comment,
    (p_rating >= 4),
    v_now
  )
  ON CONFLICT (club_id, user_id)
  DO UPDATE SET
    booking_id = EXCLUDED.booking_id,
    rating = EXCLUDED.rating,
    atmosphere = EXCLUDED.atmosphere,
    service = EXCLUDED.service,
    music = EXCLUDED.music,
    security = EXCLUDED.security,
    facilities = EXCLUDED.facilities,
    comment = EXCLUDED.comment,
    recommend = EXCLUDED.recommend,
    created_at = v_now
  RETURNING id INTO v_review_id;

  -- 3. Sincronizar inmediatamente promedio y contador en public.clubs
  PERFORM public.sync_club_rating_stats();

  RETURN jsonb_build_object(
    'success', true,
    'review_id', v_review_id,
    'rating', p_rating,
    'comment', v_clean_comment,
    'message', '¡Gracias por compartir tu opinión verificada!'
  );
END;
$$;
