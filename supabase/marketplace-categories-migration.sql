-- Marketplace de Servicios - Migración Relacional (Opción B) - Versión Fiestas & Vida Nocturna
-- Ejecutar este script en el Editor SQL de Supabase

-- 1. CREACIÓN DE TABLAS DE TAXONOMÍA (OPCIÓN B)
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.service_subcategories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.service_categories(id) ON DELETE CASCADE NOT NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (category_id, slug)
);

-- Indexar slugs para búsquedas y urls limpias de SEO
CREATE INDEX IF NOT EXISTS service_categories_slug_idx ON public.service_categories(slug);
CREATE INDEX IF NOT EXISTS service_subcategories_slug_idx ON public.service_subcategories(slug);

-- 2. AMPLIAR LA TABLA DE SERVICIOS
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.service_subcategories(id) ON DELETE SET NULL;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS base_city TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS experience TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS cities_coverage TEXT[] DEFAULT '{}';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS completed_bookings_count INTEGER DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 5.0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS latitude DECIMAL;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS longitude DECIMAL;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS provider_status TEXT CHECK (provider_status IN ('active', 'vacation', 'busy', 'inactive')) DEFAULT 'active';

-- Crear índices de alto rendimiento para filtros
CREATE INDEX IF NOT EXISTS services_category_id_idx ON public.services(category_id);
CREATE INDEX IF NOT EXISTS services_subcategory_id_idx ON public.services(subcategory_id);
CREATE INDEX IF NOT EXISTS services_base_city_idx ON public.services(base_city);
CREATE INDEX IF NOT EXISTS services_verified_idx ON public.services(verified);
CREATE INDEX IF NOT EXISTS services_average_rating_idx ON public.services(average_rating);

