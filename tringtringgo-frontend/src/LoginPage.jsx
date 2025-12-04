// src/LoginPage.jsx
// 1) React + Router + Firebase imports
import React, { useState } from "react";
import { auth, googleProvider } from "./firebase";
import { signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";

// 2) Component start
function LoginPage() {
  // For redirecting after login
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    username_or_email: "",
    password: "",
  });
  // UI state
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle typing in inputs
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  // 3) Normal username/password login (Django /login/)
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setErrors(null);

    try {
      const resp = await fetch("http://127.0.0.1:8000/api/accounts/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
        mode: "cors"  // include cookies for session auth
      });

      if (resp.ok) {
        const data = await resp.json();
        setMessage(data.message || "Login successful!");

        // Save minimal info in browser
        localStorage.setItem(
          "ttg_user",
          JSON.stringify({
            username: data.username,
            email: data.email,
            role: data.role,
            token: data.token,
          })
        );

        // Role-based redirect
        if (data.role === "TRAVELER") navigate("/traveler");
        else if (data.role === "MERCHANT") navigate("/merchant");
        else if (data.role === "ADMIN") navigate("/admin");
      } else {
        const errData = await resp.json();
        setErrors(errData);
      }
    } catch {
      setErrors({ detail: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  // 4) Google login using Firebase + Django /google-login/
  async function handleGoogleLogin() {
    setLoading(true);
    setMessage("");
    setErrors(null);

    try {
      // Open Google popup in browser
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Get Firebase ID token to send to Django
      const idToken = await user.getIdToken();

      const resp = await fetch(
        "http://127.0.0.1:8000/api/accounts/google-login/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: idToken }),
        }
      );

      if (resp.ok) {
        const data = await resp.json();
        setMessage(data.message || "Google login successful!");

        localStorage.setItem(
          "ttg_user",
          JSON.stringify({
            email: data.email,
            role: data.role,
          })
        );

        if (data.role === "TRAVELER") navigate("/traveler");
        else if (data.role === "MERCHANT") navigate("/merchant");
        else if (data.role === "ADMIN") navigate("/admin");
      } else {
        const errData = await resp.json();
        setErrors(errData);
      }
    } catch (err) {
      console.error(err);
      setErrors({ detail: "Google login failed." });
    } finally {
      setLoading(false);
    }
  }

  // 5) Forgot password via Firebase
  async function handleForgotPassword() {
    const email = formData.username_or_email.trim();
    setMessage("");
    setErrors(null);

    if (!email || !email.includes("@")) {
      setErrors({
        detail:
          "Please enter your email in the 'Username or Email' field first.",
      });
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent. Check your inbox.");
    } catch (err) {
      console.error(err);
      setErrors({
        detail:
          "Could not send reset email. Check the email or try again later.",
      });
    } finally {
      setLoading(false);
    }
  }

  // 6) JSX UI
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Log in to TringTringGo</h1>
        <p className="auth-subtitle">
          Access your trips, reviews, and dashboards.
        </p>

        {message && <div className="alert success">{message}</div>}
        {errors && (
          <div className="alert error">
            {Object.entries(errors).map(([field, msgs]) => (
              <p key={field}>
                <strong>{field}:</strong>{" "}
                {Array.isArray(msgs) ? msgs.join(", ") : msgs}
              </p>
            ))}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Username or Email</label>
            <input
              name="username_or_email"
              value={formData.username_or_email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <label>Password</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
              style={{
                alignSelf: "flex-end",
                marginTop: "0.25rem",
                background: "none",
                border: "none",
                color: "#2563eb",
                cursor: "pointer",
                padding: 0,
                fontSize: "0.85rem",
              }}
            >
              Forgot password?
            </button>
          </div>

          {/* Google login button */}
          <button
            type="button"
            className="primary-btn"
            style={{ marginBottom: "0.75rem" }}
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            Continue with Google
          </button>

          {/* Normal login button */}
          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="auth-footer">
          Don’t have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>

      <div className="auth-hero">
        <div className="auth-hero-overlay" />
        <div className="auth-hero-content">
          <h2>Welcome back, traveler.</h2>
          <p>
            Pick up where you left off with saved places, reviews, and curated
            plans.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
