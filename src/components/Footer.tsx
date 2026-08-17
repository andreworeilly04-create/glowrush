'use client'
import Link from 'next/link'
import styles from "./Footer.module.css";
import Image from "next/image";
import logo from "../../public/glowrush_logo.png";
export default function Footer(){

    return (
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
    )
}