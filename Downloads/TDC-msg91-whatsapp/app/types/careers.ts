/**
 * Career Listings types — shared between server and client.
 */

export type FormFieldType = "text" | "textarea" | "radio" | "checkbox" | "select";

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  options?: string[];
  required: boolean;
}

export interface CareerRole {
  id: string;
  title: string;
  description: string;
  availability: string; // e.g. "10 hrs/week", "Full-time"
  locked: boolean;
  formFields: FormField[];
}

export type CareerDepartment =
  | "ENGINEERING"
  | "DESIGN"
  | "MARKETING"
  | "OPERATIONS"
  | "CONTENT"
  | "COMMUNITY"
  | "GENERAL";

export type CareerStatus = "OPEN" | "CLOSED" | "PAUSED";
export type LocationType = "REMOTE" | "HYBRID" | "IN_PERSON";
export type CommitmentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "VOLUNTEER";

export interface CareerListing {
  id: string;
  department: CareerDepartment;
  status: CareerStatus;
  title: string;
  tagline: string;
  description: string;
  roles: CareerRole[];
  tags: string[];
  location_type: LocationType;
  commitment: CommitmentType;
  is_published: boolean;
}

export function generateCareerId(): string {
  return `JOB_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
