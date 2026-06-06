import { useLoaderData, useFetcher, useNavigation } from "react-router";
import type { Route } from "./+types/projects";
import { requireAdmin, writeAuditLog, getAllApplications } from "../../services/admin.server";
import {
  getAllProjectsAdmin,
  createProject,
  updateProject,
  deleteProject,
  type ProjectPayload,
} from "../../services/projects.server";
import { useState } from "react";
import { ProjectEditorModal } from "../../blocks/admin/project-editor-modal";
import { Eye, EyeOff, Pencil, Trash2, Plus } from "lucide-react";
import styles from "./projects.module.css";

interface AdminProjectsLoaderData {
  projects: ProjectPayload[];
  appCounts: Record<string, number>;
}

export async function loader({ request }: Route.LoaderArgs) {
  const headers = new Headers();
  await requireAdmin(request, headers);
  const [projects, allApps] = await Promise.all([
    getAllProjectsAdmin(request, headers),
    getAllApplications(request, headers),
  ]);
  const appCounts: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const app of (allApps || []) as any[]) {
    appCounts[app.project_id] = (appCounts[app.project_id] ?? 0) + 1;
  }
  return { projects: projects ?? [], appCounts };
}

export async function action({ request }: Route.ActionArgs): Promise<Response> {
  const headers = new Headers();
  const { user } = await requireAdmin(request, headers);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "create" || intent === "update") {
    const projectJson = formData.get("project") as string;
    const payload: ProjectPayload = JSON.parse(projectJson);
    let result: { error?: string };

    if (intent === "create") {
      result = await createProject(request, headers, payload, user.id);
      if (!result.error) {
        await writeAuditLog(request, headers, user.id, user.email ?? "", "CREATE_PROJECT", "project", payload.id);
      }
    } else {
      result = await updateProject(request, headers, payload.id, payload);
      if (!result.error) {
        await writeAuditLog(request, headers, user.id, user.email ?? "", "UPDATE_PROJECT", "project", payload.id);
      }
    }
    if (result.error) return Response.json({ error: result.error }, { headers, status: 400 });
    return Response.json({ ok: true }, { headers });
  }

  if (intent === "toggle_publish") {
    const projectId = formData.get("projectId") as string;
    const isPublished = formData.get("is_published") === "true";
    const result = await updateProject(request, headers, projectId, { is_published: isPublished });
    if (!result.error) {
      await writeAuditLog(request, headers, user.id, user.email ?? "", isPublished ? "PUBLISH_PROJECT" : "UNPUBLISH_PROJECT", "project", projectId);
    }
    return Response.json({ ok: true }, { headers });
  }

  if (intent === "toggle_status") {
    const projectId = formData.get("projectId") as string;
    const status = formData.get("status") as string;
    const result = await updateProject(request, headers, projectId, { status: status as ProjectPayload["status"] });
    if (!result.error) {
      await writeAuditLog(request, headers, user.id, user.email ?? "", `SET_STATUS_${status}`, "project", projectId);
    }
    return Response.json({ ok: true }, { headers });
  }

  if (intent === "delete") {
    const projectId = formData.get("projectId") as string;
    const result = await deleteProject(request, headers, projectId);
    if (!result.error) {
      await writeAuditLog(request, headers, user.id, user.email ?? "", "DELETE_PROJECT", "project", projectId);
    }
    return Response.json({ ok: true }, { headers });
  }

  return Response.json({ ok: true }, { headers });
}

const STATUS_OPTIONS: ProjectPayload["status"][] = ["OPEN", "RECRUITING", "IN_PROGRESS", "CLOSED"];

