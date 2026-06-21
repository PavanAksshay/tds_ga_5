/**
 * BROWSER-SAFE Admin Types and Helpers.
 * Logic requiring node:crypto has been moved to admin-shared.server.ts.
 */

export type AdminRole = 'sr_admin' | 'jr_admin';

export type AdminSection =
  | "DASHBOARD"
  | "APPROVALS"
  | "PLANNER"
  | "PROJECTS"
  | "IDEAS"
  | "APPLICATIONS" 
  | "CAREERS" 
  | "CAREER_APPS"
  | "MEMBERS" 
  | "TEAMS" 
  | "INTERVIEWS" 
  | "CONTACTS"
  | "PROGRESS" 
  | "CERTIFICATES" 
  | "SHOWCASE" 
  | "UPDATES"
  | "REVENUE" 
  | "COMMS" 
  | "LEADERBOARD" 
  | "ANALYTICS" 
  | "AUDIT_LOG" 
  | "SETTINGS";

export const SUPER_ADMIN_ONLY_SECTIONS: AdminSection[] = [
  "REVENUE",
  "SETTINGS",
  "AUDIT_LOG",
  "ANALYTICS",
  "COMMS",
  "LEADERBOARD",
  "CERTIFICATES",
];

export const SR_ADMIN_AUTO_SECTIONS: AdminSection[] = [
  "DASHBOARD",
  "APPROVALS",
  "PLANNER",
  "PROJECTS",
  "IDEAS",
  "APPLICATIONS",
  "CAREERS",
  "CAREER_APPS",
  "MEMBERS",
  "TEAMS",
  "INTERVIEWS",
  "CONTACTS",
  "PROGRESS",
  "SHOWCASE",
  "UPDATES",
];

export const JR_ADMIN_ALLOWED_SECTIONS: AdminSection[] = SR_ADMIN_AUTO_SECTIONS;

export function isSrAdmin(profile: any): boolean {
  return profile?.admin_role === 'sr_admin';
}

export function isJrAdmin(profile: any): boolean {
  return profile?.admin_role === 'jr_admin';
}

export function hasPermission(
  profile: any,
  section: AdminSection,
  isFounder: boolean = false
): boolean {
  if (!profile) return false;
  if (isFounder) return true;
  if (SUPER_ADMIN_ONLY_SECTIONS.includes(section)) return false;
  if (section === "APPROVALS") return isSrAdmin(profile);
  if (!profile.admin_sections) return false;
  return profile.admin_sections.includes(section);
}
