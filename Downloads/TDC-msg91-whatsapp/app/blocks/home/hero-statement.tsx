import { Link } from "react-router";
import classnames from "classnames";
import styles from "./hero-statement.module.css";

export interface HeroStatementProps {
  className?: string;
}

export function HeroStatement({ className }: HeroStatementProps) {
  return (
    <section className={classnames(styles.root, className)}>
      {/* Status chip */}
      <div className={styles.chip}>
        <span className={styles.chipDot} />
        FREE OPEN COMMUNITY
      </div>

      {/* Headline */}
      <h1 className={styles.headline}>
        BUILD.
        <br />
        SHIP.
        <br />
        CLAIM CREDIT<span className={styles.cursor} aria-hidden="true">_</span>
      </h1>

      {/* One-liner that explains everything */}
      <p className={styles.subtitle}>
        Build the experience recruiters actually look for. Join real teams, ship production apps, and claim verified credits for your resume. Plus, if what you build makes money, so do you.**
      </p>

      {/* CTAs */}
      <div className={styles.ctas}>
        <Link to="/register" className={styles.ctaPrimary}>
          JOIN THE COMMUNITY →
        </Link>
        <Link to="/projects" className={styles.ctaSecondary}>
          VIEW OPEN PROJECTS
        </Link>
        <Link to="/ideas-submit" className={styles.ctaIdea}>
          POST AN IDEA (PRIVATE)
        </Link>
      </div>

      {/* Scroll invite */}
      <div className={styles.scrollCue}>
        <div className={styles.scrollLine} />
        <span>SCROLL</span>
      </div>
    </section>
  );
}
