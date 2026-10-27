-- ==============================================================================
-- HANGOVER - FASE 1: MIGRACIÓN DE SEGURIDAD RLS Y TRIGGERS PARA PUBLIC.BOOKINGS
-- Archivo: supabase/migrations/20261021_fase1_bookings_security_rls.sql
-- Versión: 1.4 (Compatibilidad Total Web, Users y Business + Hardening de Pagos Simulados)
-- Estado: PREPARADA PARA REVISIÓN MANUAL (NO EJECUTADA EN PRODUCCIÓN REMOTA)
-- ==============================================================================
--
-- ADVERTENCIA SOBRE EL ENTORNO REMOTO DE PRODUCCIÓN:
-- Este script es una propuesta técnica revisable y reversible para blindar la tabla
-- public.bookings. En este entorno local NO se cuenta con credenciales administrativas
-- remotas para inspeccionar el catálogo activo de Supabase en producción.
-- Por lo tanto, NO se afirma que la base de datos remota esté protegida. Este script
-- NO DEBE ejecutarse de forma automática ni a ciegas; requiere revisión y aplicación
-- manual controlada por el administrador en el panel de Supabase.
--
-- CONTEXTO DE PAGOS SIMULADOS Y COMPATIBILIDAD CON LAS TRES APLICACIONES:
-- 1. Actualmente Hangover no tiene pasarela de pago real integrada (Stripe/Wompi).
--    Los pagos se manejan de forma simulada (ACCEPTED -> PAID en Web, o checkout simulado
--    en Mobile) para permitir el desarrollo continuo y pruebas funcionales.
-- 2. Este script permite que el flujo simulado continúe operando, pero evita que:
--    a) Un cliente apruebe su propia reserva pendiente (PENDING -> PAID bloqueado).
--    b) Un cliente altere total_amount, user_id, provider_id o qr_code.
--    c) Se consuma o reutilice una entrada ya validada (qr_status = 'used').
-- 3. Soporte para Hangover Business:
--    Permite que los administradores y dueños de discotecas (clubs.provider_id u owner_id)
--    puedan gestionar reservas de su club y validar entradas QR en puerta.
-- 4. Regla de reservas VIP:
--    En la Web se calcula un valor referencial de 100 por persona, mientras que en la app
--    móvil se crea en 0 (solicitud sin cobro previo). Se mantiene compatibilidad con ambos
--    y se documenta como regla comercial pendiente de confirmación de negocio.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. ASEGURAR ROW LEVEL SECURITY EN PUBLIC.BOOKINGS
-- ------------------------------------------------------------------------------
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. ELIMINACIÓN PUNTUAL Y ESPECÍFICA DE POLÍTICAS INSEGURAS Y OBSOLETAS
-- ------------------------------------------------------------------------------
-- Eliminar las dos políticas permisivas abiertas identificadas en los esquemas históricos:
DROP POLICY IF EXISTS "Providers and Users can update their bookings." ON public.bookings;
DROP POLICY IF EXISTS "Users and providers can update bookings" ON public.bookings;

-- Eliminar versiones previas de desarrollo de esta migración si existiesen:
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Providers can update assigned bookings" ON public.bookings;
DROP POLICY IF EXISTS "Clients can cancel own pending bookings" ON public.bookings;
DROP POLICY IF EXISTS "Clients can cancel own unconsumed bookings" ON public.bookings;
DROP POLICY IF EXISTS "Clients can pay accepted bookings" ON public.bookings;
DROP POLICY IF EXISTS "Providers can manage assigned bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins have full update access on bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON public.bookings;

-- Actualización controlada de SELECT e INSERT para estandarizar acceso:
DROP POLICY IF EXISTS "Users view own bookings." ON public.bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users and providers can view own bookings" ON public.bookings;

DROP POLICY IF EXISTS "Users can insert bookings." ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users can insert bookings" ON public.bookings;


-- ------------------------------------------------------------------------------
-- 3. TRIGGER BEFORE UPDATE: HARDENING DE CAMPOS INMUTABLES Y ACCESO QR
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_protect_bookings_immutable_fields()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role text;
  v_caller_uid uuid;
