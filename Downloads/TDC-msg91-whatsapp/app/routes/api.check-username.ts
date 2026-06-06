import { checkUsernameAvailability } from "../services/profile.server";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const username = url.searchParams.get("username");

  if (!username || username.length < 3) {
    return Response.json({ available: false, error: "Username too short" });
  }

  const headers = new Headers();
  const result = await checkUsernameAvailability(request, headers, username);
  return Response.json(result, { headers });
}
