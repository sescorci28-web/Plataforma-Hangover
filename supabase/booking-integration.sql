-- Supabase SQL Editor repair script for club bookings & RLS
-- Run this in the SQL editor after the app is deployed.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'bookings'
  ) THEN
    ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'services'
  ) THEN
    ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'clubs'
  ) THEN
    ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS club_id UUID;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS club_slug TEXT;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS reservation_date DATE;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS number_of_people INTEGER DEFAULT 1;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS event_time TIME DEFAULT '00:00:00';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'service_id'
  ) THEN
    ALTER TABLE public.bookings ALTER COLUMN service_id DROP NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'clubs'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND constraint_name = 'bookings_club_id_fkey'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_club_id_fkey
      FOREIGN KEY (club_id)
      REFERENCES public.clubs(id)
      ON DELETE SET NULL;
  END IF;
END $$;

DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR auth.uid() = provider_id
);

DROP POLICY IF EXISTS "Authenticated users can insert bookings" ON public.bookings;
CREATE POLICY "Authenticated users can insert bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

DROP POLICY IF EXISTS "Users and providers can update bookings" ON public.bookings;
CREATE POLICY "Users and providers can update bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR auth.uid() = provider_id
)
WITH CHECK (
  auth.uid() = user_id
  OR auth.uid() = provider_id
);

DROP POLICY IF EXISTS "Public services are viewable" ON public.services;
CREATE POLICY "Public services are viewable"
ON public.services
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Providers can insert own services" ON public.services;
CREATE POLICY "Providers can insert own services"
ON public.services
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = provider_id
);

DROP POLICY IF EXISTS "Providers can update own services" ON public.services;
CREATE POLICY "Providers can update own services"
ON public.services
FOR UPDATE
TO authenticated
USING (
  auth.uid() = provider_id
)
WITH CHECK (
  auth.uid() = provider_id
);

DROP POLICY IF EXISTS "Public clubs are viewable" ON public.clubs;
CREATE POLICY "Public clubs are viewable"
ON public.clubs
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Providers can manage own clubs" ON public.clubs;
CREATE POLICY "Providers can manage own clubs"
ON public.clubs
FOR ALL
TO authenticated
USING (
  auth.uid() = provider_id
)
WITH CHECK (
  auth.uid() = provider_id
);
