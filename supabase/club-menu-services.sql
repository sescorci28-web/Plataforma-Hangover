-- TABLA: club_menu_items
CREATE TABLE IF NOT EXISTS public.club_menu_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL, -- Ej: 'Botellas', 'Tragos', 'Comida', 'Sin Alcohol' (flexibilidad total)
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexación para optimizar consultas por club
CREATE INDEX IF NOT EXISTS club_menu_items_club_id_idx ON public.club_menu_items(club_id);

-- Habilitar RLS
ALTER TABLE public.club_menu_items ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para club_menu_items
DROP POLICY IF EXISTS "Public can view active menu items" ON public.club_menu_items;
CREATE POLICY "Public can view active menu items"
ON public.club_menu_items FOR SELECT TO public
USING (active = true);

DROP POLICY IF EXISTS "Providers can manage own club menu items" ON public.club_menu_items;
CREATE POLICY "Providers can manage own club menu items"
ON public.club_menu_items FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clubs
    WHERE id = club_menu_items.club_id
      AND (provider_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clubs
    WHERE id = club_menu_items.club_id
      AND (provider_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  )
);


-- TABLA: club_services
CREATE TABLE IF NOT EXISTS public.club_services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2), -- Puede ser nulo si el servicio está incluido o es gratuito
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexación para optimizar consultas por club
CREATE INDEX IF NOT EXISTS club_services_club_id_idx ON public.club_services(club_id);

-- Habilitar RLS
ALTER TABLE public.club_services ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para club_services
DROP POLICY IF EXISTS "Public can view active club services" ON public.club_services;
CREATE POLICY "Public can view active club services"
ON public.club_services FOR SELECT TO public
USING (active = true);

DROP POLICY IF EXISTS "Providers can manage own club services" ON public.club_services;
CREATE POLICY "Providers can manage own club services"
ON public.club_services FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clubs
    WHERE id = club_services.club_id
      AND (provider_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clubs
    WHERE id = club_services.club_id
      AND (provider_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  )
);
