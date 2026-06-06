/**
 * Server action endpoint for submitting career applications.
 * Requires authentication — unauthenticated requests are rejected.
 */
import type { Route } from "./+types/career-apply-action";
import { redirect } from "react-router";
import { requireAuth, requireGithub } from "../services/auth.server";
import { submitCareerApplication } from "../services/career-applications.server";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Career Application — The Developer Community" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}


export async function action({ request }: Route.ActionArgs) {
  const headers = new Headers();

  // Auth gate
  const user = await requireAuth(request, headers);
  await requireGithub(user.id);

  const formData = await request.formData();

  const listingId = String(formData.get("listingId") ?? "").trim();
  const roleId = String(formData.get("roleId") ?? "").trim();
  const roleTitle = String(formData.get("roleTitle") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? user.email ?? "").trim();
  const linkedinHandle = String(formData.get("linkedinHandle") ?? "").trim() || undefined;
  const githubHandle = String(formData.get("githubHandle") ?? "").trim() || undefined;
  const resumeLink = String(formData.get("resumeLink") ?? "").trim() || undefined;
  const portfolioUrl = String(formData.get("portfolioUrl") ?? "").trim() || undefined;
  const answersRaw = String(formData.get("answers") ?? "{}");

  if (!listingId || !roleId || !displayName || !email) {
    return Response.json({ error: "Missing required fields." }, { status: 400, headers });
  }

  let answers: Record<string, string> = {};
  try {
    answers = JSON.parse(answersRaw);
  } catch {
    answers = {};
  }

  const result = await submitCareerApplication(request, headers, {
    userId: user.id,
    listingId,
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

// No GET handler — redirect to careers
export async function loader() {
  return redirect("/careers");
}

export default function CareerApplyAction() {
  return null;
}
