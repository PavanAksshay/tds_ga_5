import classnames from "classnames";
import styles from "./advisory-board.module.css";
import { useAutoScroll } from "~/hooks/use-auto-scroll";

import vaishnaviImg from "/advisors/vaishnavi.jpeg";
import anusreeImg from "/advisors/anusree.jpeg";

export interface AdvisoryBoardProps {
  className?: string;
}

const ADVISORS = [
  {
    name: "Vaishnavi R",
    role: "DevOps Engineer (SD2)",
    company: "Dell Technologies",
    photo: vaishnaviImg,
    quote: "Practical experience with deployment pipelines is what separates a student from a professional engineer.",
    objectPosition: "top center",
  },
  {
    name: "Anusree",
    role: "Senior Software Engineer",
    company: "Warner Bros. Discovery",
    photo: anusreeImg,
    quote: "The scale of projects at TDC forces you to think about software engineering in a complete, end-to-end way.",
    objectPosition: "center 20%",
  },
];

// Grid Layout
// Removed TRACK constant as we now handle loop in JSX and CSS animation

export function AdvisoryBoard({ className }: AdvisoryBoardProps) {
  const scrollRef = useAutoScroll(3000);

  return (
    <section className={classnames(styles.root, className)}>
      <div className={styles.header}>
        <span className={styles.label}>// ADVISORY BOARD</span>
        <h2 className={styles.heading}>Engineers from top companies.</h2>
        <p className={styles.subheading}>Helping you build things that get you hired.</p>
      </div>

      <div className={styles.gridWrapper}>
        <div className={styles.grid} ref={scrollRef}>
          {ADVISORS.map((advisor, i) => (
            <div key={`${advisor.name}-${i}`} className={styles.card}>
              <div className={styles.photoWrapper}>
                <img 
                  src={advisor.photo} 
                  alt={`Board Advisor: ${advisor.name}`} 
                  className={styles.photo} 
                  loading="lazy"
                  width={200}
                  height={200}
                  style={{ objectPosition: advisor.objectPosition }}
                />
                <div className={styles.companyBadge}>{advisor.company.toUpperCase()}</div>
              </div>
              <div className={styles.cardBody}>
                <blockquote className={styles.cardQuote}>&ldquo;{advisor.quote}&rdquo;</blockquote>
                <div className={styles.cardMeta}>
                  <span className={styles.cardName}>{advisor.name}</span>
                  <span className={styles.cardRole}>{advisor.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
