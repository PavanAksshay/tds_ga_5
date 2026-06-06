/**
 * Images Sitemap — /sitemap-images.xml
 * Lists all project gallery and teaser images for Google Images indexing.
 */
import type { Route } from "./+types/sitemap-images[.xml]";
import { createSupabaseServerClient } from "~/lib/supabase.server";

const SITE_URL = "https://www.thedevcommunity.in";

export async function loader({ request }: Route.LoaderArgs): Promise<Response> {
  const headers = new Headers();
  const supabase = await createSupabaseServerClient(request, headers);

  const { data: projects } = await (supabase as any)
    .from("projects")
    .select("id, title, teaser_image, gallery_images")
    .eq("is_published", true);

  const imageEntries: string[] = [];

  for (const project of projects ?? []) {
    const images: string[] = [];

    if (project.teaser_image) images.push(project.teaser_image);
    if (Array.isArray(project.gallery_images)) {
      images.push(...project.gallery_images.filter(Boolean));
    }

    if (images.length === 0) continue;

    const imageXml = images
      .map(
        (img: string) => `    <image:image>
      <image:loc>${img}</image:loc>
      <image:title>${project.title} — The Developer Community</image:title>
      <image:caption>Project by The Developer Community. Build real projects and earn verified resume credits.</image:caption>
    </image:image>`
      )
      .join("\n");

    imageEntries.push(`  <url>
    <loc>${SITE_URL}/projects/${project.id}</loc>
${imageXml}
  </url>`);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
>
${imageEntries.join("\n")}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
