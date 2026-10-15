-- ==============================================================================
-- MIGRACIÓN CONSOLIDADA DEFINITIVA: STORAGE 'club-media' + RLS EN EVENTS
-- Archivo: supabase/migrations/20260918020000_fix_storage_and_events_rls.sql
-- Ámbito: Hangover Business & Hangover Users
-- Propósito: 
--   1. Crear y configurar el bucket real 'club-media' en Supabase Storage.
--   2. Establecer políticas RLS seguras para 'storage.objects' bajo 'club-media'.
--   3. Sincronizar membresías en 'public.business_members'.
--   4. Corregir y blindar las políticas RLS en 'public.events' (SELECT, INSERT, UPDATE, DELETE).
-- ==============================================================================

-- ==============================================================================
-- 1. BUCKET REAL 'club-media' EN SUPABASE STORAGE
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'club-media',
  'club-media',
  true,
  52428800, -- 50 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ==============================================================================
-- 2. POLÍTICAS RLS EN storage.objects PARA 'club-media'
-- ==============================================================================

-- 2.1 Limpiar políticas previas si existen
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public Read club-media') THEN
    DROP POLICY "Public Read club-media" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Authorized Staff Insert club-media') THEN
    DROP POLICY "Authorized Staff Insert club-media" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Authorized Staff Update club-media') THEN
    DROP POLICY "Authorized Staff Update club-media" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Authorized Staff Delete club-media') THEN
    DROP POLICY "Authorized Staff Delete club-media" ON storage.objects;
  END IF;
END $$;

-- 2.2 Lectura pública para cualquier cliente (Hangover Users y Business)
CREATE POLICY "Public Read club-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'club-media');

-- 2.3 Subida (INSERT) autorizada por club
CREATE POLICY "Authorized Staff Insert club-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'club-media'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'clubs'
  AND EXISTS (
    SELECT 1 FROM public.clubs c
    WHERE c.id::text = (storage.foldername(name))[2]
      AND (
        c.owner_id = auth.uid()
        OR (c.business_id IS NOT NULL AND public.is_business_member(c.business_id))
      )
  )
);

-- 2.4 Actualización (UPDATE) autorizada por club
CREATE POLICY "Authorized Staff Update club-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'club-media'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'clubs'
  AND EXISTS (
    SELECT 1 FROM public.clubs c
    WHERE c.id::text = (storage.foldername(name))[2]
      AND (
        c.owner_id = auth.uid()
        OR (c.business_id IS NOT NULL AND public.is_business_member(c.business_id))
      )
  )
);

-- 2.5 Eliminación (DELETE) autorizada por club
CREATE POLICY "Authorized Staff Delete club-media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'club-media'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'clubs'
  AND EXISTS (
    SELECT 1 FROM public.clubs c
    WHERE c.id::text = (storage.foldername(name))[2]
      AND (
        c.owner_id = auth.uid()
        OR (c.business_id IS NOT NULL AND public.is_business_member(c.business_id))
      )
  )
);

-- ==============================================================================
-- 3. SINCRONIZACIÓN DE MEMBRESÍAS (public.business_members)
-- ==============================================================================
-- Sincronizar automáticamente los propietarios registrados de negocios existentes
INSERT INTO public.business_members (business_id, user_id, role, is_active)
SELECT id, owner_id, 'owner', true
FROM public.businesses
WHERE owner_id IS NOT NULL
ON CONFLICT (business_id, user_id) DO UPDATE SET role = 'owner', is_active = true;

-- Otorgar membresía de administración al perfil de Sergio Escorcia (sescorci28) en los negocios existentes
INSERT INTO public.business_members (business_id, user_id, role, is_active)
SELECT b.id, '05bc36e0-2b47-4d4c-aa76-4ffb04d46ccf'::uuid, 'admin', true
FROM public.businesses b
ON CONFLICT (business_id, user_id) DO UPDATE SET role = 'admin', is_active = true;

-- ==============================================================================
-- 4. POLÍTICAS RLS EN public.events
-- ==============================================================================

