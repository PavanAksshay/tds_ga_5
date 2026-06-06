import type { Route } from "./+types/logout";
import { redirect } from "react-router";
import { logoutUser } from "../services/auth.server";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Logout | The Developer Community" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const headers = new Headers();
  await logoutUser(request, headers);
  return redirect("/", { headers });
}

// GET fallback — redirects to home (should only be called via POST form)
export async function loader() {
  return redirect("/");
}

export default function Logout() {
  return null;
}
