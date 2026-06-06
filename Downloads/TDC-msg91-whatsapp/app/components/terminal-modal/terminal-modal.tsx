import { useState, useEffect, useRef } from "react";
import { X, Terminal as TerminalIcon, Cpu, Database, Network } from "lucide-react";
import type { Contribution } from "~/services/contributions.server";
import styles from "./terminal-modal.module.css";
import { ContributionsTerminal } from "~/blocks/__global/contributions-terminal";

interface TerminalModalProps {
  contributions: Contribution[];
  username: string;
  onClose: () => void;
}

export function TerminalModal({ contributions, username, onClose }: TerminalModalProps) {
  const [booting, setBooting] = useState(true);
  const [lines, setLines] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bootSequence = [
      "SYSTEM CHECK: OK",
      "KERNEL: v4.7.3-TDC",
      "USER: " + username.toUpperCase(),
      "ACCESS: GRANTED",
      "RETRIEVING LOGS...",
      "FOUND " + contributions.length + " VERIFIED ENTRIES.",
      "READY."
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < bootSequence.length) {
        setLines(prev => [...prev, bootSequence[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setBooting(false), 500);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [username, contributions.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, booting]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.crtContainer}>
          <div className={styles.scanlines} />
          <div className={styles.noise} />
          <div className={styles.flicker} />
          
          <div className={styles.header}>
            <div className={styles.terminalInfo}>
              <TerminalIcon size={16} />
              <span className={styles.title}>TDC_CLI_v4.73</span>
              <span className={styles.user}>@{username.toLowerCase()}</span>
            </div>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={16} />
            </button>
          </div>

          <div className={styles.terminalBody} ref={scrollRef}>
            {booting ? (
              <div className={styles.bootContent}>
                <div className={styles.bootLines}>
                  {lines.map((line, idx) => (
                    <div key={idx} className={styles.bootLine}>{line}</div>
                  ))}
                  <div className={styles.cursor} />
                </div>
              </div>
            ) : (
              <div className={styles.mainContent}>
                <div className={styles.systemStatus}>
                  <div className={styles.statItem}>
                    <Cpu size={14} />
                    <span>STATUS: ONLINE</span>
                  </div>
                  <div className={styles.statItem}>
                    <Database size={14} />
                    <span>LOGS: {contributions.length}</span>
                  </div>
                  <div className={styles.statItem}>
                    <Network size={14} />
                    <span>LATENCY: 42ms</span>
                  </div>
                </div>

                <div style={{ marginTop: "var(--space-4)" }}>
                  <ContributionsTerminal contributions={contributions} />
                </div>
                
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}