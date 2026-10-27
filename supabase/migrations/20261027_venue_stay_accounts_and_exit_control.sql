-- ==============================================================================
-- HANGOVER PLATFORM — CUENTA ABIERTA POR ESTANCIA, CONSUMOS ACUMULADOS Y BLOQUEO DE SALIDA
-- Archivo: supabase/migrations/20261027_venue_stay_accounts_and_exit_control.sql
-- ==============================================================================
-- 1. TABLA: public.venue_accounts (Cuenta única por estancia y usuario en discoteca)
-- 2. TABLA: public.venue_account_entries (Ledger inmutable de cargos y pagos verificados)
-- 3. POLÍTICAS RLS ESTRICTAS (Solo lectura filtrada, mutaciones exclusivamente por RPC)
-- 4. RPCs SEGURAS:
--    - get_or_create_open_venue_account
--    - record_venue_account_charge_for_order (llamado automáticamente al completar orden)
--    - record_venue_account_payment (pago verificado por personal de caja/barra)
--    - finalize_venue_stay (validación autoritativa de saldo cero para permitir salida)
--    - get_my_active_venue_account (consulta de cuenta y movimientos para Users)
--    - get_club_venue_accounts (consulta de cuentas de estancia para Business)
-- ==============================================================================

-- 1. TABLA: venue_accounts
CREATE TABLE IF NOT EXISTS public.venue_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  presence_id UUID REFERENCES public.connect_presence(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'pending_payment', 'paid', 'closed')) DEFAULT 'open',
  total_charged DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_charged >= 0),
  total_paid DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_paid >= 0),
  balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  payment_reference TEXT,
  payment_method TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de Integridad y Rendimiento
-- Restricción única: Un usuario solo puede tener UNA cuenta activa (abierta o pendiente de pago) por discoteca a la vez
CREATE UNIQUE INDEX IF NOT EXISTS idx_uq_venue_account_open_user_club 
  ON public.venue_accounts (user_id, club_id) 
  WHERE (status IN ('open', 'pending_payment'));

CREATE INDEX IF NOT EXISTS idx_venue_accounts_club_status ON public.venue_accounts(club_id, status);
CREATE INDEX IF NOT EXISTS idx_venue_accounts_user_status ON public.venue_accounts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_venue_accounts_presence ON public.venue_accounts(presence_id);


-- 2. TABLA: venue_account_entries (Ledger inmutable de movimientos)
CREATE TABLE IF NOT EXISTS public.venue_account_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.venue_accounts(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.venue_orders(id) ON DELETE SET NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('charge', 'payment', 'adjustment')),
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  items_summary TEXT,
  items_detail JSONB,
  payment_method TEXT, -- 'cash', 'card_terminal', 'transfer', 'wompi'
  operator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  reference_entry_id UUID REFERENCES public.venue_account_entries(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Idempotencia estricta: Un pedido confirmado solo puede generar un cargo UNA sola vez en todo el sistema
CREATE UNIQUE INDEX IF NOT EXISTS idx_uq_venue_account_entries_order 
  ON public.venue_account_entries (order_id) 
  WHERE (entry_type = 'charge' AND order_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_venue_account_entries_account ON public.venue_account_entries(account_id, created_at);


-- 3. POLÍTICAS RLS ESTRICTAS
ALTER TABLE public.venue_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_account_entries ENABLE ROW LEVEL SECURITY;

-- Consultas sobre venue_accounts
DROP POLICY IF EXISTS "Usuarios y discotecas pueden consultar sus cuentas" ON public.venue_accounts;
CREATE POLICY "Usuarios y discotecas pueden consultar sus cuentas"
  ON public.venue_accounts
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.clubs c
      WHERE c.id = venue_accounts.club_id
        AND (c.provider_id = auth.uid() OR c.business_id = auth.uid())
    )
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- No se conceden políticas de INSERT, UPDATE o DELETE directo a authenticated o anon.
-- Todas las mutaciones financieras son autoritativas y se gestionan por funciones SECURITY DEFINER.

-- Consultas sobre venue_account_entries
DROP POLICY IF EXISTS "Usuarios y discotecas pueden consultar movimientos de cuenta" ON public.venue_account_entries;
CREATE POLICY "Usuarios y discotecas pueden consultar movimientos de cuenta"
  ON public.venue_account_entries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.venue_accounts va
      WHERE va.id = venue_account_entries.account_id
        AND (
          va.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.clubs c
            WHERE c.id = va.club_id
              AND (c.provider_id = auth.uid() OR c.business_id = auth.uid())
          )
        )
    )
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );


