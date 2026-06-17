/**
 * Profile service — read/write user profile data.
 * All functions are server-only.
 */
import { createSupabaseServerClient, createSupabaseAdminClient } from "../lib/supabase.server";
import type { Database } from "../lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export async function getProfile(
  request: Request,
  responseHeaders: Headers,
  userId: string
): Promise<Profile | null> {
  const supabase = createSupabaseServerClient(request, responseHeaders);
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error(`[PROFILE_SERVICE_ERROR] Failed to fetch profile for user ${userId}:`, error);
  }
  if (error || !data) return null;
  return data as Profile;
}

export async function getProfileAuthGateStatus(
  userId: string
): Promise<{ hasProfile: boolean; hasGithub: boolean; githubHandle: string | null }> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await (supabase.from("profiles") as any)
    .select("display_name, github_id, github_handle")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error(`[PROFILE_SERVICE_ERROR] Failed to fetch auth gate status for user ${userId}:`, error);
  }

  if (error || !data) {
    return { hasProfile: false, hasGithub: false, githubHandle: null };
  }

  return {
    hasProfile: Boolean(data.display_name),
    hasGithub: Boolean(data.github_id),
    githubHandle: data.github_handle ?? null,
  };
}

/**
 * Resolves where to send a user immediately after login or OAuth sign-in.
 * Onboarded users without github_id go to /connect-github before /profile.
 */
export async function getPostLoginRedirect(
  userId: string,
  options?: { isSuperAdmin?: boolean; preferredRedirect?: string }
): Promise<string> {
  if (options?.isSuperAdmin) return "/admin";

  const gate = await getProfileAuthGateStatus(userId);
  if (!gate.hasProfile) return "/onboarding";
  if (!gate.hasGithub) {
    const preferred = options?.preferredRedirect;
    if (preferred && (preferred.startsWith("/auth/github") || preferred.includes("/auth/github"))) {
      return preferred;
    }
    return "/connect-github";
  }

  const preferred = options?.preferredRedirect;
  if (
    preferred &&
    preferred.startsWith("/") &&
    !preferred.startsWith("//") &&
    preferred !== "/onboarding" &&
    preferred !== "/connect-github"
  ) {
    return preferred;
  }

  return "/profile";
}
export async function linkGithubProfile(
  userId: string,
  github: Pick<ProfileUpdate, "github_id" | "github_handle" | "github_access_token" | "email">
): Promise<{ error?: string }> {
  const supabase = createSupabaseAdminClient();
  const { error } = await (supabase.from("profiles") as any)
    .upsert({ id: userId, ...github });

  if (error) {
    console.error("GitHub profile link error:", error);
    // Postgres unique-violation (23505) on the github_id constraint means this
    // GitHub identity is already attached to a different TDC profile.
    const isDuplicateGithub =
      error.code === "23505" || /github_id/i.test(error.message ?? "");
    if (isDuplicateGithub) {
      return {
        error:
          "This GitHub account is already linked to another TDC profile. Sign in with that account, or use a different GitHub account.",
      };
    }
    return { error: error.message };
  }

  return {};
}

export async function getPublicProfileByUsername(
  username: string
): Promise<Profile | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase().trim())
    .single();

  if (error || !data) return null;
  return data as Profile;
}

export async function updateProfile(
  request: Request,
  responseHeaders: Headers,
  userId: string,
  updates: ProfileUpdate
): Promise<{ error?: string }> {
  const supabase = createSupabaseServerClient(request, responseHeaders);
  
  // Use upsert to create the profile if it doesn't exist
  const { error } = await (supabase.from("profiles") as any)
    .upsert({ ...updates, id: userId });

  if (error) {
    console.error("Profile update error:", error);
    return { error: error.message };
  }
  return {};
}

/** Get activity data for the heatmap based on XP logs */
export async function getUserActivity(
  request: Request,
  responseHeaders: Headers,
  userId: string
): Promise<{ date: string; count: number }[]> {
  const supabase = createSupabaseServerClient(request, responseHeaders);
  
  // Fetch XP logs for the last 90 days
  const yearAgo = new Date();
  yearAgo.setDate(yearAgo.getDate() - 90);

  const { data } = await (supabase.from("xp_log") as any)
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", yearAgo.toISOString());

  const logs = data ?? [];
  
  // Group by date
  const counts: Record<string, number> = {};
  logs.forEach((log: any) => {
    const date = log.created_at.split("T")[0];
    counts[date] = (counts[date] || 0) + 1;
  });

  return Object.entries(counts).map(([date, count]) => ({ date, count: count as number }));
}

/** Get activity data for the heatmap based on XP logs (public view) */
export async function getPublicUserActivity(
  userId: string
): Promise<{ date: string; count: number }[]> {
  const supabase = createSupabaseAdminClient();
  
  // Fetch XP logs for the last 90 days
  const yearAgo = new Date();
  yearAgo.setDate(yearAgo.getDate() - 90);

  const { data } = await (supabase.from("xp_log") as any)
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", yearAgo.toISOString());

  const logs = data ?? [];
  
  // Group by date
  const counts: Record<string, number> = {};
  logs.forEach((log: any) => {
    const date = log.created_at.split("T")[0];
    counts[date] = (counts[date] || 0) + 1;
  });

  return Object.entries(counts).map(([date, count]) => ({ date, count: count as number }));
}

/**
 * Generates a unique 6-character alphanumeric tag.
 * Purely numeric tags are reserved for admins and are skipped here.
 */
export async function generateUniqueTag(request: Request, responseHeaders: Headers): Promise<string> {
  const supabase = createSupabaseServerClient(request, responseHeaders);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
  let tag = "";
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 15) {
    // 1. Generate 6 random alphanumeric chars
    tag = "";
    for (let i = 0; i < 6; i++) {
        tag += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // 2. Skip if purely numeric (reserved for admins)
    if (/^\d+$/.test(tag)) {
      attempts++;
      continue;
    }

    // 3. Check for collisions in DB
    const { data } = await (supabase.from("profiles") as any).select("tag").eq("tag", tag).single();
    if (!data) {
      isUnique = true;
    }
    attempts++;
  }

  return tag;
}

/** Check if a username is already taken by another user */
export async function checkUsernameAvailability(
  request: Request,
  responseHeaders: Headers,
  username: string
): Promise<{ available: boolean }> {
  const supabase = createSupabaseServerClient(request, responseHeaders);
  
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username.toLowerCase().trim())
    .maybeSingle();

  if (error) {
    console.error("Username check error:", error);
    return { available: false };
  }

  return { available: !data };
}
