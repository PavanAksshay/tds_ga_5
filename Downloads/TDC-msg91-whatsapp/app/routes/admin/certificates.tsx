import { requireAdmin } from "../../services/admin.server";
import type { Route } from "./+types/certificates";
import { AdminStubPage } from "./stub";

export async function loader({ request }: Route.LoaderArgs): Promise<Response> {
  const headers = new Headers();
  await requireAdmin(request, headers);
  return Response.json({}, { headers });
}

export default function AdminCertificates() {
  return <AdminStubPage title="CERTIFICATES" description="Issue, revoke, and track certificates for completed projects. Bulk issue, PDF generation, and direct email delivery." />;
}
