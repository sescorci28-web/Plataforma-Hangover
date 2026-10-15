-- ====================================================================
-- MIGRACIÓN PARA OPTIMIZACIÓN Y ÍNDICES DEL BUSCADOR GLOBAL DE HANGOVER
-- Archivo: supabase/migrations/global_search.sql
-- 
-- OBJETIVO:
-- Configurar la extensión pg_trgm e índices de alto rendimiento para
-- búsquedas case-insensitive en las tablas reales existentes:
-- 1. public.profiles (Usuarios y Proveedores)
-- 2. public.events (Eventos)
-- 3. public.clubs (Discotecas y Clubs)
-- 4. public.services (Servicios)
--
-- GARANTÍAS DE SEGURIDAD:
-- - 100% Idempotente (usando IF NOT EXISTS)
-- - NO elimina tablas (sin DROP TABLE)
-- - NO elimina registros (sin DELETE)
-- - NO altera políticas RLS funcionales existentes
-- - NO modifica datos ni credenciales
-- ====================================================================

-- 1. Habilitar extensión para búsquedas de texto eficientes con ILIKE (%query%)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. ÍNDICES PARA PUBLIC.PROFILES
-- Optimiza búsquedas case-insensitive por username, full_name y city
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower 
  ON public.profiles (LOWER(username));

CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm 
  ON public.profiles USING gin (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_city_lower 
  ON public.profiles (LOWER(city));

-- 3. ÍNDICES PARA PUBLIC.EVENTS
-- Optimiza búsquedas en eventos por título, descripción, ubicación y categoría
CREATE INDEX IF NOT EXISTS idx_events_title_trgm 
  ON public.events USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_events_description_trgm 
  ON public.events USING gin (description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_events_location_lower 
  ON public.events (LOWER(location));

CREATE INDEX IF NOT EXISTS idx_events_category_lower 
  ON public.events (LOWER(category));

-- 4. ÍNDICES PARA PUBLIC.CLUBS
-- Optimiza búsquedas en discotecas por nombre, descripción, ciudad y tipo de club
CREATE INDEX IF NOT EXISTS idx_clubs_name_trgm 
  ON public.clubs USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_clubs_description_trgm 
  ON public.clubs USING gin (description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_clubs_city_lower 
  ON public.clubs (LOWER(city));

CREATE INDEX IF NOT EXISTS idx_clubs_club_type_lower 
  ON public.clubs (LOWER(club_type));

-- 5. ÍNDICES PARA PUBLIC.SERVICES
-- Optimiza búsquedas en servicios por título, categoría, ciudad base y proveedor
CREATE INDEX IF NOT EXISTS idx_services_title_trgm 
  ON public.services USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_services_category_lower 
  ON public.services (LOWER(category));

CREATE INDEX IF NOT EXISTS idx_services_base_city_lower 
  ON public.services (LOWER(base_city));

CREATE INDEX IF NOT EXISTS idx_services_provider_id 
  ON public.services (provider_id);
