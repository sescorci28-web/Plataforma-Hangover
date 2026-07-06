-- Migration: Schema update for synchronized booking flow
-- To be run in the Supabase SQL Editor

-- 1. Update status constraint in bookings table to support FSM states
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('DRAFT', 'PENDING', 'ACCEPTED', 'PAID', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED', 'REFUNDED', 'EXPIRED'));

-- 2. Create booking_timeline_events table
CREATE TABLE IF NOT EXISTS public.booking_timeline_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  state TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for booking_timeline_events
ALTER TABLE public.booking_timeline_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view timeline events" ON public.booking_timeline_events;
CREATE POLICY "Participants can view timeline events" ON public.booking_timeline_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND (b.user_id = auth.uid() OR b.provider_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "System/Participants can insert timeline events" ON public.booking_timeline_events;
CREATE POLICY "System/Participants can insert timeline events" ON public.booking_timeline_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND (b.user_id = auth.uid() OR b.provider_id = auth.uid())
    )
  );

-- 3. Create user_notifications table
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('booking_update', 'new_message', 'reminder', 'system')),
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for user_notifications
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.user_notifications;
CREATE POLICY "Users can view their own notifications" ON public.user_notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notification read status" ON public.user_notifications;
CREATE POLICY "Users can update their own notification read status" ON public.user_notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON public.user_notifications;
CREATE POLICY "System can insert notifications" ON public.user_notifications
  FOR INSERT TO authenticated WITH CHECK (true);