-- 4. FUNCIÓN INTERNA: Obtener o crear cuenta abierta por estancia (Idempotente)
CREATE OR REPLACE FUNCTION public.get_or_create_open_venue_account(
  p_user_id UUID,
  p_club_id UUID,
  p_presence_id UUID DEFAULT NULL,
  p_booking_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_account_id UUID;
  v_presence_id UUID := p_presence_id;
  v_booking_id UUID := p_booking_id;
BEGIN
  -- 1. Buscar si ya existe una cuenta abierta o pendiente para esta estancia/usuario
  SELECT id INTO v_account_id
  FROM public.venue_accounts
  WHERE user_id = p_user_id
    AND club_id = p_club_id
    AND status IN ('open', 'pending_payment')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_account_id IS NOT NULL THEN
    RETURN v_account_id;
  END IF;

  -- 2. Si no se proveyó presence_id, intentar resolverlo desde connect_presence activa
  IF v_presence_id IS NULL THEN
    SELECT id, booking_id INTO v_presence_id, v_booking_id
    FROM public.connect_presence
    WHERE user_id = p_user_id
      AND club_id = p_club_id
      AND status != 'checked_out'
      AND expires_at > timezone('utc'::text, now())
    LIMIT 1;
  END IF;

  -- 3. Crear la nueva cuenta de consumo para esta estancia
  INSERT INTO public.venue_accounts (
    user_id,
    club_id,
    presence_id,
    booking_id,
    status,
    total_charged,
    total_paid,
    balance,
    opened_at
  ) VALUES (
    p_user_id,
    p_club_id,
    v_presence_id,
    v_booking_id,
    'open',
    0.00,
    0.00,
    0.00,
    timezone('utc'::text, now())
  )
  RETURNING id INTO v_account_id;

  RETURN v_account_id;
END;
$$;


-- 5. FUNCIÓN INTERNA: Registrar cargo inmutable por pedido confirmado
CREATE OR REPLACE FUNCTION public.record_venue_account_charge_for_order(
  p_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order RECORD;
  v_account_id UUID;
  v_existing_entry UUID;
  v_items_summary TEXT;
  v_items_detail JSONB;
BEGIN
  -- 1. Consultar pedido con bloqueo
  SELECT * INTO v_order
  FROM public.venue_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El pedido % no existe.', p_order_id;
  END IF;

  IF v_order.status != 'completed' THEN
    RAISE EXCEPTION 'Solo pedidos en estado completado pueden generar cargos (estado actual: %).', v_order.status;
  END IF;

  IF v_order.customer_id IS NULL THEN
    -- Pedido sin usuario autenticado vinculado
    RETURN jsonb_build_object('success', false, 'reason', 'NO_CUSTOMER_ID');
  END IF;

  -- 2. Idempotencia: Verificar si ya existe cargo registrado para esta orden
  SELECT id INTO v_existing_entry
  FROM public.venue_account_entries
  WHERE order_id = p_order_id
    AND entry_type = 'charge'
  LIMIT 1;

  IF v_existing_entry IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_charged', true,
      'entry_id', v_existing_entry
    );
  END IF;

  -- 3. Obtener o abrir la cuenta de estancia para este cliente
  v_account_id := public.get_or_create_open_venue_account(v_order.customer_id, v_order.club_id);

  -- 4. Construir resumen estructurado e inmutable de los productos del pedido
  SELECT 
    string_agg(quantity || 'x ' || product_name || COALESCE(' (' || variant_name || ')', ''), ', '),
    jsonb_agg(jsonb_build_object(
      'product_name', product_name,
      'variant_name', variant_name,
      'quantity', quantity,
      'unit_price', unit_price,
      'subtotal', subtotal,
      'notes', notes
    ))
  INTO v_items_summary, v_items_detail
  FROM public.venue_order_items
  WHERE order_id = p_order_id;

  -- 5. Insertar movimiento inmutable de cargo en el ledger
  INSERT INTO public.venue_account_entries (
    account_id,
    order_id,
    entry_type,
    amount,
    items_summary,
    items_detail,
    notes,
    created_at
  ) VALUES (
    v_account_id,
    p_order_id,
    'charge',
    v_order.total,
    COALESCE(v_items_summary, 'Consumo en salón #' || v_order.order_number),
    COALESCE(v_items_detail, '[]'::jsonb),
    'Cargo automático por entrega confirmada #' || v_order.order_number,
    timezone('utc'::text, now())
  );

  -- 6. Recalcular saldo acumulado de forma autoritativa en el servidor
  UPDATE public.venue_accounts
  SET
    total_charged = total_charged + v_order.total,
    balance = balance + v_order.total,
    status = 'open',
    updated_at = timezone('utc'::text, now())
  WHERE id = v_account_id;

  RETURN jsonb_build_object(
    'success', true,
    'account_id', v_account_id,
    'order_id', p_order_id,
    'charged_amount', v_order.total
  );
END;
$$;


-- 6. ACTUALIZACIÓN ATÓMICA DE confirm_venue_order_delivery
-- Al confirmar la entrega física por parte del cliente, pasa a 'completed'
-- y registra atómicamente el cargo en su cuenta de estancia.
CREATE OR REPLACE FUNCTION public.confirm_venue_order_delivery(
  p_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order RECORD;
  v_auth_user UUID := auth.uid();
  v_charge_res JSONB;
BEGIN
  -- 1. Validar autenticación
  IF v_auth_user IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado. Debe iniciar sesión para confirmar la comanda.';
  END IF;

  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'ID de pedido no especificado.';
  END IF;

  -- 2. Consultar el pedido con bloqueo de fila
  SELECT * INTO v_order
  FROM public.venue_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El pedido especificado no existe.';
  END IF;

  -- 3. Validar que el usuario autenticado sea el dueño real del pedido
  IF v_order.customer_id IS NULL OR v_order.customer_id != v_auth_user THEN
    RAISE EXCEPTION 'No tienes autorización para confirmar este pedido. Solo el cliente que realizó la orden puede confirmarla.';
  END IF;

  -- 4. Idempotencia: Si ya está completado, retornar confirmación sin error
  IF v_order.status = 'completed' THEN
    -- Asegurar que el cargo esté asentado si faltó
    PERFORM public.record_venue_account_charge_for_order(p_order_id);
    RETURN jsonb_build_object(
      'success', true,
      'order_id', v_order.id,
      'order_number', v_order.order_number,
      'status', 'completed',
      'already_confirmed', true,
      'message', 'El pedido ya fue confirmado previamente.'
    );
  END IF;

  -- 5. Validar que el establecimiento ya haya registrado la entrega física
  IF v_order.status != 'delivered' THEN
    RAISE EXCEPTION 'El pedido aún no ha sido marcado como entregado por el establecimiento (estado actual: %).', v_order.status;
  END IF;

  -- 6. Actualizar el pedido a completed
  UPDATE public.venue_orders
  SET
    status = 'completed',
    confirmed_at = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now())
  WHERE id = p_order_id;

  -- 7. Asentar atómicamente el cargo en la cuenta de la estancia
  v_charge_res := public.record_venue_account_charge_for_order(p_order_id);

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'status', 'completed',
    'confirmed_at', timezone('utc'::text, now()),
    'account_charge', v_charge_res
  );
