import React, { useEffect, useState } from "react";

function formatTimeToAMPM(timeStr) {
  if (!timeStr) return "Not set";
  const [hour, minute] = timeStr.split(":");
  let h = parseInt(hour, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${minute} ${ampm}`;
}

function MerchantDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiMessage, setApiMessage] = useState("");

  const [role, setRole] = useState("");
  const [mode, setMode] = useState("");
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
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

  const [areas, setAreas] = useState([]);
  const [verifLoading, setVerifLoading] = useState(false);
  const [verifMessage, setVerifMessage] = useState("");
  const [verifError, setVerifError] = useState("");

  const stored = localStorage.getItem("ttg_user");
  const parsed = stored ? JSON.parse(stored) : null;
  const isLoggedIn = !!parsed;
  const token = parsed?.token || parsed?.username || "";
  const userMode = parsed?.mode || parsed?.role || "TRAVELER";

  useEffect(() => {
    if (!isLoggedIn || !token) {
      setError("Not logged in.");
      setLoading(false);
      return;
    }

    async function loadAll() {
      try {
        const headers = { "X-User-Token": token };

        const resp = await fetch(
          "http://127.0.0.1:8000/api/accounts/dashboard/merchant/",
          { headers }
        );
        const data = await resp.json();

        if (!resp.ok) {
          throw new Error(data.detail || "Failed to load merchant dashboard.");
        }

        setRole(data.role);
        setMode(userMode);
        setProfile(data.profile);
        setMessage(data.message || "");

        const areaResp = await fetch(
          "http://127.0.0.1:8000/api/travel/areas/"
        );
        if (areaResp.ok) {
          const areaData = await areaResp.json();
          setAreas(areaData);
        }

        setError("");
      } catch (err) {
        console.error(err);
        setError(err.message || "Error loading merchant dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, [isLoggedIn, token, userMode]);

  function handleEditToggle() {
    if (!profile) return;
    setEditData({
      shop_name: profile.shop_name || "",
      business_area_id: profile.business_area_id || "",
      business_type: profile.business_type || "",
      address: profile.address || "",
      phone: profile.phone || "",
      opening_time: profile.opening_time || "",
      closing_time: profile.closing_time || "",
      years_in_business: profile.years_in_business || "",
      description: profile.description || "",
    });
    setEditMode(true);
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!token) return;

    try {
      setApiMessage("");
      setError("");

      const resp = await fetch(
        "http://127.0.0.1:8000/api/accounts/dashboard/merchant/profile/",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-User-Token": token,
          },
          body: JSON.stringify(editData),
        }
      );
      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.detail || "Failed to update merchant profile.");
      }

      setProfile((prev) => ({
        ...prev,
        shop_name: data.shop_name,
        business_area: data.business_area,
        business_area_id: data.business_area_id,
        business_type: data.business_type,
        address: data.address,
        phone: data.phone,
        opening_time: data.opening_time,
        closing_time: data.closing_time,
        years_in_business: data.years_in_business,
        description: data.description,
        is_verified: data.is_verified,
        status: data.status,
      }));
      setApiMessage("Profile updated successfully.");
      setEditMode(false);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error updating merchant profile.");
    }
  }

  async function handleRequestVerification() {
    if (!token) return;

    try {
      setVerifLoading(true);
      setVerifMessage("");
      setVerifError("");

      const resp = await fetch(
        "http://127.0.0.1:8000/api/accounts/dashboard/merchant/request-verification/",
        {
          method: "POST",
          headers: { "X-User-Token": token },
        }
      );
      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.detail || "Failed to request verification.");
      }

      setVerifMessage(data.message || "Verification request submitted.");
      setProfile((prev) => ({
        ...prev,
        status: data.status === "APPROVED"
          ? "Verified"
          : data.status === "PENDING"
          ? "Pending verification"
          : prev?.status || "Not requested",
      }));
    } catch (err) {
      console.error(err);
      setVerifError(err.message || "Error submitting verification request.");
    } finally {
      setVerifLoading(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <h2>Merchant Dashboard</h2>
          <p>You are not logged in. Please log in again.</p>
        </div>
      </div>
    );
  }

  if (loading || !profile) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <h2>Merchant Dashboard</h2>
          <p>Loading your data...</p>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <div className="user-welcome">
          <div>
            <strong>{profile.shop_name}</strong>
            <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              {profile.business_area} • {profile.status}
            </div>
          </div>
        </div>

        {message && (
          <p style={{ marginTop: "0.5rem", color: "#4b5563" }}>{message}</p>
        )}

        {apiMessage && (
          <p style={{ color: "green", marginTop: "0.5rem" }}>{apiMessage}</p>
        )}
        {error && (
          <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>
        )}

        <h3 style={{ marginTop: "1rem", marginBottom: "0.75rem" }}>
          Business details
        </h3>
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
          <strong>Years in business:</strong> {profile.years_in_business}
        </p>
        <p>
          <strong>Verified:</strong> {profile.is_verified ? "Yes" : "No"}
        </p>
        <p>
          <strong>Description:</strong> {profile.description}
        </p>

        <button
          className="btn btn-sm btn-outline-primary"
          onClick={handleEditToggle}
          style={{ marginTop: "0.75rem" }}
        >
          Edit business profile
        </button>

        {editMode && (
          <form
            onSubmit={handleEditSubmit}
            style={{
              marginTop: "1rem",
              padding: "1rem",
              borderRadius: "0.5rem",
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
            }}
          >
            <div className="form-row">
              <label>Shop name</label>
              <input
                name="shop_name"
                value={editData.shop_name}
                onChange={handleEditChange}
              />
            </div>

            <div className="form-row" style={{ marginTop: "0.75rem" }}>
              <label>Business area</label>
              <select
                name="business_area_id"
                value={editData.business_area_id}
                onChange={handleEditChange}
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
              <label>Business type</label>
              <input
                name="business_type"
                value={editData.business_type}
                onChange={handleEditChange}
              />
            </div>

            <div className="form-row" style={{ marginTop: "0.75rem" }}>
              <label>Address</label>
              <input
                name="address"
                value={editData.address}
                onChange={handleEditChange}
              />
            </div>

            <div className="form-row" style={{ marginTop: "0.75rem" }}>
              <label>Phone</label>
              <input
                name="phone"
                value={editData.phone}
                onChange={handleEditChange}
              />
            </div>

            <div
              className="form-row"
              style={{ marginTop: "0.75rem", display: "flex", gap: "0.75rem" }}
            >
              <div style={{ flex: 1 }}>
                <label>Opening time (HH:MM)</label>
                <input
                  name="opening_time"
                  value={editData.opening_time}
                  onChange={handleEditChange}
                  placeholder="09:00"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>Closing time (HH:MM)</label>
                <input
                  name="closing_time"
                  value={editData.closing_time}
                  onChange={handleEditChange}
                  placeholder="21:00"
                />
              </div>
            </div>

            <div className="form-row" style={{ marginTop: "0.75rem" }}>
              <label>Years in business</label>
              <input
                type="number"
                min="0"
                name="years_in_business"
                value={editData.years_in_business}
                onChange={handleEditChange}
              />
            </div>

            <div className="form-row" style={{ marginTop: "0.75rem" }}>
              <label>Description</label>
              <textarea
                name="description"
                value={editData.description}
                onChange={handleEditChange}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ marginTop: "0.75rem" }}
            >
              Save changes
            </button>
          </form>
        )}

        <hr style={{ margin: "1.5rem 0" }} />

        <h3>Verification status</h3>
        <p>
          Current status:{" "}
          <strong>{profile.status || "Not requested"}</strong>
        </p>

        <button
          className="btn btn-sm btn-outline-success"
          onClick={handleRequestVerification}
          disabled={verifLoading || profile.is_verified}
          style={{ marginTop: "0.5rem" }}
        >
          {verifLoading
            ? "Submitting..."
            : profile.is_verified
            ? "Already verified"
            : "Request verification"}
        </button>

        {verifMessage && (
          <p style={{ color: "green", marginTop: "0.5rem" }}>
            {verifMessage}
          </p>
        )}
        {verifError && (
          <p style={{ color: "red", marginTop: "0.5rem" }}>{verifError}</p>
        )}
      </div>
    </div>
  );
}

export default MerchantDashboard;
