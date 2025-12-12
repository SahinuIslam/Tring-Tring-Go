import React, { useEffect, useState } from "react";

function TravelerDashboard() {
  const [loading, setLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [error, setError] = useState("");
  const [savedError, setSavedError] = useState("");
  const [reviewsError, setReviewsError] = useState("");

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [suggestion, setSuggestion] = useState("");
  const [loginHistory, setLoginHistory] = useState([]);

  const [savedPlaces, setSavedPlaces] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editAreaId, setEditAreaId] = useState("");
  const [editYears, setEditYears] = useState("");
  const [areas, setAreas] = useState([]);

  const stored = localStorage.getItem("ttg_user");
  const parsed = stored ? JSON.parse(stored) : null;
  const isLoggedIn = !!parsed;
  const mode = parsed?.mode || parsed?.role || "TRAVELER";
  const token = parsed?.token || parsed?.username || "";

  const isTravelerMode = mode === "TRAVELER";

  useEffect(() => {
    if (!isLoggedIn || !token) {
      setError("Not logged in.");
      setLoading(false);
      setSavedLoading(false);
      setReviewsLoading(false);
      return;
    }

    async function loadAll() {
      try {
        const headers = { "X-User-Token": token };

        const dashResp = await fetch(
          "http://127.0.0.1:8000/api/accounts/dashboard/traveler/",
          { headers }
        );
        if (!dashResp.ok) {
          throw new Error("Failed to load traveler dashboard.");
        }
        const dashData = await dashResp.json();
        setUser(dashData.user);
        setProfile(dashData.profile);
        setSuggestion(dashData.suggestion);
        setLoginHistory(dashData.login_history || []);

        const areaResp = await fetch("http://127.0.0.1:8000/api/travel/areas/");
        if (areaResp.ok) {
          const areaData = await areaResp.json();
          setAreas(areaData);
        }

        const savedResp = await fetch(
          "http://127.0.0.1:8000/api/travel/saved-places/",
          { headers }
        );
        if (!savedResp.ok) {
          throw new Error("Failed to load saved places.");
        }
        const savedData = await savedResp.json();
        setSavedPlaces(savedData || []);
        setSavedError("");
      } catch (err) {
        console.error(err);
        setError(err.message || "Error loading data.");
      } finally {
        setLoading(false);
        setSavedLoading(false);
      }

      try {
        const headers = { "X-User-Token": token };
        const revResp = await fetch(
          "http://127.0.0.1:8000/api/travel/reviews/my/",
          { headers }
        );
        if (!revResp.ok) {
          throw new Error("Failed to load reviews.");
        }
        const revData = await revResp.json();
        setReviews(revData || []);
        setReviewsError("");
      } catch (err) {
        console.error(err);
        setReviewsError(err.message || "Error loading reviews.");
      } finally {
        setReviewsLoading(false);
      }
    }

    loadAll();
  }, [isLoggedIn, token]);

  async function handleProfileSave(e) {
    e.preventDefault();
    if (!token) return;

    try {
      const resp = await fetch(
        "http://127.0.0.1:8000/api/accounts/dashboard/traveler/profile/",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-User-Token": token,
          },
          body: JSON.stringify({
            area_id: editAreaId || null,
            years_in_area: editYears || 0,
          }),
        }
      );
      if (!resp.ok) {
        throw new Error("Failed to update profile.");
      }
      const data = await resp.json();
      setProfile((prev) => ({
        ...prev,
        area: data.area,
        years_in_area: data.years_in_area,
        profile_complete: data.profile_complete,
      }));
      setShowEditProfile(false);
    } catch (err) {
      console.error(err);
      alert(err.message || "Error updating profile.");
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <h2>Traveler Dashboard</h2>
          <p>You are not logged in. Please log in again.</p>
        </div>
      </div>
    );
  }

  if (loading || !user || !profile) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <h2>Traveler Dashboard</h2>
          <p>Loading your data...</p>
          {error && <p style={{ color: "red" }}>Error: {error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <div className="user-welcome">
          <div>
            <strong>Welcome, {user.username}</strong>
            <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              Role: {user.role} | Area: {profile.area} | Years in area:{" "}
              {profile.years_in_area}
            </div>
          </div>
        </div>

        {suggestion && (
          <p style={{ marginBottom: "1rem", color: "#4b5563" }}>
            {suggestion}
          </p>
        )}

        <h3 style={{ marginTop: "0", marginBottom: "0.75rem" }}>
          Profile details
        </h3>
        <div style={{ marginBottom: "0.75rem" }}>
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
        </div>

        <button
          className="btn btn-sm btn-outline-primary"
          onClick={() => {
            const selectedArea = areas.find((a) => a.name === profile.area);
            setEditAreaId(selectedArea ? selectedArea.id : "");
            setEditYears(profile.years_in_area || "");
            setShowEditProfile(true);
          }}
        >
          Edit profile
        </button>

        {showEditProfile && (
          <form
            onSubmit={handleProfileSave}
            style={{
              marginTop: "1rem",
              padding: "1rem",
              borderRadius: "0.5rem",
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
            }}
          >
            <div className="form-row">
              <label>Area</label>
              <select
                value={editAreaId}
                onChange={(e) => setEditAreaId(e.target.value)}
              >
                <option value="">Select area</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row" style={{ marginTop: "0.75rem" }}>
              <label>Years in area</label>
              <input
                type="number"
                min="0"
                value={editYears}
                onChange={(e) => setEditYears(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ marginTop: "0.75rem" }}
            >
              Save
            </button>
          </form>
        )}

        <hr style={{ margin: "1.5rem 0" }} />

        <h3>Saved places</h3>
        {!isTravelerMode && isLoggedIn && (
          <p style={{ color: "#b91c1c", fontSize: "0.9rem" }}>
            Switch to traveler mode to manage saved places.
          </p>
        )}

        {savedLoading ? (
          <p>Loading saved places...</p>
        ) : savedError ? (
          <p style={{ color: "red" }}>{savedError}</p>
        ) : savedPlaces.length === 0 ? (
          <p>You have not saved any places yet.</p>
        ) : (
          <ul>
            {savedPlaces.map((p) => (
              <li key={p.id}>
                <strong>{p.name}</strong> –{" "}
                {p.area_name || "Area not set"} – {p.category} •{" "}
                {p.average_rating.toFixed(1)}
              </li>
            ))}
          </ul>
        )}

        <hr style={{ margin: "1.5rem 0" }} />

        <h3>Your reviews</h3>
        {!isTravelerMode && isLoggedIn && (
          <p style={{ color: "#b91c1c", fontSize: "0.9rem" }}>
            Switch to traveler mode to create or edit reviews.
          </p>
        )}

        {reviewsLoading ? (
          <p>Loading reviews...</p>
        ) : (
          <>
            {reviewsError && (
              <p style={{ color: "red" }}>{reviewsError}</p>
            )}
            {!reviewsLoading &&
            reviews.length === 0 &&
            !reviewsError ? (
              <p>You have not written any reviews yet.</p>
            ) : (
              <ul>
                {reviews.map((r) => (
                  <li key={r.id}>
                    <strong>{r.title}</strong>{" "}
                    {r.text && <span>– {r.text}</span>}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <hr style={{ margin: "1.5rem 0" }} />

        <h3>Recent logins</h3>
        {loginHistory.length === 0 ? (
          <p>No login history yet.</p>
        ) : (
          <ul>
            {loginHistory.map((log, idx) => (
              <li key={idx}>
                [{log.method}] {new Date(log.login_time).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TravelerDashboard;
