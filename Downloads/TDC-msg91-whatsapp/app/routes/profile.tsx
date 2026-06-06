import { useState } from "react";
import { ExternalLink, Terminal, Settings, GitBranch, Link as LinkIcon, Globe, MapPin, Briefcase, ChevronDown, ChevronUp, Share2, Check } from "lucide-react";
import { useLoaderData, useNavigate, redirect, useActionData, Form, useSearchParams, Link } from "react-router";
import type { Route } from "./+types/profile";
import type { Profile } from "../services/profile.server";
import type { ProjectPayload } from "../services/projects.server";
import type { Application } from "../services/applications.server";
import type { Contribution } from "../services/contributions.server";
import styles from "./profile.module.css";
import { TerminalModal } from "../components/terminal-modal/terminal-modal";
import { PhoneVerify } from "../components/phone-verify/phone-verify";
import { ensureGithubUrl, ensureLinkedinUrl } from "~/lib/utils";
import { SITE_URL } from "~/lib/seo";

const ROLE_OPTIONS = [
  { value: "student", label: "STUDENT", sub: "Enrolled in college / university" },
  { value: "developer", label: "WORKING_DEV", sub: "Employed as a software developer" },
  { value: "founder", label: "FOUNDER", sub: "Running or building a startup" },
  { value: "trainee", label: "TRAINEE", sub: "Currently learning / in bootcamp" },
  { value: "teacher", label: "EDUCATOR", sub: "Teaching or mentoring developers" },
] as const;

const TECH_OPTIONS = [
  "JavaScript","TypeScript","Python","Java","C","C++","C#","Go","Rust","Ruby","PHP","Swift","Kotlin","Dart","Scala","R","SQL","PostgreSQL","MySQL","Redis","MongoDB",
  "React","Next.js","Vue.js","Angular","Svelte","Solid.js","Qwik","Node.js","Express.js","Fastify","Django","Flask","FastAPI","Spring Boot","Laravel","Go","Rust",
  "AWS","Google Cloud","Azure","Docker","Kubernetes","Terraform","GitHub Actions","CI/CD","Git","Vite","Webpack"
];

const YR_OPTIONS = ["0", "<1", "1", "2", "3", "4", "5", "6-8", "9-12", "13+"];

export function meta(_: Route.MetaArgs) {
  return [
    { title: "My Profile | The Developer Community" },
    { name: "description", content: "Your developer profile — projects, certificates, applications, and verified proof of work credits." },
    { name: "robots", content: "noindex, nofollow" },
    { tagName: "link", rel: "canonical", href: `${SITE_URL}/profile` },
  ];
}

interface ProfileLoaderData {
  profile: Profile | null;
  applications: Application[];
  careerApplications: any[];
  userProjects: ProjectPayload[];
  contributions: Contribution[];
}


export async function loader({ request }: Route.LoaderArgs): Promise<Response> {
  const { requireAuth } = await import("../services/auth.server");
  const { getProfile } = await import("../services/profile.server");
  const { getUserApplications } = await import("../services/applications.server");
  const { getUserCareerApplications } = await import("../services/careers.server");
  const { getUserProjects } = await import("../services/projects.server");
  const { getUserContributions } = await import("../services/contributions.server");

  const headers = new Headers();
  const user = await requireAuth(request, headers);
  
  const [profile, applications, careerApplications, userProjects, contributions] = await Promise.all([
    getProfile(request, headers, user.id),
    getUserApplications(request, headers, user.id),
    getUserCareerApplications(request, headers, user.id),
    getUserProjects(request, headers, user.id),
    getUserContributions(request, headers, user.id),
  ]);

  if (!profile?.display_name) {
    throw redirect("/onboarding", { headers });
  }

  const { requireGithub } = await import("../services/auth.server");
  await requireGithub(user.id);

  const data: ProfileLoaderData = { profile, applications, careerApplications, userProjects, contributions };
  return Response.json(data, { headers });
}

