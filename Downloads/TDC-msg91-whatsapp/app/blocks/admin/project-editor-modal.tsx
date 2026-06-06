import { useState, useCallback, useEffect } from "react";
import { useFetcher } from "react-router";
import { X, Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import {
  generateProjectId,
  type ProjectPayload,
  type ProjectRole,
  type TechStackItem,
  type TimelineItem,
  type FormField,
  type FormFieldType,
} from "../../types/projects";
import { RichText } from "../../components/rich-text/rich-text";
import styles from "./project-editor-modal.module.css";

interface ProjectEditorModalProps {
  mode: "create" | "edit";
  initial: ProjectPayload | null;
  onClose: () => void;
}

const TIERS: ProjectPayload["tier"][] = ["BEGINNER", "INTERMEDIATE", "FINAL_BOSS", "GOD_MODE", "SPONSORED"];
const STATUSES: ProjectPayload["status"][] = ["OPEN", "RECRUITING", "IN_PROGRESS", "CLOSED", "SHIPPED"];
const TIMELINE_STATUSES: TimelineItem["status"][] = ["SHIPPED", "IN_PROGRESS", "PENDING"];
const FIELD_TYPES: { value: FormFieldType; label: string }[] = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "radio", label: "Single Choice (Radio)" },
  { value: "checkbox", label: "Multiple Choice (Checkbox)" },
  { value: "select", label: "Dropdown (Select)" },
];

function emptyProject(): ProjectPayload {
  return {
    id: generateProjectId(),
    tier: "BEGINNER",
    tier_level: "LVL_01",
    status: "OPEN",
    title: "",
    tagline: "",
    description: "",
    tech_stack: [],
    timeline: [],
    roles: [],
    team_size: 5,
    open_slots: 5,
    tags: [],
    is_published: false,
  };
}

function emptyRole(): ProjectRole {
  return {
    id: `role_${Date.now()}`,
    title: "",
    availability: "5/5",
    locked: false,
    description: "",
    questions: [],
    formFields: [],
  };
}

function emptyField(): FormField {
  return {
    id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: "text",
    label: "",
    required: true,
    options: [],
    placeholder: "",
  };
}

