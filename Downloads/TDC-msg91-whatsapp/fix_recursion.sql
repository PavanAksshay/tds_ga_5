-- Fix: Recursive RLS policy on 'projects' and 'profiles' tables
-- Infinite recursion happens when policies query a table to resolve access for that same table,
-- or when cross-table policies form a loop.
-- The robust solution is to bypass RLS when looking up admin status using a SECURE DEFINER function.

-- Step 1: Drop offending policies from both tables
DO $$
DECLARE
  pol RECORD;
BEGIN
  -- Drop from profiles
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
  END LOOP;
  
  -- Drop from projects
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'projects' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON projects', pol.policyname);
  END LOOP;
END $$;

-------------------------------------------------------------------------------
-- FUNCTION TO AVOID RECURSION
-------------------------------------------------------------------------------
-- SECURITY DEFINER functions run with the privileges of the creator, 
-- thus bypassing RLS policies and avoiding infinite recursion loops!
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  status BOOLEAN;
BEGIN
  SELECT is_admin INTO status FROM profiles WHERE id = auth.uid();
  RETURN COALESCE(status, false) OR (auth.jwt() ->> 'email')::text = 'amogh.vk.2005@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-------------------------------------------------------------------------------
-- PROFILES POLICIES
-------------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins: check via our secure definer function instead of querying profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING ( public.check_is_admin() OR auth.uid() = id );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING ( public.check_is_admin() OR auth.uid() = id );

-------------------------------------------------------------------------------
-- PROJECTS POLICIES
-------------------------------------------------------------------------------
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Public can view published projects
CREATE POLICY "Public can view published projects" ON projects
  FOR SELECT USING (is_published = true);

-- Admins can view all projects (including drafts)
CREATE POLICY "Admins can view all projects" ON projects
  FOR SELECT USING ( public.check_is_admin() );

-- Admins can insert projects
CREATE POLICY "Admins can insert projects" ON projects
  FOR INSERT WITH CHECK ( public.check_is_admin() );

-- Admins can update projects
CREATE POLICY "Admins can update projects" ON projects
  FOR UPDATE USING ( public.check_is_admin() );

-- Admins can delete projects
CREATE POLICY "Admins can delete projects" ON projects
  FOR DELETE USING ( public.check_is_admin() );

-------------------------------------------------------------------------------
-- APPLICATIONS POLICIES
-------------------------------------------------------------------------------
-- Drop existing applications policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'applications' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON applications', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own applications" ON applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own applications" ON applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON applications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications" ON applications
  FOR SELECT USING ( public.check_is_admin() );

CREATE POLICY "Admins can update all applications" ON applications
  FOR UPDATE USING ( public.check_is_admin() );
