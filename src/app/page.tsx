'use client'
import { glowsticks } from "@/data/glowsticks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faStarHalfAlt } from "@fortawesome/free-solid-svg-icons";
import { faStar as faRegularStar } from '@fortawesome/free-regular-svg-icons';
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [randomGlowsticks, setRandomGlowsticks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      const shuffled = [...glowsticks].sort(() => Math.random() - 0.5);
      setRandomGlowsticks(shuffled.slice(0, 5));
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleNewsletterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubscribed(true);
  };

  return (
    <>
      <main className={styles.hero_section}>
        <div className={styles.hero_content}>
          <div className={styles.hero_badge}>⚡ Ultimate Party Gear</div>
          <h1 className={styles.hero_text}>Light Up the Night</h1>
          <p className={styles.hero_sub_text}>
            Discover premium glow sticks and party accessories built for
            unforgettable nights. Engineered to burn brighter and longer.
          </p>
          <div className={styles.hero_btns}>
            <Link href="/glowsticks" className={styles.cta_btn}>Shop Glow Sticks</Link>
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
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className={`${styles.glowstick_card} ${styles.skeletonCard}`}>
                <div className={`${styles.latest_glowsticks_image} ${styles.skeletonImage} ${styles.skeletonPulse}`}></div>
                <div>
                  <div className={`${styles.skeletonLine} ${styles.skeletonTitle} ${styles.skeletonPulse}`}></div>
                  <div className={`${styles.skeletonLine} ${styles.skeletonPrice} ${styles.skeletonPulse}`}></div>
                  <div className={`${styles.skeletonLine} ${styles.skeletonRating} ${styles.skeletonPulse}`}></div>
                </div>
              </div>
            ))
          ) : (
            randomGlowsticks.map((glowstick) => (
              
              <Link href={`/glowstick/${glowstick.id}`} key={glowstick.id} className={styles.glowstick_card}>
                <Image 
                  className={styles.latest_glowsticks_image} 
                  src={glowstick.image} 
                  alt={glowstick.name} 
                  width={300} 
                  height={300} 
                />
                <div>
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
              </Link>
              
            ))
          )}
        </div>
      </section>

      <section className={styles.newsletter_section} id="contact">
        <h2 className={styles.newsletter_title}>Get a Free Newsletter</h2>
        <p className={styles.newsletter_desc}>Stay updated with our latest drops, exclusive deals, and party tips!</p>
        
        {isSubscribed ? (
          <div className={styles.newsletterSuccessMessage}>
            <p>Thank you for subscribing to the newsletter</p>
          </div>
        ) : (
          <form className={styles.newsletter_form} onSubmit={handleNewsletterSubmit}>
            <input type="email" placeholder="Enter your email" className={styles.newsletter_input} required />
            <button type="submit" className={styles.newsletter_btn}>Subscribe</button>
          </form>
        )}
      </section>
    </>
  );
}