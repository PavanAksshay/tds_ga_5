/**
 * Applications service — create and read user project applications.
 * All functions are server-only.
 */
import { createSupabaseServerClient } from "../lib/supabase.server";
import type { Database } from "../lib/database.types";

export type Application = Database["public"]["Tables"]["applications"]["Row"];

export interface SubmitApplicationPayload {
  userId: string;
  projectId: string;
  roleId: string;
  roleTitle: string;
  displayName: string;
  email: string;
  linkedinHandle?: string;
  githubHandle?: string;
  resumeLink?: string;
  portfolioUrl?: string;
  answers: Record<string, string>;
}

export async function submitApplication(
  request: Request,
  responseHeaders: Headers,
  payload: SubmitApplicationPayload
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient(request, responseHeaders);

  const insertData = {
    user_id: payload.userId,
    project_id: payload.projectId,
    role_id: payload.roleId,
    role_title: payload.roleTitle,
    display_name: payload.displayName,
    email: payload.email,
    linkedin_handle: payload.linkedinHandle ?? null,
    github_handle: payload.githubHandle ?? null,
    resume_link: payload.resumeLink ?? null,
    portfolio_url: payload.portfolioUrl ?? null,
    answers: payload.answers as Record<string, string>,
  };

  // Cast to any to bypass Supabase generic inference issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("applications") as any).insert(insertData);

  if (error) return { error: "Failed to submit application. Please try again." };
  return {};
}

export async function getUserApplications(
  request: Request,
  responseHeaders: Headers,
  userId: string
): Promise<Application[]> {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("applications") as any)
    .select("*")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false });

  return (data as Application[]) ?? [];
}
