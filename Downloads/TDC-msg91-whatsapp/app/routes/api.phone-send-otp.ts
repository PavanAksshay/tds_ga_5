import type { Route } from "./+types/api.phone-send-otp";

/**
 * POST /api/phone-send-otp
 * Body: { phone: string }
 * Sends a WhatsApp OTP to the authenticated user's supplied number.
 */
export async function action({ request }: Route.ActionArgs) {
  const { requireAuth } = await import("../services/auth.server");
  const { sendPhoneOtp } = await import("../services/phone-verification.server");

  const headers = new Headers();
  const user = await requireAuth(request, headers);

  const formData = await request.formData();
  const phone = String(formData.get("phone") ?? "");

  const result = await sendPhoneOtp(user.id, phone);
  return Response.json(result, { headers, status: result.ok ? 200 : 400 });
}
