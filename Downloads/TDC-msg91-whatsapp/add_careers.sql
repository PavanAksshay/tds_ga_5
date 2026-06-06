-- ============================================================
-- Migration: Add career_listings and career_applications tables
-- Run this in Supabase SQL editor before deploying the Careers feature
-- ============================================================

-- Career Listings table
CREATE TABLE IF NOT EXISTS career_listings (
  id TEXT PRIMARY KEY,
  department TEXT NOT NULL DEFAULT 'GENERAL',
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'PAUSED')),
  title TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  roles JSONB NOT NULL DEFAULT '[]',
  tags TEXT[] NOT NULL DEFAULT '{}',
  location_type TEXT NOT NULL DEFAULT 'REMOTE' CHECK (location_type IN ('REMOTE', 'HYBRID', 'IN_PERSON')),
  commitment TEXT NOT NULL DEFAULT 'PART_TIME' CHECK (commitment IN ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'VOLUNTEER')),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Career Applications table
CREATE TABLE IF NOT EXISTS career_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  listing_id TEXT NOT NULL REFERENCES career_listings(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL,
  role_title TEXT NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  linkedin_handle TEXT,
  github_handle TEXT,
  resume_link TEXT,
  portfolio_url TEXT,
  answers JSONB DEFAULT '{}',
  motivation TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'UNDER_REVIEW')),
  internal_notes TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_career_listings_published ON career_listings(is_published);
CREATE INDEX IF NOT EXISTS idx_career_listings_department ON career_listings(department);
CREATE INDEX IF NOT EXISTS idx_career_applications_listing ON career_applications(listing_id);
CREATE INDEX IF NOT EXISTS idx_career_applications_user ON career_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_career_applications_status ON career_applications(status);

-- RLS Policies (enable RLS if not done)
ALTER TABLE career_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can read published listings
CREATE POLICY "Public read published listings"
  ON career_listings FOR SELECT
  USING (is_published = TRUE);

-- Admins can do everything to listings
CREATE POLICY "Service role full access career_listings"
  ON career_listings FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Authenticated users can insert applications
CREATE POLICY "Authenticated users can apply"
  ON career_applications FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- Users can read their own applications
CREATE POLICY "Users can read own applications"
  ON career_applications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role full access for admin
CREATE POLICY "Service role full access career_applications"
  ON career_applications FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);
