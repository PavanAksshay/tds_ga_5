import { Link, useActionData, useNavigation } from "react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { Route } from "./+types/register";
import { getSessionUser } from "../lib/supabase.server";
import { redirect } from "react-router";
import styles from "./auth.module.css";
import { SITE_URL } from "~/lib/seo";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Create Account | The Developer Community" },
    { name: "description", content: "Join The Developer Community. Apply for a developer account to access real projects, claim verified resume credits, and build your engineering career." },
    { name: "robots", content: "noindex, nofollow" },
  ];
}


export async function loader({ request }: Route.LoaderArgs) {
  const headers = new Headers();
  const user = await getSessionUser(request, headers);
  if (user) return redirect("/profile", { headers });
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const headers = new Headers();
  const formData = await request.formData();
  
  const intent = formData.get("intent");
  if (intent === "google") {
    const { getSiteOrigin, getOAuthSignInUrl } = await import("../lib/supabase.server");
    const origin = getSiteOrigin(request);
    console.log(`[AUTH_DEBUG] Initiating Google sign-up with origin: ${origin}`);
    const url = await getOAuthSignInUrl(request, headers, "google", `${origin}/auth/callback`);
    return redirect(url, { headers });
  }
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!email || !password) {
    return { error: "AUTH_FAIL: Email and password are required." };
  }
  if (password !== confirm) {
    return { error: "AUTH_FAIL: Passwords do not match." };
  }
  if (password.length < 6) {
    return { error: "AUTH_FAIL: Password must be at least 6 characters." };
  }

  const { registerUser, loginUser } = await import("../services/auth.server");
  const result = await registerUser(request, headers, email, password);
  if (result.error) {
    return { error: result.error };
  }

  // Try to log in immediately after registration
  const loginResult = await loginUser(request, headers, email, password);
  if (loginResult.error) {
    // Registration succeeded but login failed (likely email confirmation required)
    // Show a message instead of redirecting
    return { success: true, email };
  }
  if (!loginResult.user) {
    return { error: "AUTH_FAIL: Unable to verify the signed-in user." };
  }

  return redirect("/onboarding", { headers });
}

export default function RegisterPage({ loaderData, actionData: propActionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const isSubmitting = navigation.state === "submitting";

  const actionData = propActionData;
  
  // Helper to format numbers with commas
  const formatNum = (num: number) => new Intl.NumberFormat().format(num);

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Register — The Developer Community",
            description: "Create an account and join The Developer Community. Find projects, build your portfolio, and earn proof of work credits.",
            url: `${SITE_URL}/register`,
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
                { "@type": "ListItem", position: 2, name: "Register", item: `${SITE_URL}/register` },
              ],
            },
          }),
        }}
      />
      <div className={styles.bgGrid} aria-hidden />

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.brandWrapper}>
            <img src="/tdc-wide.svg" alt="TDC Logo" className={styles.brandLogo} />
            <div className={styles.brandText}>THE DEVELOPER COMMUNITY</div>
          </div>
          <h1 className={styles.title}>
            REGISTER<span className={styles.blink}>_</span>
          </h1>
        </header>

        <div className={styles.card}>
          <form className={styles.formBox} method="post">
            {/* Left column: primary fields */}
            <div className={styles.formSection} style={{ border: "none", padding: 0 }}>


              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  className={styles.input}
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="password">Password</label>
                <div className={styles.passwordRow}>
                  <input
                    id="password"
                    name="password"
                    className={styles.input}
                    type={showPw ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="confirm">Confirm Password</label>
                <div className={styles.passwordRow}>
                  <input
                    id="confirm"
                    name="confirm"
                    className={styles.input}
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {actionData?.error && (
                <p className={styles.errorMsg} role="alert">{actionData.error}</p>
              )}
              {actionData && "success" in actionData && actionData.success && (
                <p className={styles.successMsg} role="status">
                  Account created! Check your inbox for a confirmation email, then{" "}
                  <Link to="/login" className={styles.loginLink}>log in here</Link>.
                </p>
              )}

              <div className={styles.loginActions}>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? "INITIALIZING..." : "JOIN THE COMMUNITY"}
                </button>

                <div className={styles.oauthSection}>
                  <button type="submit" name="intent" value="google" className={styles.oauthBtn} disabled={isSubmitting} formNoValidate>
                    <img src="https://www.google.com/favicon.ico" alt="" className={styles.oauthLogo} aria-hidden="true" />
                    SIGN UP WITH GOOGLE
                  </button>
                </div>

                <Link to="/login" className={styles.registerNowBtn}>
                  ALREADY HAVE AN ACCOUNT? LOGIN NOW
                </Link>
                <Link to="/" className={styles.backToSite}>RETURN TO SITE</Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
