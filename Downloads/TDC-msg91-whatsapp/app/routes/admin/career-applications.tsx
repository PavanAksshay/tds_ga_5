import { useLoaderData, useFetcher, useNavigation, useSearchParams, Link } from "react-router";
import type { CareerApplication } from "../../services/career-applications.server";
import { useState, useMemo } from "react";
import classnames from "classnames";
import styles from "./career-applications.module.css";
import { formatInIST, ensureGithubUrl, ensureLinkedinUrl } from "~/lib/utils";
import { ConfirmModal } from "~/components/confirm-modal/confirm-modal";
import { Trash2 } from "lucide-react";

interface AdminCareerAppsLoaderData {
  applications: (CareerApplication & { department: string })[];
  currentAdminEmail: string;
  isFounder: boolean;
}

export async function loader({ request }: { request: Request }): Promise<Response> {
  const { requireAdmin } = await import("../../services/admin.server");
  const { getAllCareerApplications } = await import("../../services/career-applications.server");
  const { verifySuperAdmin } = await import("../../services/admin.crypto.server");

  const headers = new Headers();
  const { user } = await requireAdmin(request, headers);

  // OPTIMIZATION: Now fetched via a single SQL Join for maximum speed
  const applications = await getAllCareerApplications(request, headers);

  return Response.json({ 
    applications, 
    currentAdminEmail: user.email || "", 
    isFounder: verifySuperAdmin(user.email) 
  } satisfies AdminCareerAppsLoaderData, { headers });
}

export async function action({ request }: { request: Request }): Promise<Response> {
  const { requireAdmin, hardDeleteEntity } = await import("../../services/admin.server");
  const { updateCareerApplicationStatus } = await import("../../services/career-applications.server");
  const { verifySuperAdmin } = await import("../../services/admin.crypto.server");

  const headers = new Headers();
  const { user } = await requireAdmin(request, headers);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "update_status") {
    const id = formData.get("id") as string;
    const status = formData.get("status") as CareerApplication["status"];
    const internalNotes = formData.get("internal_notes") as string | undefined;
    const result = await updateCareerApplicationStatus(request, headers, id, status, internalNotes ?? undefined);
    if (result.error) return Response.json({ error: result.error }, { headers, status: 400 });
    return Response.json({ ok: true }, { headers });
  } else if (intent === "DELETE") {
    const id = formData.get("id") as string;
    if (!verifySuperAdmin(user.email)) throw new Error("Unauthorized.");
    await hardDeleteEntity(request, headers, "career_applications", id);
    return Response.json({ ok: true }, { headers });
  }

  return Response.json({ ok: true }, { headers });
}

const STATUS_OPTIONS: CareerApplication["status"][] = ["PENDING", "UNDER_REVIEW", "ACCEPTED", "REJECTED"];

function ApplicationCard({ app, currentAdminEmail, isFounder }: { app: CareerApplication & { department: string }, currentAdminEmail: string, isFounder: boolean }) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== "idle";

  function handleStatusChange(status: CareerApplication["status"]) {
    fetcher.submit({ intent: "update_status", id: app.id, status }, { method: "post" });
  }

  const dateStr = formatInIST(app.submitted_at);

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div className={styles.cardHeadLeft}>
          <span className={styles.listingId}>{app.listing_id} • {app.department}</span>
          <span className={styles.roleTag}>{app.role_title}</span>
        </div>
        <span className={`${styles.statusBadge} ${styles[`status_${app.status}`]}`}>
          {app.status}
        </span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.applicantInfo}>
          <p className={styles.applicantName}>{app.display_name}</p>
          <p className={styles.applicantEmail}>{app.email}</p>
          <p className={styles.applicantDate}>Submitted: {dateStr}</p>
        </div>

        <div className={styles.links}>
          {app.linkedin_handle && (
            <a href={ensureLinkedinUrl(app.linkedin_handle)}
              target="_blank" rel="noreferrer" className={styles.link}>LinkedIn ↗</a>
          )}
          {app.github_handle && (
            <a href={ensureGithubUrl(app.github_handle)}
              target="_blank" rel="noreferrer" className={styles.link}>GitHub ↗</a>
          )}
          {app.resume_link && (
            <a href={app.resume_link} target="_blank" rel="noreferrer" className={styles.link}>Resume ↗</a>
          )}
          {app.portfolio_url && (
            <a href={app.portfolio_url.startsWith("http") ? app.portfolio_url : `https://${app.portfolio_url}`}
              target="_blank" rel="noreferrer" className={styles.link}>Portfolio ↗</a>
          )}
        </div>
      </div>

      <div className={styles.cardActions}>
        <div className={styles.statusRow}>
          <span className={styles.metaLabel}>STATUS</span>
          <div className={styles.statusBtns}>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className={classnames(styles.statusBtn, app.status === s && styles.statusBtnActive)}
                data-status={s}
                onClick={() => handleStatusChange(s)}
                disabled={isSubmitting || app.status === s}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.actionRow}>
          {/* Opens full read-only form view in the same tab */}
          <Link
            to={`/admin/career-applications/${app.id}`}
            className={styles.actionBtn}
            prefetch="intent"
          >
            VIEW DETAILS
          </Link>

          <DeleteCareerApplicationControl id={app.id} applicant={app.display_name} isFounder={isFounder} />
        </div>
      </div>
    </div>
  );
}