function ProjectCard({ project, appCount }: { project: ProjectPayload; appCount: number }) {
  const fetcher = useFetcher();
  const [editing, setEditing] = useState(false);
  const isSubmitting = fetcher.state !== "idle";

  function handlePublishToggle() {
    fetcher.submit(
      { intent: "toggle_publish", projectId: project.id, is_published: String(!project.is_published) },
      { method: "post" }
    );
  }

  function handleDelete() {
    if (!confirm(`Delete project ${project.id}? This cannot be undone.`)) return;
    fetcher.submit({ intent: "delete", projectId: project.id }, { method: "post" });
  }

  function handleStatusChange(status: string) {
    fetcher.submit({ intent: "toggle_status", projectId: project.id, status }, { method: "post" });
  }

  return (
    <>
      <div className={styles.projectCard}>
        <div className={styles.cardHead}>
          <div className={styles.cardHeadLeft}>
            <span className={styles.projectId}>{project.id}</span>
            <span className={styles.projectTier}>{project.tier}</span>
          </div>
          <div className={styles.cardHeadRight}>
            <span className={styles.projectStatus} data-status={project.status}>{project.status}</span>
            <span className={`${styles.publishBadge} ${project.is_published ? styles.publishBadgeLive : styles.publishBadgeDraft}`}>
              {project.is_published ? "LIVE" : "DRAFT"}
            </span>
          </div>
        </div>

        <div className={styles.cardBody}>
          <h3 className={styles.projectTitle}>{project.title}</h3>
          <p className={styles.projectTagline}>{project.tagline}</p>

          <div className={styles.projectMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>TEAM</span>
              <span>{project.open_slots}/{project.team_size} open</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>APPS</span>
              <span>{appCount} received</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>ROLES</span>
              <span>{project.roles.length} defined</span>
            </div>
          </div>

          <div className={styles.techTags}>
            {project.tech_stack.map((t) => (
              <span key={t.label} className={styles.techTag}>{t.value}</span>
            ))}
          </div>
        </div>

        <div className={styles.cardActions}>
          <div className={styles.statusRow}>
            <span className={styles.metaLabel}>CHANGE STATUS</span>
            <div className={styles.statusBtns}>
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`${styles.statusBtn} ${project.status === s ? styles.statusBtnActive : ""}`}
                  data-status={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={isSubmitting || project.status === s}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.actionRow}>
            <button type="button" className={styles.actionBtn} onClick={() => setEditing(true)} disabled={isSubmitting}>
              <Pencil size={12} /> EDIT
            </button>
            <button
              type="button"
              className={`${styles.actionBtn} ${project.is_published ? styles.actionBtnDanger : styles.actionBtnSuccess}`}
              onClick={handlePublishToggle}
              disabled={isSubmitting}
            >
              {project.is_published ? <><EyeOff size={12} /> UNPUBLISH</> : <><Eye size={12} /> PUBLISH</>}
            </button>
            <button type="button" className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={handleDelete} disabled={isSubmitting}>
              <Trash2 size={12} /> DELETE
            </button>
          </div>
        </div>
      </div>

      {editing && (
        <ProjectEditorModal
          mode="edit"
          initial={project}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}

export default function AdminProjects({ loaderData }: Route.ComponentProps) {
  if (!loaderData) return <div className={styles.root}>ERROR_LOADING_DATA</div>;

  const { projects, appCounts } = loaderData;
  const dbProjects = projects ?? [];
  const navigation = useNavigation();
  const [creating, setCreating] = useState(false);
  const isLoading = navigation.state !== "idle";

  const published = dbProjects.filter((p) => p.is_published);
  const drafts = dbProjects.filter((p) => !p.is_published);

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>// PROJECTS</h1>
          <p className={styles.pageDesc}>
            {published.length} live · {drafts.length} draft · {projects.length} total
          </p>
        </div>
        <button
          type="button"
          className={styles.createBtn}
          onClick={() => setCreating(true)}
          disabled={isLoading}
        >
          <Plus size={14} /> NEW PROJECT
        </button>
      </div>

      {projects.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>NO PROJECTS YET</p>
          <p className={styles.emptyDesc}>Create your first project to get started.</p>
        </div>
      )}

      {drafts.length > 0 && (
        <section>
          <p className={styles.sectionLabel}>DRAFTS ({drafts.length})</p>
          <div className={styles.projectGrid}>
            {drafts.map((p) => (
              <ProjectCard key={p.id} project={p} appCount={appCounts[p.id] ?? 0} />
            ))}
          </div>
        </section>
      )}

      {published.length > 0 && (
        <section>
          <p className={styles.sectionLabel}>LIVE PROJECTS ({published.length})</p>
          <div className={styles.projectGrid}>
            {published.map((p) => (
              <ProjectCard key={p.id} project={p} appCount={appCounts[p.id] ?? 0} />
            ))}
          </div>
        </section>
      )}

      {creating && (
        <ProjectEditorModal
          mode="create"
          initial={null}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  );
}
