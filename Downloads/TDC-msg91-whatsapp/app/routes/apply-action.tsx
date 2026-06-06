/**
 * Server action endpoint for submitting project applications.
 * Requires authentication — unauthenticated requests are rejected.
 */
import type { Route } from "./+types/apply-action";
import { redirect } from "react-router";
import { requireAuth, requireGithub } from "../services/auth.server";
import { submitApplication } from "../services/applications.server";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Apply — The Developer Community" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}


export async function action({ request }: Route.ActionArgs) {
  const headers = new Headers();

  // Auth gate — throws redirect to /login if not authenticated
  const user = await requireAuth(request, headers);
  await requireGithub(user.id);

  const formData = await request.formData();

  const projectId = String(formData.get("projectId") ?? "").trim();
  const roleId = String(formData.get("roleId") ?? "").trim();
  const roleTitle = String(formData.get("roleTitle") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? user.email ?? "").trim();
  const linkedinHandle = String(formData.get("linkedinHandle") ?? "").trim() || undefined;
  const githubHandle = String(formData.get("githubHandle") ?? "").trim() || undefined;
  const resumeLink = String(formData.get("resumeLink") ?? "").trim() || undefined;
  const portfolioUrl = String(formData.get("portfolioUrl") ?? "").trim() || undefined;
  const answersRaw = String(formData.get("answers") ?? "{}");

  if (!projectId || !roleId || !displayName || !email) {
    return Response.json({ error: "Missing required fields." }, { status: 400, headers });
  }

  let answers: Record<string, string> = {};
  try {
    answers = JSON.parse(answersRaw);
  } catch {
    answers = {};
  }

  const result = await submitApplication(request, headers, {
    userId: user.id,
    projectId,
    roleId,
    roleTitle,
    displayName,
    email,
    linkedinHandle,
    githubHandle,
    resumeLink,
    portfolioUrl,
    answers,
  });

  if (result.error) {
    return Response.json({ error: result.error }, { status: 500, headers });
  }

  return Response.json({ success: true }, { headers });
}

// No GET handler needed
export async function loader() {
  return redirect("/projects");
}

export default function ApplyAction() {
  return null;
}
