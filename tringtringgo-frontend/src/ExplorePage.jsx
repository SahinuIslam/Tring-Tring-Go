import React, { useEffect, useState, useMemo } from "react";

function ExplorePage() {
  const [places, setPlaces] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [placesError, setPlacesError] = useState(null);

  const [userRole, setUserRole] = useState('TRAVELER');
  const [userMode, setUserMode] = useState('TRAVELER');


  // filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL"); // NEW: place type

  /* ---------- load data ---------- */

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

  
  useEffect(() => {
    const storedUser = localStorage.getItem("ttg_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserRole(parsedUser.role || 'TRAVELER');
        setUserMode(parsedUser.mode || parsedUser.role || 'TRAVELER');
      } catch (e) {}
    }
  }, []);
  

  /* ---------- filtering: area -> type -> search ---------- */

  const filteredBase = useMemo(() => {
    let result = places;

    // area
    if (areaFilter) {
      result = result.filter((p) => p.area_name === areaFilter);
    }

    // place type / category
    if (typeFilter && typeFilter !== "ALL") {
      result = result.filter((p) => p.category === typeFilter);
    }

    // text search
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
        .filter((p) => p.average_rating >= 4.5)
        .sort((a, b) => b.average_rating - a.average_rating)
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
    if (userRole === 'MERCHANT' && userMode !== 'TRAVELER') {
      alert("Switch to traveler mode to save places");
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

  /* ---------- card ---------- */

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
      </div>
    );
  };

  /* ---------- loading / error ---------- */

  if (loadingPlaces) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
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
          <h2>Explore</h2>
          <p style={{ color: "#b91c1c" }}>Error: {placesError}</p>
        </div>
      </div>
    );
  }

  /* ---------- main render ---------- */

  
  return (
    <div className="dashboard-page flex justify-center p-4 min-h-screen bg-gray-50">
      <div className="dashboard-card" style={{ maxWidth: 900, width: "100%" }}>
        <h2 className="text-2xl font-bold text-gray-800">Explore</h2>

        <h2 className="text-2xl font-bold text-gray-800">Explore</h2>

{/* ADD THIS WARNING - EXACTLY like Community */}
{userRole === 'MERCHANT' && userMode !== 'TRAVELER' && (
  <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "1rem" }}>
    Switch to traveler mode to save places.
  </p>
)}

        {/* filters row */}
        <div
          style={{
            margin: "1rem 0",
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          {/* search input */}
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
            }}
          />

          {/* Search button */}
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

          {/* Area filter */}
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

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              minWidth: "160px",
              padding: "0.6rem 0.9rem",
              borderRadius: "999px",
              border: "1px solid #d1d5db",
              fontSize: "0.85rem",
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
            {/* add more matching your backend */}
          </select>
        </div>

        {/* dynamic sections */}
        {hasSearch ? (
          <section style={{ marginTop: "1.5rem" }}>
            <h3 className="text-xl font-semibold mb-2">Search results</h3>
            {allPlaces.length === 0 ? (
              <p style={{ color: "#6b7280" }}>No places match your search.</p>
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
              <h3 className="text-xl font-semibold mb-2">Top rated places</h3>
              {topRated.length === 0 ? (
                <p style={{ color: "#6b7280" }}>No top rated places yet.</p>
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
              <h3 className="text-xl font-semibold mb-2">Popular places</h3>
              {popular.length === 0 ? (
                <p style={{ color: "#6b7280" }}>No popular places marked yet.</p>
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
              <h3 className="text-xl font-semibold mb-2">All places</h3>
              {allPlaces.length === 0 ? (
                <p style={{ color: "#6b7280" }}>No places available.</p>
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
  );
}

export default ExplorePage;
