import React, { useEffect, useState } from "react";

function TravelerDashboard() {
  // read real role and mode
  const storedUser = localStorage.getItem("ttg_user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const realRole = parsedUser?.role || "TRAVELER";
  const mode = parsedUser?.mode || realRole;
  const isLoggedIn = !!parsedUser;
  const isTravelerMode = isLoggedIn && mode === "TRAVELER";

  // Dashboard data
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Profile edit
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ area_id: "", years_in_area: "" });
  const [message, setMessage] = useState("");
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [areas, setAreas] = useState([]);

  // Saved places
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [savedError, setSavedError] = useState(null);

  // My Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(null);
  const [newReview, setNewReview] = useState({
    place: "",
    rating: 5,
    title: "",
    text: "",
  });
  const [reviewSaving, setReviewSaving] = useState(false);

  // Edit existing review
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editingReviewData, setEditingReviewData] = useState({
    rating: 5,
    title: "",
    text: "",
  });

  // All places for review dropdown
  const [allPlaces, setAllPlaces] = useState([]);
  const [allPlacesLoading, setAllPlacesLoading] = useState(true);
  const [allPlacesError, setAllPlacesError] = useState(null);

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

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const stored = localStorage.getItem("ttg_user");
        const parsed = stored ? JSON.parse(stored) : null;
        const token = parsed?.token || parsed?.username || "";

        // Dashboard
        const dashResp = await fetch(
          "http://127.0.0.1:8000/api/accounts/dashboard/traveler/",
          {
            method: "GET",
            headers: token ? { "X-User-Token": token } : {},
          }
        );

        if (!dashResp.ok) {
          const errData = await dashResp.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to load dashboard");
        }

        const dashData = await dashResp.json();
        setData(dashData);
        setForm({
          area_id: "",
          years_in_area: dashData.profile.years_in_area || "",
        });

        // Saved places
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

        // All places
        setAllPlacesLoading(true);
        const placesResp = await fetch(
          "http://127.0.0.1:8000/api/travel/places/"
        );
        if (!placesResp.ok) {
          const errData = await placesResp.json().catch(() => ({}));
          setAllPlacesError(errData.detail || "Failed to load places");
        } else {
          const placesData = await placesResp.json();
          setAllPlaces(placesData);
          setAllPlacesError(null);
        }

        // My reviews
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

        // Areas
        const areasResp = await fetch("http://127.0.0.1:8000/api/travel/areas/");
        if (areasResp.ok) {
          const areasData = await areasResp.json();
          setAreas(areasData);
        }
      } catch (err) {
        console.error("Dashboard Load Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
        setSavedLoading(false);
        setReviewsLoading(false);
        setAllPlacesLoading(false);
      }
    }

    loadData();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage("");

    try {
      const stored = localStorage.getItem("ttg_user");
      const parsed = stored ? JSON.parse(stored) : null;
      const token = parsed?.token || parsed?.username || "";

      if (!token) {
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

      const body = await resp.json();

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
      setMessage("Profile updated successfully!");
      setShowEditProfile(false);
    } catch (err) {
      console.error("Profile Save Error:", err);
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
      const stored = localStorage.getItem("ttg_user");
      const parsed = stored ? JSON.parse(stored) : null;
      const token = parsed?.token || parsed?.username || "";

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

  function handleNewReviewChange(e) {
    const { name, value } = e.target;
    setNewReview((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCreateReview(e) {
    e.preventDefault();
    if (!isLoggedIn) {
      setReviewsError("You must log in to write reviews.");
      return;
    }
    if (!isTravelerMode) {
      setReviewsError("Switch to traveler mode to write reviews.");
      return;
    }

    setReviewSaving(true);
    setReviewsError(null);

    try {
      const stored = localStorage.getItem("ttg_user");
      const parsed = stored ? JSON.parse(stored) : null;
      const token = parsed?.token || parsed?.username || "";

      if (!token) {
        throw new Error("You must log in to write reviews.");
      }

      const resp = await fetch("http://127.0.0.1:8000/api/travel/reviews/create/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Token": token,
        },
        body: JSON.stringify({
          place: parseInt(newReview.place, 10),
          rating: parseInt(newReview.rating, 10),
          title: newReview.title,
          text: newReview.text,
        }),
      });

      const body = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        throw new Error(
          body.detail || "Could not create review (check place and rating)"
        );
      }

      setReviews((prev) => [body, ...prev]);
      setNewReview({ place: "", rating: 5, title: "", text: "" });
    } catch (err) {
      console.error(err);
      setReviewsError(err.message);
    } finally {
      setReviewSaving(false);
    }
  }

  function startEditReview(r) {
    setEditingReviewId(r.id);
    setEditingReviewData({
      rating: r.rating,
      title: r.title || "",
      text: r.text || "",
    });
  }

  async function handleUpdateReview(e, id) {
    e.preventDefault();
    if (!isLoggedIn) {
      setReviewsError("You must log in to edit reviews.");
      return;
    }
    if (!isTravelerMode) {
      setReviewsError("Switch to traveler mode to edit reviews.");
      return;
    }

    setReviewsError(null);

    try {
      const stored = localStorage.getItem("ttg_user");
      const parsed = stored ? JSON.parse(stored) : null;
      const token = parsed?.token || parsed?.username || "";

      if (!token) {
        throw new Error("You must log in to edit reviews.");
      }

      const resp = await fetch(
        `http://127.0.0.1:8000/api/travel/reviews/${id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-User-Token": token,
          },
          body: JSON.stringify({
            rating: parseInt(editingReviewData.rating, 10),
            title: editingReviewData.title,
            text: editingReviewData.text,
          }),
        }
      );

      const body = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        throw new Error(body.detail || "Could not update review");
      }

      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...body } : r))
      );
      setEditingReviewId(null);
    } catch (err) {
      console.error(err);
      setReviewsError(err.message);
    }
  }

  async function handleDeleteReview(id) {
    if (!isLoggedIn) {
      setReviewsError("You must log in to delete reviews.");
      return;
    }
    if (!isTravelerMode) {
      setReviewsError("Switch to traveler mode to delete reviews.");
      return;
    }

    try {
      const stored = localStorage.getItem("ttg_user");
      const parsed = stored ? JSON.parse(stored) : null;
      const token = parsed?.token || parsed?.username || "";

      const resp = await fetch(
        `http://127.0.0.1:8000/api/travel/reviews/${id}/delete/`,
        {
          method: "DELETE",
          headers: token ? { "X-User-Token": token } : {},
        }
      );

      if (!resp.ok && resp.status !== 204) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.detail || "Failed to delete review");
      }

      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      setReviewsError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <h2>🧳 Traveler Dashboard</h2>
          <p>Loading your data...</p>
        </div>
      </div>
    );
  }

  if (error && error.includes("Not logged in")) {
    return (
      <div className="dashboard-page flex justify-center p-4 min-h-screen bg-gray-50">
        <div className="dashboard-card" style={{
          textAlign: 'center', padding: '4rem 2rem', maxWidth: '500px'
        }}>
          <div style={{fontSize: '4rem', marginBottom: '1rem'}}></div>
          <h2 style={{fontSize: '2rem', marginBottom: '1rem'}}>Welcome to TringTringGo!</h2>
          <p style={{fontSize: '1.1rem', color: '#666', marginBottom: '2rem'}}>
            Log in to access your personalized dashboard.
          </p>
          <a href="/login" className="primary-btn" style={{
            padding: '1rem 2rem', fontSize: '1.1rem', display: 'inline-block'
          }}>
            Log In to Continue
          </a>
          <p style={{marginTop: '2rem', color: '#9ca3af', fontSize: '0.9rem'}}>
            New here? <a href="/signup" style={{color: '#3b82f6'}}>Sign up</a>
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <h2>🧳 Traveler Dashboard</h2>
          <p>No data available. Check authentication status.</p>
        </div>
      </div>
    );
  }

  const { user, profile } = data;

  return (
    <div className="dashboard-page flex justify-center p-4 min-h-screen bg-gray-50">
      <style>{`
        .dashboard-card {
          width: 100%;
          max-width: 900px;
          background: white;
          padding: 2rem;
          border-radius: 0.75rem;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1),
                      0 2px 4px -2px rgba(0,0,0,0.1);
        }
        .user-welcome {
          font-size: 1.125rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 0.75rem;
        }
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .stat-card {
          padding: 1rem;
          background-color: #f9fafb;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }
        .stat-card h3 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }
        .stat-card p {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
        }
        .primary-btn {
          padding: 0.6rem 1.25rem;
          border: none;
          border-radius: 0.5rem;
          background-color: #3b82f6;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .primary-btn:disabled {
          background-color: #93c5fd;
          cursor: not-allowed;
        }
      `}</style>

      <div className="dashboard-card">


        {parsedUser && realRole === "MERCHANT" && mode !== "MERCHANT" && (
          <button
            type="button"
            className="primary-btn"
            style={{ marginBottom: "0.75rem", marginRight: "0.5rem" }}
            onClick={() => {
              const updated = { ...parsedUser, mode: "MERCHANT" };
              localStorage.setItem("ttg_user", JSON.stringify(updated));
              window.location.href = "/merchant";
            }}
          >
            Switch to merchant mode
          </button>
        )}

        <h2 className="text-2xl font-bold text-gray-800">
          Traveler Dashboard
        </h2>

        <div className="user-welcome">
          Welcome, <strong>{user.username}</strong>{" "}
          
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <h3>Area</h3>
            <p>{profile.area}</p>
          </div>
          <div className="stat-card">
            <h3>Years in area</h3>
            <p>{profile.years_in_area}</p>
          </div>
        </div>

        {/* PROFILE DETAILS */}
        <section style={{ marginTop: "1.5rem" }}>
          <h3 className="text-xl font-semibold mb-2">Profile details</h3>
          <p>
            <strong>Name:</strong> {user.username}
          </p>
          <p>
            <strong>Email:</strong> {user.email || "Not set"}
          </p>
          <p>
            <strong>Area:</strong> {profile.area}
          </p>
          <p>
            <strong>Years in area:</strong> {profile.years_in_area}
          </p>
        </section>

        {/* EDIT PROFILE */}
        <section style={{ marginTop: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <h3 className="text-xl font-semibold">Edit Profile</h3>
            <button
              type="button"
              onClick={() => setShowEditProfile((prev) => !prev)}
              className="primary-btn"
              style={{ padding: "0.35rem 0.9rem", fontSize: "0.85rem" }}
            >
              {showEditProfile ? "Hide form" : "Edit profile"}
            </button>
          </div>

          {message && (
            <div
              className="alert success"
              style={{ marginBottom: "0.75rem", color: "#065f46" }}
            >
              {message}
            </div>
          )}
          {error && (
            <p style={{ color: "#b91c1c", fontSize: "0.9rem" }}>{error}</p>
          )}

          {showEditProfile && (
            <form
              className="auth-form"
              onSubmit={handleSaveProfile}
              style={{ maxWidth: "400px" }}
            >
              <div className="form-row">
                <label htmlFor="area_id">Area</label>
                <select
                  id="area_id"
                  name="area_id"
                  value={form.area_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select area</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label htmlFor="years_in_area">Years in area</label>
                <input
                  id="years_in_area"
                  name="years_in_area"
                  type="number"
                  min="0"
                  value={form.years_in_area}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                className="primary-btn"
                type="submit"
                disabled={saving}
                style={{ alignSelf: "flex-start" }}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </form>
          )}
        </section>

        {/* SAVED PLACES */}
        <section style={{ marginTop: "1.5rem" }}>
          <h3 className="text-xl font-semibold mb-2">Saved places</h3>
          {!isTravelerMode && isLoggedIn && (
            <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              Switch to traveler mode to manage saved places.
            </p>
          )}
          {savedLoading ? (
            <p>Loading saved places...</p>
          ) : savedError ? (
            <p style={{ color: "#b91c1c" }}>{savedError}</p>
          ) : savedPlaces.length === 0 ? (
            <p style={{ color: "#6b7280" }}>
              You have not saved any places yet.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1rem",
                marginTop: "0.75rem",
              }}
            >
              {savedPlaces.map((item) => {
                const p = item.place;
                return (
                  <div
                    key={item.id}
                    style={{
                      borderRadius: "0.75rem",
                      overflow: "hidden",
                      boxShadow: "0 6px 16px rgba(15,23,42,0.08)",
                      background: "#ffffff",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        style={{
                          width: "100%",
                          height: "140px",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "140px",
                          background: "#e5e7eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#6b7280",
                          fontSize: "0.9rem",
                        }}
                      >
                        No image
                      </div>
                    )}
                    <div style={{ padding: "0.75rem 0.9rem", flexGrow: 1 }}>
                      <h4 style={{ margin: 0, fontSize: "1rem" }}>{p.name}</h4>
                      <p
                        style={{
                          margin: "0.25rem 0",
                          fontSize: "0.85rem",
                          color: "#6b7280",
                        }}
                      >
                        {p.area_name || "Area not set"}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.85rem",
                          color: "#4b5563",
                        }}
                      >
                        {p.category} • {p.average_rating.toFixed(1)}
                      </p>
                    </div>
                    <div
                      style={{
                        padding: "0.65rem 0.9rem 0.8rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveSaved(item.id)}
                        disabled={!isTravelerMode || !isLoggedIn}
                        style={{
                          border: "none",
                          background: "none",
                          color:
                            !isTravelerMode || !isLoggedIn
                              ? "#9ca3af"
                              : "#b91c1c",
                          cursor:
                            !isTravelerMode || !isLoggedIn
                              ? "not-allowed"
                              : "pointer",
                          fontSize: "0.85rem",
                        }}
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        style={{
                          fontSize: "0.85rem",
                          color: "#2563eb",
                          textDecoration: "none",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        View details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* MY REVIEWS */}
        <section style={{ marginTop: "1.5rem" }}>
          <h3 className="text-xl font-semibold mb-2">My reviews</h3>
          <p
            style={{
              color: "#6b7280",
              fontSize: "0.9rem",
              marginBottom: "0.5rem",
            }}
          >
            Select any place, give a rating, and share your experience. Your
            reviews help other travelers.
          </p>
          {!isTravelerMode && isLoggedIn && (
            <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              Switch to traveler mode to create or edit reviews.
            </p>
          )}
          {reviewsLoading ? (
            <p>Loading reviews...</p>
          ) : (
            <>
              {reviewsError && (
                <p style={{ color: "#b91c1c" }}>{reviewsError}</p>
              )}

              {/* Create review form */}
              <form
                onSubmit={handleCreateReview}
                style={{
                  display: "grid",
                  gap: "0.75rem",
                  maxWidth: "500px",
                  marginBottom: "1rem",
                  marginTop: "0.5rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      marginBottom: "0.25rem",
                    }}
                  >
                    Place
                  </label>
                  {allPlacesLoading ? (
                    <p style={{ fontSize: "0.85rem" }}>Loading places...</p>
                  ) : allPlacesError ? (
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "#b91c1c",
                      }}
                    >
                      {allPlacesError}
                    </p>
                  ) : (
                    <select
                      name="place"
                      value={newReview.place}
                      onChange={handleNewReviewChange}
                      style={{
                        width: "100%",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "0.375rem",
                        border: "1px solid #d1d5db",
                      }}
                      required
                      disabled={!isTravelerMode || !isLoggedIn}
                    >
                      <option value="">Select a place</option>
                      {allPlaces.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {p.area_name ? ` — ${p.area_name}` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      marginBottom: "0.25rem",
                    }}
                  >
                    Rating (1–5)
                  </label>
                  <input
                    name="rating"
                    type="number"
                    min="1"
                    max="5"
                    value={newReview.rating}
                    onChange={handleNewReviewChange}
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.375rem",
                      border: "1px solid #d1d5db",
                    }}
                    required
                    disabled={!isTravelerMode || !isLoggedIn}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      marginBottom: "0.25rem",
                    }}
                  >
                    Title (optional)
                  </label>
                  <input
                    name="title"
                    value={newReview.title}
                    onChange={handleNewReviewChange}
                    placeholder="Great place for street food"
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.375rem",
                      border: "1px solid #d1d5db",
                    }}
                    disabled={!isTravelerMode || !isLoggedIn}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      marginBottom: "0.25rem",
                    }}
                  >
                    Review text (optional)
                  </label>
                  <textarea
                    name="text"
                    value={newReview.text}
                    onChange={handleNewReviewChange}
                    rows={3}
                    placeholder="Share your experience..."
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.375rem",
                      border: "1px solid #d1d5db",
                    }}
                    disabled={!isTravelerMode || !isLoggedIn}
                  />
                </div>

                <button
                  type="submit"
                  disabled={reviewSaving || !isTravelerMode || !isLoggedIn}
                  style={{
                    alignSelf: "flex-start",
                    padding: "0.5rem 1.1rem",
                    borderRadius: "999px",
                    border: "none",
                    background:
                      !isTravelerMode || !isLoggedIn ? "#93c5fd" : "#3b82f6",
                    color: "white",
                    fontWeight: 600,
                    cursor:
                      !isTravelerMode || !isLoggedIn
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {reviewSaving
                    ? "Saving..."
                    : !isLoggedIn
                    ? "Log in to post review"
                    : !isTravelerMode
                    ? "Switch to traveler mode"
                    : "Post review"}
                </button>
              </form>

              {/* Reviews list */}
              {!reviewsLoading && reviews.length === 0 && !reviewsError ? (
                <p style={{ color: "#6b7280" }}>
                  You have not written any reviews yet.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        padding: "0.75rem 0.9rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #e5e7eb",
                        backgroundColor: "#f9fafb",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <strong>{r.place_name}</strong>{" "}
                          <span
                            style={{
                              fontSize: "0.85rem",
                              color: "#6b7280",
                            }}
                          >
                            {r.place_area}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.9rem" }}>{r.rating}★</div>
                      </div>
                      {r.title && (
                        <p
                          style={{
                            margin: "0.25rem 0",
                            fontWeight: 500,
                          }}
                        >
                          {r.title}
                        </p>
                      )}
                      {r.text && (
                        <p
                          style={{
                            margin: "0.25rem 0",
                            fontSize: "0.9rem",
                            color: "#4b5563",
                          }}
                        >
                          {r.text}
                        </p>
                      )}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.8rem",
                          marginTop: "0.25rem",
                        }}
                      >
                        <span style={{ color: "#9ca3af" }}>
                          {formatDateTime(r.created_at)}
                        </span>
                        <div>
                          <button
                            type="button"
                            onClick={() => startEditReview(r)}
                            disabled={!isTravelerMode || !isLoggedIn}
                            style={{
                              border: "none",
                              background: "none",
                              color:
                                !isTravelerMode || !isLoggedIn
                                  ? "#9ca3af"
                                  : "#2563eb",
                              cursor:
                                !isTravelerMode || !isLoggedIn
                                  ? "not-allowed"
                                  : "pointer",
                              marginRight: "0.5rem",
                              fontSize: "0.85rem",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(r.id)}
                            disabled={!isTravelerMode || !isLoggedIn}
                            style={{
                              border: "none",
                              background: "none",
                              color:
                                !isTravelerMode || !isLoggedIn
                                  ? "#9ca3af"
                                  : "#b91c1c",
                              cursor:
                                !isTravelerMode || !isLoggedIn
                                  ? "not-allowed"
                                  : "pointer",
                              fontSize: "0.85rem",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {editingReviewId === r.id && (
                        <form
                          onSubmit={(e) => handleUpdateReview(e, r.id)}
                          style={{
                            marginTop: "0.5rem",
                            display: "grid",
                            gap: "0.5rem",
                          }}
                        >
                          <div>
                            <label
                              style={{
                                display: "block",
                                fontSize: "0.8rem",
                                fontWeight: 500,
                                marginBottom: "0.15rem",
                              }}
                            >
                              Rating (1–5)
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              value={editingReviewData.rating}
                              onChange={(e) =>
                                setEditingReviewData((prev) => ({
                                  ...prev,
                                  rating: e.target.value,
                                }))
                              }
                              style={{
                                width: "100%",
                                padding: "0.4rem 0.6rem",
                                borderRadius: "0.375rem",
                                border: "1px solid #d1d5db",
                              }}
                              required
                              disabled={!isTravelerMode || !isLoggedIn}
                            />
                          </div>
                          <div>
                            <label
                              style={{
                                display: "block",
                                fontSize: "0.8rem",
                                fontWeight: 500,
                                marginBottom: "0.15rem",
                              }}
                            >
                              Title
                            </label>
                            <input
                              value={editingReviewData.title}
                              onChange={(e) =>
                                setEditingReviewData((prev) => ({
                                  ...prev,
                                  title: e.target.value,
                                }))
                              }
                              style={{
                                width: "100%",
                                padding: "0.4rem 0.6rem",
                                borderRadius: "0.375rem",
                                border: "1px solid #d1d5db",
                              }}
                              disabled={!isTravelerMode || !isLoggedIn}
                            />
                          </div>
                          <div>
                            <label
                              style={{
                                display: "block",
                                fontSize: "0.8rem",
                                fontWeight: 500,
                                marginBottom: "0.15rem",
                              }}
                            >
                              Review text
                            </label>
                            <textarea
                              rows={2}
                              value={editingReviewData.text}
                              onChange={(e) =>
                                setEditingReviewData((prev) => ({
                                  ...prev,
                                  text: e.target.value,
                                }))
                              }
                              style={{
                                width: "100%",
                                padding: "0.4rem 0.6rem",
                                borderRadius: "0.375rem",
                                border: "1px solid #d1d5db",
                              }}
                              disabled={!isTravelerMode || !isLoggedIn}
                            />
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              type="submit"
                              className="primary-btn"
                              style={{
                                padding: "0.4rem 0.9rem",
                                fontSize: "0.85rem",
                              }}
                              disabled={!isTravelerMode || !isLoggedIn}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingReviewId(null)}
                              style={{
                                border: "none",
                                background: "none",
                                color: "#6b7280",
                                cursor: "pointer",
                                fontSize: "0.85rem",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default TravelerDashboard;