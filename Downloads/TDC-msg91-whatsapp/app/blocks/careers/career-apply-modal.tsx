import { useState, useEffect } from "react";
import { X, CircleCheck } from "lucide-react";
import { useFetcher } from "react-router";
import type { CareerListing, CareerRole, FormField } from "../../types/careers";
import { RichText } from "../../components/rich-text/rich-text";
import styles from "./career-apply-modal.module.css";

interface CareerApplyModalProps {
  listing: CareerListing;
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

function CustomField({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string | string[];
  onChange: (val: string | string[]) => void;
}) {
  const strVal = typeof value === "string" ? value : "";
  const arrVal = Array.isArray(value) ? value : [];

  if (field.type === "textarea") {
    return (
      <div className={styles.field}>
        <label className={styles.questionLabel}>
          <RichText text={field.label} /> *
        </label>
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || "Your answer..."}
          rows={3}
          required={true}
        />
      </div>
    );
  }

  if (field.type === "radio") {
    return (
      <div className={styles.field}>
        <label className={styles.questionLabel}>
          <RichText text={field.label} /> *
        </label>
        <div className={styles.radioGroup}>
          {(field.options ?? []).map((opt) => (
            <label key={opt} className={styles.radioLabel}>
              <input
                type="radio"
                name={field.id}
                value={opt}
                checked={strVal === opt}
                onChange={() => onChange(opt)}
                required={true}
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
        <label className={styles.questionLabel}>
          <RichText text={field.label} /> *
        </label>
        <div className={styles.checkGroup}>
          {(field.options ?? []).map((opt) => (
            <label key={opt} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                value={opt}
                checked={arrVal.includes(opt)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...arrVal, opt]);
                  } else {
                    onChange(arrVal.filter((v) => v !== opt));
                  }
                }}
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
        <label className={styles.questionLabel}>
          <RichText text={field.label} /> *
        </label>
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

  // default: text
  return (
    <div className={styles.field}>
      <label className={styles.questionLabel}>
        <RichText text={field.label} /> *
      </label>
      <input
        className={styles.input}
        type="text"
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || "Your answer..."}
        required={true}
      />
    </div>
  );
}

export function CareerApplyModal({
  listing,
  userId,
  userEmail,
  displayName,
  linkedinHandle,
  githubHandle,
  resumeLink,
  portfolioUrl,
  onClose,
}: CareerApplyModalProps) {
  const fetcher = useFetcher<{ success?: boolean; error?: string }>();
  const isSubmitting = fetcher.state === "submitting";
  const submitted = fetcher.data?.success === true;
  const serverError = fetcher.data?.error;

  const firstOpenRole = listing.roles.find((r) => !r.locked);

  const [form, setForm] = useState<FormState>({
    displayName: displayName ?? "",
    email: userEmail ?? "",
    linkedinHandle: linkedinHandle ?? "",
    githubHandle: githubHandle ?? "",
    resumeLink: resumeLink ?? "",
    portfolioLink: portfolioUrl ?? "",
    selectedRoleId: firstOpenRole?.id ?? "",
    answers: {},
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      displayName: displayName ?? prev.displayName,
      email: userEmail ?? prev.email,
      linkedinHandle: linkedinHandle ?? prev.linkedinHandle,
      githubHandle: githubHandle ?? prev.githubHandle,
      resumeLink: resumeLink ?? prev.resumeLink,
      portfolioLink: portfolioUrl ?? prev.portfolioLink,
      selectedRoleId: firstOpenRole?.id ?? prev.selectedRoleId,
    }));
  }, [displayName, userEmail, linkedinHandle, githubHandle, resumeLink, portfolioUrl, firstOpenRole?.id]);

