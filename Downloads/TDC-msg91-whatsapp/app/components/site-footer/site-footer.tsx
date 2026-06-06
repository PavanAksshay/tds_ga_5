import { Link } from "react-router";
import classnames from "classnames";
import styles from "./site-footer.module.css";

export interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className }: SiteFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={classnames(styles.root, className)}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <div className={styles.logo}>THE_DEVELOPER_COMMUNITY</div>
          <p className={styles.tagline}>
            A professional hierarchy building production software. 
            Claim credit for what you ship. Earn a share of what you build.
          </p>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navGroup}>
            <span className={styles.groupTitle}>Hierarchy</span>
            <Link to="/projects" className={styles.link}>Projects</Link>
            <Link to="/about" className={styles.link}>The Mission</Link>
            <Link to="/updates" className={styles.link}>System Updates</Link>
          </div>
          <div className={styles.navGroup}>
            <span className={styles.groupTitle}>Connect</span>
            <Link to="/contact" className={styles.link}>Contact</Link>
            <Link to="/ideas-submit" className={styles.link}>Post Idea</Link>
            <a href="https://github.com" target="_blank" rel="noreferrer" className={styles.link}>GitHub</a>
          </div>
        </nav>
      </div>

      <div className={styles.bottom}>
        <div className={styles.legal}>
          <span>© {currentYear} TDC_GLOBAL</span>
          <Link to="/terms" className={styles.legalLink}>Terms of Service</Link>
          <Link to="/privacy" className={styles.legalLink}>Privacy Policy</Link>
        </div>
        <div className={styles.disclaimer}>
          ** <Link to="/terms" className={styles.legalLink} style={{ color: "var(--color-primary)", textDecoration: "underline" }}>Terms and conditions applied</Link>.
        </div>
      </div>
    </footer>
  );
}
