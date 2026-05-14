-- Supabase Initial Schema for Hangover MVP

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS (Extends Supabase Auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('user', 'provider', 'admin')) DEFAULT 'user',
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CATEGORIES
CREATE TABLE public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SERVICES (Providers offer these)
CREATE TABLE public.services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  price_type TEXT NOT NULL CHECK (price_type IN ('fixed', 'hourly', 'per_guest')),
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- BOOKINGS
CREATE TABLE public.bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL NOT NULL,
  provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rejected')) DEFAULT 'pending',
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) Policies

-- Profiles: Users can read their own profile, everyone can read provider profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories: Anyone can read
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone." ON public.categories FOR SELECT USING (true);

-- Services: Anyone can read, only providers can manage their own
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services are viewable by everyone." ON public.services FOR SELECT USING (true);
CREATE POLICY "Providers can insert own services." ON public.services FOR INSERT WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Providers can update own services." ON public.services FOR UPDATE USING (auth.uid() = provider_id);

-- Bookings: Users can see their own, providers can see their received
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own bookings." ON public.bookings FOR SELECT USING (auth.uid() = user_id OR auth.uid() = provider_id);
CREATE POLICY "Users can insert bookings." ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Providers and Users can update their bookings." ON public.bookings FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = provider_id);

-- Create basic categories
INSERT INTO public.categories (name, slug, icon) VALUES
  ('DJs', 'djs', 'Music'),
  ('Sonido', 'sonido', 'Speaker'),
  ('Luces', 'luces', 'Lightbulb'),
  ('Catering', 'catering', 'Utensils'),
  ('Mobiliario', 'mobiliario', 'Armchair'),
  ('Decoración', 'decoracion', 'PartyPopper'),
  ('Discotecas', 'discotecas', 'Building2'),
  ('Eventos', 'eventos', 'Calendar');
