import { createSupabaseServerClient } from "~/lib/supabase.server";
import type { Database } from "~/lib/database.types";

export async function submitContact(
  request: Request,
  responseHeaders: Headers,
  data: Database["public"]["Tables"]["contacts"]["Insert"]
) {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  const { error } = await (supabase as any).from("contacts").insert(data);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function getAllContacts(request: Request, responseHeaders: Headers) {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  const { data, error } = await (supabase as any)
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function updateContactStatus(
  request: Request,
  responseHeaders: Headers,
  id: string,
  status: "NEW" | "IN_PROGRESS" | "RESOLVED",
  internal_notes?: string
) {
  const supabase = await createSupabaseServerClient(request, responseHeaders);
  const updateData: any = { status };
  if (internal_notes !== undefined) {
    updateData.internal_notes = internal_notes;
  }
  
  const { error } = await (supabase as any).from("contacts")
    .update(updateData)
    .eq("id", id);
    
  if (error) throw new Error(error.message);
  return { success: true };
}
