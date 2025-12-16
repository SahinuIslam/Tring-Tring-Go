import React, { useEffect, useState } from "react";

function AdminServices() {
  const [services, setServices] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: "",
    category: "HOSPITAL",
    area: "",
    address: "",
    phone: "",
    open_hours: "",
    latitude: "",
    longitude: "",
    notes: "",
  });
  const [editingId, setEditingId] = useState(null);

  // Read user and token once
  const storedUser = localStorage.getItem("ttg_user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const userRole = parsedUser?.role || parsedUser?.mode || null;
  const token = parsedUser?.token || parsedUser?.username || "";

  // Load areas and services (only actually fetch if admin)
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [areasResp, servicesResp] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/travel/areas/"),
          fetch("http://127.0.0.1:8000/api/travel/services/"),
        ]);

        const areasData = await areasResp.json();
        const servicesData = await servicesResp.json();

        setAreas(areasData);
        setServices(servicesData);

        if (areasData.length && !form.area) {
          setForm((prev) => ({ ...prev, area: String(areasData[0].id) }));
        }
      } catch (e) {
        console.error("Admin services load error:", e);
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    }

    if (userRole === "ADMIN") {
      loadData();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);

    const payload = {
      ...form,
      area: form.area ? Number(form.area) : null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
    };

    try {
      const resp = await fetch(
        "http://127.0.0.1:8000/api/travel/services/create/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Token": token,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        console.error("Create service error:", data);
        setError(data.detail || "Failed to create service.");
        return;
      }

      setServices((prev) => [...prev, data]);
      setForm((prev) => ({
        ...prev,
        name: "",
        address: "",
        phone: "",
        open_hours: "",
        latitude: "",
        longitude: "",
        notes: "",
      }));
    } catch (e) {
      console.error(e);
      setError("Network error while creating service.");
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editingId) return;

    setError(null);

    const payload = {
      ...form,
      area: form.area ? Number(form.area) : null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
    };

    try {
      const resp = await fetch(
        `http://127.0.0.1:8000/api/travel/services/${editingId}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-User-Token": token,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        console.error("Update service error:", data);
        setError(data.detail || "Failed to update service.");
        return;
      }

      setServices((prev) =>
        prev.map((s) => (s.id === editingId ? data : s))
      );
    } catch (e) {
      console.error(e);
      setError("Network error while updating service.");
    }
  }

  async function handleDelete(e) {
    e.preventDefault();
    if (!editingId) return;
    if (!window.confirm("Delete this service?")) return;

    setError(null);

    try {
      const resp = await fetch(
        `http://127.0.0.1:8000/api/travel/services/${editingId}/`,
        {
          method: "DELETE",
          headers: {
            "X-User-Token": token,
          },
        }
      );

      if (!resp.ok && resp.status !== 204) {
        const data = await resp.json().catch(() => ({}));
        console.error("Delete service error:", data);
        setError(data.detail || "Failed to delete service.");
        return;
      }

      setServices((prev) => prev.filter((s) => s.id !== editingId));
      setEditingId(null);
      setForm((prev) => ({
        ...prev,
        name: "",
        address: "",
        phone: "",
        open_hours: "",
        latitude: "",
        longitude: "",
        notes: "",
      }));
    } catch (e) {
      console.error(e);
      setError("Network error while deleting service.");
    }
  }

  // Role-based render: block non-admins here (no hooks inside)
  if (userRole !== "ADMIN") {
    return (
      <div className="dashboard-page flex justify-center p-4 min-h-screen bg-gray-50">
        <div className="dashboard-card">
          <h2 className="text-xl font-semibold text-gray-800">Manage Services</h2>
          <p className="text-sm text-gray-600">
            Only admin users can manage services.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page flex justify-center p-4 min-h-screen bg-gray-50">
      <style>{`
        .dashboard-card {
          width: 100%;
          max-width: 1100px;
          background: white;
          padding: 2rem;
          border-radius: 0.75rem;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1),
                      0 2px 4px -2px rgba(0,0,0,0.1);
        }
        .admin-services-grid {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
          gap: 1.5rem;
        }
        @media (max-width: 900px) {
          .admin-services-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>

      <div className="dashboard-card">
        <h2 className="text-2xl font-bold text-gray-800">Manage Services</h2>
        <p className="text-sm text-gray-600 mb-3">
          Admins can add hospitals, police stations, ATMs, pharmacies, and transport hubs here.
        </p>

        {error && (
          <p style={{ color: "#b91c1c", fontWeight: 500, marginBottom: "0.75rem" }}>
            {error}
          </p>
        )}

        {loading ? (
          <p>Loading data...</p>
        ) : (
          <div className="admin-services-grid">
            {/* Left: form for create/update */}
            <form
              onSubmit={editingId ? handleUpdate : handleCreate}
              style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
            >
              <h3 className="text-lg font-semibold text-gray-800">
                {editingId ? "Edit service" : "Add new service"}
              </h3>

              <label style={{ fontSize: "0.85rem", color: "#4b5563" }}>
                Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "0.4rem 0.6rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #e5e7eb",
                    marginTop: "0.15rem",
                  }}
                />
              </label>

              <label style={{ fontSize: "0.85rem", color: "#4b5563" }}>
                Category
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "0.4rem 0.6rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #e5e7eb",
                    marginTop: "0.15rem",
                  }}
                >
                  <option value="HOSPITAL">Hospital</option>
                  <option value="POLICE">Police station</option>
                  <option value="ATM">ATM</option>
                  <option value="PHARMACY">Pharmacy</option>
                  <option value="TRANSPORT">Transport hub</option>
                </select>
              </label>

              <label style={{ fontSize: "0.85rem", color: "#4b5563" }}>
                Area
                <select
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "0.4rem 0.6rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #e5e7eb",
                    marginTop: "0.15rem",
                  }}
                >
                  <option value="">Select area</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ fontSize: "0.85rem", color: "#4b5563" }}>
                Address
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "0.4rem 0.6rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #e5e7eb",
                    marginTop: "0.15rem",
                  }}
                />
              </label>

              <label style={{ fontSize: "0.85rem", color: "#4b5563" }}>
                Phone
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "0.4rem 0.6rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #e5e7eb",
                    marginTop: "0.15rem",
                  }}
                />
              </label>

              <label style={{ fontSize: "0.85rem", color: "#4b5563" }}>
                Opening hours
                <input
                  name="open_hours"
                  value={form.open_hours}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "0.4rem 0.6rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #e5e7eb",
                    marginTop: "0.15rem",
                  }}
                />
              </label>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.85rem", color: "#4b5563", flex: 1 }}>
                  Latitude
                  <input
                    name="latitude"
                    value={form.latitude}
                    onChange={handleChange}
                    placeholder="e.g. 23.8103"
                    style={{
                      width: "100%",
                      padding: "0.4rem 0.6rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #e5e7eb",
                      marginTop: "0.15rem",
                    }}
                  />
                </label>
                <label style={{ fontSize: "0.85rem", color: "#4b5563", flex: 1 }}>
                  Longitude
                  <input
                    name="longitude"
                    value={form.longitude}
                    onChange={handleChange}
                    placeholder="e.g. 90.4125"
                    style={{
                      width: "100%",
                      padding: "0.4rem 0.6rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #e5e7eb",
                      marginTop: "0.15rem",
                    }}
                  />
                </label>
              </div>

              <label style={{ fontSize: "0.85rem", color: "#4b5563" }}>
                Notes
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "0.4rem 0.6rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #e5e7eb",
                    marginTop: "0.15rem",
                    resize: "vertical",
                  }}
                />
              </label>

              {editingId ? (
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginTop: "0.75rem",
                  }}
                >
                  <button
                    type="submit"
                    style={{
                      padding: "0.5rem 0.9rem",
                      borderRadius: "0.5rem",
                      backgroundColor: "#111827",
                      color: "#f9fafb",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    Update service
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    style={{
                      padding: "0.5rem 0.9rem",
                      borderRadius: "0.5rem",
                      backgroundColor: "#ef4444",
                      color: "#f9fafb",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    Delete service
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setForm((prev) => ({
                        ...prev,
                        name: "",
                        address: "",
                        phone: "",
                        open_hours: "",
                        latitude: "",
                        longitude: "",
                        notes: "",
                      }));
                    }}
                    style={{
                      padding: "0.5rem 0.9rem",
                      borderRadius: "0.5rem",
                      backgroundColor: "#e5e7eb",
                      color: "#111827",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  style={{
                    marginTop: "0.75rem",
                    padding: "0.5rem 0.9rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "#111827",
                    color: "#f9fafb",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                  }}
                >
                  Add service
                </button>
              )}
            </form>

            {/* Right: list of services */}
            <div
              style={{
                maxHeight: "480px",
                overflowY: "auto",
                borderRadius: "0.75rem",
                border: "1px solid #e5e7eb",
                padding: "0.75rem",
                backgroundColor: "#f9fafb",
              }}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Existing services
              </h3>
              {services.length === 0 ? (
                <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                  No services created yet.
                </p>
              ) : (
                services.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      padding: "0.4rem 0.5rem",
                      borderBottom: "1px solid #e5e7eb",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      backgroundColor:
                        editingId === s.id ? "#e5e7eb" : "transparent",
                    }}
                    onClick={() => {
                      setEditingId(s.id);
                      setForm({
                        name: s.name || "",
                        category: s.category || "HOSPITAL",
                        area: s.area ? String(s.area) : "",
                        address: s.address || "",
                        phone: s.phone || "",
                        open_hours: s.open_hours || "",
                        latitude:
                          s.latitude != null ? String(s.latitude) : "",
                        longitude:
                          s.longitude != null ? String(s.longitude) : "",
                        notes: s.notes || "",
                      });
                    }}
                  >
                    <strong>{s.name}</strong> —{" "}
                    {s.category_label || s.category} • {s.area_name}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminServices;