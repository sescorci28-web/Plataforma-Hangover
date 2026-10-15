-- ==============================================================================
-- MIGRACIÓN ADITIVA Y SEGURA: POLÍTICAS RLS PARA EVENTOS (public.events)
-- Archivo: supabase/migrations/20260918010000_business_events_rls.sql
-- Ámbito: Hangover Business (Creación, edición y administración de eventos por discoteca)
-- Principio: 100% Aditiva, Idempotente, No Destructiva y con RLS Blindado Multi-Discoteca
-- ==============================================================================

-- 1. Asegurar que RLS esté activo en public.events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 2. Limpieza de políticas públicas permisivas obsoletas (si existen)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Events are viewable by everyone') THEN
    DROP POLICY "Events are viewable by everyone" ON public.events;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Allow public read access to events') THEN
    DROP POLICY "Allow public read access to events" ON public.events;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Public read access for events') THEN
    DROP POLICY "Public read access for events" ON public.events;
  END IF;
END $$;

-- 3. POLÍTICA DE LECTURA (SELECT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Scoped select for public and authorized business staff'
  ) THEN
    CREATE POLICY "Scoped select for public and authorized business staff"
    ON public.events FOR SELECT
    USING (
      status = 'published'
      OR
      (business_id IS NOT NULL AND public.is_business_member(business_id))
      OR
      (club_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.clubs c
        WHERE c.id = public.events.club_id
          AND (
            c.owner_id = auth.uid()
            OR (c.business_id IS NOT NULL AND public.is_business_member(c.business_id))
          )
      ))
      OR
      (auth.uid() IS NOT NULL AND creator_id = auth.uid())
    );
  END IF;
END $$;

-- 4. POLÍTICA DE INSERCIÓN (INSERT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Authorized personnel insert club events'
  ) THEN
    CREATE POLICY "Authorized personnel insert club events"
    ON public.events FOR INSERT
    TO authenticated
    WITH CHECK (
      auth.uid() IS NOT NULL
      AND (
        (business_id IS NOT NULL AND public.is_business_member(business_id))
        OR
        (club_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.clubs c
          WHERE c.id = public.events.club_id
            AND (
              c.owner_id = auth.uid()
              OR (c.business_id IS NOT NULL AND public.is_business_member(c.business_id))
            )
        ))
        OR
        (creator_id = auth.uid())
      )
      AND (
        club_id IS NULL 
        OR business_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.clubs c
          WHERE c.id = public.events.club_id
            AND (c.business_id IS NULL OR c.business_id = public.events.business_id)
        )
      )
    );
  END IF;
END $$;

-- 5. POLÍTICA DE ACTUALIZACIÓN (UPDATE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Authorized staff update own club events'
  ) THEN
    CREATE POLICY "Authorized staff update own club events"
    ON public.events FOR UPDATE
    TO authenticated
    USING (
      auth.uid() IS NOT NULL
      AND (
        (business_id IS NOT NULL AND public.is_business_owner_or_admin(business_id))
        OR
        (club_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.clubs c
          WHERE c.id = public.events.club_id
            AND (
              c.owner_id = auth.uid()
              OR (c.business_id IS NOT NULL AND public.is_business_owner_or_admin(c.business_id))
            )
        ))
        OR
        (creator_id = auth.uid())
      )
    )
    WITH CHECK (
      auth.uid() IS NOT NULL
      AND (
        (business_id IS NOT NULL AND public.is_business_owner_or_admin(business_id))
        OR
        (club_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.clubs c
          WHERE c.id = public.events.club_id
            AND (
              c.owner_id = auth.uid()
              OR (c.business_id IS NOT NULL AND public.is_business_owner_or_admin(c.business_id))
            )
        ))
        OR
        (creator_id = auth.uid())
      )
      AND (
        club_id IS NULL 
        OR business_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.clubs c
          WHERE c.id = public.events.club_id
            AND (c.business_id IS NULL OR c.business_id = public.events.business_id)
        )
      )
    );
  END IF;
END $$;

-- 6. POLÍTICA DE ELIMINACIÓN (DELETE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Authorized staff delete own club events'
  ) THEN
    CREATE POLICY "Authorized staff delete own club events"
    ON public.events FOR DELETE
    TO authenticated
    USING (
      auth.uid() IS NOT NULL
      AND (
        (business_id IS NOT NULL AND public.is_business_owner_or_admin(business_id))
        OR
        (club_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.clubs c
          WHERE c.id = public.events.club_id
            AND (
              c.owner_id = auth.uid()
              OR (c.business_id IS NOT NULL AND public.is_business_owner_or_admin(c.business_id))
            )
        ))
        OR
        (creator_id = auth.uid())
      )
    );
  END IF;
END $$;
