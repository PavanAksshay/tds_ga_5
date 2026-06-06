import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/about";
import styles from "./about.module.css";
import { getPublicStats } from "~/services/projects.server";
import { buildMeta } from "~/lib/seo";
import { ArrowRight, Users, Workflow, Ship, Trophy } from "lucide-react";
const HeroParticleWaves = lazy(() =>
  import("~/blocks/home/hero-particle-waves").then((m) => ({ default: m.HeroParticleWaves }))
);

import vaishnaviImg from "/advisors/vaishnavi.jpeg";
import anusreeImg from "/advisors/anusree.jpeg";

export function meta() {
  return [
    ...buildMeta({
      title: "About — The Developer Community",
      description: "TDC is where freshers, students, and working developers come together to build real products. Not tutorials. Real apps. Live users. Proof that you can do it.",
      path: "/about",
    }),
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const headers = new Headers();
  const stats = await getPublicStats(request, headers);
  return { stats };
}

// ─── Scroll Reveal Hook ───────────────────────────────────────────────────────
function useScrollReveal() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.08 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function Reveal({
  children,
  as: Tag = "section",
  style,
  className = "",
}: {
  children: React.ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
  style?: React.CSSProperties;
  className?: string;
}) {
  const { ref, isVisible } = useScrollReveal();
  const revealClass = `${styles.reveal} ${isVisible ? styles.revealVisible : ""}`;

  return (
    // @ts-expect-error — dynamic tag
    <Tag ref={ref} className={`${styles.section} ${revealClass} ${className}`} style={style}>
      {children}
    </Tag>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    num: "01",
    title: "Join the Community",
    desc: "Apply as a fresher, student, or professional. No gatekeeping — we evaluate drive, not just experience.",
  },
  {
    num: "02",
    title: "Get Placed on a Project",
    desc: "Structured teams with assigned Project Leads. Real product infrastructure from day one.",
  },
  {
    num: "03",
    title: "Build and Ship",
    desc: "Collaborate, write production code, and launch to real users. Advisory board engineers guide the process.",
  },
  {
    num: "04",
    title: "Earn Proof of Work",
    desc: "Completion letter, name on the live app, and revenue sharing once performance thresholds are met.",
  },
];

const AUDIENCE = [
  {
    tag: "FRESHERS",
    title: "Just Starting Out?",
    desc: "You don't need years of experience — you need drive. Join a real product team and learn by doing on live codebases.",
  },
  {
    tag: "STUDENTS",
    title: "Still in College?",
    desc: "Stop building side projects alone. Ship real products to real users and walk into every interview with proof.",
  },
  {
    tag: "PROFESSIONALS",
    title: "Already Working?",
    desc: "Build beyond your 9-to-5. TDC gives you the team, scope, and a clear launch target that most side projects never reach.",
  },
];

const COMPARISON = [
  { feature: "Ownership", other: "You manage alone", tdc: "Real team — lead + contributors" },
  { feature: "Launch Rate", other: "Projects rarely finish", tdc: "100% ship rate" },
  { feature: "Proof", other: "Certificates", tdc: "Live app — your name & photo" },
  { feature: "Financials", other: "No upside", tdc: "Revenue sharing model" },
  { feature: "Experience", other: "Tutorial environments", tdc: "Production infra, real users" },
  { feature: "Mentorship", other: "Self-guided", tdc: "Advisory board from industry" },
];


const ADVISORS = [
  {
    name: "Vaishnavi R",
    role: "DevOps Engineer (SD2)",
    company: "DELL TECHNOLOGIES",
    photo: vaishnaviImg,
    objectPos: "top center",
    quote: "Practical experience with deployment pipelines is what separates a student from a professional engineer.",
  },
  {
    name: "Anusree",
    role: "Senior Software Engineer",
    company: "WARNER BROS. DISCOVERY",
    photo: anusreeImg,
    objectPos: "center 20%",
    quote: "The scale of projects at TDC forces you to think about software engineering in a complete, end-to-end way.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function AboutPage({ loaderData }: Route.ComponentProps) {
  const { stats } = loaderData;
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.scanlineLayer} aria-hidden="true" />

      {/* ── 1. HERO ─────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.particleLayer} aria-hidden="true">
          {isClient && (
            <Suspense fallback={null}>
              <HeroParticleWaves />
            </Suspense>
          )}
        </div>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <span className={styles.sysLabel}>// ABOUT US</span>
            <h1 className={styles.headline}>
              We Don&apos;t Just Teach You to Code.<br />
              We Make You Build, Ship, and Matter<span className={styles.blinkingCursor}>_</span>
            </h1>
            <p className={styles.subheadline}>
              We will force you to be the best developer you can be.
            </p>
            <p className={styles.taglineSmall}>
              Learn by doing. Research by building. Ship to real users. Prove it happened.
            </p>
            <div className={styles.actions}>
              <Link to="/register" className={styles.primaryBtn}>
                Join the Community <ArrowRight size={14} />
              </Link>
              <Link to="/projects" className={styles.secondaryBtn}>
                View Projects
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. WHAT IS TDC ──────────────────────────────────────────────── */}
      <Reveal>
        <div className={styles.container}>
          <div className={styles.statementGrid}>
            <div>
              <span className={styles.label}>// WHAT IS TDC</span>
              <h2 className={styles.statementTitle}>
                Built for developers who are tired of building for nobody.
              </h2>
            </div>
            <div className={styles.bodyText}>
              <p>
                Most developers spend years learning without ever shipping anything real. They follow tutorials, clone repos, and graduate with projects no one ever used. TDC exists to change that.
              </p>
              <p>
                TDC is a structured platform where developers at every level come together to build products from scratch, ship them to real users, and earn verified proof they did it.
              </p>
              <p>
                We don&apos;t simulate work. We do the work. Every project is a real product with a real codebase. And when it makes money, the people who built it share in that.
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── 3. HOW IT WORKS ─────────────────────────────────────────────── */}
      <Reveal style={{ backgroundColor: "var(--color-surface-container-lowest)" }}>
        <div className={styles.container}>
          <span className={styles.label}>// HOW IT WORKS</span>
          <h2 className={styles.statementTitle}>From zero to shipped.</h2>
          <div className={styles.stepsGrid}>
            {STEPS.map((step) => (
              <div key={step.num} className={styles.stepCard}>
                <div className={styles.stepNumber}>{step.num}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ── 4. WHO IS THIS FOR ──────────────────────────────────────────── */}
      <Reveal>
        <div className={styles.container}>
          <span className={styles.label}>// WHO IS THIS FOR</span>
          <h2 className={styles.statementTitle}>If you write code — or want to — this is for you.</h2>
          <div className={styles.audienceGrid}>
            {AUDIENCE.map((item) => (
              <div key={item.tag} className={styles.audienceCard}>
                <span className={`${styles.label} ${styles["audienceCard"] ? "" : ""}`} style={{ color: "var(--color-accent)", opacity: 0.5 }}>
                  {item.tag}
                </span>
                <h3 className={styles.stepTitle}>{item.title}</h3>
                <p className={styles.stepDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>


      {/* ── 6. ADVISORY BOARD ───────────────────────────────────────────── */}
      <Reveal>
        <div className={styles.container}>
          <span className={styles.label}>// ADVISORY BOARD</span>
          <h2 className={styles.statementTitle}>Engineers from top companies.</h2>
          <p className={styles.bodyText} style={{ maxWidth: "680px", marginBottom: "0" }}>
            Helping you build things that get you hired.
          </p>
          <div className={styles.advisorGrid}>
            {ADVISORS.map((advisor) => (
              <div key={advisor.name} className={styles.advisorCard}>
                <div className={styles.advisorPhoto}>
                  <img
                    src={advisor.photo}
                    alt={advisor.name}
                    loading="lazy"
                    style={{ objectPosition: advisor.objectPos }}
                  />
                </div>
                <div className={styles.advisorBody}>
                  <p className={styles.advisorQuote}>&ldquo;{advisor.quote}&rdquo;</p>
                  <div>
                    <div className={styles.advisorName}>{advisor.name}</div>
                    <div className={styles.advisorTitle}>{advisor.role}</div>
                    <div className={styles.advisorCompany}>{advisor.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ── 7. COMPARISON ───────────────────────────────────────────────── */}
      <Reveal style={{ backgroundColor: "var(--color-surface-container-lowest)" }}>
        <div className={styles.container}>
          <span className={styles.label}>// WHY TDC</span>
          <h2 className={styles.statementTitle}>
            Not a bootcamp. Not a hackathon. The real thing.
          </h2>
          <div className={styles.tableWrapper}>
            <table className={styles.comparisonTable}>
              <thead>
                <tr>
                  <th>FEATURE</th>
                  <th>OTHER PLATFORMS</th>
                  <th style={{ color: "var(--color-accent)" }}>THE DEVELOPER COMMUNITY</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.feature}>
                    <td style={{ color: "var(--color-on-surface)", fontWeight: 600 }}>{row.feature}</td>
                    <td>{row.other}</td>
                    <td className={styles.emphasis}>{row.tdc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>

      {/* ── 8. FINAL CTA ────────────────────────────────────────────────── */}
      <section className={styles.finalCta}>
        <div className={styles.container}>
          <h2 className={styles.finalHeadline}>
            Stop waiting for permission to build something real.
          </h2>
          <p className={styles.finalSub}>
            The best time to join TDC was when you first started learning to code. The second best time is right now.
          </p>
          <div className={styles.actions}>
            <Link to="/register" className={styles.ctaWhiteBtn}>
              Join the Community <ArrowRight size={14} />
            </Link>
            <Link to="/projects" className={styles.ctaBlackBtn}>
              View Open Projects
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
