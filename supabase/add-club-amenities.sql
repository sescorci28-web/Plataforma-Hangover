-- Migración SQL para Hangover: Agregar Amenities/Características a las Discotecas
-- Ejecutar este script en el Editor SQL de Supabase

ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}'::TEXT[];
