import { useLoaderData, useNavigate } from "react-router";
import type { ProjectPayload } from "../../services/projects.server";
import { formatInIST, toAbsoluteUrl } from "~/lib/utils";
import { ArrowLeft } from "lucide-react";
import styles from "./application-detail.module.css";

type AppRecord = Record<string, unknown>;

interface DetailLoaderData {
  application: AppRecord;
  project: ProjectPayload | null;
}

export async function loader({
  request,
  params,
}: {
  request: Request;
  params: Record<string, string>;
}): Promise<Response> {
  const { requireAdmin } = await import("../../services/admin.server");
  const { createSupabaseAdminClient } = await import("../../lib/supabase.server");
  const { getProjectByIdFromDB } = await import("../../services/projects.server");

  const headers = new Headers();
  await requireAdmin(request, headers);

  const id = params.id ?? "";

  // Fetch the application via admin client (bypasses RLS)
  const adminClient = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: application, error } = await (adminClient as any)
    .from("applications")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !application) {
    throw new Response("Application not found", { status: 404 });
  }

  // Fetch the project so we can resolve field labels
  const project = await getProjectByIdFromDB(request, headers, String(application.project_id ?? ""));

  return Response.json({ application, project } satisfies DetailLoaderData, { headers });
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

/** Resolve a field key to a human-readable label using the project definition */
function findLabel(project: ProjectPayload | null, roleId: string, fieldId: string): string {
  if (!project) return fieldId;
  const role = project.roles.find((r) => r.id === roleId);
  if (!role) return fieldId;
  const field = role.formFields.find((f) => f.id === fieldId);
  return field?.label ?? fieldId;
}

function strOf(v: unknown): string {
  return v != null ? String(v) : "";
}

const STATUS_CLASS: Record<string, string> = {
  PENDING: "statusPending",
  UNDER_REVIEW: "statusUnderReview",
  ACCEPTED: "statusAccepted",
  REJECTED: "statusRejected",
};

export default function AdminApplicationDetail() {
  const { application: app, project } = useLoaderData() as DetailLoaderData;
  const navigate = useNavigate();

  const answers = (app.answers ?? {}) as Record<string, string>;
  const answerEntries = Object.entries(answers);

  // Group answers by role
  const byRole: Map<string, Array<{ label: string; value: string; fieldId: string }>> = new Map();
  for (const [key, val] of answerEntries) {
    const { roleId, fieldId } = parseAnswerKey(key);
    if (!byRole.has(roleId)) byRole.set(roleId, []);
    byRole.get(roleId)!.push({
      label: findLabel(project, roleId, fieldId),
      value: String(val),
      fieldId,
    });
  }

  const roleGroups = Array.from(byRole.entries());
  const statusClass = STATUS_CLASS[strOf(app.status)] ?? "";

  return (
    <div className={styles.root}>
      <div className={styles.backContainer}>
        <button onClick={() => navigate(-1)} className={styles.backBtn} type="button">
          <ArrowLeft size={14} /> BACK TO APPLICATIONS
        </button>
      </div>

      <header className={styles.pageHeader}>
        <div className={styles.headerMeta}>
          <span className={styles.projectTag}>{strOf(app.project_id)}</span>
          <span className={styles.roleTag}>{strOf(app.role_title)}</span>
          <span className={`${styles.statusBadge} ${styles[statusClass]}`}>
            {strOf(app.status)}
          </span>
        </div>
        <h1 className={styles.pageTitle}>APPLICATION DETAIL</h1>
        <p className={styles.pageSubtitle}>
          Read-only view · submitted {formatInIST(strOf(app.submitted_at))}
        </p>
      </header>

      {/* Applicant Info */}
      <section className={styles.section}>
        <p className={styles.sectionLabel}>// APPLICANT INFO</p>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoKey}>NAME</span>
            <span className={styles.infoVal}>{strOf(app.display_name)}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoKey}>EMAIL</span>
            <span className={styles.infoVal}>{strOf(app.email)}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoKey}>PROJECT</span>
            <span className={styles.infoVal}>{project?.title ?? strOf(app.project_id)}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoKey}>ROLE</span>
            <span className={styles.infoVal}>{strOf(app.role_title)}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoKey}>SUBMITTED</span>
            <span className={styles.infoVal}>{formatInIST(strOf(app.submitted_at))}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoKey}>STATUS</span>
            <span className={`${styles.statusInline} ${styles[statusClass]}`}>
              {strOf(app.status)}
            </span>
          </div>
        </div>
      </section>

      {/* Links */}
      {!!(app.linkedin_handle || app.github_handle || app.resume_link || app.portfolio_url) && (
        <section className={styles.section}>
          <p className={styles.sectionLabel}>// LINKS</p>
          <div className={styles.links}>
            {!!app.linkedin_handle && (
              <a href={toAbsoluteUrl(strOf(app.linkedin_handle))} target="_blank" rel="noreferrer" className={styles.link}>
                LinkedIn ↗
              </a>
            )}
            {!!app.github_handle && (
              <a href={toAbsoluteUrl(strOf(app.github_handle))} target="_blank" rel="noreferrer" className={styles.link}>
                GitHub ↗
              </a>
            )}
            {!!app.resume_link && (
              <a href={strOf(app.resume_link)} target="_blank" rel="noreferrer" className={styles.link}>
                Resume ↗
              </a>
            )}
            {!!app.portfolio_url && (
              <a
                href={strOf(app.portfolio_url).startsWith("http") ? strOf(app.portfolio_url) : `https://${strOf(app.portfolio_url)}`}
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

      {/* Application Questions & Answers */}
      {roleGroups.length > 0 && (
        <section className={styles.section}>
          <p className={styles.sectionLabel}>// APPLICATION FORM RESPONSES</p>
          {roleGroups.map(([roleId, fields]) => {
            const roleName = project?.roles.find((r) => r.id === roleId)?.title;
            return (
              <div key={roleId} className={styles.roleBlock}>
                {roleName && (
                  <p className={styles.roleBlockLabel}>ROLE: {roleName}</p>
                )}
                <div className={styles.qaList}>
                  {fields.map(({ label, value, fieldId }) => (
                    <div key={fieldId} className={styles.qaItem}>
                      <p className={styles.question}>{label}</p>
                      <p className={styles.answer}>
                        {value || <em className={styles.empty}>— no answer provided —</em>}
                      </p>
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
      {!!app.internal_notes && (
        <section className={styles.section}>
          <p className={styles.sectionLabel}>// INTERNAL NOTES</p>
          <div className={styles.notesBlock}>
            <p className={styles.notesText}>{strOf(app.internal_notes)}</p>
          </div>
        </section>
      )}
    </div>
  );
}