function DeleteCareerApplicationControl({ id, applicant, isFounder }: { id: string, applicant: string, isFounder: boolean }) {
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
          fetcher.submit({ intent: "DELETE", id }, { method: "post" });
        }}
        title="HARD DELETE JOB APPLICATION"
        message={`Wipe application from ${applicant}? This is permanent.`}
      />
    </>
  );
}

const DEPARTMENTS = ["ENGINEERING", "DESIGN", "MARKETING", "OPERATIONS", "CONTENT", "COMMUNITY", "GENERAL", "OTHER"];

export default function AdminCareerApplications() {
  const { applications, currentAdminEmail, isFounder } = useLoaderData() as AdminCareerAppsLoaderData;
  const nav = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const statusFilter = (searchParams.get("status") || "ALL") as CareerApplication["status"] | "ALL";
  const departmentFilter = searchParams.get("department") || "ALL";

  function setStatusFilter(status: string) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (status === "ALL") next.delete("status");
      else next.set("status", status);
      return next;
    }, { replace: true });
  }

  function setDepartmentFilter(department: string) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (department === "ALL") next.delete("department");
      else next.set("department", department);
      return next;
    }, { replace: true });
  }

  const { filtered, counts, deptCounts } = useMemo(() => {
    // 1. Calculate department counts (based on total)
    const dc: Record<string, number> = {};
    DEPARTMENTS.forEach(d => dc[d] = 0);
    
    // 2. Filter applications based on current selection
    const flt = applications.filter((a) => {
      // While we are here, update department counts
      if (dc[a.department] !== undefined) dc[a.department]++;
      else dc["OTHER"]++;
      
      const statusMatch = statusFilter === "ALL" || a.status === statusFilter;
      const deptMatch = departmentFilter === "ALL" || a.department === departmentFilter;
      return statusMatch && deptMatch;
    });

    // 3. Calculate status counts (based on current department selection)
    const sc: Record<string, number> = {};
    STATUS_OPTIONS.forEach(s => sc[s] = 0);
    
    // We need status counts specifically for the currently selected department
    // to match the user's expectation of "Pending (10)" inside "Engineering"
    applications.forEach(a => {
      if (departmentFilter === "ALL" || a.department === departmentFilter) {
        if (sc[a.status] !== undefined) sc[a.status]++;
      }
    });

    return { filtered: flt, counts: sc, deptCounts: dc };
  }, [applications, statusFilter, departmentFilter]);

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>// CAREER APPLICATIONS</h1>
          <p className={styles.pageDesc}>
            {applications.length} total · {counts.PENDING} pending · {counts.ACCEPTED} accepted
          </p>
        </div>
      </div>

      <div className={styles.filterGroup}>
        <span className={styles.filterGroupLabel}>DEPARTMENT:</span>
        <div className={styles.filterRow}>
          {(["ALL", ...DEPARTMENTS] as const).map((d) => {
            const count = d === "ALL" ? applications.length : deptCounts[d];
            if (count === 0 && d !== "ALL") return null; // Hide empty departments
            return (
              <button
                key={d}
                type="button"
                className={classnames(styles.filterBtn, departmentFilter === d && styles.filterBtnActive)}
                onClick={() => setDepartmentFilter(d)}
              >
                {d} {d !== "ALL" && `(${count})`}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.filterGroup}>
        <span className={styles.filterGroupLabel}>STATUS:</span>
        <div className={styles.filterRow}>
          {(["ALL", ...STATUS_OPTIONS] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={classnames(styles.filterBtn, statusFilter === s && styles.filterBtnActive)}
              onClick={() => setStatusFilter(s)}
            >
              {s} {s !== "ALL" && `(${counts[s] ?? 0})`}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>NO APPLICATIONS</p>
          <p className={styles.emptyDesc}>
            No applications found matching the selected filters.
          </p>
        </div>
      )}

      <div className={styles.grid}>
        {filtered.map((app) => (
          <ApplicationCard key={app.id} app={app} currentAdminEmail={currentAdminEmail} isFounder={isFounder} />
        ))}
      </div>
    </div>
  );
}
