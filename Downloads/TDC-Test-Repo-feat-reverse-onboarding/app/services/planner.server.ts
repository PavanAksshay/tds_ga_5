/**
 * Planner service — internal Jira-like board (projects + milestones).
 * Standalone from public `projects`. All functions are server-only.
 * Tables are service-role only (see sql/3.0/add_planner_schema.sql), so we
 * use the admin client for every operation.
 */
import { createSupabaseAdminClient } from "../lib/supabase.server";

export type PlannerStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";
export type PlannerPriority = "LOW" | "MEDIUM" | "HIGH";

export interface PlannerMember {
  id: string;
  name: string;
}

export interface PlannerMilestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: PlannerStatus;
  priority: PlannerPriority;
  deadline: string | null;
  assignees: PlannerMember[];
  created_at: string;
  updated_at: string;
}

export interface PlannerProject {
  id: string;
  title: string;
  description: string | null;
  status: PlannerStatus;
  deadline: string | null;
  members: PlannerMember[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
  milestones: PlannerMilestone[];
}

export interface AssignableMember {
  id: string;
  name: string;
  email: string | null;
}

const VALID_STATUS: PlannerStatus[] = ["PENDING", "IN_PROGRESS", "COMPLETED"];
const VALID_PRIORITY: PlannerPriority[] = ["LOW", "MEDIUM", "HIGH"];

function normalizeStatus(value: unknown): PlannerStatus {
  return VALID_STATUS.includes(value as PlannerStatus) ? (value as PlannerStatus) : "PENDING";
}

function normalizePriority(value: unknown): PlannerPriority {
  return VALID_PRIORITY.includes(value as PlannerPriority) ? (value as PlannerPriority) : "MEDIUM";
}

function normalizeMembers(value: unknown): PlannerMember[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((m): m is PlannerMember => !!m && typeof m === "object" && "id" in m && "name" in m)
    .map((m) => ({ id: String(m.id), name: String(m.name) }));
}

/** Members the admin can assign — sourced from profiles. */
export async function getAssignableMembers(): Promise<AssignableMember[]> {
  const supabase = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("profiles")
    .select("id, display_name, email")
    .order("display_name", { ascending: true });

  return ((data as { id: string; display_name: string | null; email: string | null }[]) ?? []).map((p) => ({
    id: p.id,
    name: p.display_name || p.email || "Unknown",
    email: p.email,
  }));
}

/** All planner projects with their milestones nested. */
export async function getPlannerBoard(): Promise<PlannerProject[]> {
  const supabase = createSupabaseAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: projects } = await (supabase as any)
    .from("planner_projects")
    .select("*")
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: milestones } = await (supabase as any)
    .from("planner_milestones")
    .select("*")
    .order("created_at", { ascending: true });

  const milestoneRows = (milestones as any[]) ?? [];

  return ((projects as any[]) ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description ?? null,
    status: normalizeStatus(p.status),
    deadline: p.deadline ?? null,
    members: normalizeMembers(p.members),
    created_by: p.created_by ?? null,
    created_at: p.created_at,
    updated_at: p.updated_at,
    milestones: milestoneRows
      .filter((m) => m.project_id === p.id)
      .map((m) => ({
        id: m.id,
        project_id: m.project_id,
        title: m.title,
        description: m.description ?? null,
        status: normalizeStatus(m.status),
        priority: normalizePriority(m.priority),
        deadline: m.deadline ?? null,
        assignees: normalizeMembers(m.assignees),
        created_at: m.created_at,
        updated_at: m.updated_at,
      })),
  }));
}

// ---------- Projects ----------

export interface PlannerProjectInput {
  title: string;
  description?: string | null;
  status?: PlannerStatus;
  deadline?: string | null;
  members?: PlannerMember[];
}

export async function createPlannerProject(
  input: PlannerProjectInput,
  createdBy: string
): Promise<{ error?: string }> {
  const supabase = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("planner_projects").insert({
    title: input.title,
    description: input.description ?? null,
    status: normalizeStatus(input.status),
    deadline: input.deadline || null,
    members: normalizeMembers(input.members),
    created_by: createdBy,
  });
  if (error) return { error: error.message };
  return {};
}

export async function updatePlannerProject(
  id: string,
  input: Partial<PlannerProjectInput>
): Promise<{ error?: string }> {
  const supabase = createSupabaseAdminClient();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) update.title = input.title;
  if (input.description !== undefined) update.description = input.description ?? null;
  if (input.status !== undefined) update.status = normalizeStatus(input.status);
  if (input.deadline !== undefined) update.deadline = input.deadline || null;
  if (input.members !== undefined) update.members = normalizeMembers(input.members);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("planner_projects").update(update).eq("id", id);
  if (error) return { error: error.message };
  return {};
}

export async function deletePlannerProject(id: string): Promise<{ error?: string }> {
  const supabase = createSupabaseAdminClient();
  // Cascade deletes milestones via FK ON DELETE CASCADE.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("planner_projects").delete().eq("id", id);
  if (error) return { error: error.message };
  return {};
}

// ---------- Milestones ----------

export interface PlannerMilestoneInput {
  project_id: string;
  title: string;
  description?: string | null;
  status?: PlannerStatus;
  priority?: PlannerPriority;
  deadline?: string | null;
  assignees?: PlannerMember[];
}

export async function createPlannerMilestone(
  input: PlannerMilestoneInput
): Promise<{ error?: string }> {
  const supabase = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("planner_milestones").insert({
    project_id: input.project_id,
    title: input.title,
    description: input.description ?? null,
    status: normalizeStatus(input.status),
    priority: normalizePriority(input.priority),
    deadline: input.deadline || null,
    assignees: normalizeMembers(input.assignees),
  });
  if (error) return { error: error.message };
  return {};
}

export async function updatePlannerMilestone(
  id: string,
  input: Partial<Omit<PlannerMilestoneInput, "project_id">>
): Promise<{ error?: string }> {
  const supabase = createSupabaseAdminClient();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) update.title = input.title;
  if (input.description !== undefined) update.description = input.description ?? null;
  if (input.status !== undefined) update.status = normalizeStatus(input.status);
  if (input.priority !== undefined) update.priority = normalizePriority(input.priority);
  if (input.deadline !== undefined) update.deadline = input.deadline || null;
  if (input.assignees !== undefined) update.assignees = normalizeMembers(input.assignees);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("planner_milestones").update(update).eq("id", id);
  if (error) return { error: error.message };
  return {};
}

export async function deletePlannerMilestone(id: string): Promise<{ error?: string }> {
  const supabase = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("planner_milestones").delete().eq("id", id);
  if (error) return { error: error.message };
  return {};
}

/** Parse a JSON assignees/members string coming from a form field. */
export function parseMembersField(raw: FormDataEntryValue | null): PlannerMember[] {
  if (!raw || typeof raw !== "string") return [];
  try {
    return normalizeMembers(JSON.parse(raw));
  } catch {
    return [];
  }
}
