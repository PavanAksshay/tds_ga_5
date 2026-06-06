import styles from "./recruiter-marquee.module.css";

const LOGOS = [
  { name: "TCS",           src: "/companies/tcs.png",     scale: 2.5  },
  { name: "Warner Bros Discovery", src: "/companies/wbd.svg", scale: 1.0  },
  { name: "Meesho",        src: "/companies/meesho.png",  scale: 1.0  },
  { name: "Dell",          src: "/companies/dell.svg",    scale: 1.0  },
];

// Repeat enough times so the track fills any screen width — the animation
// loops from 0 to -50%, so we need an EVEN number of sets. 8 copies (4+4)
// ensures there is never an empty gap on ultra-wide displays.
const TRACK = [
  ...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS,
  ...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS,
];

export function RecruiterMarquee() {
  return (
    <section className={styles.root} aria-label="Trusted by recruiters from top companies">
      <div className={styles.label}>
        // TALENT SOURCED BY RECRUITERS FROM
      </div>
      <div className={styles.marqueeWrap}>
        {/* Left fade */}
        <div className={styles.fadeLeft} aria-hidden="true" />
        {/* Right fade */}
        <div className={styles.fadeRight} aria-hidden="true" />

        <div className={styles.track} aria-hidden="true">
          {TRACK.map((logo, i) => (
            <div key={i} className={styles.logoItem}>
              <img
                src={logo.src}
                alt={logo.name}
                className={styles.logoImg}
                style={{ transform: `scale(${logo.scale})` }}
                loading="lazy"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
