import { createSupabaseServerClient, createSupabaseAdminClient } from "~/lib/supabase.server";
import type { Database } from "~/lib/database.types";

export type Contribution = Database["public"]["Tables"]["user_contributions"]["Row"];

export async function getUserContributions(request: Request, headers: Headers, userId: string) {
  const supabase = await createSupabaseServerClient(request, headers);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("user_contributions") as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching contributions:", error);
    return [];
  }
  return data as Contribution[];
}

export async function getPublicUserContributions(userId: string) {
  const supabase = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("user_contributions") as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching public contributions:", error);
    return [];
  }
  return data as Contribution[];
}

export async function createContribution(
  request: Request,
  headers: Headers,
  payload: Database["public"]["Tables"]["user_contributions"]["Insert"]
) {
  const supabase = await createSupabaseServerClient(request, headers);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("user_contributions") as any)
    .insert(payload)
    .select()
    .single();

  return { data: data as Contribution, error };
}

export async function deleteContribution(request: Request, headers: Headers, id: string) {
  const supabase = await createSupabaseServerClient(request, headers);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("user_contributions") as any).delete().eq("id", id);
  return { error };
}
