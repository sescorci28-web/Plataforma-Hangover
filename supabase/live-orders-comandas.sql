-- 1. Tabla de Mesas por Discoteca
CREATE TABLE IF NOT EXISTS public.club_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(club_id, table_number)
);

-- 2. Tabla de Sesiones de Cuenta en Mesa
CREATE TABLE IF NOT EXISTS public.live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES public.club_tables(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('open', 'closed', 'paid')) DEFAULT 'open',
  total_amount NUMERIC NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

-- 3. Tabla de Comandas / Órdenes
CREATE TABLE IF NOT EXISTS public.live_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'preparing', 'delivered_by_staff', 'confirmed', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabla de Items de Comanda
CREATE TABLE IF NOT EXISTS public.live_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.live_orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.club_menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_order NUMERIC NOT NULL CHECK (price_at_order >= 0)
);

-- 5. Índices de Optimización de Rendimiento
CREATE INDEX IF NOT EXISTS idx_club_tables_club ON public.club_tables(club_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_user ON public.live_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_club ON public.live_sessions(club_id);
CREATE INDEX IF NOT EXISTS idx_live_orders_session ON public.live_orders(session_id);
CREATE INDEX IF NOT EXISTS idx_live_orders_status ON public.live_orders(status);
CREATE INDEX IF NOT EXISTS idx_live_order_items_order ON public.live_order_items(order_id);

-- 6. Habilitación de Row Level Security (RLS)
ALTER TABLE public.club_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_order_items ENABLE ROW LEVEL SECURITY;

-- 7. Políticas RLS de Mesas
DROP POLICY IF EXISTS "Permitir lectura pública de mesas" ON public.club_tables;
CREATE POLICY "Permitir lectura pública de mesas"
  ON public.club_tables FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir gestión de mesas a proveedores y admin" ON public.club_tables;
DROP POLICY IF EXISTS "Permitir modificación de mesas a proveedores y admin" ON public.club_tables;
DROP POLICY IF EXISTS "Permitir eliminación de mesas a proveedores y admin" ON public.club_tables;
DROP POLICY IF EXISTS "Permitir creación de mesas a usuarios autenticados" ON public.club_tables;

CREATE POLICY "Permitir creación de mesas a usuarios autenticados"
  ON public.club_tables FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir modificación de mesas a proveedores y admin"
  ON public.club_tables FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id = club_id
        AND (clubs.provider_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "Permitir eliminación de mesas a proveedores y admin"
  ON public.club_tables FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id = club_id
        AND (clubs.provider_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- 8. Políticas RLS de Sesiones en Vivo
DROP POLICY IF EXISTS "Clientes pueden ver y crear sus propias sesiones" ON public.live_sessions;
CREATE POLICY "Clientes pueden ver y crear sus propias sesiones"
  ON public.live_sessions FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Clientes pueden insertar sus propias sesiones" ON public.live_sessions;
CREATE POLICY "Clientes pueden insertar sus propias sesiones"
  ON public.live_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid() AND status = 'open');

DROP POLICY IF EXISTS "Proveedores pueden ver y gestionar sesiones de sus clubes" ON public.live_sessions;
CREATE POLICY "Proveedores pueden ver y gestionar sesiones de sus clubes"
  ON public.live_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id = club_id
        AND (clubs.provider_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- 9. Políticas RLS de Comandas / Órdenes
DROP POLICY IF EXISTS "Clientes pueden ver sus propias órdenes" ON public.live_orders;
CREATE POLICY "Clientes pueden ver sus propias órdenes"
  ON public.live_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.live_sessions
      WHERE live_sessions.id = session_id AND live_sessions.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Clientes pueden crear sus propias órdenes en sesión activa" ON public.live_orders;
CREATE POLICY "Clientes pueden crear sus propias órdenes en sesión activa"
  ON public.live_orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.live_sessions
      WHERE live_sessions.id = session_id AND live_sessions.user_id = auth.uid() AND live_sessions.status = 'open'
    )
  );

DROP POLICY IF EXISTS "Clientes pueden actualizar el estado de sus propias órdenes a recibido/cancelado" ON public.live_orders;
CREATE POLICY "Clientes pueden actualizar el estado de sus propias órdenes a recibido/cancelado"
  ON public.live_orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.live_sessions
      WHERE live_sessions.id = session_id AND live_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (status IN ('confirmed', 'cancelled'));

DROP POLICY IF EXISTS "Proveedores pueden gestionar todas las órdenes de sus clubes" ON public.live_orders;
CREATE POLICY "Proveedores pueden gestionar todas las órdenes de sus clubes"
  ON public.live_orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.live_sessions
      JOIN public.clubs ON clubs.id = live_sessions.club_id
      WHERE live_sessions.id = session_id
        AND (clubs.provider_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- 10. Políticas RLS de Items de Comanda
DROP POLICY IF EXISTS "Clientes pueden ver ítems de sus propias órdenes" ON public.live_order_items;
CREATE POLICY "Clientes pueden ver ítems de sus propias órdenes"
  ON public.live_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.live_orders
      JOIN public.live_sessions ON live_sessions.id = live_orders.session_id
      WHERE live_orders.id = order_id AND live_sessions.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Clientes pueden insertar ítems en sus propias órdenes de sesión activa" ON public.live_order_items;
CREATE POLICY "Clientes pueden insertar ítems en sus propias órdenes de sesión activa"
  ON public.live_order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.live_orders
      JOIN public.live_sessions ON live_sessions.id = live_orders.session_id
      WHERE live_orders.id = order_id AND live_sessions.user_id = auth.uid() AND live_sessions.status = 'open'
    )
  );

DROP POLICY IF EXISTS "Proveedores pueden ver y gestionar ítems de órdenes de sus clubes" ON public.live_order_items;
CREATE POLICY "Proveedores pueden ver y gestionar ítems de órdenes de sus clubes"
  ON public.live_order_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.live_orders
      JOIN public.live_sessions ON live_sessions.id = live_orders.session_id
      JOIN public.clubs ON clubs.id = live_sessions.club_id
      WHERE live_orders.id = order_id
        AND (clubs.provider_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );
