-- ==========================================================
-- PLATAFORMA HANGOVER - SERVICIOS PROFESSIONAL PROFILE MIGRATION
-- Run this in the SQL Editor of your Supabase Dashboard
-- ==========================================================

-- 1. Ampliar servicios con enlaces a producciones
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS spotify_url TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS soundcloud_url TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- 2. Ampliar reservas con campos de cotización
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS event_type TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_city TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS budget DECIMAL(10,2);

-- 3. Tabla de Historias para Servicios (Service Stories)
CREATE TABLE IF NOT EXISTS public.service_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    thumbnail_url TEXT,
    title TEXT,
    description TEXT,
    display_order INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    duration INT DEFAULT 5, -- duración en segundos (defecto 5 para fotos)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS para service_stories
ALTER TABLE public.service_stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to active service_stories" ON public.service_stories;
CREATE POLICY "Allow public read access to active service_stories" 
ON public.service_stories FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Allow provider write access to own service_stories" ON public.service_stories;
CREATE POLICY "Allow provider write access to own service_stories" 
ON public.service_stories FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.services
        WHERE public.services.id = service_stories.service_id
          AND public.services.provider_id = auth.uid()
    )
);

-- 4. Tabla de Galería para Servicios (Service Gallery Items)
CREATE TABLE IF NOT EXISTS public.service_gallery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    thumbnail_url TEXT,
    title TEXT,
    description TEXT,
    display_order INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS para service_gallery_items
ALTER TABLE public.service_gallery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to active service_gallery_items" ON public.service_gallery_items;
CREATE POLICY "Allow public read access to active service_gallery_items" 
ON public.service_gallery_items FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Allow provider write access to own service_gallery_items" ON public.service_gallery_items;
CREATE POLICY "Allow provider write access to own service_gallery_items" 
ON public.service_gallery_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.services
        WHERE public.services.id = service_gallery_items.service_id
          AND public.services.provider_id = auth.uid()
    )
);

-- 5. Tabla de Disponibilidad (Service Availability Calendar)
CREATE TABLE IF NOT EXISTS public.service_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('available', 'booked', 'blocked')) DEFAULT 'available',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (service_id, date)
);

-- RLS para service_availability
ALTER TABLE public.service_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to service_availability" ON public.service_availability;
CREATE POLICY "Allow public read access to service_availability" 
ON public.service_availability FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow provider write access to own service_availability" ON public.service_availability;
CREATE POLICY "Allow provider write access to own service_availability" 
ON public.service_availability FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.services
        WHERE public.services.id = service_availability.service_id
          AND public.services.provider_id = auth.uid()
    )
);

-- 6. Tabla de Eventos Realizados (Service Past Events Historial)
CREATE TABLE IF NOT EXISTS public.service_past_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    event_date DATE NOT NULL,
    description TEXT,
    media_urls TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS para service_past_events
ALTER TABLE public.service_past_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to service_past_events" ON public.service_past_events;
CREATE POLICY "Allow public read access to service_past_events" 
ON public.service_past_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow provider write access to own service_past_events" ON public.service_past_events;
CREATE POLICY "Allow provider write access to own service_past_events" 
ON public.service_past_events FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.services
        WHERE public.services.id = service_past_events.service_id
          AND public.services.provider_id = auth.uid()
    )
);

-- 7. Tabla de Reseñas Verificadas (Service Reviews)
CREATE TABLE IF NOT EXISTS public.service_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID UNIQUE NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS para service_reviews
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to service_reviews" ON public.service_reviews;
CREATE POLICY "Allow public read access to service_reviews" 
ON public.service_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to insert reviews for completed bookings" ON public.service_reviews;
CREATE POLICY "Allow users to insert reviews for completed bookings" 
ON public.service_reviews FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM public.bookings
        WHERE bookings.id = booking_id
          AND bookings.user_id = auth.uid()
          AND bookings.service_id = service_reviews.service_id
          AND bookings.status IN ('confirmed', 'completed')
    )
);

DROP POLICY IF EXISTS "Allow users to modify own reviews" ON public.service_reviews;
CREATE POLICY "Allow users to modify own reviews" 
ON public.service_reviews FOR ALL USING (auth.uid() = user_id);

-- 8. Configurar Buckets de almacenamiento en Supabase (si no existen)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('service-stories', 'service-stories', true),
  ('service-gallery', 'service-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para service-stories
DROP POLICY IF EXISTS "Public Read Access for service-stories" ON storage.objects;
CREATE POLICY "Public Read Access for service-stories" ON storage.objects
    FOR SELECT USING (bucket_id = 'service-stories');

DROP POLICY IF EXISTS "Provider All Access for own service-stories" ON storage.objects;
CREATE POLICY "Provider All Access for own service-stories" ON storage.objects
    FOR ALL USING (bucket_id = 'service-stories' AND auth.role() = 'authenticated');

-- Políticas de Storage para service-gallery
DROP POLICY IF EXISTS "Public Read Access for service-gallery" ON storage.objects;
CREATE POLICY "Public Read Access for service-gallery" ON storage.objects
    FOR SELECT USING (bucket_id = 'service-gallery');

DROP POLICY IF EXISTS "Provider All Access for own service-gallery" ON storage.objects;
CREATE POLICY "Provider All Access for own service-gallery" ON storage.objects
    FOR ALL USING (bucket_id = 'service-gallery' AND auth.role() = 'authenticated');
