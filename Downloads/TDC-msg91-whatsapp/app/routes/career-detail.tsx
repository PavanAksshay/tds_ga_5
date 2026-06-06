import { useState } from "react";
import { useParams, Link, useLoaderData, useNavigate } from "react-router";
import type { Route } from "./+types/career-detail";
import { ChevronRight } from "lucide-react";
import { getCareerById, type CareerListing } from "../services/careers.server";
import { CareerApplyModal } from "../blocks/careers/career-apply-modal";
import { getSessionUser } from "../lib/supabase.server";
import { getProfile } from "../services/profile.server";
import styles from "./career-detail.module.css";

import { buildMeta, buildBreadcrumbSchema, SITE_URL } from "~/lib/seo";

const COMMITMENT_LABEL: Record<string, string> = {
  FULL_TIME: "Full-Time",
  PART_TIME: "Part-Time",
  CONTRACT: "Contract",
  VOLUNTEER: "Volunteer",
};

const LOCATION_LABEL: Record<string, string> = {
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  IN_PERSON: "In-Person",
};

interface CareerDetailLoaderData {
  listing: CareerListing | null;
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

  const listing = await getCareerById(request, headers, params.id ?? "");

  const data: CareerDetailLoaderData = {
    listing,
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

export function meta({ data }: Route.MetaArgs) {
  const listing = (data as any)?.listing;
  const title = listing?.title ?? "Career Opportunity";
  const description = listing?.description
    ? listing.description.slice(0, 155) + "..."
    : `Apply to join The Developer Community as ${title}. Browse open roles and submit your application.`;
  return [
    ...buildMeta({
      title: `${title} — TDC Careers`,
      description,
      path: `/careers/${listing?.id ?? "position"}`,
      keywords: `${title} job, TDC ${listing?.department ?? "engineering"}, developer role, engineering position india`,
    }),
  ];
}

const STATUS_COLOR: Record<string, string> = {
  OPEN: "#22c55e",
  PAUSED: "#f59e0b",
  CLOSED: "#ef4444",
};

export default function CareerDetail() {
  const { id } = useParams<{ id: string }>();
  const loaderData = useLoaderData<CareerDetailLoaderData>();
  const navigate = useNavigate();
  const { listing } = loaderData;
  const [applyOpen, setApplyOpen] = useState(false);

  const isLoggedIn = !!loaderData.userId;
  const isClosed = listing?.status === "CLOSED" || listing?.status === "PAUSED";

  function handleApply() {
    if (!isLoggedIn) {
      navigate(`/login?redirect=/careers/${id}`);
      return;
    }
    if (!isClosed) setApplyOpen(true);
  }

  if (!listing) {
    return (
      <div className={styles.root}>
        <div className={styles.notFound}>
          <p className={styles.notFoundCode}>ERR 404 // POSITION NOT FOUND</p>
          <h1 className={styles.notFoundTitle}>NULL_POSITION</h1>
          <Link to="/careers" className={styles.notFoundBack}>
            &#8592; RETURN TO CAREERS
          </Link>
        </div>
      </div>
    );
  }

  const statusColor = STATUS_COLOR[listing.status] ?? "var(--color-primary)";

  return (
    <div className={styles.root}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "JobPosting",
            title: listing.title,
            description: listing.description,
            url: `${SITE_URL}/careers/${listing.id}`,
            hiringOrganization: {
              "@type": "Organization",
              name: "The Developer Community",
              sameAs: SITE_URL,
            },
          }),
        }}
      />
      <header className={styles.header}>
        <p className={styles.breadcrumb}>
          <Link to="/careers" prefetch="intent" className={styles.breadcrumbLink}>CAREERS</Link>
          <span> / </span>
          <span>{listing.id}</span>
        </p>
        <p className={styles.positionId}>POSITION ID: [ {listing.id} ]</p>
        <h1 className={styles.title}>
          {listing.title}<span className={styles.cursor} aria-hidden="true">|</span>
        </h1>
        <div className={styles.badges}>
          <span className={styles.deptBadge}>
            <span className={styles.deptLabel}>DEPT </span>
            {listing.department}
          </span>
          <span className={styles.commitBadge}>
            {COMMITMENT_LABEL[listing.commitment] ?? listing.commitment}
          </span>
          <span className={styles.locationBadge}>
            {LOCATION_LABEL[listing.location_type] ?? listing.location_type}
          </span>
          <span
            className={styles.statusBadge}
            style={{ background: statusColor, color: "#000", border: `1px solid ${statusColor}` }}
          >
            <span className={styles.statusLabel}>STATUS </span>
            {listing.status}
          </span>
        </div>
      </header>

      {!isLoggedIn && (
        <div className={styles.loginNotice}>
          <span className={styles.loginNoticeText}>
            &#9888; You must be logged in to apply for a position.
          </span>
          <Link to={`/login?redirect=/careers/${id}`} className={styles.loginNoticeLink}>
            LOGIN TO APPLY &#8594;
          </Link>
        </div>
      )}

      {isClosed && (
        <div className={styles.closedNotice}>
          <span>&#9888; This position is currently {listing.status.toLowerCase()} and not accepting applications.</span>
        </div>
      )}

      <div className={styles.bentoGrid}>
        {/* Mission / Role Overview */}
        <section className={`${styles.panel} ${styles.col8}`}>
          <p className={styles.panelLabel}>ROLE OVERVIEW</p>
          <p className={styles.missionBig}>{listing.tagline}</p>
          <p className={styles.missionDetail}>{listing.description}</p>
          <div className={styles.tagRow}>
            {listing.tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        </section>

        {/* Position Info */}
        <section className={`${styles.panel} ${styles.panelDark} ${styles.col4}`}>
          <p className={styles.panelLabel}>POSITION INFO</p>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <p className={styles.infoLabel}>DEPARTMENT</p>
              <p className={styles.infoValue}>{listing.department}</p>
            </div>
            <div className={styles.infoItem}>
              <p className={styles.infoLabel}>COMMITMENT</p>
              <p className={styles.infoValue}>{COMMITMENT_LABEL[listing.commitment]}</p>
            </div>
            <div className={styles.infoItem}>
              <p className={styles.infoLabel}>LOCATION</p>
              <p className={styles.infoValue}>{LOCATION_LABEL[listing.location_type]}</p>
            </div>
            <div className={styles.infoItem}>
              <p className={styles.infoLabel}>OPEN SLOTS</p>
              <p className={styles.infoValue}>
                {listing.roles.filter((r) => !r.locked).length} OF {listing.roles.length}
              </p>
            </div>
          </div>
        </section>

        {/* Open Roles */}
        {listing.roles.length > 0 && (
          <section className={`${styles.panel} ${styles.col12}`}>
            <p className={styles.panelLabel}>OPEN ROLES</p>
            <div className={styles.rolesGrid}>
              {listing.roles.map((role) => (
                <div
                  key={role.id}
                  className={[
                    styles.roleCard,
                    role.locked ? styles.roleCardLocked : styles.roleCardOpen,
                    isClosed ? styles.roleCardLocked : "",
                  ].join(" ")}
                  onClick={() => !role.locked && !isClosed && handleApply()}
                  role="button"
                  tabIndex={role.locked || isClosed ? -1 : 0}
                  onKeyDown={(e) => e.key === "Enter" && !role.locked && !isClosed && handleApply()}
                  aria-label={`Apply for ${role.title}`}
                >
                  <div className={styles.roleCardBody}>
                    <div>
                      <p className={styles.roleName}>{role.title}</p>
                      <p className={styles.roleAvail}>AVAILABILITY: {role.availability}</p>
                      {role.description && (
                        <p className={styles.roleDesc}>{role.description}</p>
                      )}
                    </div>
                    <div className={styles.roleCardRight}>
                      <span className={[
                        styles.roleStatus,
                        (role.locked || isClosed) ? styles.roleStatusLocked : styles.roleStatusOpen,
                      ].join(" ")}>
                        {role.locked ? "LOCKED" : isClosed ? "CLOSED" : "OPEN"}
                      </span>
                      {!role.locked && !isClosed && (
                        <ChevronRight size={16} className={styles.roleArrow} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className={`${styles.ctaPanel} ${styles.col12}`}>
          <div className={styles.ctaLeft}>
            <h2 className={styles.ctaTitle}>
              {isClosed ? "APPLICATIONS CLOSED" : "READY TO JOIN THE TEAM?"}
            </h2>
            <p className={styles.ctaSubtitle}>
              {isClosed
                ? "This position is not currently accepting applications. Check other open roles."
                : `Submit your application for ${listing.title}. Our team will review your profile and reach out via the platform.`
              }
            </p>
          </div>
          {!isClosed && (
            <button className={styles.ctaBtn} type="button" onClick={handleApply}>
              {isLoggedIn ? "APPLY NOW" : "LOGIN TO APPLY"}
            </button>
          )}
        </div>
      </div>

      {applyOpen && isLoggedIn && listing && (
        <CareerApplyModal
          listing={listing}
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
    </div>
  );
}
