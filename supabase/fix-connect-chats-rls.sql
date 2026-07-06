-- Migration: Fix Row-Level Security (RLS) policies for connect_chats
-- To be run in the Supabase SQL Editor

-- 1. Clean up old policies
DROP POLICY IF EXISTS "Participants can view chats" ON public.connect_chats;
DROP POLICY IF EXISTS "Users can insert chats" ON public.connect_chats;
DROP POLICY IF EXISTS "Participants can update chats" ON public.connect_chats;

-- 2. CREATE SELECT POLICY (Only participants can read their chats)
CREATE POLICY "Participants can view chats" ON public.connect_chats
FOR SELECT TO authenticated
USING (
  (auth.uid() = user_a_id OR auth.uid() = user_b_id)
  -- Exclude active blocks
  AND NOT EXISTS (
    SELECT 1 FROM public.connect_blocks b
    WHERE (b.blocker_id = auth.uid() AND b.blocked_id = CASE WHEN user_a_id = auth.uid() THEN user_b_id ELSE user_a_id END)
       OR (b.blocker_id = CASE WHEN user_a_id = auth.uid() THEN user_b_id ELSE user_a_id END AND b.blocked_id = auth.uid())
  )
);

-- 3. CREATE INSERT POLICY (Participants can create chat if they are social matches, bookings partners or a provider is involved)
CREATE POLICY "Users can insert chats" ON public.connect_chats
FOR INSERT TO authenticated
WITH CHECK (
  -- The creator must be one of the chat participants
  (auth.uid() = user_a_id OR auth.uid() = user_b_id)
  AND (
    -- Option A: Social match (accepted connect request)
    EXISTS (
      SELECT 1 FROM public.connect_requests r
      WHERE r.status = 'accepted'
        AND ((r.sender_id = user_a_id AND r.receiver_id = user_b_id) OR (r.sender_id = user_b_id AND r.receiver_id = user_a_id))
    )
    -- Option B: Provider interaction (at least one participant is a provider)
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE (p.id = user_a_id OR p.id = user_b_id)
        AND p.role = 'provider'
    )
    -- Option C: Booking relation (there is an active booking between user and provider)
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE (b.user_id = user_a_id AND b.provider_id = user_b_id)
         OR (b.user_id = user_b_id AND b.provider_id = user_a_id)
    )
  )
);

-- 4. CREATE UPDATE POLICY (Only participants can edit chat details)
CREATE POLICY "Participants can update chats" ON public.connect_chats
FOR UPDATE TO authenticated
USING (auth.uid() = user_a_id OR auth.uid() = user_b_id)
WITH CHECK (auth.uid() = user_a_id OR auth.uid() = user_b_id);
