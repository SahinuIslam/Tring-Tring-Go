import { Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { auth, googleProvider } from "./firebase";
import { signInWithPopup } from "firebase/auth";

function SignupPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "TRAVELER",
    area_id: "",
    years_in_area: "",
    shop_name: "",
    business_area_id: "",
    years_in_business: "",
    description: "",
  });

  const [areas, setAreas] = useState([]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadAreas() {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/travel/areas/");
        if (!res.ok) return;
        const data = await res.json();
        setAreas(data);
      } catch (e) {
        console.error("Failed to load areas", e);
      }
    }
    loadAreas();
  }, []);

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
      payload.business_area_id = formData.business_area_id
        ? parseInt(formData.business_area_id, 10)
        : null;
      payload.years_in_business = formData.years_in_business
        ? parseInt(formData.years_in_business, 10)
        : 0;
      payload.description = formData.description;
    } else if (formData.role === "TRAVELER" || formData.role === "ADMIN") {
      payload.area_id = formData.area_id
        ? parseInt(formData.area_id, 10)
        : null;
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
          area_id: "",
          years_in_area: "",
          shop_name: "",
          business_area_id: "",
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
      await user.getIdToken();
      setMessage(`Google signup success: ${user.email}`);
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

          {isTraveler && <></>}

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
                <select
                  name="business_area_id"
                  value={formData.business_area_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select area…</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
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
                <select
                  name="area_id"
                  value={formData.area_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select area…</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
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
          Already have an account? <Link to="/login">Log in</Link>
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
