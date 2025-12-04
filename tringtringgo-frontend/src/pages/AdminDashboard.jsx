import React, { useEffect, useState } from "react";

function AdminDashboard() {
  const [me, setMe] = useState(null);
  const [dash, setDash] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const meResp = await fetch("http://127.0.0.1:8000/api/accounts/me/");
        if (meResp.ok) setMe(await meResp.json());

        const dashResp = await fetch("http://127.0.0.1:8000/api/accounts/dashboard/admin/");
        if (dashResp.ok) setDash(await dashResp.json());
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <h2>⚙️ Admin Dashboard</h2>
        
        {me && (
          <div className="user-welcome">
            Admin panel for <strong>{me.username}</strong>
          </div>
        )}

        {dash && dash.stats && (
          <>
            {/* Admin stats grid */}
            <div className="stats-row">
              <div className="stat-card">
                <h3>Total Users</h3>
                <p>{dash.stats.total_users}</p>
              </div>
              <div className="stat-card">
                <h3>Travelers</h3>
                <p>{dash.stats.travelers}</p>
              </div>
              <div className="stat-card">
                <h3>Merchants</h3>
                <p>{dash.stats.merchants}</p>
              </div>
              <div className="stat-card">
                <h3>Unverified</h3>
                <p style={{ color: "#f59e0b" }}>
                  {dash.stats.unverified_merchants}
                </p>
              </div>
            </div>

            <div style={{ textAlign: "center", color: "#6b7280", marginTop: "1rem" }}>
              {dash.message}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
