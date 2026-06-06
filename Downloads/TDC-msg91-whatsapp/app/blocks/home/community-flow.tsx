import { FileText, Briefcase, Code2, Bug, Rocket, BadgeCheck, DollarSign } from "lucide-react";
import classnames from "classnames";
import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./community-flow.module.css";
import { useAutoScroll } from "~/hooks/use-auto-scroll";

export interface CommunityFlowProps {
  className?: string;
}

const STEPS = [
  {
    step: "01",
    icon: FileText,
    title: "APPLY FOR PROJECTS",
    desc: "Browse active projects across frontend, backend, DevOps, and ML. Submit your application and get matched to a real engineering team.",
    tag: "APPLICATIONS OPEN",
  },
  {
    step: "02",
    icon: Briefcase,
    title: "START YOUR INTERNSHIP",
    desc: "Get onboarded into a structured team with daily standups, real task assignments, and senior leads.",
    tag: "ONBOARDING",
  },
  {
    step: "03",
    icon: Code2,
    title: "BUILD THE PRODUCT",
    desc: "Write real production code, open pull requests, and get peer-reviewed before anything merges into main.",
    tag: "PRODUCTION CODE",
  },
  {
    step: "04",
    icon: Bug,
    title: "TEST AND DEBUG",
    desc: "Own reliability. Write tests, chase edge cases, and maintain quality standards that matter to real users.",
    tag: "QA & DEBUGGING",
  },
  {
    step: "05",
    icon: Rocket,
    title: "SHIP IT",
    desc: "Deploy to production. Your code goes live. Your name goes on the commit history — permanently.",
    tag: "LIVE DEPLOYMENT",
  },
  {
    step: "06",
    icon: BadgeCheck,
    title: "CLAIM RESUME CREDIT",
    desc: "Receive a verified, cryptographically-signed credit for your contributions. Proof of work that recruiters can audit and verify instantly.",
    tag: "RESUME_READY",
  },
  {
    step: "07",
    icon: DollarSign,
    title: "EARN A PIECE OF THE PROFIT",
    desc: "When the products you build reach market thresholds, you earn a share of the success. Shared effort, shared revenue.**",
    tag: "PROFIT_SHARING",
  },
];

const CARD_H  = 200; // px — height of each card
const CARD_GAP = 20; // px — gap between cards
const CARD_STEP = CARD_H + CARD_GAP;

export function CommunityFlow({ className }: CommunityFlowProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPaused = useRef(false);
  const scrollRef = useAutoScroll(3000);

  const startAutoScroll = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!isPaused.current) {
        setActiveIndex((prev) => (prev + 1) % STEPS.length);
      }
    }, 2500);
  }, []);

  useEffect(() => {
    startAutoScroll();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [startAutoScroll]);

  const goTo = (index: number) => {
    setActiveIndex(index);
    startAutoScroll();
  };

  return (
    <section className={classnames(styles.root, className)}>
      {/* ── LEFT ── */}
      <div className={styles.left}>
        <span className={styles.label}>// HOW IT WORKS</span>
        <h2 className={styles.heading}>From Application<br />to Credit</h2>
        <p className={styles.subheading}>
          Seven stages. Real output. From the first line of code to revenue-sharing success.
        </p>
        <nav className={styles.nav}>
          {STEPS.map(({ step, title }, i) => (
            <button
              key={step}
              className={classnames(styles.navItem, i === activeIndex && styles.navItemActive)}
              onClick={() => goTo(i)}
            >
              <span className={styles.navStep}>{step}</span>
              <span className={styles.navTitle}>{title}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ── RIGHT: spotlight reel ── */}
      <div
        className={styles.right}
        ref={scrollRef}
        onMouseEnter={() => { isPaused.current = true; }}
        onMouseLeave={() => { isPaused.current = false; }}
      >
        {/* Fade masks */}
        <div className={styles.maskTop} aria-hidden />
        <div className={styles.maskBottom} aria-hidden />

        {/* Cards — each anchored to 50% of right panel, offset by row */}
        {STEPS.map(({ step, icon: Icon, title, desc, tag }, i) => {
          const offset = i - activeIndex;
          const isActive = offset === 0;
          const withinView = Math.abs(offset) <= 1;
          return (
            <div
              key={step}
              className={classnames(styles.card, isActive && styles.cardActive)}
              style={{
                "--card-offset": offset,
                "--card-active-opacity": isActive ? 1 : withinView ? 0.28 : 0,
                "--card-z": isActive ? 2 : 1,
                pointerEvents: isActive ? "auto" : "none",
              } as React.CSSProperties}
              onClick={() => !isActive && goTo(i)}
            >
              <div className={styles.cardHeader}>
                <div className={styles.cardMeta}>
                  <span className={styles.cardStep}>{step} / 07</span>
                  <span className={styles.cardTag}>{tag}</span>
                </div>
                <div className={styles.iconBox}>
                  <Icon size={20} aria-hidden="true" />
                </div>
              </div>
              <h3 className={styles.cardTitle}>{title}</h3>
              <p className={styles.cardDesc}>{desc}</p>

              {/* 2.5 s progress sweep — key forces remount on change */}
              {isActive && (
                <div className={styles.progressTrack}>
                  <div key={activeIndex} className={styles.progressFill} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
