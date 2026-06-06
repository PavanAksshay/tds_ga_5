import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useLoaderData } from "react-router";
import type { Route } from "./+types/projects";
import type { ShouldRevalidateFunctionArgs } from "react-router";
import { getPublishedProjects, type ProjectPayload } from "../services/projects.server";
import { GitBranch, ExternalLink, Users, Lock } from "lucide-react";
import { useAutoScroll } from "../hooks/use-auto-scroll";
import styles from "./projects.module.css";

import { buildMeta, buildBreadcrumbSchema, buildWebPageSchema, SITE_URL } from "~/lib/seo";

const PER_PAGE = 9;

export function meta(_: Route.MetaArgs) {
  return [
    ...buildMeta({
      title: "Browse Open Projects — Build Real Apps & Earn Resume Credits",
      description: "Browse production projects at The Developer Community. From beginner builds to sponsored apps — apply for a role, ship real software, and claim verified resume credits.",
      path: "/projects",
      keywords: "developer projects india, open source internship, production app development, resume credits, developer portfolio projects",
    }),
  ];
}


type PrimaryTab = "UPCOMING" | "ONGOING" | "SHIPPED";
type TierFilter = ProjectPayload["tier"] | "ALL";

const TIER_FILTERS: { key: TierFilter; label: string }[] = [
  { key: "ALL", label: "ALL TIERS" },
  { key: "BEGINNER", label: "BEGINNER" },
  { key: "INTERMEDIATE", label: "INTERMEDIATE" },
  { key: "FINAL_BOSS", label: "FINAL BOSS" },
  { key: "GOD_MODE", label: "GOD MODE" },
  { key: "SPONSORED", label: "SPONSORED" },
];

const TIER_COLOR: Record<string, string> = {
  BEGINNER: "#22c55e",
  INTERMEDIATE: "#3b82f6",
  FINAL_BOSS: "#f59e0b",
  GOD_MODE: "#ef4444",
  SPONSORED: "#a855f7",
};

function getTabFilter(tab: PrimaryTab) {
  if (tab === "UPCOMING") return (p: ProjectPayload) => p.status === "OPEN" || p.status === "RECRUITING";
  if (tab === "ONGOING") return (p: ProjectPayload) => p.status === "IN_PROGRESS";
  return (p: ProjectPayload) => p.status === "SHIPPED";
}

// ─── Image placeholder gradient ───────────────────────────────────────────────
function TeaserPlaceholder({ tier, title, isUpcoming }: { tier: string; title: string; isUpcoming: boolean }) {
  const color = TIER_COLOR[tier] ?? "#f0f0ee";

  if (isUpcoming) {
    return (
      <div className={styles.stealthPlaceholder} style={{ borderTop: `2px solid ${color}` }}>
        <div className={styles.stealthScanline} aria-hidden="true" />
        <div className={styles.stealthInner}>
          <div className={styles.stealthLock} aria-hidden="true">
            <Lock size={22} strokeWidth={1.5} />
          </div>
          <p className={styles.stealthLabel}>PROJECT DETAILS RESTRICTED</p>
          <p className={styles.stealthSub}>Disclosed only to selected interns &amp; team members. Full details released officially when the project kicks off.</p>
        </div>
        <div className={styles.stealthTicker} aria-hidden="true">
          <span>CONFIDENTIAL &nbsp;·&nbsp; FOR SELECTED MEMBERS ONLY &nbsp;·&nbsp; STAND BY FOR LAUNCH &nbsp;·&nbsp; CONFIDENTIAL &nbsp;·&nbsp; FOR SELECTED MEMBERS ONLY &nbsp;·&nbsp; STAND BY FOR LAUNCH &nbsp;·&nbsp;</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.teaserPlaceholder} style={{ borderTop: `2px solid ${color}` }}>
      <span className={styles.teaserPlaceholderTier} style={{ color }}>{tier}</span>
      <span className={styles.teaserPlaceholderTitle}>{title.slice(0, 2)}</span>
    </div>
  );
}

