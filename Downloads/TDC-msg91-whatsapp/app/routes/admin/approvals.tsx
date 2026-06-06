import { useLoaderData, useNavigation, Form, useActionData } from "react-router";
import type { Route } from "./+types/approvals";
import { hasPermission } from "../../services/admin-shared";
import styles from "./approvals.module.css";
import { CheckCircle2, XCircle, Clock, User, Info, ChevronRight, AlertTriangle } from "lucide-react";
import classnames from "classnames";
import { formatInIST } from "~/lib/utils";

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAdminGate, getPendingApprovals } = await import("../../services/admin.server");
  const { verifySuperAdmin } = await import("../../services/admin.crypto.server");

  const headers = new Headers();
  const { profile, user } = await requireAdminGate(request, headers);
  const isFounder = verifySuperAdmin(user.email);
  
  // Sr. Admins and Super Admin (Founder) can access the approvals queue
  if (!hasPermission(profile, "APPROVALS", isFounder)) {
    throw new Response("Unauthorized", { status: 403 });
  }

  const requests = await getPendingApprovals(request, headers);
  return { requests };
}

export async function action({ request }: Route.ActionArgs) {
  const { 
    requireAdminGate, 
    processApprovalRequest, 
    updateApplicationStatus,
    adjustMemberXP,
    toggleBanMember,
    toggleAdminStatus,
    writeAuditLog
  } = await import("../../services/admin.server");

  const headers = new Headers();
  const { user } = await requireAdminGate(request, headers);
  const formData = await request.formData();
  const requestId = formData.get("requestId") as string;
  const status = formData.get("status") as "APPROVED" | "REJECTED";
  const reason = formData.get("reason") as string;

  const result = await processApprovalRequest(request, headers, requestId, status, reason);

  if (status === "APPROVED" && result.payload) {
    // EXECUTE THE ACTUAL LOGIC
    const p = result.payload as any;
    switch (result.type) {
      case "UPDATE_APPLICATION_STATUS":
        await updateApplicationStatus(request, headers, p.applicationId, p.status, p.internalNotes);
        break;
      case "ADJUST_XP":
        await adjustMemberXP(request, headers, p.userId, p.delta, p.reason, p.adminId);
        break;
      case "BAN_MEMBER":
        await toggleBanMember(request, headers, p.userId, true, p.reason);
        break;
      case "UNBAN_MEMBER":
        await toggleBanMember(request, headers, p.userId, false);
        break;
      case "GRANT_ADMIN":
        await toggleAdminStatus(request, headers, p.userId, true);
        break;
      case "REVOKE_ADMIN":
        await toggleAdminStatus(request, headers, p.userId, false);
        break;
    }
    
    await writeAuditLog(request, headers, user.id, user.email ?? "", `EXECUTE_${result.type}`, "approval_queue", requestId);
  }

  return { success: true };
}

function ApprovalCard({ req }: { req: any }) {
  const nav = useNavigation();
  const isSubmitting = nav.state === "submitting";

  const renderPayload = (payload: any) => {
    return (
      <div className={styles.payloadGrid}>
        {Object.entries(payload).map(([key, value]) => (
          <div key={key} className={styles.payloadField}>
            <span className={styles.payloadKey}>{key.toUpperCase()}</span>
            <span className={styles.payloadValue}>{JSON.stringify(value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.requesterInfo}>
          <div className={styles.avatar}>
            <User size={16} />
          </div>
          <div className={styles.requesterText}>
            <span className={styles.requesterName}>{req.requested_by_profile?.display_name || "Admin"}</span>
            <span className={styles.requestDate}>{formatInIST(req.created_at)}</span>
          </div>
        </div>
        <div className={styles.categoryBadge}>{req.category}</div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.actionType}>
          <ChevronRight size={18} className={styles.chevron} />
          <span>{req.action_type.replace(/_/g, " ")}</span>
        </div>
        
        <div className={styles.payloadSection}>
          <div className={styles.payloadHeader}>
            <Info size={14} />
            <span>PROPOSED CHANGES</span>
          </div>
          {renderPayload(req.payload)}
        </div>
      </div>

      <div className={styles.cardFooter}>
        <Form method="post" className={styles.actionGroup}>
          <input type="hidden" name="requestId" value={req.id} />
          <input type="text" name="reason" placeholder="Optional rejection reason..." className={styles.reasonInput} />
          
          <button 
            type="submit" 
            name="status" 
            value="REJECTED" 
            className={styles.rejectBtn}
            disabled={isSubmitting}
          >
            <XCircle size={16} />
            LOG_REJECT
          </button>
          
          <button 
            type="submit" 
            name="status" 
            value="APPROVED" 
            className={styles.approveBtn}
            disabled={isSubmitting}
          >
            <CheckCircle2 size={16} />
            LOG_APPROVE & EXECUTE
          </button>
        </Form>
      </div>
    </div>
  );
}

export default function ApprovalsPage() {
  const { requests } = useLoaderData<typeof loader>();

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <CheckCircle2 className={styles.headerIcon} />
          <h1 className={styles.pageTitle}>// GOVERNANCE_QUEUE</h1>
        </div>
        <p className={styles.pageDesc}>
          Review and approve pending administrative actions from your officers.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <ShieldCheck size={48} />
          </div>
          <h2 className={styles.emptyTitle}>ALL CLEAR</h2>
          <p className={styles.emptyText}>No pending administrative actions require your attention.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          <div className={styles.alertBox}>
            <AlertTriangle size={18} />
            <span>
              <strong>CRITICAL:</strong> Actions executed here bypass further checks. Verify payload data before approval.
            </span>
          </div>
          {requests.map((req: any) => (
            <ApprovalCard key={req.id} req={req} />
          ))}
        </div>
      )}
    </div>
  );
}

import { ShieldCheck } from "lucide-react";
