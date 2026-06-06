import type { Route } from "./+types/api.email-send-otp";

/**
 * POST /api/email-send-otp
 * Body: { email: string }
 * Sends an email OTP to the authenticated user's supplied address.
 */
export async function action({ request }: Route.ActionArgs) {
  const { requireAuth } = await import("../services/auth.server");
  const { sendEmailOtp } = await import("../services/email-verification.server");

  const headers = new Headers();
  const user = await requireAuth(request, headers);

  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");

  const result = await sendEmailOtp(user.id, email);
  return Response.json(result, { headers, status: result.ok ? 200 : 400 });
}
