import { requireAdmin } from "../../services/admin.server";
import type { Route } from "./+types/revenue";
import { AdminStubPage } from "./stub";

export async function loader({ request }: Route.LoaderArgs): Promise<Response> {
  const headers = new Headers();
  await requireAdmin(request, headers);
  return Response.json({}, { headers });
}

export default function AdminRevenue() {
  return <AdminStubPage title="REVENUE & BILLING" description="Log sponsored payments, certificate fees, and placement inquiries. Track monthly revenue and export as CSV or PDF." />;
}
