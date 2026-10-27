-- ==============================================================================
-- HANGOVER PLATFORM — CONTROL DE INGRESO, AUDITORÍA DE ACCESO Y PRESENCIA ACTIVA
-- Script Idempotente de Referencia para Supabase PostgreSQL
-- ==============================================================================

-- 1. TABLA: admission_logs (Auditoría inmutable de ingresos aceptados y rechazados)
CREATE TABLE IF NOT EXISTS public.admission_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  operator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('approved', 'rejected', 'warning')) NOT NULL,
  access_type TEXT, -- 'club_cover', 'club_vip', 'event'
  buyer_name TEXT,
  device TEXT,
  error_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de auditoría y métricas de puerta
CREATE INDEX IF NOT EXISTS idx_admission_logs_provider_created ON public.admission_logs(provider_id, created_at);
CREATE INDEX IF NOT EXISTS idx_admission_logs_created_at ON public.admission_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admission_logs_booking ON public.admission_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_admission_logs_user ON public.admission_logs(user_id);

-- RLS para admission_logs
ALTER TABLE public.admission_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Operadores y administradores pueden consultar admission_logs" ON public.admission_logs;
CREATE POLICY "Operadores y administradores pueden consultar admission_logs"
  ON public.admission_logs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = operator_id 
    OR auth.uid() = provider_id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Operadores autenticados pueden registrar admission_logs" ON public.admission_logs;
CREATE POLICY "Operadores autenticados pueden registrar admission_logs"
  ON public.admission_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = operator_id
  );


-- 2. TABLA: connect_presence (Presencia viva en discoteca)
CREATE TABLE IF NOT EXISTS public.connect_presence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT uq_connect_presence_user_club UNIQUE (user_id, club_id)
);

CREATE INDEX IF NOT EXISTS idx_connect_presence_club_active ON public.connect_presence(club_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_connect_presence_user ON public.connect_presence(user_id);

ALTER TABLE public.connect_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios autenticados pueden consultar presencia activa" ON public.connect_presence;
CREATE POLICY "Usuarios autenticados pueden consultar presencia activa"
  ON public.connect_presence
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuarios pueden gestionar su propia presencia" ON public.connect_presence;
CREATE POLICY "Usuarios pueden gestionar su propia presencia"
  ON public.connect_presence
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 3. FUNCIÓN ATÓMICA DE VALIDACIÓN DE ENTRADA Y ACTIVACIÓN DE PRESENCIA
-- Garantiza validación única, previene reuso concurrente de QR y sincroniza presencia.
CREATE OR REPLACE FUNCTION public.validate_door_admission_and_sync_presence(
  p_booking_id UUID,
  p_operator_id UUID,
  p_club_id UUID,
  p_device TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_provider_id UUID;
  v_buyer_name TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- 1. Consultar reserva y bloquear fila para evitar condición de carrera (FOR UPDATE)
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  -- Validar existencia
  IF NOT FOUND THEN
    INSERT INTO public.admission_logs (
      operator_id,
      status,
      error_reason,
      device
    ) VALUES (
      p_operator_id,
      'rejected',
      'Entrada no encontrada en el sistema.',
      p_device
    );

    RETURN jsonb_build_object(
      'success', false,
      'code', 'NOT_FOUND',
      'error', 'La entrada o reserva no existe en los registros.'
    );
  END IF;

  v_provider_id := v_booking.provider_id;
  v_buyer_name := COALESCE(v_booking.notes, 'Cliente');

  -- Validar correspondencia de discoteca
  IF v_booking.club_id IS NOT NULL AND v_booking.club_id <> p_club_id THEN
    INSERT INTO public.admission_logs (
      operator_id,
      provider_id,
      booking_id,
      user_id,
      status,
      access_type,
      buyer_name,
      error_reason,
      device
    ) VALUES (
      p_operator_id,
      v_provider_id,
      p_booking_id,
      v_booking.user_id,
      'rejected',
      v_booking.booking_type,
      v_buyer_name,
      'La entrada no corresponde a este establecimiento.',
      p_device
    );

    RETURN jsonb_build_object(
      'success', false,
      'code', 'CLUB_MISMATCH',
      'error', 'Esta entrada pertenece a otra discoteca o evento.'
    );
  END IF;

  -- Validar si el QR ya fue utilizado previamente
  IF v_booking.qr_status = 'used' THEN
    INSERT INTO public.admission_logs (
      operator_id,
      provider_id,
      booking_id,
      user_id,
      status,
      access_type,
      buyer_name,
      error_reason,
      device
    ) VALUES (
      p_operator_id,
      v_provider_id,
      p_booking_id,
      v_booking.user_id,
      'rejected',
      v_booking.booking_type,
      v_buyer_name,
      'Entrada ya utilizada anteriormente.',
      p_device
    );

    RETURN jsonb_build_object(
      'success', false,
      'code', 'ALREADY_USED',
      'error', 'Esta entrada ya fue canjeada e ingresada previamente.',
      'validated_at', v_booking.qr_validated_at
    );
  END IF;

  -- 2. Consumir la entrada atómicamente
  UPDATE public.bookings
  SET 
    qr_status = 'used',
    qr_validated_at = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now())
  WHERE id = p_booking_id;

  -- 3. Registrar auditoría de aprobación
  INSERT INTO public.admission_logs (
    operator_id,
    provider_id,
    booking_id,
    user_id,
    status,
    access_type,
    buyer_name,
    device
  ) VALUES (
    p_operator_id,
    v_provider_id,
    p_booking_id,
    v_booking.user_id,
    'approved',
    v_booking.booking_type,
    v_buyer_name,
    p_device
  );

  -- 4. Activar presencia en connect_presence por 8 horas si hay usuario registrado
  IF v_booking.user_id IS NOT NULL AND p_club_id IS NOT NULL THEN
    v_expires_at := timezone('utc'::text, now()) + interval '8 hours';

    INSERT INTO public.connect_presence (
      user_id,
      club_id,
      booking_id,
      status,
      expires_at,
      last_seen_at
    ) VALUES (
      v_booking.user_id,
      p_club_id,
      p_booking_id,
      'available',
      v_expires_at,
      timezone('utc'::text, now())
    )
    ON CONFLICT (user_id, club_id)
    DO UPDATE SET
      booking_id = EXCLUDED.booking_id,
      status = 'available',
      expires_at = EXCLUDED.expires_at,
      last_seen_at = timezone('utc'::text, now());

    -- 5. Inicializar cuenta de estancia de forma atómica en el servidor
    BEGIN
      PERFORM public.get_or_create_open_venue_account(v_booking.user_id, p_club_id, NULL, p_booking_id);
    EXCEPTION WHEN OTHERS THEN
      -- Evitar que falle la admisión si la tabla de cuentas no está presente en algún entorno
      NULL;
    END;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'APPROVED',
    'booking_id', p_booking_id,
    'user_id', v_booking.user_id,
    'access_type', v_booking.booking_type,
    'number_of_people', v_booking.number_of_people,
    'admitted_at', timezone('utc'::text, now())
  );
