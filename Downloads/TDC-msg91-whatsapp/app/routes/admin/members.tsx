import { useLoaderData, Form, useNavigation, useSearchParams } from "react-router";
import type { Route } from "./+types/members";
import { useState, useEffect } from "react";
import styles from "./members.module.css";
import { User, Shield, ChevronDown, ChevronUp, Lock, CheckSquare, Square, RotateCcw, Trash2, ShieldAlert, Key, ShieldCheck, ChevronRight, X, Mail } from "lucide-react";
import classnames from "classnames";
import type { AdminSection, AdminRole } from "../../services/admin-shared";
import { isSrAdmin, isJrAdmin, SR_ADMIN_AUTO_SECTIONS, JR_ADMIN_ALLOWED_SECTIONS } from "../../services/admin-shared";
import { formatInIST, ensureGithubUrl, ensureLinkedinUrl } from "~/lib/utils";
import { ConfirmModal } from "~/components/confirm-modal/confirm-modal";

// All non-super-admin sections available for Jr. Admin assignment
const ALL_SECTIONS: AdminSection[] = JR_ADMIN_ALLOWED_SECTIONS;

type MemberRecord = Record<string, any>;

function strOf(v: unknown): string {
  return v != null ? String(v) : "";
}

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAdmin, getAllMembers } = await import("../../services/admin.server");
  const { getAllProjectsAdmin } = await import("../../services/projects.server");
  const { verifySuperAdmin } = await import("../../services/admin.crypto.server");

  const headers = new Headers();
  const { user, profile } = await requireAdmin(request, headers);
  const url = new URL(request.url);
  const search = url.searchParams.get("search") ?? undefined;
  
  const [members, projects] = await Promise.all([
    getAllMembers(request, headers, search),
    getAllProjectsAdmin(request, headers),
  ]);

  return { 
    members: members as MemberRecord[],
    projects: projects,
    currentAdminEmail: user.email ?? "",
    isFounder: verifySuperAdmin(user.email),
    isCurrentUserSrAdmin: isSrAdmin(profile),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { 
    requireAdmin, 
    adjustMemberXP, 
    toggleBanMember, 
    writeAuditLog,
    handleAdminAction,
    hardDeleteUser,
    toggleAdminStatus,
    resetAdminPinForUser
  } = await import("../../services/admin.server");
  const { verifySuperAdmin } = await import("../../services/admin.crypto.server");
  const { createContribution } = await import("../../services/contributions.server");

  const headers = new Headers();
  const { user } = await requireAdmin(request, headers);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const userId = formData.get("userId") as string;

  if (intent === "adjust_xp") {
    const delta = parseInt(formData.get("delta") as string, 10);
    const reason = formData.get("reason") as string;
    
    return await handleAdminAction(request, headers, "MEMBERS", "ADJUST_XP", 
      { userId, delta, reason, adminId: user.id },
      async () => {
        await adjustMemberXP(request, headers, userId, delta, reason, user.id);
        await writeAuditLog(request, headers, user.id, user.email ?? "", "ADJUST_XP", "profile", userId, { delta, reason });
        return { ok: true };
      }
    );
  } else if (intent === "ban") {
    // Ban is Sr. Admin + Super Admin ONLY — not available to Jr. Admins even via queue
    const { profile } = await requireAdmin(request, headers);
    if (isJrAdmin(profile)) return { error: "Unauthorized: only Sr. Admin or Super Admin can ban members." };
    const reason = formData.get("reason") as string;
    await toggleBanMember(request, headers, userId, true, reason);
    await writeAuditLog(request, headers, user.id, user.email ?? "", "BAN_MEMBER", "profile", userId, { reason });
    return { ok: true };
  } else if (intent === "unban") {
    // Unban is Sr. Admin + Super Admin ONLY
    const { profile } = await requireAdmin(request, headers);
    if (isJrAdmin(profile)) return { error: "Unauthorized: only Sr. Admin or Super Admin can unban members." };
    await toggleBanMember(request, headers, userId, false);
    await writeAuditLog(request, headers, user.id, user.email ?? "", "UNBAN_MEMBER", "profile", userId);
    return { ok: true };
  } else if (intent === "make_admin") {
    const { profile } = await requireAdmin(request, headers);
    const role = formData.get("role") as AdminRole;
    const sections = formData.getAll("sections") as AdminSection[];
    
    // Authorization: 
    // - Super Admin can set any role.
    // - Sr. Admin can only set/update Jr. Admin role.
    const isTargetSrValue = role === 'sr_admin';
    if (!verifySuperAdmin(user.email)) {
      if (!isSrAdmin(profile)) return { error: "Unauthorized." };
      if (isTargetSrValue) return { error: "Sr. Admins cannot assign Sr. Admin roles." };
      
      // Also ensure they aren't trying to demote an existing Sr. Admin if they aren't Super
      // We'd need to fetch target profile to be 100% sure, but toggleAdminStatus handles verification.
    }

    await toggleAdminStatus(request, headers, userId, true, sections, role);
    await writeAuditLog(request, headers, user.id, user.email ?? "", "SET_ADMIN_PERMISSIONS", "profile", userId, { role, sections });
  } else if (intent === "remove_admin") {
    const { profile } = await requireAdmin(request, headers);
    // Only Super Admin or Sr. Admin can revoke
    if (!verifySuperAdmin(user.email) && !isSrAdmin(profile)) return { error: "Unauthorized." };
    
    await toggleAdminStatus(request, headers, userId, false);
    await writeAuditLog(request, headers, user.id, user.email ?? "", "REVOKE_ADMIN", "profile", userId);
  } else if (intent === "hard_delete") {
    // Super Admin EXCLUSIVE
    if (!verifySuperAdmin(user.email)) return { error: "Unauthorized: only Super Admin can execute hard deletes." };
    await hardDeleteUser(request, headers, userId);
    await writeAuditLog(request, headers, user.id, user.email ?? "", "HARD_DELETE_USER", "profile", userId);
    return { ok: true };
  } else if (intent === "reset_pin") {
    // Super Admin only: reset another admin's PIN
    const result = await resetAdminPinForUser(request, headers, userId);
    await writeAuditLog(request, headers, user.id, user.email ?? "", "RESET_ADMIN_PIN", "profile", userId);
    if (result.error) return { error: result.error };
  } else if (intent === "add_contribution") {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const link = formData.get("link") as string;
    const projectId = formData.get("projectId") as string;
    
    return await handleAdminAction(request, headers, "PROJECTS", "ADD_CONTRIBUTION",
      { userId, title, description, link, projectId },
      async () => {
        await createContribution(request, headers, {
          user_id: userId,
          project_id: projectId || null,
          title,
          description: description || null,
          link: link || null,
          status: "VERIFIED"
        });
        await writeAuditLog(request, headers, user.id, user.email ?? "", "ADD_CONTRIBUTION", "profile", userId, { title, projectId });
        return { ok: true };
      }
    );
  }

  return { ok: true };
}

