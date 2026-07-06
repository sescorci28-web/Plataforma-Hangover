-- Migration: Clean and enforce FSM uppercase status constraint on bookings table
-- Run this in your Supabase SQL Editor to clean any existing legacy status rows 
-- and apply the new constraint safely.

-- 1. Temporarily drop the status constraint to avoid conflicts during updates
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- 2. Update existing legacy lowercase statuses to their uppercase FSM equivalents
UPDATE public.bookings SET status = 'PENDING' WHERE status = 'pending';
UPDATE public.bookings SET status = 'PAID' WHERE status IN ('confirmed', 'confirmed_paid', 'paid', 'confirmed_vip');
UPDATE public.bookings SET status = 'ACCEPTED' WHERE status = 'accepted';
UPDATE public.bookings SET status = 'COMPLETED' WHERE status IN ('completed', 'finished');
UPDATE public.bookings SET status = 'REJECTED' WHERE status = 'rejected';
UPDATE public.bookings SET status = 'CANCELLED' WHERE status = 'cancelled';

-- 3. Force any other status to uppercase just in case
UPDATE public.bookings SET status = UPPER(status);

-- 4. Apply fallback default default status if null (just to be safe)
UPDATE public.bookings SET status = 'DRAFT' WHERE status IS NULL;

-- 5. Re-add the official status constraint with uppercase FSM states
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('DRAFT', 'PENDING', 'ACCEPTED', 'PAID', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED', 'REFUNDED', 'EXPIRED'));
