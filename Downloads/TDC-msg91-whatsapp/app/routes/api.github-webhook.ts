import type { Route } from "./+types/api.github-webhook";
import { verifyGithubSignature, handlePushEvent } from "~/services/github-webhook.server";

/**
 * Action-only route to receive and process incoming GitHub webhooks.
 * Validates the request method, payload cryptographic signature, and executes logic.
 */
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256") || "";

  if (!verifyGithubSignature(rawBody, signature)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const event = request.headers.get("x-github-event");
  if (event === "push") {
    try {
      const payload = JSON.parse(rawBody);
      await handlePushEvent(payload);
    } catch (parseError) {
      console.error("[GITHUB_WEBHOOK] Failed to parse JSON payload:", parseError);
      return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
  }

  return Response.json({ ok: true }, { status: 200 });
}
