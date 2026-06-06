/**
 * MSG91 Email sender — server-only.
 *
 * IMPORTANT: Unlike MSG91's mobile OTP API (/api/v5/otp), MSG91 does NOT
 * provide a built-in OTP generate/verify lifecycle for email. The Email API
 * only DELIVERS a templated email. Therefore the OTP itself is generated,
 * stored, expired, and verified by our own code (see email-verification.server.ts),
 * and this module is only responsible for delivering the email that carries the code.
 *
 * Required environment variables (set in your host / .env):
 *   MSG91_AUTH_KEY          — your MSG91 auth key (shared with the WhatsApp OTP flow)
 *   MSG91_EMAIL_DOMAIN      — the verified sending domain configured in MSG91
 *   MSG91_EMAIL_FROM        — the from-address on that domain (e.g. no-reply@yourdomain.com)
 *   MSG91_EMAIL_TEMPLATE_ID — the MSG91 email template ID that renders the OTP
 *
 * Optional:
 *   MSG91_EMAIL_FROM_NAME   — display name for the sender (default "The Developer Community")
 *
 * The email template in MSG91 should reference the OTP via a handlebars
 * variable named {{otp}} (and optionally {{expiry}} for the validity window).
 *
 * If the credentials are missing (e.g. local dev), the call is logged to the
 * server console instead of being sent, so the flow remains testable.
 */

const AUTH_KEY = (process.env.MSG91_AUTH_KEY ?? "").trim();
const EMAIL_DOMAIN = (process.env.MSG91_EMAIL_DOMAIN ?? "").trim();
const EMAIL_FROM = (process.env.MSG91_EMAIL_FROM ?? "").trim();
const EMAIL_TEMPLATE_ID = (process.env.MSG91_EMAIL_TEMPLATE_ID ?? "").trim();
const EMAIL_FROM_NAME = (process.env.MSG91_EMAIL_FROM_NAME ?? "The Developer Community").trim();

const EMAIL_SEND_URL = "https://control.msg91.com/api/v5/email/send";

export function isMSG91EmailConfigured(): boolean {
  return Boolean(AUTH_KEY && EMAIL_DOMAIN && EMAIL_FROM && EMAIL_TEMPLATE_ID);
}

/**
 * Deliver an OTP email via MSG91's Email API.
 *
 * @param toEmail   Recipient email address.
 * @param code      The 6-digit OTP we generated.
 * @param expiryMin OTP validity window in minutes (passed to the template as {{expiry}}).
 * @param toName    Optional recipient display name.
 */
export async function sendEmailOtpViaMSG91(
  toEmail: string,
  code: string,
  expiryMin: number,
  toName?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isMSG91EmailConfigured()) {
    console.warn(
      `[MSG91_EMAIL] Not configured — would have emailed OTP "${code}" to ${toEmail}. ` +
        `Set MSG91_AUTH_KEY, MSG91_EMAIL_DOMAIN, MSG91_EMAIL_FROM and MSG91_EMAIL_TEMPLATE_ID to enable real delivery.`
    );
    return { ok: true };
  }

  try {
    const res = await fetch(EMAIL_SEND_URL, {
      method: "POST",
      headers: {
        authkey: AUTH_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        recipients: [
          {
            to: [{ name: toName || toEmail, email: toEmail }],
            variables: {
              otp: code,
              expiry: String(expiryMin),
            },
          },
        ],
        from: { name: EMAIL_FROM_NAME, email: EMAIL_FROM },
        domain: EMAIL_DOMAIN,
        template_id: EMAIL_TEMPLATE_ID,
      }),
    });

    const data = await res.json().catch(() => ({}));

    // MSG91's email send endpoint returns { hasError: false } / type "success" on accept.
    if (res.ok && data.hasError !== true && data.type !== "error") {
      return { ok: true };
    }

    console.error(`[MSG91_EMAIL] Send failed (${res.status}):`, JSON.stringify(data));
    return {
      ok: false,
      error: data.message ?? "Failed to send verification email. Please try again.",
    };
  } catch (err) {
    console.error("[MSG91_EMAIL] Network error sending email:", err);
    return { ok: false, error: "Network error contacting MSG91. Please try again." };
  }
}
