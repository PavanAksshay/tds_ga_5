/**
 * Dynamic XML Sitemap — server-rendered at /sitemap.xml
 * Includes all public, indexable routes + dynamic project/career IDs from DB.
 */
import type { Route } from "./+types/sitemap[.xml]";
import { createSupabaseServerClient } from "~/lib/supabase.server";

const SITE_URL = "https://www.thedevcommunity.in";

function toW3CDate(date?: string | Date | null): string {
  if (!date) return new Date().toISOString().split("T")[0];
  return new Date(date).toISOString().split("T")[0];
}

function url(
  loc: string,
  opts: { lastmod?: string | null; changefreq: string; priority: string }
) {
  return `  <url>
    <loc>${SITE_URL}${loc}</loc>
    <lastmod>${toW3CDate(opts.lastmod)}</lastmod>
    <changefreq>${opts.changefreq}</changefreq>
    <priority>${opts.priority}</priority>
  </url>`;
}

export async function loader({ request }: Route.LoaderArgs): Promise<Response> {
  const headers = new Headers();
  const supabase = await createSupabaseServerClient(request, headers);

  // Fetch dynamic routes from DB
  const [{ data: projects }, { data: careers }] = await Promise.all([
    (supabase as any)
      .from("projects")
      .select("id, updated_at")
      .eq("is_published", true),
    (supabase as any)
      .from("career_listings")
      .select("id, updated_at")
      .eq("is_published", true)
      .eq("status", "OPEN"),
  ]);

  const today = toW3CDate(new Date());

  const staticUrls = [
    url("/", { lastmod: today, changefreq: "daily", priority: "1.0" }),
    url("/projects", { lastmod: today, changefreq: "daily", priority: "0.9" }),
    url("/careers", { lastmod: today, changefreq: "weekly", priority: "0.8" }),
    url("/about", { lastmod: today, changefreq: "monthly", priority: "0.8" }),
    url("/contact", { lastmod: today, changefreq: "monthly", priority: "0.7" }),
    url("/updates", { lastmod: today, changefreq: "weekly", priority: "0.7" }),
    url("/terms", { lastmod: today, changefreq: "monthly", priority: "0.3" }),
    url("/privacy", { lastmod: today, changefreq: "monthly", priority: "0.3" }),
  ];

  const projectUrls = (projects ?? []).map((p: any) =>
    url(`/projects/${p.id}`, {
      lastmod: p.updated_at,
      changefreq: "weekly",
      priority: "0.7",
    })
  );

  const careerUrls = (careers ?? []).map((c: any) =>
    url(`/careers/${c.id}`, {
      lastmod: c.updated_at,
      changefreq: "weekly",
      priority: "0.6",
    })
  );

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
>
${[...staticUrls, ...projectUrls, ...careerUrls].join("\n")}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