// ── Field editor ──────────────────────────────────────────────────────────────
function FieldEditor({
  field,
  onChange,
  onRemove,
}: {
  field: FormField;
  onChange: (f: FormField) => void;
  onRemove: () => void;
}) {
  const hasOptions = field.type === "radio" || field.type === "checkbox" || field.type === "select";

  function addOption() {
    onChange({ ...field, options: [...(field.options ?? []), ""] });
  }

  function updateOption(i: number, val: string) {
    const opts = [...(field.options ?? [])];
    opts[i] = val;
    onChange({ ...field, options: opts });
  }

  function removeOption(i: number) {
    const opts = (field.options ?? []).filter((_, idx) => idx !== i);
    onChange({ ...field, options: opts });
  }

  return (
    <div className={styles.fieldEditor}>
      <div className={styles.fieldEditorHeader}>
        <GripVertical size={14} className={styles.gripIcon} />
        <select
          className={styles.miniSelect}
          value={field.type}
          onChange={(e) => onChange({ ...field, type: e.target.value as FormFieldType, options: [] })}
        >
          {FIELD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <button type="button" className={styles.iconBtn} onClick={onRemove}><Trash2 size={12} /></button>
      </div>

      <input
        className={styles.fieldInput}
        placeholder="Field label / question"
        value={field.label}
        onChange={(e) => onChange({ ...field, label: e.target.value })}
      />

      {(field.type === "text" || field.type === "textarea") && (
        <input
          className={styles.fieldInput}
          placeholder="Placeholder text (optional)"
          value={field.placeholder ?? ""}
          onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
        />
      )}

      {hasOptions && (
        <div className={styles.optionsBlock}>
          <span className={styles.optionsLabel}>OPTIONS</span>
          {(field.options ?? []).map((opt, i) => (
            <div key={i} className={styles.optionRow}>
              <input
                className={styles.fieldInput}
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
              />
              <button type="button" className={styles.iconBtn} onClick={() => removeOption(i)}><Trash2 size={11} /></button>
            </div>
          ))}
          <button type="button" className={styles.addOptionBtn} onClick={addOption}>
            <Plus size={11} /> Add option
          </button>
        </div>
      )}
    </div>
  );
}

// ── Role editor ──────────────────────────────────────────────────────────────
function RoleEditor({
  role,
  onChange,
  onRemove,
}: {
  role: ProjectRole;
  onChange: (r: ProjectRole) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(true);

  function addField() {
    onChange({ ...role, formFields: [...role.formFields, emptyField()] });
  }

  function updateField(i: number, f: FormField) {
    const fields = [...role.formFields];
    fields[i] = f;
    onChange({ ...role, formFields: fields });
  }

  function removeField(i: number) {
    onChange({ ...role, formFields: role.formFields.filter((_, idx) => idx !== i) });
  }

  return (
    <div className={styles.roleEditor}>
      <div className={styles.roleEditorHeader}>
        <button type="button" className={styles.roleToggle} onClick={() => setOpen((v) => !v)}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span className={styles.roleTitle}>
            <RichText text={role.title || "(Untitled Role)"} />
          </span>
        </button>
        <div className={styles.roleHeadRight}>
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={role.locked}
              onChange={(e) => onChange({ ...role, locked: e.target.checked })}
            />
            Locked
          </label>
          <button type="button" className={styles.iconBtn} onClick={onRemove}><Trash2 size={12} /></button>
        </div>
      </div>

      {open && (
        <div className={styles.roleEditorBody}>
          <div className={styles.fieldRow2}>
            <div className={styles.field}>
              <label className={styles.label}>ROLE TITLE *</label>
              <input className={styles.input} value={role.title} onChange={(e) => onChange({ ...role, title: e.target.value })} placeholder="e.g. Frontend Engineer" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>AVAILABILITY (e.g. 3/5)</label>
              <input className={styles.input} value={role.availability} onChange={(e) => onChange({ ...role, availability: e.target.value })} placeholder="3/5" />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>ROLE DESCRIPTION</label>
            <textarea className={`${styles.input} ${styles.textarea}`} rows={2} value={role.description} onChange={(e) => onChange({ ...role, description: e.target.value })} placeholder="What does this role do?" />
          </div>

          <div className={styles.formFieldsSection}>
            <div className={styles.formFieldsHeader}>
              <span className={styles.sectionSubLabel}>APPLICATION FORM FIELDS ({role.formFields.length})</span>
              <button type="button" className={styles.addFieldBtn} onClick={addField}>
                <Plus size={11} /> ADD FIELD
              </button>
            </div>
            <p className={styles.formFieldsHint}>Add custom fields: text inputs, radio choices, checkboxes, dropdowns.</p>

            {role.formFields.map((field, i) => (
              <FieldEditor
                key={field.id}
                field={field}
                onChange={(f) => updateField(i, f)}
                onRemove={() => removeField(i)}
              />
            ))}

            {role.formFields.length === 0 && (
              <p className={styles.emptyFieldsNote}>No form fields yet. Click "ADD FIELD" to add questions.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Image Upload Helper ───────────────────────────────────────────────────
function ImageUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (url: string) => void;
}) {
  const fetcher = useFetcher<{ url?: string; error?: string }>();
  const isPending = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data?.url) {
      onChange(fetcher.data.url);
    }
  }, [fetcher.data, onChange]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    fetcher.submit(formData, {
      method: "post",
      action: "/admin/upload-image",
      encType: "multipart/form-data",
    });
  }

  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <div className={styles.uploadRow}>
        <input
          className={styles.input}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
        />
        <label className={styles.uploadBtn}>
          {isPending ? "..." : <Plus size={14} />}
          <input type="file" hidden accept="image/*" onChange={handleFile} disabled={isPending} />
        </label>
      </div>
      {fetcher.data?.error && <p className={styles.fieldError}>{fetcher.data.error}</p>}
      {value && (
        <div className={styles.imgPreview}>
          <img src={value} alt="Preview" />
        </div>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export function ProjectEditorModal({ mode, initial, onClose }: ProjectEditorModalProps) {
  const fetcher = useFetcher<{ ok?: boolean; error?: string }>();
  const isSubmitting = fetcher.state !== "idle";
  const serverError = fetcher.data?.error;

  const [project, setProject] = useState<ProjectPayload>(() =>
    initial ? { ...initial } : emptyProject()
  );
  const [activeTab, setActiveTab] = useState<"basics" | "stack" | "timeline" | "roles" | "media">("basics");

  const update = useCallback(
    <K extends keyof ProjectPayload>(key: K, value: ProjectPayload[K]) =>
      setProject((p) => ({ ...p, [key]: value })),
    []
  );

  useEffect(() => {
    if (fetcher.data?.ok) {
      onClose();
    }
  }, [fetcher.data?.ok, onClose]);

  function handleSubmit() {
    fetcher.submit(
      { intent: mode === "create" ? "create" : "update", project: JSON.stringify(project) },
      { method: "post", action: "/admin/projects" }
    );
  }

  // ── Tech stack helpers ────────────────────────────────────────────────
  function addTechItem() {
    update("tech_stack", [...project.tech_stack, { label: "", value: "" }]);
  }
  function updateTechItem(i: number, item: TechStackItem) {
    const arr = [...project.tech_stack];
    arr[i] = item;
    update("tech_stack", arr);
  }
  function removeTechItem(i: number) {
    update("tech_stack", project.tech_stack.filter((_, idx) => idx !== i));
  }

  // ── Timeline helpers ──────────────────────────────────────────────────
  function addTimelineItem() {
    update("timeline", [...project.timeline, { label: "", status: "PENDING", title: "", description: "" }]);
  }
  function updateTimelineItem(i: number, item: TimelineItem) {
    const arr = [...project.timeline];
    arr[i] = item;
    update("timeline", arr);
  }
  function removeTimelineItem(i: number) {
    update("timeline", project.timeline.filter((_, idx) => idx !== i));
  }

  // ── Role helpers ──────────────────────────────────────────────────────
  function addRole() {
    update("roles", [...project.roles, emptyRole()]);
  }
  function updateRole(i: number, r: ProjectRole) {
    const arr = [...project.roles];
    arr[i] = r;
    update("roles", arr);
  }
  function removeRole(i: number) {
    update("roles", project.roles.filter((_, idx) => idx !== i));
  }

  // ── Media helpers ─────────────────────────────────────────────────────
  function addGalleryImage() {
    update("gallery_images", [...(project.gallery_images || []), ""]);
  }
  function updateGalleryImage(i: number, val: string) {
    const arr = [...(project.gallery_images || [])];
    arr[i] = val;
    update("gallery_images", arr);
  }
  function removeGalleryImage(i: number) {
    update("gallery_images", (project.gallery_images || []).filter((_, idx) => idx !== i));
  }

  function addContributor() {
    update("contributors", [...(project.contributors || []), { name: "", role: "", github: "" }]);
  }
  function updateContributor(i: number, val: Partial<{ name: string; role: string; github: string }>) {
    const arr = [...(project.contributors || [])];
    arr[i] = { ...arr[i], ...val };
    update("contributors", arr);
  }
  function removeContributor(i: number) {
    update("contributors", (project.contributors || []).filter((_, idx) => idx !== i));
  }

  // ── Tags helper ───────────────────────────────────────────────────────
  function handleTagsChange(val: string) {
    update("tags", val.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean));
  }

  const tabs = [
    { key: "basics", label: "BASICS" },
    { key: "stack", label: "TECH STACK" },
    { key: "timeline", label: "TIMELINE" },
    { key: "roles", label: `ROLES (${project.roles.length})` },
    { key: "media", label: "MEDIA" },
  ] as const;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <header className={styles.modalHeader}>
          <div>
            <p className={styles.modalMeta}>
              {mode === "create" ? "CREATE PROJECT" : `EDIT // ${project.id}`}
            </p>
            <h2 className={styles.modalTitle}>
              <RichText text={project.title || "(Untitled Project)"} />
            </h2>
          </div>
          <div className={styles.headerRight}>
            <label className={styles.publishToggle}>
              <span className={styles.publishLabel}>
                {project.is_published ? "LIVE" : "DRAFT"}
              </span>
              <div
                className={`${styles.toggleTrack} ${project.is_published ? styles.toggleTrackOn : ""}`}
                onClick={() => update("is_published", !project.is_published)}
                role="switch"
                aria-checked={project.is_published}
                tabIndex={0}
                onKeyDown={(e) => e.key === " " && update("is_published", !project.is_published)}
              >
                <div className={`${styles.toggleThumb} ${project.is_published ? styles.toggleThumbOn : ""}`} />
              </div>
            </label>
            <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Close">
              <X size={14} />
            </button>
          </div>
        </header>

        <div className={styles.tabs}>
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className={styles.modalBody}>
          {/* ── BASICS TAB ── */}
          {activeTab === "basics" && (
            <div className={styles.section}>
              <div className={styles.fieldRow2}>
                <div className={styles.field}>
                  <label className={styles.label}>PROJECT ID</label>
                  <input
                    className={styles.input}
                    value={project.id}
                    onChange={(e) => update("id", e.target.value.toUpperCase())}
                    placeholder="TDC_XXXX"
                    readOnly={mode === "edit"}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>TIER LEVEL (display)</label>
                  <input
                    className={styles.input}
                    value={project.tier_level}
                    onChange={(e) => update("tier_level", e.target.value)}
                    placeholder="LVL_01"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>TITLE *</label>
                <input
                  className={styles.input}
                  value={project.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="PROJECT_NAME_IN_CAPS"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>TAGLINE</label>
                <input
                  className={styles.input}
                  value={project.tagline}
                  onChange={(e) => update("tagline", e.target.value)}
                  placeholder="One-line project summary"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>DESCRIPTION</label>
                <textarea
                  className={`${styles.input} ${styles.textarea}`}
                  rows={5}
                  value={project.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Full project description..."
                />
              </div>

              <div className={styles.fieldRow3}>
                <div className={styles.field}>
                  <label className={styles.label}>TIER</label>
                  <select
                    className={styles.select}
                    value={project.tier}
                    onChange={(e) => update("tier", e.target.value as ProjectPayload["tier"])}
                  >
                    {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>STATUS</label>
                  <select
                    className={styles.select}
                    value={project.status}
                    onChange={(e) => update("status", e.target.value as ProjectPayload["status"])}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>TEAM SIZE</label>
                  <input
                    className={styles.input}
                    type="number"
                    min={1}
                    value={project.team_size}
                    onChange={(e) => update("team_size", parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className={styles.fieldRow2}>
                <div className={styles.field}>
                  <label className={styles.label}>OPEN SLOTS</label>
                  <input
                    className={styles.input}
                    type="number"
                    min={0}
                    value={project.open_slots}
                    onChange={(e) => update("open_slots", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>TAGS (comma-separated)</label>
                  <input
                    className={styles.input}
                    value={project.tags.join(", ")}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    placeholder="REACT, TYPESCRIPT, API"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── TECH STACK TAB ── */}
          {activeTab === "stack" && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionSubLabel}>TECH STACK ITEMS ({project.tech_stack.length})</span>
                <button type="button" className={styles.addBtn} onClick={addTechItem}>
                  <Plus size={12} /> ADD ITEM
                </button>
              </div>
              {project.tech_stack.map((item, i) => (
                <div key={i} className={styles.listItemRow}>
                  <input
                    className={styles.input}
                    placeholder="Label (e.g. FRAMEWORK)"
                    value={item.label}
                    onChange={(e) => updateTechItem(i, { ...item, label: e.target.value })}
                  />
                  <input
                    className={styles.input}
                    placeholder="Value (e.g. React)"
                    value={item.value}
                    onChange={(e) => updateTechItem(i, { ...item, value: e.target.value })}
                  />
                  <button type="button" className={styles.iconBtn} onClick={() => removeTechItem(i)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {project.tech_stack.length === 0 && (
                <p className={styles.emptyNote}>No tech stack items. Click "ADD ITEM" to add one.</p>
              )}
            </div>
          )}

          {/* ── TIMELINE TAB ── */}
          {activeTab === "timeline" && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionSubLabel}>TIMELINE MILESTONES ({project.timeline.length})</span>
                <button type="button" className={styles.addBtn} onClick={addTimelineItem}>
                  <Plus size={12} /> ADD MILESTONE
                </button>
              </div>
              {project.timeline.map((item, i) => (
                <div key={i} className={styles.timelineEditorItem}>
                  <div className={styles.timelineItemHead}>
                    <input
                      className={styles.input}
                      placeholder="Label (e.g. W01 // COMPLETED)"
                      value={item.label}
                      onChange={(e) => updateTimelineItem(i, { ...item, label: e.target.value })}
                    />
                    <select
                      className={styles.select}
                      value={item.status}
                      onChange={(e) => updateTimelineItem(i, { ...item, status: e.target.value as TimelineItem["status"] })}
                    >
                      {TIMELINE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button type="button" className={styles.iconBtn} onClick={() => removeTimelineItem(i)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <input
                    className={styles.input}
                    placeholder="Milestone title"
                    value={item.title}
                    onChange={(e) => updateTimelineItem(i, { ...item, title: e.target.value })}
                  />
                  <textarea
                    className={`${styles.input} ${styles.textarea}`}
                    rows={2}
                    placeholder="Milestone description"
                    value={item.description}
                    onChange={(e) => updateTimelineItem(i, { ...item, description: e.target.value })}
                  />
                </div>
              ))}
              {project.timeline.length === 0 && (
                <p className={styles.emptyNote}>No timeline milestones. Click "ADD MILESTONE" to add one.</p>
              )}
            </div>
          )}

          {/* ── ROLES TAB ── */}
          {activeTab === "roles" && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionSubLabel}>ROLES & APPLICATION FORMS ({project.roles.length})</span>
                <button type="button" className={styles.addBtn} onClick={addRole}>
                  <Plus size={12} /> ADD ROLE
                </button>
              </div>
              <p className={styles.rolesHint}>
                Each role has its own application form. Add fields: text inputs, radio buttons, checkboxes, or dropdowns.
              </p>
              {project.roles.map((role, i) => (
                <RoleEditor
                  key={role.id}
                  role={role}
                  onChange={(r) => updateRole(i, r)}
                  onRemove={() => removeRole(i)}
                />
              ))}
              {project.roles.length === 0 && (
                <p className={styles.emptyNote}>No roles defined. Click "ADD ROLE" to create one.</p>
              )}
            </div>
          )}

          {/* ── MEDIA TAB ── */}
          {activeTab === "media" && (
            <div className={styles.section}>
              <div className={styles.fieldRow2}>
                <div className={styles.field}>
                  <label className={styles.label}>LIVE URL</label>
                  <input
                    className={styles.input}
                    value={project.live_url || ""}
                    onChange={(e) => update("live_url", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>GITHUB URL</label>
                  <input
                    className={styles.input}
                    value={project.github_url || ""}
                    onChange={(e) => update("github_url", e.target.value)}
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>

              <ImageUploadField
                label="TEASER IMAGE (UPCOMING / ONGOING)"
                value={project.teaser_image}
                onChange={(url) => update("teaser_image", url)}
              />

              <div className={styles.divider} />

              <div className={styles.sectionHeader}>
                <span className={styles.sectionSubLabel}>GALLERY IMAGES (SHIPPED)</span>
                <button type="button" className={styles.addBtn} onClick={addGalleryImage}>
                  <Plus size={12} /> ADD IMAGE
                </button>
              </div>
              <div className={styles.galleryEditorGrid}>
                {(project.gallery_images || []).map((img, i) => (
                  <div key={i} className={styles.galleryEditorItem}>
                    <ImageUploadField
                      label={`Image ${i + 1}`}
                      value={img}
                      onChange={(url) => updateGalleryImage(i, url)}
                    />
                    <button type="button" className={styles.removeImgBtn} onClick={() => removeGalleryImage(i)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.divider} />

              <div className={styles.sectionHeader}>
                <span className={styles.sectionSubLabel}>CONTRIBUTORS (SHIPPED)</span>
                <button type="button" className={styles.addBtn} onClick={addContributor}>
                  <Plus size={12} /> ADD CONTRIBUTOR
                </button>
              </div>
              <div className={styles.contributorEditorGrid}>
                {(project.contributors || []).map((c, i) => (
                  <div key={i} className={styles.contributorEditorItem}>
                    <div className={styles.fieldRow3}>
                      <input
                        className={styles.input}
                        placeholder="Name"
                        value={c.name}
                        onChange={(e) => updateContributor(i, { name: e.target.value })}
                      />
                      <input
                        className={styles.input}
                        placeholder="Role"
                        value={c.role}
                        onChange={(e) => updateContributor(i, { role: e.target.value })}
                      />
                      <input
                        className={styles.input}
                        placeholder="GitHub URL"
                        value={c.github || ""}
                        onChange={(e) => updateContributor(i, { github: e.target.value })}
                      />
                    </div>
                    <button type="button" className={styles.removeContributorBtn} onClick={() => removeContributor(i)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {serverError && (
          <div className={styles.errorBanner}>{serverError}</div>
        )}

        <footer className={styles.modalFooter}>
          <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isSubmitting}>
            CANCEL
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSubmit}
            disabled={isSubmitting || !project.title.trim()}
          >
            {isSubmitting ? "SAVING..." : mode === "create" ? "CREATE PROJECT" : "SAVE CHANGES"}
          </button>
        </footer>
      </div>
    </div>
  );
}
