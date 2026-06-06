import { useNavigate } from "react-router";
import type { Project } from "../../data/projects";
import styles from "./project-card.module.css";

interface ProjectCardProps {
  project: Project;
}

const STATUS_STYLE: Record<string, { color: string; label: string }> = {
  OPEN:        { color: "#22c55e", label: "OPEN" },
  RECRUITING:  { color: "#22c55e", label: "RECRUITING" },
  IN_PROGRESS: { color: "#f59e0b", label: "IN PROGRESS" },
  CLOSED:      { color: "#ef4444", label: "CLOSED" },
};

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();
  const statusStyle = STATUS_STYLE[project.status] ?? { color: "var(--color-primary)", label: project.status };

  function handleClick() {
    navigate(`/projects/${project.id}`);
  }

  return (
    <article className={styles.card} onClick={handleClick}>
      <header className={styles.cardHeader}>
        <span className={styles.tier}>{project.tierLevel}</span>
        <span className={styles.id}>ID: {project.id}</span>
      </header>

      <h3 className={styles.title}>{project.title}</h3>
      <p className={styles.tagline}>{project.tagline}</p>

      <div className={styles.tags}>
        {project.tags.map((tag) => (
          <span key={tag} className={styles.tag}>{tag}</span>
        ))}
      </div>

      <footer className={styles.cardFooter}>
        <span className={styles.statusOpen} style={{ color: statusStyle.color }}>
          <span className={styles.statusDot} style={{ background: statusStyle.color }} />
          STATUS: {statusStyle.label}
        </span>
        <button className={styles.viewBtn} onClick={handleClick} type="button">
          VIEW DETAILS
        </button>
      </footer>
    </article>
  );
}
