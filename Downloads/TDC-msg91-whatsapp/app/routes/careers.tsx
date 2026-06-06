import type { Route } from "./+types/careers";
import { useState, useMemo } from "react";
import { useNavigate, useLoaderData } from "react-router";
import type { ShouldRevalidateFunctionArgs } from "react-router";
import { getPublishedCareers, type CareerListing } from "../services/careers.server";
import { Briefcase, MapPin, Clock } from "lucide-react";
import styles from "./careers.module.css";

import { buildMeta, SITE_URL } from "~/lib/seo";

export function meta(_: Route.MetaArgs) {
  return [
    ...buildMeta({
      title: "Open Roles & Staff Positions — The Developer Community Careers",
      description: "Join the team building the next generation of developer culture. Browse open staff and volunteer roles at TDC — from engineering to marketing. Apply today.",
      path: "/careers",
      keywords: "developer community jobs, tech volunteer roles india, engineering internship, TDC careers, open source team",
    }),
  ];
}

type DepartmentFilter = CareerListing["department"] | "ALL";

const DEPT_FILTERS: { key: DepartmentFilter; label: string }[] = [
  { key: "ALL", label: "ALL DEPTS" },
  { key: "ENGINEERING", label: "ENGINEERING" },
  { key: "DESIGN", label: "DESIGN" },
  { key: "MARKETING", label: "MARKETING" },
  { key: "OPERATIONS", label: "OPERATIONS" },
  { key: "CONTENT", label: "CONTENT" },
  { key: "COMMUNITY", label: "COMMUNITY" },
  { key: "GENERAL", label: "GENERAL" },
];

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

interface CareersLoaderData {
  listings: CareerListing[];
}

export async function loader({ request }: Route.LoaderArgs): Promise<Response> {
  const headers = new Headers();
  const listings = await getPublishedCareers(request, headers);
  return Response.json({ listings } satisfies CareersLoaderData, { headers });
}

