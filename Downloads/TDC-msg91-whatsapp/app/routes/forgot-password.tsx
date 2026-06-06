import { Link, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/forgot-password";
import { sendPasswordResetEmail } from "../services/auth.server";
import styles from "./auth.module.css";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Reset Password | The Developer Community" },
    { name: "description", content: "Recover access to your TDC account. Enter your email to receive a secure password reset link." },
    { name: "robots", content: "noindex, nofollow" },
  ];
}


export async function action({ request }: Route.ActionArgs) {
  const headers = new Headers();
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  
  // Dynamically determine site root from request
  const url = new URL(request.url);
  const redirectTo = `${url.origin}/reset-password`;

  if (!email) {
    return { error: "Email is required to initiate recovery." };
  }

  const result = await sendPasswordResetEmail(request, headers, email, redirectTo);
  if (result.error) {
    return { error: result.error };
  }

  return { success: "Recovery protocol initiated. Check your inbox for the handshake link." };
}

export default function ForgotPasswordPage({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className={styles.page}>
      <div className={styles.bgGrid} aria-hidden />

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.protocol}>CREDENTIAL_RECOVERY_PROTOCOL</div>
          <h1 className={styles.title}>
            RECOVER<span className={styles.blink}>_</span>
          </h1>
          <p className={styles.subtitle}>
            System handshake required. Enter your identified email to receive a recovery token.
          </p>
        </header>

        <div className={styles.card}>
          <form className={styles.formBox} method="post">
            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">Identified Email</label>
              <input
                id="email"
                name="email"
                className={styles.input}
                type="email"
                placeholder="email@devcom.io"
                autoComplete="email"
                required
                aria-label="Email address"
              />
            </div>

            {actionData?.error && (
              <p className={styles.errorMsg} role="alert">{actionData.error}</p>
            )}

            {actionData?.success && (
              <p className={styles.successMsg} role="status">{actionData.success}</p>
            )}

            <div className={styles.loginActions}>
              <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                {isSubmitting ? "INITIATING..." : "REQUEST_TOKEN"}
              </button>
              <Link to="/login" className={styles.loginLink}>RETURN TO LOGIN_PROMPT ←</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
