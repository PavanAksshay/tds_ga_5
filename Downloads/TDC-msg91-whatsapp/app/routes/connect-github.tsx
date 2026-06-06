import { useEffect } from "react";
import { Link, redirect, useSearchParams } from "react-router";
import type { Route } from "./+types/connect-github";
import styles from "./connect-github.module.css";
import authStyles from "./auth.module.css";

export function meta() {
  return [
    { title: "Connect GitHub | The Developer Community" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import("../services/auth.server");
  const { getProfileAuthGateStatus } = await import("../services/profile.server");

  const headers = new Headers();
  const user = await requireAuth(request, headers);
  const gate = await getProfileAuthGateStatus(user.id);

  if (!gate.hasProfile) {
    return redirect("/onboarding", { headers });
  }

  if (gate.hasGithub) {
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get("redirect") || "/profile";
    const safeRedirect = redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/profile";
    return redirect(safeRedirect, { headers });
  }

  return Response.json({}, { headers });
}

export default function ConnectGithubPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/profile";
  const safeRedirect = redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/profile";

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "GITHUB_CONNECTED" && event.data?.success) {
        console.log("[CONNECT_GITHUB] GitHub connected successfully, reloading to sync state...");
        window.location.reload();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div className={authStyles.page}>
      <div className={authStyles.bgGrid} aria-hidden />

      <div className={authStyles.container}>
        <header className={authStyles.header}>
          <div className={authStyles.brandWrapper}>
            <img src="/tdc-wide.svg" alt="TDC Logo" className={authStyles.brandLogo} width={120} height={24} />
            <div className={authStyles.brandText}>THE DEVELOPER COMMUNITY</div>
          </div>
          <h1 className={authStyles.title}>
            CONNECT_GITHUB<span className={authStyles.blink}>_</span>
          </h1>
        </header>

        <div className={authStyles.card}>
          <div className={`${authStyles.formBox} ${styles.content}`}>
            <p className={styles.subtitle}>
              Authorize your GitHub account to access your profile, track contributions, and
              continue on The Developer Community.
            </p>

            <a
              href={`/auth/github?redirect=${encodeURIComponent(safeRedirect)}&force=1`}
              className={styles.connectBtn}
              rel="external"
            >
              CONNECT GITHUB
            </a>

            <Link to="/logout" className={authStyles.backToSite}>
              SIGN OUT
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
