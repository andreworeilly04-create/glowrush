'use client'
import Link from 'next/link';
import styles from './page.register.module.css';

export default function RegisterPage() {
  return (
    <main className={styles.container}>
      <div className={styles.loginCard}>
        <h1 className={styles.title}>Create Account</h1>
        <form className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.subtitle} htmlFor="firstName">First Name</label>
            <input 
              type="text" 
              id="firstName" 
              placeholder="Enter your first name" 
              required 
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.subtitle} htmlFor="lastName">Last Name</label>
            <input 
              type="text" 
              id="lastName" 
              placeholder="Enter your last name" 
              required 
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.subtitle} htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              placeholder="Enter your email" 
              required 
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.subtitle} htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              placeholder="Create a password" 
              required 
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.subtitle} htmlFor="confirmPassword">Confirm Password</label>
            <input 
              type="password" 
              id="confirmPassword" 
              placeholder="Confirm your password" 
              required 
            />
          </div>
          <button type="submit" className={styles.loginButton}>
            Sign Up
          </button>
        </form>
        <div className={styles.signupContainer}>
          <p className={styles.signupText}>Already have an account?</p>
          <Link href="/login" className={styles.signupLink}>
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}