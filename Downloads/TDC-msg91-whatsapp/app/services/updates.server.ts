import { createSupabaseServerClient } from "~/lib/supabase.server";
import type { Database } from "~/lib/database.types";

export async function createUpdate(
  request: Request,
  responseHeaders: Headers,
  data: Database["public"]["Tables"]["updates"]["Insert"]
) {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  const { error } = await (supabase as any).from("updates").insert(data);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function updateUpdateEntry(
  request: Request,
  responseHeaders: Headers,
  id: string,
  data: Database["public"]["Tables"]["updates"]["Update"]
) {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  // Always update updated_at
  data.updated_at = new Date().toISOString();
  
  const { error } = await (supabase as any).from("updates")
    .update(data)
    .eq("id", id);
    
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function getAllUpdates(request: Request, responseHeaders: Headers) {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  const { data: updates, error } = await (supabase as any)
    .from("updates")
    .select("*")
    .order("created_at", { ascending: false });
    
  if (error) throw new Error(error.message);
  if (!updates || updates.length === 0) return [];

  // Fetch unique profiles manually to avoid relationship issues
  const userIds = [...new Set(updates.map((u: any) => u.created_by).filter(Boolean))];
  if (userIds.length > 0) {
    const { data: profiles } = await (supabase as any)
      .from("profiles")
      .select("id, display_name, role")
      .in("id", userIds);
    
    if (profiles) {
      const profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p]));
      return updates.map((u: any) => ({
        ...u,
        profiles: profileMap[u.created_by] || null
      }));
    }
  }

  return updates;
}

export async function getPublishedUpdates(request: Request, responseHeaders: Headers) {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  const { data: updates, error } = await (supabase as any)
    .from("updates")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
    
  if (error) throw new Error(error.message);
  if (!updates || updates.length === 0) return [];

  // Fetch unique profiles manually to avoid relationship issues
  const userIds = [...new Set(updates.map((u: any) => u.created_by).filter(Boolean))];
  if (userIds.length > 0) {
    const { data: profiles } = await (supabase as any)
      .from("profiles")
      .select("id, display_name, role")
      .in("id", userIds);
    
    if (profiles) {
      const profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p]));
      return updates.map((u: any) => ({
        ...u,
        profiles: profileMap[u.created_by] || null
      }));
    }
  }

  return updates;
}

export async function deleteUpdate(request: Request, responseHeaders: Headers, id: string) {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  const { error } = await (supabase as any)
    .from("updates")
    .delete()
    .eq("id", id);
    
  if (error) throw new Error(error.message);
  return { success: true };
}
