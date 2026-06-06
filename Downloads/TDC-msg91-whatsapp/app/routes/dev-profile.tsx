import { useState } from "react";
import { ExternalLink, Terminal, GitBranch, Link, Globe, MapPin } from "lucide-react";
import { useLoaderData, useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/dev-profile";
import type { Profile } from "../services/profile.server";
import type { ProjectPayload } from "../services/projects.server";
import type { Contribution } from "../services/contributions.server";
import styles from "./profile.module.css";
import { TerminalModal } from "../components/terminal-modal/terminal-modal";
import { ensureGithubUrl, ensureLinkedinUrl } from "~/lib/utils";
import { SITE_URL } from "~/lib/seo";

export function meta({ data }: Route.MetaArgs) {
  const loaderData = data as unknown as PublicProfileLoaderData;
  if (!loaderData?.profile) {
    return [{ title: "User Not Found | The Developer Community" }];
  }
  const name = loaderData.profile.display_name || `@${loaderData.profile.username}`;
  return [
    { title: `${name} | The Developer Community` },
    { name: "description", content: loaderData.profile.bio || `View ${name}'s developer profile on The Developer Community.` },
    { tagName: "link", rel: "canonical", href: `${SITE_URL}/dev/${loaderData.profile.username}` },
  ];
}

interface PublicProfileLoaderData {
  profile: Profile;
  userProjects: ProjectPayload[];
  contributions: Contribution[];
}

export async function loader({ params }: Route.LoaderArgs): Promise<Response> {
  const { getPublicProfileByUsername } = await import("../services/profile.server");
  const { getPublicUserProjects } = await import("../services/projects.server");
  const { getPublicUserContributions } = await import("../services/contributions.server");

  const username = params.username as string;
  const profile = await getPublicProfileByUsername(username);

  if (!profile) {
    throw new Response("User Not Found", { status: 404 });
  }

  const [userProjects, contributions] = await Promise.all([
    getPublicUserProjects(profile.id),
    getPublicUserContributions(profile.id),
  ]);

  const data: PublicProfileLoaderData = { profile, userProjects, contributions };
  return Response.json(data);
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

export default function PublicProfile() {
  const { profile, userProjects, contributions } = useLoaderData<PublicProfileLoaderData>();
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") || "PROJECTS").toUpperCase();
  const [activeTab, setActiveTab] = useState(initialTab === "CERTIFICATES" ? "CERTIFICATES" : "PROJECTS");

  const displayName = profile.display_name ?? "Anonymous User";
  const initials = getInitials(displayName);
  const orgLine = getOrgLine(profile);
  const xpCurrent = profile.xp ?? 0;
  const xpPct = Math.round((xpCurrent / XP_TOTAL) * 100);

  return (
    <div className={styles.root}>
      {isTerminalOpen && (
        <TerminalModal
          contributions={contributions}
          username={profile.display_name || profile.username || "MEMBER"}
          onClose={() => setIsTerminalOpen(false)}
        />
      )}
      <div className={styles.container}>
        <header className={styles.hero}>
          <div className={styles.avatarCol}>
            <div className={styles.avatar}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className={styles.avatarImage} />
              ) : (
                <span className={styles.avatarInitials}>{initials}</span>
              )}
            </div>
            <div className={styles.socialLinks}>
              {profile.github_handle && (
                <a href={ensureGithubUrl(profile.github_handle)} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                  <GitBranch size={14} />
                  <span>GitHub</span>
                </a>
              )}
              {profile.linkedin_handle && (
                <a href={ensureLinkedinUrl(profile.linkedin_handle)} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                  <Link size={14} />
                  <span>LinkedIn</span>
                </a>
              )}
              {profile.website && (
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
              @{profile.username} #{profile.tag}
            </div>
            <div className={styles.level}>
              {getRoleLabel(profile.role)}
            </div>
            {orgLine && <div className={styles.orgLine}>{orgLine}</div>}
            {profile.location && (
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
              {profile.bio || "This user is building their identity."}
            </p>
            <div className={styles.skills}>
              {(profile.tech_stacks || []).map((s) => (
                <span key={s} className={styles.skill}>{s}</span>
              ))}
            </div>
          </div>

          <div className={styles.actionsCol}>
            <button 
              className={styles.actionBtn}
              onClick={() => setIsTerminalOpen(true)}
            >
              <Terminal size={18} />
              contribution.cmd
            </button>
          </div>
        </header>

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
                          <a href={`/projects/${project.id}`} target="_blank" rel="noreferrer" style={{ color: "var(--color-on-surface-muted)" }}>
                            <ExternalLink size={16} className={styles.externalIcon} />
                          </a>
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
                      <p>No public projects to display yet.</p>
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
            </div>
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.sideCard}>
              <h4 className={styles.sideCardTitle}>ACTIVE STATUS</h4>
              <div className={styles.statusRow}>
                <span className={styles.statusKey}>AVAILABILITY</span>
                <span className={profile.availability === "open" ? styles.statusReady : styles.statusNotAvail}>
                  {(profile.availability || "OPEN").toUpperCase()}
                </span>
              </div>
              <div className={styles.statusRow}>
                <span className={styles.statusKey}>EXPERIENCE</span>
                <span className={styles.statusVal}>{profile.years_of_experience || "N/A"}</span>
              </div>
              <div className={styles.statusRow}>
                <span className={styles.statusKey}>ZONE</span>
                <span className={styles.statusVal}>{(profile.location || "CZC").toUpperCase()}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}