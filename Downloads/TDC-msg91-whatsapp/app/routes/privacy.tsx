import type { Route } from "./+types/privacy";
import styles from "./legal.module.css";
import { buildMeta } from "~/lib/seo";

export function meta() {
  return [
    ...buildMeta({
      title: "Privacy Policy — The Developer Community",
      description: "How The Developer Community collects, stores and protects your data — including contribution history, authentication identity, and private project submissions.",
      path: "/privacy",
    }),
  ];
}


export default function PrivacyPage() {
  return (
    <div className={styles.root}>
      <div className={styles.breadcrumb}>
        SYSTEM_PROTOCOL // PRIVACY_POLICY
      </div>
      <h1 className={styles.title}>DATA_PROTECTION</h1>
      
      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>01. CONTRIBUTION DATA</h2>
          <p className={styles.text}>
            To verify your career credits, we log and store data related to your Git contributions, including 
            commit hashes, PR descriptions, and code metrics. This data is used solely to generate your 
            professional "Proof of Work" profile.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>02. IDENTITY & AUTH</h2>
          <p className={styles.text}>
            We use Supabase for secure authentication. We collect your email and optional profile details 
            (GitHub handle, LinkedIn) to link your real-world professional identity to your technical achievements. 
            We do not sell your personal data to third parties.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>03. PRIVATE PROJECT IDEAS</h2>
          <p className={styles.text}>
            Ideas submitted through our "Project Ideas" portal are stored in a private, encrypted database accessible 
            only by the administrative board. We maintain strict confidentiality concerning these pitches to protect 
            the inventor's intellectual property until a formal team is assigned.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>04. ANALYTICS</h2>
          <p className={styles.text}>
            We track system pulse metrics (deployment frequency, site latency, etc.) for performance optimization. 
            These are aggregated and non-identifiable.
          </p>
        </section>
      </div>
    </div>
  );
}
