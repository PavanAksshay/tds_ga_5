import { Link, useActionData, useNavigation, redirect, useFetcher, useLoaderData } from "react-router";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import type { Route } from "./+types/reset-password";
import { confirmPasswordResetCode, updateUserPassword, getSessionUser, setAuthSession } from "../services/auth.server";
import styles from "./auth.module.css";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Set New Password | The Developer Community" },
    { name: "description", content: "Create a new secure password for your TDC account." },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const headers = new Headers();

  // 1. If we have an auth code, we MUST exchange it first.
  if (code) {
    const result = await confirmPasswordResetCode(request, headers, code);
    
    // If exchange succeeded, we have a session cookie in 'headers'.
    // We redirect to the same page WITHOUT the code to clean the URL.
    if (!result.error) {
      return redirect("/reset-password", { headers });
    }
  }

  // 2. No code in URL: Check if we are authenticated via cookie.
  const user = await getSessionUser(request, headers);

  // Return user status but DON'T redirect yet. 
  // This allows the client-side HashHandler to check for #access_token if user is null.
  return Response.json({ hasUser: !!user }, { headers });
}

export async function action({ request }: Route.ActionArgs) {
  const headers = new Headers();
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Sub-protocol: Establish session from client-side tokens
  if (intent === "set-session") {
    const accessToken = String(formData.get("accessToken") ?? "");
    const refreshToken = String(formData.get("refreshToken") ?? "");
    if (accessToken && refreshToken) {
      await setAuthSession(request, headers, accessToken, refreshToken);
      return Response.json({ success: true }, { headers });
    }
    return { error: "Failed to establish session." };
  }

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password) {
    return { error: "New access key is required." };
  }

  if (password !== confirmPassword) {
    return { error: "Keys do not match. Protocol verification failed." };
  }

  const result = await updateUserPassword(request, headers, password);
  if (result.error) {
    return { error: result.error };
  }

  return redirect("/profile?success=password_reset", { headers });
}

export default function ResetPasswordPage({ loaderData: anyData, actionData: propActionData }: Route.ComponentProps) {
  const loaderData = anyData as any;
  const fetcher = useFetcher();
  const navigation = useNavigation();
  const [showPw, setShowPw] = useState(false);
  const isSubmitting = navigation.state === "submitting" || fetcher.state === "submitting";
  
  // We prioritize actionData from the password update, then from the session establishment
  const actionData = (propActionData as any)?.intent === "set-session" ? null : propActionData;

  // Client-side Hash Handler
  useEffect(() => {
    if (loaderData.hasUser) return;

    // Check if recovery tokens are in the hash (Supabase implicit flow)
    const hash = window.location.hash;
    if (hash && hash.includes("access_token=")) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const type = params.get("type");

      if (type === "recovery" && accessToken && refreshToken) {
        // Exchange client tokens for server cookie
        fetcher.submit(
          { intent: "set-session", accessToken, refreshToken },
          { method: "post" }
        );
      }
    } else if (!isSubmitting) {
      // No code, no user, no hash -> actually unauthorized
      // Wait a bit to ensure hash wasn't just slow to parse? 
      // Usually redirects to login if nothing found.
    }
  }, [loaderData.hasUser]);

  // If we are still syncing or waiting for data
  const isSyncing = !loaderData.hasUser && fetcher.state !== "idle";
  const showForm = loaderData.hasUser || (fetcher.data as any)?.success;

  if (!showForm && !isSyncing) {
     // If no user and no syncing after mount, redirect manually or show error
     // We use a small delay or a link to login
  }

  return (
    <div className={styles.page}>
      <div className={styles.bgGrid} aria-hidden />

      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            RESET<span className={styles.blink}>_</span>
          </h1>
          <p className={styles.subtitle}>
            Initial handshake successful. Define a new secure access key for your identity.
          </p>
        </header>

        <div className={styles.card}>
          {isSyncing ? (
             <div className={styles.formBox} style={{ alignItems: 'center' }}>
                <Loader2 className={styles.blink} size={32} style={{ color: 'var(--color-on-surface-muted)' }} />
                <p className={styles.label} style={{ marginTop: 'var(--space-4)' }}>IDENTIFYING_RECOVERY_SESSION...</p>
             </div>
          ) : showForm ? (
            <form className={styles.formBox} method="post">
              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="password">New Access Key</label>
                </div>
                <div className={styles.passwordRow}>
                  <input
                    id="password"
                    name="password"
                    className={styles.input}
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    required
                    aria-label="New Password"
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
                <label className={styles.label} htmlFor="confirmPassword">Verify New Key</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  className={styles.input}
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  required
                  aria-label="Confirm Password"
                />
              </div>

              {(actionData as any)?.error && (
                <p className={styles.errorMsg} role="alert">{(actionData as any).error}</p>
              )}

              <div className={styles.loginActions}>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? "UPDATING..." : "UPDATE_CREDENTIALS"}
                </button>
                <div className={styles.loginActions} style={{ alignItems: 'center', marginTop: 'var(--space-2)' }}>
                  <Link to="/login" className={styles.loginLink}>ABORT OPERATION ←</Link>
                  <Link to="/" className={styles.backToSite}>RETURN TO SITE</Link>
                </div>
              </div>
            </form>
          ) : (
            <div className={styles.formBox} style={{ alignItems: 'center' }}>
               <p className={styles.errorMsg}>UNAUTHORIZED_ACCESS_DETECTED</p>
               <p className={styles.label} style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
                 No valid recovery token found in current buffer.
               </p>
               <Link to="/login" className={styles.submitBtn} style={{ marginTop: 'var(--space-8)' }}>RETURN_TO_LOGIN</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