BEGIN
  -- 1. Identificar al usuario autenticado de forma segura
  v_caller_uid := auth.uid();
  
  -- Si no hay sesión autenticada válida, se asigna rol restrictivo anónimo
  IF v_caller_uid IS NOT NULL THEN
    SELECT role INTO v_role 
    FROM public.profiles 
    WHERE id = v_caller_uid;
  ELSE
    v_role := 'anonymous';
  END IF;

  -- Excepción administrativa exclusiva: únicamente usuarios autenticados con rol admin verificado
  IF v_role = 'admin' THEN
    RETURN NEW;
  END IF;

  -- 2. Inmutabilidad de precios: total_amount nunca puede alterarse tras la creación
  IF NEW.total_amount IS DISTINCT FROM OLD.total_amount THEN
    RAISE EXCEPTION 'Violación de seguridad: El importe total (total_amount) es inmutable.';
  END IF;

  -- 3. Inmutabilidad de titularidad: user_id no puede ser transferido a otro usuario
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Violación de seguridad: El usuario creador (user_id) no puede modificarse.';
  END IF;

  -- 4. Inmutabilidad de destino: provider_id no puede ser alterado
  IF NEW.provider_id IS DISTINCT FROM OLD.provider_id THEN
    RAISE EXCEPTION 'Violación de seguridad: El proveedor asignado (provider_id) no puede modificarse.';
  END IF;

  -- 5. Inmutabilidad de entidades asociadas y tipo
  IF NEW.service_id IS DISTINCT FROM OLD.service_id THEN
    RAISE EXCEPTION 'Violación de seguridad: service_id es inmutable.';
  END IF;
  IF NEW.event_id IS DISTINCT FROM OLD.event_id THEN
    RAISE EXCEPTION 'Violación de seguridad: event_id es inmutable.';
  END IF;
  IF NEW.club_id IS DISTINCT FROM OLD.club_id THEN
    RAISE EXCEPTION 'Violación de seguridad: club_id es inmutable.';
  END IF;
  IF NEW.booking_type IS DISTINCT FROM OLD.booking_type THEN
    RAISE EXCEPTION 'Violación de seguridad: booking_type es inmutable.';
  END IF;

  -- 6. Inmutabilidad del token QR generado
  IF NEW.qr_code IS DISTINCT FROM OLD.qr_code AND OLD.qr_code IS NOT NULL THEN
    RAISE EXCEPTION 'Violación de seguridad: El código QR generado (qr_code) es inmutable.';
  END IF;

  -- 7. Inmutabilidad de fecha de creación
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Violación de seguridad: created_at es inmutable.';
  END IF;

  -- 8. Control estricto sobre qr_status = 'used':
  -- Solo el proveedor legítimo asignado, el dueño del club (Hangover Business) o un admin pueden marcar la entrada como usada en puerta
  IF NEW.qr_status = 'used' AND OLD.qr_status IS DISTINCT FROM 'used' THEN
    IF v_role <> 'admin' 
       AND (v_caller_uid IS NULL OR (
         v_caller_uid <> OLD.provider_id 
         AND NOT (OLD.club_id IS NOT NULL AND EXISTS (
           SELECT 1 FROM public.clubs 
           WHERE clubs.id = OLD.club_id 
           AND (
             clubs.provider_id = v_caller_uid 
             OR clubs.owner_id = v_caller_uid
             OR (clubs.business_id IS NOT NULL AND (
               EXISTS (
                 SELECT 1 FROM public.businesses b
                 WHERE b.id = clubs.business_id AND b.owner_id = v_caller_uid
               )
               OR EXISTS (
                 SELECT 1 FROM public.business_members bm
                 WHERE bm.business_id = clubs.business_id AND bm.user_id = v_caller_uid AND bm.is_active = true
               )
             ))
           )
         ))
       )) THEN
      RAISE EXCEPTION 'Violación de seguridad: Solo el proveedor asignado o el personal de acceso pueden validar y marcar un QR como usado.';
    END IF;
  END IF;

  -- 9. Protección de entradas ya consumidas:
  -- Una entrada que ya está 'used' no puede reactivarse, cancelarse ni rechazarse
  IF OLD.qr_status = 'used' THEN
    IF NEW.qr_status IS DISTINCT FROM 'used' THEN
      RAISE EXCEPTION 'Violación de seguridad: Una entrada ya utilizada no puede volver a activarse.';
    END IF;
    IF lower(NEW.status) IN ('cancelled', 'rejected') AND lower(OLD.status) NOT IN ('cancelled', 'rejected') THEN
      RAISE EXCEPTION 'Violación de seguridad: No se puede cancelar o rechazar una entrada ya utilizada.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_bookings_immutable_fields ON public.bookings;
