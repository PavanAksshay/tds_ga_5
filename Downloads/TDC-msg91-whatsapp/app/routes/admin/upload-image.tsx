/**
 * Admin image upload endpoint — multipart POST only.
 * Returns { url: string } on success.
 */
import { redirect } from "react-router";
import { requireAdmin } from "../../services/admin.server";
import { uploadProjectImage } from "../../services/image-upload.server";

export async function action({ request }: { request: Request }): Promise<Response> {
  const headers = new Headers();
  await requireAdmin(request, headers);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const projectId = String(formData.get("projectId") ?? "temp").trim() || "temp";
  const type = String(formData.get("type") ?? "image").trim() || "image";

  if (!file || !file.size) {
    return Response.json({ error: "No file provided." }, { status: 400, headers });
  }

  const result = await uploadProjectImage(request, headers, file, projectId, type);
  if (result.error) {
    return Response.json({ error: result.error }, { status: 500, headers });
  }
  return Response.json({ url: result.url }, { headers });
}

export async function loader() {
  return redirect("/admin");
}

export default function UploadImageRoute() {
  return null;
}
