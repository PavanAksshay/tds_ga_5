import { useLoaderData, useFetcher, useNavigation } from "react-router";
import { requireAdmin, writeAuditLog } from "../../services/admin.server";
import {
  getAllCareersAdmin,
  createCareer,
  updateCareer,
  deleteCareer,
  type CareerListing,
} from "../../services/careers.server";
import { useState } from "react";
import { Eye, EyeOff, Trash2, Plus, ChevronDown, ChevronUp, Edit2 } from "lucide-react";
import { CareerEditorModal } from "../../blocks/admin/career-editor-modal";
import styles from "./careers.module.css";

const STATUSES: CareerListing["status"][] = ["OPEN", "PAUSED", "CLOSED"];

interface AdminCareersLoaderData {
  listings: CareerListing[];
}

export async function loader({ request }: { request: Request }): Promise<Response> {
  const headers = new Headers();
  await requireAdmin(request, headers);
  const listings = await getAllCareersAdmin(request, headers);
  return Response.json({ listings } satisfies AdminCareersLoaderData, { headers });
}

export async function action({ request }: { request: Request }): Promise<Response> {
  const headers = new Headers();
  const { user } = await requireAdmin(request, headers);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "create" || intent === "update") {
    const payload = JSON.parse(formData.get("career") as string) as CareerListing;
    
    let result;
    if (intent === "create") {
      result = await createCareer(request, headers, payload, user.id);
      if (!result.error) {
        await writeAuditLog(request, headers, user.id, user.email ?? "", "CREATE_CAREER", "career_listing", payload.id);
      }
    } else {
      result = await updateCareer(request, headers, payload.id, payload);
      if (!result.error) {
        await writeAuditLog(request, headers, user.id, user.email ?? "", "UPDATE_CAREER", "career_listing", payload.id);
      }
    }

    if (result.error) return Response.json({ error: result.error }, { headers, status: 400 });
    return Response.json({ ok: true }, { headers });
  }

  if (intent === "toggle_publish") {
    const listingId = formData.get("listingId") as string;
    const isPublished = formData.get("is_published") === "true";
    const result = await updateCareer(request, headers, listingId, { is_published: isPublished });
    if (!result.error) {
      await writeAuditLog(request, headers, user.id, user.email ?? "", isPublished ? "PUBLISH_CAREER" : "UNPUBLISH_CAREER", "career_listing", listingId);
    }
    return Response.json({ ok: true }, { headers });
  }

  if (intent === "toggle_status") {
    const listingId = formData.get("listingId") as string;
    const status = formData.get("status") as CareerListing["status"];
    const result = await updateCareer(request, headers, listingId, { status });
    if (!result.error) {
      await writeAuditLog(request, headers, user.id, user.email ?? "", `SET_CAREER_STATUS_${status}`, "career_listing", listingId);
    }
    return Response.json({ ok: true }, { headers });
  }

  if (intent === "delete") {
    const listingId = formData.get("listingId") as string;
    const result = await deleteCareer(request, headers, listingId);
    if (!result.error) {
      await writeAuditLog(request, headers, user.id, user.email ?? "", "DELETE_CAREER", "career_listing", listingId);
    }
    return Response.json({ ok: true }, { headers });
  }

  return Response.json({ ok: true }, { headers });
}

