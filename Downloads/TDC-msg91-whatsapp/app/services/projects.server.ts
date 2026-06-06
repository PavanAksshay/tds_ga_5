/**
 * Projects service — DB-backed project CRUD.
 * All functions are server-only.
 */
import { createSupabaseServerClient, createSupabaseAdminClient } from "../lib/supabase.server";
import type { Json } from "../lib/database.types";
import type { ProjectPayload, TechStackItem, TimelineItem, ProjectRole, Contributor } from "../types/projects";

export type { ProjectPayload, TechStackItem, TimelineItem, ProjectRole, ProjectRole as DBProjectRole };
export type { FormField, FormFieldType, ProjectTier, ProjectStatus, Contributor } from "../types/projects";

export type DBProjectInsert = {
  id: string;
  tier: string;
  tier_level: string;
  status: string;
  title: string;
  tagline: string;
  description: string;
  tech_stack: Json;
  timeline: Json;
  roles: Json;
  team_size: number;
  open_slots: number;
  tags: string[];
  is_published: boolean;
  created_by: string;
  teaser_image?: string | null;
  gallery_images?: Json;
  contributors?: Json;
  live_url?: string | null;
  github_url?: string | null;
};

type DBProject = {
  id: string;
  tier: string;
  tier_level: string;
  status: string;
  title: string;
  tagline: string;
  description: string;
  tech_stack: Json;
  timeline: Json;
  roles: Json;
  team_size: number;
  open_slots: number;
  tags: string[];
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  teaser_image?: string | null;
  gallery_images?: Json;
  contributors?: Json;
  live_url?: string | null;
  github_url?: string | null;
};

/** Normalize a raw DB row into a typed ProjectPayload */
export function normalizeProject(row: DBProject): ProjectPayload {
  return {
    id: row.id,
    tier: row.tier as ProjectPayload["tier"],
    tier_level: row.tier_level,
    status: row.status as ProjectPayload["status"],
    title: row.title,
    tagline: row.tagline,
    description: row.description,
    tech_stack: (row.tech_stack as unknown as TechStackItem[]) ?? [],
    timeline: (row.timeline as unknown as TimelineItem[]) ?? [],
    roles: (row.roles as unknown as ProjectRole[]) ?? [],
    team_size: row.team_size,
    open_slots: row.open_slots,
    tags: row.tags ?? [],
    is_published: row.is_published,
    teaser_image: row.teaser_image ?? undefined,
    gallery_images: (row.gallery_images as unknown as string[]) ?? [],
    contributors: (row.contributors as unknown as Contributor[]) ?? [],
    live_url: row.live_url ?? undefined,
    github_url: row.github_url ?? undefined,
  };
}

/** Get all published projects (for public pages) */
export async function getPublishedProjects(
  request: Request,
  responseHeaders: Headers
): Promise<ProjectPayload[]> {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("projects")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  return ((data as DBProject[]) ?? []).map(normalizeProject);
}

/** Get a single project by id (published or not — used in detail page) */
export async function getProjectByIdFromDB(
  request: Request,
  responseHeaders: Headers,
  id: string
): Promise<ProjectPayload | null> {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();
  if (!data) return null;
  return normalizeProject(data as DBProject);
}

/** Get all projects for admin (published + unpublished) */
export async function getAllProjectsAdmin(
  request: Request,
  responseHeaders: Headers
): Promise<ProjectPayload[]> {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  return ((data as DBProject[]) ?? []).map(normalizeProject);
}

/** Create a new project */
export async function createProject(
  request: Request,
  responseHeaders: Headers,
  payload: ProjectPayload,
  createdBy: string
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("projects").insert({
    id: payload.id,
    tier: payload.tier,
    tier_level: payload.tier_level,
    status: payload.status,
    title: payload.title,
    tagline: payload.tagline,
    description: payload.description,
    tech_stack: payload.tech_stack as unknown as Json,
    timeline: payload.timeline as unknown as Json,
    roles: payload.roles as unknown as Json,
    team_size: payload.team_size,
    open_slots: payload.open_slots,
    tags: payload.tags,
    is_published: payload.is_published,
    created_by: createdBy,
    teaser_image: payload.teaser_image ?? null,
    gallery_images: (payload.gallery_images ?? []) as unknown as Json,
    contributors: (payload.contributors ?? []) as unknown as Json,
    live_url: payload.live_url ?? null,
    github_url: payload.github_url ?? null,
  });
  if (error) return { error: error.message };
  return {};
}

