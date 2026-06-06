import { Link } from "react-router";
import classnames from "classnames";
import styles from "./secondary-call-to-action.module.css";

export interface SecondaryCallToActionProps {
  className?: string;
}

export function SecondaryCallToAction({ className }: SecondaryCallToActionProps) {
  return (
    <section className={classnames(styles.root, className)}>
      <p className={styles.label}>// CLAIM YOUR CREDIT // EARN YOUR PIECE**</p>
      <div className={styles.actions}>
        <Link to="/projects" className={styles.btn}>
          EXPLORE OPEN PROJECTS
        </Link>
        <Link to="/register" className={styles.btnGhost}>
          JOIN THE COMMUNITY
        </Link>
      </div>
    </section>
  );
}
