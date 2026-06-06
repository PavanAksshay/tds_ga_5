import { Link, useActionData, useNavigation, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { Route } from "./+types/login";
import { redirect } from "react-router";
import styles from "./auth.module.css";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Login | The Developer Community" },
    { name: "description", content: "Log in to your TDC account to access your developer dashboard, projects, and verified resume credits." },
    { name: "robots", content: "noindex, nofollow" },
  ];
}


export async function loader({ request }: Route.LoaderArgs) {
  const { getSessionUser } = await import("../lib/supabase.server");
  const { verifySuperAdmin } = await import("../services/admin.crypto.server");
  const { getPostLoginRedirect } = await import("../services/profile.server");

  const headers = new Headers();
  const user = await getSessionUser(request, headers);
  const url = new URL(request.url);
  const siteUrl = url.origin;

  if (user) {
    const dest = await getPostLoginRedirect(user.id, {
      isSuperAdmin: verifySuperAdmin(user.email),
      preferredRedirect: url.searchParams.get("redirect") ?? undefined,
    });
    return redirect(dest, { headers });
  }
  return { siteUrl };
}

export async function action({ request }: Route.ActionArgs) {
  const { getSiteOrigin, getOAuthSignInUrl } = await import("../lib/supabase.server");
  const { loginUser } = await import("../services/auth.server");
  const { verifySuperAdmin } = await import("../services/admin.crypto.server");
  const { getPostLoginRedirect } = await import("../services/profile.server");

  const headers = new Headers();
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "google") {
    const origin = getSiteOrigin(request);
    console.log(`[AUTH_DEBUG] Initiating Google login with origin: ${origin}`);
    const url = await getOAuthSignInUrl(request, headers, "google", `${origin}/auth/callback`);
    return redirect(url, { headers });
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/profile");

  if (!email || !password) {
    return { error: "AUTH_FAIL: Email and password are required." };
  }

  const result = await loginUser(request, headers, email, password);
  if (result.error) {
    return { error: result.error };
  }
  if (!result.user) {
    return { error: "AUTH_FAIL: Unable to verify the signed-in user." };
  }

  const dest = await getPostLoginRedirect(result.user.id, {
    isSuperAdmin: verifySuperAdmin(email),
    preferredRedirect: redirectTo,
  });
  return redirect(dest, { headers });
}

export default function LoginPage({ loaderData, actionData: propActionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const [showPw, setShowPw] = useState(false);
  
  useEffect(() => {
    // [GHOST COOKIE KILLER]: If the user lands here, the server considered their session invalid.
    // Manually nuke all sb-* cookies client-side across root domains to guarantee any stuck
    // cross-subdomain ghost cookies are destroyed, breaking infinite loop traps.
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      if (name.includes("-auth-token") || name.includes("code-verifier")) {
        const hostname = window.location.hostname;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${hostname}`;
        if (hostname.startsWith('www.')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${hostname.substring(4)}`;
        }
      }
    }
  }, []);
  const isSubmitting = navigation.state === "submitting";
  const redirectTo = searchParams.get("redirect") || "/profile";
  
  // Use actionData from props if available, otherwise fallback
  const actionData = propActionData;
  const siteUrl = (loaderData as any)?.siteUrl || "";

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
            name: "Login — The Developer Community",
            description: "Log in to The Developer Community to access your projects, team contributions, and proof of work credits.",
            url: `${siteUrl}/login`,
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
                { "@type": "ListItem", position: 2, name: "Login", item: `${siteUrl}/login` },
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
            LOGIN<span className={styles.blink}>_</span>
          </h1>
        </header>

        <div className={styles.card}>
          <form className={styles.formBox} method="post">
            <input type="hidden" name="redirectTo" value={redirectTo} />

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
                  aria-label="Email address"
                />
              </div>

              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="password">ACCESS_PROTOCOL (KEY)</label>
                  <Link to="/forgot-password" className={styles.forgotBtn}>LOST_ACCESS?</Link>
                </div>
                <div className={styles.passwordRow}>
                  <input
                    id="password"
                    name="password"
                    className={styles.input}
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
                    aria-label="Password"
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

              {actionData?.error && (
                <p className={styles.errorMsg} role="alert">{actionData.error}</p>
              )}

              <div className={styles.loginActions}>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? "AUTHENTICATING..." : "LOGIN USER"}
                </button>
                
                <div className={styles.oauthSection}>
                  <button type="submit" name="intent" value="google" className={styles.oauthBtn} disabled={isSubmitting} formNoValidate>
                    <img src="https://www.google.com/favicon.ico" alt="" className={styles.oauthLogo} aria-hidden="true" />
                    SIGN IN WITH GOOGLE
                  </button>
                </div>

                <Link to="/register" className={styles.registerNowBtn}>NEW HERE? REGISTER NOW</Link>
                <Link to="/" className={styles.backToSite}>RETURN TO SITE</Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
