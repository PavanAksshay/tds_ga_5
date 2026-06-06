import { requireAdmin } from "../../services/admin.server";
import type { Route } from "./+types/teams";
import { AdminStubPage } from "./stub";

export async function loader({ request }: Route.LoaderArgs): Promise<Response> {
  const headers = new Headers();
  await requireAdmin(request, headers);
  return Response.json({}, { headers });
}

export default function AdminTeams() {
  return <AdminStubPage title="TEAM ASSIGNMENT" description="Build and manage teams for accepted applicants. Drag-and-drop role assignment, team leads, and roster views." />;
}
