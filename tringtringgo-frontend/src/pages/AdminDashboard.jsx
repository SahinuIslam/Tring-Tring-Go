import React, { useEffect, useState } from "react";

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [admin, setAdmin] = useState({ username: "", area: "" });
  const [stats, setStats] = useState({
    total_merchants_in_area: 0,
    verified_merchants_in_area: 0,
    unverified_merchants_in_area: 0,
  });

  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  const [communityPosts, setCommunityPosts] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [communityError, setCommunityError] = useState("");

  const stored = localStorage.getItem("ttg_user");
  const parsed = stored ? JSON.parse(stored) : null;
  const isLoggedIn = !!parsed;
  const token = parsed?.token || parsed?.username || "";

  useEffect(() => {
    if (!isLoggedIn || !token) {
      setError("Not logged in.");
      setLoading(false);
      setRequestsLoading(false);
      setCommunityLoading(false);
      return;
    }

    async function loadAdmin() {
      try {
        const headers = { "X-User-Token": token };

        const resp = await fetch(
          "http://127.0.0.1:8000/api/accounts/dashboard/admin/",
          { headers }
        );
        const data = await resp.json();

        if (!resp.ok) {
          throw new Error(data.detail || "Failed to load admin dashboard.");
        }

        setAdmin(data.admin);
        setStats(data.stats);
        setMessage(data.message || "");
        setError("");
      } catch (err) {
        console.error(err);
        setError(err.message || "Error loading admin dashboard.");
      } finally {
        setLoading(false);
      }
    }

    async function loadRequests() {
      try {
        const headers = { "X-User-Token": token };
        const resp = await fetch(
          "http://127.0.0.1:8000/api/accounts/dashboard/admin/verification-requests/",
          { headers }
        );
        const data = await resp.json();
        if (!resp.ok) {
          throw new Error(data.detail || "Failed to load requests.");
        }
        setRequests(data || []);
      } catch (err) {
        console.error(err);
        setRequests([]);
      } finally {
        setRequestsLoading(false);
      }
    }

    async function loadCommunity() {
      try {
        const headers = { "X-User-Token": token };
        const resp = await fetch(
          "http://127.0.0.1:8000/api/community/admin-area-posts/",
          { headers }
        );
        if (!resp.ok) {
          throw new Error("Failed to load community posts.");
        }
        const data = await resp.json();
        setCommunityPosts(data || []);
        setCommunityError("");
      } catch (err) {
        console.error(err);
        setCommunityError(err.message || "Error loading community posts.");
      } finally {
        setCommunityLoading(false);
      }
    }

    loadAdmin();
    loadRequests();
    loadCommunity();
  }, [isLoggedIn, token]);

  async function handleRequestAction(requestId, action) {
    if (!token) return;

    try {
      const headers = {
        "Content-Type": "application/json",
        "X-User-Token": token,
      };
      const resp = await fetch(
        `http://127.0.0.1:8000/api/accounts/dashboard/admin/verification-requests/${requestId}/`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ action, admin_note: "" }),
        }
      );
      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.detail || "Failed to update request.");
      }

      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: data.status } : r
        )
      );
    } catch (err) {
      console.error(err);
      alert(err.message || "Error updating request.");
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <h2>Admin Dashboard</h2>
          <p>You are not logged in. Please log in again.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <h2>Admin Dashboard</h2>
          <p>Loading...</p>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <h2>Admin Dashboard</h2>

        {message && (
          <p style={{ marginTop: "0.5rem", color: "#4b5563" }}>{message}</p>
        )}
        {error && (
          <p style={{ marginTop: "0.5rem", color: "red" }}>{error}</p>
        )}

        <h3 style={{ marginTop: "1rem" }}>Admin info</h3>
        <p>
          <strong>Admin:</strong> {admin.username}
        </p>
        <p>
          <strong>Area:</strong> {admin.area}
        </p>

        <h3 style={{ marginTop: "1.5rem" }}>Merchant stats</h3>
        <p>Total merchants in area: {stats.total_merchants_in_area}</p>
        <p>Verified merchants in area: {stats.verified_merchants_in_area}</p>
        <p>
          Unverified merchants in area: {stats.unverified_merchants_in_area}
        </p>

        <hr style={{ margin: "1.5rem 0" }} />

        <h3>Verification requests</h3>
        {requestsLoading ? (
          <p>Loading requests...</p>
        ) : requests.length === 0 ? (
          <p>No verification requests for your area yet.</p>
        ) : (
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Shop name</th>
                <th>Type</th>
                <th>Address</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Created at</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.shop_name}</td>
                  <td>{r.business_type || "-"}</td>
                  <td>{r.address || "-"}</td>
                  <td>{r.phone || "-"}</td>
                  <td>{r.status}</td>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td>
                    {r.status === "PENDING" ? (
                      <>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() =>
                            handleRequestAction(r.id, "APPROVE")
                          }
                        >
                          Approve
                        </button>{" "}
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() =>
                            handleRequestAction(r.id, "REJECT")
                          }
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span>{r.status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <hr style={{ margin: "1.5rem 0" }} />

        <h3>Community posts in your area</h3>
        {communityError && (
          <p style={{ color: "red" }}>{communityError}</p>
        )}
        {communityLoading ? (
          <p>Loading community posts...</p>
        ) : communityPosts.length === 0 ? (
          <p>No community posts for your area yet.</p>
        ) : (
          <ul>
            {communityPosts.map((p) => (
              <li key={p.id}>
                <strong>{p.title}</strong> – {p.content}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
