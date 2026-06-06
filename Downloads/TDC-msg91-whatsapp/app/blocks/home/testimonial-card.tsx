import classnames from "classnames";
import styles from "./testimonial-card.module.css";

export interface TestimonialCardProps {
  className?: string;
}

export function TestimonialCard({ className }: TestimonialCardProps) {
  return (
    <section className={classnames(styles.root, className)}>
      <p className={styles.sectionLabel}>// OUTCOMES</p>
      <div className={styles.card}>
        <div className={styles.quoteMarkRow}>&ldquo;</div>
        <p className={styles.quote}>
          I told my interviewer my app had 1,400 active users. The questions stopped, and I landed an offer at a top MNC.
        </p>
      </div>
    </section>
  );
}
