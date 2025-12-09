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

  const path = window.location.pathname;

  const stored = localStorage.getItem("ttg_user");
  const parsed = stored ? JSON.parse(stored) : null;
  const mode = parsed?.mode || parsed?.role || "TRAVELER";

  const dashboardHref =
    mode === "MERCHANT"
      ? "/merchant"
      : mode === "ADMIN"
      ? "/admin"
      : "/traveler";

  const isActive = (name) => {
    if (name === "home") return path === "/" || path === "/home";
    if (name === "explore") return path.startsWith("/explore");
    if (name === "community") return path.startsWith("/community");
    if (name === "services") return path.startsWith("/services");
    if (name === "dashboard")
      return (
        path.startsWith("/traveler") ||
        path.startsWith("/merchant") ||
        path.startsWith("/admin") ||
        path.startsWith("/dashboard")
      );
    return false;
  };

  const linkStyle = (name) => ({
    textDecoration: "none",
    fontSize: "0.95rem",
    color: isActive(name) ? "#1f2937" : "#4b5563",
    fontWeight: isActive(name) ? 700 : 500,
    borderBottom: isActive(name)
      ? "2px solid #1f2937"
      : "2px solid transparent",
    paddingBottom: "0.1rem",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "1rem",
        borderBottom: "1px solid #e5e7eb",
        paddingBottom: "1rem",
        paddingTop: "0.5rem",
        paddingInline: "1rem",
        flexWrap: "wrap",
        gap: "0.75rem",
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
          flexWrap: "wrap",
        }}
      >
        <nav style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
          <a href="/home" style={linkStyle("home")}>
            Home
          </a>
          <a href="/explore" style={linkStyle("explore")}>
            Explore
          </a>
          <a href="/community" style={linkStyle("community")}>
            Community
          </a>
          <a href="/services" style={linkStyle("services")}>
            Services
          </a>
          <a href={dashboardHref} style={linkStyle("dashboard")}>
            Dashboard
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

