"use client";
import { glowsticks } from "@/data/glowsticks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping, faUser } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./page.module.css";
import logo from "../../public/glowrush_logo.png";

export default function HomePage() {
  const pathname = usePathname();

  return (
    <>
      <header className={styles.header}>
        <figure className="logo_container">
          <Image src={logo} className={styles.logo} alt="GlowRush Logo" />
        </figure>
        <nav className={styles.nav_menu}>
          <ul className={styles.nav_links}>
            <li className={styles.nav_link}>
              <Link
                href="/"
                className={`${styles.nav_link} ${pathname === "/" ? styles.active : ""}`}
              >
                Home
              </Link>
            </li>
            <li className={styles.nav_link}>
              <Link
                href="/"
                className={`${styles.nav_link} ${pathname === "/glowsticks" ? styles.active : ""}`}
              >
                Glow Sticks
              </Link>
            </li>
            <li className={styles.nav_link}>
              <Link
                href="/"
                className={`${styles.nav_link} ${pathname === "/about" ? styles.active : ""}`}
              >
                About
              </Link>
            </li>
            <li className={styles.nav_link}>
              <Link
                href="/"
                className={`${styles.nav_link} ${pathname === "/contact" ? styles.active : ""}`}
              >
                Contact
              </Link>
            </li>
          </ul>
        </nav>
        <ul className={styles.nav_icons}>
          <li className={styles.nav_user}>
            <FontAwesomeIcon icon={faUser} />
          </li>
          <li className={styles.nav_cart}>
            <FontAwesomeIcon icon={faCartShopping} />
          </li>
        </ul>
      </header>
      <main className={styles.hero_section}>
        <h1 className={styles.hero_text}>Light Up the Night</h1>
        <h3 className={styles.hero_sub_text}>
          Discover premium glow sticks and party accessories built for
          unforgettable nights
        </h3>
        <button className={styles.cta_btn}>Shop Glow Sticks</button>
      </main>
      <section className={styles.why_choose_us}>
        <h2 className={styles.why_choose_us_text}>Why Choose GlowRush?</h2>
        <div className={styles.why_choose_us_reason_container}>
          <div className={styles.why_choose_us_reason}>
            <h2 className={styles.why_choose_us_title}>
              Ultra-Bright, Long-Lasting Glow
            </h2>
            <p className={styles.why_choose_us_description}>
              Our products are engineered to burn brighter and stay illuminated
              longer than standard party store novelties, keeping the energy
              alive all night.
            </p>
          </div>
          <div className={styles.why_choose_us_reason}>
            <h2 className={styles.why_choose_us_title}>Vibrant Variety</h2>
            <p className={styles.why_choose_us_description}>
              From heavy-duty glow sticks to party accessories, we offer a
              massive selection of neon colors and styles designed to match any
              event or vibe.
            </p>
          </div>
          <div className={styles.why_choose_us_reason}>
            <h2 className={styles.why_choose_us_title}>
              Unbeatable Value for Events
            </h2>
            <p className={styles.why_choose_us_description}>
              Premium quality doesn't have to break the bank, making GlowRush
              the go-to choice whether you're stocking up for a massive
              festival, a backyard party, or a night out.
            </p>
          </div>
          <div className={styles.why_choose_us_reason}>
            <h2 className={styles.why_choose_us_title}>
              Fast & Reliable Shipping
            </h2>
            <p className={styles.why_choose_us_description}>
              We get your gear to you quickly and dependably so you never have
              to stress about missing the deadline for your event.
            </p>
          </div>
        </div>
      </section>
      <section className={styles.latest_glowsticks}>
        <h2 className={styles.latest_glowsticks_title}>View Our Latest Glowsticks</h2>
        <div className={styles.latest_glowsticks_container}>
            {glowsticks.slice(0, 10).map((glowstick) => (
                <Image className={styles.latest_glowsticks_image} src={glowstick.image} key={glowstick.id} alt={glowstick.name}>

                </Image>
            ))}
        </div>
      </section>
    </>
  );
}
