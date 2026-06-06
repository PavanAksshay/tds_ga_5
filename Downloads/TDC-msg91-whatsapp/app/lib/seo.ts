/**
 * Central SEO Utility Library
 * Single source of truth for site metadata, schema, and canonical URLs.
 * Import from here — NEVER hardcode SITE_URL in route files.
 */

export const SITE_URL = (
  typeof process !== "undefined"
    ? (process.env.VITE_SITE_URL ?? "https://www.thedevcommunity.in")
    : "https://www.thedevcommunity.in"
).replace(/\/$/, "");

export const SITE_NAME = "The Developer Community";
export const SITE_TWITTER = "@thedevcommunity";
export const SITE_OG_IMAGE = `${SITE_URL}/og-image.png`;
export const SITE_LOGO = `${SITE_URL}/tdc-wide.svg`;

/** Standard robots tags */
export const ROBOTS_PUBLIC = "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";
export const ROBOTS_NOINDEX = "noindex, nofollow";

/**
 * Build a canonical URL from a path.
 */
export function canonical(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}

/**
 * Build the standard meta array for a public page.
 */
export function buildMeta({
  title,
  description,
  path,
  ogType = "website",
  ogImage = SITE_OG_IMAGE,
  noindex = false,
  keywords,
}: {
  title: string;
  description: string;
  path: string;
  ogType?: "website" | "article" | "profile";
  ogImage?: string;
  noindex?: boolean;
  keywords?: string;
}) {
  const pageTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const pageUrl = canonical(path);

  return [
    { title: pageTitle },
    { name: "description", content: description },
    ...(keywords ? [{ name: "keywords", content: keywords }] : []),
    { name: "robots", content: noindex ? ROBOTS_NOINDEX : ROBOTS_PUBLIC },
    { name: "theme-color", content: "#000000" },

    // Open Graph
    { property: "og:type", content: ogType },
    { property: "og:title", content: pageTitle },
    { property: "og:description", content: description },
    { property: "og:image", content: ogImage },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:url", content: pageUrl },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "en_IN" },

    // Twitter Card
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: SITE_TWITTER },
    { name: "twitter:title", content: pageTitle },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },

    // Canonical
    { tagName: "link", rel: "canonical", href: pageUrl },
  ];
}

/**
 * Build a BreadcrumbList JSON-LD schema.
 */
export function buildBreadcrumbSchema(
  items: Array<{ name: string; path: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: canonical(item.path),
    })),
  };
}

/**
 * Global Organization schema (inject on every public page).
 */
export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: SITE_LOGO,
      width: 200,
      height: 60,
    },
    description:
      "The Developer Community is a professional engineering hierarchy where developers build real production apps, earn verified resume credits, and share in project revenue.",
    foundingDate: "2024",
    areaServed: "Worldwide",
    sameAs: [
      "https://github.com/the-developer-community",
      "https://linkedin.com/company/the-developer-community",
      "https://twitter.com/thedevcommunity",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "community support",
      email: "hello@thedevcommunity.in",
    },
  };
}

/**
 * Global WebSite schema with SiteLinksSearchBox.
 */
export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: "Build real projects. Claim verified resume credits. Earn shared revenue.",
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en-IN",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/projects?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Build a FAQPage JSON-LD schema.
 */
export function buildFAQSchema(
  qa: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qa.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

/**
 * Build a WebPage JSON-LD schema.
 */
export function buildWebPageSchema({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonical(path)}#webpage`,
    url: canonical(path),
    name,
    description,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en-IN",
  };
}
