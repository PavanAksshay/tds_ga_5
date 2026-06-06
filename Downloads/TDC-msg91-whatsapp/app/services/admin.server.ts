import { redirect } from "react-router";
import { createSupabaseServerClient, getSessionUser, createSupabaseAdminClient } from "../lib/supabase.server";
import type { Database, Json } from "../lib/database.types";


export type AdminProfile = Database["public"]["Tables"]["profiles"]["Row"];
export type AdminApplication = Database["public"]["Tables"]["applications"]["Row"];
export type QuestionSet = Database["public"]["Tables"]["application_question_sets"]["Row"];
export type AuditLog = Database["public"]["Tables"]["admin_audit_log"]["Row"];
export type ApprovalRequest = Database["public"]["Tables"]["admin_approval_queue"]["Row"];

import { verifySuperAdmin } from "./admin.crypto.server";
import { type AdminSection, type AdminRole, hasPermission, canApprove, canPublishDirectly, SR_ADMIN_AUTO_SECTIONS } from "./admin-shared.server";

/** Returns the user if they are an admin, otherwise redirects to /login */
export async function requireAdmin(request: Request, responseHeaders: Headers) {
  const user = await getSessionUser(request, responseHeaders);
  if (!user) throw redirect("/login?redirect=/admin");

  const supabase = createSupabaseServerClient(request, responseHeaders);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("is_admin, email, display_name, admin_sections, admin_role, github_id")
    .eq("id", user.id)
    .maybeSingle();

  // Enforce profile onboarding first
  if (!profile || !profile.display_name) {
    throw redirect("/onboarding");
  }

  // Enforce GitHub authorization for all admins
  if (!profile.github_id) {
    const url = new URL(request.url);
    const redirectUrl = `/connect-github?redirect=${encodeURIComponent(url.pathname + url.search)}`;
    throw redirect(redirectUrl);
  }

  // Super Admin bypass for checking database values for is_admin
  if (verifySuperAdmin(user.email)) {
    return { user, profile: { ...profile, is_admin: true } };
  }

  const isAdmin = profile.is_admin === true;
  if (!isAdmin) throw redirect("/");

  return { user, profile };
}

export { hasPermission };

/** 
 * Strict Admin Gate: Checks for admin status AND PIN verification.
 * Use this in every admin route loader.
 */
export async function requireAdminGate(request: Request, responseHeaders: Headers, requiredSection?: AdminSection) {
  const { user, profile } = await requireAdmin(request, responseHeaders);
  
  // 1. Section Permission Check
  if (requiredSection && !hasPermission(profile, requiredSection)) {
    throw redirect("/admin?error=permission_denied");
  }

  // 2. PIN Verification Check (via session cookie)
  const cookieHeader = request.headers.get("Cookie") || "";
  // Robust check: match tdc_admin_verified=true as a standalone cookie
  const isVerified = /(^|;)\s*tdc_admin_verified=true($|;)/.test(cookieHeader);

  if (!isVerified) {
    const url = new URL(request.url);
    const redirectTo = encodeURIComponent(url.pathname + url.search);
    throw redirect(`/admin/verify?redirect=${redirectTo}`);
  }

  return { user, profile };
}

/** Simplified PIN hashing with salt */
async function hashPin(pin: string): Promise<string> {
  const crypto = await import("node:crypto");
  return crypto.createHash("sha256").update(pin + "tdc_salt_2026").digest("hex");
}

/** Verify a 6-digit PIN and set session cookie */
export async function verifyAndStartAdminSession(request: Request, responseHeaders: Headers, pin: string) {
  const user = await getSessionUser(request, responseHeaders);
  if (!user) throw new Error("Unauthorized");

  console.log(`[ADMIN_AUTH] Verifying PIN for user: ${user.email}`);
  
  // Use Admin Client for reading hashed PIN to bypass potential RLS/Column restrictions
  const adminClient = createSupabaseAdminClient();
  const { data: profile, error: fetchError } = await (adminClient.from("profiles") as any)
    .select("admin_pin_hash")
    .eq("id", user.id)
    .maybeSingle();

  if (fetchError) {
    console.error(`[ADMIN_AUTH] Error fetching profile for ${user.email}: ${fetchError.message}`);
    throw new Error(`Technical failure during verification: ${fetchError.message}`);
  }

  if (!profile?.admin_pin_hash) {
    console.warn(`[ADMIN_AUTH] No PIN hash found for user: ${user.email}. Prompting for setup.`);
    // ALL admins (not just founder) must set their own PIN on first login
    return { needsSetup: true };
  }

  const inputHash = await hashPin(pin);
  if (inputHash !== profile.admin_pin_hash) {
    console.error(`[ADMIN_AUTH] Invalid PIN attempt for user: ${user.email}`);
    throw new Error("Invalid PIN.");
  }

  console.log(`[ADMIN_AUTH] PIN verified. Starting session for: ${user.email}`);
  
  // Set HttpOnly cookie for the session. Broaden Path and add Secure for cross-site reliability.
  responseHeaders.append("Set-Cookie", "tdc_admin_verified=true; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600; Secure");
  return { success: true, needsSetup: false };
}

