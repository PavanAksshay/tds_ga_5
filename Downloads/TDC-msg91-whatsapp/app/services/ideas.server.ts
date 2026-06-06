import { createSupabaseServerClient } from "../lib/supabase.server";
import type { Database } from "../lib/database.types";

export type ProjectIdeaRow = Database["public"]["Tables"]["project_ideas"]["Row"];
export type ProjectIdeaInsert = Database["public"]["Tables"]["project_ideas"]["Insert"];

/**
 * Ideas service - Private project ideas submission & management.
 */

/** Submit a new project idea */
export async function submitProjectIdea(
  request: Request,
  responseHeaders: Headers,
  userId: string,
  payload: Omit<ProjectIdeaInsert, "user_id" | "status" | "created_at" | "updated_at">
) {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  const { data, error } = await (supabase.from("project_ideas" as any) as any).insert({
    ...payload,
    user_id: userId,
    status: "PENDING",
  }).select().single();

  if (error) throw new Error(error.message);
  return data;
}

/** Get current user's ideas (Private) */
export async function getUserProjectIdeas(
  request: Request,
  responseHeaders: Headers,
  userId: string
) {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  const { data, error } = await supabase
    .from("project_ideas")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as ProjectIdeaRow[];
}

/** Get all ideas for Admin review */
export async function getAllProjectIdeasAdmin(
  request: Request,
  responseHeaders: Headers
) {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  const { data, error } = await supabase
    .from("project_ideas")
    .select(`
      *,
      profiles:user_id (
        id,
        email,
        display_name,
        avatar_url,
        github_handle,
        linkedin_handle
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as (ProjectIdeaRow & { profiles: any })[];
}

/** Update idea status (Admin) */
export async function updateProjectIdeaStatus(
  request: Request,
  responseHeaders: Headers,
  ideaId: string,
  status: string,
  adminNotes?: string
) {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  const { data, error } = await (supabase
    .from("project_ideas" as any) as any)
    .update({ 
      status, 
      admin_notes: adminNotes,
      updated_at: new Date().toISOString()
    })
    .eq("id", ideaId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
