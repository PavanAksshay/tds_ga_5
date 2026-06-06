/**
 * Onboarding data store — persisted to localStorage keyed by email.
 * Each email gets its own permanent onboarding record.
 */

export interface OnboardingData {
  role: "student" | "developer" | "founder" | "trainee" | "teacher" | "";
  username: string;
  displayName: string;
  avatarUrl: string;
  collegeName: string;
  companyName: string;
  startupName: string;
  bio: string;
  linkedinHandle: string;
  githubHandle: string;
  resumeLink: string;
  yearsOfExperience: string;
  techStacks: string[];
  location: string;
  availability: "open" | "not_open" | "";
  website: string;
}

export const EMPTY_ONBOARDING: OnboardingData = {
  role: "",
  username: "",
  displayName: "",
  avatarUrl: "",
  collegeName: "",
  companyName: "",
  startupName: "",
  bio: "",
  linkedinHandle: "",
  githubHandle: "",
  resumeLink: "",
  yearsOfExperience: "",
  techStacks: [],
  location: "",
  availability: "",
  website: "",
};

// ── Keys ────────────────────────────────────────────────────
const DATA_KEY = (email: string) => `devcom_onboarding_data_${email}`;
const DONE_KEY = (email: string) => `devcom_onboarding_done_${email}`;

/** Key used to track the currently logged-in user's email */
const CURRENT_EMAIL_KEY = "devcom_current_email";

/** Flag set in sessionStorage to allow one-time onboarding access */
const SESSION_ONBOARDING_GATE = "devcom_onboarding_gate";

// ── Session gate (sessionStorage — cleared on tab close) ────
export function openOnboardingGate(): void {
  sessionStorage.setItem(SESSION_ONBOARDING_GATE, "1");
}

export function consumeOnboardingGate(): boolean {
  const open = sessionStorage.getItem(SESSION_ONBOARDING_GATE) === "1";
  return open;
}

export function clearOnboardingGate(): void {
  sessionStorage.removeItem(SESSION_ONBOARDING_GATE);
}

// ── Current user session ────────────────────────────────────
export function setCurrentEmail(email: string): void {
  localStorage.setItem(CURRENT_EMAIL_KEY, email);
}

export function getCurrentEmail(): string {
  return localStorage.getItem(CURRENT_EMAIL_KEY) ?? "";
}

// ── Per-email onboarding data ───────────────────────────────
export function saveOnboarding(email: string, data: OnboardingData): void {
  localStorage.setItem(DATA_KEY(email), JSON.stringify(data));
  localStorage.setItem(DONE_KEY(email), "1");
}

export function loadOnboarding(email?: string): OnboardingData {
  const key = email ?? getCurrentEmail();
  try {
    const raw = localStorage.getItem(DATA_KEY(key));
    if (raw) return { ...EMPTY_ONBOARDING, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return { ...EMPTY_ONBOARDING };
}

export function isOnboardingComplete(email?: string): boolean {
  const key = email ?? getCurrentEmail();
  return localStorage.getItem(DONE_KEY(key)) === "1";
}
