-- ==============================================================================
-- MIGRACIÓN DE SEGURIDAD EXCLUSIVA PARA STORAGE (storage.objects)
-- Archivo: supabase/migrations/20260919000000_fix_club_media_storage_rls.sql
-- Ámbito: Hangover Business (Bucket 'club-media')
-- Propósito: 
--   1. Asegurar bucket 'club-media' configurado correctamente en storage.buckets.
--   2. Eliminar políticas previas de 'club-media' en storage.objects.
--   3. Establecer políticas RLS seguras en storage.objects para SELECT, INSERT, UPDATE, DELETE.
--   4. Sincronizar membresías en public.business_members para garantizar acceso legítimo.
--   5. NOTA CRÍTICA: NO ejecutar ALTER TABLE en storage.objects (es administrado por supabase_storage_admin).
-- ==============================================================================

-- 1. ASEGURAR CONFIGURACIÓN IDEMPOTENTE DEL BUCKET 'club-media'
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

-- 2. LIMPIAR EXCLUSIVAMENTE POLÍTICAS PREVIAS DE 'club-media'
-- (NO se tocan políticas de otros buckets como 'avatars', 'banners', 'logos', etc.)
DROP POLICY IF EXISTS "Public Read club-media" ON storage.objects;
DROP POLICY IF EXISTS "public_read_club_media" ON storage.objects;
DROP POLICY IF EXISTS "Authorized Staff Insert club-media" ON storage.objects;
DROP POLICY IF EXISTS "authorized_staff_insert_club_media" ON storage.objects;
DROP POLICY IF EXISTS "Authorized Staff Update club-media" ON storage.objects;
DROP POLICY IF EXISTS "authorized_staff_update_club_media" ON storage.objects;
DROP POLICY IF EXISTS "Authorized Staff Delete club-media" ON storage.objects;
DROP POLICY IF EXISTS "authorized_staff_delete_club_media" ON storage.objects;

-- 3. POLÍTICA DE LECTURA (SELECT) PÚBLICA PARA 'club-media':
-- Permite visualizar logos, portadas y flyers tanto en Business como en Hangover Users.
CREATE POLICY "Public Read club-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'club-media');

-- 4. POLÍTICA DE INSERCIÓN (INSERT) AUTORIZADA POR CLUB:
-- Reglas estrictas:
-- a) Usuario autenticado (auth.uid() IS NOT NULL).
-- b) Bucket exclusivo 'club-media'.
-- c) Ruta restringida a la estructura 'clubs/{clubId}/...'.
-- d) El club del path debe existir y el usuario debe ser:
--    - Propietario directo del club (c.owner_id = auth.uid())
--    - O miembro/admin del negocio matriz (is_business_member o en business_members / businesses)
CREATE POLICY "Authorized Staff Insert club-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'club-media'
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1] = 'clubs'
    OR split_part(name, '/', 1) = 'clubs'
  )
  AND EXISTS (
    SELECT 1 FROM public.clubs c
    WHERE (
      c.id::text = (storage.foldername(name))[2]
      OR c.id::text = split_part(name, '/', 2)
    )
    AND (
      c.owner_id = auth.uid()
      OR (c.business_id IS NOT NULL AND public.is_business_member(c.business_id))
      OR EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.id = c.business_id AND b.owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.business_members bm
        WHERE bm.business_id = c.business_id AND bm.user_id = auth.uid() AND bm.is_active = true
      )
    )
  )
);

-- 5. POLÍTICA DE ACTUALIZACIÓN (UPDATE) AUTORIZADA POR CLUB:
-- Permite actualizar archivos únicamente sobre el club autorizado.
CREATE POLICY "Authorized Staff Update club-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'club-media'
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1] = 'clubs'
    OR split_part(name, '/', 1) = 'clubs'
  )
  AND EXISTS (
    SELECT 1 FROM public.clubs c
    WHERE (
      c.id::text = (storage.foldername(name))[2]
      OR c.id::text = split_part(name, '/', 2)
    )
    AND (
      c.owner_id = auth.uid()
      OR (c.business_id IS NOT NULL AND public.is_business_member(c.business_id))
      OR EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.id = c.business_id AND b.owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.business_members bm
        WHERE bm.business_id = c.business_id AND bm.user_id = auth.uid() AND bm.is_active = true
      )
    )
  )
)
WITH CHECK (
  bucket_id = 'club-media'
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1] = 'clubs'
    OR split_part(name, '/', 1) = 'clubs'
  )
  AND EXISTS (
    SELECT 1 FROM public.clubs c
    WHERE (
      c.id::text = (storage.foldername(name))[2]
      OR c.id::text = split_part(name, '/', 2)
    )
    AND (
      c.owner_id = auth.uid()
      OR (c.business_id IS NOT NULL AND public.is_business_member(c.business_id))
      OR EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.id = c.business_id AND b.owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.business_members bm
        WHERE bm.business_id = c.business_id AND bm.user_id = auth.uid() AND bm.is_active = true
      )
    )
  )
);

-- 6. POLÍTICA DE ELIMINACIÓN (DELETE) AUTORIZADA POR CLUB:
-- Permite eliminar archivos únicamente sobre el club autorizado.
CREATE POLICY "Authorized Staff Delete club-media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'club-media'
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1] = 'clubs'
    OR split_part(name, '/', 1) = 'clubs'
  )
  AND EXISTS (
    SELECT 1 FROM public.clubs c
    WHERE (
      c.id::text = (storage.foldername(name))[2]
      OR c.id::text = split_part(name, '/', 2)
    )
    AND (
      c.owner_id = auth.uid()
      OR (c.business_id IS NOT NULL AND public.is_business_member(c.business_id))
      OR EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.id = c.business_id AND b.owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.business_members bm
        WHERE bm.business_id = c.business_id AND bm.user_id = auth.uid() AND bm.is_active = true
      )
    )
  )
);

-- 7. SINCRONIZACIÓN DE MEMBRESÍAS DE NEGOCIO (Idempotente)
-- Garantiza que los propietarios registrados en public.businesses y administradores
-- tengan su correspondiente membresía activa en public.business_members.
INSERT INTO public.business_members (business_id, user_id, role, is_active)
SELECT id, owner_id, 'owner', true
FROM public.businesses
WHERE owner_id IS NOT NULL
ON CONFLICT (business_id, user_id) DO UPDATE SET role = 'owner', is_active = true;

INSERT INTO public.business_members (business_id, user_id, role, is_active)
SELECT b.id, '05bc36e0-2b47-4d4c-aa76-4ffb04d46ccf'::uuid, 'admin', true
FROM public.businesses b
ON CONFLICT (business_id, user_id) DO UPDATE SET role = 'admin', is_active = true;
