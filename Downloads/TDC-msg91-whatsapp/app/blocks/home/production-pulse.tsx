import { useState, useEffect, useRef } from "react";
import classnames from "classnames";
import { Terminal as TerminalIcon, Activity, Wifi } from "lucide-react";
import styles from "./production-pulse.module.css";

interface LogEntry {
  id: string;
  timestamp: string;
  event: string;
  isHighlight?: boolean;
}

const INITIAL_LOGS: LogEntry[] = [
  { id: "1", timestamp: "09:42:15", event: "Added a real-time analytics dashboard for projects", isHighlight: true },
  { id: "2", timestamp: "10:05:01", event: "Fixed the alignment of the mobile navigation menu", isHighlight: false },
  { id: "3", timestamp: "10:15:02", event: "Built the verifiable 'Proof of Work' credit system", isHighlight: true },
  { id: "4", timestamp: "11:05:40", event: "Optimized the landing page for faster load times", isHighlight: false },
];

const EVENT_POOL = [
  "Shipped the new interactive 'Community Flow' section",
  "Implemented a high-contrast dark theme for better focus",
  "Resolved the font rendering issues on Windows devices",
  "Made page transitions 40% smoother across the platform",
  "Added a searchable directory for all current members",
  "Integrated subtle hover animations for all buttons",
  "Automated the export of verified project credentials",
  "Refined the layout of the 'Developer Hierarchy' grid",
  "Launched the real-time contribution tracking system",
  "Released Version 4.73 with major stability improvements",
];

export function ProductionPulse({ className }: { className?: string }) {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const counter = useRef(5);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timestamp = now.toTimeString().split(' ')[0];
      const randomEvent = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
      
      const newEntry: LogEntry = {
        id: (counter.current++).toString(),
        timestamp,
        event: randomEvent,
        isHighlight: randomEvent.includes("Credit") || randomEvent.includes("deployed") || randomEvent.includes("Success"),
      };

      setLogs(prev => [newEntry, ...prev].slice(0, 10)); // Keep latest 10
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className={classnames(styles.root, className)}>
      {/* ── Left column: Terminal ── */}
      <div className={styles.pulseContainer}>
        <div className={styles.terminal}>
          <div className={styles.scanlines} />
          <div className={styles.noise} />
          
          <div className={styles.terminalHeader}>
            <div className={classnames(styles.dot, styles.dotActive)} />
            <div className={styles.dot} />
            <div className={styles.dot} />
            <TerminalIcon size={12} strokeWidth={2.5} color="var(--color-on-surface-subtle)" aria-hidden="true" />
            <span className={styles.headerTitle}>contribution</span>
          </div>

          <div className={styles.terminalBody}>
            {logs.map((log) => (
              <div key={log.id} className={styles.logEntry}>
                <span className={styles.timestamp}>[{log.timestamp}]</span>
                <span className={classnames(styles.event, log.isHighlight && styles.highlight)}>
                  {log.event}
                </span>
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <div className={styles.status}>
              <Activity size={10} color="#fff" aria-hidden="true" />
              <span className={styles.statusText}>PULSE: ACTIVE</span>
            </div>
            <div className={styles.status}>
              <Wifi size={10} color="var(--color-on-surface-subtle)" aria-hidden="true" />
              <span className={styles.statusText}>LATENCY: 42MS</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right column ── */}
      <div className={styles.content}>
        <span className={styles.label}>// CAREER_AUDIT</span>
        <h2 className={styles.title}>Audit Your Career.<br />Claim Your Credit.</h2>
        <p className={styles.description}>
          Every contribution you make is tracked in real-time. We help you build production-grade systems, providing the audited proof you need to show recruiters exactly what they look for. 
          When your code makes money, the success is shared.**
        </p>
      </div>
    </section>
  );
}