function ListingCard({ 
  listing, 
  onEdit 
}: { 
  listing: CareerListing; 
  onEdit: (l: CareerListing) => void 
}) {
  const fetcher = useFetcher();
  const [expanded, setExpanded] = useState(false);
  const isSubmitting = fetcher.state !== "idle";

  function handlePublishToggle() {
    fetcher.submit(
      { intent: "toggle_publish", listingId: listing.id, is_published: String(!listing.is_published) },
      { method: "post" }
    );
  }

  function handleDelete() {
    if (!confirm(`Delete "${listing.title}"? This cannot be undone.`)) return;
    fetcher.submit({ intent: "delete", listingId: listing.id }, { method: "post" });
  }

  function handleStatusChange(status: string) {
    fetcher.submit({ intent: "toggle_status", listingId: listing.id, status }, { method: "post" });
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div className={styles.cardHeadLeft}>
          <span className={styles.listingId}>{listing.id}</span>
          <span className={styles.deptBadge}>{listing.department}</span>
        </div>
        <div className={styles.cardHeadRight}>
          <span className={styles.statusBadge} data-status={listing.status}>{listing.status}</span>
          <span className={`${styles.publishBadge} ${listing.is_published ? styles.publishBadgeLive : styles.publishBadgeDraft}`}>
            {listing.is_published ? "LIVE" : "DRAFT"}
          </span>
        </div>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.listingTitle}>{listing.title}</h3>
        <p className={styles.listingTagline}>{listing.tagline}</p>
        <div className={styles.listingMeta}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>COMMITMENT</span>
            <span>{listing.commitment}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>LOCATION</span>
            <span>{listing.location_type}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>ROLES</span>
            <span>{listing.roles.length} defined</span>
          </div>
        </div>

        {listing.tags.length > 0 && (
          <div className={styles.tagRow}>
            {listing.tags.map((t) => (
              <span key={t} className={styles.tag}>{t}</span>
            ))}
          </div>
        )}

        {expanded && listing.description && (
          <p className={styles.listingDesc}>{listing.description}</p>
        )}
      </div>

      <div className={styles.cardActions}>
        <div className={styles.statusRow}>
          <span className={styles.metaLabel}>CHANGE STATUS</span>
          <div className={styles.statusBtns}>
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                className={`${styles.statusBtn} ${listing.status === s ? styles.statusBtnActive : ""}`}
                data-status={s}
                onClick={() => handleStatusChange(s)}
                disabled={isSubmitting || listing.status === s}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.actionRow}>
          <button type="button" className={styles.actionBtn} onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? "COLLAPSE" : "DETAILS"}
          </button>
          <button type="button" className={styles.actionBtn} onClick={() => onEdit(listing)}>
            <Edit2 size={12} /> EDIT
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${listing.is_published ? styles.actionBtnDanger : styles.actionBtnSuccess}`}
            onClick={handlePublishToggle}
            disabled={isSubmitting}
          >
            {listing.is_published ? <><EyeOff size={12} /> UNPUBLISH</> : <><Eye size={12} /> PUBLISH</>}
          </button>
          <button type="button" className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={handleDelete} disabled={isSubmitting}>
            <Trash2 size={12} /> DELETE
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCareers() {
  const { listings } = useLoaderData() as AdminCareersLoaderData;
  const nav = useNavigation();
  const [editorState, setEditorState] = useState<{ mode: "create" | "edit"; listing: CareerListing | null } | null>(null);
  
  const isLoading = nav.state !== "idle";

  const published = listings.filter((l) => l.is_published);
  const drafts = listings.filter((l) => !l.is_published);

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>// CAREERS</h1>
          <p className={styles.pageDesc}>
            {published.length} live · {drafts.length} draft · {listings.length} total
          </p>
        </div>
        <button
          type="button"
          className={styles.newBtn}
          onClick={() => setEditorState({ mode: "create", listing: null })}
          disabled={isLoading}
        >
          <Plus size={14} /> NEW LISTING
        </button>
      </div>

      {listings.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>NO LISTINGS YET</p>
          <p className={styles.emptyDesc}>Create your first career listing to get started.</p>
        </div>
      )}

      {drafts.length > 0 && (
        <section>
          <p className={styles.sectionLabel}>DRAFTS ({drafts.length})</p>
          <div className={styles.grid}>
            {drafts.map((l) => (
              <ListingCard 
                key={l.id} 
                listing={l} 
                onEdit={(listing) => setEditorState({ mode: "edit", listing })} 
              />
            ))}
          </div>
        </section>
      )}

      {published.length > 0 && (
        <section>
          <p className={styles.sectionLabel}>LIVE LISTINGS ({published.length})</p>
          <div className={styles.grid}>
            {published.map((l) => (
              <ListingCard 
                key={l.id} 
                listing={l} 
                onEdit={(listing) => setEditorState({ mode: "edit", listing })} 
              />
            ))}
          </div>
        </section>
      )}

      {editorState && (
        <CareerEditorModal 
          mode={editorState.mode}
          initial={editorState.listing}
          onClose={() => setEditorState(null)} 
        />
      )}
    </div>
  );
}