function formatTimeToAMPM(timeStr) {
  if (!timeStr) return "Not set";
  const [h, m] = timeStr.split(":").map(Number);
  const hour12 = ((h + 11) % 12) + 1;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
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
    business_type: "",
    address: "",
    phone: "",
    opening_time: "",
    closing_time: "",
    years_in_business: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const storedUser = localStorage.getItem("ttg_user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const realRole = parsedUser?.role || "TRAVELER";
  const mode = parsedUser?.mode || realRole;

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
          business_type: body.profile.business_type || "",
          address: body.profile.address || "",
          phone: body.profile.phone || "",
          opening_time: body.profile.opening_time || "",
          closing_time: body.profile.closing_time || "",
          years_in_business:
            body.profile.years_in_business != null
              ? String(body.profile.years_in_business)
              : "",
          description: body.profile.description || "",
        });

        setAreasLoading(true);
        const areasResp = await fetch("http://127.0.0.1:8000/api/travel/areas/");
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
            business_type: editForm.business_type,
            address: editForm.address,
            phone: editForm.phone,
            opening_time: editForm.opening_time || null,
            closing_time: editForm.closing_time || null,
            years_in_business:
              parseInt(editForm.years_in_business, 10) || 0,
            description: editForm.description,
          }),
        }
      );

      const body = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        throw new Error(body.detail || "Failed to update merchant profile");
      }

      setData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          shop_name: body.shop_name,
          business_area: body.business_area,
          business_area_id: body.business_area_id,
          business_type: body.business_type,
          address: body.address,
          phone: body.phone,
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

  async function handleRequestVerification() {
    try {
      setRequesting(true);
      setError("");
      setMessage("");

      const stored = localStorage.getItem("ttg_user");
      const parsed = stored ? JSON.parse(stored) : null;
      const token = parsed?.token || parsed?.username || "";

      if (!token) {
        throw new Error("Not logged in.");
      }

      const resp = await fetch(
        "http://127.0.0.1:8000/api/accounts/dashboard/merchant/request-verification/",
        {
          method: "POST",
          headers: {
            "X-User-Token": token,
          },
        }
      );

      const body = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        if (
          body.detail === "Verification request already pending." ||
          body.detail === "This business is already verified."
        ) {
          setMessage(body.detail);
          return;
        }
        throw new Error(body.detail || "Failed to request verification");
      }

      setMessage(body.message || "Verification request sent.");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setRequesting(false);
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
  const isVerified = profile.is_verified;

  return (
    <div className="dashboard-page flex justify-center p-4 min-h-screen bg-gray-50">
      <style>{`
        .dashboard-card {
          width: 100%;
          max-width: 900px;
          background: white;
          padding: 1.5rem;
          border-radius: 0.75rem;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
        }
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .stat-card {
          padding: 0.75rem;
          background-color: #f9fafb;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }
        .stat-card h3 {
          font-size: 0.8rem;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 0.15rem;
        }
        .stat-card p {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1f2937;
        }
        .primary-btn {
          padding: 0.45rem 0.9rem;
          border: none;
          border-radius: 0.5rem;
          background-color: #3b82f6;
          color: white;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.85rem;
        }
        .primary-btn:disabled {
          background-color: #93c5fd;
          cursor: not-allowed;
        }
        .form-label {
          display: block;
          font-size: 0.8rem;
          margin-bottom: 4px;
        }
        .form-input, .form-select, .form-textarea {
          width: 100%;
          padding: 0.45rem 0.7rem;
          border-radius: 0.375rem;
          border: 1px solid #d1d5db;
          font-size: 0.85rem;
        }
      `}</style>

      <div className="dashboard-card">
        <TopBar />

        {parsedUser && realRole === "MERCHANT" && mode !== "TRAVELER" && (
          <button
            type="button"
            className="primary-btn"
            style={{ marginBottom: "0.75rem", marginRight: "0.5rem" }}
            onClick={() => {
              const updated = { ...parsedUser, mode: "TRAVELER" };
              localStorage.setItem("ttg_user", JSON.stringify(updated));
              window.location.href = "/traveler";
            }}
          >
            Switch to traveler mode
          </button>
        )}

        <h2 className="text-2xl font-bold text-gray-800">Merchant Dashboard</h2>
        <p style={{ marginBottom: "0.75rem", color: "#4b5563" }}>
          {apiMessage}
        </p>

        {message && (
          <div
            style={{
              padding: "0.5rem 0.75rem",
              marginBottom: "0.75rem",
              background: "#d1fae5",
              color: "#065f46",
              borderRadius: "0.375rem",
              fontSize: "0.85rem",
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
              fontSize: "0.85rem",
            }}
          >
            {error}
          </div>
        )}

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

        <section style={{ marginTop: "0.5rem" }}>
          <h3 className="text-xl font-semibold mb-2">Business details</h3>
          <p>
            <strong>Role:</strong> {role} (mode: {mode})
          </p>
          <p>
            <strong>Business type:</strong> {profile.business_type || "Not set"}
          </p>
          <p>
            <strong>Address:</strong> {profile.address || "Not set"}
          </p>
          <p>
            <strong>Phone:</strong> {profile.phone || "Not set"}
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
            <strong>Verified:</strong> {profile.is_verified ? "Yes" : "No"}
          </p>
          {profile.description && (
            <p>
              <strong>Description:</strong> {profile.description}
            </p>
          )}
        </section>

        <div style={{ marginTop: "0.75rem", marginBottom: "0.75rem" }}>
          <button
            type="button"
            className="primary-btn"
            onClick={handleRequestVerification}
            disabled={requesting}
          >
            {requesting ? "Requesting..." : "Request verification"}
          </button>
        </div>

        {/* Edit business profile */}
        <section style={{ marginTop: "0.75rem" }}>
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
              style={{ padding: "0.35rem 0.9rem", fontSize: "0.8rem" }}
              onClick={() => setShowEdit((prev) => !prev)}
            >
              {showEdit ? "Hide form" : "Edit profile"}
            </button>
          </div>

          {showEdit && (
            <form
              onSubmit={handleSaveProfile}
              style={{ maxWidth: "480px", display: "grid", gap: "0.6rem" }}
            >
              {/* Business info block */}
              <div
                style={{
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #e5e7eb",
                  background: "#f9fafb",
                }}
              >
                <h4
                  style={{
                    marginBottom: "0.35rem",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                  }}
                >
                  Business Information
                </h4>

                <div style={{ display: "grid", gap: "0.5rem" }}>
                  <div>
                    <label className="form-label">Business name</label>
                    <input
                      className="form-input"
                      name="shop_name"
                      value={editForm.shop_name}
                      onChange={handleEditChange}
                      disabled={isVerified}
                    />
                  </div>

                  <div>
                    <label className="form-label">Business type</label>
                    <input
                      className="form-input"
                      name="business_type"
                      value={editForm.business_type}
                      onChange={handleEditChange}
                      disabled={isVerified}
                      placeholder="Restaurant, Cafe, Shop..."
                    />
                  </div>

                  <div>
                    <label className="form-label">Business area</label>
                    {areasLoading ? (
                      <p style={{ fontSize: "0.8rem" }}>Loading areas...</p>
                    ) : (
                      <select
                        className="form-select"
                        name="business_area_id"
                        value={editForm.business_area_id}
                        onChange={handleEditChange}
                        disabled={isVerified}
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
                    <label className="form-label">Address</label>
                    <input
                      className="form-input"
                      name="address"
                      value={editForm.address}
                      onChange={handleEditChange}
                      disabled={isVerified}
                      placeholder="Street, area, city"
                    />
                  </div>

                  <div>
                    <label className="form-label">Phone</label>
                    <input
                      className="form-input"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleEditChange}
                      disabled={isVerified}
                      placeholder="+880..."
                    />
                  </div>
                </div>
              </div>

              {/* Timing + description */}
              <div
                style={{
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #e5e7eb",
                  background: "#f9fafb",
                }}
              >
                <h4
                  style={{
                    marginBottom: "0.35rem",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                  }}
                >
                  Hours & Description
                </h4>

                <div style={{ display: "grid", gap: "0.5rem" }}>
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
                      disabled={isVerified}
                      placeholder="Tell travelers what makes your place special"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="primary-btn"
                disabled={saving}
                style={{ alignSelf: "flex-start", marginTop: "0.25rem" }}
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

export default MerchantDashboard;
