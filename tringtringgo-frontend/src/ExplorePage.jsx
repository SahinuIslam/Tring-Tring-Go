// src/pages/ExplorePage.jsx
import React, { useEffect, useState, useMemo } from "react";

const API_BASE = "http://127.0.0.1:8000";

function getInitialTheme() {
  const stored = localStorage.getItem("ttg_theme");
  return stored === "dark" || stored === "light" ? stored : "light";
}

function getAuthUser() {
  const stored = localStorage.getItem("ttg_user");
  const parsed = stored ? JSON.parse(stored) : null;
  return parsed;
}

function ExplorePage() {
  const [places, setPlaces] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [placesError, setPlacesError] = useState(null);

  const [userRole, setUserRole] = useState("TRAVELER");
  const [userMode, setUserMode] = useState("TRAVELER");

  // filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // global theme
  const [theme, setTheme] = useState(getInitialTheme);
  const isDark = theme === "dark";

  // reviews modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewPlace, setReviewPlace] = useState(null);
  const [reviewList, setReviewList] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    text: "",
  });
  const [reviewSaving, setReviewSaving] = useState(false);

  /* ---------- load data ---------- */

  useEffect(() => {
    async function loadPlaces() {
      try {
        setLoadingPlaces(true);
        setPlacesError(null);

        const resp = await fetch(`${API_BASE}/api/travel/places/`);
        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          throw new Error(body.detail || "Failed to load places");
        }
        const data = await resp.json();

        const normalized = data.map((p) => ({
          ...p,
          image:
            typeof p.image === "string" && p.image.length > 0
              ? p.image.startsWith("http")
                ? p.image
                : `${API_BASE}${p.image}`
              : null,
        }));

        setPlaces(normalized);
      } catch (e) {
        console.error(e);
        setPlacesError(e.message);
      } finally {
        setLoadingPlaces(false);
      }
    }
    loadPlaces();
  }, []);

  useEffect(() => {
    async function loadSaved() {
      try {
        const token = localStorage.getItem("userToken") || "";
        const resp = await fetch(`${API_BASE}/api/travel/saved-places/`, {
          headers: { "X-User-Token": token },
        });
        if (!resp.ok) return;

        const data = await resp.json();
        const ids = data
          .map((item) => item.place?.id)
          .filter((id) => typeof id === "number");
        setSavedIds(ids);
      } catch (e) {
        console.error(e);
      }
    }
    loadSaved();
  }, []);

  // Load user role from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("ttg_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserRole(parsedUser.role || "TRAVELER");
        setUserMode(parsedUser.mode || parsedUser.role || "TRAVELER");
      } catch (e) {}
    }
  }, []);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem("ttg_theme", theme);
  }, [theme]);

  /* ---------- filtering: area -> type -> search ---------- */
  const filteredBase = useMemo(() => {
    let result = places;

    if (areaFilter) {
      result = result.filter((p) => p.area_name === areaFilter);
    }

    if (typeFilter && typeFilter !== "ALL") {
      result = result.filter((p) => p.category === typeFilter);
    }

    if (!search.trim()) return result;

    const q = search.trim().toLowerCase();
    return result.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const area = (p.area_name || "").toLowerCase();
      return name.includes(q) || area.includes(q);
    });
  }, [places, areaFilter, typeFilter, search]);

  const hasSearch = search.trim().length > 0;

  const topRated = useMemo(
    () =>
      [...filteredBase]
        .filter((p) => (p.average_rating || 0) >= 4.5)
        .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
        .slice(0, 10),
    [filteredBase]
  );

  const popular = useMemo(
    () => filteredBase.filter((p) => p.is_popular).slice(0, 10),
    [filteredBase]
  );

  const allPlaces = filteredBase;

  /* ---------- save / unsave ---------- */
  const toggleSave = async (placeId) => {
    if (
      (userRole === "MERCHANT" || userRole === "ADMIN") &&
      userMode !== "TRAVELER"
    ) {
      if (userRole === "ADMIN") {
        alert("Admins cannot save places (traveler role required)");
      } else {
        alert(
          "Switch to traveler mode from your merchant dashboard to save places."
        );
      }
      return;
    }

    try {
      const token = localStorage.getItem("userToken") || "";
      const isSaved = savedIds.includes(placeId);
      if (!token) {
        console.warn("No user token; cannot save place");
        return;
      }

      if (!isSaved) {
        const resp = await fetch(`${API_BASE}/api/travel/saved-places/add/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Token": token,
          },
          body: JSON.stringify({ place_id: placeId }),
        });
        if (!resp.ok) {
          console.error("Failed to save place");
          return;
        }
        setSavedIds((prev) =>
          prev.includes(placeId) ? prev : [...prev, placeId]
        );
      } else {
        const listResp = await fetch(`${API_BASE}/api/travel/saved-places/`, {
          headers: { "X-User-Token": token },
        });
        if (!listResp.ok) {
          console.error("Failed to load saved places for unsave");
          return;
        }
        const listData = await listResp.json();
        const sp = listData.find(
          (item) => item.place && item.place.id === placeId
        );
        if (!sp) {
          console.error("Saved place record not found");
          return;
        }
        const delResp = await fetch(
          `${API_BASE}/api/travel/saved-places/${sp.id}/`,
          {
            method: "DELETE",
            headers: { "X-User-Token": token },
          }
        );
        if (!delResp.ok && delResp.status !== 204) {
          console.error("Failed to remove saved place");
          return;
        }
        setSavedIds((prev) => prev.filter((id) => id !== placeId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  /* ---------- reviews modal logic ---------- */
  const openReviews = async (place) => {
    setReviewPlace(place);
    setReviewList([]);
    setReviewForm({ rating: 5, title: "", text: "" });
    setReviewError("");
    setReviewLoading(true);
    setReviewModalOpen(true);

    try {
      const resp = await fetch(
        `${API_BASE}/api/travel/places/${place.id}/reviews/`
      );
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.detail || "Failed to load reviews");
      }
      const data = await resp.json();
      setReviewList(data);
    } catch (e) {
      console.error(e);
      setReviewError(e.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const closeReviews = () => {
    setReviewModalOpen(false);
    setReviewPlace(null);
  };

  const handleReviewFormChange = (e) => {
    const { name, value } = e.target;
    setReviewForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewPlace) return;
    try {
      const token = localStorage.getItem("userToken") || "";
      if (!token) {
        setReviewError("You must log in to write a review.");
        return;
      }

      setReviewSaving(true);
      setReviewError("");

      const resp = await fetch(`${API_BASE}/api/travel/reviews/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Token": token,
        },
        body: JSON.stringify({
          place: reviewPlace.id,
          rating: parseInt(reviewForm.rating, 10),
          title: reviewForm.title,
          text: reviewForm.text,
        }),
      });

      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(body.detail || "Could not create review");
      }

      setReviewList((prev) => [body, ...prev]);
      setReviewForm({ rating: 5, title: "", text: "" });
    } catch (e) {
      console.error(e);
      setReviewError(e.message);
    } finally {
      setReviewSaving(false);
    }
  };

  /* ---------- card component ---------- */
  const renderCard = (p) => {
    const isSaved = savedIds.includes(p.id);
    return (
      <div
        key={p.id}
        className="h-100"
        style={{
          borderRadius: "0.75rem",
          overflow: "hidden",
          boxShadow: "0 6px 16px rgba(15,23,42,0.08)",
          background: isDark ? "#0f172a" : "#ffffff",
          color: isDark ? "#e5e7eb" : "#111827",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {p.image ? (
          <img
            src={p.image}
            alt={p.name}
            style={{ width: "100%", height: 140, objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: 140,
              background: isDark ? "#1f2937" : "#e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isDark ? "#9ca3af" : "#6b7280",
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
              color: isDark ? "#9ca3af" : "#6b7280",
            }}
          >
            {p.area_name || "Area not set"}
          </p>
          <p
            style={{
              margin: "0.15rem 0",
              fontSize: "0.8rem",
              color: isDark ? "#9ca3af" : "#6b7280",
            }}
          >
            {p.address || "Address not set"}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "0.85rem",
              color: isDark ? "#e5e7eb" : "#4b5563",
            }}
          >
            {p.category} · ⭐ {(p.average_rating || 0).toFixed(1)}{" "}
            {p.review_count
              ? `(${p.review_count} reviews)`
              : "(no reviews yet)"}
          </p>
          <p
            style={{
              marginTop: "0.25rem",
              fontSize: "0.8rem",
              color: isDark ? "#9ca3af" : "#6b7280",
            }}
          >
            {p.opening_time && p.closing_time
              ? `Open: ${p.opening_time.slice(0, 5)} - ${p.closing_time.slice(
                  0,
                  5
                )}`
              : "Opening hours not set"}
          </p>
        </div>

        <div
          style={{
            borderTop: isDark ? "1px solid #1f2937" : "1px solid #e5e7eb",
            padding: "0.5rem 0.9rem",
            display: "flex",
            justifyContent: "space-between",
            gap: "0.5rem",
          }}
        >
          <button
            onClick={() => toggleSave(p.id)}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: "999px",
              border: "1px solid #d1d5db",
              backgroundColor: isSaved
                ? "#f97316"
                : isDark
                ? "#111827"
                : "#ffffff",
              color: isSaved ? "#ffffff" : isDark ? "#e5e7eb" : "#374151",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            {isSaved ? "Saved" : "Save"}
          </button>
          <button
            onClick={() => openReviews(p)}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: "999px",
              border: "1px solid #3b82f6",
              backgroundColor: "#3b82f6",
              color: "#ffffff",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            Reviews
          </button>
        </div>
      </div>
    );
  };

  const outerBgClass = isDark ? "bg-black bg-gradient" : "bg-body-tertiary";
  const cardBgClass = isDark ? "bg-dark text-light" : "bg-white text-dark";

  if (loadingPlaces) {
    return (
      <div className={outerBgClass + " min-vh-100 d-flex align-items-center"}>
        <div className="container">
          <div className={`card shadow-lg border-0 rounded-4 ${cardBgClass}`}>
            <div className="card-body p-4">
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" />
                <h2 className="h4 mb-1">Explore</h2>
                <p
                  className={
                    "mb-0 small " +
                    (isDark ? "text-secondary" : "text-muted")
                  }
                >
                  Loading recommendations...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (placesError) {
    return (
      <div className={outerBgClass + " min-vh-100 d-flex align-items-center"}>
        <div className="container">
          <div className={`card shadow-lg border-0 rounded-4 ${cardBgClass}`}>
            <div className="card-body p-4">
              <h2 className="h4 mb-3">Explore</h2>
              <p style={{ color: "#b91c1c" }}>Error: {placesError}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={outerBgClass + " min-vh-100 py-4"}>
        <div className="container">
          <div
            className={
              "card shadow-lg border-0 rounded-4 overflow-hidden " + cardBgClass
            }
          >
            <div
              className={
                "px-4 pt-4 pb-3 bg-gradient " +
                (isDark ? "bg-primary text-light" : "bg-primary text-white")
              }
            >
              <div className="d-flex flex-wrap align-items-center justify-content-between">
                <div>
                  <h1
                    className={
                      "h3 mb-1 " + (isDark ? "text-light" : "text-white")
                    }
                  >
                    Explore places
                  </h1>
                  <p
                    className={
                      "mb-0 small " +
                      (isDark ? "text-light opacity-75" : "text-white-50")
                    }
                  >
                    Discover top rated, popular, and nearby places to visit.
                  </p>
                </div>
              </div>
            </div>

            <div className="card-body p-4">
              {(userRole === "MERCHANT" || userRole === "ADMIN") &&
                userMode !== "TRAVELER" && (
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#6b7280",
                      marginBottom: "1rem",
                    }}
                  >
                    {userRole === "ADMIN"
                      ? "Admins cannot save places (traveler role required)"
                      : "Switch to traveler mode to save places"}
                  </p>
                )}

              {/* filters row */}
              <div
                style={{
                  margin: "0 0 1rem",
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                <input
                  type="text"
                  placeholder="Search by place name or area..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setSearch(searchInput.trim());
                  }}
                  style={{
                       flex: 1,
                       minWidth: "200px",
                       padding: "0.6rem 0.9rem",
                      borderRadius: "999px",
                      border: "1px solid #d1d5db",
                      backgroundColor: isDark ? "#111827" : "#ffffff",
                      color: isDark ? "#e5e7eb" : "#111827",}}
                />

                <button
                  type="button"
                  onClick={() => setSearch(searchInput.trim())}
                  style={{
                    padding: "0.6rem 1.2rem",
                    borderRadius: "999px",
                    border: "1px solid #111827",
                    backgroundColor: "#111827",
                    color: "white",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Search
                </button>

                <select
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  style={{
                    minWidth: "160px",
                    padding: "0.6rem 0.9rem",
                    borderRadius: "999px",
                    border: "1px solid #d1d5db",
                    fontSize: "0.85rem",
                    backgroundColor: isDark ? "#111827" : "#ffffff",
                    color: isDark ? "#e5e7eb" : "#111827",
                  }}
                >
                  <option value="">All areas</option>
                  {Array.from(
                    new Set(places.map((p) => p.area_name).filter(Boolean))
                  ).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  style={{
                    minWidth: "160px",
                    padding: "0.6rem 0.9rem",
                    borderRadius: "999px",
                    border: "1px solid #d1d5db",
                    fontSize: "0.85rem",
                    backgroundColor: isDark ? "#111827" : "#ffffff",
                    color: isDark ? "#e5e7eb" : "#111827",
                  }}
                >
                  <option value="ALL">All types</option>
                  <option value="PARK">Park</option>
                  <option value="MUSEUM">Museum</option>
                  <option value="RESTAURANT">Restaurant</option>
                  <option value="CAFE">Cafe</option>
                  <option value="STREET_FOOD">Street Food</option>
                  <option value="FAST_FOOD">Fast Food</option>
                  <option value="BAKERY">Bakery</option>
                  <option value="MALL">Mall</option>
                  <option value="SHOP">Shop</option>
                  <option value="LOCAL_MARKET">Local Market</option>
                  <option value="SUPERMARKET">Supermarket</option>
                  <option value="HISTORICAL_SITE">Historical Site</option>
                  <option value="LANDMARK">Landmark</option>
                  <option value="LAKE">Lake</option>
                  <option value="BEACH">Beach</option>
                  <option value="ZOO">Zoo</option>
                  <option value="CINEMA">Cinema</option>
                  <option value="AMUSEMENT_PARK">Amusement Park</option>
                  <option value="SPORTS_COMPLEX">Sports Complex</option>
                  <option value="HOTEL">Hotel</option>
                  <option value="GUEST_HOUSE">Guest House</option>
                  <option value="TRANSPORT">Transport Hub</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {hasSearch ? (
                <section style={{ marginTop: "1.5rem" }}>
                  <h3 className="h5 mb-3 fw-semibold">Search results</h3>
                  {allPlaces.length === 0 ? (
                    <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>
                      No places match your search.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "1rem",
                      }}
                    >
                      {allPlaces.map(renderCard)}
                    </div>
                  )}
                </section>
              ) : (
                <>
                  <section style={{ marginTop: "1.5rem" }}>
                    <h3 className="h5 mb-3 fw-semibold">Top rated places</h3>
                    {topRated.length === 0 ? (
                      <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>
                        No top rated places yet.
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(220px, 1fr))",
                          gap: "1rem",
                        }}
                      >
                        {topRated.map(renderCard)}
                      </div>
                    )}
                  </section>

                  <section style={{ marginTop: "1.5rem" }}>
                    <h3 className="h5 mb-3 fw-semibold">Popular places</h3>
                    {popular.length === 0 ? (
                      <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>
                        No popular places marked yet.
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(220px, 1fr))",
                          gap: "1rem",
                        }}
                      >
                        {popular.map(renderCard)}
                      </div>
                    )}
                  </section>

                  <section style={{ marginTop: "1.5rem" }}>
                    <h3 className="h5 mb-3 fw-semibold">All places</h3>
                    {allPlaces.length === 0 ? (
                      <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>
                        No places available.
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(220px, 1fr))",
                          gap: "1rem",
                        }}
                      >
                        {allPlaces.map(renderCard)}
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews modal */}
      {reviewModalOpen && reviewPlace && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1050,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 600,
              maxHeight: "80vh",
              overflow: "hidden",
              borderRadius: "0.75rem",
              backgroundColor: isDark ? "#020617" : "#ffffff",
              color: isDark ? "#e5e7eb" : "#111827",
              boxShadow: "0 25px 50px -12px rgba(15,23,42,0.75)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "0.75rem 1rem",
                borderBottom: `1px solid ${
                  isDark ? "#1f2937" : "#e5e7eb"
                }`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>
                  Reviews for {reviewPlace.name}
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: isDark ? "#9ca3af" : "#6b7280",
                  }}
                >
                  {reviewPlace.area_name || "Area not set"}
                </div>
              </div>
              <button
                type="button"
                onClick={closeReviews}
                style={{
                  border: "none",
                  background: "transparent",
                  color: isDark ? "#9ca3af" : "#6b7280",
                  fontSize: "1.1rem",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                padding: "0.75rem 1rem",
                overflowY: "auto",
                flex: 1,
              }}
            >
              {reviewError && (
                <p style={{ color: "#fca5a5", fontSize: "0.85rem" }}>
                  {reviewError}
                </p>
              )}
              {reviewLoading ? (
                <p style={{ fontSize: "0.9rem" }}>Loading reviews...</p>
              ) : reviewList.length === 0 ? (
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: isDark ? "#9ca3af" : "#6b7280",
                  }}
                >
                  No reviews yet. Be the first to review this place.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  {reviewList.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        borderRadius: "0.5rem",
                        border: `1px solid ${
                          isDark ? "#1f2937" : "#e5e7eb"
                        }`,
                        padding: "0.4rem 0.6rem",
                        backgroundColor: isDark ? "#020617" : "#f9fafb",
                        fontSize: "0.8rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "0.1rem",
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>
                          {r.author_username || "Traveler"}
                        </span>
                        <span style={{ color: "#facc15" }}>
                          {r.rating}★
                        </span>
                      </div>
                      {r.title && (
                        <div
                          style={{
                            fontWeight: 600,
                            marginBottom: "0.1rem",
                          }}
                        >
                          {r.title}
                        </div>
                      )}
                      {r.text && <div>{r.text}</div>}
                      {r.created_at && (
                        <div
                          style={{
                            marginTop: "0.1rem",
                            fontSize: "0.7rem",
                            color: isDark ? "#6b7280" : "#9ca3af",
                          }}
                        >
                          {new Date(r.created_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* review form */}
              <form onSubmit={submitReview}>
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    marginBottom: "0.35rem",
                  }}
                >
                  Add your review
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginBottom: "0.4rem",
                  }}
                >
                  <div style={{ flex: "0 0 80px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        marginBottom: "0.1rem",
                      }}
                    >
                      Rating
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      name="rating"
                      value={reviewForm.rating}
                      onChange={handleReviewFormChange}
                      style={{
                        width: "100%",
                        padding: "0.25rem 0.35rem",
                        fontSize: "0.8rem",
                        borderRadius: "0.4rem",
                        border: `1px solid ${
                          isDark ? "#374151" : "#d1d5db"
                        }`,
                        backgroundColor: isDark ? "#020617" : "#ffffff",
                        color: isDark ? "#e5e7eb" : "#111827",
                      }}
                      required
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        marginBottom: "0.1rem",
                      }}
                    >
                      Title (optional)
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={reviewForm.title}
                      onChange={handleReviewFormChange}
                      placeholder="Great spot for family"
                      style={{
                        width: "100%",
                        padding: "0.25rem 0.35rem",
                        fontSize: "0.8rem",
                        borderRadius: "0.4rem",
                        border: `1px solid ${
                          isDark ? "#374151" : "#d1d5db"
                        }`,
                        backgroundColor: isDark ? "#020617" : "#ffffff",
                        color: isDark ? "#e5e7eb" : "#111827",
                      }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: "0.5rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      marginBottom: "0.1rem",
                    }}
                  >
                    Review text (optional)
                  </label>
                  <textarea
                    name="text"
                    rows={3}
                    value={reviewForm.text}
                    onChange={handleReviewFormChange}
                    placeholder="Share your experience..."
                    style={{
                      width: "100%",
                      padding: "0.25rem 0.35rem",
                      fontSize: "0.8rem",
                      borderRadius: "0.4rem",
                      border: `1px solid ${
                        isDark ? "#374151" : "#d1d5db"
                      }`,
                      backgroundColor: isDark ? "#020617" : "#ffffff",
                      color: isDark ? "#e5e7eb" : "#111827",
                      resize: "vertical",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "0.5rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={closeReviews}
                    style={{
                      padding: "0.35rem 0.8rem",
                      borderRadius: "999px",
                      border: `1px solid ${
                        isDark ? "#4b5563" : "#d1d5db"
                      }`,
                      backgroundColor: "transparent",
                      color: isDark ? "#e5e7eb" : "#374151",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={reviewSaving}
                    style={{
                      padding: "0.35rem 0.8rem",
                      borderRadius: "999px",
                      border: "none",
                      backgroundColor: reviewSaving ? "#93c5fd" : "#3b82f6",
                      color: "#ffffff",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: reviewSaving ? "not-allowed" : "pointer",
                    }}
                  >
                    {reviewSaving ? "Saving..." : "Submit review"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ExplorePage;
