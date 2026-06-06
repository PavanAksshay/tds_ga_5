import { requireAdmin, getDashboardStats } from "../../services/admin.server";
import type { Route } from "./+types/analytics";
import { useLoaderData } from "react-router";
import { PROJECTS } from "../../data/projects";
import styles from "./analytics.module.css";

export async function loader({ request }: Route.LoaderArgs): Promise<Response> {
  const headers = new Headers();
  await requireAdmin(request, headers);
  const stats = await getDashboardStats(request, headers);
  return Response.json(stats, { headers });
}

export default function AdminAnalytics() {
  const { totalMembers, totalApplications, pendingApplications, acceptedApplications } = useLoaderData<typeof loader>();
  const acceptanceRate = totalApplications > 0 ? Math.round((acceptedApplications / totalApplications) * 100) : 0;
  const tierCounts = PROJECTS.reduce((acc, p) => { acc[p.tier] = (acc[p.tier] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>// ANALYTICS</h1>
        <p className={styles.pageDesc}>Platform-wide metrics and trends.</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.statBlock}>
          <div className={styles.statLabel}>TOTAL MEMBERS</div>
          <div className={styles.statValue}>{totalMembers}</div>
        </div>
        <div className={styles.statBlock}>
          <div className={styles.statLabel}>TOTAL APPLICATIONS</div>
          <div className={styles.statValue}>{totalApplications}</div>
        </div>
        <div className={styles.statBlock}>
          <div className={styles.statLabel}>ACCEPTANCE RATE</div>
          <div className={styles.statValue}>{acceptanceRate}%</div>
        </div>
        <div className={styles.statBlock}>
          <div className={styles.statLabel}>PENDING REVIEW</div>
          <div className={styles.statValue}>{pendingApplications}</div>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHeader}><span className={styles.panelTitle}>// PROJECTS BY TIER</span></div>
        <div className={styles.panelBody}>
          {Object.entries(tierCounts).map(([tier, count]) => (
            <div key={tier} className={styles.tierRow}>
              <span className={styles.tierName}>{tier}</span>
              <div className={styles.tierBar}>
                <div className={styles.tierBarFill} style={{ width: `${(count / PROJECTS.length) * 100}%` }} />
              </div>
              <span className={styles.tierCount}>{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