/** Check if current admin needs PIN setup (Founder with no PIN) */
export async function checkAdminSetupStatus(request: Request, responseHeaders: Headers) {
  const { user } = await requireAdmin(request, responseHeaders);
  
  // Use Admin Client for setup check to ensure reliability
  const adminClient = createSupabaseAdminClient();
  const { data: profile } = await (adminClient.from("profiles") as any)
    .select("admin_pin_hash")
    .eq("id", user.id)
    .maybeSingle();

  return {
    isFounder: verifySuperAdmin(user.email),
    hasPin: !!profile?.admin_pin_hash
  };
}

/** Queue an action for approval if the user is not the founder */
export async function handleAdminAction<T>(
  request: Request,
  responseHeaders: Headers,
  category: AdminSection,
  actionType: string,
  payload: any,
  executeImmediately: () => Promise<T>
) {
  const { user, profile } = await requireAdmin(request, responseHeaders);

  // Super Admin and Sr. Admin execute immediately — no queue
  if (canPublishDirectly(profile)) {
    return await executeImmediately();
  }

  // Jr. Admin → insert into approval queue
  const supabase = createSupabaseServerClient(request, responseHeaders);
  const { error } = await (supabase.from("admin_approval_queue") as any).insert({
    requested_by: user.id,
    category,
    action_type: actionType,
    payload,
    status: "PENDING"
  });

  if (error) throw new Error("Failed to queue action for approval.");
  return { queued: true };
}

/** Get all pending approval requests */
export async function getPendingApprovals(request: Request, responseHeaders: Headers) {
  const supabase = createSupabaseServerClient(request, responseHeaders);
  const { data, error } = await (supabase.from("admin_approval_queue") as any)
    .select("*, requested_by_profile:profiles!requested_by(*)")
    .eq("status", "PENDING")
    .order("created_at", { ascending: false });

  if (error) throw new Error("Failed to fetch approvals.");
  return data as (ApprovalRequest & { requested_by_profile: AdminProfile })[];
}

/** Process an approval request (Sr. Admin or Founder only) */
export async function processApprovalRequest(
  request: Request, 
  responseHeaders: Headers, 
  requestId: string, 
  status: "APPROVED" | "REJECTED",
  rejectionReason?: string
) {
  const { user, profile } = await requireAdmin(request, responseHeaders);
  if (!canApprove(profile)) throw new Error("Unauthorized — only Sr. Admins and Super Admins can approve.");

  const supabase = createSupabaseServerClient(request, responseHeaders);
  const { data: requestData, error: fetchError } = await (supabase.from("admin_approval_queue") as any)
    .select("*")
    .eq("id", requestId)
    .single();

  if (fetchError || !requestData) throw new Error("Request not found.");

  if (status === "REJECTED") {
    await (supabase.from("admin_approval_queue") as any)
      .update({ status: "REJECTED", rejection_reason: rejectionReason, processed_at: new Date().toISOString(), processed_by: user.id })
      .eq("id", requestId);
    return { success: true };
  }

  // If approved, execute the actual logic (we'll need specific handlers for action types)
  // For now, we update the status; implementation of actual payload application is task-specific.
  await (supabase.from("admin_approval_queue") as any)
    .update({ status: "APPROVED", processed_at: new Date().toISOString(), processed_by: user.id })
    .eq("id", requestId);

  return { success: true, payload: requestData.payload, type: requestData.action_type };
}

/** Set/Reset an Admin's PIN */
export async function setAdminPin(request: Request, responseHeaders: Headers, userId: string, pin: string) {
  console.log(`[ADMIN_AUTH] Setting PIN for user ID: ${userId}`);
  
  // Use Admin Client to bypass RLS for sensitive fields
  const adminClient = createSupabaseAdminClient();
  const hashedPin = await hashPin(pin);
  
  const { error } = await (adminClient.from("profiles") as any)
    .upsert({ 
      id: userId,
      admin_pin_hash: hashedPin,
      admin_pin_reset_token: null,
      admin_pin_reset_expires: null,
      // If we're upserting for the first time, ensure email is there if available
      email: (await getSessionUser(request, responseHeaders))?.email
    }, { onConflict: 'id' });

  if (error) {
    console.error(`[ADMIN_AUTH] Failed to update PIN in DB: ${error.message}`);
    throw new Error(`Failed to update PIN: ${error.message}`);
  }

  console.log(`[ADMIN_AUTH] PIN successfully updated for user: ${userId}`);
  return { success: true };
}

