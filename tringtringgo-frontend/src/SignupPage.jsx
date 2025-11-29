import React, { useState } from "react";
import { auth, googleProvider } from "./firebase";
import { signInWithPopup } from "firebase/auth";

function SignupPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "TRAVELER",
    area: "",
    years_in_area: "",
    shop_name: "",
    business_area: "",
    years_in_business: "",
    description: "",
  });

  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setErrors(null);

    const payload = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    };

    if (formData.role === "MERCHANT") {
      payload.shop_name = formData.shop_name;
      payload.business_area = formData.business_area;
      payload.years_in_business = formData.years_in_business
        ? parseInt(formData.years_in_business, 10)
        : 0;
      payload.description = formData.description;
    } else if (formData.role === "ADMIN") {
      payload.area = formData.area;
      payload.years_in_area = formData.years_in_area
        ? parseInt(formData.years_in_area, 10)
        : 0;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/accounts/signup/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message || "Signup successful!");
        setFormData({
          username: "",
          email: "",
          password: "",
          role: "TRAVELER",
          area: "",
          years_in_area: "",
          shop_name: "",
          business_area: "",
          years_in_business: "",
          description: "",
        });
      } else {
        const errData = await response.json();
        setErrors(errData);
      }
    } catch (err) {
      setErrors({ detail: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setLoading(true);
    setMessage("");
    setErrors(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      // For now, just show success
      setMessage(`Google signup success: ${user.email}`);
      // Later we’ll send idToken to Django
    } catch (err) {
      console.error(err);
      setErrors({ detail: "Google login failed." });
    } finally {
      setLoading(false);
    }
  }

  const isTraveler = formData.role === "TRAVELER";
  const isMerchant = formData.role === "MERCHANT";
  const isAdmin = formData.role === "ADMIN";

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Join TringTringGo</h1>
        <p className="auth-subtitle">
          Create your account to discover trips, foods, and local experts.
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
            <label>Username</label>
            <input
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
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
          </div>

          <div className="form-row">
            <label>Role</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="TRAVELER">Traveler</option>
              <option value="MERCHANT">Merchant</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {isTraveler && (
            <>
              {/* No extra fields for traveler right now */}
            </>
          )}

          {isMerchant && (
            <>
              <div className="form-row">
                <label>Business name</label>
                <input
                  name="shop_name"
                  value={formData.shop_name}
                  onChange={handleChange}
                />
              </div>
              <div className="form-row">
                <label>Business area</label>
                <input
                  name="business_area"
                  value={formData.business_area}
                  onChange={handleChange}
                  placeholder="e.g. Uttara"
                />
              </div>
              <div className="form-row">
                <label>Years in business</label>
                <input
                  name="years_in_business"
                  type="number"
                  min="0"
                  value={formData.years_in_business}
                  onChange={handleChange}
                />
              </div>
              <div className="form-row">
                <label>Short description</label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell travelers what makes your place special"
                />
              </div>
            </>
          )}

          {isAdmin && (
            <>
              <div className="form-row">
                <label>Admin area of responsibility</label>
                <input
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  placeholder="e.g. Dhaka division"
                />
              </div>
              <div className="form-row">
                <label>Years in this area</label>
                <input
                  name="years_in_area"
                  type="number"
                  min="0"
                  value={formData.years_in_area}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <button
            type="button"
            className="primary-btn"
            style={{ marginBottom: "0.75rem" }}
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            Continue with Google
          </button>

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? (login page will go here later)
        </p>
      </div>

      <div className="auth-hero">
        <div className="auth-hero-overlay" />
        <div className="auth-hero-content">
          <h2>Plan smarter. Travel happier.</h2>
          <p>
            Discover verified merchants, honest local reviews, and seasonal
            highlights tailored to you.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