export async function action({ request }: Route.ActionArgs) {
  const { requireAuth } = await import("../services/auth.server");
  const { getProfile, updateProfile } = await import("../services/profile.server");
  const { normalizeGithubHandle, normalizeLinkedinHandle } = await import("../lib/utils");
  
  const headers = new Headers();
  const user = await requireAuth(request, headers);
  const profile = await getProfile(request, headers, user.id);
  const formData = await request.formData();
  
  const techStacksRaw = String(formData.get("tech_stacks") || "[]");
  let techStacks: string[] = [];
  try { techStacks = JSON.parse(techStacksRaw); } catch { /* ignore */ }

  const updates = {
    display_name: String(formData.get("display_name") || ""),
    username: String(formData.get("username") || "").toLowerCase().replace(/[^a-z0-9._]/g, ""),
    role: String(formData.get("role") || ""),
    college_name: String(formData.get("college_name") || ""),
    company_name: String(formData.get("company_name") || ""),
    startup_name: String(formData.get("startup_name") || ""),
    location: String(formData.get("location") || ""),
    bio: String(formData.get("bio") || ""),
    github_handle: profile?.github_handle || null,
    linkedin_handle: String(formData.get("linkedin_handle") || "") || null,
    website: String(formData.get("website") || ""),
    resume_link: String(formData.get("resume_link") || ""),
    years_of_experience: String(formData.get("years_of_experience") || ""),
    availability: String(formData.get("availability") || "open"),
    tech_stacks: techStacks.length > 0 ? techStacks : null,
    avatar_url: String(formData.get("avatar_url") || profile?.avatar_url || ""),
    email: user.email!,
  };

  const { error } = await updateProfile(request, headers, user.id, updates);
  if (error) return Response.json({ error }, { headers, status: 400 });

  return Response.json({ success: true }, { headers });
}

const XP_TOTAL = 5000;
const SEGMENTS = 30;

function XpBar({ current }: { current: number }) {
  const filled = Math.round((current / XP_TOTAL) * SEGMENTS);
  return (
    <div className={styles.xpBarRow}>
      {Array.from({ length: SEGMENTS }).map((_, i) => (
        <div key={i} className={i < filled ? styles.xpSegFilled : styles.xpSegEmpty} />
      ))}
    </div>
  );
}

function getRoleLabel(role: string | null): string {
  const map: Record<string, string> = {
    student: "STUDENT // UNDERGRAD",
    developer: "WORKING DEV // ENGINEER",
    founder: "FOUNDER // BUILDER",
    trainee: "TRAINEE // LEARNER",
    teacher: "EDUCATOR // MENTOR",
  };
  return role ? (map[role] || "DEVELOPER") : "DEVELOPER";
}

