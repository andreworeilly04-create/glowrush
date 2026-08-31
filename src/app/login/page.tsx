"use client";

import { useState, SyntheticEvent } from "react";
import Link from "next/link";
import styles from "./page.login.module.css";

import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/db";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (
    e: SyntheticEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      // Sign into Firebase Authentication
      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          normalizedEmail,
          password
        );

      const firebaseUser = userCredential.user;

      console.log(
        "Firebase login successful:",
        firebaseUser.uid
      );

      // Confirm Firebase still has the signed-in user
      console.log(
        "Current Firebase user:",
        auth.currentUser?.uid
      );

      // Get the user's Firestore profile
      const userRef = doc(
        db,
        "users",
        firebaseUser.uid
      );

      const userSnapshot = await getDoc(userRef);

      let firstName = "";
      let lastName = "";

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();

        firstName =
          typeof userData.firstName === "string"
            ? userData.firstName
            : "";

        lastName =
          typeof userData.lastName === "string"
            ? userData.lastName
            : "";
      }

      // Create the user object for the rest of your frontend
      const user = {
        id: firebaseUser.uid,
        user_id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email || normalizedEmail,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
      };

      // Keep this for your existing frontend components
      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      // Firebase Auth is now the actual authentication state
      console.log(
        "User is authenticated:",
        auth.currentUser !== null
      );

      // Redirect after successful login
      window.location.href = "/";
    } catch (err: unknown) {
      console.error("Login error:", err);

      const firebaseError = err as {
        code?: string;
        message?: string;
      };

      switch (firebaseError.code) {
        case "auth/invalid-credential":
          setError("Invalid email or password.");
          break;

        case "auth/wrong-password":
          setError("Invalid email or password.");
          break;

        case "auth/user-not-found":
          setError("Invalid email or password.");
          break;

        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;

        case "auth/user-disabled":
          setError("This account has been disabled.");
          break;

        case "auth/too-many-requests":
          setError(
            "Too many login attempts. Please try again later."
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
              "An unexpected error occurred during login."
          );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.loginCard}>
        <h1 className={styles.title}>Login</h1>

        <form
          onSubmit={handleLogin}
          className={styles.form}
        >
          {error && (
            <p className={styles.error}>
              {error}
            </p>
          )}

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
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
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

          <button
            type="submit"
            disabled={loading}
            className={styles.loginButton}
          >
            {loading
              ? "Logging in..."
              : "Sign In"}
          </button>
        </form>

        <div className={styles.signupContainer}>
          <p className={styles.signupText}>
            Don't have an account?
          </p>

          <Link
            href="/register"
            className={styles.signupLink}
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}

