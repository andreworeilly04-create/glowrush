'use client'
import { useState, SyntheticEvent } from 'react';
import Link from 'next/link';
import styles from './page.login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

  try {
    const res = await fetch('api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = "/";
    }

    if (!res.ok){
      throw new Error(data.message || 'Invalid Email or Password');
    }
  
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
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
            <div className={styles.passwordWrapper}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                id="password" 
                placeholder="Enter your password" 
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className={styles.togglePassword}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
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