END;
$$;


-- 7. RPC: REGISTRO DE PAGO VERIFICADO (Ejecutado por personal autorizado en Business)
CREATE OR REPLACE FUNCTION public.record_venue_account_payment(
  p_account_id UUID,
  p_amount DECIMAL,
  p_payment_method TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_account RECORD;
  v_auth_user UUID := auth.uid();
  v_is_authorized BOOLEAN := false;
  v_clean_method TEXT;
  v_new_paid DECIMAL(12, 2);
  v_new_balance DECIMAL(12, 2);
  v_new_status TEXT;
  v_entry_id UUID;
BEGIN
  -- 1. Validar autenticación
  IF v_auth_user IS NULL THEN
    RAISE EXCEPTION 'No autenticado.';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'El importe de pago debe ser mayor a 0.';
  END IF;

  v_clean_method := LOWER(TRIM(COALESCE(p_payment_method, 'cash')));
  IF v_clean_method NOT IN ('cash', 'card_terminal', 'transfer', 'wompi', 'other') THEN
    v_clean_method := 'cash';
  END IF;

  -- 2. Consultar cuenta con bloqueo
  SELECT * INTO v_account
  FROM public.venue_accounts
  WHERE id = p_account_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La cuenta de estancia indicada no existe.';
  END IF;

  -- 3. Validar permisos del operador (Debe ser dueño o staff de la discoteca, o admin)
  SELECT true INTO v_is_authorized
  FROM public.clubs c
  WHERE c.id = v_account.club_id
    AND (c.provider_id = v_auth_user OR c.business_id = v_auth_user)
  LIMIT 1;

  IF NOT v_is_authorized THEN
    IF (SELECT role FROM public.profiles WHERE id = v_auth_user) = 'admin' THEN
      v_is_authorized := true;
    END IF;
  END IF;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'No tienes autorización para registrar pagos en esta discoteca.';
  END IF;

  -- 4. Validar estado de la cuenta
  IF v_account.status = 'closed' THEN
    RAISE EXCEPTION 'No se pueden registrar pagos en una cuenta que ya ha sido cerrada.';
  END IF;

  -- 5. Calcular nuevo balance y estado
  v_new_paid := v_account.total_paid + p_amount;
  v_new_balance := GREATEST(0.00, v_account.total_charged - v_new_paid);

  IF v_new_balance = 0.00 THEN
    v_new_status := 'paid';
  ELSE
    v_new_status := 'pending_payment';
  END IF;

  -- 6. Insertar movimiento inmutable de pago en el ledger
  INSERT INTO public.venue_account_entries (
    account_id,
    entry_type,
    amount,
    payment_method,
    operator_id,
    notes,
    created_at
  ) VALUES (
    p_account_id,
    'payment',
    p_amount,
    v_clean_method,
    v_auth_user,
    COALESCE(p_notes, 'Pago registrado en caja (' || v_clean_method || ')'),
    timezone('utc'::text, now())
  )
  RETURNING id INTO v_entry_id;

  -- 7. Actualizar totales y estado en venue_accounts
  UPDATE public.venue_accounts
  SET
    total_paid = v_new_paid,
    balance = v_new_balance,
    status = v_new_status,
    payment_method = v_clean_method,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_account_id;

  RETURN jsonb_build_object(
    'success', true,
    'account_id', p_account_id,
    'entry_id', v_entry_id,
    'amount_paid', p_amount,
    'total_paid', v_new_paid,
    'remaining_balance', v_new_balance,
    'status', v_new_status
  );
END;
$$;


-- 8. RPC: CONTROL DE SALIDA Y FINALIZAR ESTANCIA (Ejecutado desde Hangover Users)
-- Bloquea la salida de forma estricta si el saldo calculado por el servidor es mayor a 0.
CREATE OR REPLACE FUNCTION public.finalize_venue_stay(
  p_club_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_auth_user UUID := auth.uid();
  v_account RECORD;
  v_presence RECORD;
  v_calculated_balance DECIMAL(12, 2);
  v_pending_orders_count INT;
BEGIN
  -- 1. Validar autenticación
  IF v_auth_user IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado.';
  END IF;

  -- 2. Verificar si hay pedidos en preparación o listos no entregados
  SELECT COUNT(*) INTO v_pending_orders_count
  FROM public.venue_orders
  WHERE customer_id = v_auth_user
    AND club_id = p_club_id
    AND status IN ('pending', 'accepted', 'in_preparation', 'ready', 'delivered');

  IF v_pending_orders_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ORDERS_PENDING',
      'error', 'Tienes ' || v_pending_orders_count || ' comanda(s) activas o pendientes de entrega. Confirma o cancela tus pedidos antes de solicitar la salida.'
    );
  END IF;

  -- 3. Consultar cuenta abierta de la estancia con bloqueo
  SELECT * INTO v_account
  FROM public.venue_accounts
  WHERE user_id = v_auth_user
    AND club_id = p_club_id
    AND status IN ('open', 'pending_payment', 'paid')
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  -- 4. Si existe cuenta, calcular saldo autoritativo a partir del ledger de entradas
  IF v_account IS NOT NULL THEN
    SELECT COALESCE(
      SUM(CASE WHEN entry_type = 'charge' THEN amount WHEN entry_type = 'payment' THEN -amount ELSE 0 END),
      0.00
    ) INTO v_calculated_balance
    FROM public.venue_account_entries
    WHERE account_id = v_account.id;

    -- REGLA CRÍTICA: Bloquear salida si el saldo pendiente es mayor a cero
    IF v_calculated_balance > 0.00 THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'OUTSTANDING_BALANCE',
        'error', 'No puedes finalizar tu estancia. Tienes un saldo pendiente de $' || to_char(v_calculated_balance, 'FM999,999,990') || ' COP. Debes cancelarlo en el bar antes de salir.',
        'balance', v_calculated_balance,
        'account_id', v_account.id
      );
    END IF;

    -- Cerrar la cuenta de forma definitiva
    UPDATE public.venue_accounts
    SET
      status = 'closed',
      balance = 0.00,
      closed_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now())
    WHERE id = v_account.id;
  END IF;

  -- 5. Finalizar presencia activa en connect_presence
  UPDATE public.connect_presence
  SET
    expires_at = timezone('utc'::text, now()),
    last_seen_at = timezone('utc'::text, now())
  WHERE user_id = v_auth_user
    AND club_id = p_club_id;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'CHECKED_OUT',
    'message', 'Estancia finalizada con éxito. ¡Gracias por visitarnos!',
    'closed_at', timezone('utc'::text, now())
  );
