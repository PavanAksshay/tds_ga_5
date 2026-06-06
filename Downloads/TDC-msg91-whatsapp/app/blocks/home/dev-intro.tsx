import classnames from "classnames";
import styles from "./dev-intro.module.css";

export interface DevIntroProps {
  className?: string;
}

export function DevIntro({ className }: DevIntroProps) {
  return (
    <section className={classnames(styles.root, className)}>
      <div className={styles.inner}>
        <span className={styles.label}>// DEV INTRO</span>
        <h2 className={styles.heading}>The developer track is not for everyone.</h2>
        <p className={styles.body}>
          This is a merit-based hierarchy. You earn your rank by shipping, not by signing up. We operate on a model of
          shared success—when the systems you build hit production revenue thresholds, you get paid.** Every contribution
          is timestamped, reviewed, and permanently linked to your profile as a high-impact resume credit.
        </p>
      </div>
    </section>
  );
}
