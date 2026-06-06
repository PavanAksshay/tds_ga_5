import { useLoaderData, useFetcher, useSearchParams, Link } from "react-router";
import type { Route } from "./+types/applications";
import { useState, useMemo } from "react";
import styles from "./applications.module.css";
import { formatInIST, ensureGithubUrl, ensureLinkedinUrl } from "~/lib/utils";
import { ConfirmModal } from "~/components/confirm-modal/confirm-modal";
import { Trash2 } from "lucide-react";

type AppRecord = Record<string, unknown>;
type ProjectPayload = { id: string; title: string; };

export async function loader({ request }: Route.LoaderArgs): Promise<Response> {
  const { requireAdmin, getAllApplications } = await import("../../services/admin.server");
  const { getAllProjectsAdmin } = await import("../../services/projects.server");
  const { verifySuperAdmin } = await import("../../services/admin.crypto.server");

  const headers = new Headers();
  const { user } = await requireAdmin(request, headers);
  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? undefined;
  const projectId = url.searchParams.get("project") ?? undefined;
  const [applications, projects] = await Promise.all([
    getAllApplications(request, headers, { status, projectId }),
    getAllProjectsAdmin(request, headers),
  ]);
  return Response.json({
    applications: (applications as AppRecord[]) ?? [],
    projects: projects ?? [],
    status: status ?? null,
    projectId: projectId ?? null,
    currentAdminEmail: user.email,
    isFounder: verifySuperAdmin(user.email),
  }, { headers });
}

export async function action({ request }: Route.ActionArgs): Promise<Response> {
  const { requireAdmin, updateApplicationStatus, writeAuditLog, hardDeleteEntity } = await import("../../services/admin.server");
  const { verifySuperAdmin } = await import("../../services/admin.crypto.server");

  const headers = new Headers();
  const { user } = await requireAdmin(request, headers);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const applicationId = formData.get("applicationId") as string;
  const newStatus = formData.get("status") as string;
  const notes = formData.get("notes") as string | undefined;

  if (intent === "update_status") {
    await updateApplicationStatus(request, headers, applicationId, newStatus, notes ?? undefined);
    await writeAuditLog(request, headers, user.id, user.email ?? "", `SET_STATUS_${newStatus}`, "application", applicationId, { notes });
  } else if (intent === "DELETE") {
    if (!verifySuperAdmin(user.email)) throw new Error("Unauthorized.");
    await hardDeleteEntity(request, headers, "applications", applicationId);
    await writeAuditLog(request, headers, user.id, user.email ?? "", "HARD_DELETE_APPLICATION", "application", applicationId);
  }

  return Response.json({ ok: true }, { headers });
}

const STATUS_OPTIONS = ["PENDING", "UNDER_REVIEW", "ACCEPTED", "REJECTED"] as const;
type StatusOption = typeof STATUS_OPTIONS[number];

function strOf(v: unknown): string {
  return v != null ? String(v) : "";
}

function ApplicationCard({
  app,
  isFounder,
}: {
  app: AppRecord;
  currentAdminEmail: string;
  isFounder: boolean;
}) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== "idle";

  function handleStatusChange(status: StatusOption) {
    fetcher.submit(
      { intent: "update_status", applicationId: strOf(app.id), status },
      { method: "post" }
    );
  }

  const currentStatus = strOf(app.status);

  return (
    <div className={styles.card}>
      {/* Card head: project + role + status */}
      <div className={styles.cardHead}>
        <div className={styles.cardHeadLeft}>
          <span className={styles.projectTag}>{strOf(app.project_id)}</span>
          <span className={styles.roleTag}>{strOf(app.role_title)}</span>
        </div>
        <span className={`${styles.statusBadge} ${styles[`status_${currentStatus}`]}`}>
          {currentStatus}
        </span>
      </div>

      {/* Card body: applicant info + links */}
      <div className={styles.cardBody}>
        <div className={styles.applicantInfo}>
          <p className={styles.applicantName}>{strOf(app.display_name)}</p>
          <p className={styles.applicantEmail}>{strOf(app.email)}</p>
          <p className={styles.applicantDate}>Submitted: {formatInIST(app.submitted_at as string)}</p>
        </div>

        <div className={styles.links}>
          {Boolean(app.linkedin_handle) && (
            <a href={ensureLinkedinUrl(strOf(app.linkedin_handle))} target="_blank" rel="noreferrer" className={styles.link}>
              LinkedIn ↗
            </a>
          )}
          {Boolean(app.github_handle) && (
            <a href={ensureGithubUrl(strOf(app.github_handle))} target="_blank" rel="noreferrer" className={styles.link}>
              GitHub ↗
            </a>
          )}
          {Boolean(app.resume_link) && (
            <a href={strOf(app.resume_link)} target="_blank" rel="noreferrer" className={styles.link}>
              Resume ↗
            </a>
          )}
          {Boolean(app.portfolio_url) && (
            <a href={strOf(app.portfolio_url)} target="_blank" rel="noreferrer" className={styles.link}>
              Portfolio ↗
            </a>
          )}
        </div>
      </div>

      {/* Card actions */}
      <div className={styles.cardActions}>
        <div className={styles.statusRow}>
          <span className={styles.metaLabel}>STATUS</span>
          <div className={styles.statusBtns}>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className={`${styles.statusBtn} ${currentStatus === s ? styles.statusBtnActive : ""}`}
                data-status={s}
                onClick={() => handleStatusChange(s)}
                disabled={isSubmitting || currentStatus === s}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.actionRow}>
          <Link
            to={`/admin/applications/${strOf(app.id)}`}
            className={styles.actionBtn}
            prefetch="intent"
          >
            VIEW DETAILS
          </Link>
          <DeleteApplicationControl id={strOf(app.id)} applicant={strOf(app.display_name)} isFounder={isFounder} />
        </div>
      </div>
    </div>
  );
}

