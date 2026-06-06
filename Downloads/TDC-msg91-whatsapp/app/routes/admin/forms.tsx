import { useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { Plus, X, Edit2, Trash2, FileText, ChevronRight } from "lucide-react";
// import type { Route } from "./+types/forms";
import { requireAdmin } from "../../services/admin.server";
import { getQuestionSets, createQuestionSet, updateQuestionSet, deleteQuestionSet } from "../../services/admin.server";
import type { QuestionSet } from "../../services/admin.server";
import classnames from "classnames";
import styles from "./forms.module.css";

export async function loader({ request }: { request: Request }) {
  const headers = new Headers();
  await requireAdmin(request, headers);
  const forms = await getQuestionSets(request, headers);
  return { forms };
}

export async function action({ request }: { request: Request }) {
  const headers = new Headers();
  await requireAdmin(request, headers);

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const tier = String(formData.get("tier"));
    const roleTitle = String(formData.get("role_title") || "");
    const questions = JSON.parse(String(formData.get("questions") || "[]"));
    return await createQuestionSet(request, headers, { tier, role_title: roleTitle, questions });
  }

  if (intent === "update") {
    const id = String(formData.get("id"));
    const tier = String(formData.get("tier"));
    const roleTitle = String(formData.get("role_title") || "");
    const questions = JSON.parse(String(formData.get("questions") || "[]"));
    return await updateQuestionSet(request, headers, id, { tier, role_title: roleTitle, questions });
  }

  if (intent === "delete") {
    const id = String(formData.get("id"));
    return await deleteQuestionSet(request, headers, id);
  }

  return { error: "Invalid intent" };
}

interface FormModalProps {
  form?: QuestionSet;
  onClose: () => void;
}

