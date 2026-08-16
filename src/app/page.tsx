"use client";
import { glowsticks } from "@/data/glowsticks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping, faUser, faStar, faStarHalfAlt, faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import { faStar as faRegularStar } from '@fortawesome/free-regular-svg-icons';
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./page.module.css";
import logo from "../../public/glowrush_logo.png";
import { useState, useEffect } from "react";

export default function HomePage() {
  const pathname = usePathname();
  const [randomGlowsticks, setRandomGlowsticks] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const shuffled = [...glowsticks].sort(() => Math.random() - 0.5);
    setRandomGlowsticks(shuffled.slice(0, 5));
  }, []);

  return (
    <>
      <header className={styles.header} id="home">
        <figure className={styles.logo_container}>
          <Image src={logo} className={styles.logo} alt="GlowRush Logo" priority />
        </figure>
        <nav className={styles.nav_menu}>
          <ul className={styles.nav_links}>
            <li className={styles.nav_link}>
              <Link
                href="#home"
                className={`${styles.nav_link} ${pathname === "/" ? styles.active : ""}`}
              >
                Home
              </Link>
            </li>
            <li className={styles.nav_link}>
              <Link
                href="#glowsticks"
                className={`${styles.nav_link} ${pathname === "/glowsticks" ? styles.active : ""}`}
              >
                Glow Sticks
              </Link>
            </li>
            <li className={styles.nav_link}>
              <Link
                href="#about"
                className={`${styles.nav_link} ${pathname === "/about" ? styles.active : ""}`}
              >
                About
              </Link>
            </li>
            <li className={styles.nav_link}>
              <Link
                href="#contact"
                className={`${styles.nav_link} ${pathname === "/contact" ? styles.active : ""}`}
              >
                Contact
              </Link>
            </li>
          </ul>
        </nav>
        <div className={styles.nav_icons_wrapper}>
          <ul className={styles.nav_icons}>
            <li className={styles.nav_user}>
              <FontAwesomeIcon icon={faUser} />
            </li>
            <li className={styles.nav_cart}>
              <FontAwesomeIcon icon={faCartShopping} />
              <span className={styles.cart_badge}>3</span>
            </li>
          </ul>
          <button 
            className={styles.menu_toggle} 
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Menu"
          >
            <FontAwesomeIcon icon={menuOpen ? faTimes : faBars} />
          </button>
        </div>
        <div className={`${styles.mobile_menu} ${menuOpen ? styles.mobile_menu_open : ""}`}>
          <ul className={styles.mobile_nav_links}>
            <li>
              <Link
                href="#home"
                onClick={() => setMenuOpen(false)}
                className={`${styles.mobile_nav_link} ${pathname === "/" ? styles.active : ""}`}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="#glowsticks"
                onClick={() => setMenuOpen(false)}
                className={`${styles.mobile_nav_link} ${pathname === "/glowsticks" ? styles.active : ""}`}
              >
                Glow Sticks
              </Link>
            </li>
            <li>
              <Link
                href="#about"
                onClick={() => setMenuOpen(false)}
                className={`${styles.mobile_nav_link} ${pathname === "/about" ? styles.active : ""}`}
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="#contact"
                onClick={() => setMenuOpen(false)}
                className={`${styles.mobile_nav_link} ${pathname === "/contact" ? styles.active : ""}`}
              >
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </header>
      <main className={styles.hero_section}>
        <div className={styles.hero_content}>
          <div className={styles.hero_badge}>⚡ Ultimate Party Gear</div>
          <h1 className={styles.hero_text}>Light Up the Night</h1>
          <p className={styles.hero_sub_text}>
            Discover premium glow sticks and party accessories built for
            unforgettable nights. Engineered to burn brighter and longer.
          </p>
          <div className={styles.hero_btns}>
            <Link href="#glowsticks" className={styles.cta_btn}>Shop Glow Sticks</Link>
          </div>
        </div>
      </main>
      <section className={styles.why_choose_us} id="about">
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
      <section className={styles.latest_glowsticks} id="glowsticks">
        <h2 className={styles.latest_glowsticks_title}>View Our Latest Glowsticks</h2>
        <div className={styles.latest_glowsticks_product_container}>
            {randomGlowsticks.map((glowstick) => (
              <div key={glowstick.id} className={styles.glowstick_card}>
                <Image className={styles.latest_glowsticks_image} src={glowstick.image} alt={glowstick.name} />
                <h3 className={styles.latest_glowsticks_product_name}>{glowstick.name}</h3>
                <h4 className={styles.latest_glowsticks_product_price}>${glowstick.price}</h4>
                <div className={styles.latest_glowsticks_product_rating}>
                  {Array.from({length: 5}).map((_, index) => {
                    const starNumber = index + 1;
                    let starIcon = faRegularStar;
                    if (glowstick.rating >= starNumber){
                      starIcon = faStar;
                    } else if (glowstick.rating >= starNumber - 0.5){
                      starIcon = faStarHalfAlt;
                    }
                    return <FontAwesomeIcon key={index} icon={starIcon} />
                  })}
                </div>
              </div>
            ))}
        </div>
      </section>
      <section className={styles.newsletter_section} id="contact">
        <h2 className={styles.newsletter_title}>Get a Free Newsletter</h2>
        <p className={styles.newsletter_desc}>Stay updated with our latest drops, exclusive deals, and party tips!</p>
        <form className={styles.newsletter_form} onSubmit={(e) => e.preventDefault()}>
          <input type="email" placeholder="Enter your email" className={styles.newsletter_input} required />
          <button type="submit" className={styles.newsletter_btn}>Subscribe</button>
        </form>
      </section>
      <footer className={styles.footer}>
        <figure className={styles.footer_logo_container}>
          <Image src={logo} className={styles.footer_logo} alt="GlowRush Logo" />
        </figure>
        <div className={styles.footer_links}>
          <Link href="#home" className={styles.footer_link}>Home</Link>
          <Link href="#glowsticks" className={styles.footer_link}>Glow Sticks</Link>
          <Link href="#about" className={styles.footer_link}>About</Link>
          <Link href="#contact" className={styles.footer_link}>Contact</Link>
        </div>
        <p className={styles.footer_text}>Copyright 2026 GlowRush All rights reserved</p>
      </footer>
    </>
  );
}