/** Request a PIN reset via Gmail */
export async function requestPinReset(request: Request, responseHeaders: Headers, email: string) {
  const supabase = createSupabaseServerClient(request, responseHeaders);
  const { data: profile } = await (supabase.from("profiles") as any).select("id, display_name").eq("email", email).eq("is_admin", true).single();

  if (!profile) return { success: true }; // Silent fail for security

  const crypto = await import("node:crypto");
  const resetToken = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

  await (supabase.from("profiles") as any)
    .update({ admin_pin_reset_token: resetToken, admin_pin_reset_expires: expires })
    .eq("id", profile.id);

  // Send Email via Gmail (Requires App Password in .env)
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASS,
    },
  });

  const resetUrl = `${new URL(request.url).origin}/admin/reset-pin?token=${resetToken}&email=${encodeURIComponent(email)}`;

  await transporter.sendMail({
    from: `"TDC Security" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Reset your TDC Admin PIN",
    text: `Hello ${profile.display_name},\n\nYou requested a PIN reset for the TDC Admin Panel. Click the link below to set your new 6-digit PIN:\n\n${resetUrl}\n\nThis link expires in 15 minutes.`,
    html: `<p>Hello ${profile.display_name},</p><p>You requested a PIN reset for the TDC Admin Panel. Click the link below to set your new 6-digit PIN:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 15 minutes.</p>`,
  });

  return { success: true };
}

/** Write an audit log entry */
export async function writeAuditLog(
  request: Request,
  responseHeaders: Headers,
  adminId: string,
  adminEmail: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  const supabase = createSupabaseServerClient(request, responseHeaders);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("admin_audit_log") as any).insert({
    admin_id: adminId,
    admin_email: adminEmail,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    details: details ?? null,
  });
}

/** Dashboard stats */
export async function getDashboardStats(request: Request, responseHeaders: Headers) {
  const supabase = createSupabaseServerClient(request, responseHeaders);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const [membersRes, appsRes, pendingAppsRes] = await Promise.all([
    sb.from("profiles").select("id, xp, created_at, is_banned", { count: "exact" }),
    sb.from("applications").select("id, status, submitted_at, project_id", { count: "exact" }),
    sb.from("applications").select("id", { count: "exact" }).eq("status", "PENDING"),
  ]);

  const members: AdminProfile[] = membersRes.data ?? [];
  const applications: AdminApplication[] = appsRes.data ?? [];
  const totalMembers = membersRes.count ?? 0;
  const totalApplications = appsRes.count ?? 0;
  const pendingApplications = pendingAppsRes.count ?? 0;
  const acceptedApplications = applications.filter((a) => a.status === "ACCEPTED").length;

  // Recent activity (last 10 applications)
  const recentRes = await sb
    .from("applications")
    .select("*, profiles(display_name, email, xp, role)")
    .order("submitted_at", { ascending: false })
    .limit(10);

  return {
    totalMembers,
    totalApplications,
    pendingApplications,
    acceptedApplications,
    recentActivity: recentRes.data ?? [],
    members,
  };
}

/** Get all applications with profile info */
export async function getAllApplications(
  request: Request,
  responseHeaders: Headers,
  filters: { status?: string; projectId?: string } = {}
) {
  // Use the admin (service-role) client to bypass RLS.
  // The session client's is_admin() RLS check can silently return empty rows
  // if the JWT doesn't resolve correctly server-side.
  const adminClient = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (adminClient as any)
    .from("applications")
    .select("*, profiles(display_name, email, xp, role, github_handle, portfolio_url, linkedin_handle, tech_stacks)")
    .order("submitted_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.projectId) query = query.eq("project_id", filters.projectId);

  const { data, error } = await query;
  if (error) console.error("[ADMIN] getAllApplications error:", error.message);
  return data ?? [];
}

/** Get all members augmented with Auth metadata (Last Sign In) */
export async function getAllMembers(
  request: Request,
  responseHeaders: Headers,
  search?: string
) {
  const supabase = createSupabaseServerClient(request, responseHeaders);
  const adminClient = createSupabaseAdminClient();

  // 1. Fetch profiles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: profiles, error: profileError } = await query;
  if (profileError) throw new Error("Failed to fetch profiles.");

  // 2. Fetch Auth metadata for these users to get last_sign_in_at
  // For a large number of users, we'd ideally use a view or a dedicated RPC, 
  // but for the current scale, admin.listUsers is acceptable.
  const { data: { users }, error: authError } = await adminClient.auth.admin.listUsers();
  if (authError) {
    console.warn("[ADMIN] Could not fetch auth metadata:", authError.message);
    return (profiles ?? []) as AdminProfile[];
  }

  // Create a map for fast lookup
  const authMap = new Map(users.map(u => [u.id, u.last_sign_in_at]));

  // 3. Merge data
  const augmentedMembers = (profiles ?? []).map((p: any) => ({
    ...p,
    last_sign_in_at: authMap.get(p.id) || null
  }));

  return augmentedMembers as (AdminProfile & { last_sign_in_at: string | null })[];
}

/** Update application status */
export async function updateApplicationStatus(
  request: Request,
  responseHeaders: Headers,
  applicationId: string,
  status: string,
  internalNotes?: string
) {
  // Use admin client to bypass RLS for the UPDATE operation.
  const adminClient = createSupabaseAdminClient();
  const user = await getSessionUser(request, responseHeaders);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient.from("applications") as any)
    .update({
      status,
      internal_notes: internalNotes,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (error) console.error("[ADMIN] updateApplicationStatus error:", error.message);
  return { error: error ? "Failed to update application." : undefined };
}

/** Adjust member XP */
export async function adjustMemberXP(
  request: Request,
  responseHeaders: Headers,
  userId: string,
  delta: number,
  reason: string,
  adminId: string
) {
  const supabase = createSupabaseServerClient(request, responseHeaders);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  // Get current XP
  const { data: profile } = await sb.from("profiles").select("xp").eq("id", userId).single();
  const currentXP = profile?.xp ?? 0;
  const newXP = Math.max(0, currentXP + delta);

  const [updateRes, logRes] = await Promise.all([
    sb.from("profiles").update({ xp: newXP, xp_adjustment_reason: reason }).eq("id", userId),
    sb.from("xp_log").insert({ user_id: userId, delta, reason, granted_by: adminId }),
  ]);

  return { error: updateRes.error || logRes.error ? "Failed to adjust XP." : undefined };
}

/** Toggle ban status */
export async function toggleBanMember(
  request: Request,
  responseHeaders: Headers,
  userId: string,
  isBanned: boolean,
  reason?: string
) {
  const supabase = createSupabaseServerClient(request, responseHeaders);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("profiles") as any)
    .update({ is_banned: isBanned, ban_reason: reason ?? null })
    .eq("id", userId);

  return { error: error ? "Failed to update ban status." : undefined };
}

/** Toggle admin status, assign granular sections, and set role */
export async function toggleAdminStatus(
  request: Request,
  responseHeaders: Headers,
  userId: string,
  isAdmin: boolean,
  sections: AdminSection[] = [],
  role?: AdminRole
) {
  const adminClient = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePayload: Record<string, any> = {
    is_admin: isAdmin,
    // Sr. Admin always gets all allowed sections auto-set; Jr. Admin gets the provided list
    admin_sections: isAdmin
      ? (role === 'sr_admin' ? SR_ADMIN_AUTO_SECTIONS : sections)
      : [],
    admin_role: isAdmin ? (role ?? null) : null,
  };

  // When revoking, wipe the PIN hash so the user must set a new one if re-granted
  if (!isAdmin) {
    updatePayload.admin_pin_hash = null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient.from("profiles") as any)
    .update(updatePayload)
    .eq("id", userId);

  return { error: error ? "Failed to update admin status." : undefined };
}

/** Super Admin only: wipe another admin's PIN so they must re-initialize on next login */
export async function resetAdminPinForUser(
  request: Request,
  responseHeaders: Headers,
  targetUserId: string
) {
  const { user } = await requireAdmin(request, responseHeaders);
  if (!verifySuperAdmin(user.email)) throw new Error("Unauthorized — only Super Admin can reset other users' PINs.");

  const adminClient = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient.from("profiles") as any)
    .update({ admin_pin_hash: null })
    .eq("id", targetUserId);

  return { error: error ? "Failed to reset PIN." : undefined };
}

/** Get audit log */
export async function getAuditLog(request: Request, responseHeaders: Headers, limit = 50) {
  const supabase = createSupabaseServerClient(request, responseHeaders);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("admin_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as AuditLog[];
}

/** Get all global question sets */
export async function getQuestionSets(request: Request, responseHeaders: Headers) {
  const supabase = createSupabaseServerClient(request, responseHeaders);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("application_question_sets")
    .select("*")
    .order("created_at", { ascending: false });

  return (data ?? []) as QuestionSet[];
}

/** Create a new question set template */
export async function createQuestionSet(
  request: Request,
  responseHeaders: Headers,
  payload: { tier: string; role_title?: string; questions: any[] }
) {
  const supabase = createSupabaseServerClient(request, responseHeaders);
  const user = await getSessionUser(request, responseHeaders);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("application_question_sets") as any).insert({
    tier: payload.tier,
    role_title: payload.role_title ?? null,
    questions: payload.questions,
    created_by: user?.id,
  }).select().single();

  return { data: data as QuestionSet, error: error ? "Failed to create question set." : undefined };
}

/** Update a question set template */
export async function updateQuestionSet(
  request: Request,
  responseHeaders: Headers,
  id: string,
  payload: { tier: string; role_title?: string; questions: any[] }
) {
  const supabase = createSupabaseServerClient(request, responseHeaders);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("application_question_sets") as any)
    .update({
      tier: payload.tier,
      role_title: payload.role_title ?? null,
      questions: payload.questions,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  return { error: error ? "Failed to update question set." : undefined };
}

/** Delete a question set template */
export async function deleteQuestionSet(request: Request, responseHeaders: Headers, id: string) {
  const supabase = createSupabaseServerClient(request, responseHeaders);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("application_question_sets") as any).delete().eq("id", id);

  return { error: error ? "Failed to delete question set." : undefined };
}

/** 
 * HARD DELETE USER (Super Admin Only)
 * Cleans up all referencing tables and then deletes from Auth.
 */
export async function hardDeleteUser(request: Request, responseHeaders: Headers, targetUserId: string) {
  const { user } = await requireAdmin(request, responseHeaders);
  if (!verifySuperAdmin(user.email)) throw new Error("Unauthorized — only Super Admin can execute hard deletes.");

  const adminClient = createSupabaseAdminClient();
  console.log(`[ADMIN] Executing HARD DELETE for user: ${targetUserId}`);

  // Ordered deletion to handle FK constraints
  // 1. Logs and non-critical relations
  await adminClient.from("xp_log").delete().eq("user_id", targetUserId);
  await adminClient.from("admin_audit_log").delete().eq("admin_id", targetUserId);
  await adminClient.from("admin_approval_queue").delete().or(`requested_by.eq.${targetUserId},processed_by.eq.${targetUserId}`);
  
  // 2. Main content relations
  await adminClient.from("user_contributions").delete().eq("user_id", targetUserId);
  await adminClient.from("applications").delete().or(`user_id.eq.${targetUserId},reviewed_by.eq.${targetUserId}`);
  await adminClient.from("career_applications").delete().or(`user_id.eq.${targetUserId},reviewed_by.eq.${targetUserId}`);
  await adminClient.from("project_ideas").delete().eq("user_id", targetUserId);
  
  // 3. System objects created by user (set to NULL or delete depending on business logic)
  // For simplicity and "thoroughness", we'll set creator to NULL for shared assets
  await (adminClient.from("projects") as any).update({ created_by: null }).eq("created_by", targetUserId);
  await (adminClient.from("updates") as any).update({ created_by: null }).eq("created_by", targetUserId);
  await (adminClient.from("application_question_sets") as any).update({ created_by: null }).eq("created_by", targetUserId);

  // 4. Finally, the profile and auth account
  const { error: profileErr } = await adminClient.from("profiles").delete().eq("id", targetUserId);
  if (profileErr) throw new Error(`Profile deletion failed: ${profileErr.message}`);

  const { error: authErr } = await adminClient.auth.admin.deleteUser(targetUserId);
  if (authErr) throw new Error(`Auth account deletion failed: ${authErr.message}`);

  console.log(`[ADMIN] Hard delete complete for user: ${targetUserId}`);
  return { success: true };
}

/**
 * HARD DELETE Generic Entity (Super Admin Only)
 * Used for Updates, Contacts, Applications, etc.
 */
export async function hardDeleteEntity(
  request: Request, 
  responseHeaders: Headers, 
  table: string, 
  id: string
) {
  const { user } = await requireAdmin(request, responseHeaders);
  if (!verifySuperAdmin(user.email)) throw new Error("Unauthorized — only Super Admin can execute hard deletes.");

  const adminClient = createSupabaseAdminClient();
  const { error } = await adminClient.from(table).delete().eq("id", id);
  
  if (error) throw new Error(`Failed to delete from ${table}: ${error.message}`);
  return { success: true };
}
