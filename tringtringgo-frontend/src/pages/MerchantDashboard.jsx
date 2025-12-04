import React, { useEffect, useState } from "react";

function MerchantDashboard() {
  const [me, setMe] = useState(null);
  const [dash, setDash] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const meResp = await fetch("http://127.0.0.1:8000/api/accounts/me/");
        if (meResp.ok) setMe(await meResp.json());

        const dashResp = await fetch("http://127.0.0.1:8000/api/accounts/dashboard/merchant/");
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
        <h2>🏪 Merchant Dashboard</h2>
        
        {me && (
          <div className="user-welcome">
            Hello, <strong>{me.username}</strong>
          </div>
        )}

        {dash && dash.profile && (
          <>
            {/* Merchant profile card */}
            <div style={{ 
              background: "#f0f9ff", 
              padding: "1.5rem", 
              borderRadius: "0.75rem", 
              marginBottom: "1.5rem" 
            }}>
              <h3>👋 {dash.profile.shop_name}</h3>
              <p><strong>Location:</strong> {dash.profile.business_area}</p>
              <p><strong>Status:</strong> 
                <span style={{ 
                  color: dash.profile.is_verified ? "#10b981" : "#f59e0b",
                  fontWeight: "bold"
                }}>
                  {dash.profile.status}
                </span>
              </p>
              <p><strong>Years:</strong> {dash.profile.years_in_business}</p>
            </div>

            <div style={{ textAlign: "center", color: "#6b7280" }}>
              {dash.message}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MerchantDashboard;
