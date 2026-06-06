import type { Route } from "./+types/contacts";
import { useLoaderData, Form, useNavigation } from "react-router";
import styles from "./contacts.module.css";
import classnames from "classnames";
import { formatInIST } from "~/lib/utils";
import { ConfirmModal } from "~/components/confirm-modal/confirm-modal";
import { useState } from "react";

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAdmin } = await import("~/services/admin.server");
  const { getAllContacts } = await import("~/services/contacts.server");
  const { verifySuperAdmin } = await import("~/services/admin.crypto.server");

  const headers = new Headers();
  const { user } = await requireAdmin(request, headers);
  const contacts = await getAllContacts(request, headers);
  return { 
    contacts, 
    currentAdminEmail: user.email || "" ,
    isFounder: verifySuperAdmin(user.email)
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { requireAdmin, hardDeleteEntity } = await import("~/services/admin.server");
  const { updateContactStatus } = await import("~/services/contacts.server");
  const { verifySuperAdmin } = await import("~/services/admin.crypto.server");

  const headers = new Headers();
  const { user } = await requireAdmin(request, headers);
  
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const id = formData.get("id") as string;

  try {
    if (intent === "DELETE") {
      if (!verifySuperAdmin(user.email)) throw new Error("Unauthorized.");
      await hardDeleteEntity(request, headers, "contacts", id);
    } else {
      const status = formData.get("status") as "NEW" | "IN_PROGRESS" | "RESOLVED";
      const internalNotes = formData.get("internal_notes") as string;
      await updateContactStatus(request, headers, id, status, internalNotes);
    }
    return Response.json({ success: true }, { headers });
  } catch (err: any) {
    return Response.json({ error: err.message }, { headers });
  }
}

export default function AdminContacts({ loaderData }: Route.ComponentProps) {
  const contacts = loaderData.contacts || [];
  const navigation = useNavigation();
  const isUpdating = navigation.state !== "idle";

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Contacts & Sponsorships</h1>
      <p className={styles.subtitle}>Manage incoming inquiries from the Contact Us page.</p>

      <div className={styles.grid}>
        {contacts.map((contact: any) => (
          <div key={contact.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.companyName}>
                {contact.company_name || "No Company Specified"}
              </h2>
              <span className={classnames(styles.statusBadge, styles[`status${contact.status}`])}>
                {contact.status}
              </span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.field}>
                <span className={styles.label}>Email:</span>
                <a href={`mailto:${contact.email}`} className={styles.link}>{contact.email}</a>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>Subject:</span>
                <span>{contact.subject || "No Subject"}</span>
              </div>
              <div className={styles.messageBox}>
                <span className={styles.label}>Message:</span>
                <p className={styles.message}>{contact.message}</p>
              </div>
              <div className={styles.date}>
                Received: {formatInIST(contact.created_at)}
              </div>
            </div>
            <div className={styles.cardFooter}>
              <DeleteContactControl id={contact.id} company={contact.company_name || contact.email} isUpdating={isUpdating} isFounder={loaderData.isFounder} />
              <Form method="post" className={styles.updateForm}>
                <input type="hidden" name="id" value={contact.id} />
                <div className={styles.formRow}>
                  <select name="status" defaultValue={contact.status} className={styles.select}>
                    <option value="NEW">New</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                  <input
                    type="text"
                    name="internal_notes"
                    defaultValue={contact.internal_notes || ""}
                    placeholder="Internal notes..."
                    className={styles.input}
                  />
                  <button type="submit" className={styles.btn} disabled={isUpdating}>
                    Update
                  </button>
                </div>
              </Form>
            </div>
          </div>
        ))}
        {contacts.length === 0 && (
          <div className={styles.empty}>No contact inquiries found.</div>
        )}
      </div>
    </div>
  );
}

function DeleteContactControl({ id, company, isUpdating, isFounder }: { id: string, company: string, isUpdating: boolean, isFounder: boolean }) {
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
        title="HARD DELETE CONTACT"
        message={`Wipe contact from ${company} permanently?`}
      />
    </>
  );
}
