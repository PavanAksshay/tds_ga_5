/**
 * Server-only Supabase client using official SSR library.
 * NEVER import this in client components.
 */
import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import type { Database } from "./database.types";

// Helper to retrieve and sanitize environment variables on-demand (lazy-loaded).
// This prevents module initialization errors in environments (like Cloudflare Workers)
// where process.env is only populated dynamically during the request handler lifecycle.
function getSupabaseEnv() {
  const url = (process.env.SUPABASE_PROJECT_URL ?? "").replace(/\/$/, "").trim();
  const rawKey = (process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_API_KEY ?? "");
  const anonKey = rawKey.replace(/[^\x21-\x7E]/g, "").trim();
  const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const serviceKey = rawServiceKey.replace(/[^\x21-\x7E]/g, "").trim();

  return { url, anonKey, serviceKey };
}

/**
 * Returns the correct site origin, forcing HTTPS in production to prevent cookie handshake failures.
 */
export function getSiteOrigin(request: Request) {
  const isProd = process.env.NODE_ENV === "production";
  const url = new URL(request.url);
  
  // In production, always force HTTPS if it's not localhost
  if (isProd && !url.hostname.includes("localhost") && !url.hostname.includes("127.0.0.1")) {
    return `https://${url.host}`;
  }
  
  return url.origin;
}

export function createSupabaseServerClient(
  request: Request,
  responseHeaders: Headers
) {
  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) {
    console.error("[CRITICAL] Missing Supabase environment variables!");
    throw new Error("Missing Supabase env vars: SUPABASE_PROJECT_URL and SUPABASE_ANON_KEY");
  }

  console.log(`[AUTH_HANDSHAKE] Initializing Supabase with project: ${url} (Key_Prefix: ${anonKey.substring(0, 10)}...)`);
  return createServerClient<Database>(url, anonKey, {
    cookieOptions: { name: "tdc-auth" },
    cookies: {
      getAll() {
        const cookies = parseCookieHeader(request.headers.get("Cookie") ?? "");
        return cookies.map(c => ({ name: c.name, value: c.value ?? "" }));
      },
      setAll(cookiesToSet) {
        console.log(`[AUTH_DEBUG] Supabase setting cookies:`, cookiesToSet.map(c => ({ name: c.name, valSize: c.value?.length })));
        
        cookiesToSet.forEach(({ name, value, options }) => {
          // We must not skip empty values! Supabase deletes cookies (like stale code-verifiers or expired sessions)
          // by setting value="" and maxAge=0. If we skip them, old verifiers/tokens get stuck in the user's browser,
          // eventually causing infinite refresh loops and "Request rate limit reached" errors.

          const isProd = process.env.NODE_ENV === "production";
          const isLocal = request.url.includes("localhost") || request.url.includes("127.0.0.1");

          const mergedOptions = {
            ...options,
            path: "/",
            httpOnly: false,
            secure: isProd && !isLocal,
            sameSite: name.includes("code-verifier") ? ("none" as any) : ("lax" as any),
          };

          const hostname = new URL(request.url).hostname;
          if (!mergedOptions.domain && isProd && !isLocal && hostname.includes("thedevcommunity.in")) {
            mergedOptions.domain = hostname.startsWith('www.') ? '.' + hostname.substring(4) : '.' + hostname;
          }
          const cookieString = serializeCookieHeader(name, value, mergedOptions);

          // Deduplicate Set-Cookie headers for the same cookie name to prevent header size explosion (e.g. Miniflare fetch failed)
          let currentSetCookies: string[] = [];
          if (typeof (responseHeaders as any).getSetCookie === "function") {
            currentSetCookies = (responseHeaders as any).getSetCookie();
          } else {
            const raw = responseHeaders.get("Set-Cookie");
            if (raw) {
              currentSetCookies = raw.split(/,\s*/);
            }
          }
          const otherCookies = currentSetCookies.filter(cookieStr => {
            const index = cookieStr.indexOf("=");
            if (index === -1) return true;
            const existingName = cookieStr.substring(0, index).trim();
            return existingName !== name;
          });
          responseHeaders.delete("Set-Cookie");
          otherCookies.forEach(cookieStr => responseHeaders.append("Set-Cookie", cookieStr));

          responseHeaders.append("Set-Cookie", cookieString);
          console.log(`[AUTH_DEBUG] Appended Set-Cookie: ${cookieString.substring(0, 40)}...`);
        });
      },
    },
  });
}

