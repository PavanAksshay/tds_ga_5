/**
 * Auth service — wraps Supabase Auth for login, register, logout.
 * All functions are server-only.
 */
import { redirect } from "react-router";
import {
  createSupabaseServerClient,
  getSessionUser,
  signInAndSetCookie,
  signOutAndClearCookie,
  exchangeCodeForSession,
  resetPasswordForEmail,
  writeSessionCookie,
  getOAuthSignInUrl,
} from "../lib/supabase.server";

export { getSessionUser };

export interface AuthResult {
  error?: string;
  user?: { id: string; email?: string };
}

/**
 * Registers a new user with email + password.
 */
export async function registerUser(
  request: Request,
  responseHeaders: Headers,
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient(request, responseHeaders);

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });

  if (error) return { error: sanitizeAuthError(error.message) };
  return {};
}

/**
 * Logs in an existing user with email + password.
 * Writes the session cookie to responseHeaders on success.
 */
export async function loginUser(
  request: Request,
  responseHeaders: Headers,
  email: string,
  password: string
): Promise<AuthResult> {
  const result = await signInAndSetCookie(request, responseHeaders, email, password);
  if (result.error) return { error: sanitizeAuthError(result.error) };
  return result.user ? { user: result.user } : {};
}

/**
 * Logs out the current user and clears the session cookie.
 */
export async function logoutUser(
  request: Request,
  responseHeaders: Headers
): Promise<void> {
  await signOutAndClearCookie(request, responseHeaders);
}

/**
 * Loader helper: redirects to /login if the user is not authenticated.
 */
export async function requireAuth(
  request: Request,
  responseHeaders: Headers
) {
  const user = await getSessionUser(request, responseHeaders);
  if (!user) {
    const url = new URL(request.url);
    throw redirect(`/login?redirect=${encodeURIComponent(url.pathname + url.search)}`);
  }
  return user;
}

/**
 * Loader helper: redirects to /connect-github if the user has no linked GitHub.
 * Must be called AFTER requireAuth() so we have the user ID.
 * Admins are NOT exempt — everyone must connect GitHub.
 */
export async function requireGithub(userId: string) {
  const { getProfileAuthGateStatus } = await import("../services/profile.server");
  const gate = await getProfileAuthGateStatus(userId);

  if (!gate.hasProfile) {
    throw redirect("/onboarding");
  }
  if (!gate.hasGithub) {
    throw redirect("/connect-github");
  }
}

/**
 * Triggers a password reset email for the given address.
 */
export async function sendPasswordResetEmail(
  request: Request,
  responseHeaders: Headers,
  email: string,
  redirectTo: string
): Promise<AuthResult> {
  const errorMsg = await resetPasswordForEmail(request, responseHeaders, email, redirectTo);
  if (errorMsg) return { error: sanitizeAuthError(errorMsg) };
  return {};
}

/**
 * Exchanges a recovery code for a session.
 */
export async function confirmPasswordResetCode(
  request: Request,
  responseHeaders: Headers,
  code: string
): Promise<AuthResult> {
  const errorMsg = await exchangeCodeForSession(request, responseHeaders, code);
  if (errorMsg) return { error: sanitizeAuthError(String(errorMsg)) };
  return {};
}

/**
 * Updates the password for the current user session (recovery or normal).
 */
export async function updateUserPassword(
  request: Request,
  responseHeaders: Headers,
  password: string
): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: sanitizeAuthError(error.message) };
  return {};
}

/**
 * Sets the session cookie manually from access/refresh tokens.
 */
export async function setAuthSession(
  request: Request,
  responseHeaders: Headers,
  access_token: string,
  refresh_token: string
) {
  const supabase = createSupabaseServerClient(request, responseHeaders);
  await supabase.auth.setSession({ access_token, refresh_token });
  return {};
}

/**
 * Returns the URL to initiate Google OAuth flow.
 */
export async function getGoogleAuthUrl(request: Request, responseHeaders: Headers) {
  const url = new URL(request.url);
  const redirectTo = `${url.origin}/auth/callback`;
  const oauthUrl = await getOAuthSignInUrl(request, responseHeaders, "google", redirectTo);
  return oauthUrl;
}

/** Sanitize Supabase error messages — never expose internal details in prod, but help during dev. */
function sanitizeAuthError(message: string): string {
  const msg = message.toLowerCase();
  
  // Specific known errors
  if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials"))
    return "Invalid email or password.";
  if (msg.includes("email not confirmed") || msg.includes("email_not_confirmed"))
    return "Email not confirmed. Please check your inbox.";
  if (msg.includes("email already") || msg.includes("already registered"))
    return "An account with this email already exists.";
  if (msg.includes("password") && msg.includes("least 6"))
    return "Password must be at least 6 characters.";
  if (msg.includes("rate limit"))
    return "Too many attempts. Please wait before trying again.";
  if (msg.includes("code is invalid") || msg.includes("expired"))
    return "The reset link is invalid or has expired.";
  if (msg.includes("redirect_uri_not_allowed"))
    return "System Error: Redirect URI is not authorized in Supabase. Check Dashboard > Auth > Settings.";
    
  // If we don't know the error, show a more descriptive generic one during dev phase
  // In a real prod app, you'd log this and show "Authentication error."
  return `AUTH_PROTOCOL_ERROR: ${message}`;
}
