-- ==============================================================================
-- PLATAFORMA HANGOVER - MIGRACIÓN DE AUTENTICACIÓN Y REGISTRO DE USUARIOS REALES
-- Archivo: supabase/migrations/auth_user_registration.sql
-- NOTA: NO EJECUTAR AUTOMÁTICAMENTE DESDE EL CLIENTE MÓVIL.
-- Ejecutar en el Editor SQL del Dashboard de Supabase.
-- ==============================================================================

-- 1. Asegurar columnas necesarias en public.profiles para el usuario final (10 campos obligatorios)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT true;

-- 2. Garantizar Unicidad Case-Insensitive del Username en la Base de Datos
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower 
ON public.profiles (LOWER(username));

-- 3. Habilitar y estructurar políticas RLS seguras basadas en auth.uid() = id
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Limpieza de políticas antiguas de profiles para evitar colisiones
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- Política SELECT: Los usuarios pueden ver su propio perfil, y perfiles públicos de proveedores
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR role = 'provider');

-- Política INSERT: Un usuario autenticado solo puede insertar su propio id
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Política UPDATE: Un usuario autenticado solo puede actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política DELETE: Un usuario autenticado solo puede eliminar su propio perfil
CREATE POLICY "Users can delete own profile"
ON public.profiles FOR DELETE
USING (auth.uid() = id);

-- 4. Función Trigger Automático para Supabase Auth (Solución definitiva para RLS en SignUp)
-- Al ejecutarse con SECURITY DEFINER, el trigger crea el perfil inmediatamente tras la creación del usuario en auth.users,
-- evitando fallos de RLS incluso si la confirmación de email está activa.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    role,
    provider_type,
    full_name,
    username,
    birth_date,
    gender,
    phone,
    country,
    city,
    onboarding_completed
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.raw_user_meta_data->>'provider_type',
    NEW.raw_user_meta_data->>'full_name',
    LOWER(NEW.raw_user_meta_data->>'username'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'birth_date' IS NOT NULL AND NEW.raw_user_meta_data->>'birth_date' != '' 
      THEN (NEW.raw_user_meta_data->>'birth_date')::DATE 
      ELSE NULL 
    END,
    NEW.raw_user_meta_data->>'gender',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'city',
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    birth_date = EXCLUDED.birth_date,
    gender = EXCLUDED.gender,
    phone = EXCLUDED.phone,
    country = EXCLUDED.country,
    city = EXCLUDED.city,
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Crear el Trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
