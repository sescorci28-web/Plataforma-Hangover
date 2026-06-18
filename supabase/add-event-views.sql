-- Migración para añadir métricas de vistas a los eventos
-- Ejecutar en el Editor SQL de Supabase.

-- 1. Añadir columna views a la tabla events si no existe
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- 2. Crear función RPC para incrementar las vistas de un evento de forma segura (evitando RLS)
CREATE OR REPLACE FUNCTION public.increment_event_views(event_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.events
    SET views = COALESCE(views, 0) + 1
    WHERE id = event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permiso de ejecución para usuarios anónimos y autenticados
GRANT EXECUTE ON FUNCTION public.increment_event_views(UUID) TO anon, authenticated;
