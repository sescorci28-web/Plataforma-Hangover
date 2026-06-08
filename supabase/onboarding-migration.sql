-- HANGOVER ONBOARDING MIGRATION
-- Run this in your Supabase SQL Editor to support the onboarding system

-- 1. Add onboarding columns to public.profiles table if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS provider_type TEXT;

-- 2. Ensure check constraints for provider_type
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_provider_type;
ALTER TABLE public.profiles ADD CONSTRAINT check_provider_type CHECK (provider_type IN ('club', 'event_organizer', 'service_provider'));