END;
$$;


-- 4. FUNCIÓN PARA CERRAR PRESENCIA (CHECKOUT MANUAL POR PORTERO O SALIDA)
CREATE OR REPLACE FUNCTION public.checkout_venue_presence(
  p_user_id UUID,
  p_club_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.connect_presence
  SET 
    expires_at = timezone('utc'::text, now()),
    last_seen_at = timezone('utc'::text, now())
  WHERE user_id = p_user_id 
    AND club_id = p_club_id;

  RETURN FOUND;
END;
$$;


-- 5. FUNCIÓN OPERATIVA: CAMBIAR ESTADO MANUAL DE APERTURA / CIERRE DE LA DISCOTECA
-- Actualiza modules_config de forma no destructiva manteniendo la configuración existente
CREATE OR REPLACE FUNCTION public.set_club_operational_status(
  p_club_id UUID,
  p_is_open BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_config JSONB;
  v_updated_config JSONB;
BEGIN
  -- Obtener configuración actual
  SELECT COALESCE(modules_config, '{}'::jsonb) INTO v_current_config
  FROM public.clubs
  WHERE id = p_club_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Discoteca no encontrada');
  END IF;

  -- Fusionar campos operativos
  v_updated_config := v_current_config || jsonb_build_object(
    'is_open', p_is_open,
    'operational_status', CASE WHEN p_is_open THEN 'ABIERTA' ELSE 'CERRADA' END,
    'last_status_change', timezone('utc'::text, now())
  );

  -- Actualizar registro en public.clubs
  UPDATE public.clubs
  SET 
    modules_config = v_updated_config,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_club_id;

  RETURN jsonb_build_object(
    'success', true,
    'club_id', p_club_id,
    'is_open', p_is_open,
    'modules_config', v_updated_config
  );
END;
$$;

