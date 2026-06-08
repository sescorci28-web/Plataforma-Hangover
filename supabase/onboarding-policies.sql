-- HANGOVER PROFILES RLS POLICIES MIGRATION
-- Run this in your Supabase SQL Editor

-- 1. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;

-- 2. Ensure Row Level Security (RLS) is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create INSERT policy (allowing authenticated users to create their own profile)
CREATE POLICY "Users can insert their own profile."
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 4. Create UPDATE policy (allowing authenticated users to update their own profile fields like role, provider_type, and onboarding_completed)
CREATE POLICY "Users can update own profile."
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
