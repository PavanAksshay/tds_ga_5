import { useEffect } from "react";
import { useSubmit, useActionData, useNavigation, redirect, useLoaderData } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
// Note: Server-only imports moved to dynamic imports within handler functions 
// to prevent leakage into the client bundle and resolve build errors.
import styles from "./auth.module.css";

export function meta() {
  return [
    { title: "Authenticating... | The Developer Community" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}



/**
 * Handle server-side code exchange (PKCE Flow)
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const type = url.searchParams.get("type");
  const headers = new Headers();
  // VERCEL WORKAROUND: Prevent Vercel Edge Cache from caching the 200 JSON Response.
  // Cache hits at the edge forcefully strip Set-Cookie headers from being delivered.
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");

  const host = request.headers.get("host");
  console.log("AUTH_DEBUG: Callback Request", { 
    url: request.url, 
    host,
    code: !!code,
    cookies: request.headers.get("Cookie")?.substring(0, 30) + "..." 
  });

  if (code) {
    const { exchangeCodeForSession, getSiteOrigin } = await import("../lib/supabase.server");
    const { getPostLoginRedirect } = await import("../services/profile.server");
    const { verifySuperAdmin } = await import("../services/admin.crypto.server");
    const { user, error } = await exchangeCodeForSession(request, headers, code);
    
    console.log("[AUTH_DEBUG] Exchange result:", { user: !!user, email: user?.email, error });

    if (!error && user) {
      const origin = getSiteOrigin(request);
      console.log(`[AUTH_DEBUG] Detected origin for callback landing: ${origin}`);

      let next = await getPostLoginRedirect(user.id, {
        isSuperAdmin: verifySuperAdmin(user.email),
      });

      // If this is a password recovery flow, send them to the reset page
      if (type === "recovery") {
        console.log("[AUTH_DEBUG] Recovery flow detected, redirecting to /reset-password");
        next = "/reset-password";
      }

      console.log(`[AUTH_DEBUG] Breaking redirect chain, rendering 200 OK for: ${next}`);
      // Send 200 OK so the browser processes Set-Cookie without ITP dropping it,
      // then rely on client to replace destination
      return Response.json({ next }, { headers });
    }
    
    return Response.json({ fatalError: `AUTH_EXCHANGE_FAILED: ${error || "Unknown code exchange error"}` }, { headers });
  }

  return Response.json({ hasCode: false }, { headers });
}

/**
 * Handle client-side session establishment (Implicit/Hash Flow)
 */
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const access_token = formData.get("access_token") as string;
  const refresh_token = formData.get("refresh_token") as string;
  const type = formData.get("type") as string;
  const headers = new Headers();

  if (!access_token || !refresh_token) {
    return redirect("/login?error=invalid_tokens");
  }

  const { createSupabaseAdminClient } = await import("../lib/supabase.server");
  // Note: Server-only imports moved to dynamic imports within handler functions
  const { setAuthSession } = await import("../services/auth.server");
  const { getPostLoginRedirect } = await import("../services/profile.server");
  const { verifySuperAdmin } = await import("../services/admin.crypto.server");

  // 1. Establish session cookie
  await setAuthSession(request, headers, access_token, refresh_token);

  // 2. Identify user from the access token (it's a JWT)
  const adminSupabase = createSupabaseAdminClient();
  const { data: { user }, error: userError } = await adminSupabase.auth.getUser(access_token);

  if (user) {
    if (type === "recovery") {
      return redirect("/reset-password", { headers });
    }

    const next = await getPostLoginRedirect(user.id, {
      isSuperAdmin: verifySuperAdmin(user.email),
    });
    return redirect(next, { headers });
  }

  console.error("AUTH_ERROR: Action session establishment failed:", userError?.message);
  return redirect("/login?error=session_loss");
}

export default function AuthCallback() {
  const submit = useSubmit();
  const navigation = useNavigation();
  const actionData = useActionData() as { error?: string } | undefined;
  const loaderData = useLoaderData() as { next?: string; hasCode?: boolean; fatalError?: string } | undefined;

  useEffect(() => {
    // If code exchange returned a destination, navigate using client-side 
    // to preserve cookies in Safari/Chrome ITP across cross-site redirects.
    if (loaderData?.next) {
      window.location.replace(loaderData.next);
      return;
    }
  }, [loaderData]);

  if (loaderData?.fatalError) {
    return (
      <div className={styles.initializingPage}>
        <div className={styles.scanlines} />
        <div className={styles.initializingContent}>
          <div className={styles.initializingStatus}>
            <span>ERROR_PROTOCOL::AUTH_FAILED</span>
            <span>CODE: 0x500</span>
          </div>
          <h1 className={styles.initializingTitle} style={{ color: '#ff3333' }}>INITIALIZATION<br />FAILURE</h1>
          <p className={styles.errorText} style={{ marginBottom: 32 }}>{loaderData.fatalError}</p>
          <div className={styles.initializingFooter}>
            <span>PROTOCOL_ACTION_REQUIRED: SCREENSHOT_REQUIRED</span>
            <button 
              onClick={() => window.location.href = '/login'} 
              className={styles.submitBtn} 
              style={{ padding: '8px 16px', fontSize: '10px', marginTop: 16 }}
            >
              RESTART_AUTHENTICATION &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (!hash) return;

    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (access_token && refresh_token) {
      submit(
        { access_token, refresh_token, type: params.get("type") || "" },
        { method: "post" }
      );
    }
  }, [submit, loaderData]);

  return (
    <div className={styles.initializingPage}>
      <div className={styles.initializingContent}>
        <div className={styles.initializingStatus}>
          <span>SYNCING_SESSION_PROTOCOL...</span>
        </div>

        <h1 className={styles.initializingTitle}>
          INITIALIZING
        </h1>

        <div className={styles.initSpinnerWrap}>
          <div className={styles.initSpinner} />
        </div>

        {actionData?.error && (
          <p className={styles.errorText} style={{ marginTop: 24 }}>
            &gt; ERROR: {actionData.error}
          </p>
        )}

        <div className={styles.initializingFooter}>
          <span>DEVCOM_OS v2.4.1</span>
        </div>
      </div>
    </div>
  );
}
