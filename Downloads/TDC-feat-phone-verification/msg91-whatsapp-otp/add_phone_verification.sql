-- ============================================================
-- Migration: WhatsApp phone-number verification (MSG91 version)
--
-- Adds phone columns to profiles. No phone_otps table is needed
-- because MSG91 manages the OTP lifecycle (generation, storage,
-- expiry, and attempt tracking) on their side.
--
-- Run in the Supabase SQL editor.
-- ============================================================

-- 1. New profile columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number      TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

-- 2. Prevent two accounts claiming the same verified number.
--    A partial unique index only applies to verified rows so
--    unverified/null are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_number_verified_key
  ON profiles (phone_number)
  WHERE phone_verified = true AND phone_number IS NOT NULL;
