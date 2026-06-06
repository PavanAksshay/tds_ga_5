import classnames from "classnames";
import styles from "./the-hierarchy-display.module.css";
import { useAutoScroll } from "~/hooks/use-auto-scroll";

export interface TheHierarchyDisplayProps {
  className?: string;
}

const TIERS = [
  { id: "01", label: "Apprentice", stage: "INITIATION", desc: "Initiate your journey as a junior. Master the core fundamentals through mentored development." },
  { id: "02", label: "Contributor", stage: "EXECUTION", desc: "Engage with live production environments. Build expertise by delivering real-world code modules." },
  { id: "03", label: "Project Lead", stage: "LEADERSHIP", desc: "Assume project leadership. Scale your impact by guiding development teams and strategy." },
  { id: "04", label: "The Master", stage: "MASTERY", desc: "Achieve the rank of Senior Architect. Supervise complex deployments and mentor the community." },
];

export function TheHierarchyDisplay({ className }: TheHierarchyDisplayProps) {
  const scrollRef = useAutoScroll(3000);

  return (
    <section className={classnames(styles.root, className)}>
      <div className={styles.intro}>
        <span className={styles.systemTag}>// COMMUNITY_PIPELINE</span>
        <h2 className={styles.title}>The Hierarchy</h2>
      </div>

      <div className={styles.flowContainer}>
        <div className={styles.track} />
        <div className={styles.pulse} />
        
        <div className={styles.pipeline} ref={scrollRef}>
          {TIERS.map((tier) => (
            <div key={tier.id} className={styles.node}>
              <div className={styles.nodePoint}>
                <span className={styles.nodeId}>{tier.id}</span>
              </div>
              
              <div className={styles.nodeContent}>
                <span className={styles.nodeStage}>{tier.stage}</span>
                <h3 className={styles.nodeLabel}>{tier.label}</h3>
                <p className={styles.nodeShortDesc}>{tier.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
