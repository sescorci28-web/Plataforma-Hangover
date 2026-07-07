-- HANGOVER SEARCH - OPTIMIZACIÓN DE BÚSQUEDA CON ÍNDICES TRIGRAM
-- Ejecutar este script en el Editor SQL de Supabase

-- Habilitar extensión pg_trgm si no está activa
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Asegurar que la columna city existe en public.profiles para evitar errores en las consultas de búsqueda
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Barranquilla';

-- Índices trigram para búsquedas de perfiles (ilike)
CREATE INDEX IF NOT EXISTS idx_profiles_trgm_name ON public.profiles USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_trgm_username ON public.profiles USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_trgm_city ON public.profiles USING gin (city gin_trgm_ops);

-- Índices trigram para búsquedas en clubs (discotecas)
CREATE INDEX IF NOT EXISTS idx_clubs_trgm_name ON public.clubs USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clubs_trgm_city ON public.clubs USING gin (city gin_trgm_ops);

-- Índices trigram para búsquedas en events (eventos)
CREATE INDEX IF NOT EXISTS idx_events_trgm_title ON public.events USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_events_trgm_location ON public.events USING gin (location gin_trgm_ops);

-- Índices trigram para búsquedas en services (servicios)
CREATE INDEX IF NOT EXISTS idx_services_trgm_title ON public.services USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_services_trgm_category ON public.services USING gin (category gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_services_trgm_base_city ON public.services USING gin (base_city gin_trgm_ops);
