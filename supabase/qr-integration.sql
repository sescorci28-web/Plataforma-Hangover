-- Supabase SQL Editor script for QR codes integration
-- Run this in the SQL editor in your Supabase Dashboard.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS qr_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS qr_status TEXT CHECK (qr_status IN ('active', 'used', 'cancelled')) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS qr_validated_at TIMESTAMP WITH TIME ZONE;

-- Create an index for faster queries on qr_code
CREATE INDEX IF NOT EXISTS bookings_qr_code_idx ON public.bookings(qr_code);
