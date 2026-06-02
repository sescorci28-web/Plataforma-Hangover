-- SQL Script to support Club Covers and Booking Types
-- Run this in the SQL editor in your Supabase Dashboard.

-- 1. Agregar precio de cover a las discotecas (clubs)
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS cover_price DECIMAL(10,2) DEFAULT 0.00;

-- 2. Agregar tipo de reserva a los bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booking_type TEXT CHECK (booking_type IN ('event', 'service', 'club_cover', 'club_vip')) DEFAULT 'service';

-- 3. Sincronizar registros existentes para mantener consistencia de datos
UPDATE public.bookings
  SET booking_type = 'event'
  WHERE event_id IS NOT NULL;

UPDATE public.bookings
  SET booking_type = 'club_vip'
  WHERE club_id IS NOT NULL;

UPDATE public.bookings
  SET booking_type = 'service'
  WHERE service_id IS NOT NULL;