-- 3. PREPARACIÓN PARA SISTEMA DE COTIZACIONES MÚLTIPLES
CREATE TABLE IF NOT EXISTS public.quotation_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME DEFAULT '18:00:00',
  base_city TEXT NOT NULL,
  estimated_guests INTEGER DEFAULT 50,
  budget_range TEXT,
  additional_notes TEXT,
  status TEXT CHECK (status IN ('pending', 'sent_proposals', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.quotation_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID REFERENCES public.quotation_requests(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.service_categories(id) ON DELETE RESTRICT NOT NULL,
  subcategory_id UUID REFERENCES public.service_subcategories(id) ON DELETE RESTRICT,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  specifications TEXT,
  status TEXT CHECK (status IN ('pending_provider', 'proposal_received', 'rejected')) DEFAULT 'pending_provider'
);

CREATE TABLE IF NOT EXISTS public.quotation_proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_item_id UUID REFERENCES public.quotation_items(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  proposed_price DECIMAL(10,2) NOT NULL,
  description TEXT,
  includes TEXT[] DEFAULT '{}',
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS quotation_requests_user_idx ON public.quotation_requests(user_id);
CREATE INDEX IF NOT EXISTS quotation_items_request_idx ON public.quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS quotation_proposals_provider_idx ON public.quotation_proposals(provider_id);

-- 4. SEEDING DE CATEGORÍAS PRINCIPALES Y SUBCATEGORÍAS ENFOCADAS EN FIESTAS Y VIDA NOCTURNA
INSERT INTO public.service_categories (slug, name, icon, sort_order) VALUES
  ('music', 'Música y Entretenimiento', '🎵', 1),
  ('sound', 'Sonido e Iluminación', '🔊', 2),
  ('bar', 'Bar y Bebidas', '🍸', 3),
  ('catering', 'Catering y Comida', '🍽️', 4),
  ('decor', 'Decoración y Ambientación', '🎈', 5),
  ('logistics', 'Mobiliario y Logística', '🪑', 6),
  ('staff', 'Personal de Servicio', '👨‍🍳', 7),
  ('security', 'Seguridad', '🛡️', 8),
  ('media', 'Foto y Video', '📸', 9),
  ('transport', 'Transporte', '🚗', 10),
  ('social', 'Bodas y Eventos Sociales', '💍', 11),
  ('premium', 'Experiencias Premium', '⭐', 12)
ON CONFLICT (slug) DO NOTHING;

-- Música y Entretenimiento
INSERT INTO public.service_subcategories (category_id, slug, name, sort_order)
SELECT id, s.slug, s.name, s.sort_order FROM public.service_categories c,
(VALUES 
  ('dj', 'DJ', 1), ('dj-premium', 'DJ Premium', 2), ('dj-internacional', 'DJ Internacional', 3),
  ('banda-en-vivo', 'Banda en vivo', 4), ('grupo-vallenato', 'Grupo vallenato', 5), ('grupo-tropical', 'Grupo tropical', 6),
  ('mariachis', 'Mariachis', 7), ('saxofonista', 'Saxofonista', 8), ('violinista', 'Violinista', 9),
  ('cantante', 'Cantante', 10), ('animador', 'Animador', 11), ('maestro-de-ceremonia', 'Maestro de ceremonia', 12),
  ('hora-loca', 'Hora loca', 13), ('bailarinas', 'Bailarinas', 14), ('show-de-baile', 'Show de baile', 15),
  ('humoristas', 'Humoristas', 16), ('magos', 'Magos', 17), ('personajes-tematicos', 'Personajes temáticos', 18)
) AS s(slug, name, sort_order) WHERE c.slug = 'music' ON CONFLICT DO NOTHING;

-- Sonido e Iluminación
INSERT INTO public.service_subcategories (category_id, slug, name, sort_order)
SELECT id, s.slug, s.name, s.sort_order FROM public.service_categories c,
(VALUES 
  ('alquiler-sonido', 'Alquiler de sonido', 1), ('sonido-profesional', 'Sonido profesional', 2),
  ('tarimas', 'Tarimas', 3), ('luces-inteligentes', 'Luces inteligentes', 4), ('cabezas-moviles', 'Cabezas móviles', 5),
  ('pantallas-led', 'Pantallas LED', 6), ('proyeccion-audiovisual', 'Proyección audiovisual', 7),
  ('microfonos', 'Micrófonos', 8), ('produccion-tecnica', 'Producción técnica', 9),
  ('maquina-humo', 'Máquina de humo', 10), ('maquina-co2', 'Máquina de CO2', 11),
  ('pirotecnia-fria', 'Pirotecnia fría', 12), ('show-laser', 'Show láser' , 13)
) AS s(slug, name, sort_order) WHERE c.slug = 'sound' ON CONFLICT DO NOTHING;

-- Bar y Bebidas
INSERT INTO public.service_subcategories (category_id, slug, name, sort_order)
SELECT id, s.slug, s.name, s.sort_order FROM public.service_categories c,
(VALUES 
  ('bartender', 'Bartender', 1), ('bartender-premium', 'Bartender Premium', 2), ('mixologo', 'Mixólogo', 3),
  ('bar-movil', 'Bar móvil', 4), ('barra-tematica', 'Barra temática', 5), ('estacion-shots', 'Estación de shots', 6),
  ('estacion-cocteles', 'Estación de cócteles', 7), ('servicio-bebidas', 'Servicio de bebidas' , 8)
) AS s(slug, name, sort_order) WHERE c.slug = 'bar' ON CONFLICT DO NOTHING;

-- Catering y Comida
INSERT INTO public.service_subcategories (category_id, slug, name, sort_order)
SELECT id, s.slug, s.name, s.sort_order FROM public.service_categories c,
(VALUES 
  ('catering-fiestas', 'Catering para fiestas', 1), ('catering-premium', 'Catering premium', 2),
  ('chef-privado', 'Chef privado', 3), ('parrillero', 'Parrillero', 4), ('pasabocas', 'Pasabocas', 5),
  ('comida-rapida', 'Comida rápida', 6), ('food-truck', 'Food Truck', 7), ('mesa-postres', 'Mesa de postres', 8),
  ('reposteria', 'Repostería', 9), ('tortas-personalizadas', 'Tortas personalizadas' , 10)
) AS s(slug, name, sort_order) WHERE c.slug = 'catering' ON CONFLICT DO NOTHING;

-- Decoración y Ambientación (Excluye infantil y corporativa, añade 15 años y cumpleaños)
INSERT INTO public.service_subcategories (category_id, slug, name, sort_order)
SELECT id, s.slug, s.name, s.sort_order FROM public.service_categories c,
(VALUES 
  ('decoracion-tematica', 'Decoración temática', 1), ('decoracion-bodas', 'Decoración de bodas', 2),
  ('decoracion-quinceanos', 'Decoración de 15 Años', 3), ('decoracion-cumpleanos', 'Decoración de Cumpleaños', 4),
  ('globos', 'Globos', 5), ('flores', 'Flores', 6), ('arreglos-florales', 'Arreglos florales', 7),
  ('backings', 'Backings', 8), ('photocalls', 'Photocalls', 9), ('centros-de-mesa', 'Centros de mesa', 10),
  ('ambientacion-premium', 'Ambientación premium' , 11)
) AS s(slug, name, sort_order) WHERE c.slug = 'decor' ON CONFLICT DO NOTHING;

-- Mobiliario y Logística (Excluye inflables)
INSERT INTO public.service_subcategories (category_id, slug, name, sort_order)
SELECT id, s.slug, s.name, s.sort_order FROM public.service_categories c,
(VALUES 
  ('alquiler-mesas', 'Alquiler de mesas', 1), ('alquiler-sillas', 'Alquiler de sillas', 2),
  ('alquiler-carpas', 'Alquiler de carpas', 3), ('salas-lounge', 'Salas lounge', 4),
  ('mobiliario-premium', 'Mobiliario premium', 5), ('cristaleria', 'Cristalería', 6),
  ('vajilla', 'Vajilla', 7), ('manteleria', 'Mantelería', 8), ('menaje', 'Menaje' , 9)
) AS s(slug, name, sort_order) WHERE c.slug = 'logistics' ON CONFLICT DO NOTHING;

-- Personal de Servicio (Excluye traducción simultánea y recreacionistas infantiles)
INSERT INTO public.service_subcategories (category_id, slug, name, sort_order)
SELECT id, s.slug, s.name, s.sort_order FROM public.service_categories c,
(VALUES 
  ('meseros', 'Meseros', 1), ('meseros-vip', 'Meseros VIP', 2), ('capitanes-mesa', 'Capitanes de mesa', 3),
  ('hostess', 'Hostess', 4), ('recepcionistas', 'Recepcionistas', 5), ('impulsadoras', 'Impulsadoras', 6),
  ('protocolo', 'Protocolo', 7), ('personal-limpieza', 'Personal de limpieza', 8),
  ('auxiliares-logisticos', 'Auxiliares logísticos' , 9)
) AS s(slug, name, sort_order) WHERE c.slug = 'staff' ON CONFLICT DO NOTHING;

-- Seguridad
INSERT INTO public.service_subcategories (category_id, slug, name, sort_order)
SELECT id, s.slug, s.name, s.sort_order FROM public.service_categories c,
(VALUES 
  ('seguridad-privada', 'Seguridad privada', 1), ('control-acceso', 'Control de acceso', 2),
  ('logistica-eventos', 'Logística de eventos', 3), ('seguridad-vip', 'Seguridad VIP', 4),
  ('escoltas', 'Escoltas' , 5)
) AS s(slug, name, sort_order) WHERE c.slug = 'security' ON CONFLICT DO NOTHING;

-- Foto y Video
INSERT INTO public.service_subcategories (category_id, slug, name, sort_order)
SELECT id, s.slug, s.name, s.sort_order FROM public.service_categories c,
(VALUES 
  ('fotografo', 'Fotógrafo', 1), ('fotografia-profesional', 'Fotografía profesional', 2),
  ('fotografia-aerea', 'Fotografía aérea', 3), ('videografo', 'Videógrafo', 4),
  ('drone', 'Drone', 5), ('streaming', 'Streaming', 6), ('cabina-fotografica', 'Cabina fotográfica', 7),
  ('video-resumen', 'Video resumen' , 8)
) AS s(slug, name, sort_order) WHERE c.slug = 'media' ON CONFLICT DO NOTHING;

-- Transporte
INSERT INTO public.service_subcategories (category_id, slug, name, sort_order)
SELECT id, s.slug, s.name, s.sort_order FROM public.service_categories c,
(VALUES 
  ('vans', 'Vans', 1), ('buses', 'Buses', 2), ('transporte-vip', 'Transporte VIP', 3),
  ('chofer-privado', 'Chofer privado', 4), ('limusinas', 'Limusinas' , 5)
) AS s(slug, name, sort_order) WHERE c.slug = 'transport' ON CONFLICT DO NOTHING;

-- Bodas y Eventos Sociales (Cumpleaños, Quinceaños, Grados, Despedidas)
INSERT INTO public.service_subcategories (category_id, slug, name, sort_order)
SELECT id, s.slug, s.name, s.sort_order FROM public.service_categories c,
(VALUES 
  ('wedding-planner', 'Wedding Planner', 1), 
  ('quinceanos-planner', 'Quinceaños Planner', 2),
  ('cumpleanos-planner', 'Cumpleaños Planner', 3),
  ('coordinador-eventos-sociales', 'Coordinador de eventos sociales', 4), 
  ('maestro-social', 'Maestro de ceremonia social', 5), 
  ('produccion-social', 'Producción de eventos sociales' , 6)
) AS s(slug, name, sort_order) WHERE c.slug = 'social' ON CONFLICT DO NOTHING;

-- Experiencias Premium (Vida nocturna VIP)
INSERT INTO public.service_subcategories (category_id, slug, name, sort_order)
SELECT id, s.slug, s.name, s.sort_order FROM public.service_categories c,
(VALUES 
  ('artistas-famosos', 'Artistas famosos', 1), ('influencers', 'Influencers', 2),
  ('celebridades', 'Celebridades', 3), ('djs-internacionales', 'DJs internacionales', 4),
  ('produccion-integral', 'Producción integral', 5), ('eventos-de-lujo', 'Eventos de lujo' , 6)
) AS s(slug, name, sort_order) WHERE c.slug = 'premium' ON CONFLICT DO NOTHING;

-- 5. MAPEO AUTOMÁTICO DE DATOS EXISTENTES
UPDATE public.services s
SET
  category_id = (SELECT id FROM public.service_categories WHERE slug = 'music'),
  subcategory_id = (SELECT id FROM public.service_subcategories WHERE slug = 'dj' AND category_id = (SELECT id FROM public.service_categories WHERE slug = 'music')),
  subcategory = 'DJ',
  base_city = COALESCE((SELECT city FROM public.profiles p WHERE p.id = s.provider_id AND p.city IS NOT NULL AND p.city != 'No especificada'), 'Barranquilla')
WHERE category = 'dj';

UPDATE public.services s
SET
  category_id = (SELECT id FROM public.service_categories WHERE slug = 'bar'),
  subcategory_id = (SELECT id FROM public.service_subcategories WHERE slug = 'bartender' AND category_id = (SELECT id FROM public.service_categories WHERE slug = 'bar')),
  subcategory = 'Bartender',
  base_city = COALESCE((SELECT city FROM public.profiles p WHERE p.id = s.provider_id AND p.city IS NOT NULL AND p.city != 'No especificada'), 'Barranquilla')
WHERE category = 'bar';

UPDATE public.services s
SET
  category_id = (SELECT id FROM public.service_categories WHERE slug = 'catering'),
  subcategory_id = (SELECT id FROM public.service_subcategories WHERE slug = 'catering-premium' AND category_id = (SELECT id FROM public.service_categories WHERE slug = 'catering')),
  subcategory = 'Catering premium',
  base_city = COALESCE((SELECT city FROM public.profiles p WHERE p.id = s.provider_id AND p.city IS NOT NULL AND p.city != 'No especificada'), 'Barranquilla')
WHERE category = 'catering';

UPDATE public.services s
SET
  category_id = (SELECT id FROM public.service_categories WHERE slug = 'staff'),
  subcategory_id = (SELECT id FROM public.service_subcategories WHERE slug = 'meseros' AND category_id = (SELECT id FROM public.service_categories WHERE slug = 'staff')),
  subcategory = 'Meseros',
  base_city = COALESCE((SELECT city FROM public.profiles p WHERE p.id = s.provider_id AND p.city IS NOT NULL AND p.city != 'No especificada'), 'Barranquilla')
WHERE category = 'staff';

UPDATE public.services s
SET
  category_id = (SELECT id FROM public.service_categories WHERE slug = 'security'),
  subcategory_id = (SELECT id FROM public.service_subcategories WHERE slug = 'seguridad-privada' AND category_id = (SELECT id FROM public.service_categories WHERE slug = 'security')),
  subcategory = 'Seguridad privada',
  base_city = COALESCE((SELECT city FROM public.profiles p WHERE p.id = s.provider_id AND p.city IS NOT NULL AND p.city != 'No especificada'), 'Barranquilla')
WHERE category = 'security';
