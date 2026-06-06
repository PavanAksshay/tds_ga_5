import { requireAdmin } from "../../services/admin.server";
import type { Route } from "./+types/showcase";
import { AdminStubPage } from "./stub";

export async function loader({ request }: Route.LoaderArgs): Promise<Response> {
  const headers = new Headers();
  await requireAdmin(request, headers);
  return Response.json({}, { headers });
}

export default function AdminShowcase() {
  return <AdminStubPage title="SHOWCASE" description="Publish completed projects to the public showcase. Add live URLs, screenshots, credits, and tech stack tags." />;
}
