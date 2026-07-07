-- HANGOVER CONNECT - CONFIGURACIÓN DE ALMACENAMIENTO PARA ARCHIVOS DEL CHAT
-- Ejecutar en el editor SQL de Supabase

-- Crear el bucket connect-attachments si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('connect-attachments', 'connect-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Asegurar que RLS esté habilitado en storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Políticas para connect-attachments
DROP POLICY IF EXISTS "Permitir lectura pública de archivos de Connect" ON storage.objects;
CREATE POLICY "Permitir lectura pública de archivos de Connect"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'connect-attachments');

DROP POLICY IF EXISTS "Permitir inserción a usuarios autenticados en Connect" ON storage.objects;
CREATE POLICY "Permitir inserción a usuarios autenticados en Connect"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'connect-attachments');

DROP POLICY IF EXISTS "Permitir actualización de archivos propios en Connect" ON storage.objects;
CREATE POLICY "Permitir actualización de archivos propios en Connect"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'connect-attachments' AND (auth.uid()::text = owner_id OR owner IS NULL))
WITH CHECK (bucket_id = 'connect-attachments');

DROP POLICY IF EXISTS "Permitir eliminación de archivos propios en Connect" ON storage.objects;
CREATE POLICY "Permitir eliminación de archivos propios en Connect"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'connect-attachments' AND (auth.uid()::text = owner_id OR owner IS NULL));
