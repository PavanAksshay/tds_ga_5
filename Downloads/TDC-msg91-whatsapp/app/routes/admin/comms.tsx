import { requireAdmin } from "../../services/admin.server";
import type { Route } from "./+types/comms";
import { AdminStubPage } from "./stub";

export async function loader({ request }: Route.LoaderArgs): Promise<Response> {
  const headers = new Headers();
  await requireAdmin(request, headers);
  return Response.json({}, { headers });
}

export default function AdminComms() {
  return <AdminStubPage title="NOTIFICATIONS & COMMS" description="Send platform-wide announcements, targeted emails, and manage notification templates. Preview before sending." />;
}
