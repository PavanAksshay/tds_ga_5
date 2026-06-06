import type { Route } from "./+types/updates";
import { useLoaderData, Form, useNavigation } from "react-router";
import styles from "./updates.module.css";
import classnames from "classnames";
import { RichText } from "~/components/rich-text/rich-text";
import { formatInIST } from "~/lib/utils";
import { ConfirmModal } from "~/components/confirm-modal/confirm-modal";
import { useState } from "react";
import { isJrAdmin } from "~/services/admin-shared";

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAdmin } = await import("~/services/admin.server");
  const { getAllUpdates } = await import("~/services/updates.server");
  const { verifySuperAdmin } = await import("~/services/admin.crypto.server");

  const headers = new Headers();
  const { user } = await requireAdmin(request, headers);
  const updates = await getAllUpdates(request, headers);
  return { 
    updates, 
    currentAdminEmail: user.email || "",
    isFounder: verifySuperAdmin(user.email)
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { requireAdmin, hardDeleteEntity } = await import("~/services/admin.server");
  const { createUpdate, updateUpdateEntry } = await import("~/services/updates.server");
  const { verifySuperAdmin } = await import("~/services/admin.crypto.server");

  const headers = new Headers();
  const { user } = await requireAdmin(request, headers);
  
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const id = formData.get("id") as string;

  try {
    if (intent === "CREATE") {
      const title = formData.get("title") as string;
      const type = formData.get("type") as "NEWS" | "CHANGELOG" | "UPDATE" | "ANNOUNCEMENT";
      const content = formData.get("content") as string;
      const is_published = formData.get("is_published") === "on";
      await createUpdate(request, headers, { title, type, content, is_published, created_by: user.id } as any);
    } else if (intent === "UPDATE_STATUS") {
      const is_published = formData.get("is_published") === "true";
      await updateUpdateEntry(request, headers, id, { is_published });
    } else if (intent === "DELETE") {
      // Super Admin only
      if (!verifySuperAdmin(user.email)) throw new Error("Unauthorized.");
      await hardDeleteEntity(request, headers, "updates", id);
    }
    return Response.json({ success: true }, { headers });
  } catch (err: any) {
    return Response.json({ error: err.message }, { headers });
  }
}

export default function AdminUpdates({ loaderData }: Route.ComponentProps) {
  const updates = loaderData.updates || [];
  const navigation = useNavigation();
  const isUpdating = navigation.state !== "idle";

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Updates & News Management</h1>
      <p className={styles.subtitle}>Create and publish updates, changelogs, and news to the public board.</p>

      <div className={styles.splitLayout}>
        <div className={styles.formPanel}>
          <h2 className={styles.panelTitle}>Create New Update</h2>
          <Form method="post" className={styles.form}>
            <input type="hidden" name="intent" value="CREATE" />
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Title</label>
              <input type="text" name="title" required className={styles.input} placeholder="Update title..." />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Type</label>
              <select name="type" className={styles.select}>
                <option value="UPDATE">General Update</option>
                <option value="CHANGELOG">Changelog</option>
                <option value="NEWS">News</option>
                <option value="ANNOUNCEMENT">Announcement</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Content</label>
              <textarea name="content" required rows={8} className={styles.textarea} placeholder="What's new? (Supports line breaks)"></textarea>
            </div>

            <div className={styles.formGroupCheckbox}>
              <input type="checkbox" name="is_published" id="is_published" />
              <label htmlFor="is_published">Publish immediately</label>
            </div>

            <button type="submit" className={styles.btn} disabled={isUpdating}>
              Create Update
            </button>
          </Form>
        </div>

        <div className={styles.listPanel}>
          <h2 className={styles.panelTitle}>All Updates</h2>
          <div className={styles.grid}>
            {updates.length === 0 && (
              <div className={styles.empty}>No updates found. Create one.</div>
            )}
            {updates.map((update: any) => (
              <div key={update.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.cardTitle}>
                      <RichText text={update.title} />
                    </h3>
                    <div className={styles.cardMeta}>
                      <span className={styles.badge}>{update.type}</span>
                      <span className={styles.date}>{formatInIST(update.created_at)}</span>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <Form method="post">
                      <input type="hidden" name="intent" value="UPDATE_STATUS" />
                      <input type="hidden" name="id" value={update.id} />
                      <input type="hidden" name="is_published" value={update.is_published ? "false" : "true"} />
                      <button type="submit" className={classnames(styles.actionBtn, update.is_published ? styles.btnWarning : styles.btnSuccess)} disabled={isUpdating}>
                        {update.is_published ? "Unpublish" : "Publish"}
                      </button>
                    </Form>
                    <DeleteUpdateControl id={update.id} title={update.title} isUpdating={isUpdating} isFounder={loaderData.isFounder} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteUpdateControl({ id, title, isUpdating, isFounder }: { id: string, title: string, isUpdating: boolean, isFounder: boolean }) {
  const [showModal, setShowModal] = useState(false);
  
  if (!isFounder) return null;

  return (
    <>
      <button 
        type="button" 
        className={classnames(styles.actionBtn, styles.btnDanger)} 
        disabled={isUpdating}
        onClick={() => setShowModal(true)}
      >
        Delete
      </button>

      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={() => {
          const formData = new FormData();
          formData.append("intent", "DELETE");
          formData.append("id", id);
          const form = document.createElement('form');
          form.method = 'POST';
          for (const [key, value] of formData) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value as string;
            form.appendChild(input);
          }
          document.body.appendChild(form);
          form.submit();
        }}
        title="HARD DELETE UPDATE"
        message={`Wipe this update permanently? This cannot be undone.`}
      />
    </>
  );
}
