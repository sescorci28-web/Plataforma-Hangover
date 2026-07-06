-- Migration: Add extended fields to public.bookings
-- To be run in the Supabase SQL Editor

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS event_name TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS location_name TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS special_requirements TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS file_urls TEXT[];
