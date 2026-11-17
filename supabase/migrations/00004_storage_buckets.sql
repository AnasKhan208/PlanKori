-- ==============================================================================
-- PlanKori Database Migration 00004: Storage Buckets & Policies
-- Buckets: vendor-portfolios, mood-boards
-- Access: Public read; Authenticated write restricted to owner's folder (<user_id>/*)
-- ==============================================================================

-- 1. Create Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('vendor-portfolios', 'vendor-portfolios', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('mood-boards', 'mood-boards', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Storage Policies for storage.objects

-- Public Read Access
DROP POLICY IF EXISTS "Public can view vendor portfolios and mood boards" ON storage.objects;
CREATE POLICY "Public can view vendor portfolios and mood boards"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('vendor-portfolios', 'mood-boards'));

-- Authenticated Insert (restricted to user's folder: <user_id>/...)
DROP POLICY IF EXISTS "Authenticated users can upload to their own folder" ON storage.objects;
CREATE POLICY "Authenticated users can upload to their own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('vendor-portfolios', 'mood-boards')
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

-- Authenticated Update (restricted to user's folder)
DROP POLICY IF EXISTS "Users can update files in their own folder" ON storage.objects;
CREATE POLICY "Users can update files in their own folder"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN ('vendor-portfolios', 'mood-boards')
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  )
  WITH CHECK (
    bucket_id IN ('vendor-portfolios', 'mood-boards')
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

-- Authenticated Delete (restricted to user's folder)
DROP POLICY IF EXISTS "Users can delete files in their own folder" ON storage.objects;
CREATE POLICY "Users can delete files in their own folder"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id IN ('vendor-portfolios', 'mood-boards')
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );
