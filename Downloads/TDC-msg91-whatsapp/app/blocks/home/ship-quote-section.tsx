import classnames from "classnames";
import styles from "./ship-quote-section.module.css";

export interface ShipQuoteSectionProps {
  className?: string;
}

export function ShipQuoteSection({ className }: ShipQuoteSectionProps) {
  return (
    <section className={classnames(styles.root, className)}>
      <div className={styles.label}>// SHIP</div>
      <p className={styles.body}></p>
    </section>
  );
}
