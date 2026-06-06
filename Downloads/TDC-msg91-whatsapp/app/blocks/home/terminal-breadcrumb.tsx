import classnames from "classnames";
import styles from "./terminal-breadcrumb.module.css";

export interface TerminalBreadcrumbProps {
  className?: string;
}

export function TerminalBreadcrumb({ className }: TerminalBreadcrumbProps) {
  return (
    <div className={classnames(styles.root, className)}>
      <span className={styles.dot}>■</span>
      <span className={styles.path}>// OPEN FOR APPLICATIONS</span>
    </div>
  );
}
