import type { Project } from "../../data/projects";
import { ProjectCard } from "./project-card";
import styles from "./tier-section.module.css";

interface TierSectionProps {
  levelLabel: string;
  title: string;
  projects: Project[];
}

export function TierSection({ levelLabel, title, projects }: TierSectionProps) {
  if (projects.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionMeta}>
          <span className={styles.levelLabel}>{levelLabel}</span>
          <h2 className={styles.sectionTitle}>{title}</h2>
        </div>
        <span className={styles.itemCount}>ITEMS: {String(projects.length).padStart(3, "0")}</span>
      </div>
      <div className={styles.grid}>
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
