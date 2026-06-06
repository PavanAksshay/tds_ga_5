import { useState, useEffect } from "react";
import { useLoaderData } from "react-router";
import type { Route } from "./+types/auth.github.callback";
import { requireAuth } from "~/services/auth.server";
import { exchangeGithubCode } from "~/services/github-auth.server";
import { linkGithubProfile } from "~/services/profile.server";
import { getSiteOrigin } from "~/lib/supabase.server";
import { SITE_URL } from "~/lib/seo";
import authStyles from "./auth.module.css";

export function meta() {
  return [
    { title: "Connecting GitHub | The Developer Community" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

function getSafeRedirect(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/profile";
}

export async function loader({ request }: Route.LoaderArgs) {
  const headers = new Headers();
  // VERCEL WORKAROUND: Prevent Vercel Edge Cache from caching the 200 JSON Response.
  // Cache hits at the edge forcefully strip Set-Cookie headers from being delivered.
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnTo = getSafeRedirect(url.searchParams.get("state"));

  console.log("[GITHUB CALLBACK] Loader triggered", {
    url: request.url,
    code: code ? `${code.substring(0, 5)}...` : null,
    returnTo,
  });

  // Must be logged in
  const user = await requireAuth(request, headers);
  console.log("[GITHUB CALLBACK] Authenticated user:", user?.id);

  // If no code, something went wrong — send back to profile
  if (!code) {
    console.error("[GITHUB CALLBACK] No code in URL");
    return Response.json({ success: false, error: "No OAuth code returned from GitHub", returnTo }, { headers });
  }

  try {
    const isLocal = request.url.includes("localhost") || request.url.includes("127.0.0.1");
    const redirectUri = isLocal
      ? `${getSiteOrigin(request)}/auth/github/callback`
      : `${SITE_URL}/auth/github/callback`;

    const { github_id, github_handle, github_access_token } =
      await exchangeGithubCode(code, redirectUri);

    const result = await linkGithubProfile(user.id, {
      github_id,
      github_handle,
      github_access_token,
      email: user.email,
    });
    
    if (result.error) {
      console.error("[GITHUB CALLBACK] Failed to persist GitHub link:", result.error);
      return Response.json({ success: false, error: result.error, returnTo }, { headers });
    }

    console.log(
      `[GITHUB CALLBACK] Linked github_id ${github_id} to user ${user.id}`
    );
    return Response.json({ success: true, returnTo }, { headers });
  } catch (err: any) {
    console.error("[GITHUB CALLBACK] Error:", err);
    return Response.json({ success: false, error: err?.message || String(err), returnTo }, { headers });
  }
}

export default function AuthGithubCallback() {
  const data = useLoaderData() as { success: boolean; returnTo: string; error?: string };
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!data) return;
    
    const targetUrl = data.returnTo || "/profile";

    if (data.success) {
      if (window.opener) {
        try {
          window.opener.postMessage({ type: "GITHUB_CONNECTED", success: true }, window.location.origin);
          window.close();
          return;
        } catch (e) {
          console.error("[GITHUB CALLBACK] Failed to send postMessage to opener:", e);
        }
      }
      // Redirect immediately upon successful verification
      window.location.replace(targetUrl);
    } else {
      // Start 3-second countdown and then redirect only on error
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            window.location.replace(targetUrl);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [data]);

  const targetUrl = data?.returnTo || "/profile";

  return (
    <div className={authStyles.page}>
      {data?.success && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (window.opener) {
                try {
                  window.opener.postMessage({ type: "GITHUB_CONNECTED", success: true }, window.location.origin);
                  window.close();
                } catch (e) {
                  window.location.replace(${JSON.stringify(targetUrl)});
                }
              } else {
                window.location.replace(${JSON.stringify(targetUrl)});
              }
            `,
          }}
        />
      )}
      <div className={authStyles.bgGrid} aria-hidden />
      <div className={authStyles.scanlines} />
      <div className={authStyles.container}>
        <header className={authStyles.header}>
          <div className={authStyles.brandWrapper}>
            <img src="/tdc-wide.svg" alt="TDC Logo" className={authStyles.brandLogo} width={120} height={24} />
            <div className={authStyles.brandText}>THE DEVELOPER COMMUNITY</div>
          </div>
          <h1 className={authStyles.title}>
            {data?.success ? "GITHUB_CONNECTED" : "CONNECTION_FAILED"}<span className={authStyles.blink}>_</span>
          </h1>
        </header>

        <div className={authStyles.card}>
          <div className={authStyles.formBox}>
            {data?.success ? (
              <>
                <div className={authStyles.successMsg}>
                  &gt; GITHUB_LINK_ESTABLISHED_SUCCESSFULLY
                </div>
                
                <p className={authStyles.subtitle} style={{ marginTop: 16 }}>
                  Your GitHub identity has been linked to your developer profile. 
                  Syncing terminal capabilities now...
                </p>

                <div className={authStyles.terminal} style={{ marginTop: 24 }}>
                  <div className={authStyles.terminalRow}>
                    <span>STATUS</span>
                    <span style={{ color: '#22c55e' }}>ONLINE</span>
                  </div>
                  <div className={authStyles.terminalRow}>
                    <span>REDIRECT_TARGET</span>
                    <span>{targetUrl}</span>
                  </div>
                  <div className={authStyles.terminalRow}>
                    <span>COOLDOWN</span>
                    <span>{countdown}s</span>
                  </div>
                </div>

                <button 
                  onClick={() => window.location.replace(targetUrl)} 
                  className={authStyles.submitBtn}
                  style={{ marginTop: 24 }}
                >
                  REDIRECT_NOW &rarr;
                </button>
              </>
            ) : (
              <>
                <div className={authStyles.errorMsg}>
                  &gt; GITHUB_LINK_ESTABLISHMENT_FAILED
                </div>
                
                <p className={authStyles.subtitle} style={{ marginTop: 16, color: '#ffb4ab' }}>
                  Error: {data?.error || "Unknown authentication error."}
                </p>

                <div className={authStyles.terminal} style={{ marginTop: 24 }}>
                  <div className={authStyles.terminalRow}>
                    <span>STATUS</span>
                    <span style={{ color: '#ff3333' }}>CRASHED</span>
                  </div>
                  <div className={authStyles.terminalRow}>
                    <span>REDIRECT_TARGET</span>
                    <span>{targetUrl}</span>
                  </div>
                  <div className={authStyles.terminalRow}>
                    <span>COOLDOWN</span>
                    <span>{countdown}s</span>
                  </div>
                </div>

                <button 
                  onClick={() => window.location.replace(targetUrl)} 
                  className={authStyles.submitBtn}
                  style={{ marginTop: 24 }}
                >
                  RETURN_TO_PAGE &rarr;
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