function MemberRow({ member, projects, currentAdminEmail, isFounder }: { member: MemberRecord; projects: any[]; currentAdminEmail: string; isFounder: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const nav = useNavigation();
  const isSubmitting = nav.state === "submitting";

  // isFounder received as prop from parent
  const isSelf = member.email === currentAdminEmail;
  const memberIsSrAdmin = isSrAdmin(member);
  const memberIsJrAdmin = isJrAdmin(member);

  // Role selector for governance block
  const [selectedRole, setSelectedRole] = useState<AdminRole>(member.admin_role || 'jr_admin');

  // Sync role when server data changes
  useEffect(() => {
    if (member.admin_role) setSelectedRole(member.admin_role);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.admin_role]);

  // Controlled state for permissions to support "Select All"
  const [selectedSections, setSelectedSections] = useState<string[]>(member.admin_sections || []);

  // Sync with server data using stable JSON comparison to avoid infinite loops
  const serverSectionsKey = JSON.stringify((member.admin_sections || []).slice().sort());
  useEffect(() => {
    setSelectedSections(member.admin_sections || []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSectionsKey]);

  const toggleSection = (s: string) => {
    setSelectedSections((prev: string[]) =>
      prev.includes(s) ? prev.filter((x: string) => x !== s) : [...prev, s]
    );
  };

  // When role changes to sr_admin, auto-select all allowed sections
  const handleRoleChange = (role: AdminRole) => {
    setSelectedRole(role);
    if (role === 'sr_admin') setSelectedSections([...SR_ADMIN_AUTO_SECTIONS]);
    else setSelectedSections(member.admin_sections || []);
  };

  const grantAll = () => setSelectedSections([...ALL_SECTIONS]);
  const clearAll = () => setSelectedSections([]);

  return (
    <div className={classnames(styles.row, expanded && styles.rowExpanded)}>
      <div
        className={styles.rowMain}
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
      >
        <div className={styles.memberInfo}>
          <div className={styles.nameRow}>
            <span className={styles.memberName}>{strOf(member.display_name || member.email)}</span>
            {memberIsSrAdmin && <span className={styles.rolePillSr}>SR. ADMIN</span>}
            {memberIsJrAdmin && <span className={styles.rolePillJr}>JR. ADMIN</span>}
            {Boolean(member.is_admin) && !memberIsSrAdmin && !memberIsJrAdmin && <span className={styles.adminInlineTag}>ADMIN</span>}
          </div>
          <span className={styles.memberEmail}>{strOf(member.email)}</span>
        </div>
        <span className={styles.memberRole}>{strOf(member.role) || "—"}</span>
        <span className={styles.memberXp}>{strOf(member.xp)} XP</span>
        <div className={styles.memberBadges}>
          {Boolean(member.is_admin) && <span className={styles.adminBadge}>ADMIN</span>}
          {Boolean(member.is_banned) && <span className={styles.bannedBadge}>BANNED</span>}
        </div>
        <div className={styles.memberSections}>
          {Array.isArray(member.admin_sections) && member.admin_sections.length > 0 ? (
            member.admin_sections.map((s: string) => (
              <div key={s} className={styles.sectionMiniBadge} title={s}>{s.toLowerCase()}</div>
            ))
          ) : (
            <span className={styles.noSections}>—</span>
          )}
        </div>
        <span className={styles.memberDate}>{formatInIST(member.created_at)}</span>
        <span className={styles.memberDate}>{formatInIST(member.last_sign_in_at)}</span>
        <span className={styles.expandBtn}>{expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
      </div>

      {expanded && (
        <div className={styles.rowDetail}>
          <div className={styles.detailGrid}>
            <div className={styles.detailField}>
              <span className={styles.detailLabel}>LOCATION</span>
              <span>{strOf(member.location) || "Not set"}</span>
            </div>
            {Boolean(member.github_handle) && (
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>GITHUB</span>
                <a href={ensureGithubUrl(strOf(member.github_handle))} target="_blank" rel="noreferrer" className={styles.detailLink}>{strOf(member.github_handle)}</a>
              </div>
            )}
            {Boolean(member.linkedin_handle) && (
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>LINKEDIN</span>
                <a href={ensureLinkedinUrl(strOf(member.linkedin_handle))} target="_blank" rel="noreferrer" className={styles.detailLink}>{strOf(member.linkedin_handle)}</a>
              </div>
            )}
            <div className={styles.detailField}>
              <span className={styles.detailLabel}>PHONE</span>
              <div className={styles.phoneContainer}>
                <span>{strOf(member.phone_number) || "Not set"}</span>
                {Boolean(member.phone_number) && (
                  member.phone_verified ? (
                    <span className={styles.phoneVerifiedBadge}>✓ VERIFIED</span>
                  ) : (
                    <span className={styles.phoneUnverifiedBadge}>✕ UNVERIFIED</span>
                  )
                )}
              </div>
            </div>
            <div className={styles.detailField}>
              <span className={styles.detailLabel}>SUBSYSTEMS</span>
              <span className={styles.subsystemList}>
                {Array.isArray(member.admin_sections) && member.admin_sections.length > 0 
                  ? member.admin_sections.join(", ") 
                  : "None"}
              </span>
            </div>
          </div>

          <div className={styles.actionsContainer}>
            {/* XP Adjustment */}
            <Form method="post" className={styles.actionBlock}>
              <input type="hidden" name="intent" value="adjust_xp" />
              <input type="hidden" name="userId" value={strOf(member.id)} />
              <span className={styles.actionBlockTitle}>XP_MANAGEMENT</span>
              <div className={styles.inputGroup}>
                <input type="number" name="delta" placeholder="+/- XP" className={styles.xpInput} required />
                <input type="text" name="reason" placeholder="Reason for change" className={styles.reasonInput} required />
                <button type="submit" className={styles.actionBtn} disabled={isSubmitting}>APPLY_XP</button>
              </div>
            </Form>

            {/* Ban/Unban — Sr. Admin + Super Admin only */}
            {(isFounder || isSrAdmin({ admin_role: member.admin_role })) && (
              <Form method="post" className={styles.actionBlock}>
                <input type="hidden" name="intent" value={member.is_banned ? "unban" : "ban"} />
                <input type="hidden" name="userId" value={strOf(member.id)} />
                
                <div className={styles.actionBlockHeader}>
                  <div className={styles.actionBlockTitle}>
                    <ShieldAlert size={14} /> ACCESS_GOVERNANCE
                  </div>
                </div>
                
                <div className={styles.accessGroup}>
                  {!member.is_banned && (
                    <input 
                      type="text" 
                      name="reason" 
                      placeholder="Protocol violation reasoning..." 
                      className={styles.reasonInput} 
                      required 
                    />
                  )}
                  <button type="submit" className={member.is_banned ? styles.unbanBtn : styles.banBtn} disabled={isSubmitting}>
                    {member.is_banned ? "RESTORE_ACCESS" : "TERMINATE_SESSION"}
                  </button>
                </div>
              </Form>
            )}

            {/* Admin Promotion (Founder or Sr. Admin for Jr. Roles) */}
            {(isFounder || (isSrAdmin({ admin_role: member.admin_role }) && !memberIsSrAdmin)) && !isSelf && (
              <>
                {/* Permission grant / update form */}
                <Form method="post" className={styles.actionBlock}>
                  <input type="hidden" name="intent" value="make_admin" />
                  <input type="hidden" name="userId" value={strOf(member.id)} />
                  
                  <div className={styles.actionBlockHeader}>
                    <div className={styles.actionBlockTitle}>
                      <Key size={14} /> SECURITY_CLEARANCE_PROTOCOL
                    </div>
                  </div>

                  <div className={styles.governanceLayout}>
                    {/* Role selector */}
                    <div className={styles.roleSelector}>
                      <p className={styles.selectorHint}>ASSIGN_LEVEL:</p>
                      <div className={styles.rolePills}>
                        {isFounder && (
                          <label className={classnames(styles.rolePillOption, selectedRole === 'sr_admin' && styles.rolePillOptionSrActive)}>
                            <input type="radio" name="role" value="sr_admin" checked={selectedRole === 'sr_admin'} onChange={() => handleRoleChange('sr_admin')} />
                            <span className={styles.roleCheck}><ChevronRight size={10} /></span>
                            <div className={styles.roleInfo}>
                              <span className={styles.roleLabelText}>SR. ADMIN</span>
                              <small>Full clearance • Direct publishing • Root access</small>
                            </div>
                          </label>
                        )}
                        <label className={classnames(styles.rolePillOption, selectedRole === 'jr_admin' && styles.rolePillOptionJrActive)}>
                          <input type="radio" name="role" value="jr_admin" checked={selectedRole === 'jr_admin'} onChange={() => handleRoleChange('jr_admin')} />
                          <span className={styles.roleCheck}><ChevronRight size={10} /></span>
                          <div className={styles.roleInfo}>
                            <span className={styles.roleLabelText}>JR. ADMIN</span>
                            <small>Partial access • Subject to vetting • Internal ops only</small>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Section selector — only shown for Jr. Admin; Sr. Admin auto-gets all */}
                    <div className={styles.subsystemSection}>
                      {selectedRole === 'jr_admin' ? (
                        <div className={styles.sectionSelector}>
                          <div className={styles.selectorHeader}>
                            <p className={styles.selectorHint}>ACTIVE_SUBSYSTEMS:</p>
                            <div className={styles.selectorActions}>
                              <button type="button" onClick={grantAll} className={styles.utilityBtn}>GRANT_FULL</button>
                              <button type="button" onClick={clearAll} className={styles.utilityBtn}>CLEAR_ALL</button>
                            </div>
                          </div>
                          <div className={styles.sectionGrid}>
                            {ALL_SECTIONS.map(s => (
                              <label key={s} className={classnames(styles.sectionLabel, selectedSections.includes(s) && styles.sectionLabelActive)}>
                                <input
                                  type="checkbox"
                                  name="sections"
                                  value={s}
                                  checked={selectedSections.includes(s)}
                                  onChange={() => toggleSection(s)}
                                />
                                <span>{s}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className={styles.srAdminFeedback}>
                          <div className={styles.srAdminIcon}><ShieldCheck size={24} /></div>
                          <p className={styles.srAdminNote}>Level: SR Clearance.<br/>All {SR_ADMIN_AUTO_SECTIONS.length} primary subsystems auto-authorized.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.governanceFooter}>
                    <button type="submit" className={styles.adminToggleBtn} disabled={isSubmitting}>
                      {member.is_admin ? `COMMIT_CLEARANCE_UPDATE` : `INITIALIZE_ADMIN_PROTOCOL`}
                    </button>
                  </div>
                </Form>

                {/* PIN Reset button (Founder only, for existing admins) */}
                {isFounder && member.is_admin && (
                  <Form method="post" className={styles.revokeForm}>
                    <input type="hidden" name="intent" value="reset_pin" />
                    <input type="hidden" name="userId" value={strOf(member.id)} />
                    <button type="submit" className={styles.pinResetBtn} disabled={isSubmitting}>
                      <RotateCcw size={13} /> RESET THEIR ADMIN PIN
                    </button>
                  </Form>
                )}

                {/* Separate revoke form — completely independent */}
                {member.is_admin && (
                  <Form method="post" className={styles.revokeForm}>
                    <input type="hidden" name="intent" value="remove_admin" />
                    <input type="hidden" name="userId" value={strOf(member.id)} />
                    <button type="submit" className={styles.revokeBtn} disabled={isSubmitting}>
                      ✕ REVOKE ALL ADMIN PRIVILEGES
                    </button>
                  </Form>
                )}
              </>
            )}

            {/* HARD DELETE (Super Admin Only) */}
            {isFounder && !isSelf && (
              <div className={styles.actionBlock}>
                <span className={styles.dangerTitle}>CRITICAL_ZONE</span>
                <p className={styles.dangerDesc}>Permanently wipe this user, their XP logs, contributions, and auth account.</p>
                <div className={styles.inputGroup}>
                   <DeleteUserButton userId={strOf(member.id)} userName={strOf(member.display_name || member.email)} />
                </div>
              </div>
            )}
          </div>

          <div className={styles.contributionSection}>
            <Form method="post" className={styles.actionBlock}>
              <input type="hidden" name="intent" value="add_contribution" />
              <input type="hidden" name="userId" value={strOf(member.id)} />
              <span className={styles.actionBlockTitle}>MANUAL_RECORDS_LOG</span>
              <div className={styles.contributionGrid}>
                <input type="text" name="title" placeholder="Title of work" className={styles.fullWidthInput} required />
                <select name="projectId" className={styles.fullWidthInput}>
                  <option value="">No specific project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                <input type="text" name="link" placeholder="External link (optional)" className={styles.fullWidthInput} />
                <textarea name="description" placeholder="Short summary..." className={styles.fullWidthInput} rows={2} />
                <button type="submit" className={styles.actionBtn} disabled={isSubmitting}>COMMIT_RECORD</button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminMembers() {
  const loaderData = useLoaderData<typeof loader>();
  if (!loaderData) return <div className={styles.root}>ERROR_LOADING_DATA</div>;

  const { members, projects, currentAdminEmail, isFounder, isCurrentUserSrAdmin } = loaderData;
  const memberList = (members as any[]) ?? [];
  const [searchParams] = useSearchParams();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const handleDownloadEmails = () => {
    const emails = memberList.map(m => m.email).filter(Boolean).join('\n');
    const blob = new Blob([emails], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tdc_members_emails.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEmailAll = () => {
    setIsEmailModalOpen(true);
  };

  const openEmailClient = (provider: 'gmail' | 'outlook' | 'default') => {
    const emails = memberList.map(m => m.email).filter(Boolean).join(',');
    if (provider === 'gmail') {
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${emails}`, '_blank');
    } else if (provider === 'outlook') {
      window.open(`https://outlook.live.com/mail/0/deeplink/compose?to=${emails}`, '_blank');
    } else {
      window.location.href = `mailto:${emails}`;
    }
    setIsEmailModalOpen(false);
  };

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <h1 className={styles.pageTitle}>// TDC_MEMBER_REGISTRY</h1>
          <span className={styles.countBadge}>{members.length} ENTRIES</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p className={styles.pageDesc}>Manage user profiles, permissions, and internal governance.</p>
          {(isFounder || isCurrentUserSrAdmin) && (
            <div style={{ display: "flex", gap: "8px" }}>
              <button className={styles.utilityBtn} onClick={handleDownloadEmails}>📥 DOWNLOAD EMAILS</button>
              <button className={styles.utilityBtn} onClick={handleEmailAll}>📧 EMAIL EVERYONE</button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.searchBar}>
        <Form method="get" className={styles.searchForm}>
          <input
            type="text"
            name="search"
            defaultValue={searchParams.get("search") ?? ""}
            placeholder="Search by name, email, handle..."
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchBtn}>QUERY</button>
        </Form>
      </div>

      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <span>IDENTIFIER</span>
          <span>ROLE</span>
          <span>XP</span>
          <span>STATUS</span>
          <span>ACCESS</span>
          <span>JOIN_DATE</span>
          <span>LAST_ACTIVE</span>
          <span></span>
        </div>

        {memberList.length === 0 ? (
          <div className={styles.empty}>NO MATCHING ENTRIES FOUND IN DATABASE</div>
        ) : (
          memberList.map((m: any) => (
            <MemberRow 
              key={strOf(m.id as string)} 
              member={m} 
              projects={projects ?? []} 
              currentAdminEmail={currentAdminEmail}
              isFounder={isFounder}
            />
          ))
        )}
      </div>
      
      {isEmailModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsEmailModalOpen(false)}>
          <div className={styles.emailModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.emailModalHeader}>
              <h2 className={styles.emailModalTitle}>Select Email Client</h2>
              <button className={styles.emailCloseBtn} onClick={() => setIsEmailModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.emailProviderList}>
              <button className={styles.providerBtn} onClick={() => openEmailClient('gmail')}>
                <span>Gmail (Web)</span>
                <ChevronRight size={16} />
              </button>
              <button className={styles.providerBtn} onClick={() => openEmailClient('outlook')}>
                <span>Outlook (Web)</span>
                <ChevronRight size={16} />
              </button>
              <button className={styles.providerBtn} onClick={() => openEmailClient('default')}>
                <span>Default System App (Mailto)</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DeleteUserButton({ userId, userName }: { userId: string, userName: string }) {
  const [showModal, setShowModal] = useState(false);
  const nav = useNavigation();
  const isSubmitting = nav.state !== "idle";

  return (
    <>
      <button 
        type="button" 
        className={styles.hardDeleteBtn} 
        onClick={() => setShowModal(true)}
        disabled={isSubmitting}
      >
        <Trash2 size={14} /> HARD_DELETE_ACCOUNT
      </button>

      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={() => {
          const formData = new FormData();
          formData.append("intent", "hard_delete");
          formData.append("userId", userId);
          // Use fetcher if we wanted to avoid navigation, but Form submission is fine for this high-level action
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
        title="DANGER: IRREVERSIBLE DELETION"
        message={`Are you absolutely sure you want to delete ${userName}? This will permanently wipe their profile, auth credentials, XP logs, and all linked contributions. THIS CANNOT BE UNDONE.`}
      />
    </>
  );
}
