'use client'
import { useState, SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.login.module.css';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

  try {
    const res = await fetch('api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password}),
    });

    const data = await res.json();

    if (!res.ok){
      throw new Error(data.message || 'Failed to login');
    }

    router.push('/');
  
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false)
  }
};
  return (
    <main className={styles.container}>
      <div className={styles.loginCard}>
        <h1 className={styles.title}>Login</h1>
        <form onSubmit={handleLogin} className={styles.form}>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.inputGroup}>
            <label className={styles.subtitle} htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              placeholder="Enter your email" 
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.subtitle} htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              placeholder="Enter your password" 
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" disabled={loading} className={styles.loginButton}>
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>
        <div className={styles.signupContainer}>
          <p className={styles.signupText}>Don't have an account?</p>
          <Link href="/register" className={styles.signupLink}>
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}