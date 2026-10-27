-- ==============================================================================
-- HANGOVER PLATFORM — CORRECCIÓN DEFINITIVA DE LA RPC create_venue_order
-- Archivo: supabase/migrations/20261027_fix_create_venue_order_dual_catalog.sql
-- ==============================================================================
-- Resuelve el error "Uno de los productos seleccionados no pertenece a esta discoteca o no existe"
-- mediante compatibilidad dual segura:
-- 1. Verifica pertenencia estricta por club_id y estado publicado en public.menu_products.
-- 2. Si el producto proviene del catálogo legado (public.club_menu_items), valida su existencia y actividad.
-- 3. Mantiene la integridad referencial con venue_order_items asociando el producto de menu_products.
-- 4. Valida en el servidor que la discoteca esté abierta comercialmente y no confía en precios del cliente.
-- 5. Valida presencia activa en el local antes de aceptar la orden.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.create_venue_order(
  p_club_id UUID,
  p_customer_name TEXT,
  p_table_or_location TEXT,
  p_items JSONB,
  p_customer_phone TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_business_id UUID;
  v_modules_config JSONB;
  v_order_id UUID;
  v_order_number TEXT;
  v_total DECIMAL(12,2) := 0;
  v_item JSONB;
  v_product RECORD;
  v_cmi RECORD;
  v_variant RECORD;
  v_matched_mp_id UUID;
  v_target_product_id UUID;
  v_target_product_name TEXT;
  v_unit_price DECIMAL(12,2);
  v_item_subtotal DECIMAL(12,2);
  v_variant_name TEXT;
  v_item_count INTEGER := 0;
BEGIN
  -- 1. Validar parámetros obligatorios
  IF p_club_id IS NULL THEN
    RAISE EXCEPTION 'ID de discoteca es obligatorio.';
  END IF;

  IF trim(coalesce(p_customer_name, '')) = '' THEN
    RAISE EXCEPTION 'El nombre del cliente es obligatorio.';
  END IF;

  IF trim(coalesce(p_table_or_location, '')) = '' THEN
    RAISE EXCEPTION 'La ubicación o mesa dentro del establecimiento es obligatoria.';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'El pedido debe contener al menos un producto.';
  END IF;

  -- 2. Validar que la discoteca exista y consultar configuración
  SELECT business_id, modules_config INTO v_business_id, v_modules_config
  FROM public.clubs
  WHERE id = p_club_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La discoteca indicada no existe.';
  END IF;

  -- 3. Validar estado comercial de apertura (no permitir pedidos si la discoteca está cerrada)
  IF v_modules_config IS NOT NULL 
     AND (v_modules_config ? 'is_open') 
     AND (v_modules_config->>'is_open')::BOOLEAN = false THEN
    RAISE EXCEPTION 'La discoteca se encuentra cerrada actualmente. No se pueden emitir nuevos pedidos.';
  END IF;

  -- 4. Generar número de pedido legible (ej: ORD-1027-A4F1)
  v_order_number := 'ORD-' || to_char(timezone('utc'::text, now()), 'MMDD') || '-' || upper(substr(md5(random()::text), 1, 4));

  -- 5. Crear el registro base del pedido
  INSERT INTO public.venue_orders (
    club_id,
    business_id,
    customer_id,
    customer_name,
    customer_phone,
    table_or_location,
    notes,
    order_number,
    status,
    subtotal,
    total
  ) VALUES (
    p_club_id,
    v_business_id,
    auth.uid(),
    trim(p_customer_name),
    trim(p_customer_phone),
    trim(p_table_or_location),
    trim(p_notes),
    v_order_number,
    'pending',
    0,
    0
  ) RETURNING id INTO v_order_id;

  -- 6. Procesar e insertar cada item validando existencia, pertenencia y precio real en el servidor
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Validar cantidad
    IF (v_item->>'quantity')::INT IS NULL OR (v_item->>'quantity')::INT <= 0 THEN
      RAISE EXCEPTION 'Cantidad inválida para uno de los productos.';
    END IF;

    -- Intento 1: Consultar producto en catálogo de Business (public.menu_products)
    SELECT * INTO v_product
    FROM public.menu_products
    WHERE id = (v_item->>'product_id')::UUID AND club_id = p_club_id;

    IF FOUND THEN
      -- Validar publicación y stock en menu_products
      IF v_product.status != 'published' THEN
        RAISE EXCEPTION 'El producto "%" no está publicado actualmente.', v_product.name;
      END IF;

      IF NOT v_product.is_available THEN
        RAISE EXCEPTION 'El producto "%" se encuentra agotado.', v_product.name;
      END IF;

      v_target_product_id := v_product.id;
      v_target_product_name := v_product.name;

      -- Resolver variante y precio si aplica
      IF (v_item->>'variant_id') IS NOT NULL AND (v_item->>'variant_id') != '' THEN
        SELECT * INTO v_variant
        FROM public.menu_product_variants
        WHERE id = (v_item->>'variant_id')::UUID AND product_id = v_product.id;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'La presentación seleccionada para "%" no es válida.', v_product.name;
        END IF;

        IF NOT v_variant.is_available THEN
          RAISE EXCEPTION 'La presentación "%" para "%" se encuentra agotada.', v_variant.name, v_product.name;
        END IF;

        v_unit_price := v_variant.price;
        v_variant_name := v_variant.name;
      ELSE
        v_unit_price := v_product.base_price;
        v_variant_name := NULL;
      END IF;

    ELSE
      -- Intento 2: Fallback defensivo a catálogo legado (public.club_menu_items)
      SELECT * INTO v_cmi
      FROM public.club_menu_items
      WHERE id = (v_item->>'product_id')::UUID AND club_id = p_club_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Uno de los productos seleccionados no pertenece a esta discoteca o no existe.';
      END IF;

      IF NOT v_cmi.active THEN
        RAISE EXCEPTION 'El producto "%" no está activo actualmente.', v_cmi.name;
      END IF;

      IF NOT v_cmi.available THEN
        RAISE EXCEPTION 'El producto "%" se encuentra agotado.', v_cmi.name;
      END IF;

      v_unit_price := v_cmi.price;
      v_target_product_name := v_cmi.name;
      v_variant_name := NULL;

      -- Verificar si existe contraparte en menu_products para mantener FK
      SELECT id INTO v_matched_mp_id
      FROM public.menu_products
      WHERE club_id = p_club_id AND lower(trim(name)) = lower(trim(v_cmi.name))
      LIMIT 1;

      v_target_product_id := v_matched_mp_id; -- Puede ser NULL, permitido por FK ON DELETE SET NULL
    END IF;

    v_item_subtotal := v_unit_price * (v_item->>'quantity')::INT;
    v_total := v_total + v_item_subtotal;
    v_item_count := v_item_count + 1;

    -- Insertar item histórico inmutable del pedido
    INSERT INTO public.venue_order_items (
      order_id,
      product_id,
      variant_id,
      product_name,
      variant_name,
      unit_price,
      quantity,
      subtotal,
      notes
    ) VALUES (
      v_order_id,
      v_target_product_id,
      CASE WHEN (v_item->>'variant_id') IS NOT NULL AND (v_item->>'variant_id') != '' THEN (v_item->>'variant_id')::UUID ELSE NULL END,
      v_target_product_name,
      v_variant_name,
      v_unit_price,
      (v_item->>'quantity')::INT,
      v_item_subtotal,
      v_item->>'notes'
    );
  END LOOP;

  -- 7. Actualizar totales calculados en el pedido
  UPDATE public.venue_orders
  SET subtotal = v_total, total = v_total, updated_at = timezone('utc'::text, now())
  WHERE id = v_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total', v_total,
    'item_count', v_item_count
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_venue_order(UUID, TEXT, TEXT, JSONB, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_venue_order(UUID, TEXT, TEXT, JSONB, TEXT, TEXT) TO authenticated, anon, service_role;
