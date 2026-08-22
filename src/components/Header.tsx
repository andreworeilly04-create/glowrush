"use client";
import {
  faCartShopping,
  faUser,
  faBars,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import styles from "./Header.module.css";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/context/context";
import Image from "next/image";
import logo from "../../public/glowrush_logo.png";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { cart } = useCart();
  return (
    <>
    <header className={styles.header} id="home">
      <figure className={styles.logo_container}>
        <Link href="/">
        <Image
          src={logo}
          className={styles.logo}
          alt="GlowRush Logo"
          priority
        />
        </Link>
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
              href="/glowsticks"
              className={`${styles.nav_link} ${pathname === "/glowsticks" ? styles.active : ""}`}
            >
              Glow Sticks
            </Link>
          </li>
          <li className={styles.nav_link}>
            <Link
              href="/about"
              className={`${styles.nav_link} ${pathname === "/about" ? styles.active : ""}`}
            >
              About
            </Link>
          </li>
          <li className={styles.nav_link}>
            <Link
              href="/contact"
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
            <Link className={styles.nav_link} href="/cart"><FontAwesomeIcon icon={faCartShopping} /></Link>
           {cart.reduce((total: number, item: any) => total + (item.quantity || 1), 0) > 0 && ( <span className={styles.cart_badge}>{cart.reduce((total: number, item: any) => total + (item.quantity || 1), 0)}</span>)}
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
      <div
        className={`${styles.mobile_menu} ${menuOpen ? styles.mobile_menu_open : ""}`}
      >
        <ul className={styles.mobile_nav_links}>
          <li>
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className={`${styles.mobile_nav_link} ${pathname === "/" ? styles.active : ""}`}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/glowsticks"
              onClick={() => setMenuOpen(false)}
              className={`${styles.mobile_nav_link} ${pathname === "/glowsticks" ? styles.active : ""}`}
            >
              Glow Sticks
            </Link>
          </li>
          <li>
            <Link
              href="/about"
              onClick={() => setMenuOpen(false)}
              className={`${styles.mobile_nav_link} ${pathname === "/about" ? styles.active : ""}`}
            >
              About
            </Link>
          </li>
          <li>
            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className={`${styles.mobile_nav_link} ${pathname === "/contact" ? styles.active : ""}`}
            >
              Contact
            </Link>
          </li>
        </ul>
      </div>
    </header>
    </>
  );
}