CREATE TRIGGER trg_protect_bookings_immutable_fields
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_protect_bookings_immutable_fields();


-- ------------------------------------------------------------------------------
-- 4. TRIGGER BEFORE INSERT: VALIDACIÓN Y DERIVACIÓN ESTRICTA DE PRECIOS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_validate_bookings_on_insert()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role text;
  v_caller_uid uuid;
  v_service_price numeric;
  v_service_provider uuid;
  v_event_price numeric;
  v_event_creator uuid;
  v_club_cover numeric;
  v_club_provider uuid;
  v_qty integer;
  v_expected_amount numeric;
BEGIN
  -- 1. Identificar al usuario autenticado de forma segura
  v_caller_uid := auth.uid();
  
  IF v_caller_uid IS NOT NULL THEN
    SELECT role INTO v_role 
    FROM public.profiles 
    WHERE id = v_caller_uid;
  ELSE
    v_role := 'anonymous';
  END IF;

  -- Los administradores autenticados tienen bypass para gestión interna de soporte
  IF v_role = 'admin' THEN
    RETURN NEW;
  END IF;

  -- 2. Garantizar titularidad: user_id siempre debe ser el usuario autenticado
  IF v_caller_uid IS NOT NULL THEN
    NEW.user_id := v_caller_uid;
  END IF;

  -- 3. Forzar estado inicial activo del QR (nunca puede insertarse como 'used')
  NEW.qr_status := 'active';

  -- 4. Normalizar cantidad de personas (mínimo 1)
  v_qty := GREATEST(1, COALESCE(NEW.number_of_people, 1));
  NEW.number_of_people := v_qty;

  -- 5. Derivación estricta y conjunta de entidad, proveedor, cantidad y precio:

  -- CASO A: Servicios (booking_type = 'service' o service_id presente)
  IF NEW.service_id IS NOT NULL THEN
    SELECT price, provider_id 
    INTO v_service_price, v_service_provider
    FROM public.services 
    WHERE id = NEW.service_id;

    IF v_service_provider IS NULL THEN
      RAISE EXCEPTION 'El servicio seleccionado no existe o no es válido.';
    END IF;

    -- Forzar proveedor auténtico y estado inicial PENDING (requiere aprobación)
    NEW.provider_id := v_service_provider;
    NEW.status := 'PENDING';
    
    -- Calcular monto oficial estricto. Se ignora cualquier valor manipulado (cero o distinto de cero)
    v_expected_amount := ROUND((COALESCE(v_service_price, 0) * v_qty)::numeric, 2);
    NEW.total_amount := v_expected_amount;

  -- CASO B: Eventos (booking_type = 'event' o event_id presente)
  ELSIF NEW.event_id IS NOT NULL THEN
    SELECT ticket_price, creator_id 
    INTO v_event_price, v_event_creator
    FROM public.events 
    WHERE id = NEW.event_id;

    IF v_event_creator IS NULL THEN
      RAISE EXCEPTION 'El evento seleccionado no existe o no es válido.';
    END IF;

    NEW.provider_id := v_event_creator;
    v_expected_amount := ROUND((COALESCE(v_event_price, 0) * v_qty)::numeric, 2);
    NEW.total_amount := v_expected_amount;

    -- En el flujo actual de compra de entradas, el estado inicial es 'PAID' (simulado)
    IF NEW.status IS NULL OR upper(NEW.status) NOT IN ('PAID', 'CONFIRMED', 'PENDING') THEN
      NEW.status := 'PAID';
    ELSE
      NEW.status := UPPER(NEW.status);
    END IF;

  -- CASO C: Discotecas (club_id presente)
  ELSIF NEW.club_id IS NOT NULL THEN
    SELECT cover_price, provider_id 
    INTO v_club_cover, v_club_provider
    FROM public.clubs 
    WHERE id = NEW.club_id;

    IF v_club_provider IS NULL THEN
      RAISE EXCEPTION 'La discoteca seleccionada no existe o no tiene proveedor asignado.';
    END IF;

    NEW.provider_id := v_club_provider;

    IF NEW.booking_type = 'club_vip' THEN
      -- Reserva VIP (Mesa): siempre inicia en estado 'PENDING' (requiere confirmación)
      NEW.status := 'PENDING';
      -- Compatibilidad: Web envía (personas * 100) como depósito referencial; App-Hangover envía 0.
      -- Se conserva el valor si viene 0 o el cálculo web; si es nulo o negativo se establece en (personas * 100).
      IF NEW.total_amount IS NULL OR NEW.total_amount < 0 THEN
        NEW.total_amount := ROUND((v_qty * 100.00)::numeric, 2);
      END IF;
    ELSIF NEW.booking_type = 'club_cover' THEN
      v_expected_amount := ROUND((COALESCE(v_club_cover, 0) * v_qty)::numeric, 2);
      NEW.total_amount := v_expected_amount;
      -- Si es compra directa simulada se asigna 'PAID'; si es solicitud se asigna 'PENDING'
      IF NEW.status IS NULL OR upper(NEW.status) IN ('PAID', 'CONFIRMED') THEN
        NEW.status := 'PAID';
      ELSE
        NEW.status := 'PENDING';
      END IF;
    ELSE
      RAISE EXCEPTION 'Violación de seguridad: El tipo de reserva para discoteca debe ser club_vip o club_cover.';
    END IF;

  -- CASO D: Sin entidad asociada válida -> Bloqueo estricto de reservas huérfanas
  ELSE
    RAISE EXCEPTION 'Violación de seguridad: La reserva debe estar vinculada a un servicio, evento o discoteca válido.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_bookings_on_insert ON public.bookings;
