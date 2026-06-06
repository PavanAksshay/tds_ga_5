import type { Route } from "./+types/api.phone-verify-otp";

/**
 * POST /api/phone-verify-otp
 * Body: { code: string, phone: string }
 * Verifies the submitted OTP for the authenticated user and, on success,
 * marks their profile phone as verified.
 *
 * NOTE: Unlike the Meta version, this endpoint also requires the `phone`
 * field because MSG91's verify API needs the mobile number to look up the OTP.
 */
export async function action({ request }: Route.ActionArgs) {
  const { requireAuth } = await import("../services/auth.server");
  const { verifyPhoneOtp } = await import("../services/phone-verification.server");

  const headers = new Headers();
  const user = await requireAuth(request, headers);

  const formData = await request.formData();
  const code = String(formData.get("code") ?? "");
  const phone = String(formData.get("phone") ?? "");

  const result = await verifyPhoneOtp(user.id, phone, code);
  return Response.json(result, { headers, status: result.ok ? 200 : 400 });
}
