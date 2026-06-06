import { requireAdmin } from "../../services/admin.server";
import type { Route } from "./+types/progress";
import { AdminStubPage } from "./stub";

export async function loader({ request }: Route.LoaderArgs): Promise<Response> {
  const headers = new Headers();
  await requireAdmin(request, headers);
  return Response.json({}, { headers });
}

export default function AdminProgress() {
  return <AdminStubPage title="PROJECT PROGRESS" description="Track milestones, team activity, and go-live targets for every ongoing project. Flag blocked projects and leave internal notes." />;
}
