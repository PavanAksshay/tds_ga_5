import React from "react";
import classnames from "classnames";
import styles from "./diagnostic-shell.module.css";

interface DiagnosticShellProps {
  children: React.ReactNode;
  title: string;
  protocol?: string;
  stats?: {
    activeProjects: number;
    upcomingProjects: number;
    totalMembers: number;
  };
  wide?: boolean;
}

export function DiagnosticShell({ 
  children, 
  title, 
  protocol = "Protocol: Information Retrieval — Verified Data", 
  stats,
  wide = true 
}: DiagnosticShellProps) {
  // Helper to format numbers with commas
  const formatNum = (num: number) => new Intl.NumberFormat().format(num || 0);

  return (
    <div className={styles.page}>
      <div className={styles.bgGrid} aria-hidden />
      <div className={styles.gridOverlay} aria-hidden />
      
      <div className={wide ? styles.containerWide : styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            {title}<span className={styles.blink}>_</span>
          </h1>
          <p className={styles.protocol}>{protocol}</p>
        </header>

        <div className={styles.card}>
          <div className={styles.layoutGrid}>
            {/* Main Content Area */}
            <div className={styles.contentSection}>
              {children}
            </div>

            {/* Diagnostic Sidebar (Optional) */}
            {stats && (
              <div className={styles.sessionSection}>
                <label className={styles.label}>Platform Stats</label>
                <div className={styles.sessionList}>
                  <div className={styles.sessionCard}>
                    <div className={styles.roleCardHeader}>
                      <span className={styles.roleName}>Active Projects</span>
                      <span className={styles.roleLevel}>LIVE</span>
                    </div>
                    <p className={styles.statNumber}>{formatNum(stats.activeProjects)}</p>
                    <p className={styles.roleDesc}>Projects currently in progress</p>
                  </div>
                  <div className={styles.sessionCard}>
                    <div className={styles.roleCardHeader}>
                      <span className={styles.roleName}>Upcoming Projects</span>
                      <span className={styles.roleLevel}>QUEUED</span>
                    </div>
                    <p className={styles.statNumber}>{formatNum(stats.upcomingProjects)}</p>
                    <p className={styles.roleDesc}>Projects scheduled to launch soon</p>
                  </div>
                  <div className={styles.sessionCard}>
                    <div className={styles.roleCardHeader}>
                      <span className={styles.roleName}>Total Members</span>
                      <span className={styles.roleLevel}>JOINED</span>
                    </div>
                    <p className={styles.statNumber}>{formatNum(stats.totalMembers)}</p>
                    <p className={styles.roleDesc}>Developers identified in the collective</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card metadata footer */}
          <div className={styles.cardMeta}>
            <div className={styles.metaLeft}>
              <div className={styles.metaItem}>
                <span className={styles.pulse} />
                <span>DIAGNOSTIC_FEED</span>
              </div>
              <span>STATUS: NOMINAL</span>
            </div>
            <div className={styles.metaRight}>TDC_OS v4.2</div>
          </div>
        </div>
      </div>
    </div>
  );
}
