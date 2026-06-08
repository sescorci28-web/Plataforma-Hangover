-- HANGOVER USER FAVORITES MIGRATION
-- Run this in your Supabase SQL Editor

-- 1. Create table for user favorite clubs
CREATE TABLE IF NOT EXISTS public.user_favorite_clubs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, club_id)
);

-- 2. Create table for user favorite events
CREATE TABLE IF NOT EXISTS public.user_favorite_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, event_id)
);

-- 3. Create table for user favorite services
CREATE TABLE IF NOT EXISTS public.user_favorite_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, service_id)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.user_favorite_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorite_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorite_services ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Users can only see and manage their own favorites)

-- user_favorite_clubs Policies
DROP POLICY IF EXISTS "Users can read own favorite clubs" ON public.user_favorite_clubs;
CREATE POLICY "Users can read own favorite clubs"
ON public.user_favorite_clubs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own favorite clubs" ON public.user_favorite_clubs;
CREATE POLICY "Users can manage own favorite clubs"
ON public.user_favorite_clubs FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- user_favorite_events Policies
DROP POLICY IF EXISTS "Users can read own favorite events" ON public.user_favorite_events;
CREATE POLICY "Users can read own favorite events"
ON public.user_favorite_events FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own favorite events" ON public.user_favorite_events;
CREATE POLICY "Users can manage own favorite events"
ON public.user_favorite_events FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- user_favorite_services Policies
DROP POLICY IF EXISTS "Users can read own favorite services" ON public.user_favorite_services;
CREATE POLICY "Users can read own favorite services"
ON public.user_favorite_services FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own favorite services" ON public.user_favorite_services;
CREATE POLICY "Users can manage own favorite services"
ON public.user_favorite_services FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