END;
$$;


-- 9. RPC: CONSULTAR MI CUENTA ACTIVA Y MOVIMIENTOS (Hangover Users)
CREATE OR REPLACE FUNCTION public.get_my_active_venue_account(
  p_club_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_auth_user UUID := auth.uid();
  v_account RECORD;
  v_entries JSONB;
BEGIN
  IF v_auth_user IS NULL THEN
    RETURN jsonb_build_object('account', null, 'entries', '[]'::jsonb);
  END IF;

  SELECT * INTO v_account
  FROM public.venue_accounts
  WHERE user_id = v_auth_user
    AND club_id = p_club_id
    AND status IN ('open', 'pending_payment', 'paid')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_account IS NULL THEN
    RETURN jsonb_build_object('account', null, 'entries', '[]'::jsonb);
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'order_id', order_id,
        'entry_type', entry_type,
        'amount', amount,
        'items_summary', items_summary,
        'items_detail', items_detail,
        'payment_method', payment_method,
        'notes', notes,
        'created_at', created_at
      ) ORDER BY created_at DESC
    ),
    '[]'::jsonb
  ) INTO v_entries
  FROM public.venue_account_entries
  WHERE account_id = v_account.id;

  RETURN jsonb_build_object(
    'account', jsonb_build_object(
      'id', v_account.id,
      'club_id', v_account.club_id,
      'status', v_account.status,
      'total_charged', v_account.total_charged,
      'total_paid', v_account.total_paid,
      'balance', v_account.balance,
      'opened_at', v_account.opened_at,
      'payment_reference', v_account.payment_reference
    ),
    'entries', v_entries
  );
