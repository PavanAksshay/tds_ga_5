-- ============================================================
-- Migration: Email-address verification (MSG91 delivery)
--
-- Adds email-verified columns to profiles + creates the email_otps table.
--
-- NOTE: MSG91's Email API only DELIVERS mail; it does not generate or verify
-- OTPs (unlike MSG91's mobile OTP API). So, like the original Meta phone flow,
-- we manage the OTP lifecycle ourselves in the email_otps table and use MSG91
-- purely to send the message that carries the code.
--
-- The `email` column already exists on profiles (populated at onboarding), so
-- only the verified flags are added here.
--
-- Run in the Supabase SQL editor.
-- ============================================================

-- 1. New profile columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Optional: prevent two accounts claiming the same verified email.
-- A partial unique index only applies to verified rows so unverified/null are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_verified_key
  ON profiles (email)
  WHERE email_verified = true AND email IS NOT NULL;

-- 2. OTP store (one active challenge per user)
CREATE TABLE IF NOT EXISTS email_otps (
  user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT        NOT NULL,
  code_hash    TEXT        NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  attempts     INTEGER     NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Lock the table down. All access is server-side via the service-role
--    key (createSupabaseAdminClient), which bypasses RLS. Enabling RLS with
--    no policies ensures the anon/auth keys can never read OTP hashes.
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;
