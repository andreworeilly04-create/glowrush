'use client'
import Link from 'next/link'
import styles from "./Footer.module.css";
import Image from "next/image";
import logo from "../../public/glowrush_logo.png";
import { usePathname } from "next/navigation";
export default function Footer(){

    const pathname = usePathname();

    return (
        <footer className={styles.footer}>
        <figure className={styles.footer_logo_container}>
          <Link href="/"><Image src={logo} className={styles.footer_logo} alt="GlowRush Logo" /></Link>
        </figure>
        <div className={styles.footer_links}>
          <Link href="/" className={`${styles.footer_link} ${pathname === "/" ? styles.active : ""}`}>Home</Link>
          <Link href="/glowsticks" className={`${styles.footer_link} ${pathname === "/glowsticks" ? styles.active : ""}`}>Glow Sticks</Link>
          <Link href="/about" className={`${styles.footer_link} ${pathname === "/about" ? styles.active : ""}`}>About</Link>
          <Link href="/contact" className={`${styles.footer_link} ${pathname === '/contact' ? styles.active : ""}`}>Contact</Link>
        </div>
        <p className={styles.footer_text}>&copy; Copyright 2026 GlowRush All rights reserved</p>
      </footer>
    )
}