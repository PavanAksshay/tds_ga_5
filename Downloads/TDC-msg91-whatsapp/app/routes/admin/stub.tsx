import styles from "./stub.module.css";

export function AdminStubPage({ title, description }: { title: string; description: string }) {
  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>// {title}</h1>
        <p className={styles.pageDesc}>{description}</p>
      </div>
      <div className={styles.comingSoon}>
        <div className={styles.comingSoonCode}>[ SECTION_UNDER_CONSTRUCTION ]</div>
        <p className={styles.comingSoonText}>
          This section is being built. Core functionality (Applications, Members, Projects) is fully operational.
        </p>
      </div>
    </div>
  );
}
