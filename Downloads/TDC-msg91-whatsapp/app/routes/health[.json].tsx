/**
 * Health Check Endpoint — /health.json
 * Used by crawl monitoring, uptime services, and deploy pipelines.
 */
export async function loader(): Promise<Response> {
  return new Response(
    JSON.stringify({
      status: "ok",
      site: "The Developer Community",
      domain: "https://www.thedevcommunity.in",
      sitemaps: [
        "https://www.thedevcommunity.in/sitemap.xml",
        "https://www.thedevcommunity.in/sitemap-images.xml",
      ],
      robots: "https://www.thedevcommunity.in/robots.txt",
      schema: [
        "WebSite",
        "Organization",
        "WebPage",
        "FAQPage",
        "BreadcrumbList",
        "JobPosting",
        "CollectionPage",
        "HowTo",
        "Speakable",
      ],
      timestamp: new Date().toISOString(),
    }),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    }
  );
}
