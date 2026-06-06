/**
 * Shared project types — safe to import on both client and server.
 */

export type ProjectTier = "BEGINNER" | "INTERMEDIATE" | "FINAL_BOSS" | "GOD_MODE" | "SPONSORED";
export type ProjectStatus = "OPEN" | "RECRUITING" | "IN_PROGRESS" | "CLOSED" | "SHIPPED";
export type FormFieldType = "text" | "textarea" | "radio" | "checkbox" | "select";

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface ProjectRole {
  id: string;
  title: string;
  availability: string;
  locked: boolean;
  description: string;
  questions: string[];
  formFields: FormField[];
}

export interface TechStackItem {
  label: string;
  value: string;
}

export interface TimelineItem {
  label: string;
  status: "SHIPPED" | "IN_PROGRESS" | "PENDING";
  title: string;
  description: string;
}

export interface Contributor {
  name: string;
  role: string;
  github?: string;
  avatar?: string;
}

export interface ProjectPayload {
  id: string;
  tier: ProjectTier;
  tier_level: string;
  status: ProjectStatus;
  title: string;
  tagline: string;
  description: string;
  tech_stack: TechStackItem[];
  timeline: TimelineItem[];
  roles: ProjectRole[];
  team_size: number;
  open_slots: number;
  tags: string[];
  is_published: boolean;
  // Media fields (new)
  teaser_image?: string;
  gallery_images?: string[];
  contributors?: Contributor[];
  live_url?: string;
  github_url?: string;
}

/** Generate a unique project ID (client-safe) */
export function generateProjectId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "TDC_";
  for (let i = 0; i < 4; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}
