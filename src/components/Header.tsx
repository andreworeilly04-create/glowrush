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
import { useState, useEffect } from "react";
import { useCart } from "@/context/context";
import Image from "next/image";
import logo from "../../public/glowrush_logo.png";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/db";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const pathname = usePathname();
  const { cart } = useCart();

  useEffect(() => {
    /*
     * Listen to Firebase Authentication.
     *
     * This replaces the old cookie-based login check.
     */
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Header: Firebase user signed in:", user.uid);

        setIsLoggedIn(true);
      } else {
        console.log("Header: No Firebase user signed in.");

        setIsLoggedIn(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      /*
       * Sign the user out of Firebase Authentication.
       */
      const { signOut } = await import("firebase/auth");

      await signOut(auth);

      /*
       * Remove the old localStorage user information.
       */
      localStorage.removeItem("user");

      setUserDropdownOpen(false);

      /*
       * Send the user back to login.
       */
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const cartCount = cart.reduce(
    (total: number, item: any) => total + (item.quantity || 1),
    0,
  );

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
                className={`${styles.nav_link} ${
                  pathname === "/" ? styles.active : ""
                }`}
              >
                Home
              </Link>
            </li>

            <li className={styles.nav_link}>
              <Link
                href="/glowsticks"
                className={`${styles.nav_link} ${
                  pathname === "/glowsticks" ? styles.active : ""
                }`}
              >
                Glow Sticks
              </Link>
            </li>

            <li className={styles.nav_link}>
              <Link
                href="/about"
                className={`${styles.nav_link} ${
                  pathname === "/about" ? styles.active : ""
                }`}
              >
                About
              </Link>
            </li>

            <li className={styles.nav_link}>
              <Link
                href="/contact"
                className={`${styles.nav_link} ${
                  pathname === "/contact" ? styles.active : ""
                }`}
              >
                Contact
              </Link>
            </li>
          </ul>
        </nav>

        <div className={styles.nav_icons_wrapper}>
          <ul className={styles.nav_icons}>
            <li
              className={`${styles.nav_user} ${styles.user_dropdown_container}`}
            >
              <button
                className={styles.userLink}
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-label="User Menu"
              >
                <FontAwesomeIcon icon={faUser} />
              </button>

              {userDropdownOpen && (
                <ul className={styles.user_dropdown}>
                  {isLoggedIn ? (
                    <>
                      <li>
                        <Link
                          href="/orders"
                          className={styles.user_dropdown_link}
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          Orders
                        </Link>
                      </li>

                      <li>
                        <button
                          className={styles.user_dropdown_link}
                          onClick={handleLogout}
                        >
                          Logout
                        </button>
                      </li>
                    </>
                  ) : (
                    <li>
                      <Link
                        href="/login"
                        className={styles.user_dropdown_link}
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        Login
                      </Link>
                    </li>
                  )}
                </ul>
              )}
            </li>

            <li className={styles.nav_cart}>
              <Link className={styles.nav_link} href="/cart">
                <FontAwesomeIcon icon={faCartShopping} />
              </Link>

              {cartCount > 0 && (
                <span className={styles.cart_badge}>{cartCount}</span>
              )}
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
          className={`${styles.mobile_menu} ${
            menuOpen ? styles.mobile_menu_open : ""
          }`}
        >
          <ul className={styles.mobile_nav_links}>
            <li>
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className={`${styles.mobile_nav_link} ${
                  pathname === "/" ? styles.active : ""
                }`}
              >
                Home
              </Link>
            </li>

            <li>
              <Link
                href="/glowsticks"
                onClick={() => setMenuOpen(false)}
                className={`${styles.mobile_nav_link} ${
                  pathname === "/glowsticks" ? styles.active : ""
                }`}
              >
                Glow Sticks
              </Link>
            </li>

            <li>
              <Link
                href="/about"
                onClick={() => setMenuOpen(false)}
                className={`${styles.mobile_nav_link} ${
                  pathname === "/about" ? styles.active : ""
                }`}
              >
                About
              </Link>
            </li>

            <li>
              <Link
                href="/contact"
                onClick={() => setMenuOpen(false)}
                className={`${styles.mobile_nav_link} ${
                  pathname === "/contact" ? styles.active : ""
                }`}
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
