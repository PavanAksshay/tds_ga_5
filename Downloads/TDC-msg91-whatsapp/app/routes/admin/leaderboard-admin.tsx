import { requireAdmin } from "../../services/admin.server";
import type { Route } from "./+types/leaderboard-admin";
import { AdminStubPage } from "./stub";

export async function loader({ request }: Route.LoaderArgs): Promise<Response> {
  const headers = new Headers();
  await requireAdmin(request, headers);
  return Response.json({}, { headers });
}

export default function AdminLeaderboard() {
  return <AdminStubPage title="LEADERBOARD CONTROLS" description="Feature members, pin to top, reset monthly leaderboards, create sprint leaderboards, and award bonus XP to groups." />;
}
