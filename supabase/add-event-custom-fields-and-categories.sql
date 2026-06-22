-- Migración: Añadir campos de experiencia, categorías y restricciones al modulo de eventos
-- Ejecutar en el Editor SQL de Supabase.

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Fiesta';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS dress_code TEXT DEFAULT 'Casual Premium';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS min_age INT DEFAULT 18;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS opening_time TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS closing_time TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS has_parking BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS has_vip_zone BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS has_tables_module BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_adults_only BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_free_entry BOOLEAN DEFAULT false;
