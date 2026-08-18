'use client'
import React, { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';
import styles from './page.contact.module.css';

const Contact = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);

  const sendEmail = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formRef.current) return;

   
    emailjs
      .sendForm('service_glowrush', 'template_glowrush', formRef.current, {
        publicKey: 'GL1hSa2TuOXGaNGo5',
      })
      .then(
        () => {
          setSubmitted(true);
          setError(false);
        },
        (err) => {
          console.error('FAILED...', err.text);
          setError(true);
        }
      );
  };

  return (
    <div className={styles.contactContainer}>
      <div className={styles.contactCard}>
        <h1>Contact Us</h1>
        <p className={styles.contactSubtitle}>We would love to hear from you!</p>
        
        <div className={styles.contactInfo}>
          <a href="mailto:andreworeilly04@gmail.com" className={styles.contactLink}>
            <p><strong>Email:</strong> andreworeilly04@gmail.com</p>
          </a>
          <a href="tel:3525386816" className={styles.contactLink}>
            <p><strong>Phone:</strong> (352) 538-6816</p>
          </a>
        </div>

        {submitted ? (
          <div className={styles.successMessage}>
            <p>Thank you for submitting, we will get in touch shortly.</p>
          </div>
        ) : (
          <form ref={formRef} className={styles.contactForm} onSubmit={sendEmail}>
            <div className={styles.formGroup}>
              <label htmlFor="message">Message Us</label>
              <textarea 
                id="message" 
                name="message"
                rows={5} 
                placeholder="Type your message here..." 
                required
              ></textarea>
            </div>
            {error && <p className={styles.errorText}>Something went wrong. Please try again.</p>}
            <button type="submit" className={styles.submitBtn}>Send Message</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Contact;
