-- ==============================================================================
-- HANGOVER PLATFORM — CONFIRMACIÓN DE ENTREGA DE PEDIDOS POR EL CLIENTE
-- Archivo: supabase/migrations/20261027_customer_order_delivery_confirmation.sql
-- ==============================================================================
-- Flujo de estados:
-- 1. pending -> 2. in_preparation -> 3. ready -> 4. delivered -> 5. completed
-- Reglas de seguridad:
-- - Business solo puede avanzar hasta 'delivered' (Esperando confirmación del cliente).
-- - Solo el cliente propietario (auth.uid() = customer_id) puede confirmar a 'completed'.
-- - El pedido debe estar en 'delivered' para ser confirmado.
-- - Se registran las marcas de tiempo delivered_at y confirmed_at.
-- ==============================================================================

-- 1. Actualizar el CHECK CONSTRAINT de estados en venue_orders
ALTER TABLE public.venue_orders DROP CONSTRAINT IF EXISTS venue_orders_status_check;
ALTER TABLE public.venue_orders ADD CONSTRAINT venue_orders_status_check 
  CHECK (status IN ('pending', 'accepted', 'in_preparation', 'ready', 'delivered', 'completed', 'rejected', 'cancelled'));

-- 2. Asegurar columnas de auditoría temporal si no existen
ALTER TABLE public.venue_orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE public.venue_orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- 3. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_venue_orders_status ON public.venue_orders(status);
CREATE INDEX IF NOT EXISTS idx_venue_orders_customer_status ON public.venue_orders(customer_id, status);

-- 4. FUNCIÓN TRIGGER: Validación de transición de estados y seguridad de confirmación
CREATE OR REPLACE FUNCTION public.trg_validate_venue_order_status()
RETURNS TRIGGER AS $$
BEGIN
  -- A. Registro automático de delivered_at al pasar a 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    IF NEW.delivered_at IS NULL THEN
      NEW.delivered_at := timezone('utc'::text, now());
    END IF;
  END IF;

  -- B. Reglas estrictas al intentar pasar a 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- 1. El estado anterior debe ser obligatoriamente 'delivered'
    IF OLD.status IS NOT NULL AND OLD.status != 'delivered' THEN
      RAISE EXCEPTION 'Un pedido no puede completarse sin haber sido entregado previamente (estado actual: %).', OLD.status;
    END IF;

    -- 2. Restricción de seguridad: Solo el cliente que realizó la orden puede marcarla como completed
    -- Si auth.uid() existe (llamada desde API/PostgREST/Client) y customer_id está asignado,
    -- debe coincidir estrictamente.
    IF auth.uid() IS NOT NULL AND NEW.customer_id IS NOT NULL AND auth.uid() != NEW.customer_id THEN
      RAISE EXCEPTION 'Solo el cliente que realizó el pedido puede confirmar la recepción. El establecimiento no puede marcar el pedido como completado.';
    END IF;

    -- 3. Registro automático de confirmed_at
    IF NEW.confirmed_at IS NULL THEN
      NEW.confirmed_at := timezone('utc'::text, now());
    END IF;
  END IF;

  -- C. Inmutabilidad de pedidos ya completados
  IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
    RAISE EXCEPTION 'Un pedido completado y confirmado por el cliente no puede retroceder de estado.';
  END IF;

  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_venue_orders_validate_status ON public.venue_orders;
CREATE TRIGGER trg_venue_orders_validate_status
  BEFORE UPDATE ON public.venue_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_validate_venue_order_status();

-- 5. FUNCIÓN RPC: confirm_venue_order_delivery (Ejecutada por el cliente en Hangover Users)
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

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'status', 'completed',
    'confirmed_at', timezone('utc'::text, now())
  );
END;
$$;

-- Permisos RPC
REVOKE EXECUTE ON FUNCTION public.confirm_venue_order_delivery(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_venue_order_delivery(UUID) TO authenticated, service_role;
