import { useState, useCallback, useEffect } from "react";
import { useFetcher } from "react-router";
import { X, Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import {
  generateCareerId,
  type CareerListing,
  type CareerRole,
  type FormField,
  type FormFieldType,
  type CareerDepartment,
  type CareerStatus,
  type LocationType,
  type CommitmentType,
} from "../../types/careers";
import { RichText } from "../../components/rich-text/rich-text";
import styles from "./career-editor-modal.module.css";

interface CareerEditorModalProps {
  mode: "create" | "edit";
  initial: CareerListing | null;
  onClose: () => void;
}

const DEPARTMENTS: CareerDepartment[] = [
  "ENGINEERING",
  "DESIGN",
  "MARKETING",
  "OPERATIONS",
  "CONTENT",
  "COMMUNITY",
  "GENERAL",
];
const STATUSES: CareerStatus[] = ["OPEN", "CLOSED", "PAUSED"];
const LOCATIONS: LocationType[] = ["REMOTE", "HYBRID", "IN_PERSON"];
const COMMITMENTS: CommitmentType[] = ["FULL_TIME", "PART_TIME", "CONTRACT", "VOLUNTEER"];

const FIELD_TYPES: { value: FormFieldType; label: string }[] = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "radio", label: "Single Choice (Radio)" },
  { value: "checkbox", label: "Multiple Choice (Checkbox)" },
  { value: "select", label: "Dropdown (Select)" },
];

function emptyCareer(): CareerListing {
  return {
    id: generateCareerId(),
    department: "ENGINEERING",
    status: "OPEN",
    title: "",
    tagline: "",
    description: "",
    roles: [],
    tags: [],
    location_type: "REMOTE",
    commitment: "FULL_TIME",
    is_published: false,
  };
}