CREATE TRIGGER trg_validate_bookings_on_insert
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_validate_bookings_on_insert();


-- ------------------------------------------------------------------------------
-- 5. POLÍTICAS RLS PRECISAS PARA PUBLIC.BOOKINGS
-- ------------------------------------------------------------------------------

-- A. POLÍTICA DE CONSULTA (SELECT):
-- Conserva el acceso legítimo: usuarios ven sus reservas, proveedores las suyas,
-- dueños de clubs (Hangover Business) ven las de su discoteca y administradores todas.
CREATE POLICY "Users and providers can view own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR auth.uid() = provider_id
  OR (
    club_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id = bookings.club_id
      AND (
        clubs.provider_id = auth.uid() 
        OR clubs.owner_id = auth.uid()
        OR (clubs.business_id IS NOT NULL AND (
          EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = clubs.business_id AND b.owner_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.business_members bm
            WHERE bm.business_id = clubs.business_id AND bm.user_id = auth.uid() AND bm.is_active = true
          )
        ))
      )
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- B. POLÍTICA DE INSERCIÓN (INSERT):
-- Permite inserciones donde user_id sea el usuario autenticado (el trigger blinda precios y proveedores).
CREATE POLICY "Authenticated users can insert bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('provider', 'admin')
  )
);

-- C. POLÍTICA DE ACTUALIZACIÓN: CANCELACIÓN POR CLIENTE
-- Un cliente solo puede cancelar reservas propias pendientes/aceptadas con QR activo.
CREATE POLICY "Clients can cancel own unconsumed bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND lower(coalesce(qr_status, 'active')) = 'active'
  AND lower(status) IN ('pending', 'accepted')
)
WITH CHECK (
  auth.uid() = user_id
  AND lower(status) IN ('cancelled', 'rejected')
);

-- D. POLÍTICA DE ACTUALIZACIÓN: PAGO SIMULADO DE RESERVAS ACEPTADAS
-- Un cliente solo puede realizar el pago simulado si el proveedor ya aceptó la reserva.
CREATE POLICY "Clients can pay accepted bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND lower(status) = 'accepted'
  AND lower(coalesce(qr_status, 'active')) = 'active'
)
WITH CHECK (
  auth.uid() = user_id
  AND lower(status) IN ('paid', 'confirmed')
);

