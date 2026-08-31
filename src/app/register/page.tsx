"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.register.module.css";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/db";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { id, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError("");

    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      /*
       * STEP 1:
       * Create the account in Firebase Authentication.
       *
       * Firebase automatically signs the user in after
       * the account is successfully created.
       */
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const firebaseUser = userCredential.user;

      /*
       * STEP 2:
       * Save the user's profile through your register API.
       *
       * The password is NOT sent to the API.
       */
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          firstName,
          lastName,
          email,
        }),
      });

      const data = await response.json();

      /*
       * If Firebase account was created but the profile
       * could not be saved, show an error.
       */
      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Account was created, but your profile could not be saved."
        );
      }

      /*
       * STEP 3:
       * Save the user information locally for your
       * existing frontend.
       */
      const user = {
        id: firebaseUser.uid,
        user_id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email || email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
      };

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      /*
       * STEP 4:
       * The user is already signed into Firebase.
       *
       * Redirect to the home page.
       */
      window.location.href = "/";
    } catch (err: unknown) {
      console.error("Registration error:", err);

      const firebaseError = err as {
        code?: string;
        message?: string;
      };

      switch (firebaseError.code) {
        case "auth/email-already-in-use":
          setError(
            "An account with this email already exists."
          );
          break;

        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;

        case "auth/weak-password":
          setError(
            "Password is too weak. Please choose a stronger password."
          );
          break;

        case "auth/network-request-failed":
          setError(
            "Network error. Please check your internet connection."
          );
          break;

        default:
          setError(
            firebaseError.message ||
              "An error occurred during registration."
          );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.loginCard}>
        <h1 className={styles.title}>
          Create Account
        </h1>

        {error && (
          <p className={styles.error}>
            {error}
          </p>
        )}

        <form
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <div className={styles.inputGroup}>
            <label
              className={styles.subtitle}
              htmlFor="firstName"
            >
              First Name
            </label>

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
            <label
              className={styles.subtitle}
              htmlFor="lastName"
            >
              Last Name
            </label>

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
            <label
              className={styles.subtitle}
              htmlFor="email"
            >
              Email
            </label>

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
            <label
              className={styles.subtitle}
              htmlFor="password"
            >
              Password
            </label>

            <div className={styles.passwordWrapper}>
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                id="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (prev) => !prev
                  )
                }
                className={
                  styles.togglePassword
                }
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label
              className={styles.subtitle}
              htmlFor="confirmPassword"
            >
              Confirm Password
            </label>

            <div className={styles.passwordWrapper}>
              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                id="confirmPassword"
                placeholder="Confirm your password"
                value={
                  formData.confirmPassword
                }
                onChange={handleChange}
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    (prev) => !prev
                  )
                }
                className={
                  styles.togglePassword
                }
              >
                {showConfirmPassword
                  ? "Hide"
                  : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.loginButton}
          >
            {loading
              ? "Creating Account..."
              : "Sign Up"}
          </button>
        </form>

        <div className={styles.signupContainer}>
          <p className={styles.signupText}>
            Already have an account?
          </p>

          <Link
            href="/login"
            className={styles.signupLink}
          >
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}

