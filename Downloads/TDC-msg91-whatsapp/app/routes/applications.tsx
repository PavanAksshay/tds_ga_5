import { useLoaderData, Link, useSearchParams } from "react-router";
import { FileText, ArrowRight, Briefcase, ChevronDown, ChevronUp } from "lucide-react";
import type { Route } from "./+types/applications";
import { requireAuth, requireGithub } from "../services/auth.server";
import { getUserApplications } from "../services/applications.server";
import { getUserCareerApplications } from "../services/career-applications.server";
import classnames from "classnames";
import { useState } from "react";
import styles from "./applications.module.css";
import { normalizeGithubHandle, normalizeLinkedinHandle, toAbsoluteUrl } from "~/lib/utils";

export function meta() {
  return [
    { title: "My Applications | The Developer Community" },
    { name: "description", content: "Track your project and career applications on The Developer Community." },
    { name: "robots", content: "noindex, nofollow" },
  ];
}



export async function loader({ request }: Route.LoaderArgs) {
  const headers = new Headers();
  const user = await requireAuth(request, headers);
  await requireGithub(user.id);
  const [projectApps, careerApps] = await Promise.all([
    getUserApplications(request, headers, user.id),
    getUserCareerApplications(request, headers, user.id),
  ]);
  return Response.json({ projectApps, careerApps }, { headers });
}

function ProjectAppCard({ app }: { app: any }) {
  const [expanded, setExpanded] = useState(false);
  const dateStr = new Date(app.submitted_at ?? "").toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <div className={styles.cardLeft}>
          <span className={styles.roleTitle}>{app.role_title || "Contributor"}</span>
          <span className={styles.listingId}>Project · {app.project_id}</span>
          <span className={styles.dateStr}>{dateStr}</span>
        </div>
        <div className={styles.cardRight}>
          <span className={`${styles.statusBadge} ${styles[`status_${app.status}`]}`}>
            {app.status?.replace(/_/g, " ")}
          </span>
          <Link to={`/projects/${app.project_id}`} className={styles.viewLink}>
            VIEW <ArrowRight size={10} />
          </Link>
        </div>
      </div>

      {app.message && (
        <button className={styles.expandBtn} onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? "HIDE DETAILS" : "VIEW MY RESPONSE"}
        </button>
      )}

      {expanded && app.message && (
        <div className={styles.answersPanel}>
          <div className={styles.answerBlock}>
            <p className={styles.answerLabel}>YOUR MESSAGE</p>
            <p className={styles.answerValue}>{app.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function CareerAppCard({ app }: { app: any }) {
  const [expanded, setExpanded] = useState(false);
  const dateStr = new Date(app.submitted_at ?? "").toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  const hasAnswers = app.answers && Object.keys(app.answers).length > 0;
  const hasLinks = app.linkedin_handle || app.github_handle || app.resume_link || app.portfolio_url;

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <div className={styles.cardLeft}>
          <span className={styles.roleTitle}>{app.role_title}</span>
          <span className={styles.listingId}>Listing · {app.listing_id}</span>
          <span className={styles.dateStr}>{dateStr}</span>
        </div>
        <div className={styles.cardRight}>
          <span className={`${styles.statusBadge} ${styles[`status_${app.status}`]}`}>
            {app.status?.replace(/_/g, " ")}
          </span>
          <Link to="/careers" className={styles.viewLink}>
            VIEW <ArrowRight size={10} />
          </Link>
        </div>
      </div>

      {(hasAnswers || hasLinks) && (
        <button className={styles.expandBtn} onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? "HIDE DETAILS" : "VIEW MY APPLICATION"}
        </button>
      )}

      {expanded && (
        <div className={styles.answersPanel}>
          {hasLinks && (
            <div className={styles.linksRow}>
              {app.linkedin_handle && (
                <a href={`https://linkedin.com/in/${normalizeLinkedinHandle(app.linkedin_handle)}`}
                  target="_blank" rel="noreferrer" className={styles.appLink}>LinkedIn ↗</a>
              )}
              {app.github_handle && (
                <a href={`https://github.com/${normalizeGithubHandle(app.github_handle)}`}
                  target="_blank" rel="noreferrer" className={styles.appLink}>GitHub ↗</a>
              )}
              {app.resume_link && (
                <a href={toAbsoluteUrl(app.resume_link)} target="_blank" rel="noreferrer" className={styles.appLink}>Resume ↗</a>
              )}
              {app.portfolio_url && (
                <a href={toAbsoluteUrl(app.portfolio_url)}
                  target="_blank" rel="noreferrer" className={styles.appLink}>Portfolio ↗</a>
              )}
            </div>
          )}

          {hasAnswers && Object.entries(app.answers).map(([key, val]) => (
            <div key={key} className={styles.answerBlock}>
              <p className={styles.answerLabel}>{key.replace(/^[^_]+__/, "").replace(/_/g, " ")}</p>
              <p className={styles.answerValue}>{String(val)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UserApplicationsPage() {
  const { projectApps, careerApps } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "career" ? "career" : "project";

  const applications: any[] = activeTab === "career" ? careerApps : projectApps;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Applications</h1>
        <p className={styles.subtitle}>
          {activeTab === "career"
            ? "Track your career role applications and view your submitted responses."
            : "Track your project applications and view feedback from project leads."}
        </p>
      </header>

      <div className={styles.tabBar}>
        <button
          className={classnames(styles.tabBtn, activeTab === "project" && styles.tabBtnActive)}
          onClick={() => setSearchParams({ tab: "project" })}
        >
          PROJECT APPLICATIONS
          {(projectApps as any[]).length > 0 && (
            <span className={styles.tabCount}>{(projectApps as any[]).length}</span>
          )}
        </button>
        <button
          className={classnames(styles.tabBtn, activeTab === "career" && styles.tabBtnActive)}
          onClick={() => setSearchParams({ tab: "career" })}
        >
          CAREER APPLICATIONS
          {(careerApps as any[]).length > 0 && (
            <span className={styles.tabCount}>{(careerApps as any[]).length}</span>
          )}
        </button>
      </div>

      {applications.length > 0 ? (
        <div className={styles.grid}>
          {applications.map((app: any) =>
            activeTab === "career"
              ? <CareerAppCard key={app.id} app={app} />
              : <ProjectAppCard key={app.id} app={app} />
          )}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            {activeTab === "project" ? <FileText size={40} strokeWidth={1} /> : <Briefcase size={40} strokeWidth={1} />}
          </div>
          <h2 className={styles.emptyTitle}>
            NO {activeTab === "project" ? "PROJECT" : "CAREER"} APPLICATIONS
          </h2>
          <p className={styles.emptyText}>
            You haven't submitted any {activeTab} applications yet.
          </p>
          <Link to={activeTab === "project" ? "/projects" : "/careers"} className={styles.exploreBtn}>
            EXPLORE {activeTab === "project" ? "PROJECTS" : "CAREERS"} <ArrowRight size={12} />
          </Link>
        </div>
      )}
    </div>
  );
}
