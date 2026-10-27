-- ==============================================================================
-- HANGOVER PLATFORM — CIERRE AUTOMÁTICO DE ESTANCIAS AL CERRAR LA DISCOTECA
-- Archivo: supabase/migrations/20261027_auto_finalize_stays_on_club_close.sql
-- ==============================================================================
-- 1. FUNCIÓN: finalize_all_club_stays (Finalización automática autoritativa de estancias)
-- 2. FUNCIÓN Y TRIGGER: handle_club_operational_status_change (Disparador en clubs.modules_config)
-- 3. FUNCIÓN RPC: set_club_operational_status (Actualización de estado operativo con cierre atómico)
-- 4. FUNCIÓN RPC: finalize_venue_stay (Control de salida con validación de cierre de discoteca)
-- 5. FUNCIÓN RPC: get_my_active_venue_account (Consulta con estado operativo de discoteca y estancia)
-- ==============================================================================

-- 1. FUNCIÓN: finalize_all_club_stays
-- Finaliza de forma atómica y segura todas las estancias digitales de una discoteca al cerrar
-- REGLA CRÍTICA: NO BORRAR NI LIQUIDAR DEUDAS PENDIENTES.
CREATE OR REPLACE FUNCTION public.finalize_all_club_stays(
  p_club_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_presence_closed_count INT := 0;
  v_accounts_closed_count INT := 0;
  v_accounts_pending_debt_count INT := 0;
  v_orders_cancelled_count INT := 0;
  v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
  -- Validar parámetro
  IF p_club_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ID de discoteca no proporcionado.');
  END IF;

  -- 1.1 Finalizar automáticamente todas las presencias activas en connect_presence expirando expires_at
  -- REGLA: connect_presence.status solo admite ('available', 'observing', 'do_not_disturb').
  -- La presencia se expira legítimamente asignando expires_at = v_now y actualizando last_seen_at.
  WITH updated_presence AS (
    UPDATE public.connect_presence
    SET
      expires_at = v_now,
      last_seen_at = v_now
    WHERE club_id = p_club_id
      AND expires_at > v_now
    RETURNING id
  )
  SELECT COUNT(*) INTO v_presence_closed_count FROM updated_presence;

  -- 1.2 Cuentas con saldo CERO (<= 0.00): Pasarlas a 'closed'
  WITH closed_acc AS (
    UPDATE public.venue_accounts
    SET
      status = 'closed',
      closed_at = v_now,
      updated_at = v_now
    WHERE club_id = p_club_id
      AND status IN ('open', 'paid')
      AND COALESCE(balance, 0.00) <= 0.00
    RETURNING id
  )
  SELECT COUNT(*) INTO v_accounts_closed_count FROM closed_acc;

  -- 1.3 Cuentas con saldo PENDIENTE (> 0.00): Pasarlas a 'pending_payment'
  -- REGLA CRÍTICA: NO BORRAR LAS DEUDAS. Se conservan intactos total_charged, total_paid, balance y entries.
  WITH pending_acc AS (
    UPDATE public.venue_accounts
    SET
      status = 'pending_payment',
      updated_at = v_now
    WHERE club_id = p_club_id
      AND status = 'open'
      AND COALESCE(balance, 0.00) > 0.00
    RETURNING id
  )
  SELECT COUNT(*) INTO v_accounts_pending_debt_count FROM pending_acc;

  -- 1.4 Cancelar pedidos que hayan quedado en preparación o pendientes que nunca fueron entregados
  WITH cancelled_ord AS (
    UPDATE public.venue_orders
    SET
      status = 'cancelled',
      notes = COALESCE(notes || ' | ', '') || 'Cancelado automáticamente por cierre de discoteca',
      updated_at = v_now
    WHERE club_id = p_club_id
      AND status IN ('pending', 'accepted', 'in_preparation')
    RETURNING id
  )
  SELECT COUNT(*) INTO v_orders_cancelled_count FROM cancelled_ord;

  RETURN jsonb_build_object(
    'success', true,
    'club_id', p_club_id,
    'presence_closed', v_presence_closed_count,
    'accounts_closed', v_accounts_closed_count,
    'accounts_with_debt_preserved', v_accounts_pending_debt_count,
    'orders_cancelled', v_orders_cancelled_count,
    'closed_at', v_now
  );
END;
$$;

-- 2. TRIGGER: handle_club_operational_status_change
-- Ejecuta automáticamente finalize_all_club_stays cuando el estado de la discoteca cambia a CERRADA
CREATE OR REPLACE FUNCTION public.handle_club_operational_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_old_open BOOLEAN;
  v_new_open BOOLEAN;
BEGIN
  v_old_open := COALESCE((OLD.modules_config->>'is_open')::boolean, false);
  v_new_open := COALESCE((NEW.modules_config->>'is_open')::boolean, false);

  -- Si el estado operativo cambió a cerrado o is_open pasó a false
  IF (v_old_open = true AND v_new_open = false) OR 
     (NEW.modules_config->>'operational_status' = 'CERRADA' AND OLD.modules_config->>'operational_status' = 'ABIERTA') THEN
    BEGIN
      PERFORM public.finalize_all_club_stays(NEW.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Aviso: error en finalize_all_club_stays al cerrar club %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_club_operational_status_change ON public.clubs;
CREATE TRIGGER trg_club_operational_status_change
AFTER UPDATE OF modules_config ON public.clubs
FOR EACH ROW
EXECUTE FUNCTION public.handle_club_operational_status_change();


-- 3. FUNCIÓN RPC: set_club_operational_status
-- Usada desde Hangover Business para abrir y cerrar la discoteca
CREATE OR REPLACE FUNCTION public.set_club_operational_status(
  p_club_id UUID,
  p_is_open BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_config JSONB;
  v_updated_config JSONB;
  v_finalize_res JSONB := NULL;
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

  -- Actualizar registro en public.clubs (NOTA: public.clubs no tiene columna updated_at)
  UPDATE public.clubs
  SET 
    modules_config = v_updated_config
  WHERE id = p_club_id;

  -- Si se cierra la discoteca, invocar cierre automático de todas las estancias
  IF p_is_open = false THEN
    v_finalize_res := public.finalize_all_club_stays(p_club_id);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'club_id', p_club_id,
    'is_open', p_is_open,
    'modules_config', v_updated_config,
    'stays_finalized', v_finalize_res
  );
END;
$$;


-- 4. FUNCIÓN RPC: finalize_venue_stay
-- Control de salida individual con verificación de estado operativo y estancias ya cerradas
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
  v_is_club_open BOOLEAN;
  v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
  -- 4.1 Validar autenticación
  IF v_auth_user IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado.';
  END IF;

  -- 4.2 Verificar estado operativo de la discoteca
  SELECT COALESCE((modules_config->>'is_open')::boolean, false) INTO v_is_club_open
  FROM public.clubs
  WHERE id = p_club_id;

  -- Consultar cuenta más reciente
  SELECT * INTO v_account
  FROM public.venue_accounts
  WHERE user_id = v_auth_user
    AND club_id = p_club_id
    AND status IN ('open', 'pending_payment', 'paid', 'closed')
  ORDER BY created_at DESC
  LIMIT 1;

  -- Consultar presencia en el establecimiento
  SELECT * INTO v_presence
  FROM public.connect_presence
  WHERE user_id = v_auth_user
    AND club_id = p_club_id;

  -- 4.3 Si la discoteca está CERRADA, la estancia digital ya finalizó automáticamente
  IF v_is_club_open = false THEN
    IF v_account IS NOT NULL AND COALESCE(v_account.balance, 0.00) > 0.00 THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'OUTSTANDING_BALANCE_CLUB_CLOSED',
        'error', 'La discoteca ha cerrado y tu estancia ha finalizado, pero tu cuenta tiene un saldo pendiente de $' || to_char(v_account.balance, 'FM999,999,990') || ' COP. Debes pagarlo desde Mi Cuenta.',
        'balance', v_account.balance,
        'is_club_closed', true
      );
    END IF;

    RETURN jsonb_build_object(
      'success', false,
      'code', 'STAY_ALREADY_FINALIZED',
      'error', 'La estancia ya ha finalizado automáticamente porque la discoteca cerró.',
      'is_club_closed', true
    );
  END IF;

  -- 4.4 Verificar si la estancia ya fue finalizada previamente
  -- Está finalizada si la presencia expiró (expires_at <= now) Y la cuenta no está abierta
  IF (v_presence IS NULL OR v_presence.expires_at <= v_now)
     AND (v_account IS NULL OR v_account.status = 'closed') THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'STAY_ALREADY_FINALIZED',
      'error', 'Tu estancia ya fue finalizada anteriormente.'
    );
  END IF;

  -- 4.5 Verificar comandas pendientes de entrega
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

  -- 4.6 Verificar saldo en cuenta con bloqueo FOR UPDATE
  IF v_account IS NOT NULL AND v_account.status IN ('open', 'pending_payment', 'paid') THEN
    SELECT COALESCE(
      SUM(CASE WHEN entry_type = 'charge' THEN amount WHEN entry_type = 'payment' THEN -amount ELSE 0 END),
      0.00
    ) INTO v_calculated_balance
    FROM public.venue_account_entries
    WHERE account_id = v_account.id;

    -- REGLA CRÍTICA: Bloquear salida si existe deuda pendiente
    IF v_calculated_balance > 0.00 THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'OUTSTANDING_BALANCE',
        'error', 'No puedes finalizar tu estancia. Tienes un saldo pendiente de $' || to_char(v_calculated_balance, 'FM999,999,990') || ' COP. Debes cancelarlo en el bar antes de salir.',
        'balance', v_calculated_balance,
        'account_id', v_account.id
      );
    END IF;

    -- Cerrar la cuenta de estancia
    UPDATE public.venue_accounts
    SET
      status = 'closed',
      balance = 0.00,
      closed_at = v_now,
      updated_at = v_now
    WHERE id = v_account.id;
  END IF;

  -- 4.7 Expirar presencia en connect_presence (sin modificar columna status)
  UPDATE public.connect_presence
  SET
    expires_at = v_now,
    last_seen_at = v_now
  WHERE user_id = v_auth_user
    AND club_id = p_club_id;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'CHECKED_OUT',
    'message', 'Estancia finalizada con éxito. ¡Gracias por visitarnos!',
    'closed_at', v_now
  );