function getOrgLine(profile: Profile | null): string {
  if (!profile) return "";
  if (profile.role === "student" || profile.role === "trainee") return profile.college_name ?? "";
  if (profile.role === "developer" || profile.role === "teacher") return profile.company_name ?? "";
  if (profile.role === "founder") return profile.startup_name ?? "";
  return "";
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  const words = name.trim().split(/[\s_]+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const STATUS_CLASS: Record<string, string> = {
  PENDING: "statusPending",
  ACCEPTED: "statusOffer",
  REJECTED: "statusRejected",
};

/** ─── Edit Profile Form Component ────────────────────────── */
function EditProfileForm({ profile, actionData }: { profile: Profile | null; actionData?: { error?: string; success?: boolean } }) {
  const [techQuery, setTechQuery] = useState("");
  const [techStacks, setTechStacks] = useState<string[]>(profile?.tech_stacks || []);
  const [role, setRole] = useState(profile?.role || "student");
  const [experience, setExperience] = useState(profile?.years_of_experience || "0");
  const [availability, setAvailability] = useState(profile?.availability || "open");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");

  const avatars = Array.from({ length: 20 }, (_, i) => `/avatars/avatar-${i + 1}.png`);

  if (!profile) return null;

  const filteredTech = techQuery.trim().length > 0
    ? TECH_OPTIONS.filter(t => t.toLowerCase().includes(techQuery.toLowerCase()) && !techStacks.includes(t)).slice(0, 8)
    : [];

  const addTech = (t: string) => {
    if (!techStacks.includes(t)) setTechStacks([...techStacks, t]);
    setTechQuery("");
  };

  const removeTech = (t: string) => setTechStacks(techStacks.filter(s => s !== t));

  return (
    <Form method="post" className={styles.editForm}>
      <input type="hidden" name="tech_stacks" value={JSON.stringify(techStacks)} />
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="years_of_experience" value={experience} />
      <input type="hidden" name="availability" value={availability} />
      <input type="hidden" name="avatar_url" value={avatarUrl} />
      
      {actionData?.error && <div className={styles.formError}>{actionData.error}</div>}
      {actionData?.success && <div className={styles.formSuccess}>PROFILE_UPDATED_SUCCESSFULLY</div>}

      <section className={styles.settingsSection}>
        <h3 className={styles.sectionHeader}>IDENTITY_RELOAD</h3>
        <div className={styles.avatarGrid}>
          {avatars.map((url) => (
            <button
              key={url}
              type="button"
              className={`${styles.avatarOption} ${avatarUrl === url ? styles.avatarOptionActive : ""}`}
              onClick={() => setAvatarUrl(url)}
            >
              <img src={url} alt="Avatar option" className={styles.avatarOptionImg} />
            </button>
          ))}
        </div>
        <div className={styles.formGrid} style={{ marginTop: "24px" }}>
          <div className={styles.formGroup}>
            <label>DISPLAY_NAME</label>
            <input name="display_name" defaultValue={profile.display_name || ""} placeholder="Real Name" className={styles.formInput} />
          </div>
          <div className={styles.formGroup}>
            <label>CORE_EMAIL</label>
            <input value={profile.email} className={styles.formInput} disabled title="Email is managed via account settings" />
          </div>
          <div className={styles.formGroup}>
            <label>USERNAME</label>
            <div className={styles.usernameWrap}>
              <span>@</span>
              <input name="username" defaultValue={profile.username || ""} className={styles.formInput} />
            </div>
          </div>
        </div>
      </section>

      <section id="whatsapp-verification-section" className={styles.settingsSection}>
        <h3 className={styles.sectionHeader}>WHATSAPP_VERIFICATION</h3>
        <PhoneVerify
          initialVerified={Boolean(profile.phone_verified)}
          initialPhone={profile.phone_number}
        />
      </section>

      <section className={styles.settingsSection}>
        <h3 className={styles.sectionHeader}>IDENTIFY_ROLE</h3>
        <div className={styles.roleGrid}>
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.roleCard} ${role === opt.value ? styles.roleCardActive : ""}`}
              onClick={() => setRole(opt.value)}
            >
              <span className={styles.roleLabel}>{opt.label}</span>
              <span className={styles.roleSub}>{opt.sub}</span>
            </button>
          ))}
        </div>
        <div className={styles.formGrid} style={{ marginTop: "16px" }}>
          <div className={styles.formGroup}>
            <label>
              {role === "student" || role === "trainee" ? "COLLEGE_NAME" : 
               role === "founder" ? "STARTUP_NAME" : "COMPANY_NAME"}
            </label>
            <input 
              name={role === "student" || role === "trainee" ? "college_name" : 
                    role === "founder" ? "startup_name" : "company_name"} 
              defaultValue={
                role === "student" || role === "trainee" ? profile.college_name || "" : 
                role === "founder" ? profile.startup_name || "" : (profile as any).company_name || ""
              }
              className={styles.formInput} 
            />
          </div>
          <div className={styles.formGroup}>
            <label>LOCATION</label>
            <input name="location" defaultValue={profile.location || ""} className={styles.formInput} />
          </div>
        </div>
      </section>

      <section className={styles.settingsSection}>
        <h3 className={styles.sectionHeader}>CALIBRATE_XP</h3>
        <div className={styles.chipGrid}>
          {YR_OPTIONS.map((yr) => (
            <button
              key={yr}
              type="button"
              className={`${styles.chip} ${experience === yr ? styles.chipActive : ""}`}
              onClick={() => setExperience(yr)}
            >
              {yr === "0" ? "NONE" : `${yr} YR${yr === "1" ? "" : "S"}`}
            </button>
          ))}
        </div>
        
        <div className={styles.formGroup} style={{ marginTop: "24px" }}>
          <label>AVAILABILITY_STATUS</label>
          <div className={styles.availRow}>
            <button
              type="button"
              className={`${styles.availBtn} ${availability === "open" ? styles.availBtnActive : ""}`}
              onClick={() => setAvailability("open")}
            >
              OPEN_TO_WORK
            </button>
            <button
              type="button"
              className={`${styles.availBtn} ${availability === "not_open" ? styles.availBtnActive : ""}`}
              onClick={() => setAvailability("not_open")}
            >
              NOT_AVAILABLE
            </button>
          </div>
        </div>
      </section>

      <section className={styles.settingsSection}>
        <h3 className={styles.sectionHeader}>PRESENCE_LINKS</h3>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>GITHUB_ACCOUNT</label>
            {profile.github_id ? (
              <div className={styles.githubConnectedBox}>
                <span className={styles.githubConnectedBadge}>
                  <Check size={12} aria-hidden="true" />
                  CONNECTED: @{profile.github_handle}
                </span>
                <a
                  href="/auth/github?redirect=/profile&force=1"
                  className={styles.githubReconnectBtn}
                  rel="external"
                >
                  RECONNECT
                </a>
              </div>
            ) : (
              <div className={styles.githubConnectedBox}>
                <span className={styles.githubConnectedBadge} style={{ color: "var(--color-on-surface-subtle)" }}>
                  NOT_CONNECTED
                </span>
                <a
                  href="/auth/github?redirect=/profile&force=1"
                  className={styles.githubConnectBtn}
                  rel="external"
                >
                  CONNECT
                </a>
              </div>
            )}
          </div>
          <div className={styles.formGroup}>
            <label>LINKEDIN_LINK</label>
            <input name="linkedin_handle" defaultValue={profile.linkedin_handle || ""} className={styles.formInput} placeholder="https://linkedin.com/in/your-profile" />
          </div>
          <div className={styles.formGroup}>
            <label>PERSONAL_WEBSITE</label>
            <input name="website" defaultValue={profile.website || ""} className={styles.formInput} placeholder="https://..." />
          </div>
          <div className={styles.formGroup}>
            <label>RESUME_LINK</label>
            <input name="resume_link" defaultValue={profile.resume_link || ""} className={styles.formInput} placeholder="https://..." />
          </div>
        </div>
      </section>

      <section className={styles.settingsSection}>
        <h3 className={styles.sectionHeader}>BIO_AND_STACK</h3>
        <div className={styles.formGroup}>
          <label>SHORT_BIO</label>
          <textarea name="bio" defaultValue={profile.bio || ""} className={styles.formTextarea} rows={3} />
        </div>

        <div className={styles.formGroup} style={{ marginTop: "24px" }}>
          <label>TECH_STACK_OVERRIDE</label>
          <div className={styles.techSearch}>
            <input 
              value={techQuery} 
              onChange={(e) => setTechQuery(e.target.value)}
              placeholder="Search technologies..."
              className={styles.formInput}
              autoComplete="off"
            />
            {filteredTech.length > 0 && (
              <div className={styles.techResults}>
                {filteredTech.map(t => (
                  <button key={t} type="button" onClick={() => addTech(t)}>{t}</button>
                ))}
              </div>
            )}
          </div>
          <div className={styles.techList}>
            {techStacks.map(t => (
              <span key={t} className={styles.techChip}>
                {t} <button type="button" onClick={() => removeTech(t)}>×</button>
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.formActions}>
        <button type="submit" className={styles.saveBtn}>EXECUTE_RECOMPILE &rarr;</button>
      </div>
    </Form>
  );
}

/** ─── Profile Applications Tab ────────────────────────────── */
function AppCard({ app, type }: { app: any; type: "project" | "career" }) {
  const [expanded, setExpanded] = useState(false);
  const dateStr = new Date(app.submitted_at ?? "").toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  const hasDetails = type === "career"
    ? (app.answers && Object.keys(app.answers).length > 0) || app.linkedin_handle || app.github_handle || app.resume_link
    : !!app.message;

  return (
    <div className={styles.appCard}>
      <div className={styles.appCardTop}>
        <div className={styles.appCardLeft}>
          <span className={styles.appRoleTitle}>{app.role_title || "Contributor"}</span>
          <span className={styles.appListingId}>
            {type === "career" ? `Listing · ${app.listing_id}` : `Project · ${app.project_id}`}
          </span>
          <span className={styles.appDate}>{dateStr}</span>
        </div>
        <span className={`${styles.appStatus} ${styles[`appStatus_${app.status}`]}`}>
          {app.status?.replace(/_/g, " ")}
        </span>
      </div>

      {hasDetails && (
        <button className={styles.appExpandBtn} onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          {expanded ? "HIDE DETAILS" : type === "career" ? "VIEW MY APPLICATION" : "VIEW MY RESPONSE"}
        </button>
      )}

      {expanded && (
        <div className={styles.appAnswers}>
          {type === "career" && (
            <>
              {(app.linkedin_handle || app.github_handle || app.resume_link) && (
                <div className={styles.appLinks}>
                  {app.linkedin_handle && (
                    <a href={ensureLinkedinUrl(app.linkedin_handle)}
                      target="_blank" rel="noreferrer" className={styles.appLink}>LinkedIn ↗</a>
                  )}
                  {app.github_handle && (
                    <a href={ensureGithubUrl(app.github_handle)}
                      target="_blank" rel="noreferrer" className={styles.appLink}>GitHub ↗</a>
                  )}
                  {app.resume_link && (
                    <a href={app.resume_link} target="_blank" rel="noreferrer" className={styles.appLink}>Resume ↗</a>
                  )}
                </div>
              )}
              {app.answers && Object.entries(app.answers).map(([key, val]) => (
                <div key={key} className={styles.appAnswerBlock}>
                  <p className={styles.appAnswerLabel}>{key.replace(/^[^_]+__/, "").replace(/_/g, " ")}</p>
                  <p className={styles.appAnswerValue}>{String(val)}</p>
                </div>
              ))}
            </>
          )}
          {type === "project" && app.message && (
            <div className={styles.appAnswerBlock}>
              <p className={styles.appAnswerLabel}>YOUR MESSAGE</p>
              <p className={styles.appAnswerValue}>{app.message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileApplicationsTab({ projectApps, careerApps }: { projectApps: any[]; careerApps: any[] }) {
  const [subTab, setSubTab] = useState<"project" | "career">("project");
  const list = subTab === "career" ? careerApps : projectApps;

  return (
    <div className={styles.appsTab}>
      <div className={styles.appsSubTabBar}>
        <button
          className={`${styles.appsSubTab} ${subTab === "project" ? styles.appsSubTabActive : ""}`}
          onClick={() => setSubTab("project")}
        >
          PROJECT
          {projectApps.length > 0 && <span className={styles.appsCount}>{projectApps.length}</span>}
        </button>
        <button
          className={`${styles.appsSubTab} ${subTab === "career" ? styles.appsSubTabActive : ""}`}
          onClick={() => setSubTab("career")}
        >
          CAREER
          {careerApps.length > 0 && <span className={styles.appsCount}>{careerApps.length}</span>}
        </button>
      </div>

      {list.length > 0 ? (
        <div className={styles.appsList}>
          {list.map((app) => (
            <AppCard key={app.id} app={app} type={subTab} />
          ))}
        </div>
      ) : (
        <div className={styles.appsEmpty}>
          <Briefcase size={32} strokeWidth={1} style={{ opacity: 0.3 }} />
          <p>No {subTab} applications yet.</p>
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { profile, applications, careerApplications, userProjects, contributions } = useLoaderData<ProfileLoaderData>();
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const actionData = useActionData<{ error?: string; success?: boolean }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") || "PROJECTS").toUpperCase();
  const [activeTab, setActiveTab] = useState(initialTab);

  const displayName = profile?.display_name ?? "Anonymous User";
  const initials = getInitials(displayName);
  const orgLine = getOrgLine(profile ?? null);
  const xpCurrent = profile?.xp ?? 0;
  const xpPct = Math.round((xpCurrent / XP_TOTAL) * 100);

  const handleEditProfile = () => {
    navigate("/onboarding");
  };

  const handleShare = () => {
    if (!profile?.username) return;
    const url = `${window.location.origin}/dev/${profile.username}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={styles.root}>
      {isTerminalOpen && (
        <TerminalModal 
          contributions={contributions}
          username={profile?.display_name || "MEMBER"}
          onClose={() => setIsTerminalOpen(false)}
        />
      )}
      <div className={styles.container}>
        <header className={styles.hero}>
          <div className={styles.avatarCol}>
            <div className={styles.avatar}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className={styles.avatarImage} />
              ) : (
                <span className={styles.avatarInitials}>{initials}</span>
              )}
            </div>
            <div className={styles.socialLinks}>
              {profile?.github_handle && (
                <a href={ensureGithubUrl(profile.github_handle)} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                  <GitBranch size={14} />
                  <span>GitHub</span>
                </a>
              )}
              {profile?.linkedin_handle && (
                <a href={ensureLinkedinUrl(profile.linkedin_handle)} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                  <LinkIcon size={14} />
                  <span>LinkedIn</span>
                </a>
              )}
              {profile?.website && (
                <a href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                  <Globe size={12} />
                  <span>WEB</span>
                </a>
              )}
            </div>
          </div>

          <div className={styles.identity}>
            <h1 className={styles.realName}>{displayName}<span className={styles.blink}>_</span></h1>
            <div className={styles.username}>
              @{profile?.username} #{profile?.tag}
            </div>
            <div className={styles.userEmail}>
              {profile?.email}
            </div>
            <div className={styles.phoneStatusBadgeRow}>
              {profile?.phone_verified ? (
                <span className={styles.phoneBadgeVerified}>
                  ✓ PHONE_VERIFIED
                </span>
              ) : (
                <span className={styles.phoneBadgeUnverified}>
                  ✗ PHONE_UNVERIFIED
                </span>
              )}
            </div>
            <div className={styles.level}>
              {getRoleLabel(profile?.role ?? null)}
            </div>
            {orgLine && <div className={styles.orgLine}>{orgLine}</div>}
            {profile?.location && (
              <div className={styles.locationLine}>
                <MapPin size={10} />
                {profile.location.toUpperCase()}
              </div>
            )}
          </div>

          <div className={styles.bioCol}>
            <div className={styles.xpSection}>
              <div className={styles.xpLabelRow}>
                <span className={styles.xpLabel}>SYSTEM XP LOADOUT</span>
                <span className={styles.xpValue}>{xpCurrent.toLocaleString()} / {XP_TOTAL.toLocaleString()}</span>
              </div>
              <XpBar current={xpCurrent} />
              <div className={styles.xpPct}>{xpPct}% LOADED</div>
            </div>
            <p className={styles.bio}>
              {profile?.bio || "Complete your profile to build your identity."}
            </p>
            <div className={styles.skills}>
              {(profile?.tech_stacks || []).map((s) => (
                <span key={s} className={styles.skill}>{s}</span>
              ))}
            </div>
          </div>

          <div className={styles.actionsCol}>
            <button className={styles.actionBtn} onClick={() => setActiveTab("SETTINGS")}>
              <Settings size={14} /> EDIT_PROFILE
            </button>
            <button
              className={styles.actionBtn}
              onClick={() => setActiveTab("APPLICATIONS")}
            >
              <Briefcase size={14} /> MY_APPLICATIONS
            </button>
            <button 
              className={styles.actionBtn}
              onClick={() => setIsTerminalOpen(true)}
            >
              <Terminal size={18} />
              contribution.cmd
            </button>
            <button
              className={styles.actionBtn}
              onClick={handleShare}
            >
              {isCopied ? <Check size={14} /> : <Share2 size={14} />}
              {isCopied ? "LINK_COPIED" : "SHARE_PROFILE"}
            </button>
          </div>
        </header>

        {!profile?.phone_verified && (
          <button
            type="button"
            className={styles.verifyPromptBanner}
            onClick={() => {
              setActiveTab("SETTINGS");
              setTimeout(() => {
                const element = document.getElementById("whatsapp-verification-section");
                element?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
          >
            &gt; WARNING: PHONE_NUMBER_NOT_VERIFIED. Click here to verify now &rarr;
          </button>
        )}

        <div className={styles.mainGrid}>
          <div className={styles.contentCol}>
            <div className={styles.tabBar}>
              <button
                className={`${styles.tab} ${activeTab === "PROJECTS" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("PROJECTS")}
              >
                PROJECTS
              </button>
              <button
                className={`${styles.tab} ${activeTab === "CERTIFICATES" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("CERTIFICATES")}
              >
                CERTIFICATES
              </button>
              <button
                className={`${styles.tab} ${activeTab === "SETTINGS" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("SETTINGS")}
              >
                SETTINGS
              </button>
              <button
                className={`${styles.tab} ${activeTab === "APPLICATIONS" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("APPLICATIONS")}
              >
                APPLICATIONS
              </button>
            </div>

            <div className={styles.tabContent}>
              {activeTab === "PROJECTS" && (
                <div className={styles.projectsList}>
                  {userProjects.length > 0 ? (
                    userProjects.map((project) => (
                      <div key={project.id} className={styles.projectCard}>
                        <div className={styles.projectCardHeader}>
                          <div>
                            <h3 className={styles.projectName}>{project.title}</h3>
                            <p className={styles.projectMeta}>
                              {project.tier} &bull; {project.status}
                            </p>
                          </div>
                          <ExternalLink size={16} className={styles.externalIcon} />
                        </div>
                        <p className={styles.projectDesc}>{project.tagline}</p>
                        <div className={styles.projectTags}>
                          {(project.tech_stack as any[]).map((tech) => (
                            <span key={tech.label} className={styles.projectTag}>{tech.label}</span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.emptyApplications}>
                      <p>You haven't joined any projects yet.</p>
                      <button 
                        style={{ 
                          background: "transparent", 
                          border: "1px solid var(--color-border)", 
                          color: "var(--color-on-surface)", 
                          padding: "8px 16px", 
                          marginTop: "16px",
                          fontFamily: "var(--family-mono)",
                          fontSize: "10px",
                          cursor: "pointer"
                        }}
                        onClick={() => navigate("/projects")}
                      >
                        EXPLORE_PROJECTS &rarr;
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "CERTIFICATES" && (
                <div className={styles.emptyApplications}>
                  <p>Verified certificates and badges will appear here.</p>
                  <p style={{ marginTop: "8px", opacity: 0.5 }}>SYSTEM COMING SOON</p>
                </div>
              )}

              {activeTab === "SETTINGS" && (
                <EditProfileForm profile={profile} actionData={actionData} />
              )}

              {activeTab === "APPLICATIONS" && (
                <ProfileApplicationsTab
                  projectApps={applications}
                  careerApps={careerApplications}
                />
              )}
            </div>
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.sideCard}>
              <h4 className={styles.sideCardTitle}>ACTIVE STATUS</h4>
              <div className={styles.statusRow}>
                <span className={styles.statusKey}>AVAILABILITY</span>
                <span className={profile?.availability === "open" ? styles.statusReady : styles.statusNotAvail}>
                  {(profile?.availability || "OPEN").toUpperCase()}
                </span>
              </div>
              <div className={styles.statusRow}>
                <span className={styles.statusKey}>EXPERIENCE</span>
                <span className={styles.statusVal}>{profile?.years_of_experience || "N/A"}</span>
              </div>
              <div className={styles.statusRow}>
                <span className={styles.statusKey}>ZONE</span>
                <span className={styles.statusVal}>{(profile?.location || "CZC").toUpperCase()}</span>
              </div>
            </div>

            <div className={styles.sideCard}>
              <h4 className={styles.sideCardTitle}>APPLICATIONS: {applications.length}</h4>
              <div className={styles.queueList}>
                {applications.length > 0 ? (
                  applications.slice(0, 5).map((a) => (
                    <div key={a.id} className={styles.queueRow}>
                      <div className={`${styles.queueDot} ${a.status === "REJECTED" ? styles.queueDotOff : styles.queueDotOn}`} />
                      <span className={styles.queueRole}>{a.role_title} @ {a.project_id}</span>
                      <span className={`${styles.queueStatus} ${styles[STATUS_CLASS[a.status] ?? "statusPending"]}`}>
                        {a.status.slice(0, 3)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className={styles.queueEmpty}>No applications yet.</p>
                )}
              </div>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}