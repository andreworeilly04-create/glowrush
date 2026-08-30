import { memo } from 'react';
import styles from './page.about.module.css';
import Link from 'next/link';

const About = () => {
  return (
    <div className={styles.container}>
      {/* Main Content / Our Story */}
      <section className={styles.storySection}>
        <div className={styles.storyGrid}>
          <div>
            <span className={styles.badge}>
              Est. 2026 • GlowRush
            </span>
            <h2 className={styles.storyHeading}>
              Light Up Your World
            </h2>
            <p className={styles.storyText}>
              Welcome to <strong className={styles.brandText}>GlowRush</strong>, your ultimate 2026 destination for specialty glowsticks, wearable gear, and bulk party supplies.
            </p>
            <p className={styles.storyText}>
              Founded in 2026, GlowRush was born out of a simple obsession: making every event unforgettable through vibrant, electrifying luminescence. Whether you are heading to a music festival, organizing a night run, or throwing an epic party, we provide the glow that stands out.
            </p>
            <p className={styles.storyText}>
              We specialize in unique, special-effect glowsticks, wearable illumination like bracelets and glasses, and massive bulk party packages designed to turn ordinary nights into luminous masterpieces.
            </p>
          </div>

          {/* Highlight Card Grid */}
          <div className={styles.cardGrid}>
            <div className={`${styles.card} ${styles.cardCyan}`}>
              <div className={styles.cardIcon}>💫</div>
              <h3 className={styles.cardTitle}>Specialty Glowsticks</h3>
              <p className={styles.cardDesc}>Multi-colored, flashing, and ultra-bright custom specialty glowsticks built to shine longer.</p>
            </div>

            <div className={`${styles.card} ${styles.cardFuchsia}`}>
              <div className={styles.cardIcon}>👓</div>
              <h3 className={styles.cardTitle}>Wearable Gear</h3>
              <p className={styles.cardDesc}>From dynamic wearable bracelets to statement-making glow glasses.</p>
            </div>

            <div className={`${styles.card} ${styles.cardCyan}`}>
              <div className={styles.cardIcon}>✨</div>
              <h3 className={styles.cardTitle}>Special-Effect Sticks</h3>
              <p className={styles.cardDesc}>Strobe, gradient-shifting, and acoustic-reactive specialty glowsticks for unique vibes.</p>
            </div>

            <div className={`${styles.card} ${styles.cardFuchsia}`}>
              <div className={styles.cardIcon}>📦</div>
              <h3 className={styles.cardTitle}>Bulk Party Supplies</h3>
              <p className={styles.cardDesc}>Wholesale party kits and mega packs stocked for massive events and venues.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Footer Banner */}
      <section className={styles.footerSection}>
        <div className={styles.footerInner}>
          <h3 className={styles.footerTitle}>Ready to Glow?</h3>
          <p className={styles.footerDesc}>
            Join the 2026 movement and discover our full lineup of specialty glowsticks and bulk party packages.
          </p>
          <Link href="/glowsticks"><button className={styles.ctaButton}>
            Explore Collection
          </button>
          </Link>
          
        </div>
      </section>
    </div>
  );
};

export default memo(About);