  const selectedRole: CareerRole | undefined = listing.roles.find(
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

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
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

  if (submitted) {
    return (
      <div className={styles.overlay} onClick={handleOverlayClick}>
        <div className={styles.modal}>
          <div className={styles.successScreen}>
            <CircleCheck size={40} color="var(--color-primary)" />
            <p className={styles.successCode}>APPLICATION SUBMITTED // {listing.id}</p>
            <h2 className={styles.successTitle}>REQUEST LOGGED</h2>
            <p className={styles.successMsg}>
              Your application for <strong>{listing.title}</strong> has been submitted.
              Our team will review your profile and reach out via the platform.
              Stay tuned.
            </p>
            <button className={styles.successCloseBtn} onClick={onClose} type="button">
              CLOSE TERMINAL
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <header className={styles.modalHeader}>
          <div>
            <p className={styles.modalMeta}>APPLY // {listing.id}</p>
            <h2 className={styles.modalTitle}>{listing.title}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Close">
            <X size={14} />
          </button>
        </header>

        <fetcher.Form
          className={styles.modalBody}
          method="post"
          action="/career-apply-action"
        >
          <input type="hidden" name="listingId" value={listing.id} />
          <input type="hidden" name="roleId" value={form.selectedRoleId} />
          <input type="hidden" name="roleTitle" value={selectedRole?.title ?? ""} />
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="answers" value={serializedAnswers} />

          <div>
            <p className={styles.prefillNote}>
              &#9658; PROFILE DATA prefetched from your account. Verify before submitting.
            </p>

            <p className={styles.sectionLabel}>IDENTITY PARAMS</p>
            <div className={styles.prefillGrid}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ca-displayName">DISPLAY NAME *</label>
                <input
                  id="ca-displayName"
                  name="displayName"
                  className={styles.input}
                  value={form.displayName}
                  onChange={(e) => setField("displayName", e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ca-email">EMAIL *</label>
                <input
                  id="ca-email"
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
                <label className={styles.label} htmlFor="ca-linkedin">LINKEDIN HANDLE *</label>
                <input
                  id="ca-linkedin"
                  name="linkedinHandle"
                  className={styles.input}
                  value={form.linkedinHandle}
                  onChange={(e) => setField("linkedinHandle", e.target.value)}
                  placeholder="linkedin.com/in/yourhandle"
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ca-github">GITHUB HANDLE *</label>
                <input
                  id="ca-github"
                  name="githubHandle"
                  className={styles.input}
                  value={form.githubHandle}
                  onChange={(e) => setField("githubHandle", e.target.value)}
                  placeholder="github.com/yourhandle"
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ca-resume">RESUME LINK *</label>
                <input
                  id="ca-resume"
                  name="resumeLink"
                  className={styles.input}
                  value={form.resumeLink}
                  onChange={(e) => setField("resumeLink", e.target.value)}
                  placeholder="drive.google.com/..."
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ca-portfolio">PORTFOLIO URL *</label>
                <input
                  id="ca-portfolio"
                  name="portfolioUrl"
                  className={styles.input}
                  value={form.portfolioLink}
                  onChange={(e) => setField("portfolioLink", e.target.value)}
                  placeholder="yoursite.dev"
                  required
                />
              </div>
            </div>
          </div>

          {/* Role selection */}
          <div>
            <p className={styles.sectionLabel}>SELECT ROLE *</p>
            <div className={styles.roleGrid}>
              {listing.roles.map((role) => (
                <div
                  key={role.id}
                  className={[
                    styles.roleOption,
                    form.selectedRoleId === role.id ? styles.roleOptionSelected : "",
                    role.locked ? styles.roleOptionLocked : "",
                  ].join(" ")}
                  onClick={() => !role.locked && setField("selectedRoleId", role.id)}
                >
                  <div className={styles.radioCircle}>
                    {form.selectedRoleId === role.id && !role.locked && (
                      <span className={styles.radioCircleFilled} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className={styles.roleTitle}>{role.title}</p>
                    <p className={styles.roleAvailability}>AVAILABILITY: {role.availability}</p>
                    <p className={styles.roleDesc}>{role.description}</p>
                  </div>
                  {role.locked && <span className={styles.lockedBadge}>LOCKED</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Custom form fields */}
          {selectedRole && selectedRole.formFields && selectedRole.formFields.length > 0 && (
            <div>
              <p className={styles.sectionLabel}>APPLICATION FORM</p>
              <div className={styles.questionsBlock}>
                {selectedRole.formFields.map((field) => (
                  <CustomField
                    key={field.id}
                    field={field}
                    value={getAnswer(field.id)}
                    onChange={(val) => setAnswer(field.id, val)}
                  />
                ))}
              </div>
            </div>
          )}

          {serverError && (
            <p className={styles.serverError} role="alert">{serverError}</p>
          )}

          <footer className={styles.modalFooter}>
            <span className={styles.footerNote}>ALL FIELDS MARKED * ARE REQUIRED</span>
            <button
              className={styles.submitBtn}
              type="submit"
              disabled={!canSubmit}
            >
              {isSubmitting ? "SUBMITTING..." : "SUBMIT APPLICATION"}
            </button>
          </footer>
        </fetcher.Form>
      </div>
    </div>
  );
}
