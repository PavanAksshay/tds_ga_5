/**
 * Email-address verification service — server-only.
 *
 * Owns the OTP lifecycle locally because MSG91's Email API only DELIVERS mail;
 * it does not generate or verify OTPs (unlike MSG91's mobile OTP API). So this
 * service mirrors the original (Meta) phone implementation:
 *   - sendEmailOtp:   generate + hash a 6-digit code, store it, deliver via MSG91 email
 *   - verifyEmailOtp: validate the submitted code and flag the profile as verified
 *   - getEmailStatus: read a user's current email / verified state
 *
 * The email_otps table is locked behind RLS, so every query here uses the
 * service-role admin client which bypasses RLS.
 */
import { createHash, randomInt } from "node:crypto";
import { createSupabaseAdminClient } from "../lib/supabase.server";
import { sendEmailOtpViaMSG91 } from "./msg91-email.server";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds between sends
const MAX_ATTEMPTS = 5;

/** Extra salt mixed into the code hash so stored hashes aren't a plain SHA of 6 digits. */
const HASH_SALT = (process.env.EMAIL_OTP_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "tdc-email-otp").trim();

function hashCode(userId: string, code: string): string {
  return createHash("sha256").update(`${userId}:${HASH_SALT}:${code}`).digest("hex");
}

/**
 * Normalize and validate a loosely-typed email string.
 * Returns the lower-cased, trimmed email, or null when it is obviously invalid.
 */
export function normalizeEmail(raw: string): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase();
  // Pragmatic email check — one "@", a dot in the domain, no whitespace.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) return null;
  return cleaned;
}

export interface EmailStatus {
  email: string | null;
  email_verified: boolean;
}

export async function getEmailStatus(userId: string): Promise<EmailStatus> {
  const admin = createSupabaseAdminClient();
  const { data } = await (admin.from("profiles") as any)
    .select("email, email_verified")
    .eq("id", userId)
    .single();

  return {
    email: data?.email ?? null,
    email_verified: Boolean(data?.email_verified),
  };
}

/**
 * Generate and send a fresh OTP to the supplied email for this user.
 */
export async function sendEmailOtp(
  userId: string,
  rawEmail: string
): Promise<{ ok: boolean; error?: string }> {
  const email = normalizeEmail(rawEmail);
  if (!email) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const admin = createSupabaseAdminClient();

  // Block re-using an email already verified by a different account.
  const { data: clash } = await (admin.from("profiles") as any)
    .select("id")
    .eq("email", email)
    .eq("email_verified", true)
    .neq("id", userId)
    .maybeSingle();
  if (clash) {
    return { ok: false, error: "This email is already verified on another account." };
  }

  // Enforce a resend cooldown.
  const { data: existing } = await (admin.from("email_otps") as any)
    .select("last_sent_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing?.last_sent_at) {
    const elapsed = Date.now() - new Date(existing.last_sent_at).getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      return { ok: false, error: `Please wait ${wait}s before requesting another code.` };
    }
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const nowIso = new Date().toISOString();
  const expiresIso = new Date(Date.now() + CODE_TTL_MS).toISOString();

  const { error: upsertError } = await (admin.from("email_otps") as any).upsert({
    user_id: userId,
    email,
    code_hash: hashCode(userId, code),
    expires_at: expiresIso,
    attempts: 0,
    last_sent_at: nowIso,
  });
  if (upsertError) {
    console.error("[EMAIL_OTP] Failed to store OTP:", upsertError.message);
    return { ok: false, error: "Could not start verification. Please try again." };
  }

  const sent = await sendEmailOtpViaMSG91(email, code, Math.round(CODE_TTL_MS / 60000));
  if (!sent.ok) {
    return { ok: false, error: sent.error ?? "Failed to send verification email." };
  }

  return { ok: true };
}

/**
 * Validate a submitted code. On success the profile is marked verified and the
 * OTP record is cleared.
 */
export async function verifyEmailOtp(
  userId: string,
  rawCode: string
): Promise<{ ok: boolean; error?: string; email?: string }> {
  const code = (rawCode ?? "").replace(/[^\d]/g, "");
  if (code.length !== 6) {
    return { ok: false, error: "Enter the 6-digit code." };
  }

  const admin = createSupabaseAdminClient();
  const { data: record } = await (admin.from("email_otps") as any)
    .select("email, code_hash, expires_at, attempts")
    .eq("user_id", userId)
    .maybeSingle();

  if (!record) {
    return { ok: false, error: "No active code. Please request a new one." };
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    await (admin.from("email_otps") as any).delete().eq("user_id", userId);
    return { ok: false, error: "Code expired. Please request a new one." };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await (admin.from("email_otps") as any).delete().eq("user_id", userId);
    return { ok: false, error: "Too many incorrect attempts. Please request a new code." };
  }

  if (hashCode(userId, code) !== record.code_hash) {
    await (admin.from("email_otps") as any)
      .update({ attempts: record.attempts + 1 })
      .eq("user_id", userId);
    const left = MAX_ATTEMPTS - (record.attempts + 1);
    return {
      ok: false,
      error: left > 0 ? `Incorrect code. ${left} attempt(s) left.` : "Too many incorrect attempts. Please request a new code.",
    };
  }

  // Success — persist verified state and clear the challenge.
  const { error: updateError } = await (admin.from("profiles") as any)
    .update({
      email: record.email,
      email_verified: true,
      email_verified_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) {
    console.error("[EMAIL_OTP] Failed to mark profile verified:", updateError.message);
    return { ok: false, error: "Verification succeeded but saving failed. Please retry." };
  }

  await (admin.from("email_otps") as any).delete().eq("user_id", userId);
  return { ok: true, email: record.email };
}
