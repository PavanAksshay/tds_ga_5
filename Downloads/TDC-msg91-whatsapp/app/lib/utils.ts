import classNames from "classnames";

type ClassValue = string | number | boolean | undefined | null | { [key: string]: any } | ClassValue[];

export function cn(...inputs: ClassValue[]) {
  return classNames(...inputs);
}

/** Formats a date string/Date object to IST (UTC+5:30) */
/** Formats a date string/Date object to IST (UTC+5:30) */
export function formatInIST(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const raw = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(d);
  
  // Convert "4/18/2026, 07:31:22 PM" format to "Apr 18, 2026, 07:31:22 pm"
  // Actually Intl.DateTimeFormat with 'short' month and '2-digit' day gives something like "Apr 18, 2026, 07:31:22 PM"
  return raw.replace(/AM$/, 'am').replace(/PM$/, 'pm');
}

/**
 * Strips any URL prefix from a GitHub handle and returns just the username.
 * Handles: "vk-amogh", "github.com/vk-amogh", "https://github.com/vk-amogh",
 *          "https://www.github.com/vk-amogh/", "@vk-amogh"
 * Returns: "vk-amogh"
 */
export function normalizeGithubHandle(raw: string | null | undefined): string {
  if (!raw) return "";
  let s = raw.trim();
  // Strip protocol
  s = s.replace(/^https?:\/\//i, "");
  // Strip www.
  s = s.replace(/^www\./i, "");
  // Strip github.com/ prefix
  s = s.replace(/^github\.com\//i, "");
  // Strip leading @ sign
  s = s.replace(/^@/, "");
  // Strip trailing slash
  s = s.replace(/\/$/, "");
  return s;
}

/**
 * Strips any URL prefix from a LinkedIn handle and returns just the profile slug.
 * Handles: "vk-amogh", "linkedin.com/in/vk-amogh", "https://www.linkedin.com/in/vk-amogh/",
 *          "https://linkedin.com/in/vk-amogh"
 * Returns: "vk-amogh"
 */
export function normalizeLinkedinHandle(raw: string | null | undefined): string {
  if (!raw) return "";
  let s = raw.trim();
  // Strip protocol
  s = s.replace(/^https?:\/\//i, "");
  // Strip www.
  s = s.replace(/^www\./i, "");
  // Strip linkedin.com/in/ prefix
  s = s.replace(/^linkedin\.com\/in\//i, "");
  // Strip linkedin.com/ prefix (in case /in/ was already stripped or wasn't there)
  s = s.replace(/^linkedin\.com\//i, "");
  // Strip trailing slash
  s = s.replace(/\/$/, "");
  return s;
}

export function toAbsoluteUrl(raw: string | null | undefined): string {
  if (!raw || !raw.trim()) return "";
  const s = raw.trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return `https://${s}`;
}

/**
 * Ensures a GitHub string is a full clickable URL.
 */
export function ensureGithubUrl(raw: string | null | undefined): string {
  if (!raw || !raw.trim()) return "";
  const s = raw.trim();
  if (s.startsWith("https://github.com/")) return s;
  if (s.includes("github.com/")) {
    return s.startsWith("http") ? s : `https://${s}`;
  }
  const clean = s.replace(/^@/, "").replace(/^\//, "");
  return `https://github.com/${clean}`;
}

/**
 * Ensures a LinkedIn string is a full clickable URL.
 */
export function ensureLinkedinUrl(raw: string | null | undefined): string {
  if (!raw || !raw.trim()) return "";
  const s = raw.trim();
  if (s.startsWith("https://www.linkedin.com/in/")) return s;
  if (s.includes("linkedin.com/in/")) {
    const withProto = s.startsWith("http") ? s : `https://${s}`;
    return withProto.includes("www.") ? withProto : withProto.replace("linkedin.com", "www.linkedin.com");
  }
  const clean = s.replace(/^\//, "");
  // handle just the username or slug
  if (!clean.includes("linkedin.com")) {
    return `https://www.linkedin.com/in/${clean}/`;
  }
  return s.startsWith("http") ? s : `https://${s}`;
}

