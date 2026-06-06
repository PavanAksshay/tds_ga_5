import { useState } from "react";
import { Terminal, GitCommit } from "lucide-react";
import styles from "./contributions-terminal.module.css";

// Updated to match the exact payload coming from the loader
export interface Contribution {
  id: string;
  status: string;
  created_at: string;
  description: string | null; // Fixed: now accepts null
  title: string;
}

interface ContributionsTerminalProps {
  contributions: Contribution[];
}

function getRelativeTime(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export function ContributionsTerminal({ contributions }: ContributionsTerminalProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredContributions = contributions
    .filter((c) => c.status === "GITHUB_PUSH")
    .slice(0, 20);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className={styles.terminal}>
      <header className={styles.header}>
        <Terminal size={16} />
        <span>// CONTRIBUTIONS</span>
        <span className={styles.cursor}>_</span>
      </header>
      
      <div className={styles.content}>
        {filteredContributions.length === 0 ? (
          <div className={styles.empty}>&gt; no contributions yet_</div>
        ) : (
          <ul className={styles.list}>
            {filteredContributions.map((contribution) => {
              const isExpanded = expandedId === contribution.id;
              return (
                <li 
                  key={contribution.id} 
                  className={`${styles.row} ${isExpanded ? styles.expanded : ""}`}
                  onClick={() => toggleExpand(contribution.id)}
                  title="Click to expand/collapse details"
                >
                  <span className={styles.time}>
                    {getRelativeTime(contribution.created_at)}
                  </span>
                  <GitCommit size={14} className={styles.icon} />
                  {/* Fixed: Added fallback for null descriptions */}
                  <span className={styles.repo} title={contribution.description || ""}>
                    {contribution.description || "system_event"}
                  </span>
                  <span className={styles.message} title={contribution.title}>
                    {contribution.title}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}