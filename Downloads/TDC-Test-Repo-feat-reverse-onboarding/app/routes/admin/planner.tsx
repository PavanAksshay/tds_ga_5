import { useEffect, useRef, useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  X,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  Flag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import classnames from "classnames";
import type { Route } from "./+types/planner";
import { requireAdmin, writeAuditLog } from "../../services/admin.server";
import {
  getPlannerBoard,
  getAssignableMembers,
  createPlannerProject,
  updatePlannerProject,
  deletePlannerProject,
  createPlannerMilestone,
  updatePlannerMilestone,
  deletePlannerMilestone,
  parseMembersField,
  type PlannerProject,
  type PlannerMilestone,
  type PlannerMember,
  type PlannerStatus,
  type PlannerPriority,
  type AssignableMember,
} from "../../services/planner.server";
import styles from "./planner.module.css";

export function meta() {
  return [
    { title: "Planner | The Developer Community" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const headers = new Headers();
  await requireAdmin(request, headers);
  const [projects, members] = await Promise.all([getPlannerBoard(), getAssignableMembers()]);
  return Response.json({ projects, members }, { headers });
}

function isoFromInput(value: FormDataEntryValue | null): string | null {
  if (!value || typeof value !== "string" || value.trim() === "") return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export async function action({ request }: Route.ActionArgs) {
  const headers = new Headers();
  const { user } = await requireAdmin(request, headers);
  const form = await request.formData();
  const intent = form.get("intent") as string;

  const str = (k: string) => (form.get(k) as string) || "";
  const audit = (a: string, type: string, id?: string, details?: Record<string, unknown>) =>
    writeAuditLog(request, headers, user.id, user.email ?? "", a, type, id, details);

  let result: { error?: string } = {};

  switch (intent) {
    case "create_project": {
      result = await createPlannerProject(
        {
          title: str("title").trim(),
          description: str("description").trim() || null,
          status: str("status") as PlannerStatus,
          deadline: isoFromInput(form.get("deadline")),
          members: parseMembersField(form.get("members")),
        },
        user.id
      );
      if (!result.error) await audit("PLANNER_PROJECT_CREATE", "planner_project", undefined, { title: str("title") });
      break;
    }
    case "update_project": {
      result = await updatePlannerProject(str("projectId"), {
        title: str("title").trim(),
        description: str("description").trim() || null,
        status: str("status") as PlannerStatus,
        deadline: isoFromInput(form.get("deadline")),
        members: parseMembersField(form.get("members")),
      });
      if (!result.error) await audit("PLANNER_PROJECT_UPDATE", "planner_project", str("projectId"));
      break;
    }
    case "set_project_status": {
      result = await updatePlannerProject(str("projectId"), { status: str("status") as PlannerStatus });
      if (!result.error) await audit("PLANNER_PROJECT_STATUS", "planner_project", str("projectId"), { status: str("status") });
      break;
    }
    case "delete_project": {
      result = await deletePlannerProject(str("projectId"));
      if (!result.error) await audit("PLANNER_PROJECT_DELETE", "planner_project", str("projectId"));
      break;
    }
    case "create_milestone": {
      result = await createPlannerMilestone({
        project_id: str("projectId"),
        title: str("title").trim(),
        description: str("description").trim() || null,
        status: str("status") as PlannerStatus,
        priority: str("priority") as PlannerPriority,
        deadline: isoFromInput(form.get("deadline")),
        assignees: parseMembersField(form.get("assignees")),
      });
      if (!result.error) await audit("PLANNER_MILESTONE_CREATE", "planner_milestone", undefined, { projectId: str("projectId"), title: str("title") });
      break;
    }
    case "update_milestone": {
      result = await updatePlannerMilestone(str("milestoneId"), {
        title: str("title").trim(),
        description: str("description").trim() || null,
        status: str("status") as PlannerStatus,
        priority: str("priority") as PlannerPriority,
        deadline: isoFromInput(form.get("deadline")),
        assignees: parseMembersField(form.get("assignees")),
      });
      if (!result.error) await audit("PLANNER_MILESTONE_UPDATE", "planner_milestone", str("milestoneId"));
      break;
    }
    case "set_milestone_status": {
      result = await updatePlannerMilestone(str("milestoneId"), { status: str("status") as PlannerStatus });
      if (!result.error) await audit("PLANNER_MILESTONE_STATUS", "planner_milestone", str("milestoneId"), { status: str("status") });
      break;
    }
    case "delete_milestone": {
      result = await deletePlannerMilestone(str("milestoneId"));
      if (!result.error) await audit("PLANNER_MILESTONE_DELETE", "planner_milestone", str("milestoneId"));
      break;
    }
    default:
      result = { error: "Unknown action" };
  }

  return Response.json(result, { headers });
}

// ---------- UI constants ----------

const STATUS_META: Record<PlannerStatus, { label: string; color: string }> = {
  PENDING: { label: "TO DO", color: "#7a7a78" },
  IN_PROGRESS: { label: "IN PROGRESS", color: "#f59e0b" },
  COMPLETED: { label: "DONE", color: "#4ade80" },
};

const PRIORITY_META: Record<PlannerPriority, { label: string; color: string }> = {
  LOW: { label: "LOW", color: "#7a7a78" },
  MEDIUM: { label: "MED", color: "#60a5fa" },
  HIGH: { label: "HIGH", color: "#ff5555" },
};

const STATUS_ORDER: PlannerStatus[] = ["PENDING", "IN_PROGRESS", "COMPLETED"];

function toInputDateTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDeadline(iso: string | null): { text: string; overdue: boolean } | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const overdue = d.getTime() < Date.now();
  return {
    text: d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    overdue,
  };
}

// ---------- Member picker ----------

function MemberPicker({
  members,
  selected,
  onChange,
  fieldName,
}: {
  members: AssignableMember[];
  selected: PlannerMember[];
  onChange: (next: PlannerMember[]) => void;
  fieldName: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const toggle = (m: AssignableMember) => {
    const exists = selected.some((s) => s.id === m.id);
    onChange(exists ? selected.filter((s) => s.id !== m.id) : [...selected, { id: m.id, name: m.name }]);
  };

  return (
    <div className={styles.memberPicker} ref={ref}>
      <input type="hidden" name={fieldName} value={JSON.stringify(selected)} />
      <button type="button" className={styles.memberPickerBtn} onClick={() => setOpen((o) => !o)}>
        <Users size={12} />
        <span>{selected.length === 0 ? "Assign members" : `${selected.length} assigned`}</span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {selected.length > 0 && (
        <div className={styles.memberChips}>
          {selected.map((s) => (
            <span key={s.id} className={styles.memberChip}>
              {s.name}
              <button type="button" onClick={() => onChange(selected.filter((x) => x.id !== s.id))}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
      {open && (
        <div className={styles.memberDropdown}>
          {members.length === 0 && <div className={styles.memberEmpty}>No members found</div>}
          {members.map((m) => {
            const checked = selected.some((s) => s.id === m.id);
            return (
              <label key={m.id} className={styles.memberOption}>
                <input type="checkbox" checked={checked} onChange={() => toggle(m)} />
                <span className={styles.memberOptName}>{m.name}</span>
                {m.email && <span className={styles.memberOptEmail}>{m.email}</span>}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Milestone form (create / edit) ----------

function MilestoneForm({
  projectId,
  members,
  milestone,
  defaultStatus,
  onDone,
}: {
  projectId: string;
  members: AssignableMember[];
  milestone?: PlannerMilestone;
  defaultStatus?: PlannerStatus;
  onDone: () => void;
}) {
  const fetcher = useFetcher();
  const isEdit = !!milestone;
  const [assignees, setAssignees] = useState<PlannerMember[]>(milestone?.assignees ?? []);
  const busy = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data && !(fetcher.data as any).error) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state, fetcher.data]);

  return (
    <fetcher.Form method="post" className={styles.inlineForm}>
      <input type="hidden" name="intent" value={isEdit ? "update_milestone" : "create_milestone"} />
      {isEdit ? (
        <input type="hidden" name="milestoneId" value={milestone!.id} />
      ) : (
        <input type="hidden" name="projectId" value={projectId} />
      )}
      <input
        className={styles.input}
        name="title"
        placeholder="Milestone title"
        defaultValue={milestone?.title ?? ""}
        required
      />
      <textarea
        className={styles.textarea}
        name="description"
        placeholder="What needs to be done before the deadline?"
        defaultValue={milestone?.description ?? ""}
        rows={2}
      />
      <div className={styles.formRow}>
        <label className={styles.fieldLabel}>
          STATUS
          <select className={styles.select} name="status" defaultValue={milestone?.status ?? defaultStatus ?? "PENDING"}>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </select>
        </label>
        <label className={styles.fieldLabel}>
          PRIORITY
          <select className={styles.select} name="priority" defaultValue={milestone?.priority ?? "MEDIUM"}>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>
        </label>
        <label className={styles.fieldLabel}>
          DEADLINE
          <input className={styles.select} type="datetime-local" name="deadline" defaultValue={toInputDateTime(milestone?.deadline ?? null)} />
        </label>
      </div>
      <MemberPicker members={members} selected={assignees} onChange={setAssignees} fieldName="assignees" />
      <div className={styles.formActions}>
        <button type="submit" className={styles.primaryBtn} disabled={busy}>
          {busy ? "..." : isEdit ? "SAVE" : "ADD MILESTONE"}
        </button>
        <button type="button" className={styles.ghostBtn} onClick={onDone}>CANCEL</button>
      </div>
    </fetcher.Form>
  );
}

// ---------- Milestone card ----------

function MilestoneCard({ milestone, members }: { milestone: PlannerMilestone; members: AssignableMember[] }) {
  const fetcher = useFetcher();
  const [editing, setEditing] = useState(false);
  const deadline = formatDeadline(milestone.deadline);
  const prio = PRIORITY_META[milestone.priority];

  if (editing) {
    return (
      <div className={styles.milestoneCard}>
        <MilestoneForm projectId={milestone.project_id} members={members} milestone={milestone} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className={styles.milestoneCard}>
      <div className={styles.milestoneTop}>
        <span className={styles.priorityBadge} style={{ color: prio.color, borderColor: prio.color }}>
          <Flag size={9} /> {prio.label}
        </span>
        <div className={styles.milestoneActions}>
          <button className={styles.iconBtn} title="Edit" onClick={() => setEditing(true)}><Edit2 size={12} /></button>
          <fetcher.Form method="post" onSubmit={(e) => { if (!confirm("Delete this milestone?")) e.preventDefault(); }}>
            <input type="hidden" name="intent" value="delete_milestone" />
            <input type="hidden" name="milestoneId" value={milestone.id} />
            <button className={styles.iconBtn} title="Delete" type="submit"><Trash2 size={12} /></button>
          </fetcher.Form>
        </div>
      </div>
      <h4 className={styles.milestoneTitle}>{milestone.title}</h4>
      {milestone.description && <p className={styles.milestoneDesc}>{milestone.description}</p>}
      <div className={styles.milestoneMeta}>
        {deadline && (
          <span className={classnames(styles.metaPill, deadline.overdue && milestone.status !== "COMPLETED" && styles.overdue)}>
            <Calendar size={10} /> {deadline.text}
          </span>
        )}
        {milestone.assignees.length > 0 && (
          <span className={styles.metaPill}><Users size={10} /> {milestone.assignees.map((a) => a.name).join(", ")}</span>
        )}
      </div>
      <fetcher.Form method="post" className={styles.moveRow}>
        <input type="hidden" name="intent" value="set_milestone_status" />
        <input type="hidden" name="milestoneId" value={milestone.id} />
        {STATUS_ORDER.filter((s) => s !== milestone.status).map((s) => (
          <button key={s} type="submit" name="status" value={s} className={styles.moveBtn} style={{ color: STATUS_META[s].color }}>
            → {STATUS_META[s].label}
          </button>
        ))}
      </fetcher.Form>
    </div>
  );
}

// ---------- Project form (create / edit) ----------

function ProjectForm({
  members,
  project,
  onDone,
}: {
  members: AssignableMember[];
  project?: PlannerProject;
  onDone: () => void;
}) {
  const fetcher = useFetcher();
  const isEdit = !!project;
  const [team, setTeam] = useState<PlannerMember[]>(project?.members ?? []);
  const busy = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data && !(fetcher.data as any).error) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state, fetcher.data]);

  return (
    <fetcher.Form method="post" className={styles.inlineForm}>
      <input type="hidden" name="intent" value={isEdit ? "update_project" : "create_project"} />
      {isEdit && <input type="hidden" name="projectId" value={project!.id} />}
      <input className={styles.input} name="title" placeholder="Project name" defaultValue={project?.title ?? ""} required />
      <textarea
        className={styles.textarea}
        name="description"
        placeholder="Project goal / description"
        defaultValue={project?.description ?? ""}
        rows={2}
      />
      <div className={styles.formRow}>
        <label className={styles.fieldLabel}>
          STATUS
          <select className={styles.select} name="status" defaultValue={project?.status ?? "PENDING"}>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </select>
        </label>
        <label className={styles.fieldLabel}>
          DEADLINE
          <input className={styles.select} type="datetime-local" name="deadline" defaultValue={toInputDateTime(project?.deadline ?? null)} />
        </label>
      </div>
      <MemberPicker members={members} selected={team} onChange={setTeam} fieldName="members" />
      <div className={styles.formActions}>
        <button type="submit" className={styles.primaryBtn} disabled={busy}>
          {busy ? "..." : isEdit ? "SAVE PROJECT" : "CREATE PROJECT"}
        </button>
        <button type="button" className={styles.ghostBtn} onClick={onDone}>CANCEL</button>
      </div>
    </fetcher.Form>
  );
}

// ---------- Project card ----------

function ProjectCard({ project, members }: { project: PlannerProject; members: AssignableMember[] }) {
  const fetcher = useFetcher();
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [addingMilestone, setAddingMilestone] = useState(false);

  const deadline = formatDeadline(project.deadline);
  const total = project.milestones.length;
  const done = project.milestones.filter((m) => m.status === "COMPLETED").length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const status = STATUS_META[project.status];

  return (
    <div className={styles.projectCard}>
      <div className={styles.projectHeader}>
        <button className={styles.expandToggle} onClick={() => setExpanded((e) => !e)}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <div className={styles.projectHeaderMain}>
          <div className={styles.projectTitleRow}>
            <h2 className={styles.projectTitle}>{project.title}</h2>
            <span className={styles.statusBadge} style={{ color: status.color, borderColor: status.color }}>
              {status.label}
            </span>
          </div>
          {project.description && <p className={styles.projectDesc}>{project.description}</p>}
          <div className={styles.projectMeta}>
            {deadline && (
              <span className={classnames(styles.metaPill, deadline.overdue && project.status !== "COMPLETED" && styles.overdue)}>
                <Clock size={10} /> {deadline.text}
              </span>
            )}
            <span className={styles.metaPill}><CheckCircle2 size={10} /> {done}/{total} done</span>
            {project.members.length > 0 && (
              <span className={styles.metaPill}><Users size={10} /> {project.members.map((m) => m.name).join(", ")}</span>
            )}
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className={styles.projectActions}>
          <fetcher.Form method="post">
            <input type="hidden" name="intent" value="set_project_status" />
            <input type="hidden" name="projectId" value={project.id} />
            <select
              className={styles.statusSelect}
              name="status"
              defaultValue={project.status}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </select>
          </fetcher.Form>
          <button className={styles.iconBtn} title="Edit project" onClick={() => setEditing((v) => !v)}><Edit2 size={14} /></button>
          <fetcher.Form method="post" onSubmit={(e) => { if (!confirm("Delete this project and all its milestones?")) e.preventDefault(); }}>
            <input type="hidden" name="intent" value="delete_project" />
            <input type="hidden" name="projectId" value={project.id} />
            <button className={styles.iconBtn} title="Delete project" type="submit"><Trash2 size={14} /></button>
          </fetcher.Form>
        </div>
      </div>

      {editing && (
        <div className={styles.editPanel}>
          <ProjectForm members={members} project={project} onDone={() => setEditing(false)} />
        </div>
      )}

      {expanded && (
        <div className={styles.projectBody}>
          <div className={styles.board}>
            {STATUS_ORDER.map((col) => {
              const items = project.milestones.filter((m) => m.status === col);
              return (
                <div key={col} className={styles.column}>
                  <div className={styles.columnHeader}>
                    <span className={styles.columnDot} style={{ background: STATUS_META[col].color }} />
                    <span>{STATUS_META[col].label}</span>
                    <span className={styles.columnCount}>{items.length}</span>
                  </div>
                  <div className={styles.columnBody}>
                    {items.map((m) => (
                      <MilestoneCard key={m.id} milestone={m} members={members} />
                    ))}
                    {items.length === 0 && <div className={styles.columnEmpty}>—</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {addingMilestone ? (
            <div className={styles.addMilestonePanel}>
              <MilestoneForm projectId={project.id} members={members} onDone={() => setAddingMilestone(false)} />
            </div>
          ) : (
            <button className={styles.addMilestoneBtn} onClick={() => setAddingMilestone(true)}>
              <Plus size={14} /> NEW MILESTONE
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Page ----------

export default function AdminPlanner() {
  const { projects, members } = useLoaderData<typeof loader>() as {
    projects: PlannerProject[];
    members: AssignableMember[];
  };
  const [creating, setCreating] = useState(false);

  const totalMilestones = projects.reduce((acc, p) => acc + p.milestones.length, 0);

  return (
    <div className={styles.adminContainer}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.adminTitle}><Target size={20} /> PLANNER</h1>
          <p className={styles.adminSubtitle}>
            {projects.length} projects · {totalMilestones} milestones
          </p>
        </div>
        <button className={styles.newProjectBtn} onClick={() => setCreating((v) => !v)}>
          <Plus size={14} /> NEW PROJECT
        </button>
      </div>

      {creating && (
        <div className={styles.createPanel}>
          <ProjectForm members={members} onDone={() => setCreating(false)} />
        </div>
      )}

      <div className={styles.projectList}>
        {projects.length === 0 ? (
          <div className={styles.emptyState}>
            No projects yet. Create one to start planning milestones and deadlines.
          </div>
        ) : (
          projects.map((p) => <ProjectCard key={p.id} project={p} members={members} />)
        )}
      </div>
    </div>
  );
}
