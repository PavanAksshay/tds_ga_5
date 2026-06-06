import crypto from "crypto";
import { createSupabaseAdminClient } from "~/lib/supabase.server";

/**
 * Verifies the signature of the incoming GitHub webhook payload.
 * Uses GITHUB_WEBHOOK_SECRET for verification and performs a constant-time comparison
 * to protect against timing attacks.
 */
export function verifyGithubSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[GITHUB_WEBHOOK] GITHUB_WEBHOOK_SECRET environment variable is not defined");
    return false;
  }

  try {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(rawBody);
    const expectedSignature = "sha256=" + hmac.digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature);
    const signatureBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch (error) {
    console.error("[GITHUB_WEBHOOK] Error verifying signature:", error);
    return false;
  }
}

/**
 * Handles incoming push event webhook payloads from GitHub.
 * Extracts committer details and maps each commit to a user contribution entry.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handlePushEvent(payload: any): Promise<void> {
  try {
    const githubId = payload.sender?.id ? String(payload.sender.id) : null;
    const repoFullName = payload.repository?.full_name || "";
    const repoOwner = repoFullName.split("/")[0]?.trim().toLowerCase();

    const allowedOrgsEnv = process.env.ALLOWED_GITHUB_ORGS;
    if (allowedOrgsEnv) {
      const allowedOrgs = allowedOrgsEnv.split(",").map(org => org.trim().toLowerCase());
      if (repoOwner && !allowedOrgs.includes(repoOwner)) {
        console.log(`[GITHUB_WEBHOOK] Skipping push: Repository owner "${repoOwner}" is not in the ALLOWED_GITHUB_ORGS list (${allowedOrgsEnv}).`);
        return;
      }
    }

    const branch = payload.ref ? payload.ref.replace("refs/heads/", "") : "";
    const commits = payload.commits || [];

    const supabase = createSupabaseAdminClient();
    const description = `${repoFullName} → ${branch}`;

    for (const commit of commits) {
      const title = commit.message || "Commit";
      const link = commit.url || null;
      
      const commitAuthorUsername = commit.author?.username;
      const commitAuthorEmail = commit.author?.email;

      let userId: string | null = null;

      // Extract github ID from github no-reply email format: [id]+[username]@users.noreply.github.com
      let extractedGithubId: string | null = null;
      if (commitAuthorEmail && (commitAuthorEmail.endsWith("@users.noreply.github.com") || commitAuthorEmail.endsWith("@noreply.github.com"))) {
        const match = commitAuthorEmail.match(/^(\d+)\+/);
        if (match) {
          extractedGithubId = match[1];
        }
      }

      // 1. Try matching by extracted github ID from no-reply email (robust against username changes)
      if (extractedGithubId) {
        const { data: profile } = await (supabase.from("profiles") as any)
          .select("id")
          .eq("github_id", extractedGithubId)
          .maybeSingle();
        if (profile) {
          userId = profile.id;
        }
      }

      // 2. Try matching by github_handle (case-insensitive)
      if (!userId && commitAuthorUsername) {
        const { data: profile } = await (supabase.from("profiles") as any)
          .select("id")
          .ilike("github_handle", commitAuthorUsername)
          .maybeSingle();
        if (profile) {
          userId = profile.id;
        }
      }

      // 3. Try matching by email (case-insensitive)
      if (!userId && commitAuthorEmail) {
        const { data: profile } = await (supabase.from("profiles") as any)
          .select("id")
          .ilike("email", commitAuthorEmail)
          .maybeSingle();
        if (profile) {
          userId = profile.id;
        }
      }

      // 4. Fallback to push sender's profile
      if (!userId && githubId) {
        const { data: profile } = await (supabase.from("profiles") as any)
          .select("id")
          .eq("github_id", githubId)
          .maybeSingle();
        if (profile) {
          userId = profile.id;
        }
      }

      if (!userId) {
        console.warn(`[GITHUB_WEBHOOK] Skipping commit ${commit.id || ""}: Could not map author (${commitAuthorUsername || ""}/${commitAuthorEmail || ""}) to a registered profile.`);
        continue;
      }

      const { error: insertError } = await (supabase.from("user_contributions") as any)
        .insert({
          user_id: userId,
          title,
          description,
          link,
          status: "GITHUB_PUSH",
          project_id: null,
        });

      if (insertError) {
        console.error(`[GITHUB_WEBHOOK] Error inserting contribution for commit ${commit.id || ""}:`, insertError);
      }
    }
  } catch (error) {
    console.error("[GITHUB_WEBHOOK] handlePushEvent failed:", error);
  }
}
