-- SQL Script to support advanced club features, visual identity, geolocation, modules, statuses, multi-user staff, franchises, plan types and visibility
-- Run this in the SQL editor in your Supabase Dashboard.

-- 1. Add franchise conceptual support and plan types
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS brand_id UUID DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';

-- 2. Add visual identity, geolocation, and advanced contact info columns
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS club_type TEXT DEFAULT 'Discoteca',
  ADD COLUMN IF NOT EXISTS whatsapp TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS facebook TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tiktok TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS website TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS price_range TEXT DEFAULT '$$',
  ADD COLUMN IF NOT EXISTS payment_methods TEXT[] DEFAULT '{"Efectivo", "Tarjeta"}'::TEXT[],
  ADD COLUMN IF NOT EXISTS latitude NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS video_hero TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS hero_image TEXT DEFAULT NULL;

-- 3. Add dynamic module configuration and simple modules lists
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS enabled_modules TEXT[] DEFAULT '{"reservations", "covers", "events", "qr"}'::TEXT[],
  ADD COLUMN IF NOT EXISTS modules_config JSONB DEFAULT '{}'::JSONB;

-- 4. Add establishment status (draft, pending_review, published, paused, archived)
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- Drop and recreate constraints safely
ALTER TABLE public.clubs DROP CONSTRAINT IF EXISTS clubs_status_check;
ALTER TABLE public.clubs ADD CONSTRAINT clubs_status_check CHECK (status IN ('draft', 'pending_review', 'published', 'paused', 'archived'));

ALTER TABLE public.clubs DROP CONSTRAINT IF EXISTS clubs_plan_type_check;
ALTER TABLE public.clubs ADD CONSTRAINT clubs_plan_type_check CHECK (plan_type IN ('free', 'pro', 'enterprise'));

ALTER TABLE public.clubs DROP CONSTRAINT IF EXISTS clubs_visibility_check;
ALTER TABLE public.clubs ADD CONSTRAINT clubs_visibility_check CHECK (visibility IN ('public', 'private', 'unlisted'));

-- 5. Add owner_id to support multi-user and multi-venue setups in the future
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) DEFAULT NULL;

-- Synchronize owner_id with provider_id for existing rows
UPDATE public.clubs SET owner_id = provider_id WHERE owner_id IS NULL AND provider_id IS NOT NULL;

-- Synchronize status with active flag for existing rows
UPDATE public.clubs SET status = 'published' WHERE status = 'draft' AND active = true;
UPDATE public.clubs SET status = 'paused' WHERE status = 'draft' AND active = false;

-- 6. Create club_staff table to support future team configurations (Owner, Manager, Doorman, Waiter, Cashier)
CREATE TABLE IF NOT EXISTS public.club_staff (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('owner', 'manager', 'doorman', 'waiter', 'cashier')) DEFAULT 'waiter',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(club_id, user_id)
);

-- Enable RLS for club_staff
ALTER TABLE public.club_staff ENABLE ROW LEVEL SECURITY;

-- Staff Policy: Providers can read staff for their own clubs, admins can read all
DROP POLICY IF EXISTS "Staff viewable by club owners" ON public.club_staff;
CREATE POLICY "Staff viewable by club owners" ON public.club_staff
  FOR SELECT USING (
    auth.uid() IN (
      SELECT provider_id FROM public.clubs WHERE id = club_id
    ) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Staff Policy: Club owners can manage staff
DROP POLICY IF EXISTS "Staff managed by club owners" ON public.club_staff;
CREATE POLICY "Staff managed by club owners" ON public.club_staff
  FOR ALL USING (
    auth.uid() IN (
      SELECT provider_id FROM public.clubs WHERE id = club_id
    ) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