END;
$$;


-- 10. RPC: CONSULTAR CUENTAS DE SALA POR ESTANCIA (Hangover Business)
CREATE OR REPLACE FUNCTION public.get_club_venue_accounts(
  p_club_id UUID,
  p_status_filter TEXT DEFAULT 'active'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_auth_user UUID := auth.uid();
  v_is_authorized BOOLEAN := false;
  v_accounts JSONB;
BEGIN
  IF v_auth_user IS NULL THEN
    RAISE EXCEPTION 'No autenticado.';
  END IF;

  -- Validar permisos de discoteca
  SELECT true INTO v_is_authorized
  FROM public.clubs c
  WHERE c.id = p_club_id
    AND (c.provider_id = v_auth_user OR c.business_id = v_auth_user)
  LIMIT 1;

  IF NOT v_is_authorized THEN
    IF (SELECT role FROM public.profiles WHERE id = v_auth_user) = 'admin' THEN
      v_is_authorized := true;
    END IF;
  END IF;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'No tienes permisos para ver las cuentas de este establecimiento.';
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', va.id,
        'user_id', va.user_id,
        'customer_name', COALESCE(p.full_name, 'Cliente'),
        'customer_phone', p.phone,
        'status', va.status,
        'total_charged', va.total_charged,
        'total_paid', va.total_paid,
        'balance', va.balance,
        'opened_at', va.opened_at,
        'closed_at', va.closed_at,
        'entries_count', (SELECT COUNT(*) FROM public.venue_account_entries WHERE account_id = va.id)
      ) ORDER BY va.opened_at DESC
    ),
    '[]'::jsonb
  ) INTO v_accounts
  FROM public.venue_accounts va
  LEFT JOIN public.profiles p ON p.id = va.user_id
  WHERE va.club_id = p_club_id
    AND (
      (p_status_filter = 'active' AND va.status IN ('open', 'pending_payment')) OR
      (p_status_filter = 'paid' AND va.status = 'paid') OR
      (p_status_filter = 'closed' AND va.status = 'closed') OR
      (p_status_filter = 'all') OR
      (va.status = p_status_filter)
    );

  RETURN v_accounts;
