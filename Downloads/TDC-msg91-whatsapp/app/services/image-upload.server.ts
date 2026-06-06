/**
 * Image upload service — Supabase Storage.
 * Server-only.
 */
import { createSupabaseServerClient } from "../lib/supabase.server";

const BUCKET = "project-images";

export async function uploadProjectImage(
  request: Request,
  responseHeaders: Headers,
  file: File,
  projectId: string,
  type: string
): Promise<{ url?: string; error?: string }> {
  const supabase = await createSupabaseServerClient(request, responseHeaders);

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const safeType = type.replace(/[^a-z0-9_-]/gi, "_");
  const path = `projects/${projectId}/${safeType}_${Date.now()}.${ext}`;

  const bytes = await file.arrayBuffer();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: uploadError } = await (supabase.storage as any)
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (uploadError) return { error: uploadError.message };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = (supabase.storage as any).from(BUCKET).getPublicUrl(path);

  return { url: data.publicUrl as string };
}
