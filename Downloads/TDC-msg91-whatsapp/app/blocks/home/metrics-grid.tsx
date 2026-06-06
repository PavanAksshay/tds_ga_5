import { Shield } from "lucide-react";
import classnames from "classnames";
import styles from "./metrics-grid.module.css";

export interface MetricsGridProps {
  className?: string;
}

export function MetricsGrid({ className }: MetricsGridProps) {
  return (
    <section className={classnames(styles.root, className)}>
      <div className={styles.imagePane}>
        <img
          src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80"
          alt="Server infrastructure"
          className={styles.image}
        />
      </div>
      <div className={styles.statsPane}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>ACTIVE NODES</span>
          <span className={styles.statValue}>142</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>CODE REVIEWS</span>
          <span className={styles.statValue}>4.8k</span>
        </div>
        <div className={classnames(styles.statCard, styles.statCardWide)}>
          <div className={styles.networkContent}>
            <span className={styles.statLabel}>NETWORK STATUS</span>
            <span className={classnames(styles.statValue, styles.networkValue)}>ENCRYPTED FLOW</span>
          </div>
          <Shield size={32} className={styles.networkIcon} />
        </div>
      </div>
    </section>
  );
}
