-- HANGOVER CONNECT - MIGRACIÓN SQL COMPLETA DE RED SOCIAL Y GAMIFICACIÓN
-- Ejecutar este script en el Editor SQL de Supabase

-- 1. SOCIAL PROFILE / PREFERENCES IN PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mood TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS favorite_genres TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS main_crew_id UUID DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_city TEXT DEFAULT 'Barranquilla';

-- 2. CREWS SYSTEM
CREATE TABLE IF NOT EXISTS public.connect_crews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT DEFAULT NULL,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.connect_crew_members (
  crew_id UUID REFERENCES public.connect_crews(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted')) DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (crew_id, user_id)
);

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS fk_profiles_main_crew;
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_main_crew FOREIGN KEY (main_crew_id) REFERENCES public.connect_crews(id) ON DELETE SET NULL;

-- 3. FOLLOWERS / FOLLOWING
CREATE TABLE IF NOT EXISTS public.connect_follows (
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (follower_id, following_id)
);

-- 4. USER REPUTATION & SOCIAL LEVELING
CREATE TABLE IF NOT EXISTS public.connect_user_reputation (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  score INTEGER DEFAULT 100 NOT NULL,
  completed_reservations INTEGER DEFAULT 0 NOT NULL,
  events_attended INTEGER DEFAULT 0 NOT NULL,
  comments_received INTEGER DEFAULT 0 NOT NULL,
  positive_ratings INTEGER DEFAULT 0 NOT NULL,
  points INTEGER DEFAULT 0 NOT NULL,
  level_name TEXT CHECK (level_name IN ('Rookie', 'Popular', 'VIP', 'Influencer', 'Legend')) DEFAULT 'Rookie' NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. VALIDATED ATTENDED EVENTS (strict relation verified by QR validation 'used' or reservation status 'completed')
CREATE TABLE IF NOT EXISTS public.connect_attended_events (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, event_id)
);

-- 6. FAVORITE CLUBS
CREATE TABLE IF NOT EXISTS public.connect_favorite_clubs (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, club_id)
);

-- 7. SPONTANEOUS SOCIAL PLANS
CREATE TABLE IF NOT EXISTS public.connect_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT NULL,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  city TEXT DEFAULT 'Barranquilla' NOT NULL,
  plan_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT plans_venue_check CHECK (
    (club_id IS NOT NULL AND event_id IS NULL) OR 
    (club_id IS NULL AND event_id IS NOT NULL) OR
    (club_id IS NULL AND event_id IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.connect_plan_members (
  plan_id UUID REFERENCES public.connect_plans(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (plan_id, user_id)
);

-- 8. CHECK-INS & LIVE PRESENCE
CREATE TABLE IF NOT EXISTS public.connect_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  privacy TEXT CHECK (privacy IN ('public', 'crew_only', 'private')) DEFAULT 'public' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT checkin_venue_check CHECK (
    (club_id IS NOT NULL AND event_id IS NULL) OR 
    (club_id IS NULL AND event_id IS NOT NULL)
  )
);

-- 9. COLLABORATIVE EVENT ALBUMS
CREATE TABLE IF NOT EXISTS public.connect_collaborative_albums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  caption TEXT DEFAULT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video')) DEFAULT 'image' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. SOCIAL FEEDS, POSTS, REACTIONS & COMMENTS
CREATE TABLE IF NOT EXISTS public.connect_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  caption TEXT DEFAULT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'reel')) DEFAULT 'image' NOT NULL,
  club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  city TEXT DEFAULT 'Barranquilla' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.connect_post_reactions (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.connect_posts(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT CHECK (reaction_type IN ('brutal', 'me_apunto', 'vamos', 'me_gusta')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, post_id, reaction_type)
);

CREATE TABLE IF NOT EXISTS public.connect_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.connect_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.connect_stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video')) DEFAULT 'image' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '24 hours') NOT NULL
);

-- 11. PROFESSIONAL REPUTATION
CREATE TABLE IF NOT EXISTS public.connect_provider_reputation (
  provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  gigs_performed INTEGER DEFAULT 0 NOT NULL,
  repeat_clients INTEGER DEFAULT 0 NOT NULL,
  completed_bookings INTEGER DEFAULT 0 NOT NULL,
  satisfaction_rating NUMERIC DEFAULT 5.0 NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. ACHIEVEMENTS & GAMIFICATION
CREATE TABLE IF NOT EXISTS public.connect_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  points_reward INTEGER DEFAULT 50 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.connect_user_achievements (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.connect_achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, achievement_id)
);

-- 13. REPORTING & MODERATION
CREATE TABLE IF NOT EXISTS public.connect_moderation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_post_id UUID REFERENCES public.connect_posts(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT mod_subject_check CHECK (
    (reported_user_id IS NOT NULL AND reported_post_id IS NULL) OR 
    (reported_user_id IS NULL AND reported_post_id IS NOT NULL)
  )
);

-- 14. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.connect_crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_attended_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_favorite_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_plan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_collaborative_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_provider_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_moderation ENABLE ROW LEVEL SECURITY;

-- Simple permissive policies for authenticated users to query and insert (secured by user_id references matching auth.uid())
CREATE POLICY "Crews RLS" ON public.connect_crews FOR ALL TO authenticated USING (true) WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Crew members RLS" ON public.connect_crew_members FOR ALL TO authenticated USING (true) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Follows RLS" ON public.connect_follows FOR ALL TO authenticated USING (true) WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "User rep select" ON public.connect_user_reputation FOR SELECT TO authenticated USING (true);
CREATE POLICY "User rep manage" ON public.connect_user_reputation FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Attended events RLS" ON public.connect_attended_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Fav clubs RLS" ON public.connect_favorite_clubs FOR ALL TO authenticated USING (true) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Plans RLS" ON public.connect_plans FOR ALL TO authenticated USING (true) WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Plan members RLS" ON public.connect_plan_members FOR ALL TO authenticated USING (true) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Checkins RLS" ON public.connect_checkins FOR ALL TO authenticated USING (true) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Collab albums select" ON public.connect_collaborative_albums FOR SELECT TO authenticated USING (true);
CREATE POLICY "Collab albums insert" ON public.connect_collaborative_albums FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Posts select" ON public.connect_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Posts insert" ON public.connect_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Post reactions RLS" ON public.connect_post_reactions FOR ALL TO authenticated USING (true) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Comments RLS" ON public.connect_comments FOR ALL TO authenticated USING (true) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Stories select" ON public.connect_stories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Stories insert" ON public.connect_stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Provider rep RLS" ON public.connect_provider_reputation FOR SELECT TO authenticated USING (true);
CREATE POLICY "Achievements RLS" ON public.connect_achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "User achievements select" ON public.connect_user_achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Moderation insert" ON public.connect_moderation FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
