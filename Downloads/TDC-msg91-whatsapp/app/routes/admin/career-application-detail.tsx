import { useLoaderData, useNavigate } from "react-router";
import type { CareerApplication } from "../../services/career-applications.server";
import type { CareerListing } from "../../types/careers";
import { formatInIST, toAbsoluteUrl } from "~/lib/utils";
import { ArrowLeft } from "lucide-react";
import styles from "./career-application-detail.module.css";

interface DetailLoaderData {
  application: CareerApplication;
  listing: CareerListing | null;
}

export async function loader({ request, params }: { request: Request; params: Record<string, string> }): Promise<Response> {
  const { requireAdmin } = await import("../../services/admin.server");
  const { getCareerApplicationById } = await import("../../services/career-applications.server");
  const { getCareerById } = await import("../../services/careers.server");

  const headers = new Headers();
  await requireAdmin(request, headers);

  const id = params.id ?? "";
  const application = await getCareerApplicationById(request, headers, id);

  if (!application) {
    throw new Response("Application not found", { status: 404 });
  }

  // Listing fetch is separate but listing_id is in application
  const listing = await getCareerById(request, headers, application.listing_id);

  return Response.json({ application, listing } satisfies DetailLoaderData, { headers });
}

export function meta() {
  return [
    { title: "Application Detail — Admin | TDC" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

/** Parse answer key → { roleId, fieldId } */
function parseAnswerKey(key: string): { roleId: string; fieldId: string } {
  const sep = key.indexOf("__");
  if (sep === -1) return { roleId: "", fieldId: key };
  return { roleId: key.slice(0, sep), fieldId: key.slice(sep + 2) };
}

/** Find the human-readable question label from the listing */
function findLabel(listing: CareerListing | null, roleId: string, fieldId: string): string {
  if (!listing) return fieldId;
  const role = listing.roles.find((r) => r.id === roleId);
  if (!role) return fieldId;
  const field = role.formFields.find((f) => f.id === fieldId);
  return field?.label ?? fieldId;
}

const STATUS_CLASS: Record<string, string> = {
  PENDING: "statusPending",
  UNDER_REVIEW: "statusUnderReview",
  ACCEPTED: "statusAccepted",
  REJECTED: "statusRejected",
};

export default function CareerApplicationDetail() {
  const { application: app, listing } = useLoaderData() as DetailLoaderData;
  const navigate = useNavigate();

  const answers = app.answers ?? {};
  const answerEntries = Object.entries(answers);

  // Group answers by role
  const byRole: Map<string, Array<{ label: string; value: string; fieldId: string }>> = new Map();
  for (const [key, val] of answerEntries) {
    const { roleId, fieldId } = parseAnswerKey(key);
    if (!byRole.has(roleId)) byRole.set(roleId, []);
    byRole.get(roleId)!.push({
      label: findLabel(listing, roleId, fieldId),
      value: String(val),
      fieldId,
    });
  }

  const roleGroups = Array.from(byRole.entries());

  const statusClass = STATUS_CLASS[app.status] ?? "";

  return (
    <div className={styles.root}>
      <div className={styles.backContainer}>
        <button onClick={() => navigate(-1)} className={styles.backBtn} type="button">
          <ArrowLeft size={14} /> BACK TO APPLICATIONS
        </button>
      </div>

      <header className={styles.pageHeader}>
        <div className={styles.headerMeta}>
          <span className={styles.listingTag}>{app.listing_id}</span>
          <span className={styles.roleTag}>{app.role_title}</span>
          <span className={`${styles.statusBadge} ${styles[statusClass]}`}>{app.status}</span>
        </div>
        <h1 className={styles.pageTitle}>APPLICATION DETAIL</h1>
        <p className={styles.pageSubtitle}>
          Read-only view · submitted {formatInIST(app.submitted_at)}
        </p>
      </header>

      {/* Applicant */}
      <section className={styles.section}>
        <p className={styles.sectionLabel}>// APPLICANT INFO</p>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoKey}>NAME</span>
            <span className={styles.infoVal}>{app.display_name}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoKey}>EMAIL</span>
            <span className={styles.infoVal}>{app.email}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoKey}>POSITION</span>
            <span className={styles.infoVal}>{listing?.title ?? app.listing_id}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoKey}>ROLE</span>
            <span className={styles.infoVal}>{app.role_title}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoKey}>SUBMITTED</span>
            <span className={styles.infoVal}>{formatInIST(app.submitted_at)}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoKey}>STATUS</span>
            <span className={`${styles.statusInline} ${styles[statusClass]}`}>{app.status}</span>
          </div>
        </div>
      </section>

      {/* Links */}
      {(app.linkedin_handle || app.github_handle || app.resume_link || app.portfolio_url) && (
        <section className={styles.section}>
          <p className={styles.sectionLabel}>// LINKS</p>
          <div className={styles.links}>
            {app.linkedin_handle && (
              <a
                href={toAbsoluteUrl(app.linkedin_handle)}
                target="_blank"
                rel="noreferrer"
                className={styles.link}
              >
                LinkedIn ↗
              </a>
            )}
            {app.github_handle && (
              <a
                href={toAbsoluteUrl(app.github_handle)}
                target="_blank"
                rel="noreferrer"
                className={styles.link}
              >
                GitHub ↗
              </a>
            )}
            {app.resume_link && (
              <a href={app.resume_link} target="_blank" rel="noreferrer" className={styles.link}>
                Resume ↗
              </a>
            )}
            {app.portfolio_url && (
              <a
                href={app.portfolio_url.startsWith("http") ? app.portfolio_url : `https://${app.portfolio_url}`}
                target="_blank"
                rel="noreferrer"
                className={styles.link}
              >
                Portfolio ↗
              </a>
            )}
          </div>
        </section>
      )}

      {/* Answers */}
      {roleGroups.length > 0 && (
        <section className={styles.section}>
          <p className={styles.sectionLabel}>// APPLICATION FORM RESPONSES</p>
          {roleGroups.map(([roleId, fields]) => {
            const roleName = listing?.roles.find((r) => r.id === roleId)?.title;
            return (
              <div key={roleId} className={styles.roleBlock}>
                {roleName && (
                  <p className={styles.roleBlockLabel}>ROLE: {roleName}</p>
                )}
                <div className={styles.qaList}>
                  {fields.map(({ label, value, fieldId }) => (
                    <div key={fieldId} className={styles.qaItem}>
                      <p className={styles.question}>{label}</p>
                      <p className={styles.answer}>{value || <em className={styles.empty}>— no answer provided —</em>}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {answerEntries.length === 0 && (
        <section className={styles.section}>
          <p className={styles.sectionLabel}>// APPLICATION FORM RESPONSES</p>
          <p className={styles.noAnswers}>No custom answers were submitted for this application.</p>
        </section>
      )}

      {/* Internal notes */}
      {app.internal_notes && (
        <section className={styles.section}>
          <p className={styles.sectionLabel}>// INTERNAL NOTES</p>
          <div className={styles.notesBlock}>
            <p className={styles.notesText}>{app.internal_notes}</p>
          </div>
        </section>
      )}
    </div>
  );
}
