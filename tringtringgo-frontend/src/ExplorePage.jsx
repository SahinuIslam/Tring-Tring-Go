import React, { useEffect, useState, useMemo } from "react";
import TopBar from "./TopBar";

function ExplorePage() {
  const [places, setPlaces] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [placesError, setPlacesError] = useState(null);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("");

  useEffect(() => {
    async function loadPlaces() {
      try {
        setLoadingPlaces(true);
        setPlacesError(null);

        const resp = await fetch("http://127.0.0.1:8000/api/travel/places/");
        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          throw new Error(body.detail || "Failed to load places");
        }
        const data = await resp.json();
        setPlaces(data);
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
        const resp = await fetch(
          "http://127.0.0.1:8000/api/travel/saved-places/",
          {
            headers: { "X-User-Token": token },
          }
        );
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

  const filteredAll = useMemo(() => {
    let result = places;
    if (areaFilter) {
      result = result.filter((p) => p.area_name === areaFilter);
    }
    if (!search.trim()) return result;
    const q = search.toLowerCase();
    return result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.area_name && p.area_name.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
    );
  }, [places, search, areaFilter]);

  const toggleSave = async (placeId) => {
    try {
      const token = localStorage.getItem("userToken") || "";
      const isSaved = savedIds.includes(placeId);
      if (!token) {
        console.warn("No user token; cannot save place");
        return;
      }

      if (!isSaved) {
        const resp = await fetch(
          "http://127.0.0.1:8000/api/travel/saved-places/add/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-User-Token": token,
            },
            body: JSON.stringify({ place_id: placeId }),
          }
        );
        if (!resp.ok) {
          console.error("Failed to save place");
          return;
        }
        setSavedIds((prev) =>
          prev.includes(placeId) ? prev : [...prev, placeId]
        );
      } else {
        const listResp = await fetch(
          "http://127.0.0.1:8000/api/travel/saved-places/",
          { headers: { "X-User-Token": token } }
        );
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
          `http://127.0.0.1:8000/api/travel/saved-places/${sp.id}/`,
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

  const topRated = useMemo(
    () =>
      [...places]
        .filter((p) => p.average_rating >= 4.5)
        .sort((a, b) => b.average_rating - a.average_rating)
        .slice(0, 10),
    [places]
  );

  const popular = useMemo(
    () => places.filter((p) => p.is_popular).slice(0, 10),
    [places]
  );

  const renderCard = (p) => {
    const isSaved = savedIds.includes(p.id);
    return (
      <div
        key={p.id}
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
            style={{ width: "100%", height: 140, objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: 140,
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
              margin: "0.15rem 0",
              fontSize: "0.8rem",
              color: "#6b7280",
            }}
          >
            {p.address || "Address not set"}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "0.85rem",
              color: "#4b5563",
            }}
          >
            {p.category} · ⭐ {p.average_rating.toFixed(1)}{" "}
            {p.review_count ? `(${p.review_count} reviews)` : "(no reviews yet)"}
          </p>
          <p
            style={{
              marginTop: "0.25rem",
              fontSize: "0.8rem",
              color: "#6b7280",
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
            borderTop: "1px solid #e5e7eb",
            padding: "0.5rem 0.9rem",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={() => toggleSave(p.id)}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: "999px",
              border: "1px solid #d1d5db",
              backgroundColor: isSaved ? "#f97316" : "#ffffff",
              color: isSaved ? "#ffffff" : "#374151",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            {isSaved ? "Saved" : "Save"}
          </button>
        </div>

        {Array.isArray(p.latest_reviews) && p.latest_reviews.length > 0 && (
          <div
            style={{
              borderTop: "1px solid #e5e7eb",
              padding: "0.6rem 0.9rem",
              background: "#f9fafb",
            }}
          >
            <p
              style={{
                margin: 0,
                marginBottom: "0.25rem",
                fontSize: "0.8rem",
                fontWeight: 500,
                color: "#4b5563",
              }}
            >
              Recent reviews
            </p>
            {p.latest_reviews.map((r) => (
              <div
                key={r.id}
                style={{
                  marginBottom: "0.35rem",
                  fontSize: "0.8rem",
                  color: "#4b5563",
                }}
              >
                <div style={{ fontWeight: 500 }}>
                  {r.traveler_username || "Traveler"} · ⭐ {r.rating}
                </div>
                {r.title && <div style={{ fontWeight: 500 }}>{r.title}</div>}
                {r.text && (
                  <div style={{ color: "#6b7280" }}>
                    {r.text.length > 100
                      ? r.text.slice(0, 100) + "..."
                      : r.text}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loadingPlaces) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <TopBar />
          <h2>Explore</h2>
          <p>Loading recommendations...</p>
        </div>
      </div>
    );
  }

  if (placesError) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <TopBar />
          <h2>Explore</h2>
          <p style={{ color: "#b91c1c" }}>Error: {placesError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page flex justify-center p-4 min-h-screen bg-gray-50">
      <div className="dashboard-card" style={{ maxWidth: 900, width: "100%" }}>
        <TopBar />
        <h2 className="text-2xl font-bold text-gray-800">Explore</h2>

        <div
          style={{
            margin: "1rem 0",
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="Search foods or places..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: "200px",
              padding: "0.6rem 0.9rem",
              borderRadius: "999px",
              border: "1px solid #d1d5db",
            }}
          />

          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            style={{
              minWidth: "160px",
              padding: "0.6rem 0.9rem",
              borderRadius: "999px",
              border: "1px solid #d1d5db",
              fontSize: "0.85rem",
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
        </div>

        <section style={{ marginTop: "1.5rem" }}>
          <h3 className="text-xl font-semibold mb-2">Top rated places</h3>
          {topRated.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No top rated places yet.</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1rem",
              }}
            >
              {topRated.map(renderCard)}
            </div>
          )}
        </section>

        <section style={{ marginTop: "1.5rem" }}>
          <h3 className="text-xl font-semibold mb-2">Popular places</h3>
          {popular.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No popular places marked yet.</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1rem",
              }}
            >
              {popular.map(renderCard)}
            </div>
          )}
        </section>

        <section style={{ marginTop: "1.5rem" }}>
          <h3 className="text-xl font-semibold mb-2">All places</h3>
          {filteredAll.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No places match your search.</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1rem",
              }}
            >
              {filteredAll.map(renderCard)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default ExplorePage;