function DeleteApplicationControl({ id, applicant, isFounder }: { id: string; applicant: string; isFounder: boolean }) {
  const [showModal, setShowModal] = useState(false);
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== "idle";

  if (!isFounder) return null;

  return (
    <>
      <button
        type="button"
        className={styles.deleteBtn}
        disabled={isSubmitting}
        onClick={() => setShowModal(true)}
      >
        <Trash2 size={12} /> DELETE
      </button>

      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={() => {
          fetcher.submit({ intent: "DELETE", applicationId: id }, { method: "post" });
        }}
        title="DANGER: PERMANENT DELETION"
        message={`Wipe application from ${applicant} permanently? This cannot be undone.`}
      />
    </>
  );
}

export default function AdminApplications() {
  const loaderData = useLoaderData<typeof loader>();
  if (!loaderData) return <div className={styles.root}>ERROR_LOADING_DATA</div>;

  const { applications, projects, currentAdminEmail, isFounder } = loaderData;
  const apps = (applications as AppRecord[]) ?? [];
  const dbProjects = (projects as ProjectPayload[]) ?? [];
  const [searchParams, setSearchParams] = useSearchParams();

  const statusFilter = searchParams.get("status") || "ALL";
  const projectFilter = searchParams.get("project") || "ALL";

  function setStatusFilter(s: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (s === "ALL") next.delete("status"); else next.set("status", s);
      return next;
    }, { replace: true });
  }

  function setProjectFilter(p: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (p === "ALL") next.delete("project"); else next.set("project", p);
      return next;
    }, { replace: true });
  }

  const { filtered, statusCounts } = useMemo(() => {
    const sc: Record<string, number> = { PENDING: 0, UNDER_REVIEW: 0, ACCEPTED: 0, REJECTED: 0 };
    const flt = apps.filter((a) => {
      const s = strOf(a.status);
      if (sc[s] !== undefined) sc[s]++;
      const statusMatch = statusFilter === "ALL" || s === statusFilter;
      const projMatch = projectFilter === "ALL" || strOf(a.project_id) === projectFilter;
      return statusMatch && projMatch;
    });
    return { filtered: flt, statusCounts: sc };
  }, [apps, statusFilter, projectFilter]);

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>// APPLICATIONS</h1>
          <p className={styles.pageDesc}>
            {apps.length} total · {statusCounts.PENDING} pending · {statusCounts.ACCEPTED} accepted
          </p>
        </div>
      </div>

      {/* Project filter */}
      <div className={styles.filterGroup}>
        <span className={styles.filterGroupLabel}>PROJECT:</span>
        <div className={styles.filterRow}>
          <button
            type="button"
            className={`${styles.filterBtn} ${projectFilter === "ALL" ? styles.filterBtnActive : ""}`}
            onClick={() => setProjectFilter("ALL")}
          >
            ALL
          </button>
          {dbProjects.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`${styles.filterBtn} ${projectFilter === p.id ? styles.filterBtnActive : ""}`}
              onClick={() => setProjectFilter(p.id)}
            >
              {p.id}
            </button>
          ))}
        </div>
      </div>

      {/* Status filter */}
      <div className={styles.filterGroup}>
        <span className={styles.filterGroupLabel}>STATUS:</span>
        <div className={styles.filterRow}>
          {(["ALL", ...STATUS_OPTIONS] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`${styles.filterBtn} ${statusFilter === s ? styles.filterBtnActive : ""}`}
              onClick={() => setStatusFilter(s)}
            >
              {s} {s !== "ALL" && `(${statusCounts[s] ?? 0})`}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>NO APPLICATIONS</p>
          <p className={styles.emptyDesc}>No applications found matching the selected filters.</p>
        </div>
      )}

      <div className={styles.grid}>
        {filtered.map((app) => (
          <ApplicationCard
            key={strOf(app.id)}
            app={app}
            currentAdminEmail={currentAdminEmail as string}
            isFounder={isFounder as boolean}
          />
        ))}
      </div>
    </div>
  );
}