// ─── Project card ─────────────────────────────────────────────────────────────
function ProjectCard({ project, tab }: { project: ProjectPayload; tab: PrimaryTab }) {
  const navigate = useNavigate();
  const tierColor = TIER_COLOR[project.tier] ?? "#f0f0ee";
  const heroImage = tab === "SHIPPED"
    ? (project.gallery_images?.[0] ?? project.teaser_image)
    : project.teaser_image;

  return (
    <button
      className={styles.card}
      type="button"
      onClick={() => navigate(`/projects/${project.id}`)}
      style={{ "--tier-color": tierColor } as React.CSSProperties}
    >
      {/* Image / teaser */}
      <div className={styles.cardImage}>
        {heroImage ? (
          <img 
            src={heroImage} 
            alt={`Teaser image for ${project.title}`} 
            className={styles.cardImageImg} 
            loading="lazy"
            width={400} 
            height={225} 
          />
        ) : (
          <TeaserPlaceholder tier={project.tier} title={project.title} isUpcoming={tab === "UPCOMING"} />
        )}
        {tab === "SHIPPED" && (
          <div className={styles.cardImageOverlay}>
            {project.live_url && (
              <span className={styles.cardOverlayBadge}>
                <ExternalLink size={10} /> LIVE
              </span>
            )}
            {project.github_url && (
              <span className={styles.cardOverlayBadge}>
                <GitBranch size={10} /> GITHUB
              </span>
            )}
          </div>
        )}
        {tab !== "SHIPPED" && project.status === "RECRUITING" && (
          <span className={styles.cardImageRecruiting}>RECRUITING</span>
        )}
      </div>

      {/* Card head */}
      <div className={styles.cardHead}>
        <span className={styles.cardId}>{project.id}</span>
        <span className={styles.cardTier} style={{ color: tierColor, borderColor: tierColor }}>
          {project.tier_level}
        </span>
      </div>

      {/* Card body */}
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{project.title}</h3>
        <p className={styles.cardTagline}>{project.tagline}</p>

        {tab === "SHIPPED" ? (
          <div className={styles.cardMeta}>
            {project.contributors && project.contributors.length > 0 && (
              <span className={styles.cardMetaItem}>
                <Users size={10} /> {project.contributors.length} contributor{project.contributors.length !== 1 ? "s" : ""}
              </span>
            )}
            {project.gallery_images && project.gallery_images.length > 0 && (
              <span className={styles.cardMetaItem}>
                {project.gallery_images.length} image{project.gallery_images.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        ) : (
          <div className={styles.cardMeta}>
            <span className={styles.cardMetaItem}>
              <Users size={10} /> {project.open_slots} open slot{project.open_slots !== 1 ? "s" : ""}
            </span>
            <span className={styles.cardMetaItem}>
              {project.roles.filter((r) => !r.locked).length} role{project.roles.filter((r) => !r.locked).length !== 1 ? "s" : ""}
            </span>
            {project.roles.some((r) => r.locked) && (
              <span className={styles.cardMetaItem}>
                <Lock size={10} /> {project.roles.filter((r) => r.locked).length} locked
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tags */}
      <div className={styles.cardFooter}>
        {project.tags.slice(0, 4).map((tag) => (
          <span key={tag} className={styles.cardTag}>{tag}</span>
        ))}
      </div>
    </button>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  return (
    <div className={styles.pagination}>
      <button
        className={styles.pageBtn}
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
      >
        ← PREV
      </button>
      <div className={styles.pageDots}>
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            type="button"
            className={`${styles.pageDot} ${i === page ? styles.pageDotActive : ""}`}
            onClick={() => onChange(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <button
        className={styles.pageBtn}
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= total - 1}
      >
        NEXT →
      </button>
    </div>
  );
}

interface ProjectsLoaderData {
  projects: ProjectPayload[];
}

export async function loader({ request }: Route.LoaderArgs): Promise<Response> {
  const headers = new Headers();
  const projects = await getPublishedProjects(request, headers);
  return Response.json({ projects } satisfies ProjectsLoaderData, { headers });
}

export function shouldRevalidate({ currentUrl, nextUrl, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs) {
  // If we are already on a projects-related page and going to the main projects list, 
  // skip re-fetching since the list is already in the cache.
  if (currentUrl.pathname.startsWith('/projects') && nextUrl.pathname === '/projects') {
    return false;
  }
  return defaultShouldRevalidate;
}

export default function Projects() {
  const { projects } = useLoaderData() as ProjectsLoaderData;
  const [tab, setTab] = useState<PrimaryTab>("UPCOMING");
  const [tier, setTier] = useState<TierFilter>("ALL");
  const [page, setPage] = useState(0);

  const gridScrollRef = useAutoScroll();

  const upcomingCount = useMemo(() => projects.filter((p) => p.status === "OPEN" || p.status === "RECRUITING").length, [projects]);
  const ongoingCount = useMemo(() => projects.filter((p) => p.status === "IN_PROGRESS").length, [projects]);
  const shippedCount = useMemo(() => projects.filter((p) => p.status === "SHIPPED").length, [projects]);

  const tabFiltered = useMemo(() => projects.filter(getTabFilter(tab)), [projects, tab]);
  const tierFiltered = useMemo(() => tier === "ALL" ? tabFiltered : tabFiltered.filter((p) => p.tier === tier), [tabFiltered, tier]);
  const totalPages = Math.ceil(tierFiltered.length / PER_PAGE);
  const paginated = useMemo(() => tierFiltered.slice(page * PER_PAGE, (page + 1) * PER_PAGE), [tierFiltered, page]);

  // Reset page on filter change
  useEffect(() => setPage(0), [tab, tier]);

  const handleTab = useCallback((t: PrimaryTab) => {
    setTab(t);
    setTier("ALL");
  }, []);

  return (
    <div className={styles.root}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Projects — The Developer Community",
            url: `${SITE_URL}/projects`,
          }),
        }}
      />

      <header className={styles.pageHeader}>
        <p className={styles.breadcrumb}>SYS:// TDC OS &gt; INTERNSHIP PROJECTS</p>
        <h1 className={styles.pageTitle}>
          PROJECTS<span className={styles.cursor} aria-hidden="true">_</span>
        </h1>
        <p className={styles.pageSubtitle}>
          Real-world internship projects. Apply for a role, ship real products, and earn your mark in TDC.
        </p>

        {/* Primary tab bar */}
        <div className={styles.tabBar}>
          {(["UPCOMING", "ONGOING", "SHIPPED"] as const).map((t) => {
            const count = t === "UPCOMING" ? upcomingCount : t === "ONGOING" ? ongoingCount : shippedCount;
            return (
              <button
                key={t}
                type="button"
                className={`${styles.primaryTab} ${tab === t ? styles.primaryTabActive : ""}`}
                onClick={() => handleTab(t)}
                data-tab={t}
              >
                <span>{t}</span>
                <span className={styles.primaryTabCount}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Tier filter (secondary) */}
        <div className={styles.tierRow}>
          {TIER_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`${styles.tierBtn} ${tier === key ? styles.tierBtnActive : ""}`}
              style={tier === key && key !== "ALL" ? { borderColor: TIER_COLOR[key], color: TIER_COLOR[key] } : undefined}
              onClick={() => setTier(key)}
            >
              {key !== "ALL" && (
                <span
                  className={styles.tierDot}
                  style={{ background: TIER_COLOR[key] ?? "var(--color-on-surface-muted)" }}
                />
              )}
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Results count */}
      {tierFiltered.length > 0 && (
        <div className={styles.resultsBar}>
          <span className={styles.resultsCount}>
            {tierFiltered.length} PROJECT{tierFiltered.length !== 1 ? "S" : ""}
          </span>
          {totalPages > 1 && (
            <span className={styles.resultsPage}>
              PAGE {page + 1} OF {totalPages}
            </span>
          )}
        </div>
      )}

      {/* Empty states */}
      {projects.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyCode}>// NO PROJECTS YET</p>
          <p className={styles.emptyTitle}>LOADING MISSION DATA</p>
          <p className={styles.emptyDesc}>New projects are being prepared. Check back soon.</p>
        </div>
      )}

      {projects.length > 0 && tierFiltered.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyCode}>// FILTER MISMATCH</p>
          <p className={styles.emptyTitle}>ZERO MATCHES</p>
          <p className={styles.emptyDesc}>No projects match the current filters. Try a different tier.</p>
        </div>
      )}

      {/* Grid */}
      {paginated.length > 0 && (
        <>
          <div className={styles.grid} ref={gridScrollRef}>
            {paginated.map((p) => <ProjectCard key={p.id} project={p} tab={tab} />)}
          </div>
          {totalPages > 1 && (
            <Pagination page={page} total={totalPages} onChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
