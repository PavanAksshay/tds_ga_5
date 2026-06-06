import { useLoaderData, useSearchParams, Form, useNavigation } from "react-router";
import { useState } from "react";
import { 
  Lightbulb, 
  User, 
  Calendar, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Archive,
  ExternalLink,
  Target,
  Code
} from "lucide-react";
import type { Route } from "./+types/ideas";
import { requireAdmin, writeAuditLog } from "../../services/admin.server";
import { getAllProjectIdeasAdmin, updateProjectIdeaStatus } from "../../services/ideas.server";
import styles from "./ideas.module.css";
import classnames from "classnames";
import { toAbsoluteUrl } from "~/lib/utils";

export async function loader({ request }: Route.LoaderArgs) {
  const headers = new Headers();
  await requireAdmin(request, headers);
  const ideas = await getAllProjectIdeasAdmin(request, headers);
  return Response.json({ ideas }, { headers });
}

export async function action({ request }: Route.ActionArgs) {
  const headers = new Headers();
  const { user } = await requireAdmin(request, headers);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const ideaId = formData.get("ideaId") as string;
  const newStatus = formData.get("status") as string;
  const notes = formData.get("notes") as string;

  if (intent === "update_status") {
    await updateProjectIdeaStatus(request, headers, ideaId, newStatus, notes);
    await writeAuditLog(request, headers, user.id, user.email ?? "", `IDEA_STATUS_${newStatus}`, "project_idea", ideaId, { notes });
  }

  return Response.json({ ok: true }, { headers });
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "var(--color-on-surface-muted)",
  SELECTED: "#4ade80",
  REJECTED: "#ff5555",
  ARCHIVED: "var(--color-on-surface-subtle)",
};

function IdeaCard({ idea }: { idea: any }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(idea.admin_notes || "");
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const statusColor = STATUS_COLORS[idea.status] || "var(--color-on-surface-muted)";

  return (
    <div className={classnames(styles.ideaCard, expanded && styles.ideaCardExpanded)}>
      <div className={styles.cardHeader} onClick={() => setExpanded(!expanded)}>
        <div className={styles.headerMain}>
          <div className={styles.titleArea}>
            <Lightbulb size={16} color={statusColor} />
            <h3 className={styles.ideaTitle}>{idea.title}</h3>
            <span className={styles.statusBadge} style={{ color: statusColor, borderColor: statusColor }}>
              {idea.status}
            </span>
          </div>
          <p className={styles.ideaTagline}>{idea.tagline}</p>
        </div>
        <div className={styles.headerMeta}>
          <div className={styles.userBrief}>
            <span className={styles.userName}>{idea.profiles.display_name || "Unknown User"}</span>
            <span className={styles.userEmail}>{idea.profiles.email}</span>
          </div>
          <div className={styles.dateBrief}>
            <Calendar size={12} />
            <span>{new Date(idea.created_at).toLocaleDateString()}</span>
          </div>
          <span className={styles.toggleIcon}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className={styles.cardBody}>
          <div className={styles.detailSection}>
            <h4 className={styles.sectionHeading}><MessageSquare size={14} /> DESCRIPTION & PROBLEM</h4>
            <p className={styles.longText}>{idea.description}</p>
          </div>

          {idea.technical_details && (
            <div className={styles.detailSection}>
              <h4 className={styles.sectionHeading}><Code size={14} /> TECHNICAL IMPLEMENTATION</h4>
              <p className={styles.longText}>{idea.technical_details}</p>
            </div>
          )}

          <div className={styles.infoGrid}>
            <div className={styles.infoCol}>
              <h4 className={styles.sectionHeading}><Target size={14} /> TARGET AUDIENCE</h4>
              <p>{idea.target_audience || "Not specified"}</p>
            </div>
            <div className={styles.infoCol}>
              <h4 className={styles.sectionHeading}><CheckCircle size={14} /> HELP NEEDED</h4>
              <div className={styles.helpList}>
                {idea.team_help && <span>• Team Building</span>}
                {idea.product_help && <span>• Product Strategy</span>}
                {idea.advice_help && <span>• Technical Advice</span>}
                {idea.traction_help && <span>• Traction & Shipping</span>}
              </div>
            </div>
            <div className={styles.infoCol}>
              <h4 className={styles.sectionHeading}><Code size={14} /> TECH STACK</h4>
              <div className={styles.tagGrid}>
                {idea.tech_stack?.map((tag: string) => (
                  <span key={tag} className={styles.techTag}>{tag}</span>
                )) || "None"}
              </div>
            </div>
          </div>

          <div className={styles.adminActionSection}>
            <div className={styles.submitterSection}>
              <h4 className={styles.sectionHeading}><User size={14} /> SUBMITTER PROFILE</h4>
              <div className={styles.submitterLinks}>
                <a href={`/admin/members?id=${idea.user_id}`} target="_blank" rel="noreferrer" className={styles.profileLink}>
                  View Database Profile <ExternalLink size={12} />
                </a>
                {idea.profiles.github_handle && (
                  <a href={toAbsoluteUrl(idea.profiles.github_handle)} target="_blank" rel="noreferrer" className={styles.profileLink}>
                    GitHub <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>

            <Form method="post" className={styles.adminForm}>
              <input type="hidden" name="intent" value="update_status" />
              <input type="hidden" name="ideaId" value={idea.id} />
              
              <div className={styles.notesField}>
                <label>ADMIN INTERNAL NOTES</label>
                <textarea 
                  name="notes" 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Private thoughts on feasibility..."
                />
              </div>

              <div className={styles.actionButtons}>
                <button 
                  type="submit" 
                  name="status" 
                  value="SELECTED" 
                  className={styles.selectBtn}
                  disabled={isSubmitting}
                >
                  <CheckCircle size={14} /> SELECT IDEA
                </button>
                <button 
                  type="submit" 
                  name="status" 
                  value="REJECTED" 
                  className={styles.rejectBtn}
                  disabled={isSubmitting}
                >
                  <XCircle size={14} /> REJECT
                </button>
                <button 
                  type="submit" 
                  name="status" 
                  value="ARCHIVED" 
                  className={styles.archiveBtn}
                  disabled={isSubmitting}
                >
                  <Archive size={14} /> ARCHIVE
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminIdeas() {
  const data = useLoaderData<typeof loader>() as { ideas: any[] };
  const ideas = data.ideas || [];

  return (
    <div className={styles.adminContainer}>
      <div className={styles.header}>
        <h1 className={styles.adminTitle}>PROJECT_IDEAS_QUEUE</h1>
        <p className={styles.adminSubtitle}>{ideas.length} submissions pending review</p>
      </div>

      <div className={styles.ideasGrid}>
        {ideas.length === 0 ? (
          <div className={styles.emptyState}>NO IDEAS SUBMITTED YET.</div>
        ) : (
          ideas.map((idea: any) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))
        )}
      </div>
    </div>
  );
}

