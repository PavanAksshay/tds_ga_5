import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useLoaderData, useNavigate } from "react-router";
import type { Route } from "./+types/project-detail";
import { ChevronRight, GitBranch, ExternalLink, ChevronLeft, X as XIcon, Users } from "lucide-react";
import { getProjectByIdFromDB, type ProjectPayload } from "../services/projects.server";
import { ApplyModal } from "../blocks/projects/apply-modal";
import { getSessionUser } from "../lib/supabase.server";
import { getProfile } from "../services/profile.server";
import styles from "./project-detail.module.css";

import { buildMeta, buildBreadcrumbSchema, buildWebPageSchema, SITE_URL } from "~/lib/seo";

interface ProjectDetailLoaderData {
  project: ProjectPayload | null;
  userId: string | null;
  userEmail: string | null;
  displayName: string | null;
  linkedinHandle: string | null;
  githubHandle: string | null;
  resumeLink: string | null;
  portfolioUrl: string | null;
}

export async function loader({ request, params }: Route.LoaderArgs): Promise<Response> {
  const headers = new Headers();
  const user = await getSessionUser(request, headers);

  let profile = null;
  if (user) {
    profile = await getProfile(request, headers, user.id);
  }

  const project = await getProjectByIdFromDB(request, headers, params.id ?? "");

  const data: ProjectDetailLoaderData = {
    project,
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    displayName: profile?.display_name ?? user?.user_metadata?.display_name ?? null,
    linkedinHandle: profile?.linkedin_handle ?? null,
    githubHandle: profile?.github_handle ?? null,
    resumeLink: profile?.resume_link ?? null,
    portfolioUrl: profile?.portfolio_url ?? null,
  };

  return Response.json(data, { headers });
}

const STATUS_COLOR: Record<string, string> = {
  OPEN: "#22c55e",
  RECRUITING: "#22c55e",
  IN_PROGRESS: "#f59e0b",
  CLOSED: "#ef4444",
  SHIPPED: "#6366f1",
};

// ─── Gallery lightbox ────────────────────────────────────────────────────────
function GalleryLightbox({
  images,
  initialIndex,
  onClose,
  projectTitle,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
  projectTitle: string;
}) {
  const [idx, setIdx] = useState(initialIndex);
  const prev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIdx((i) => Math.min(images.length - 1, i + 1)), [images.length]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, prev, next]);

  return (
    <div className={styles.lightboxOverlay} onClick={onClose}>
      <div className={styles.lightboxInner} onClick={(e) => e.stopPropagation()}>
        <button className={styles.lightboxClose} onClick={onClose} type="button" aria-label="Close lightbox">
          <XIcon size={16} aria-hidden="true" />
        </button>
        <button className={styles.lightboxNav} data-dir="prev" onClick={prev} disabled={idx === 0} type="button" aria-label="Previous image">
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <img src={images[idx]} alt={`Gallery image ${idx + 1} for ${projectTitle}`} className={styles.lightboxImage} />
        <button className={styles.lightboxNav} data-dir="next" onClick={next} disabled={idx === images.length - 1} type="button" aria-label="Next image">
          <ChevronRight size={20} aria-hidden="true" />
        </button>
        <div className={styles.lightboxCounter}>{idx + 1} / {images.length}</div>
      </div>
    </div>
  );
}

