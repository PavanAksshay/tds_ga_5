import { redirect } from "react-router";
import type { Route } from "./+types/auth.github";
import { requireAuth } from "~/services/auth.server";
import { getGithubOAuthUrl } from "~/services/github-auth.server";
import { getProfileAuthGateStatus } from "~/services/profile.server";
import { getSiteOrigin } from "~/lib/supabase.server";
import { SITE_URL } from "~/lib/seo";

export function meta() {
  return [
    { title: "Connect GitHub | The Developer Community" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

function getSafeRedirect(request: Request) {
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirect") || "/profile";
  return redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/profile";
}

export async function loader({ request }: Route.LoaderArgs) {
  const headers = new Headers();
  const requestUrl = new URL(request.url);
  const returnTo = getSafeRedirect(request);
  const forceRelink = requestUrl.searchParams.get("force") === "1";

  // Must be logged in to link GitHub
  const user = await requireAuth(request, headers);
  const gate = await getProfileAuthGateStatus(user.id);
  if (gate.hasGithub && !forceRelink) {
    return redirect(returnTo, { headers });
  }

  const isLocal = request.url.includes("localhost") || request.url.includes("127.0.0.1");
  const redirectUri = isLocal
    ? `${getSiteOrigin(request)}/auth/github/callback`
    : `${SITE_URL}/auth/github/callback`;
  const url = getGithubOAuthUrl(redirectUri, returnTo);
  console.log("[GITHUB AUTH] Redirecting to GitHub OAuth", {
    hasClientId: Boolean(process.env.GITHUB_CLIENT_ID),
    redirectUri,
    returnTo,
    forceRelink,
  });

  return redirect(url, { headers });
}