END;
$$;


-- 11. PERMISOS DE EJECUCIÓN SOBRE FUNCIONES
REVOKE ALL ON FUNCTION public.get_or_create_open_venue_account(UUID, UUID, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_or_create_open_venue_account(UUID, UUID, UUID, UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.record_venue_account_charge_for_order(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_venue_account_charge_for_order(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.record_venue_account_payment(UUID, DECIMAL, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_venue_account_payment(UUID, DECIMAL, TEXT, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.finalize_venue_stay(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_venue_stay(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_my_active_venue_account(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_active_venue_account(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_club_venue_accounts(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_club_venue_accounts(UUID, TEXT) TO authenticated, service_role;


-- 12. TRIGGER DE SEGURIDAD CONTRA OMISIÓN DE CARGOS:
-- Garantiza que cualquier transición de una comanda a 'completed' (por RPC o fallback)
-- asiente obligatoriamente e idempotentemente su cargo en la cuenta de la estancia.
CREATE OR REPLACE FUNCTION public.trg_record_venue_order_charge()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM public.record_venue_account_charge_for_order(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_venue_orders_charge_account ON public.venue_orders;
CREATE TRIGGER trg_venue_orders_charge_account
  AFTER UPDATE OF status ON public.venue_orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.trg_record_venue_order_charge();


-- 13. HABILITACIÓN DE REPLICACIÓN SUPABASE REALTIME
ALTER TABLE public.venue_accounts REPLICA IDENTITY FULL;
ALTER TABLE public.venue_account_entries REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'venue_accounts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.venue_accounts;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'venue_account_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.venue_account_entries;
  END IF;
END $$;

