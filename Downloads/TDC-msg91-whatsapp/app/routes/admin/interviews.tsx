import { requireAdmin } from "../../services/admin.server";
import type { Route } from "./+types/interviews";
import { AdminStubPage } from "./stub";

export async function loader({ request }: Route.LoaderArgs): Promise<Response> {
  const headers = new Headers();
  await requireAdmin(request, headers);
  return Response.json({}, { headers });
}

export default function AdminInterviews() {
  return <AdminStubPage title="INTERVIEWS" description="Schedule, track, and record interview results. Calendar view, question bank, and direct promotion from interview outcome." />;
}
