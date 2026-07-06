-- HANGOVER EVENT MARKETPLACE - SPONSORED & FEATURED MIGRATION
-- Run this in your Supabase SQL Editor

-- 1. Add is_featured and is_sponsored columns if they do not exist
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN DEFAULT false NOT NULL;

-- 2. Create index on event_date and columns for performance
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_featured_sponsored ON public.events(is_featured, is_sponsored);