export function shouldRevalidate({ currentUrl, nextUrl, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs) {
  // Skip re-fetching if we are navigating between the careers list and its sub-pages
  if (currentUrl.pathname.startsWith('/careers') && nextUrl.pathname === '/careers') {
    return false;
  }
  return defaultShouldRevalidate;
}

function CareerCard({ listing }: { listing: CareerListing }) {
  const navigate = useNavigate();
  const openRoles = listing.roles.filter((r) => !r.locked).length;
  return (
    <button
      className={styles.card}
      type="button"
      onClick={() => navigate(`/careers/${listing.id}`)}
    >
      <div className={styles.cardHead}>
        <div className={styles.cardHeadLeft}>
          <span className={styles.cardDept}>{listing.department}</span>
        </div>
        <span
          className={styles.cardStatus}
          data-status={listing.status}
        >
          {listing.status}
        </span>
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{listing.title}</h3>
        <p className={styles.cardTagline}>{listing.tagline}</p>
        <div className={styles.cardMeta}>
          <span className={styles.cardMetaItem}>
            <Briefcase size={10} />
            {COMMITMENT_LABEL[listing.commitment] ?? listing.commitment}
          </span>
          <span className={styles.cardMetaItem}>
            <MapPin size={10} />
            {LOCATION_LABEL[listing.location_type] ?? listing.location_type}
          </span>
          <span className={styles.cardMetaItem}>
            <Clock size={10} />
            {openRoles} open slot{openRoles !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
      <div className={styles.cardFooter}>
        {listing.tags.slice(0, 4).map((tag) => (
          <span key={tag} className={styles.cardTag}>{tag}</span>
        ))}
      </div>
    </button>
  );
}

export default function Careers() {
  const { listings } = useLoaderData() as CareersLoaderData;
  const navigate = useNavigate();
  const [activeDept, setActiveDept] = useState<DepartmentFilter>("ALL");

  const filtered = useMemo(() => {
    if (activeDept === "ALL") return listings;
    return listings.filter((l) => l.department === activeDept);
  }, [activeDept, listings]);

  const openCount = listings.filter((l) => l.status === "OPEN").length;
  const deptGroups = useMemo(() => {
    if (activeDept !== "ALL") {
      const items = filtered;
      return items.length ? [{ dept: activeDept, items }] : [];
    }
    const map: Record<string, CareerListing[]> = {};
    for (const l of filtered) {
      if (!map[l.department]) map[l.department] = [];
      map[l.department].push(l);
    }
    return Object.entries(map).map(([dept, items]) => ({ dept, items }));
  }, [filtered, activeDept]);

  return (
    <div className={styles.root}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Careers — The Developer Community",
            description: "Join the team building the next generation of developer culture.",
            url: `${SITE_URL}/careers`,
          }),
        }}
      />

      <div className={styles.container}>
        {/* --- Side Nav (Desktop) / Top Nav (Mobile) --- */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarSticky}>
            <p className={styles.breadcrumb}>SYS://TDC_OS/OPEN_ROLES</p>
            <h1 className={styles.sidebarTitle}>CAREERS</h1>
            
            <nav className={styles.deptNav}>
              {DEPT_FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  className={`${styles.deptLink} ${activeDept === key ? styles.deptLinkActive : ""}`}
                  onClick={() => setActiveDept(key)}
                  type="button"
                >
                  <span className={styles.deptLinkDot} aria-hidden="true" />
                  {label}
                  {activeDept === key && <span className={styles.activeIndicator} aria-hidden="true" />}
                </button>
              ))}
            </nav>

            <div className={styles.sidebarStats}>
              <div className={styles.statLine}>
                <span className={styles.statLabel}>STATUS</span>
                <span className={styles.statValue}>DEPLOYED</span>
              </div>
              <div className={styles.statLine}>
                <span className={styles.statLabel}>UPTIME</span>
                <span className={styles.statValue}>99.9%</span>
              </div>
              <div className={styles.statLine}>
                <span className={styles.statLabel}>AVAILABLE</span>
                <span className={styles.statValue}>{openCount} POSITIONS</span>
              </div>
            </div>
          </div>
        </aside>

        {/* --- Main Content --- */}
        <main className={styles.content}>
          <section className={styles.hero}>
            <div className={styles.heroLine}>
              <span className={styles.heroTag}>[ MISSION_CRITICAL ]</span>
            </div>
            <h2 className={styles.heroHeadline}>
              BUILD THE INFRASTRUCTURE OF <span className={styles.accent}>CREATIVITY</span>
            </h2>
            <p className={styles.heroSubtext}>
              TDC is more than a community—it&apos;s a laboratory for human potential. 
              Find your role in the system.
            </p>
          </section>

          {listings.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>0x00: NO_POSITIONS_ACTIVE</p>
              <p className={styles.emptyDesc}>The system is currently fully staffed. Check back during the next recruitment cycle.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>0x404: NO_MATCHES</p>
              <p className={styles.emptyDesc}>No roles found in the {activeDept} department. Expand your search to see more opportunities.</p>
            </div>
          ) : (
            <div className={styles.listingsScroll}>
              {deptGroups.map(({ dept, items }) => (
                <section key={dept} className={styles.deptSection}>
                  <header className={styles.deptHeader}>
                    <h3 className={styles.deptLabel}>{dept}</h3>
                    <div className={styles.headerLine} />
                    <span className={styles.deptCount}>[{String(items.length).padStart(2, "0")}]</span>
                  </header>

                  <div className={styles.grid}>
                    {items.map((listing) => (
                      <button
                        key={listing.id}
                        className={styles.careerCard}
                        onClick={() => navigate(`/careers/${listing.id}`)}
                      >
                        <div className={styles.cardAccent} data-dept={listing.department} />
                        <div className={styles.cardHeader}>
                          <span className={styles.cardDeptTag}>{listing.department}</span>
                          <span className={styles.cardStatus} data-status={listing.status}>
                            {listing.status}
                          </span>
                        </div>
                        
                        <h4 className={styles.cardTitle}>{listing.title}</h4>
                        <p className={styles.cardTagline}>{listing.tagline}</p>

                        <div className={styles.cardFooter}>
                          <div className={styles.metaGroup}>
                             <Briefcase size={12} aria-hidden="true" />
                             <span>{COMMITMENT_LABEL[listing.commitment] ?? listing.commitment}</span>
                           </div>
                           <div className={styles.metaGroup}>
                             <MapPin size={12} aria-hidden="true" />
                             <span>{LOCATION_LABEL[listing.location_type] ?? listing.location_type}</span>
                           </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
