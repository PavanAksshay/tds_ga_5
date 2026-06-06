import { useLoaderData } from "react-router";
import type { Route } from "./+types/audit";
import { requireAdmin, getAuditLog } from "../../services/admin.server";
import type { AuditLog } from "../../services/admin.server";
import styles from "./audit.module.css";

export async function loader({ request }: Route.LoaderArgs): Promise<Response> {
  const headers = new Headers();
  await requireAdmin(request, headers);
  const logs = await getAuditLog(request, headers, 100);
  return Response.json({ logs }, { headers });
}

export default function AdminAudit() {
  const { logs } = useLoaderData<typeof loader>();
  const auditLogs = logs as AuditLog[];

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>// AUDIT LOG</h1>
        <p className={styles.pageDesc}>Every admin action — timestamped and immutable.</p>
      </div>

      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <span>TIMESTAMP</span>
          <span>ADMIN</span>
          <span>ACTION</span>
          <span>ENTITY</span>
          <span>ENTITY ID</span>
        </div>

        {auditLogs.length === 0 ? (
          <div className={styles.empty}>No audit log entries yet.</div>
        ) : (
          auditLogs.map((log) => (
            <div key={log.id} className={styles.row}>
              <span className={styles.timestamp}>{new Date(log.created_at).toLocaleString()}</span>
              <span className={styles.adminEmail}>{log.admin_email}</span>
              <span className={styles.action}>{log.action}</span>
              <span className={styles.entity}>{log.entity_type}</span>
              <span className={styles.entityId}>{log.entity_id ?? "—"}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
