/**
 * MSG91 WhatsApp OTP sender — server-only.
 *
 * Uses MSG91's OTP API to send and verify one-time passcodes via WhatsApp.
 * MSG91 handles OTP generation, delivery, and verification internally.
 *
 * Required environment variables (set in your host / .env):
 *   MSG91_AUTH_KEY       — your MSG91 auth key (from MSG91 dashboard)
 *   MSG91_TEMPLATE_ID   — the template ID configured for WhatsApp delivery
 *
 * Optional:
 *   MSG91_OTP_LENGTH    — OTP digit count (default "6")
 *   MSG91_OTP_EXPIRY    — expiry in minutes (default "10")
 *
 * If credentials are missing (e.g. local dev), the call is logged to the
 * server console so the flow remains testable.
 */

const AUTH_KEY = (process.env.MSG91_AUTH_KEY ?? "").trim();
const TEMPLATE_ID = (process.env.MSG91_TEMPLATE_ID ?? "").trim();
const OTP_LENGTH = parseInt(process.env.MSG91_OTP_LENGTH ?? "6", 10);
const OTP_EXPIRY = parseInt(process.env.MSG91_OTP_EXPIRY ?? "10", 10);

const BASE_URL = "https://control.msg91.com/api/v5";

export function isMSG91Configured(): boolean {
  return Boolean(AUTH_KEY && TEMPLATE_ID);
}

/**
 * Convert an E.164 phone number ("+919876543210") to MSG91 format ("919876543210").
 * MSG91 expects digits only, no leading "+".
 */
function toMSG91Mobile(e164: string): string {
  return e164.replace(/[^\d]/g, "");
}

/**
 * Send an OTP to the given phone number via MSG91 (WhatsApp channel).
 * MSG91 generates the OTP internally and delivers it.
 *
 * @param toE164 Phone number in E.164 format (e.g. "+919876543210").
 */
export async function sendOtpViaMSG91(
  toE164: string
): Promise<{ ok: boolean; error?: string }> {
  const mobile = toMSG91Mobile(toE164);

  if (!isMSG91Configured()) {
    console.warn(
      `[MSG91] Not configured — would have sent OTP to +${mobile}. ` +
        `Set MSG91_AUTH_KEY and MSG91_TEMPLATE_ID to enable real delivery.`
    );
    return { ok: true };
  }

  try {
    const res = await fetch(`${BASE_URL}/otp`, {
      method: "POST",
      headers: {
        authkey: AUTH_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template_id: TEMPLATE_ID,
        mobile,
        otp_length: OTP_LENGTH,
        otp_expiry: OTP_EXPIRY,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.type === "success") {
      return { ok: true };
    }

    console.error(`[MSG91] Send OTP failed (${res.status}):`, JSON.stringify(data));
    return {
      ok: false,
      error: data.message ?? "Failed to send WhatsApp OTP. Please try again.",
    };
  } catch (err) {
    console.error("[MSG91] Network error sending OTP:", err);
    return { ok: false, error: "Network error contacting MSG91. Please try again." };
  }
}

/**
 * Verify an OTP submitted by the user via MSG91's verify endpoint.
 *
 * @param toE164 Phone number in E.164 format.
 * @param otp    The 6-digit code the user entered.
 */
export async function verifyOtpViaMSG91(
  toE164: string,
  otp: string
): Promise<{ ok: boolean; error?: string }> {
  const mobile = toMSG91Mobile(toE164);

  if (!isMSG91Configured()) {
    // In dev mode without credentials, accept any 6-digit code.
    console.warn(
      `[MSG91] Not configured — auto-accepting OTP "${otp}" for +${mobile} (dev mode).`
    );
    return { ok: true };
  }

  try {
    const params = new URLSearchParams({ mobile, otp });
    const res = await fetch(`${BASE_URL}/otp/verify?${params.toString()}`, {
      method: "POST",
      headers: {
        authkey: AUTH_KEY,
      },
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.type === "success") {
      return { ok: true };
    }

    // MSG91 returns specific error messages for expired/wrong codes.
    const msg = data.message ?? "Verification failed.";
    console.error(`[MSG91] Verify OTP failed (${res.status}):`, JSON.stringify(data));
    return { ok: false, error: msg };
  } catch (err) {
    console.error("[MSG91] Network error verifying OTP:", err);
    return { ok: false, error: "Network error contacting MSG91. Please try again." };
  }
}

/**
 * Resend an OTP via MSG91 (e.g. if the first one didn't arrive).
 *
 * @param toE164    Phone number in E.164 format.
 * @param retryType "text" for SMS fallback or "voice" for voice call.
 */
export async function resendOtpViaMSG91(
  toE164: string,
  retryType: "text" | "voice" = "text"
): Promise<{ ok: boolean; error?: string }> {
  const mobile = toMSG91Mobile(toE164);

  if (!isMSG91Configured()) {
    console.warn(`[MSG91] Not configured — would resend OTP to +${mobile}.`);
    return { ok: true };
  }

  try {
    const params = new URLSearchParams({ mobile, retrytype: retryType });
    const res = await fetch(`${BASE_URL}/otp/retry?${params.toString()}`, {
      method: "POST",
      headers: {
        authkey: AUTH_KEY,
      },
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.type === "success") {
      return { ok: true };
    }

    console.error(`[MSG91] Resend OTP failed (${res.status}):`, JSON.stringify(data));
    return {
      ok: false,
      error: data.message ?? "Failed to resend OTP. Please try again.",
    };
  } catch (err) {
    console.error("[MSG91] Network error resending OTP:", err);
    return { ok: false, error: "Network error contacting MSG91. Please try again." };
  }
}
