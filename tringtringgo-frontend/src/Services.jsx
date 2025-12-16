// src/pages/ServicesPage.jsx
import React, { useEffect, useState } from "react";

/* ---------- shared auth helper ---------- */

function getAuthUser() {
  const stored = localStorage.getItem("ttg_user");
  const parsed = stored ? JSON.parse(stored) : null;
  return parsed;
}

/* ---------- global theme helper ---------- */

function getInitialTheme() {
  const stored = localStorage.getItem("ttg_theme");
  return stored === "dark" || stored === "light" ? stored : "light";
}

/* ---------- TopBar (no theme toggle, follows theme classes) ---------- */

function TopBar({ isDark }) {
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
  const parsed = getAuthUser();
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

  const linkClass = (name) =>
    "nav-link px-3 py-1 rounded-pill" +
    (isActive(name)
      ? " fw-semibold text-white bg-primary"
      : isDark
      ? " text-light"
      : " text-secondary");

  return (
    <nav
      className={
        "navbar navbar-expand-lg mb-3 topbar-bordered " +
        (isDark ? "navbar-dark" : "navbar-light")
      }
    >
      <div className="container-fluid">
        <span
          className={
            "navbar-brand brand-glow " +
            (isDark ? "brand-glow-dark" : "brand-glow-light")
          }
        >
          TringTringGo
        </span>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#servicesTopbarNav"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="servicesTopbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-1">
            <li className="nav-item">
              <a href="/home" className={linkClass("home")}>
                Home
              </a>
            </li>
            <li className="nav-item">
              <a href="/explore" className={linkClass("explore")}>
                Explore
              </a>
            </li>
            <li className="nav-item">
              <a href="/community" className={linkClass("community")}>
                Community
              </a>
            </li>
            <li className="nav-item">
              <a href="/services" className={linkClass("services")}>
                Services
              </a>
            </li>
            <li className="nav-item">
              <a href={dashboardHref} className={linkClass("dashboard")}>
                Dashboard
              </a>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-danger rounded-pill"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right me-1" />
              Log out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

/* ---------- Main page with global theme ---------- */

function ServicesPage() {
  const [theme, setTheme] = useState(getInitialTheme);
  const isDark = theme === "dark";

  // keep in sync if some other page changes ttg_theme
  useEffect(() => {
    const stored = localStorage.getItem("ttg_theme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
    }
  }, []);

  const outerBgClass = isDark ? "bg-black bg-gradient" : "bg-body-tertiary";
  const cardBgClass = isDark ? "bg-dark text-light" : "bg-white text-dark";

  return (
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
            <TopBar isDark={isDark} />
            <div className="d-flex flex-wrap align-items-center justify-content-between">
              <div className="mb-3 mb-lg-0">
                <h1
                  className={
                    "h3 mb-1 " + (isDark ? "text-light" : "text-white")
                  }
                >
                  Nearby Services
                </h1>
                <p
                  className={
                    "mb-1 small " +
                    (isDark ? "text-light opacity-75" : "text-white-50")
                  }
                >
                  Find hospitals, police stations, ATMs, pharmacies and transport
                  hubs around your travel area.
                </p>
              </div>
            </div>
          </div>

          <div className="card-body p-4">
            <ServicesCore />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Services content (unchanged) ---------- */

function ServicesCore() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedService, setSelectedService] = useState(null);

  const categories = [
    { key: "ALL", label: "All" },
    { key: "HOSPITAL", label: "Hospitals" },
    { key: "POLICE", label: "Police" },
    { key: "ATM", label: "ATMs" },
    { key: "PHARMACY", label: "Pharmacies" },
    { key: "TRANSPORT", label: "Transport hubs" },
  ];

  useEffect(() => {
    async function loadServices() {
      try {
        setLoading(true);
        setError(null);

        const stored = localStorage.getItem("ttg_user");
        const parsed = stored ? JSON.parse(stored) : null;
        const token = parsed?.token || parsed?.username || "";

        const resp = await fetch(
          "http://127.0.0.1:8000/api/travel/services/",
          {
            method: "GET",
            headers: token ? { "X-User-Token": token } : {},
          }
        );

        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          throw new Error(body.detail || "Failed to load services");
        }

        const data = await resp.json();
        setServices(data);
      } catch (e) {
        console.error("Services load error:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    loadServices();
  }, []);

  const filteredServices =
    selectedCategory === "ALL"
      ? services
      : services.filter((s) => s.category === selectedCategory);

  return (
    <>
      <style>{`
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

      <div className="mb-3">
        <div className="d-flex flex-wrap gap-2 mb-2">
          {categories.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setSelectedCategory(c.key)}
              className={
                "services-category-chip" +
                (selectedCategory === c.key ? " active" : "")
              }
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="small text-muted mb-0">Loading services…</p>}
      {error && (
        <p className="text-danger fw-semibold small mb-0">Error: {error}</p>
      )}

      {!loading && !error && (
        <div className="row g-3">
          {/* Left: list */}
          <div className="col-lg-5">
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
                <p className="small text-muted mb-0">
                  No services found for this category.
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
                    <div className="d-flex justify-content-between align-items-center">
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
          </div>

          {/* Right: map / details */}
          <div className="col-lg-7">
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
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "0.9rem",
                    marginBottom: 0,
                  }}
                >
                  Select a service from the list to see its location and extra
                  information.
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
                    }}
                  >
                    Map placeholder: show location of{" "}
                    <strong style={{ marginLeft: "0.25rem" }}>
                      {selectedService.name}
                    </strong>{" "}
                    here using latitude/longitude from backend.
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
        </div>
      )}
    </>
  );
}

export default ServicesPage;
