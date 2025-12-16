// src/pages/TravelerDashboard.jsx
import React, { useEffect, useState } from "react";

/* ---------- helpers ---------- */

function formatDateTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ---------- TravelerDashboard ---------- */

function TravelerDashboard() {
  const storedUser = localStorage.getItem("ttg_user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const realRole = parsedUser?.role || "TRAVELER";
  const mode = parsedUser?.mode || realRole;
  const token = parsedUser?.token || parsedUser?.username || "";
  const isLoggedIn = !!parsedUser;
  const isTravelerMode = isLoggedIn && mode === "TRAVELER";

  // global theme from Settings
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("ttg_theme");
    return stored === "dark" || stored === "light" ? stored : "light";
  });
  const isDark = theme === "dark";

  useEffect(() => {
    const stored = localStorage.getItem("ttg_theme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
    }
  }, []);

  const [data, setData] = useState(null);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [areasLoading, setAreasLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [saving, setSaving] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [form, setForm] = useState({ area_id: "", years_in_area: "" });

  const [savedPlaces, setSavedPlaces] = useState([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [savedError, setSavedError] = useState(null);

  // my reviews (read-only)
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        if (!isLoggedIn) {
          setLoading(false);
          setError("You must log in as a traveler to view this dashboard.");
          return;
        }
        setLoading(true);
        setError("");
        setMessage("");

        // traveler dashboard
        const dashResp = await fetch(
          "http://127.0.0.1:8000/api/accounts/dashboard/traveler/",
          {
            method: "GET",
            headers: token ? { "X-User-Token": token } : {},
          }
        );
        const dashData = await dashResp.json().catch(() => ({}));
        if (!dashResp.ok) {
          throw new Error(
            dashData.detail || "Failed to load traveler dashboard"
          );
        }

        if (cancelled) return;

        setData(dashData);
        setForm({
          area_id: "",
          years_in_area: dashData.profile.years_in_area || "",
        });

        // saved places
        setSavedLoading(true);
        const savedResp = await fetch(
          "http://127.0.0.1:8000/api/travel/saved-places/",
          {
            method: "GET",
            headers: token ? { "X-User-Token": token } : {},
          }
        );
        if (!savedResp.ok) {
          const errData = await savedResp.json().catch(() => ({}));
          setSavedError(errData.detail || "Failed to load saved places");
        } else {
          const savedData = await savedResp.json();
          setSavedPlaces(savedData);
          setSavedError(null);
        }

        // my reviews (read-only)
        setReviewsLoading(true);
        const reviewsResp = await fetch(
          "http://127.0.0.1:8000/api/travel/reviews/",
          {
            method: "GET",
            headers: token ? { "X-User-Token": token } : {},
          }
        );
        if (!reviewsResp.ok) {
          const errData = await reviewsResp.json().catch(() => ({}));
          setReviewsError(errData.detail || "Failed to load reviews");
        } else {
          const reviewsData = await reviewsResp.json();
          setReviews(reviewsData);
          setReviewsError(null);
        }

        // areas
        setAreasLoading(true);
        const areasResp = await fetch("http://127.0.0.1:8000/api/travel/areas/");
        if (areasResp.ok) {
          const areasData = await areasResp.json();
          if (!cancelled) setAreas(areasData);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setSavedLoading(false);
          setReviewsLoading(false);
          setAreasLoading(false);
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, token]);

  function handleProfileChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (!isLoggedIn) {
        throw new Error("You must log in to update your profile.");
      }

      const resp = await fetch(
        "http://127.0.0.1:8000/api/accounts/dashboard/traveler/profile/",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-User-Token": token,
          },
          body: JSON.stringify({
            area_id: form.area_id ? parseInt(form.area_id, 10) : null,
            years_in_area: parseInt(form.years_in_area, 10) || 0,
          }),
        }
      );

      const body = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        throw new Error(body.detail || "Failed to update profile");
      }

      setData((prev) => ({
        ...prev,
        profile: {
          area: body.area,
          years_in_area: body.years_in_area,
          profile_complete: body.profile_complete,
        },
      }));
      setMessage("Profile updated successfully.");
      setShowEditProfile(false);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveSaved(id) {
    if (!isLoggedIn) {
      setSavedError("You must log in to manage saved places.");
      return;
    }
    if (!isTravelerMode) {
      setSavedError("Switch to traveler mode to manage saved places.");
      return;
    }

    try {
      const resp = await fetch(
        `http://127.0.0.1:8000/api/travel/saved-places/${id}/`,
        {
          method: "DELETE",
          headers: token ? { "X-User-Token": token } : {},
        }
      );

      if (!resp.ok && resp.status !== 204) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.detail || "Failed to remove.");
      }

      setSavedPlaces((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
      setSavedError(err.message);
    }
  }

  const outerBgClass = isDark ? "bg-black bg-gradient" : "bg-body-tertiary";
  const cardBgClass = isDark ? "bg-dark text-light" : "bg-white text-dark";

  if (loading) {
    return (
      <div className={outerBgClass + " min-vh-100 d-flex align-items-center"}>
        <div className="container">
          <div className={`card shadow-lg border-0 rounded-4 ${cardBgClass}`}>
            <div className="card-body p-4">
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" />
                <h2 className="h4 mb-1">Traveler Dashboard</h2>
                <p
                  className={
                    "mb-0 small " +
                    (isDark ? "text-secondary" : "text-muted")
                  }
                >
                  Loading your data…
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={outerBgClass + " min-vh-100 d-flex align-items-center"}>
        <div className="container">
          <div className={`card shadow-lg border-0 rounded-4 ${cardBgClass}`}>
            <div className="card-body p-4">
              <h2 className="h4 mb-3">Traveler Dashboard</h2>
              <div className="alert alert-danger mb-0" role="alert">
                {error || "No data"}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { user, profile } = data;

  return (
    <div className={outerBgClass + " min-vh-100 py-4"}>
      <div className="container">
        <div
          className={
            "card shadow-lg border-0 rounded-4 overflow-hidden " + cardBgClass
          }
        >
          {/* Hero header */}
          <div
            className={
              "px-4 pt-4 pb-3 bg-gradient " +
              (isDark ? "bg-primary text-light" : "bg-primary text-white")
            }
          >
            <div className="d-flex flex-wrap align-items-center justify-content-between">
              <div className="mb-3 mb-lg-0">
                <h1
                  className={
                    "h3 mb-1 " + (isDark ? "text-light" : "text-white")
                  }
                >
                  Welcome, {user.username}
                </h1>
                <p
                  className={
                    "mb-1 small " +
                    (isDark ? "text-light opacity-75" : "text-white-50")
                  }
                >
                  Discover new places, manage your profile, and see all your
                  reviews as a traveler.
                </p>
                <div className="d-flex align-items-center gap-2 mt-1">
                  <span className="badge rounded-pill bg-light text-dark">
                    Traveler mode
                  </span>
                  <span className="badge rounded-pill bg-light text-dark">
                    {profile.area || "Area not set"}
                  </span>
                </div>
              </div>

              <div className="text-end">
                {parsedUser &&
                  realRole === "MERCHANT" &&
                  mode !== "MERCHANT" && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-light rounded-pill mb-2"
                      onClick={() => {
                        const updated = { ...parsedUser, mode: "MERCHANT" };
                        localStorage.setItem(
                          "ttg_user",
                          JSON.stringify(updated)
                        );
                        window.location.href = "/merchant";
                      }}
                    >
                      <i className="bi bi-shop me-1" />
                      Switch to merchant
                    </button>
                  )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="card-body p-4">
            {message && (
              <div className="alert alert-success py-2 small" role="alert">
                {message}
              </div>
            )}
            {error && (
              <div className="alert alert-danger py-2 small" role="alert">
                {error}
              </div>
            )}

            {/* Stats row */}
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <div className="card border-0 bg-primary-subtle h-100">
                  <div className="card-body d-flex align-items-center">
                    <div className="me-3">
                      <span className="badge bg-primary text-white rounded-circle p-3">
                        <i className="bi bi-geo-alt-fill" />
                      </span>
                    </div>
                    <div>
                      <div
                        className={
                          "small text-uppercase " +
                          (isDark ? "text-secondary" : "text-muted")
                        }
                      >
                        Area
                      </div>
                      <div className="fw-bold text-dark">
                        {profile.area || "Area Not set"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card border-0 bg-success-subtle h-100">
                  <div className="card-body d-flex align-items-center">
                    <div className="me-3">
                      <span className="badge bg-success text-white rounded-circle p-3">
                        <i className="bi bi-emoji-smile-fill" />
                      </span>
                    </div>
                    <div>
                      <div
                        className={
                          "small text-uppercase " +
                          (isDark ? "text-secondary" : "text-muted")
                        }
                      >
                        Years in area
                      </div>
                      <div className="fw-bold text-dark">
                        {profile.years_in_area || "0"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card border-0 bg-info-subtle h-100">
                  <div className="card-body d-flex align-items-center">
                    <div className="me-3">
                      <span className="badge bg-info text-white rounded-circle p-3">
                        <i className="bi bi-bookmark-heart-fill" />
                      </span>
                    </div>
                    <div>
                      <div
                        className={
                          "small text-uppercase " +
                          (isDark ? "text-secondary" : "text-muted")
                        }
                      >
                        Saved places
                      </div>
                      <div className="fw-bold text-dark">
                        {savedPlaces.length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card border-0 bg-warning-subtle h-100">
                  <div className="card-body d-flex align-items-center">
                    <div className="me-3">
                      <span className="badge bg-warning text-dark rounded-circle p-3">
                        <i className="bi bi-star-fill" />
                      </span>
                    </div>
                    <div>
                      <div
                        className={
                          "small text-uppercase " +
                          (isDark ? "text-secondary" : "text-muted")
                        }
                      >
                        My reviews
                      </div>
                      <div className="fw-bold text-dark">{reviews.length}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Two-column layout: profile + edit */}
            <div className="row g-4 mb-4">
              <div className="col-lg-5">
                <div
                  className={
                    "card border-0 h-100 " +
                    (isDark ? "bg-secondary text-light" : "bg-light")
                  }
                >
                  <div className="card-body">
                    <h3
                      className={
                        "h6 text-uppercase mb-3 " +
                        (isDark ? "text-light" : "text-muted")
                      }
                    >
                      Profile details
                    </h3>
                    <dl className="row mb-0 small">
                      <dt
                        className={
                          "col-5 " +
                          (isDark ? "text-light" : "text-muted")
                        }
                      >
                        Name
                      </dt>
                      <dd className="col-7 fw-semibold">
                        {user.username}
                      </dd>

                      <dt
                        className={
                          "col-5 " +
                          (isDark ? "text-light" : "text-muted")
                        }
                      >
                        Email
                      </dt>
                      <dd className="col-7">
                        {user.email || "Not set"}
                      </dd>

                      <dt
                        className={
                          "col-5 " +
                          (isDark ? "text-light" : "text-muted")
                        }
                      >
                        Area
                      </dt>
                      <dd className="col-7">
                        {profile.area || "Area Not set"}
                      </dd>

                      <dt
                        className={
                          "col-5 " +
                          (isDark ? "text-light" : "text-muted")
                        }
                      >
                        Years in area
                      </dt>
                      <dd className="col-7">
                        {profile.years_in_area || "0"}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="col-lg-7">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h3
                    className={
                      "h6 text-uppercase mb-0 " +
                      (isDark ? "text-secondary" : "text-muted")
                    }
                  >
                    Edit profile
                  </h3>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm rounded-pill"
                    onClick={() => setShowEditProfile((prev) => !prev)}
                  >
                    {showEditProfile ? "Hide form" : "Edit details"}
                  </button>
                </div>

                {showEditProfile && (
                  <form
                    onSubmit={handleSaveProfile}
                    className={
                      "card border-0 shadow-sm " +
                      (isDark ? "bg-dark text-light" : "bg-white")
                    }
                  >
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Area</label>
                          {areasLoading ? (
                            <p className="text-muted small mb-0">
                              Loading areas…
                            </p>
                          ) : (
                            <select
                              className="form-select form-select-sm"
                              name="area_id"
                              value={form.area_id}
                              onChange={handleProfileChange}
                              required
                            >
                              <option value="">Select area…</option>
                              {areas.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Years in area</label>
                          <input
                            type="number"
                            min="0"
                            className="form-control form-control-sm"
                            name="years_in_area"
                            value={form.years_in_area}
                            onChange={handleProfileChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="mt-3 d-flex justify-content-end">
                        <button
                          type="submit"
                          className="btn btn-primary btn-sm rounded-pill"
                          disabled={saving}
                        >
                          {saving ? "Saving..." : "Save changes"}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Saved places */}
            <div className="mb-4">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h3
                  className={
                    "h6 text-uppercase mb-0 " +
                    (isDark ? "text-secondary" : "text-muted")
                  }
                >
                  Saved places
                </h3>
              </div>

              {!isTravelerMode && isLoggedIn && (
                <p
                  className={
                    "small mb-2 " +
                    (isDark ? "text-secondary" : "text-muted")
                  }
                >
                  Switch to traveler mode to manage saved places.
                </p>
              )}

              {savedLoading ? (
                <p className="text-muted small mb-0">
                  Loading saved places…
                </p>
              ) : savedError ? (
                <div className="alert alert-danger py-2 small" role="alert">
                  {savedError}
                </div>
              ) : savedPlaces.length === 0 ? (
                <p className="text-muted small mb-0">
                  You have not saved any places yet.
                </p>
              ) : (
                <div className="row g-3">
                  {savedPlaces.map((item) => {
                    const p = item.place;

                    const imgSrc =
                      p.image_url ||
                      (typeof p.image === "string" && p.image.length > 0
                        ? p.image.startsWith("http")
                          ? p.image
                          : `http://127.0.0.1:8000${p.image}`
                        : null);

                    return (
                      <div className="col-md-4" key={item.id}>
                        <div className="card h-100 border-0 bg-body-secondary">
                          {imgSrc ? (
                            <img
                              src={imgSrc}
                              alt={p.name}
                              className="card-img-top"
                              style={{ height: "140px", objectFit: "cover" }}
                            />
                          ) : (
                            <div
                              className="card-img-top d-flex align-items-center justify-content-center bg-secondary-subtle text-muted"
                              style={{ height: "140px" }}
                            >
                              No image
                            </div>
                          )}
                          <div className="card-body py-2 px-3">
                            <h5 className="card-title h6 mb-1">{p.name}</h5>
                            <p className="card-text small mb-1 text-muted">
                              {p.area_name || "Area not set"}
                            </p>
                            <p className="card-text small mb-0 text-muted">
                              {p.category} • {p.average_rating.toFixed(1)}★
                            </p>
                          </div>
                          <div className="card-footer bg-transparent border-0 pt-0 pb-2 px-3 d-flex justify-content-between">
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0 text-danger"
                              onClick={() => handleRemoveSaved(item.id)}
                              disabled={!isTravelerMode || !isLoggedIn}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* My reviews (read-only) */}
            <div>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h3
                  className={
                    "h6 text-uppercase mb-0 " +
                    (isDark ? "text-secondary" : "text-muted")
                  }
                >
                  My reviews
                </h3>
              </div>

              {reviewsError && (
                <div className="alert alert-danger py-2 small" role="alert">
                  {reviewsError}
                </div>
              )}

              {reviewsLoading ? (
                <p className="text-muted small mb-0">Loading reviews…</p>
              ) : reviews.length === 0 ? (
                <p className="text-muted small mb-0">
                  You have not written any reviews yet.
                </p>
              ) : (
                <div className="row g-3">
                  {reviews.map((r) => (
                    <div className="col-md-6" key={r.id}>
                      <div className="card border-0 bg-body-secondary h-100">
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between">
                            <div>
                              <div className="fw-semibold small">
                                {r.place_name}
                                {r.place_area && (
                                  <span className="text-muted">
                                    {" "}
                                    · {r.place_area}
                                  </span>
                                )}
                              </div>
                              <div className="text-muted small">
                                {formatDateTime(r.created_at)}
                              </div>
                            </div>
                            <div className="fw-bold text-warning">
                              {r.rating}★
                            </div>
                          </div>

                          {r.title && (
                            <p className="fw-semibold small mt-2 mb-1">
                              {r.title}
                            </p>
                          )}
                          {r.text && (
                            <p className="small text-muted mb-0">{r.text}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TravelerDashboard;
