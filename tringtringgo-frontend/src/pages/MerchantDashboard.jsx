import React, { useEffect, useState } from "react";

function TopBar() {
  async function handleLogout() {
    try {
      await fetch("http://127.0.0.1:8000/api/accounts/logout/", {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.error("Logout API error (ignored):", e);
    }
    localStorage.removeItem("ttg_user");
    window.location.href = "/login";
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "1rem",
        borderBottom: "1px solid #e5e7eb",
        paddingBottom: "1rem",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#1f2937" }}>
        TringTringGo
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1.25rem",
          fontSize: "0.95rem",
        }}
      >
        <nav style={{ display: "flex", gap: "1.25rem" }}>
          <a href="/" style={{ textDecoration: "none", color: "#4b5563" }}>
            Home
          </a>
          <a
            href="/explore"
            style={{ textDecoration: "none", color: "#4b5563" }}
          >
            Explore
          </a>
          <a
            href="/community"
            style={{ textDecoration: "none", color: "#4b5563" }}
          >
            Community
          </a>
          <a
            href="/services"
            style={{ textDecoration: "none", color: "#4b5563" }}
          >
            Services
          </a>
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            border: "none",
            borderRadius: "999px",
            padding: "0.4rem 0.9rem",
            background: "#ef4444",
            color: "white",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}

function MerchantDashboard() {
  const [data, setData] = useState(null);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [areasLoading, setAreasLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [editForm, setEditForm] = useState({
    shop_name: "",
    business_area_id: "",
    opening_time: "",
    closing_time: "",
    years_in_business: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");
        setMessage("");

        const stored = localStorage.getItem("ttg_user");
        const parsed = stored ? JSON.parse(stored) : null;
        const token = parsed?.token || parsed?.username || "";

        if (!token) {
          throw new Error("Not logged in.");
        }

        // Merchant dashboard
        const resp = await fetch(
          "http://127.0.0.1:8000/api/accounts/dashboard/merchant/",
          {
            method: "GET",
            headers: {
              "X-User-Token": token,
            },
          }
        );

        const body = await resp.json().catch(() => ({}));

        if (!resp.ok) {
          throw new Error(body.detail || "Failed to load merchant dashboard");
        }

        setData(body);
        setEditForm({
          shop_name: body.profile.shop_name || "",
          business_area_id:
            body.profile.business_area_id != null
              ? String(body.profile.business_area_id)
              : "",
          opening_time: body.profile.opening_time || "",
          closing_time: body.profile.closing_time || "",
          years_in_business:
            body.profile.years_in_business != null
              ? String(body.profile.years_in_business)
              : "",
          description: body.profile.description || "",
        });

        // Load areas for dropdown
        setAreasLoading(true);
        const areasResp = await fetch(
          "http://127.0.0.1:8000/api/travel/areas/"
        );
        if (areasResp.ok) {
          const areasData = await areasResp.json();
          setAreas(areasData);
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
        setAreasLoading(false);
      }
    }

    loadData();
  }, []);

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const stored = localStorage.getItem("ttg_user");
      const parsed = stored ? JSON.parse(stored) : null;
      const token = parsed?.token || parsed?.username || "";

      if (!token) {
        throw new Error("Not logged in.");
      }

      const resp = await fetch(
        "http://127.0.0.1:8000/api/accounts/dashboard/merchant/profile/",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-User-Token": token,
          },
          body: JSON.stringify({
            shop_name: editForm.shop_name,
            business_area_id: editForm.business_area_id
              ? parseInt(editForm.business_area_id, 10)
              : null,
            opening_time: editForm.opening_time || null,
            closing_time: editForm.closing_time || null,
            years_in_business: parseInt(editForm.years_in_business, 10) || 0,
            description: editForm.description,
          }),
        }
      );

      const body = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        throw new Error(body.detail || "Failed to update merchant profile");
      }

      // Update local data
      setData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          shop_name: body.shop_name,
          business_area: body.business_area,
          business_area_id: body.business_area_id,
          opening_time: body.opening_time,
          closing_time: body.closing_time,
          years_in_business: body.years_in_business,
          description: body.description,
          is_verified: body.is_verified,
          status: body.status,
        },
      }));
      setMessage("Business profile updated successfully.");
      setShowEdit(false);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <TopBar />
          <h2>Merchant Dashboard</h2>
          <p>Loading your data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <TopBar />
          <h2>Merchant Dashboard</h2>
          <p style={{ color: "#b91c1c" }}>{error || "No data"}</p>
        </div>
      </div>
    );
  }

  const { profile, role, message: apiMessage } = data;

  return (
    <div className="dashboard-page flex justify-center p-4 min-h-screen bg-gray-50">
      <style>{`
        .dashboard-card {
          width: 100%;
          max-width: 900px;
          background: white;
          padding: 2rem;
          border-radius: 0.75rem;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
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
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.5rem;
          background-color: #3b82f6;
          color: white;
          font-weight: 600;
          cursor: pointer;
        }
        .primary-btn:disabled {
          background-color: #93c5fd;
          cursor: not-allowed;
        }
        .form-label {
          display: block;
          font-size: 0.85rem;
          margin-bottom: 4px;
        }
        .form-input, .form-select, .form-textarea {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.375rem;
          border: 1px solid #d1d5db;
        }
      `}</style>

      <div className="dashboard-card">
        <TopBar />

        <h2 className="text-2xl font-bold text-gray-800">Merchant Dashboard</h2>
        <p style={{ marginBottom: "1rem", color: "#4b5563" }}>{apiMessage}</p>

        {message && (
          <div
            style={{
              padding: "0.5rem 0.75rem",
              marginBottom: "0.75rem",
              background: "#d1fae5",
              color: "#065f46",
              borderRadius: "0.375rem",
              fontSize: "0.9rem",
            }}
          >
            {message}
          </div>
        )}
        {error && (
          <div
            style={{
              padding: "0.5rem 0.75rem",
              marginBottom: "0.75rem",
              background: "#fee2e2",
              color: "#b91c1c",
              borderRadius: "0.375rem",
              fontSize: "0.9rem",
            }}
          >
            {error}
          </div>
        )}

        {/* Summary cards */}
        <div className="stats-row">
          <div className="stat-card">
            <h3>Shop name</h3>
            <p>{profile.shop_name}</p>
          </div>
          <div className="stat-card">
            <h3>Business area</h3>
            <p>{profile.business_area}</p>
          </div>
          <div className="stat-card">
            <h3>Status</h3>
            <p>{profile.status}</p>
          </div>
          <div className="stat-card">
            <h3>Years in business</h3>
            <p>{profile.years_in_business}</p>
          </div>
        </div>

        {/* Profile details */}
        <section style={{ marginTop: "1.5rem" }}>
          <h3 className="text-xl font-semibold mb-2">Profile details</h3>
          <p>
            <strong>Role:</strong> {role}
          </p>
          <p>
            <strong>Shop name:</strong> {profile.shop_name}
          </p>
          <p>
            <strong>Business area:</strong> {profile.business_area}
          </p>
          <p>
            <strong>Opening time:</strong>{" "}
            {formatTimeToAMPM(profile.opening_time)}
          </p>
          <p>
            <strong>Closing time:</strong>{" "}
            {formatTimeToAMPM(profile.closing_time)}
          </p>
          <p>
            <strong>Years in business:</strong> {profile.years_in_business}
          </p>
          <p>
            <strong>Verified:</strong> {profile.is_verified ? "Yes" : "No"}
          </p>
          {profile.description && (
            <p>
              <strong>Description:</strong> {profile.description}
            </p>
          )}
        </section>

        {/* Edit business profile */}
        <section style={{ marginTop: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <h3 className="text-xl font-semibold">Edit business profile</h3>
            <button
              type="button"
              className="primary-btn"
              style={{ padding: "0.35rem 0.9rem", fontSize: "0.85rem" }}
              onClick={() => setShowEdit((prev) => !prev)}
            >
              {showEdit ? "Hide form" : "Edit profile"}
            </button>
          </div>

          {showEdit && (
            <form
              onSubmit={handleSaveProfile}
              style={{ maxWidth: "450px", display: "grid", gap: "0.75rem" }}
            >
              <div>
                <label className="form-label">Shop name</label>
                <input
                  className="form-input"
                  name="shop_name"
                  value={editForm.shop_name}
                  onChange={handleEditChange}
                />
              </div>

              <div>
                <label className="form-label">Business area</label>
                {areasLoading ? (
                  <p style={{ fontSize: "0.85rem" }}>Loading areas...</p>
                ) : (
                  <select
                    className="form-select"
                    name="business_area_id"
                    value={editForm.business_area_id}
                    onChange={handleEditChange}
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

              <div>
                <label className="form-label">Opening time</label>
                <input
                  className="form-input"
                  type="time"
                  name="opening_time"
                  value={editForm.opening_time}
                  onChange={handleEditChange}
                />
              </div>

              <div>
                <label className="form-label">Closing time</label>
                <input
                  className="form-input"
                  type="time"
                  name="closing_time"
                  value={editForm.closing_time}
                  onChange={handleEditChange}
                />
              </div>

              <div>
                <label className="form-label">Years in business</label>
                <input
                  className="form-input"
                  name="years_in_business"
                  type="number"
                  min="0"
                  value={editForm.years_in_business}
                  onChange={handleEditChange}
                />
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  name="description"
                  rows={3}
                  value={editForm.description}
                  onChange={handleEditChange}
                  placeholder="Tell travelers what makes your place special"
                />
              </div>

              <button
                type="submit"
                className="primary-btn"
                disabled={saving}
                style={{ alignSelf: "flex-start" }}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

function formatTimeToAMPM(timeStr) {
  if (!timeStr) return "Not set";
  const [h, m] = timeStr.split(":").map(Number);
  const hour12 = ((h + 11) % 12) + 1;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
}
export default MerchantDashboard;
