import classnames from "classnames";
import styles from "./pixel-pull-quote.module.css";

export interface PixelPullQuoteProps {
  className?: string;
}

export function PixelPullQuote({ className }: PixelPullQuoteProps) {
  return (
    <section className={classnames(styles.root, className)}>
      <div className={styles.quoteMark}>&rdquo;</div>
      <blockquote className={styles.quote}>
        Stop building side projects. Start shipping real software. We provide the verified proof of work recruiters actually trust.
      </blockquote>
    </section>
  );
}
