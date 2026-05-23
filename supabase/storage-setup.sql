-- Supabase Storage setup for club assets
-- Run this in the SQL editor after creating your project.

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('banners', 'banners', true),
  ('logos', 'logos', true)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can upload club assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload club assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('banners', 'logos')
);

DROP POLICY IF EXISTS "Authenticated users can update club assets" ON storage.objects;
CREATE POLICY "Authenticated users can update club assets"
ON storage.objects
FOR UPDATE
TO authenticated
WITH CHECK (
  bucket_id IN ('banners', 'logos')
);

DROP POLICY IF EXISTS "Authenticated users can delete club assets" ON storage.objects;
CREATE POLICY "Authenticated users can delete club assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id IN ('banners', 'logos')
);

DROP POLICY IF EXISTS "Public read access for club assets" ON storage.objects;
CREATE POLICY "Public read access for club assets"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id IN ('banners', 'logos')
);
