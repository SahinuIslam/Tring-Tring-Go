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
          gap: "1rem",
          fontSize: "0.95rem",
          color: "#4b5563",
        }}
      >
        <span>Admin</span>
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

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const stored = localStorage.getItem("ttg_user");
        const parsed = stored ? JSON.parse(stored) : null;
        const token = parsed?.token || parsed?.username || "";

        if (!token) {
          throw new Error("Not logged in.");
        }

        const resp = await fetch(
          "http://127.0.0.1:8000/api/accounts/dashboard/admin/",
          {
            method: "GET",
            headers: {
              "X-User-Token": token,
            },
          }
        );

        const body = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          throw new Error(body.detail || "Failed to load admin dashboard");
        }

        setData(body);
      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <TopBar />
          <h2>Admin Dashboard</h2>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <TopBar />
          <h2>Admin Dashboard</h2>
          <p style={{ color: "#b91c1c" }}>{error || "No data"}</p>
        </div>
      </div>
    );
  }

  const { stats, message } = data;

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
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
        }
      `}</style>

      <div className="dashboard-card">
        <TopBar />
        <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
        <p style={{ marginBottom: "1rem", color: "#4b5563" }}>{message}</p>

        <div className="stats-row">
          <div className="stat-card">
            <h3>Total users</h3>
            <p>{stats.total_users}</p>
          </div>
          <div className="stat-card">
            <h3>Travelers</h3>
            <p>{stats.travelers}</p>
          </div>
          <div className="stat-card">
            <h3>Merchants</h3>
            <p>{stats.merchants}</p>
          </div>
          <div className="stat-card">
            <h3>Unverified merchants</h3>
            <p>{stats.unverified_merchants}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