END;
$$;


-- 5. FUNCIÓN RPC: get_my_active_venue_account
-- Consulta de cuenta, movimientos y estado operativo de estancia y discoteca
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
  v_is_club_open BOOLEAN := false;
  v_presence RECORD;
  v_stay_status TEXT := 'inactive';
  v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
  IF v_auth_user IS NULL THEN
    RETURN jsonb_build_object(
      'account', null,
      'entries', '[]'::jsonb,
      'is_club_open', false,
      'stay_status', 'unauthenticated'
    );
  END IF;

  -- 5.1 Consultar estado operativo real de la discoteca
  SELECT COALESCE((modules_config->>'is_open')::boolean, false) INTO v_is_club_open
  FROM public.clubs
  WHERE id = p_club_id;

  -- 5.2 Consultar presencia del usuario
  SELECT * INTO v_presence
  FROM public.connect_presence
  WHERE user_id = v_auth_user
    AND club_id = p_club_id
  ORDER BY last_seen_at DESC
  LIMIT 1;

  -- 5.3 Consultar la cuenta más reciente (incluso si está en pending_payment o closed)
  SELECT * INTO v_account
  FROM public.venue_accounts
  WHERE user_id = v_auth_user
    AND club_id = p_club_id
    AND status IN ('open', 'pending_payment', 'paid', 'closed')
  ORDER BY created_at DESC
  LIMIT 1;

  -- 5.4 Determinar el estado autoritativo de la estancia
  IF v_is_club_open = false THEN
    IF v_account IS NOT NULL AND COALESCE(v_account.balance, 0.00) > 0.00 THEN
      v_stay_status := 'closed_by_club_with_debt';
    ELSE
      v_stay_status := 'closed_by_club';
    END IF;
  ELSE
    IF v_account IS NOT NULL AND v_account.status = 'closed' AND (v_presence IS NULL OR v_presence.expires_at <= v_now) THEN
      v_stay_status := 'finalized';
    ELSIF v_account IS NOT NULL AND COALESCE(v_account.balance, 0.00) > 0.00 THEN
      v_stay_status := 'pending_payment';
    ELSIF v_presence IS NOT NULL AND (v_presence.expires_at IS NOT NULL AND v_presence.expires_at > v_now) THEN
      v_stay_status := 'active';
    ELSIF (v_presence IS NOT NULL AND v_presence.expires_at <= v_now) OR (v_account IS NOT NULL AND v_account.status = 'closed') THEN
      v_stay_status := 'finalized';
    ELSE
      v_stay_status := 'inactive';
    END IF;
  END IF;

  -- Si no tiene cuenta registrada, retornar información de presencia y discoteca
  IF v_account IS NULL THEN
    RETURN jsonb_build_object(
      'account', null,
      'entries', '[]'::jsonb,
      'is_club_open', v_is_club_open,
      'stay_status', v_stay_status
    );
  END IF;

  -- 5.5 Consultar historial cronológico de movimientos del ledger
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
      'closed_at', v_account.closed_at,
      'payment_reference', v_account.payment_reference
    ),
    'entries', v_entries,
    'is_club_open', v_is_club_open,
    'stay_status', v_stay_status
  );
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION public.finalize_all_club_stays(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_club_operational_status_change() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_club_operational_status(UUID, BOOLEAN) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.finalize_venue_stay(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_active_venue_account(UUID) TO authenticated;