/** Update an existing project */
export async function updateProject(
  request: Request,
  responseHeaders: Headers,
  id: string,
  payload: Partial<ProjectPayload>
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  const updateData: Record<string, unknown> = {};
  if (payload.tier !== undefined) updateData.tier = payload.tier;
  if (payload.tier_level !== undefined) updateData.tier_level = payload.tier_level;
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.tagline !== undefined) updateData.tagline = payload.tagline;
  if (payload.description !== undefined) updateData.description = payload.description;
  if (payload.tech_stack !== undefined) updateData.tech_stack = payload.tech_stack;
  if (payload.timeline !== undefined) updateData.timeline = payload.timeline;
  if (payload.roles !== undefined) updateData.roles = payload.roles;
  if (payload.team_size !== undefined) updateData.team_size = payload.team_size;
  if (payload.open_slots !== undefined) updateData.open_slots = payload.open_slots;
  if (payload.tags !== undefined) updateData.tags = payload.tags;
  if (payload.is_published !== undefined) updateData.is_published = payload.is_published;
  // Media fields
  if (payload.teaser_image !== undefined) updateData.teaser_image = payload.teaser_image ?? null;
  if (payload.gallery_images !== undefined) updateData.gallery_images = payload.gallery_images;
  if (payload.contributors !== undefined) updateData.contributors = payload.contributors;
  if (payload.live_url !== undefined) updateData.live_url = payload.live_url ?? null;
  if (payload.github_url !== undefined) updateData.github_url = payload.github_url ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("projects").update(updateData).eq("id", id);
  if (error) return { error: error.message };
  return {};
}

/** Delete a project */
export async function deleteProject(
  request: Request,
  responseHeaders: Headers,
  id: string
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("projects").delete().eq("id", id);
  if (error) return { error: error.message };
  return {};
}

/** Get public platform statistics (for login/hero pages) */
export async function getPublicStats(request: Request, responseHeaders: Headers) {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const [activeRes, upcomingRes, membersRes, shippedRes] = await Promise.all([
    sb.from("projects").select("id", { count: "exact", head: true }).eq("status", "IN_PROGRESS"),
    sb.from("projects").select("id", { count: "exact", head: true }).in("status", ["OPEN", "RECRUITING"]),
    sb.from("profiles").select("id", { count: "exact", head: true }),
    sb.from("projects").select("id", { count: "exact", head: true }).eq("status", "CLOSED"),
  ]);

  return {
    activeProjects: activeRes.count ?? 0,
    upcomingProjects: upcomingRes.count ?? 0,
    totalMembers: membersRes.count ?? 0,
    shippedProjects: shippedRes.count ?? 0,
  };
}

/** Get projects where the user is a creator or an accepted contributor */
export async function getUserProjects(
  request: Request,
  responseHeaders: Headers,
  userId: string
): Promise<ProjectPayload[]> {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  
  // 1. Get projects created by user
  const { data: createdProjects } = await (supabase as any)
    .from("projects")
    .select("*")
    .eq("created_by", userId);

  // 2. Get projects where user was accepted
  const { data: acceptedApps } = await (supabase as any)
    .from("applications")
    .select("project_id")
    .eq("user_id", userId)
    .eq("status", "ACCEPTED");

  const acceptedIds = (acceptedApps as { project_id: string }[] ?? []).map(a => a.project_id);
  
  // Fetch those accepted projects if any
  let joinedProjects: DBProject[] = [];
  if (acceptedIds.length > 0) {
    const { data } = await (supabase as any)
      .from("projects")
      .select("*")
      .in("id", acceptedIds);
    joinedProjects = data ?? [];
  }

  // Combine and deduplicate
  const allRaw = [...(createdProjects as DBProject[] ?? []), ...joinedProjects];
  const uniqueMap = new Map();
  allRaw.forEach(p => uniqueMap.set(p.id, p));
  
  return Array.from(uniqueMap.values()).map(normalizeProject);
}

/** Get public projects for a user using the admin client (for public profile view) */
export async function getPublicUserProjects(
  userId: string
): Promise<ProjectPayload[]> {
  const supabase = createSupabaseAdminClient();
  
  // 1. Get published projects created by user
  const { data: createdProjects } = await (supabase as any)
    .from("projects")
    .select("*")
    .eq("created_by", userId)
    .eq("is_published", true);

  // 2. Get projects where user was accepted
  const { data: acceptedApps } = await (supabase as any)
    .from("applications")
    .select("project_id")
    .eq("user_id", userId)
    .eq("status", "ACCEPTED");

  const acceptedIds = (acceptedApps as { project_id: string }[] ?? []).map(a => a.project_id);
  
  // Fetch those accepted projects if any
  let joinedProjects: DBProject[] = [];
  if (acceptedIds.length > 0) {
    const { data } = await (supabase as any)
      .from("projects")
      .select("*")
      .in("id", acceptedIds)
      .eq("is_published", true);
    joinedProjects = data ?? [];
  }

  // Combine and deduplicate
  const allRaw = [...(createdProjects as DBProject[] ?? []), ...joinedProjects];
  const uniqueMap = new Map();
  allRaw.forEach(p => uniqueMap.set(p.id, p));
  
  return Array.from(uniqueMap.values()).map(normalizeProject);
}
