-- Migración para la galería de fotos y videos de eventos
-- Ejecutar en el Editor SQL de la consola de Supabase.

-- 1. Crear tabla para los elementos de la galería de eventos
CREATE TABLE IF NOT EXISTS public.event_gallery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
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

-- 2. Habilitar RLS en event_gallery_items
ALTER TABLE public.event_gallery_items ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas para event_gallery_items
DROP POLICY IF EXISTS "Allow public read access to active event_gallery_items" ON public.event_gallery_items;
CREATE POLICY "Allow public read access to active event_gallery_items" ON public.event_gallery_items
    FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Allow provider write access to own event_gallery_items" ON public.event_gallery_items;
CREATE POLICY "Allow provider write access to own event_gallery_items" ON public.event_gallery_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE public.events.id = event_gallery_items.event_id
              AND public.events.creator_id = auth.uid()
        )
    );

-- 4. Configurar bucket de storage para eventos
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-gallery', 'event-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Crear políticas de almacenamiento para el bucket event-gallery
DROP POLICY IF EXISTS "Public Read Access for event-gallery" ON storage.objects;
CREATE POLICY "Public Read Access for event-gallery" ON storage.objects
    FOR SELECT USING (bucket_id = 'event-gallery');

DROP POLICY IF EXISTS "Provider All Access for own event-gallery" ON storage.objects;
CREATE POLICY "Provider All Access for own event-gallery" ON storage.objects
    FOR ALL USING (bucket_id = 'event-gallery' AND auth.role() = 'authenticated');