function FormModal({ form, onClose }: FormModalProps) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== "idle";

  const [tier, setTier] = useState(form?.tier || "TIER_1");
  const [roleTitle, setRoleTitle] = useState(form?.role_title || "");
  const [questions, setQuestions] = useState<any[]>(
    (form?.questions as any[]) || [{ id: "q1", label: "", type: "text", required: true }]
  );

  const addQuestion = () => {
    setQuestions([...questions, { id: `q_${Date.now()}`, label: "", type: "text", required: true }]);
  };

  const updateQuestion = (index: number, updates: any) => {
    const newQs = [...questions];
    newQs[index] = { ...newQs[index], ...updates };
    setQuestions(newQs);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <header className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{form ? "EDIT TEMPLATE" : "NEW TEMPLATE"}</h3>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </header>

        <fetcher.Form method="post" className={styles.modalContent}>
          <input type="hidden" name="intent" value={form ? "update" : "create"} />
          {form && <input type="hidden" name="id" value={form.id} />}
          <input type="hidden" name="questions" value={JSON.stringify(questions)} />

          <div className={styles.section}>
            <p className={styles.sectionLabel}>GLOBAL PARAMS</p>
            <div className={styles.field}>
              <label className={styles.label}>TIER ASSIGNMENT</label>
              <select name="tier" value={tier} onChange={(e) => setTier(e.target.value)} className={styles.select}>
                <option value="TIER_1">TIER 1 (Entry)</option>
                <option value="TIER_2">TIER 2 (Standard)</option>
                <option value="TIER_3">TIER 3 (Advanced/Core)</option>
                <option value="GLOBAL">GLOBAL (All Projects)</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>ROLE SPECIFIC (OPTIONAL)</label>
              <input
                name="role_title"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Frontend Engineer"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles.sectionLabel}>FORM STRUCTURE</p>
            <div className={styles.questionsList}>
              {questions.map((q, i) => (
                <div key={q.id} className={styles.questionEditor}>
                  <button type="button" className={styles.removeQBtn} onClick={() => removeQuestion(i)}>
                    <Trash2 size={12} />
                  </button>
                  <div className={styles.field}>
                    <label className={styles.label}>QUESTION {i + 1}</label>
                    <input
                      value={q.label}
                      onChange={(e) => updateQuestion(i, { label: e.target.value })}
                      placeholder="e.g. Why do you want to join?"
                      className={styles.input}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div className={styles.field}>
                      <label className={styles.label}>TYPE</label>
                      <select value={q.type} onChange={(e) => updateQuestion(i, { type: e.target.value })} className={styles.select}>
                        <option value="text">SHORT TEXT</option>
                        <option value="textarea">LONG TEXT</option>
                        <option value="select">DROPDOWN</option>
                        <option value="radio">RADIO</option>
                        <option value="checkbox">CHECKBOX</option>
                        <option value="url">URL</option>
                      </select>
                    </div>
                    <div className={styles.field} style={{ justifyContent: "center" }}>
                      <label className={styles.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) => updateQuestion(i, { required: e.target.checked })}
                        />
                        REQUIRED FIELD
                      </label>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className={styles.addQBtn} onClick={addQuestion}>
                <Plus size={10} /> ADD QUESTION
              </button>
            </div>
          </div>

          <footer className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>CANCEL</button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {form ? "SAVE CHANGES" : "CREATE TEMPLATE"}
            </button>
          </footer>
        </fetcher.Form>
      </div>
    </div>
  );
}

export default function AdminFormsPage() {
  const { forms } = useLoaderData() as any;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<QuestionSet | undefined>();
  const fetcher = useFetcher();

  const handleCreate = () => {
    setEditingForm(undefined);
    setModalOpen(true);
  };

  const handleEdit = (form: QuestionSet) => {
    setEditingForm(form);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure? This will remove this global question template.")) {
      fetcher.submit({ intent: "delete", id }, { method: "post" });
    }
  };

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.titleWrapper}>
          <span className={styles.meta}>ADMIN // APPLICATION INFRASTRUCTURE</span>
          <h1 className={styles.title}>Form Templates</h1>
        </div>
        <button className={styles.createBtn} onClick={handleCreate}>
          <Plus size={14} /> NEW TEMPLATE
        </button>
      </header>

      <div className={styles.grid}>
        {forms.map((form: QuestionSet) => (
          <div key={form.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <span className={styles.tierBadge}>{form.tier}</span>
                <h3 className={styles.cardTitle}>{form.role_title || "Generic Template"}</h3>
                <span className={styles.cardMeta}>
                  {Array.isArray(form.questions) ? form.questions.length : 0} FIELDS // ID: {form.id.slice(0, 8)}
                </span>
              </div>
              <FileText size={20} color="var(--color-primary)" opacity={0.3} />
            </div>

            <div className={styles.questionsPreview}>
              {(form.questions as any[] || []).slice(0, 3).map((q, i) => (
                <div key={i} className={styles.questionItem}>
                  <div className={styles.questionDot} />
                  <span>{q.label}</span>
                </div>
              ))}
              {(form.questions as any[] || []).length > 3 && (
                <div className={styles.questionItem} style={{ opacity: 0.5 }}>
                  <ChevronRight size={10} />
                  <span>+ {(form.questions as any[] || []).length - 3} more questions</span>
                </div>
              )}
            </div>

            <div className={styles.cardActions}>
              <button className={styles.actionBtn} onClick={() => handleEdit(form)}>
                <Edit2 size={10} /> EDIT
              </button>
              <button className={classnames(styles.actionBtn, styles.deleteBtn)} onClick={() => handleDelete(form.id)}>
                <Trash2 size={10} /> DELETE
              </button>
            </div>
          </div>
        ))}

        {forms.length === 0 && (
          <div className={styles.empty}>
            <p>No global form templates found. Create one to standardize application workflows.</p>
          </div>
        )}
      </div>

      {modalOpen && (
        <FormModal
          form={editingForm}
          onClose={() => {
            setModalOpen(false);
            setEditingForm(undefined);
          }}
        />
      )}
    </div>
  );
}
