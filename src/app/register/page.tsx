'use client'
import { useState,} from 'react';
import Link from 'next/link';
import styles from './page.register.module.css';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName:'',
    email:'',
    password:'',
    confirmPassword:'',
  })
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ... formData, [e.target.id]: e.target.value });
  }

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body:JSON.stringify({ 
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password:formData.password,
          confirmPassword: formData.confirmPassword
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'User already Exists')
      }
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/';
    } catch (err:any) {
      setError(err.message);
    } finally {
      setLoading(false)
    }
  };


  return (
    <main className={styles.container}>
      <div className={styles.loginCard}>
        <h1 className={styles.title}>Create Account</h1>
        {error && <p style={{ color:'red', fontSize: '14px'}}>{error}</p>}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.subtitle} htmlFor="firstName">First Name</label>
            <input 
              type="text" 
              id="firstName" 
              placeholder="Enter your first name" 
              value={formData.firstName}
              onChange={handleChange}
              required 
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.subtitle} htmlFor="lastName">Last Name</label>
            <input 
              type="text" 
              id="lastName" 
              placeholder="Enter your last name" 
              value={formData.lastName}
              onChange={handleChange}
              required 
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.subtitle} htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              placeholder="Enter your email" 
              value={formData.email}
              onChange={handleChange}
              required 
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.subtitle} htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              value={formData.password}
              onChange={handleChange}
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
              value={formData.confirmPassword}
              onChange={handleChange}
              required 
            />
          </div>
          <button type="submit" disabled={loading} className={styles.loginButton}>
            {loading ? 'Creating Account...' : 'Sign Up'}
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