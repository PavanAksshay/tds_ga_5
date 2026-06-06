import { requireAdmin } from "../../services/admin.server";
import type { Route } from "./+types/settings";
import { AdminStubPage } from "./stub";

export async function loader({ request }: Route.LoaderArgs): Promise<Response> {
  const headers = new Headers();
  await requireAdmin(request, headers);
  return Response.json({}, { headers });
}

export default function AdminSettings() {
  return <AdminStubPage title="SETTINGS" description="Platform settings, admin accounts, API keys, email templates, certificate design, and maintenance mode controls." />;
}