/**
 * Creates an admin Supabase client using the service role key.
 * Use ONLY for server-side operations that require bypassing RLS.
 */
export function createSupabaseAdminClient() {
  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_PROJECT_URL or SUPABASE_SERVICE_ROLE_KEY in environment");
  }

  // Note: We use createServerClient even for admin to keep consistent configuration,
  // but we don't need the cookie handling logic here as much since it's bypassing RLS.
  // However, for SSR compatibility and consistency, we'll use the basic createServerClient.
  return createServerClient<Database>(url, serviceKey, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  });
}

/**
 * Returns the authenticated Supabase user or null.
 */
export async function getSessionUser(
  request: Request,
  responseHeaders: Headers
) {
  const supabase = createSupabaseServerClient(request, responseHeaders);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * Initiate an OAuth sign-in flow.
 * Returns the URL that the user should be redirected to.
 */
export async function getOAuthSignInUrl(
  request: Request,
  responseHeaders: Headers,
  provider: string,
  redirectTo: string
): Promise<string> {
  const supabase = createSupabaseServerClient(request, responseHeaders);
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as any,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) {
    console.error(`[AUTH_ERROR] Failed to get OAuth URL for ${provider}:`, error.message);
    throw new Error(error.message);
  }

  return data.url!;
}

/**
 * Exchanges a code for a session (PKCE flow).
 */
export async function exchangeCodeForSession(
  request: Request,
  responseHeaders: Headers,
  code: string
) {
  const cookies = parseCookieHeader(request.headers.get("Cookie") ?? "");
  const verifierCount = cookies.filter(c => c.name.includes("code-verifier")).length;
  console.log(`[AUTH_DEBUG] Code exchange sync. Verifiers in cookies: ${verifierCount}`);

  const supabase = createSupabaseServerClient(request, responseHeaders);
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.error("[AUTH_ERROR] Code exchange failed:", error?.message);
    if (error?.message?.includes("Invalid API key")) {
      console.error("[CRITICAL] Supabase returned 'Invalid API key'. This confirms the SUPABASE_ANON_KEY used is rejected by the server.");
    }
    return { user: null, error: error?.message ?? "Code exchange failed" };
  }

  return { user: data.session.user, error: null };
}

/**
 * Triggers a password reset email.
 */
export async function resetPasswordForEmail(
  request: Request,
  responseHeaders: Headers,
  email: string,
  redirectTo: string
): Promise<string | null> {
  const supabase = createSupabaseServerClient(request, responseHeaders);
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    console.error("Supabase ResetPassword Error:", error.message);
    return error.message;
  }

  return null;
}

/**
 * Signs out.
 */
export async function signOutAndClearCookie(
  request: Request,
  responseHeaders: Headers
): Promise<void> {
  const supabase = createSupabaseServerClient(request, responseHeaders);
  await supabase.auth.signOut();
}

/** Dummy function kept for backward compatibility with auth.server.ts imports */
export async function signInAndSetCookie(
  request: Request,
  responseHeaders: Headers,
  email: string,
  password: string
): Promise<{ error: string | null; user: { id: string; email?: string } | null }> {
  const supabase = createSupabaseServerClient(request, responseHeaders);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return {
    error: error?.message ?? null,
    user: data.user ? { id: data.user.id, email: data.user.email } : null,
  };
}

/** Dummy function kept for backward compatibility with auth.server.ts imports */
export function writeSessionCookie(
  request: Request,
  responseHeaders: Headers,
  session: any
) {
  // Not needed with @supabase/ssr as setAll handles this
}