-- E. POLÍTICA DE ACTUALIZACIÓN: GESTIÓN POR PROVEEDOR Y CLUB (HANGOVER BUSINESS)
-- El proveedor asignado o el dueño del club pueden gestionar reservas asociadas.
CREATE POLICY "Providers can manage assigned bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  auth.uid() = provider_id
  OR (
    club_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id = bookings.club_id
      AND (
        clubs.provider_id = auth.uid() 
        OR clubs.owner_id = auth.uid()
        OR (clubs.business_id IS NOT NULL AND (
          EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = clubs.business_id AND b.owner_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.business_members bm
            WHERE bm.business_id = clubs.business_id AND bm.user_id = auth.uid() AND bm.is_active = true
          )
        ))
      )
    )
  )
)
WITH CHECK (
  auth.uid() = provider_id
  OR (
    club_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id = bookings.club_id
      AND (
        clubs.provider_id = auth.uid() 
        OR clubs.owner_id = auth.uid()
        OR (clubs.business_id IS NOT NULL AND (
          EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = clubs.business_id AND b.owner_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.business_members bm
            WHERE bm.business_id = clubs.business_id AND bm.user_id = auth.uid() AND bm.is_active = true
          )
        ))
      )
    )
  )
);

-- F. POLÍTICA DE ACTUALIZACIÓN: ADMINISTRADORES
CREATE POLICY "Admins have full update access on bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- G. POLÍTICA DE ELIMINACIÓN (DELETE):
-- Solo administradores pueden eliminar registros (auditoría obligatoria).
CREATE POLICY "Admins can delete bookings"
ON public.bookings
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

COMMIT;


-- ==============================================================================
-- ESTRATEGIA Y PROCEDIMIENTO DE ROLLBACK (REVERSIÓN CONTROLADA)
-- ==============================================================================
-- ADVERTENCIA DE SEGURIDAD:
-- NO se recomienda restaurar la política permisiva 'Users and providers can update bookings',
-- ya que permitiría nuevamente que cualquier usuario altere precios y estados mediante llamadas
-- directas a PostgREST.
--
-- Si se requiere revertir esta migración de forma segura:
-- 1. Desactivar los triggers nuevos.
-- 2. Eliminar las políticas granulares v1.4.
-- 3. Mantener las políticas legítimas de SELECT e INSERT intactas.
--
-- SCRIPT DE REVERSIÓN CONTROLADA:
/*
BEGIN;

-- Paso 1: Eliminar Triggers de seguridad
DROP TRIGGER IF EXISTS trg_protect_bookings_immutable_fields ON public.bookings;
DROP FUNCTION IF EXISTS public.fn_protect_bookings_immutable_fields();

DROP TRIGGER IF EXISTS trg_validate_bookings_on_insert ON public.bookings;
DROP FUNCTION IF EXISTS public.fn_validate_bookings_on_insert();

-- Paso 2: Eliminar Políticas Granulares Nuevas
DROP POLICY IF EXISTS "Clients can cancel own unconsumed bookings" ON public.bookings;
DROP POLICY IF EXISTS "Clients can pay accepted bookings" ON public.bookings;
DROP POLICY IF EXISTS "Providers can manage assigned bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins have full update access on bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON public.bookings;

-- Paso 3: Restaurar SELECT e INSERT originales documentados en booking-integration.sql
DROP POLICY IF EXISTS "Users and providers can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings"
ON public.bookings FOR SELECT TO authenticated
USING (auth.uid() = user_id OR auth.uid() = provider_id);

DROP POLICY IF EXISTS "Authenticated users can insert bookings" ON public.bookings;
CREATE POLICY "Authenticated users can insert bookings"
ON public.bookings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- NOTA: Si de emergencia se requiere habilitar el UPDATE histórico, descomentar la siguiente
-- sentencia, asumiendo conscientemente el riesgo de alteración de columnas hasta su reemplazo:
-- CREATE POLICY "Users and providers can update bookings"
-- ON public.bookings FOR UPDATE TO authenticated
-- USING (auth.uid() = user_id OR auth.uid() = provider_id)
-- WITH CHECK (auth.uid() = user_id OR auth.uid() = provider_id);

COMMIT;
*/