export function meta({ data }: Route.MetaArgs) {
  const project = (data as any)?.project;
  const projectTitle = project?.title ?? "Project";
  const description = project?.tagline
    ? `${project.tagline} — Contribute to this open project at The Developer Community. Apply for a role and earn a verified resume credit.`
    : `Discover ${projectTitle} — an open project at The Developer Community. Browse open roles, the tech stack, and apply to contribute.`;
  return [
    ...buildMeta({
      title: `${projectTitle} — Project Details`,
      description: description.slice(0, 160),
      path: `/projects/${project?.id ?? "project"}`,
      keywords: `${projectTitle}, developer project, TDC build, resume credit project, production engineering`,
    }),
  ];
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const loaderData = useLoaderData<ProjectDetailLoaderData>();
  const navigate = useNavigate();
  const { project } = loaderData;
  const [applyOpen, setApplyOpen] = useState(false);

  const isLoggedIn = !!loaderData.userId;
  const isClosed = project?.status === "CLOSED" || project?.status === "SHIPPED";
  const isShipped = project?.status === "SHIPPED";
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  function handleApply() {
    if (!isLoggedIn) {
      navigate(`/login?redirect=/projects/${id}`);
      return;
    }
    if (!isClosed) setApplyOpen(true);
  }

  if (!project) {
    return (
      <div className={styles.root}>
        <div className={styles.notFound}>
          <p className={styles.notFoundCode}>ERR 404 // PROJECT NOT FOUND</p>
          <h1 className={styles.notFoundTitle}>PROJECT NULL</h1>
          <Link to="/projects" className={styles.notFoundBack}>
            &#8592; RETURN TO DISCOVERY
          </Link>
        </div>
      </div>
    );
  }

  const statusColor = STATUS_COLOR[project.status] ?? "var(--color-primary)";

  return (
    <div className={styles.root}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: project.title,
            description: project.tagline,
            url: `${SITE_URL}/projects/${project.id}`,
            isPartOf: { "@id": `${SITE_URL}/#website` },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
                { "@type": "ListItem", position: 2, name: "Projects", item: `${SITE_URL}/projects` },
                { "@type": "ListItem", position: 3, name: project.title, item: `${SITE_URL}/projects/${project.id}` },
              ],
            },
          }),
        }}
      />
      <header className={styles.header}>
        <p className={styles.breadcrumb}>
          <Link to="/projects" prefetch="intent" className={styles.breadcrumbLink}>PROJECTS</Link>
          <span> / </span>
          <span>{project.id}</span>
        </p>
        <p className={styles.projectId}>PROJECT ID: [ {project.id} ]</p>
        <h1 className={styles.title}>
          {project.title}<span className={styles.cursor} aria-hidden="true">|</span>
        </h1>
        <div className={styles.badges}>
          <span className={styles.tierBadge}>
            <span className={styles.tierLabel}>TIER </span>
            {project.tier}
          </span>
          <span
            className={styles.statusBadge}
            style={{ background: statusColor, color: "#000", border: `1px solid ${statusColor}` }}
          >
            <span className={styles.statusLabel}>STATUS </span>
            {project.status}
          </span>
          {project.live_url && (
            <a href={project.live_url} target="_blank" rel="noopener noreferrer" className={styles.linkBadge}>
              <ExternalLink size={12} />
              LIVE DEPLOYMENT
            </a>
          )}
          {!isClosed && (
            <button 
              className={styles.headerApplyBtn} 
              type="button" 
              onClick={handleApply}
            >
              {isLoggedIn ? "APPLY NOW" : "LOGIN TO APPLY"}
            </button>
          )}
          {project.github_url && (
            <a href={project.github_url} target="_blank" rel="noopener noreferrer" className={styles.linkBadge}>
              <GitBranch size={14} /> REPOSITORY
            </a>
          )}
        </div>
      </header>

      {!isLoggedIn && (
        <div className={styles.loginNotice}>
          <span className={styles.loginNoticeText}>
            &#9888; You must be logged in to apply for a project.
          </span>
          <Link to={`/login?redirect=/projects/${id}`} className={styles.loginNoticeLink}>
            LOGIN TO APPLY &#8594;
          </Link>
        </div>
      )}

      {isClosed && (
        <div className={styles.closedNotice}>
          <span>&#9888; This project is closed and no longer accepting applications.</span>
        </div>
      )}

      <div className={styles.bentoGrid}>


        {/* ── LEFT COLUMN: Mission → Hierarchy → Contributors ── */}
        <div className={styles.bentoLeft}>

          {/* Mission Manifesto */}
          <section className={styles.panel}>
            <p className={styles.panelLabel}>MISSION MANIFESTO</p>
            <p className={styles.missionBig}>{project.tagline}</p>
            <p className={styles.missionDetail}>{project.description}</p>
            <div className={styles.tagRow}>
              {project.tags.map((tag) => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
            {project.teaser_image && !isShipped && (
              <div className={styles.teaserInline}>
                <img
                  src={project.teaser_image}
                  alt={`Teaser image for ${project.title}`}
                  fetchPriority="high"
                  width={800}
                  height={450}
                />
              </div>
            )}
          </section>

          {/* Project Hierarchy */}
          {project.roles.length > 0 && (
            <section className={styles.panel}>
              <p className={styles.panelLabel}>PROJECT HIERARCHY</p>
              <div className={styles.hierarchyList}>
                {project.roles.map((role) => (
                  <div
                    key={role.id}
                    className={[
                      styles.hierarchyRole,
                      role.locked ? styles.hierarchyRoleLocked : styles.hierarchyRoleOpen,
                      isClosed ? styles.hierarchyRoleLocked : "",
                    ].join(" ")}
                  >
                    <div className={styles.roleNameWrap}>
                      <span className={styles.roleName}>{role.title}</span>
                      <span className={styles.roleAvail}>AVAILABILITY: {role.availability}</span>
                    </div>
                    <span
                      className={[
                        styles.roleStatus,
                        (role.locked || isClosed) ? styles.roleStatusLocked : styles.roleStatusOpen,
                      ].join(" ")}
                    >
                      {role.locked ? "LOCKED" : isClosed ? "CLOSED" : "OPEN"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Contributors Panel (Shipped only) */}
          {isShipped && project.contributors?.length && (
            <section className={styles.panel}>
              <p className={styles.panelLabel}><Users size={12} /> CRAFTED BY ENGINEERS</p>
              <div className={styles.contributorGrid}>
                {project.contributors.map((c, i) => (
                  <div key={i} className={styles.contributorCard}>
                    <div className={styles.contributorInfo}>
                      <p className={styles.contributorName}>{c.name}</p>
                      <p className={styles.contributorRole}>{c.role}</p>
                    </div>
                    {c.github && (
                      <a href={c.github} target="_blank" rel="noopener noreferrer" className={styles.contributorGithub}>
                        <GitBranch size={14} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tech Stack */}
          {project.tech_stack.length > 0 && (
            <section className={`${styles.panel} ${styles.panelDark}`}>
              <p className={styles.panelLabel}>SYSTEM STACK</p>
              <div className={styles.stackList}>
                {project.tech_stack.map((item) => (
                  <div key={item.label} className={styles.stackItem}>
                    <p className={styles.stackItemLabel}>{item.label}</p>
                    <p className={styles.stackItemValue}>
                      {item.value}
                      <ChevronRight size={14} />
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Shipped gallery */}
          {isShipped && project.gallery_images?.length ? (
            <section className={`${styles.panel} ${styles.mediaPanel}`}>
              <p className={styles.panelLabel}>VISUAL ASSETS</p>
              <div className={styles.galleryGrid}>
                {project.gallery_images.slice(0, 4).map((img, i) => (
                  <button
                    key={img}
                    className={styles.galleryThumb}
                    onClick={() => setLightboxIndex(i)}
                    type="button"
                    aria-label={`View larger version of project image ${i + 1}`}
                  >
                    <img src={img} alt={`Project gallery thumbnail ${i + 1}`} loading="lazy" width={150} height={100} />
                    {i === 3 && project.gallery_images!.length > 4 && (
                      <div className={styles.galleryMore} aria-hidden="true">
                        +{project.gallery_images!.length - 4}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

        </div>{/* end bentoLeft */}

        {/* ── RIGHT COLUMN: Timeline Only ── */}
        <div className={styles.bentoRight}>

          {/* Timeline */}
          {project.timeline.length > 0 && (
            <section className={`${styles.panel} ${styles.panelHighlight}`}>
              <p className={styles.panelLabel}>PROJECT TIMELINE</p>
              <div className={styles.timeline}>
                <div className={styles.systemBus} />
                {project.timeline.map((item, i) => (
                  <div key={i} className={styles.timelineRow}>
                    <div className={styles.nodeAnchor}>
                      <div className={`${styles.hexNode} ${item.status !== 'PENDING' ? styles.hexNodeActive : ''}`}>
                        <div className={styles.hexNodeInner} />
                      </div>
                      <div className={styles.branchLine} />
                    </div>
                    <div
                      className={`${styles.dataModule} ${item.status !== 'PENDING' ? styles.dataModuleActive : ''}`}
                      data-index={(i + 1).toString().padStart(2, '0')}
                    >
                      <span className={styles.weekLabel}>{item.label.toUpperCase()}</span>
                      <h3 className={styles.timelineItemTitle}>{item.title}</h3>
                      <p className={styles.timelineItemDesc}>{item.description}</p>
                      <div className={`${styles.statusIndicator} ${item.status !== 'PENDING' ? styles.statusIndicatorActive : ''}`}>
                        {item.status === 'SHIPPED' ? 'SYSTEM_SHIPPED' : item.status === 'IN_PROGRESS' ? 'BUS_ACTIVE' : 'NODE_QUEUED'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>{/* end bentoRight */}

      </div>{/* end bentoGrid */}

      {/* CTA — Bottom position for proper layout flow */}
      <div className={styles.ctaPanel}>
        <div className={styles.ctaLeft}>
          <h2 className={styles.ctaTitle}>
            {isClosed ? "APPLICATIONS CLOSED" : "ARE YOU READY TO BUILD?"}
          </h2>
          <p className={styles.ctaSubtitle}>
            {isClosed
              ? "This project is no longer accepting applications. Check other open projects."
              : `Submit your application for ${project.title}. The project lead will review your profile and tech stack before approving access.`
            }
          </p>
        </div>
        {!isClosed && (
          <button className={styles.ctaBtn} type="button" onClick={handleApply}>
            {isLoggedIn ? "APPLY FOR BUILD" : "LOGIN TO APPLY"}
          </button>
        )}
      </div>


      {applyOpen && isLoggedIn && project && (
        <ApplyModal
          project={project}
          userId={loaderData.userId!}
          userEmail={loaderData.userEmail!}
          displayName={loaderData.displayName}
          linkedinHandle={loaderData.linkedinHandle}
          githubHandle={loaderData.githubHandle}
          resumeLink={loaderData.resumeLink}
          portfolioUrl={loaderData.portfolioUrl}
          onClose={() => setApplyOpen(false)}
        />
      )}
      {lightboxIndex !== null && project.gallery_images && (
        <GalleryLightbox
          images={project.gallery_images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          projectTitle={project.title}
        />
      )}
    </div>
  );
}
