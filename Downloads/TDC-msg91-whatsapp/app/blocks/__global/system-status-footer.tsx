import classnames from "classnames";
import styles from "./system-status-footer.module.css";

export interface SystemStatusFooterProps {
  className?: string;
  stats?: {
    totalMembers: number;
    shippedProjects: number;
    openRoles: number;
  };
}

export function SystemStatusFooter({ className, stats }: SystemStatusFooterProps) {
  const metrics = [
    { label: "STATUS", value: "STABLE" },
  ];

  return (
    <div className={classnames(styles.root, className)}>
      <span className={styles.prefix}>SYS://</span>
      {metrics.map(({ label, value }, i) => (
        <span key={label} className={styles.metric}>
          <span className={styles.label}>{label}:</span>
          <span className={styles.value}>{value}</span>
          {i < metrics.length - 1 && <span className={styles.separator}>|</span>}
        </span>
      ))}
    </div>
  );
}
