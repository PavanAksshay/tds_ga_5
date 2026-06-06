import { useLoaderData, Link } from "react-router";
import { useEffect, useState } from "react";
import type { Route } from "./+types/dashboard";
import { requireAdmin, getDashboardStats } from "../../services/admin.server";
import { getAllProjectsAdmin, type ProjectPayload } from "../../services/projects.server";
import { Users, FileText, Clock, CircleCheck, AlertTriangle, Activity } from "lucide-react";
import { useAutoScroll } from "../../hooks/use-auto-scroll";
import styles from "./dashboard.module.css";

type ActivityItem = Record<string, unknown>;

function strOf(v: unknown): string {
  return v != null ? String(v) : "";
}

export async function loader({ request }: Route.LoaderArgs): Promise<Response> {
  const headers = new Headers();
  await requireAdmin(request, headers);
  const [stats, projects] = await Promise.all([
    getDashboardStats(request, headers),
    getAllProjectsAdmin(request, headers),
  ]);
  return Response.json({
    totalMembers: stats.totalMembers,
    totalApplications: stats.totalApplications,
    pendingApplications: stats.pendingApplications,
    acceptedApplications: stats.acceptedApplications,
    recentActivity: stats.recentActivity as ActivityItem[],
    projects,
  }, { headers });
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: string;
}

function StatCard({ label, value, icon, accent }: StatCardProps) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={accent ? { color: accent } : undefined}>{icon}</div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { totalMembers, totalApplications, pendingApplications, acceptedApplications, recentActivity, projects } =
    useLoaderData<typeof loader>();
  const activity = recentActivity as ActivityItem[];
  const dbProjects = projects as ProjectPayload[];

  const openProjects = dbProjects.filter((p) => p.status === "OPEN" || p.status === "RECRUITING").length;
  const totalOpenSlots = dbProjects.reduce((sum, p) => sum + p.open_slots, 0);

  const trackRef = useAutoScroll();

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>// DASHBOARD</h1>
        <p className={styles.pageDesc}>Live overview of platform activity.</p>
      </div>

      <div 
        className={styles.statsGrid}
        ref={trackRef as any}
      >
        <StatCard label="TOTAL MEMBERS" value={totalMembers} icon={<Users size={18} />} />
        <StatCard label="ACTIVE PROJECTS" value={openProjects} icon={<Activity size={18} />} accent="#22c55e" />
        <StatCard label="PENDING APPS" value={pendingApplications} icon={<Clock size={18} />} accent="#f59e0b" />
        <StatCard label="ACCEPTED APPS" value={acceptedApplications} icon={<CircleCheck size={18} />} accent="#22c55e" />
        <StatCard label="TOTAL APPS" value={totalApplications} icon={<FileText size={18} />} />
        <StatCard label="OPEN SLOTS" value={totalOpenSlots} icon={<AlertTriangle size={18} />} accent="#60a5fa" />
      </div>

      <div className={styles.panels}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>// RECENT ACTIVITY</span>
          </div>
          <div className={styles.panelBody}>
            {activity.length === 0 ? (
              <div className={styles.empty}>No recent activity.</div>
            ) : (
              <ul className={styles.activityList}>
                {activity.map((item) => {
                  const profiles = item.profiles as Record<string, unknown> | null;
                  return (
                    <li key={strOf(item.id)} className={styles.activityItem}>
                      <span className={styles.activityDot} data-status={strOf(item.status)} />
                      <div>
                        <span className={styles.activityName}>{profiles?.display_name ? strOf(profiles.display_name) : strOf(item.email)}</span>
                        <span className={styles.activitySep}> applied for </span>
                        <span className={styles.activityRole}>{strOf(item.role_title)}</span>
                        <span className={styles.activitySep}> on </span>
                        <span className={styles.activityProject}>{strOf(item.project_id)}</span>
                      </div>
                      <span className={`${styles.statusBadge} ${styles["status" + strOf(item.status)]}`}>
                        {strOf(item.status)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>// QUICK ACTIONS</span>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.quickActions}>
              <Link to="/admin/applications" className={styles.quickBtn}>Review Applications</Link>
              <Link to="/admin/members" className={styles.quickBtn}>Manage Members</Link>
              <Link to="/admin/projects" className={styles.quickBtn}>Manage Projects</Link>
              <Link to="/admin/teams" className={styles.quickBtn}>Build Teams</Link>
              <Link to="/admin/certificates" className={styles.quickBtn}>Issue Certificates</Link>
              <Link to="/admin/audit" className={styles.quickBtn}>View Audit Log</Link>
            </div>
          </div>
        </section>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>// PROJECT STATUS</span>
        </div>
        <div className={styles.panelBody}>
          {dbProjects.length === 0 ? (
            <div className={styles.empty}>No projects yet. <Link to="/admin/projects" className={styles.quickBtn}>Create one</Link></div>
          ) : (
            <div className={styles.projectTable}>
              {dbProjects.map((p) => (
                <div key={p.id} className={styles.projectRow}>
                  <span className={styles.projectId}>{p.id}</span>
                  <span className={styles.projectTitle}>{p.title}</span>
                  <span className={styles.projectTier}>{p.tier}</span>
                  <span className={styles.projectStatus} data-status={p.status}>{p.status}</span>
                  <span className={styles.projectSlots}>{p.open_slots}/{p.team_size} OPEN</span>
                  <span className={p.is_published ? styles.statusPENDING : styles.statusREJECTED} style={{ fontSize: 9, letterSpacing: "0.1em", fontFamily: "var(--family-mono)", fontWeight: 700 }}>
                    {p.is_published ? "LIVE" : "DRAFT"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
