/**
 * Careers service — DB-backed career listings CRUD.
 * All functions are server-only.
 */
import { createSupabaseServerClient } from "../lib/supabase.server";
import type { Json } from "../lib/database.types";
import type { CareerListing, CareerRole, FormField } from "../types/careers";

export type { CareerListing, CareerRole, FormField };

type DBCareer = {
  id: string;
  department: string;
  status: string;
  title: string;
  tagline: string;
  description: string;
  roles: Json;
  tags: string[];
  location_type: string;
  commitment: string;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export function normalizeCareer(row: DBCareer): CareerListing {
  return {
    id: row.id,
    department: row.department as CareerListing["department"],
    status: row.status as CareerListing["status"],
    title: row.title,
    tagline: row.tagline,
    description: row.description,
    roles: (row.roles as unknown as CareerRole[]) ?? [],
    tags: row.tags ?? [],
    location_type: row.location_type as CareerListing["location_type"],
    commitment: row.commitment as CareerListing["commitment"],
    is_published: row.is_published,
  };
}

/** Get all published career listings (for public pages) */
export async function getPublishedCareers(
  request: Request,
  responseHeaders: Headers
): Promise<CareerListing[]> {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("career_listings")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  return ((data as DBCareer[]) ?? []).map(normalizeCareer);
}

/** Get a single listing by id */
export async function getCareerById(
  request: Request,
  responseHeaders: Headers,
  id: string
): Promise<CareerListing | null> {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("career_listings")
    .select("*")
    .eq("id", id)
    .single();
  if (!data) return null;
  return normalizeCareer(data as DBCareer);
}

/** Get all career listings for admin (published + unpublished) */
export async function getAllCareersAdmin(
  request: Request,
  responseHeaders: Headers
): Promise<CareerListing[]> {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("career_listings")
    .select("*")
    .order("created_at", { ascending: false });
  return ((data as DBCareer[]) ?? []).map(normalizeCareer);
}

/** Create a new career listing */
export async function createCareer(
  request: Request,
  responseHeaders: Headers,
  payload: CareerListing,
  createdBy: string
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("career_listings").insert({
    id: payload.id,
    department: payload.department,
    status: payload.status,
    title: payload.title,
    tagline: payload.tagline,
    description: payload.description,
    roles: payload.roles as unknown as Json,
    tags: payload.tags,
    location_type: payload.location_type,
    commitment: payload.commitment,
    is_published: payload.is_published,
    created_by: createdBy,
  });
  if (error) return { error: error.message };
  return {};
}

/** Update a career listing */
export async function updateCareer(
  request: Request,
  responseHeaders: Headers,
  id: string,
  payload: Partial<CareerListing>
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  const updateData: Record<string, unknown> = {};
  if (payload.department !== undefined) updateData.department = payload.department;
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.tagline !== undefined) updateData.tagline = payload.tagline;
  if (payload.description !== undefined) updateData.description = payload.description;
  if (payload.roles !== undefined) updateData.roles = payload.roles;
  if (payload.tags !== undefined) updateData.tags = payload.tags;
  if (payload.location_type !== undefined) updateData.location_type = payload.location_type;
  if (payload.commitment !== undefined) updateData.commitment = payload.commitment;
  if (payload.is_published !== undefined) updateData.is_published = payload.is_published;
  updateData.updated_at = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("career_listings")
    .update(updateData)
    .eq("id", id);
  if (error) return { error: error.message };
  return {};
}

/** Delete a career listing */
export async function deleteCareer(
  request: Request,
  responseHeaders: Headers,
  id: string
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("career_listings")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  return {};
}

/** Get applications submitted by a specific user */
export async function getUserCareerApplications(
  request: Request,
  responseHeaders: Headers,
  userId: string
) {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("career_applications")
    .select("*, career_listings(title, department)")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false });
  return data ?? [];
}
