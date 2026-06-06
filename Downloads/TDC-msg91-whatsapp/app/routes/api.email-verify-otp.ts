import type { Route } from "./+types/api.email-verify-otp";

/**
 * POST /api/email-verify-otp
 * Body: { code: string }
 * Verifies the submitted OTP for the authenticated user and, on success,
 * marks their profile email as verified.
 *
 * NOTE: Unlike the phone (MSG91) flow, the email address is not required here —
 * the in-progress OTP is looked up by the authenticated user's id, since our own
 * email_otps table stores the code (MSG91 email only delivers, it does not verify).
 */
export async function action({ request }: Route.ActionArgs) {
  const { requireAuth } = await import("../services/auth.server");
  const { verifyEmailOtp } = await import("../services/email-verification.server");

  const headers = new Headers();
  const user = await requireAuth(request, headers);

  const formData = await request.formData();
  const code = String(formData.get("code") ?? "");

  const result = await verifyEmailOtp(user.id, code);
  return Response.json(result, { headers, status: result.ok ? 200 : 400 });
}
