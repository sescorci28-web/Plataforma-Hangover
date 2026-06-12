-- Add capacity column to clubs table if it doesn't exist
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 500;