-- 4.1 Asegurar que RLS esté activo
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 4.2 Limpiar políticas previas obsoletas o conflictivas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND schemaname = 'public' AND policyname = 'Events are viewable by everyone') THEN
    DROP POLICY "Events are viewable by everyone" ON public.events;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND schemaname = 'public' AND policyname = 'Allow public read access to events') THEN
    DROP POLICY "Allow public read access to events" ON public.events;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND schemaname = 'public' AND policyname = 'Public read access for events') THEN
    DROP POLICY "Public read access for events" ON public.events;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND schemaname = 'public' AND policyname = 'Scoped select for public and authorized business staff') THEN
    DROP POLICY "Scoped select for public and authorized business staff" ON public.events;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND schemaname = 'public' AND policyname = 'Authorized personnel insert club events') THEN
    DROP POLICY "Authorized personnel insert club events" ON public.events;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND schemaname = 'public' AND policyname = 'Authorized staff update own club events') THEN
    DROP POLICY "Authorized staff update own club events" ON public.events;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND schemaname = 'public' AND policyname = 'Authorized staff delete own club events') THEN
    DROP POLICY "Authorized staff delete own club events" ON public.events;
  END IF;
END $$;

-- 4.3 POLÍTICA SELECT (Lectura Segura):
-- - Público general: Únicamente status = 'published'
-- - Creador original: Ve sus propios eventos
-- - Personal autorizado del club o negocio: Ve todos los estados (draft, published, etc.)
CREATE POLICY "Scoped select for public and authorized business staff"
ON public.events FOR SELECT
USING (
  status = 'published'
  OR
  (auth.uid() IS NOT NULL AND creator_id = auth.uid())
  OR
  (auth.uid() IS NOT NULL AND club_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.clubs c
    WHERE c.id = events.club_id
      AND (
        c.owner_id = auth.uid()
        OR (c.business_id IS NOT NULL AND public.is_business_member(c.business_id))
      )
  ))
  OR
  (auth.uid() IS NOT NULL AND business_id IS NOT NULL AND public.is_business_member(business_id))
);

-- 4.4 POLÍTICA INSERT:
-- Exige:
-- 1. auth.uid() no nulo.
-- 2. creator_id = auth.uid().
-- 3. club_id no nulo y perteneciente a una discoteca administrada por el usuario.
-- 4. events.business_id idéntico al clubs.business_id (blindaje anti-inyección).
CREATE POLICY "Authorized personnel insert club events"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND creator_id = auth.uid()
  AND club_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.clubs c
    WHERE c.id = events.club_id
      AND events.business_id IS NOT DISTINCT FROM c.business_id
      AND (
        c.owner_id = auth.uid()
        OR (c.business_id IS NOT NULL AND public.is_business_member(c.business_id))
      )
  )
);

-- 4.5 POLÍTICA UPDATE:
-- Permite actualizar únicamente a los administradores/dueños del club o al creador original.
-- Impide alterar o traspasar la relación de club o negocio.
CREATE POLICY "Authorized staff update own club events"
ON public.events FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND club_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.clubs c
    WHERE c.id = events.club_id
      AND (
        c.owner_id = auth.uid()
        OR (c.business_id IS NOT NULL AND public.is_business_owner_or_admin(c.business_id))
        OR events.creator_id = auth.uid()
      )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND club_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.clubs c
    WHERE c.id = events.club_id
      AND events.business_id IS NOT DISTINCT FROM c.business_id
      AND (
        c.owner_id = auth.uid()
        OR (c.business_id IS NOT NULL AND public.is_business_owner_or_admin(c.business_id))
        OR events.creator_id = auth.uid()
      )
  )
);

-- 4.6 POLÍTICA DELETE:
CREATE POLICY "Authorized staff delete own club events"
ON public.events FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND club_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.clubs c
    WHERE c.id = events.club_id
      AND (
        c.owner_id = auth.uid()
        OR (c.business_id IS NOT NULL AND public.is_business_owner_or_admin(c.business_id))
        OR events.creator_id = auth.uid()
      )
  )
);
