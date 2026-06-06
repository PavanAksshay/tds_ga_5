/**
 * Career Applications service — submit and read career applications.
 * All functions are server-only.
 */
import { createSupabaseServerClient } from "../lib/supabase.server";

export interface CareerApplicationPayload {
  userId: string;
  listingId: string;
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

export interface CareerApplication {
  id: string;
  user_id: string | null;
  listing_id: string;
  role_id: string;
  role_title: string;
  display_name: string;
  email: string;
  linkedin_handle: string | null;
  github_handle: string | null;
  resume_link: string | null;
  portfolio_url: string | null;
  answers: Record<string, string> | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "UNDER_REVIEW";
  internal_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  updated_at: string;
}

export async function submitCareerApplication(
  request: Request,
  responseHeaders: Headers,
  payload: CareerApplicationPayload
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  const insertData = {
    user_id: payload.userId,
    listing_id: payload.listingId,
    role_id: payload.roleId,
    role_title: payload.roleTitle,
    display_name: payload.displayName,
    email: payload.email,
    // Store the full link as provided by the user
    linkedin_handle: payload.linkedinHandle ?? null,
    github_handle: payload.githubHandle ?? null,
    resume_link: payload.resumeLink ?? null,
    portfolio_url: payload.portfolioUrl ?? null,
    answers: payload.answers,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("career_applications") as any).insert(insertData);
  if (error) return { error: "Failed to submit application. Please try again." };
  return {};
}


export async function getAllCareerApplications(
  request: Request,
  responseHeaders: Headers
): Promise<(CareerApplication & { department: string })[]> {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("career_applications") as any)
    .select("*, career_listings(department)")
    .order("submitted_at", { ascending: false });
  
  if (!data) return [];
  
  return (data as any).map((app: any) => ({
    ...app,
    department: app.career_listings?.department || "GENERAL"
  }));
}

/** Get a single career application by ID with listing info */
export async function getCareerApplicationById(
  request: Request,
  responseHeaders: Headers,
  id: string
): Promise<(CareerApplication & { department: string }) | null> {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("career_applications") as any)
    .select("*, career_listings(department)")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return {
    ...data,
    department: data.career_listings?.department || "GENERAL"
  };
}

export async function getUserCareerApplications(
  request: Request,
  responseHeaders: Headers,
  userId: string
): Promise<CareerApplication[]> {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("career_applications") as any)
    .select("*")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false });
  return (data as CareerApplication[]) ?? [];
}

export async function updateCareerApplicationStatus(
  request: Request,
  responseHeaders: Headers,
  id: string,
  status: CareerApplication["status"],
  internalNotes?: string
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (internalNotes !== undefined) updateData.internal_notes = internalNotes;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("career_applications") as any)
    .update(updateData)
    .eq("id", id);
  if (error) return { error: error.message };
  return {};
}
