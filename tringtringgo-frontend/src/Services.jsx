import React, { useEffect, useState } from "react";

function Services() {
  const [services, setServices] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedService, setSelectedService] = useState(null);
  const [selectedAreaId, setSelectedAreaId] = useState("ALL");

  // Read current user info (including role/mode) from localStorage
  const storedUser = localStorage.getItem("ttg_user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const userRole = parsedUser?.role || parsedUser?.mode || null;

  useEffect(() => {
    // when user changes (traveler -> merchant), reset filters
    setSelectedAreaId("ALL");
    setSelectedCategory("ALL");
    setSelectedService(null);
  }, [userRole]);

  // Basic categories you mentioned
  const categories = [
    { key: "ALL", label: "All" },
    { key: "HOSPITAL", label: "Hospitals" },
    { key: "POLICE", label: "Police" },
    { key: "ATM", label: "ATMs" },
    { key: "PHARMACY", label: "Pharmacies" },
    { key: "TRANSPORT", label: "Transport hubs" },
  ];

  // Load areas once
  useEffect(() => {
    async function loadAreas() {
      try {
        const resp = await fetch(
          "http://127.0.0.1:8000/api/travel/areas/"
        );
        if (!resp.ok) return;
        const data = await resp.json();
        setAreas(data); // each item: {id, name}
      } catch (e) {
        console.error("Areas load error:", e);
      }
    }
    loadAreas();
  }, []);

  // Load services whenever area filter changes
  useEffect(() => {
    async function loadServices() {
      try {
        setLoading(true);
        setError(null);

        const stored = localStorage.getItem("ttg_user");
        const parsed = stored ? JSON.parse(stored) : null;
        const token = parsed?.token || parsed?.username || "";

        const params = new URLSearchParams();
        if (selectedAreaId !== "ALL") {
          params.append("area_id", selectedAreaId);
        }
        const url = `http://127.0.0.1:8000/api/travel/services/${
          params.toString() ? "?" + params.toString() : ""
        }`;

        const resp = await fetch(url, {
          method: "GET",
          headers: token ? { "X-User-Token": token } : {},
        });

        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          throw new Error(body.detail || "Failed to load services");
        }

        const data = await resp.json();
        setServices(data);
        setSelectedService(null);
      } catch (e) {
        console.error("Services load error:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    // Load for travelers and merchants; block only admins
    if (userRole === "ADMIN") {
      setLoading(false);
      return;
    }

    loadServices();
  }, [selectedAreaId, userRole]);

  const filteredServices =
    selectedCategory === "ALL"
      ? services
      : services.filter((s) => s.category === selectedCategory);

  // Build a Google Maps URL for the currently selected service
  const hasCoords =
    selectedService &&
    selectedService.latitude != null &&
    selectedService.longitude != null;

  const mapsUrl =
    selectedService &&
    (hasCoords
      ? `https://www.google.com/maps/search/?api=1&query=${selectedService.latitude},${selectedService.longitude}`
      : selectedService.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          selectedService.address
        )}`
      : null);

  // Role-based rendering

  // Not logged in or no role
  if (!userRole) {
    return (
      <div className="dashboard-page flex justify-center p-4 min-h-screen bg-gray-50">
        <div className="dashboard-card">
          <h2 className="text-xl font-semibold text-gray-800">Services</h2>
          <p className="text-sm text-gray-600">
            Please log in as a traveler or merchant to view nearby services.
          </p>
        </div>
      </div>
    );
  }

  // Admin: tell them to use admin services page
  if (userRole === "ADMIN") {
    return (
      <div className="dashboard-page flex justify-center p-4 min-h-screen bg-gray-50">
        <div className="dashboard-card">
          <h2 className="text-xl font-semibold text-gray-800">Services</h2>
          <p className="text-sm text-gray-600">
            Services can be managed from the admin services page.
          </p>
        </div>
      </div>
    );
  }

  // Traveler / Merchant view (full UI)
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
        .services-layout {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
          gap: 1.5rem;
        }
        @media (max-width: 900px) {
          .services-layout {
            grid-template-columns: minmax(0, 1fr);
          }
        }
        .services-category-chip {
          padding: 0.35rem 0.8rem;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          font-size: 0.85rem;
          cursor: pointer;
          background: #f9fafb;
          color: #4b5563;
        }
        .services-category-chip.active {
          background: #111827;
          color: #f9fafb;
          border-color: #111827;
        }
        .services-list-item {
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          padding: 0.8rem 0.9rem;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .services-list-item.selected {
          border-color: #2563eb;
          box-shadow: 0 6px 18px rgba(37,99,235,0.18);
        }
      `}</style>

      <div className="dashboard-card">
        <h2 className="text-2xl font-bold text-gray-800">Nearby Services</h2>
        <p className="text-sm text-gray-600 mb-3">
          Find important services like hospitals, police stations, ATMs,
          pharmacies and transport hubs around your travel area.
        </p>

        {/* Area filter */}
        <div style={{ marginBottom: "0.75rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.85rem",
              color: "#4b5563",
              marginBottom: "0.25rem",
            }}
          >
            Filter by area
          </label>
          <select
            value={selectedAreaId}
            onChange={(e) => {
              setSelectedAreaId(e.target.value);
              setSelectedCategory("ALL");
              setSelectedService(null);
            }}
            style={{
              padding: "0.4rem 0.6rem",
              borderRadius: "0.5rem",
              border: "1px solid #e5e7eb",
              fontSize: "0.9rem",
            }}
          >
            <option value="ALL">All areas</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category filters */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginBottom: "1rem",
          }}
        >
          {categories.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => {
                setSelectedCategory(c.key);
                setSelectedService(null);
              }}
              className={
                "services-category-chip" +
                (selectedCategory === c.key ? " active" : "")
              }
            >
              {c.label}
            </button>
          ))}
        </div>

        {loading && <p>Loading services...</p>}
        {error && (
          <p style={{ color: "#b91c1c", fontWeight: 500 }}>Error: {error}</p>
        )}

        {!loading && !error && (
          <div className="services-layout">
            {/* Left: list */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                maxHeight: "480px",
                overflowY: "auto",
                paddingRight: "0.25rem",
              }}
            >
              {filteredServices.length === 0 ? (
                <p style={{ color: "#6b7280" }}>
                  No services found for this selection.
                </p>
              ) : (
                filteredServices.map((s) => (
                  <div
                    key={s.id}
                    className={
                      "services-list-item" +
                      (selectedService && selectedService.id === s.id
                        ? " selected"
                        : "")
                    }
                    onClick={() => setSelectedService(s)}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "0.98rem",
                            fontWeight: 600,
                          }}
                        >
                          {s.name}
                        </h3>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.8rem",
                            color: "#6b7280",
                          }}
                        >
                          {s.area_name || "Area not set"}
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.15rem 0.45rem",
                          borderRadius: "999px",
                          backgroundColor: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                        }}
                      >
                        {s.category_label || s.category}
                      </span>
                    </div>

                    {s.address && (
                      <p
                        style={{
                          margin: "0.2rem 0 0",
                          fontSize: "0.8rem",
                          color: "#4b5563",
                        }}
                      >
                        {s.address}
                      </p>
                    )}
                    {s.phone && (
                      <p
                        style={{
                          margin: "0.1rem 0 0",
                          fontSize: "0.8rem",
                          color: "#4b5563",
                        }}
                      >
                        Phone: {s.phone}
                      </p>
                    )}
                    {s.open_hours && (
                      <p
                        style={{
                          margin: "0.1rem 0 0",
                          fontSize: "0.8rem",
                          color: "#6b7280",
                        }}
                      >
                        Hours: {s.open_hours}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Right: map / details */}
            <div
              style={{
                borderRadius: "0.75rem",
                border: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
                minHeight: "260px",
                padding: "0.9rem 1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                Map & details
              </h3>

              {!selectedService ? (
                <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                  Select a service from the list to see its location and
                  extra information.
                </p>
              ) : (
                <>
                  <div
                    style={{
                      borderRadius: "0.75rem",
                      backgroundColor: "#e5e7eb",
                      height: "260px",
                      marginBottom: "0.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      padding: "0.75rem",
                      color: "#4b5563",
                      fontSize: "0.9rem",
                      gap: "0.5rem",
                    }}
                  >
                    {mapsUrl ? (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "0.4rem 0.8rem",
                          borderRadius: "999px",
                          backgroundColor: "#111827",
                          color: "#f9fafb",
                          fontSize: "0.85rem",
                          textDecoration: "none",
                        }}
                      >
                        Open in Google Maps
                      </a>
                    ) : (
                      <span>
                        No location data available for this service.
                      </span>
                    )}
                  </div>

                  <div>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "0.98rem",
                        fontWeight: 600,
                      }}
                    >
                      {selectedService.name}
                    </h4>
                    <p
                      style={{
                        margin: "0.15rem 0",
                        fontSize: "0.85rem",
                        color: "#6b7280",
                      }}
                    >
                      {selectedService.category_label ||
                        selectedService.category}{" "}
                      • {selectedService.area_name}
                    </p>
                    {selectedService.address && (
                      <p
                        style={{
                          margin: "0.1rem 0",
                          fontSize: "0.85rem",
                          color: "#4b5563",
                        }}
                      >
                        Address: {selectedService.address}
                      </p>
                    )}
                    {selectedService.phone && (
                      <p
                        style={{
                          margin: "0.1rem 0",
                          fontSize: "0.85rem",
                          color: "#4b5563",
                        }}
                      >
                        Phone: {selectedService.phone}
                      </p>
                    )}
                    {selectedService.open_hours && (
                      <p
                        style={{
                          margin: "0.1rem 0",
                          fontSize: "0.85rem",
                          color: "#4b5563",
                        }}
                      >
                        Opening hours: {selectedService.open_hours}
                      </p>
                    )}
                    {selectedService.notes && (
                      <p
                        style={{
                          margin: "0.1rem 0",
                          fontSize: "0.85rem",
                          color: "#4b5563",
                        }}
                      >
                        Notes: {selectedService.notes}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Services;
