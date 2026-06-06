/**
 * GitHub OAuth service — links a GitHub account to a TDC profile.
 * Server-only. Never import this in client components.
 */

function getGithubEnv() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("[GITHUB AUTH] Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET env variables!");
  }
  return { clientId: clientId!, clientSecret: clientSecret! };
}

/**
 * Returns the GitHub OAuth URL to redirect the user to.
 */
export function getGithubOAuthUrl(redirectUri: string, returnTo = "/profile"): string {
  const { clientId } = getGithubEnv();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user",
    state: returnTo,
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

/**
 * Exchanges the OAuth code for an access token, then fetches
 * the user's GitHub identity. Returns github_id (permanent numeric ID),
 * github_handle (username), and github_access_token.
 */
export async function exchangeGithubCode(
  code: string,
  redirectUri: string
): Promise<{
  github_id: string;
  github_handle: string;
  github_access_token: string;
}> {
  // Step 1 — exchange code for access token
  const { clientId, clientSecret } = getGithubEnv();
  const tokenRes = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "TheDeveloperCommunity-TDC",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    }
  );

  const tokenData = await tokenRes.json();
  const access_token = tokenData.access_token;

  if (!access_token) {
    throw new Error("GitHub OAuth: failed to get access token");
  }

  // Step 2 — fetch GitHub user profile to get permanent numeric ID
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${access_token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "TheDeveloperCommunity-TDC",
    },
  });

  const githubUser = await userRes.json();

  if (!githubUser.id) {
    throw new Error("GitHub OAuth: failed to get user identity");
  }

  return {
    github_id: String(githubUser.id),
    github_handle: githubUser.login as string,
    github_access_token: access_token as string,
  };
}
