-- ====================================================================
-- MIGRACIÓN VERIFICADA PARA EL BUSCADOR GLOBAL DE HANGOVER
-- Archivo: supabase/migrations/global_search_verified.sql
-- 
-- REVISIÓN DE SEGURIDAD Y VERIFICACIÓN REAL:
-- - Extensión pg_trgm para búsquedas ILIKE por subcadenas.
-- - ÚNICAMENTE incluye índices sobre columnas VERIFICADAS que existen físicamente.
-- - EXCLUYE columnas inexistentes (ej. profiles.instagram, services.status).
-- - 100% Idempotente (usando IF NOT EXISTS).
-- - NO elimina tablas, NO elimina registros, NO modifica datos existentes.
-- - NO modifica políticas RLS ni roles ni autenticación.
-- ====================================================================

-- 1. Habilitar extensión para aceleración de búsquedas ILIKE por subcadenas
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. ÍNDICES VERIFICADOS PARA PUBLIC.PROFILES
-- Columnas verificadas: username, full_name, city
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower 
  ON public.profiles (LOWER(username));

CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm 
  ON public.profiles USING gin (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_city_lower 
  ON public.profiles (LOWER(city));

-- 3. ÍNDICES VERIFICADOS PARA PUBLIC.EVENTS
-- Columnas verificadas: title, description, location, category
CREATE INDEX IF NOT EXISTS idx_events_title_trgm 
  ON public.events USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_events_description_trgm 
  ON public.events USING gin (description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_events_location_lower 
  ON public.events (LOWER(location));

CREATE INDEX IF NOT EXISTS idx_events_category_lower 
  ON public.events (LOWER(category));

-- 4. ÍNDICES VERIFICADOS PARA PUBLIC.CLUBS
-- Columnas verificadas: name, description, city, club_type
CREATE INDEX IF NOT EXISTS idx_clubs_name_trgm 
  ON public.clubs USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_clubs_description_trgm 
  ON public.clubs USING gin (description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_clubs_city_lower 
  ON public.clubs (LOWER(city));

CREATE INDEX IF NOT EXISTS idx_clubs_club_type_lower 
  ON public.clubs (LOWER(club_type));

-- 5. ÍNDICES VERIFICADOS PARA PUBLIC.SERVICES
-- Columnas verificadas: title, category, base_city, provider_id
CREATE INDEX IF NOT EXISTS idx_services_title_trgm 
  ON public.services USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_services_category_lower 
  ON public.services (LOWER(category));

CREATE INDEX IF NOT EXISTS idx_services_base_city_lower 
  ON public.services (LOWER(base_city));

CREATE INDEX IF NOT EXISTS idx_services_provider_id 
  ON public.services (provider_id);
