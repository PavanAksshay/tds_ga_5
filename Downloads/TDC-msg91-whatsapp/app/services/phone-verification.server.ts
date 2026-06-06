/**
 * Phone-number verification service (MSG91 version) — server-only.
 *
 * Delegates OTP generation, delivery, and code verification entirely to MSG91.
 * This service handles:
 *   - sendPhoneOtp:   validate the number, then call MSG91 to send an OTP
 *   - verifyPhoneOtp: call MSG91 to verify the code, then flag the profile
 *   - getPhoneStatus: read a user's current phone / verified state
 *
 * The phone_otps table from the Meta implementation is NOT needed here because
 * MSG91 manages the OTP lifecycle (generation, storage, expiry, attempts).
 * Only the profiles table columns (phone_number, phone_verified, phone_verified_at)
 * are required.
 */
import { createSupabaseAdminClient } from "../lib/supabase.server";
import { sendOtpViaMSG91, verifyOtpViaMSG91 } from "./msg91.server";

/**
 * Normalize loosely-typed user input into E.164 (e.g. "+919876543210").
 * Returns null when the number is obviously invalid.
 */
export function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  let cleaned = raw.replace(/[\s\-().]/g, "");
  if (!cleaned.startsWith("+")) {
    cleaned = `+${cleaned}`;
  }
  // E.164: "+" followed by 8-15 digits.
  if (!/^\+\d{8,15}$/.test(cleaned)) return null;
  return cleaned;
}

export interface PhoneStatus {
  phone_number: string | null;
  phone_verified: boolean;
}

export async function getPhoneStatus(userId: string): Promise<PhoneStatus> {
  const admin = createSupabaseAdminClient();
  const { data } = await (admin.from("profiles") as any)
    .select("phone_number, phone_verified")
    .eq("id", userId)
    .single();

  return {
    phone_number: data?.phone_number ?? null,
    phone_verified: Boolean(data?.phone_verified),
  };
}

/**
 * Send an OTP to the supplied phone number via MSG91 WhatsApp.
 * MSG91 generates the code internally — we just validate the number
 * and check for duplicates before calling their API.
 */
export async function sendPhoneOtp(
  userId: string,
  rawPhone: string
): Promise<{ ok: boolean; error?: string }> {
  const phone = normalizePhone(rawPhone);
  if (!phone) {
    return { ok: false, error: "Enter a valid phone number including country code." };
  }

  const admin = createSupabaseAdminClient();

  // Block re-using a number already verified by a different account.
  const { data: clash } = await (admin.from("profiles") as any)
    .select("id")
    .eq("phone_number", phone)
    .eq("phone_verified", true)
    .neq("id", userId)
    .maybeSingle();
  if (clash) {
    return { ok: false, error: "This phone number is already verified on another account." };
  }

  // Store the phone number the user is trying to verify (unverified state)
  // so the profile reflects the in-progress number.
  await (admin.from("profiles") as any)
    .update({ phone_number: phone, phone_verified: false })
    .eq("id", userId);

  // Delegate OTP generation and delivery to MSG91.
  const result = await sendOtpViaMSG91(phone);
  if (!result.ok) {
    return { ok: false, error: result.error ?? "Failed to send verification code." };
  }

  return { ok: true };
}

/**
 * Validate a submitted code via MSG91. On success the profile is marked verified.
 *
 * @param userId   The authenticated user's ID.
 * @param rawPhone The phone number in E.164 format (sent from the client).
 * @param rawCode  The 6-digit OTP the user entered.
 */
export async function verifyPhoneOtp(
  userId: string,
  rawPhone: string,
  rawCode: string
): Promise<{ ok: boolean; error?: string; phone_number?: string }> {
  const code = (rawCode ?? "").replace(/[^\d]/g, "");
  if (code.length !== 6) {
    return { ok: false, error: "Enter the 6-digit code." };
  }

  const phone = normalizePhone(rawPhone);
  if (!phone) {
    return { ok: false, error: "Invalid phone number. Please start over." };
  }

  // Delegate verification to MSG91.
  const result = await verifyOtpViaMSG91(phone, code);
  if (!result.ok) {
    return { ok: false, error: result.error ?? "Verification failed. Please try again." };
  }

  // Success — persist verified state.
  const admin = createSupabaseAdminClient();
  const { error: updateError } = await (admin.from("profiles") as any)
    .update({
      phone_number: phone,
      phone_verified: true,
      phone_verified_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) {
    console.error("[PHONE_OTP] Failed to mark profile verified:", updateError.message);
    return { ok: false, error: "Verification succeeded but saving failed. Please retry." };
  }

  return { ok: true, phone_number: phone };
}