function emptyRole(): CareerRole {
  return {
    id: `role_${Date.now()}`,
    title: "",
    availability: "Full-time",
    locked: false,
    description: "",
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
          <span className={styles.label}>OPTIONS</span>
          {(field.options ?? []).map((opt, i) => (
            <div key={i} className={styles.listItemRow}>
              <input
                className={styles.fieldInput}
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
              />
              <button type="button" className={styles.iconBtn} onClick={() => removeOption(i)}><Trash2 size={11} /></button>
            </div>
          ))}
          <button type="button" className={styles.addBtn} onClick={addOption} style={{ fontSize: '9px', padding: '3px 8px' }}>
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
  role: CareerRole;
  onChange: (r: CareerRole) => void;
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
              <label className={styles.label}>AVAILABILITY (e.g. 10 hrs/week)</label>
              <input className={styles.input} value={role.availability} onChange={(e) => onChange({ ...role, availability: e.target.value })} placeholder="Full-time" />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>ROLE DESCRIPTION</label>
            <textarea className={`${styles.input} ${styles.textarea}`} rows={2} value={role.description} onChange={(e) => onChange({ ...role, description: e.target.value })} placeholder="What does this role do?" />
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionSubLabel}>APPLICATION FORM FIELDS ({role.formFields.length})</span>
              <button type="button" className={styles.addBtn} onClick={addField} style={{ fontSize: '10px', padding: '3px 10px' }}>
                <Plus size={11} /> ADD FIELD
              </button>
            </div>
            <p className={styles.label}>Add custom fields for this specific role.</p>

            {role.formFields.map((field, i) => (
              <FieldEditor
                key={field.id}
                field={field}
                onChange={(f) => updateField(i, f)}
                onRemove={() => removeField(i)}
              />
            ))}

            {role.formFields.length === 0 && (
              <p className={styles.emptyNote}>No custom fields yet. Using default identity fields only.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export function CareerEditorModal({ mode, initial, onClose }: CareerEditorModalProps) {
  const fetcher = useFetcher<{ ok?: boolean; error?: string }>();
  const isSubmitting = fetcher.state !== "idle";
  const serverError = fetcher.data?.error;

  const [listing, setListing] = useState<CareerListing>(() =>
    initial ? { ...initial } : emptyCareer()
  );
  const [activeTab, setActiveTab] = useState<"basics" | "roles" | "settings">("basics");

  const update = useCallback(
    <K extends keyof CareerListing>(key: K, value: CareerListing[K]) =>
      setListing((p) => ({ ...p, [key]: value })),
    []
  );

  useEffect(() => {
    if (fetcher.data?.ok) {
      onClose();
    }
  }, [fetcher.data?.ok, onClose]);

  function handleSubmit() {
    fetcher.submit(
      { intent: mode === "create" ? "create" : "update", career: JSON.stringify(listing) },
      { method: "post", action: "/admin/careers" }
    );
  }

  // ── Role helpers ──────────────────────────────────────────────────────
  function addRole() {
    update("roles", [...listing.roles, emptyRole()]);
  }
  function updateRole(i: number, r: CareerRole) {
    const arr = [...listing.roles];
    arr[i] = r;
    update("roles", arr);
  }
  function removeRole(i: number) {
    update("roles", listing.roles.filter((_, idx) => idx !== i));
  }

  // ── Tags helper ───────────────────────────────────────────────────────
  function handleTagsChange(val: string) {
    update("tags", val.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean));
  }

  const tabs = [
    { key: "basics", label: "BASICS" },
    { key: "roles", label: `ROLES (${listing.roles.length})` },
    { key: "settings", label: "SETTINGS" },
  ] as const;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <header className={styles.modalHeader}>
          <div>
            <p className={styles.modalMeta}>
              {mode === "create" ? "CREATE LISTING" : `EDIT // ${listing.id}`}
            </p>
            <h2 className={styles.modalTitle}>
              <RichText text={listing.title || "(Untitled Career)"} />
            </h2>
          </div>
          <div className={styles.headerRight}>
            <label className={styles.publishToggle}>
              <span className={styles.publishLabel}>
                {listing.is_published ? "LIVE" : "DRAFT"}
              </span>
              <div
                className={`${styles.toggleTrack} ${listing.is_published ? styles.toggleTrackOn : ""}`}
                onClick={() => update("is_published", !listing.is_published)}
                role="switch"
                aria-checked={listing.is_published}
                tabIndex={0}
                onKeyDown={(e) => e.key === " " && update("is_published", !listing.is_published)}
              >
                <div className={`${styles.toggleThumb} ${listing.is_published ? styles.toggleThumbOn : ""}`} />
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
                  <label className={styles.label}>CAREER ID</label>
                  <input
                    className={styles.input}
                    value={listing.id}
                    onChange={(e) => update("id", e.target.value.toUpperCase())}
                    placeholder="JOB_XXXX"
                    readOnly={mode === "edit"}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>DEPARTMENT</label>
                  <select
                    className={styles.select}
                    value={listing.department}
                    onChange={(e) => update("department", e.target.value as CareerDepartment)}
                  >
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>TITLE *</label>
                <input
                  className={styles.input}
                  value={listing.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="JOB_TITLE_IN_CAPS"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>TAGLINE</label>
                <input
                  className={styles.input}
                  value={listing.tagline}
                  onChange={(e) => update("tagline", e.target.value)}
                  placeholder="One-line career summary"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>DESCRIPTION</label>
                <textarea
                  className={`${styles.input} ${styles.textarea}`}
                  rows={8}
                  value={listing.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Full career description..."
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>TAGS (comma-separated)</label>
                <input
                  className={styles.input}
                  value={listing.tags.join(", ")}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="REACT, TYPESCRIPT, REMOTE"
                />
              </div>
            </div>
          )}

          {/* ── ROLES TAB ── */}
          {activeTab === "roles" && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionSubLabel}>ROLES & APPLICATION FORMS ({listing.roles.length})</span>
                <button type="button" className={styles.addBtn} onClick={addRole}>
                  <Plus size={12} /> ADD ROLE
                </button>
              </div>
              <p className={styles.label}>
                Define specific roles within this listing. Each role can have its own custom application questions.
              </p>
              {listing.roles.map((role, i) => (
                <RoleEditor
                  key={role.id}
                  role={role}
                  onChange={(r) => updateRole(i, r)}
                  onRemove={() => removeRole(i)}
                />
              ))}
              {listing.roles.length === 0 && (
                <p className={styles.emptyNote}>No roles defined. Click "ADD ROLE" to create one.</p>
              )}
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {activeTab === "settings" && (
            <div className={styles.section}>
              <div className={styles.fieldRow2}>
                <div className={styles.field}>
                  <label className={styles.label}>STATUS</label>
                  <select
                    className={styles.select}
                    value={listing.status}
                    onChange={(e) => update("status", e.target.value as CareerStatus)}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>LOCATION TYPE</label>
                  <select
                    className={styles.select}
                    value={listing.location_type}
                    onChange={(e) => update("location_type", e.target.value as LocationType)}
                  >
                    {LOCATIONS.map((l) => <option key={l} value={l}>{l.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>COMMITMENT</label>
                <select
                  className={styles.select}
                  value={listing.commitment}
                  onChange={(e) => update("commitment", e.target.value as CommitmentType)}
                >
                  {COMMITMENTS.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
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
            disabled={isSubmitting || !listing.title.trim()}
          >
            {mode === "create" ? "CREATE CAREER" : "SAVE CHANGES"}
          </button>
        </footer>
      </div>
    </div>
  );
}
