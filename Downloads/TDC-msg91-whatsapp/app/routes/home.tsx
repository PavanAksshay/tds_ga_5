import type { Route } from "./+types/home";
import { redirect } from "react-router";

/**
 * Safety net: if Supabase misconfigures the OAuth redirect URL and dumps
 * the ?code= param on the home page (instead of /auth/callback), forward
 * it to the real callback handler so the PKCE exchange still succeeds.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    console.log("[AUTH_DEBUG] Stray ?code= detected on home page — forwarding to /auth/callback");
    const callbackUrl = new URL("/auth/callback", url.origin);
    callbackUrl.searchParams.set("code", code);
    // Preserve any other auth params Supabase may append
    const type = url.searchParams.get("type");
    if (type) callbackUrl.searchParams.set("type", type);
    throw redirect(callbackUrl.toString());
  }
  return null;
}
import { useState, useEffect, lazy, Suspense } from "react";
import { HeroStatement } from "../blocks/home/hero-statement";
const HeroParticleWaves = lazy(() =>
  import("../blocks/home/hero-particle-waves").then((m) => ({ default: m.HeroParticleWaves }))
);
import { TheHierarchyDisplay } from "../blocks/home/the-hierarchy-display";
import { PixelPullQuote } from "../blocks/home/pixel-pull-quote";
import { ProductionPulse } from "../blocks/home/production-pulse";
import { CommunityFlow } from "../blocks/home/community-flow";
import { DevIntro } from "../blocks/home/dev-intro";
import { AdvisoryBoard } from "../blocks/home/advisory-board";
import { TestimonialCard } from "../blocks/home/testimonial-card";
import { SecondaryCallToAction } from "../blocks/home/secondary-call-to-action";
import { RecruiterMarquee } from "../blocks/home/recruiter-marquee";
import { buildMeta, buildOrganizationSchema, buildWebSiteSchema, buildFAQSchema, buildWebPageSchema, buildBreadcrumbSchema, SITE_URL } from "~/lib/seo";
import styles from "./home.module.css";

export function meta(_: Route.MetaArgs) {
  return [
    ...buildMeta({
      title: "The Developer Community — Build. Ship. Claim Resume Credit.",
      description: "Build the experience recruiters actually look for. Join real teams, ship production apps, and claim verified credits for your resume. Plus, if what you build makes money, so do you.",
      path: "/",
      keywords: "developer resume credit, proof of work, hire developers, developer revenue sharing, build and earn, production engineering, resume credits, developer community india",
    }),
  ];
}

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationSchema(),
      buildWebSiteSchema(),
      buildWebPageSchema({
        name: "The Developer Community — Build. Ship. Claim Resume Credit.",
        description: "Join 500+ active developers. Build real projects, claim verified resume credits, and earn a share of success. Verified proof of work for recruiters.",
        path: "/",
      }),
      buildBreadcrumbSchema([{ name: "Home", path: "/" }]),
      buildFAQSchema([
        {
          question: "What is The Developer Community?",
          answer: "The Developer Community (TDC) is a professional engineering platform where developers join real teams, build production-level projects, and earn verified credits for their resume. If products reach revenue thresholds, contributors also earn a share of the success.",
        },
        {
          question: "How do developers get hired through The Developer Community?",
          answer: "Recruiters want proof of production work. TDC provides verified, audited credits for every contribution made in real engineering environments, giving contributors a portfolio that closes the gap to high-tier hiring.",
        },
        {
          question: "Is The Developer Community free to join?",
          answer: "Yes, The Developer Community is completely free to join. We operate as a free, open community where merit determines your rank — not a membership fee.",
        },
        {
          question: "How does the revenue sharing model work at TDC?",
          answer: "When a product you contribute to reaches a revenue threshold defined per project, active contributors receive a share of that revenue proportional to their contribution volume and impact. Terms and conditions apply.",
        },
        {
          question: "What types of projects are available on The Developer Community?",
          answer: "Projects range from Beginner to God Mode difficulty across web apps, mobile apps, APIs, and production SaaS products. All projects ship to real users.",
        },
        {
          question: "How are resume credits verified at The Developer Community?",
          answer: "Every contribution is cryptographically logged — commit hashes, PR descriptions, and deployment records are stored and linked to your profile, providing irrefutable, auditable proof of work for recruiters.",
        },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: "How to Join The Developer Community and Earn Resume Credits",
        description: "Follow these steps to join TDC, contribute to real projects, and claim verified resume credits.",
        step: [
          { "@type": "HowToStep", name: "Apply", text: "Submit your developer application to TDC. Tell us your stack, goals, and what you want to build." },
          { "@type": "HowToStep", name: "Get Screened", text: "Our team reviews your application and technical background within a few days." },
          { "@type": "HowToStep", name: "Join a Project", text: "Once approved, you are placed on a project team matching your skill level and interests." },
          { "@type": "HowToStep", name: "Build & Ship", text: "Contribute code, collaborate with your team, and ship production-grade features to real users." },
          { "@type": "HowToStep", name: "Claim Your Credit", text: "Receive a verified, cryptographically-signed resume credit. Share it with recruiters as proof of production work." },
          { "@type": "HowToStep", name: "Earn Revenue", text: "If the product you helped build reaches market revenue thresholds, you earn a proportional share of the profits." },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: [".speakable-answer", ".speakable-summary"],
        },
        url: SITE_URL,
      },
    ],
  };

  return (
    <div className={styles.root}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* GEO Direct Answer Block — parsed by AI Overviews, ChatGPT, Perplexity */}
      <div className="geo-answer speakable-answer" style={{ display: "none" }}>
        <strong>In short:</strong> The Developer Community (TDC) is a free, open engineering platform where developers build production-grade apps with real teams, earn verified resume credits recruiters can audit, and receive a share of revenue if their products reach market thresholds. Based in India, open worldwide.
      </div>

      {/* 1. Hero */}
      <div className={styles.hero}>
        {isClient && (
          <Suspense fallback={null}>
            <HeroParticleWaves />
          </Suspense>
        )}
        <div className={styles.heroContent}>
          <HeroStatement />
        </div>
      </div>

      {/* 2. Recruiter trust marquee */}
      <RecruiterMarquee />

      {/* 3. Pull quote — directly below hero */}
      <PixelPullQuote />

      {/* 3. How it works — community flow steps */}
      <CommunityFlow />

      {/* 4. Hierarchy tiers */}
      <TheHierarchyDisplay />

      {/* 5. Production Pulse — Proof of work vs Resumes */}
      <ProductionPulse />

      {/* 5. Advisory board marquee (alternating) */}
      <AdvisoryBoard />

      {/* 6. Testimonial (alternating) */}
      <TestimonialCard />

      {/* 7. CTA */}
      <SecondaryCallToAction />

      {/* 8. Dev intro statement */}
      <DevIntro />
    </div>
  );
}
