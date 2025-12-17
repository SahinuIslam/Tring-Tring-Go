// src/pages/MerchantDashboard.jsx
import React, { useEffect, useState } from "react";

/* ---------- helpers ---------- */

function formatTimeToAMPM(timeStr) {
  if (!timeStr) return "Not set";
  const [h, m] = timeStr.split(":").map(Number);
  const hour12 = ((h + 11) % 12) + 1;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/* ---------- MerchantDashboard ---------- */

function MerchantDashboard() {
  const storedUser = localStorage.getItem("ttg_user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const realRole = parsedUser?.role || "TRAVELER";
  const mode = parsedUser?.mode || realRole;
  const token = parsedUser?.token || parsedUser?.username || "";
  const isLoggedIn = !!parsedUser;

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

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      setError("You must log in as a merchant to view this dashboard.");
      return;
    }
    if (realRole !== "MERCHANT") {
      setLoading(false);
      setError("Merchant dashboard is only for merchant accounts.");
      return;
    }

    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError("");
        setMessage("");

        const resp = await fetch(
          "http://127.0.0.1:8000/api/accounts/dashboard/merchant/",
          {
            method: "GET",
            headers: { "X-User-Token": token },
          }
        );
        const body = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          throw new Error(body.detail || "Failed to load merchant dashboard");
        }

        if (cancelled) return;

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
          setAreasLoading(false);
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, realRole, token]);

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
      if (!isLoggedIn || realRole !== "MERCHANT") {
        throw new Error("You must log in as a merchant to update your profile.");
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

      if (!isLoggedIn || realRole !== "MERCHANT") {
        throw new Error(
          "You must log in as a merchant to request verification."
        );
      }

      const resp = await fetch(
        "http://127.0.0.1:8000/api/accounts/dashboard/merchant/request-verification/",
        {
          method: "POST",
          headers: { "X-User-Token": token },
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
      setData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          status: body.status || "PENDING",
        },
      }));
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setRequesting(false);
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
                <h2 className="h4 mb-1">Merchant Dashboard</h2>
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
              <h2 className="h4 mb-3">Merchant Dashboard</h2>
              <div className="alert alert-danger mb-0" role="alert">
                {error || "No data"}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { profile, role, message: apiMessage } = data;
  const isVerified = profile.is_verified;

  const verifiedBadgeClass = isVerified
    ? "badge rounded-pill text-bg-success"
    : profile.status === "PENDING"
    ? "badge rounded-pill text-bg-warning"
    : "badge rounded-pill text-bg-secondary";

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
                  {profile.shop_name || "Your business"}
                </h1>
                <p
                  className={
                    "mb-1 small " +
                    (isDark ? "text-light opacity-75" : "text-white-50")
                  }
                >
                  {profile.address || "Set your address to appear in Explore"}
                </p>
                <div className="d-flex align-items-center gap-2 mt-1">
                  <span className={verifiedBadgeClass}>
                    {isVerified
                      ? "Verified merchant"
                      : profile.status === "PENDING"
                      ? "Verification pending"
                      : "Not verified"}
                  </span>
                  <span className="badge rounded-pill bg-light text-dark">
                    {profile.business_type || "Business type not set"}
                  </span>
                </div>
              </div>

              <div className="text-end">
                {parsedUser &&
                  realRole === "MERCHANT" &&
                  mode !== "TRAVELER" && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-light rounded-pill mb-2"
                      onClick={() => {
                        const updated = { ...parsedUser, mode: "TRAVELER" };
                        localStorage.setItem(
                          "ttg_user",
                          JSON.stringify(updated)
                        );
                        window.location.href = "/traveler";
                      }}
                    >
                      <i className="bi bi-person-walking me-1" />
                      Switch to traveler
                    </button>
                  )}

                <div>
                  <button
                    type="button"
                    className="btn btn-light btn-sm rounded-pill"
                    onClick={handleRequestVerification}
                    disabled={requesting || isVerified}
                  >
                    {isVerified
                      ? "Already verified"
                      : requesting
                      ? "Requesting..."
                      : "Request verification"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="card-body p-4">
            {apiMessage && (
              <p
                className={
                  "small mb-3 " +
                  (isDark ? "text-secondary" : "text-muted")
                }
              >
                {apiMessage}
              </p>
            )}
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
              <div className="col-md-4">
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
                        {profile.business_area || "Not set"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card border-0 bg-success-subtle h-100">
                  <div className="card-body d-flex align-items-center">
                    <div className="me-3">
                      <span className="badge bg-success text-white rounded-circle p-3">
                        <i className="bi bi-clock-history" />
                      </span>
                    </div>
                    <div>
                      <div
                        className={
                          "small text-uppercase " +
                          (isDark ? "text-secondary" : "text-muted")
                        }
                      >
                        Years in business
                      </div>
                      <div className="fw-bold text-dark">
                        {profile.years_in_business || "0"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card border-0 bg-info-subtle h-100">
                  <div className="card-body d-flex align-items-center">
                    <div className="me-3">
                      <span className="badge bg-info text-white rounded-circle p-3">
                        <i className="bi bi-door-open-fill" />
                      </span>
                    </div>
                    <div>
                      <div
                        className={
                          "small text-uppercase " +
                          (isDark ? "text-secondary" : "text-muted")
                        }
                      >
                        Hours today
                      </div>
                      <div className="fw-bold text-dark">
                        {formatTimeToAMPM(profile.opening_time)} –{" "}
                        {formatTimeToAMPM(profile.closing_time)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Two-column layout */}
            <div className="row g-4">
              {/* Left: Overview */}
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
                      Business overview
                    </h3>
                    <dl className="row mb-0 small">
                      <dt
                        className={
                          "col-5 " +
                          (isDark ? "text-light" : "text-muted")
                        }
                      >
                        Shop name
                      </dt>
                      <dd className="col-7 fw-semibold">
                        {profile.shop_name || "Not set"}
                      </dd>

                      <dt
                        className={
                          "col-5 " +
                          (isDark ? "text-light" : "text-muted")
                        }
                      >
                        Role / mode
                      </dt>
                      <dd className="col-7">
                        {role}{" "}
                        <span
                          className={
                            isDark ? "text-light opacity-75" : "text-muted"
                          }
                        >
                          ({mode})
                        </span>
                      </dd>

                      <dt
                        className={
                          "col-5 " +
                          (isDark ? "text-light" : "text-muted")
                        }
                      >
                        Type
                      </dt>
                      <dd className="col-7">
                        {profile.business_type || "Not set"}
                      </dd>

                      <dt
                        className={
                          "col-5 " +
                          (isDark ? "text-light" : "text-muted")
                        }
                      >
                        Address
                      </dt>
                      <dd className="col-7">
                        {profile.address || "Not set"}
                      </dd>

                      <dt
                        className={
                          "col-5 " +
                          (isDark ? "text-light" : "text-muted")
                        }
                      >
                        Phone
                      </dt>
                      <dd className="col-7">
                        {profile.phone || "Not set"}
                      </dd>

                      <dt
                        className={
                          "col-5 " +
                          (isDark ? "text-light" : "text-muted")
                        }
                      >
                        Opening time
                      </dt>
                      <dd className="col-7">
                        {formatTimeToAMPM(profile.opening_time)}
                      </dd>

                      <dt
                        className={
                          "col-5 " +
                          (isDark ? "text-light" : "text-muted")
                        }
                      >
                        Closing time
                      </dt>
                      <dd className="col-7">
                        {formatTimeToAMPM(profile.closing_time)}
                      </dd>

                      {profile.description && (
                        <>
                          <dt
                            className={
                              "col-5 " +
                              (isDark ? "text-light" : "text-muted")
                            }
                          >
                            Description
                          </dt>
                          <dd className="col-7">{profile.description}</dd>
                        </>
                      )}
                    </dl>
                  </div>
                </div>
              </div>

              {/* Right: Edit form */}
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
                    onClick={() => setShowEdit((prev) => !prev)}
                  >
                    {showEdit ? "Hide form" : "Edit details"}
                  </button>
                </div>

                {showEdit && (
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
                          <label className="form-label">Business name</label>
                          <input
                            className="form-control form-control-sm"
                            name="shop_name"
                            value={editForm.shop_name}
                            onChange={handleEditChange}
                            disabled={isVerified}
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Business type</label>
                          <select
                            className="form-select form-select-sm"
                            name="business_type"
                            value={editForm.business_type}
                            onChange={handleEditChange}
                            disabled={isVerified}
                          >
                            <option value="">Select type…</option>
                            <option value="PARK">Park</option>
                            <option value="MUSEUM">Museum</option>
                            <option value="RESTAURANT">Restaurant</option>
                            <option value="CAFE">Cafe</option>
                            <option value="STREET_FOOD">Street Food</option>
                            <option value="FAST_FOOD">Fast Food</option>
                            <option value="BAKERY">Bakery</option>
                            <option value="MALL">Mall</option>
                            <option value="SHOP">Shop</option>
                            <option value="LOCAL_MARKET">
                              Local Market
                            </option>
                            <option value="SUPERMARKET">
                              Supermarket
                            </option>
                            <option value="HISTORICAL_SITE">
                              Historical Site
                            </option>
                            <option value="LANDMARK">Landmark</option>
                            <option value="LAKE">Lake</option>
                            <option value="BEACH">Beach</option>
                            <option value="ZOO">Zoo</option>
                            <option value="CINEMA">Cinema</option>
                            <option value="AMUSEMENT_PARK">
                              Amusement Park
                            </option>
                            <option value="SPORTS_COMPLEX">
                              Sports Complex
                            </option>
                            <option value="HOTEL">Hotel</option>
                            <option value="GUEST_HOUSE">
                              Guest House
                            </option>
                            <option value="TRANSPORT">
                              Transport Hub
                            </option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Area</label>
                          {areasLoading ? (
                            <p className="text-muted small mb-0">
                              Loading areas…
                            </p>
                          ) : (
                            <select
                              className="form-select form-select-sm"
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

                        <div className="col-md-6">
                          <label className="form-label">Phone</label>
                          <input
                            className="form-control form-control-sm"
                            name="phone"
                            value={editForm.phone}
                            onChange={handleEditChange}
                            disabled={isVerified}
                            placeholder="+880..."
                          />
                        </div>

                        <div className="col-12">
                          <label className="form-label">Address</label>
                          <input
                            className="form-control form-control-sm"
                            name="address"
                            value={editForm.address}
                            onChange={handleEditChange}
                            disabled={isVerified}
                            placeholder="Street, area, city"
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Opening time</label>
                          <input
                            type="time"
                            className="form-control form-control-sm"
                            name="opening_time"
                            value={editForm.opening_time}
                            onChange={handleEditChange}
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">Closing time</label>
                          <input
                            type="time"
                            className="form-control form-control-sm"
                            name="closing_time"
                            value={editForm.closing_time}
                            onChange={handleEditChange}
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">
                            Years in business
                          </label>
                          <input
                            type="number"
                            min="0"
                            className="form-control form-control-sm"
                            name="years_in_business"
                            value={editForm.years_in_business}
                            onChange={handleEditChange}
                          />
                        </div>

                        <div className="col-12">
                          <label className="form-label">Description</label>
                          <textarea
                            className="form-control form-control-sm"
                            name="description"
                            rows={3}
                            value={editForm.description}
                            onChange={handleEditChange}
                            disabled={isVerified}
                            placeholder="Tell travelers what makes your place special"
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default MerchantDashboard;
