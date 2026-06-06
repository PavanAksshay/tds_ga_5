-- ============================================================
-- Migration: Add SHIPPED status + image/media fields to projects table
-- Also creates the project-images Storage bucket
-- Run in Supabase SQL editor
-- ============================================================

-- 1. Drop and recreate status check to include SHIPPED
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('OPEN', 'RECRUITING', 'IN_PROGRESS', 'CLOSED', 'SHIPPED'));

-- 2. New media columns
ALTER TABLE projects ADD COLUMN IF NOT EXISTS teaser_image   TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS gallery_images JSONB NOT NULL DEFAULT '[]';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contributors   JSONB NOT NULL DEFAULT '[]';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS live_url       TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_url     TEXT;

-- 3. Storage bucket (project images)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('project-images', 'project-images', true)
  ON CONFLICT (id) DO NOTHING;

-- 4. Storage RLS policies
-- Public read
DROP POLICY IF EXISTS "Public read project images" ON storage.objects;
CREATE POLICY "Public read project images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-images');

-- Authenticated upload / update / delete
DROP POLICY IF EXISTS "Authenticated upload project images" ON storage.objects;
CREATE POLICY "Authenticated upload project images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-images');

DROP POLICY IF EXISTS "Authenticated update project images" ON storage.objects;
CREATE POLICY "Authenticated update project images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'project-images');

DROP POLICY IF EXISTS "Authenticated delete project images" ON storage.objects;
CREATE POLICY "Authenticated delete project images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-images');
