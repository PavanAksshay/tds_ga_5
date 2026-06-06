import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, CircleCheck, Save } from "lucide-react";
import { useFetcher } from "react-router";
import type { ProjectPayload, ProjectRole, FormField } from "../../types/projects";
import { RichText } from "../../components/rich-text/rich-text";
import styles from "./apply-modal.module.css";

interface ApplyModalProps {
  project: ProjectPayload;
  userId: string;
  userEmail: string;
  displayName: string | null;
  linkedinHandle: string | null;
  githubHandle: string | null;
  resumeLink: string | null;
  portfolioUrl: string | null;
  onClose: () => void;
}

interface FormState {
  displayName: string;
  email: string;
  linkedinHandle: string;
  githubHandle: string;
  resumeLink: string;
  portfolioLink: string;
  selectedRoleId: string;
  answers: Record<string, string | string[]>;
}

/** Build a stable localStorage key scoped to this project + user */
function getDraftKey(projectId: string, userId: string): string {
  return `tdc_apply_draft__${projectId}__${userId}`;
}

function CustomField({
  field,
  value,
  onChange,
  index,
}: {
  field: FormField;
  value: string | string[];
  onChange: (val: string | string[]) => void;
  index: number;
}) {
  const strVal = typeof value === "string" ? value : "";
  const arrVal = Array.isArray(value) ? value : [];

  const Meta = () => (
    <div className={styles.questionMeta}>
      <span className={styles.questionNumber}>Q{index + 1}</span>
      <span className={styles.requiredBadge}>REQUIRED</span>
    </div>
  );

  const QuestionLabel = () => (
    <label className={styles.questionLabel}>
      <RichText text={field.label} /> *
    </label>
  );

  if (field.type === "textarea") {
    return (
      <div className={styles.field}>
        <Meta />
        <QuestionLabel />
        {field.placeholder && <p className={styles.questionHint}>{field.placeholder}</p>}
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your answer..."
          rows={5}
          required={true}
        />
      </div>
    );
  }

  if (field.type === "radio") {
    return (
      <div className={styles.field}>
        <Meta />
        <QuestionLabel />
        <div className={styles.radioGroup}>
          {(field.options ?? []).map((opt) => (
            <label
              key={opt}
              className={`${styles.radioLabel} ${strVal === opt ? styles.radioLabelSelected : ""}`}
            >
              <span className={styles.radioCircleWrap}>
                <span className={`${styles.radioCircle} ${strVal === opt ? styles.radioCircleActive : ""}`} />
              </span>
              <input
                type="radio"
                name={field.id}
                value={opt}
                checked={strVal === opt}
                onChange={() => onChange(opt)}
                required={true}
                className={styles.hiddenInput}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "checkbox") {
    return (
      <div className={styles.field}>
        <Meta />
        <QuestionLabel />
        <p className={styles.questionHint}>Select all that apply.</p>
        <div className={styles.checkGroup}>
          {(field.options ?? []).map((opt) => (
            <label
              key={opt}
              className={`${styles.checkboxLabel} ${arrVal.includes(opt) ? styles.checkboxLabelSelected : ""}`}
            >
              <span className={`${styles.checkboxBox} ${arrVal.includes(opt) ? styles.checkboxBoxChecked : ""}`}>
                {arrVal.includes(opt) && <span className={styles.checkmark}>✓</span>}
              </span>
              <input
                type="checkbox"
                value={opt}
                checked={arrVal.includes(opt)}
                onChange={(e) => {
                  if (e.target.checked) onChange([...arrVal, opt]);
                  else onChange(arrVal.filter((v) => v !== opt));
                }}
                className={styles.hiddenInput}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className={styles.field}>
        <Meta />
        <QuestionLabel />
        <select
          className={styles.select}
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          required={true}
        >
          <option value="">Select an option...</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  // default: text input
  return (
    <div className={styles.field}>
      <Meta />
      <QuestionLabel />
      {field.placeholder && <p className={styles.questionHint}>{field.placeholder}</p>}
      <input
        className={styles.input}
        type="text"
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your answer..."
        required={true}
      />
    </div>
  );
}

export function ApplyModal({
  project,
  userId,
  userEmail,
  displayName,
  linkedinHandle,
  githubHandle,
  resumeLink,
  portfolioUrl,
  onClose,
}: ApplyModalProps) {
  const fetcher = useFetcher<{ success?: boolean; error?: string }>();
  const isSubmitting = fetcher.state === "submitting";
  const submitted = fetcher.data?.success === true;
  const serverError = fetcher.data?.error;

  const firstOpenRole = project.roles.find((r) => !r.locked);
  const draftKey = getDraftKey(project.id, userId);

  // ── Initialise form — try to load a saved draft first ──────────────────────
  const [form, setForm] = useState<FormState>(() => {
    const defaults: FormState = {
      displayName: displayName ?? "",
      email: userEmail ?? "",
      linkedinHandle: linkedinHandle ?? "",
      githubHandle: githubHandle ?? "",
      resumeLink: resumeLink ?? "",
      portfolioLink: portfolioUrl ?? "",
      selectedRoleId: firstOpenRole?.id ?? "",
      answers: {},
    };

    if (typeof window === "undefined") return defaults;

    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return defaults;
      const saved: Partial<FormState> = JSON.parse(raw);
      return {
        ...defaults,
        // Profile fields always come from props (user may have updated their profile)
        displayName: displayName ?? saved.displayName ?? "",
        email: userEmail ?? saved.email ?? "",
        linkedinHandle: linkedinHandle ?? saved.linkedinHandle ?? "",
        githubHandle: githubHandle ?? saved.githubHandle ?? "",
        resumeLink: resumeLink ?? saved.resumeLink ?? "",
        portfolioLink: portfolioUrl ?? saved.portfolioLink ?? "",
        // Role + answers come from the saved draft
        selectedRoleId: saved.selectedRoleId ?? firstOpenRole?.id ?? "",
        answers: saved.answers ?? {},
      };
    } catch {
      return defaults;
    }
  });

  const [draftSaved, setDraftSaved] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // Check if there was a pre-existing draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) setHasDraft(true);
    } catch { /* ignore */ }
  }, [draftKey]);

  // Auto-save draft to localStorage on every form change
  const saveDraft = useCallback((state: FormState) => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(state));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    } catch { /* ignore */ }
  }, [draftKey]);

  useEffect(() => {
    saveDraft(form);
  }, [form, saveDraft]);

  // Clear draft on successful submit
  useEffect(() => {
    if (submitted) {
      try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
    }
  }, [submitted, draftKey]);

  const selectedRole: ProjectRole | undefined = project.roles.find(
    (r) => r.id === form.selectedRoleId
  );

  function setField(field: keyof Omit<FormState, "answers">, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function setAnswer(fieldId: string, value: string | string[]) {
    setForm((prev) => ({
      ...prev,
      answers: { ...prev.answers, [`${form.selectedRoleId}__${fieldId}`]: value as string },
    }));
  }

  function getAnswer(fieldId: string): string | string[] {
    return form.answers[`${form.selectedRoleId}__${fieldId}`] ?? "";
  }

  function clearDraft() {
    try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
    setHasDraft(false);
    setForm({
      displayName: displayName ?? "",
      email: userEmail ?? "",
      linkedinHandle: linkedinHandle ?? "",
      githubHandle: githubHandle ?? "",
      resumeLink: resumeLink ?? "",
      portfolioLink: portfolioUrl ?? "",
      selectedRoleId: firstOpenRole?.id ?? "",
      answers: {},
    });
  }

  const requiredFieldsMet = !selectedRole || selectedRole.formFields.every((f) => {
    const val = getAnswer(f.id);
    if (Array.isArray(val)) return val.length > 0;
    return String(val).trim() !== "";
  });

  const canSubmit =
    !isSubmitting &&
    form.displayName.trim() !== "" &&
    form.email.trim() !== "" &&
    form.linkedinHandle.trim() !== "" &&
    form.githubHandle.trim() !== "" &&
    form.resumeLink.trim() !== "" &&
    form.portfolioLink.trim() !== "" &&
    form.selectedRoleId !== "" &&
    requiredFieldsMet;

  const serializedAnswers = JSON.stringify(form.answers);

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className={styles.fullPage}>
        <div className={styles.successScreen}>
          <CircleCheck size={52} color="var(--color-primary)" strokeWidth={1.5} />
          <p className={styles.successCode}>APPLICATION SUBMITTED // SUCCESS</p>
          <h2 className={styles.successTitle}>REQUEST LOGGED</h2>
          <p className={styles.successMsg}>
            Your application for <strong>{project.title}</strong> has been submitted.
            The project lead will review your profile and reach out via the platform.
            Stay tuned.
          </p>
          <button className={styles.successCloseBtn} onClick={onClose} type="button">
            ← BACK TO PROJECT
          </button>
        </div>
      </div>
    );
  }

  const questionCount = selectedRole?.formFields?.length ?? 0;

  return (
    <div className={styles.fullPage}>
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={onClose} type="button">
          <ArrowLeft size={14} />
          <span>BACK TO PROJECT</span>
        </button>
        <div className={styles.topBarCenter}>
          <span className={styles.topBarProject}>{project.title}</span>
          <span className={styles.topBarSep}>/</span>
          <span className={styles.topBarTitle}>APPLICATION</span>
        </div>
        <div className={styles.topBarRight}>
          {draftSaved && (
            <span className={styles.draftSavedBadge}>
              <Save size={10} />
              DRAFT SAVED
            </span>
          )}
        </div>
      </div>

      {/* ── Page Content ─────────────────────────────────────────────────── */}
      <div className={styles.pageContent}>
        <fetcher.Form className={styles.formWrap} method="post" action="/apply-action">
          <input type="hidden" name="projectId" value={project.id} />
          <input type="hidden" name="roleId" value={form.selectedRoleId} />
          <input type="hidden" name="roleTitle" value={selectedRole?.title ?? ""} />
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="answers" value={serializedAnswers} />

          {/* Hero */}
          <div className={styles.pageHero}>
            <p className={styles.heroMeta}>APPLY // PROJECT APPLICATION</p>
            <h1 className={styles.heroTitle}>{project.title}</h1>
            <p className={styles.heroSub}>
              Complete the form below to submit your application.
              Fields marked <strong>*</strong> are required.
            </p>
            <div className={styles.aiWarning}>
              <span className={styles.aiWarningTitle}>[ AI_FILTER_ACTIVE ]</span>
              <p className={styles.aiWarningText}>
                We use advanced AI-based filtering. If purely AI-generated text is detected in your responses, 
                your application will be automatically filtered out. We strongly recommend writing answers 
                professionally in your own words. Use AI assistance at your own risk.
              </p>
            </div>
          </div>

          {/* Draft resumed banner */}
          {hasDraft && (
            <div className={styles.draftBanner}>
              <span className={styles.draftBannerText}>
                📋 Your previous draft was restored. You can continue where you left off.
              </span>
              <button type="button" className={styles.draftClearBtn} onClick={clearDraft}>
                CLEAR DRAFT
              </button>
            </div>
          )}

          {/* ── SECTION 1: Identity ─────────────────────────────────────── */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionHeadRow}>
                <span className={styles.sectionStep}>01</span>
                <p className={styles.sectionLabel}>IDENTITY PARAMS</p>
              </div>
              <p className={styles.sectionDesc}>
                Profile data prefetched from your account. Verify before submitting.
              </p>
            </div>
            <div className={styles.prefillGrid}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="displayName">DISPLAY NAME *</label>
                <input
                  id="displayName"
                  name="displayName"
                  className={styles.input}
                  value={form.displayName}
                  onChange={(e) => setField("displayName", e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">EMAIL *</label>
                <input
                  id="email"
                  name="email"
                  className={styles.input}
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="linkedinHandle">LINKEDIN URL *</label>
                <input
                  id="linkedinHandle"
                  name="linkedinHandle"
                  className={styles.input}
                  value={form.linkedinHandle}
                  onChange={(e) => setField("linkedinHandle", e.target.value)}
                  placeholder="linkedin.com/in/yourhandle"
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="githubHandle">GITHUB URL *</label>
                <input
                  id="githubHandle"
                  name="githubHandle"
                  className={styles.input}
                  value={form.githubHandle}
                  onChange={(e) => setField("githubHandle", e.target.value)}
                  placeholder="github.com/yourhandle"
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="resumeLink">RESUME LINK *</label>
                <input
                  id="resumeLink"
                  name="resumeLink"
                  className={styles.input}
                  value={form.resumeLink}
                  onChange={(e) => setField("resumeLink", e.target.value)}
                  placeholder="drive.google.com/..."
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="portfolioLink">PORTFOLIO URL *</label>
                <input
                  id="portfolioLink"
                  name="portfolioUrl"
                  className={styles.input}
                  value={form.portfolioLink}
                  onChange={(e) => setField("portfolioLink", e.target.value)}
                  placeholder="yoursite.dev"
                  required
                />
              </div>
            </div>
          </section>

          {/* ── SECTION 2: Role Selection ────────────────────────────────── */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionHeadRow}>
                <span className={styles.sectionStep}>02</span>
                <p className={styles.sectionLabel}>SELECT ROLE *</p>
              </div>
              <p className={styles.sectionDesc}>Choose the role you'd like to apply for.</p>
            </div>
            <div className={styles.roleGrid}>
              {project.roles.map((role) => (
                <div
                  key={role.id}
                  className={[
                    styles.roleOption,
                    form.selectedRoleId === role.id ? styles.roleOptionSelected : "",
                    role.locked ? styles.roleOptionLocked : "",
                  ].join(" ")}
                  onClick={() => !role.locked && setField("selectedRoleId", role.id)}
                  role="button"
                  tabIndex={role.locked ? -1 : 0}
                  onKeyDown={(e) => e.key === "Enter" && !role.locked && setField("selectedRoleId", role.id)}
                >
                  <div className={styles.roleRadio}>
                    {form.selectedRoleId === role.id && !role.locked && (
                      <span className={styles.roleRadioFilled} />
                    )}
                  </div>
                  <div className={styles.roleInfo}>
                    <p className={styles.roleTitle}>{role.title}</p>
                    <p className={styles.roleAvailability}>AVAILABILITY: {role.availability}</p>
                    {role.description && <p className={styles.roleDesc}>{role.description}</p>}
                  </div>
                  {role.locked && <span className={styles.lockedBadge}>LOCKED</span>}
                </div>
              ))}
            </div>
          </section>

          {/* ── SECTION 3: Application Questions ────────────────────────── */}
          {selectedRole && questionCount > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <div className={styles.sectionHeadRow}>
                  <span className={styles.sectionStep}>03</span>
                  <p className={styles.sectionLabel}>APPLICATION QUESTIONS</p>
                </div>
                <p className={styles.sectionDesc}>
                  {questionCount} question{questionCount !== 1 ? "s" : ""} for{" "}
                  <strong>{selectedRole.title}</strong>. Answer honestly and in detail.
                </p>
              </div>
              <div className={styles.questionsBlock}>
                {selectedRole.formFields.map((field, i) => (
                  <CustomField
                    key={field.id}
                    field={field}
                    value={getAnswer(field.id)}
                    onChange={(val) => setAnswer(field.id, val)}
                    index={i}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Error ───────────────────────────────────────────────────── */}
          {serverError && (
            <p className={styles.serverError} role="alert">{serverError}</p>
          )}

          {/* ── Submit — kept at absolute bottom of form ─────────────────── */}
          <div className={styles.submitSection}>
            <div className={styles.submitMeta}>
              <p className={styles.submitNote}>ALL FIELDS MARKED * ARE REQUIRED</p>
              {!canSubmit && !isSubmitting && (
                <p className={styles.submitHint}>
                  {!form.selectedRoleId
                    ? "Select a role to continue."
                    : !requiredFieldsMet
                    ? "Complete all required questions to submit."
                    : "Fill in your name and email to submit."}
                </p>
              )}
            </div>
            <button
              className={styles.submitBtn}
              type="submit"
              disabled={!canSubmit}
              id="submit-application"
            >
              {isSubmitting ? "SUBMITTING..." : "SUBMIT APPLICATION →"}
            </button>
          </div>
        </fetcher.Form>
      </div>
    </div>
  );
}
