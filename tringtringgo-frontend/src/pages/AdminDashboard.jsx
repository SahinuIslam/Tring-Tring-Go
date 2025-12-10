// src/AdminDashboard.jsx
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
  const [requests, setRequests] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reqLoading, setReqLoading] = useState(true);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [actingId, setActingId] = useState(null);
  const [communityError, setCommunityError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        setCommunityError("");

        const stored = localStorage.getItem("ttg_user");
        const parsed = stored ? JSON.parse(stored) : null;
        const token = parsed?.token || parsed?.username || "";

        if (!token) {
          throw new Error("Not logged in.");
        }

        // Dashboard summary
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
        setMessage(body.message || "");

        // Verification requests
        setReqLoading(true);
        const reqResp = await fetch(
          "http://127.0.0.1:8000/api/accounts/dashboard/admin/verification-requests/",
          {
            method: "GET",
            headers: {
              "X-User-Token": token,
            },
          }
        );
        const reqBody = await reqResp.json().catch(() => []);
        if (reqResp.ok) setRequests(reqBody);

        // Community posts in admin area (with comments)
        setCommunityLoading(true);
        const commResp = await fetch(
          "http://127.0.0.1:8000/api/community/admin/posts/",
          {
            method: "GET",
            headers: {
              "X-User-Token": token,
            },
          }
        );
        const commBody = await commResp.json().catch(() => []);
        if (!commResp.ok) {
          setCommunityError(
            commBody.detail || "Failed to load community posts"
          );
        } else {
          // commBody is list of posts without comments;
          // we’ll fetch comments per post below (simple version)
          const postsWithComments = await Promise.all(
            commBody.map(async (p) => {
              try {
                const detailResp = await fetch(
                  `http://127.0.0.1:8000/api/community/posts/${p.id}/`
                );
                const detailBody = await detailResp
                  .json()
                  .catch(() => ({ ...p, comments: [] }));
                if (!detailResp.ok) return { ...p, comments: [] };
                return { ...p, comments: detailBody.comments || [] };
              } catch {
                return { ...p, comments: [] };
              }
            })
          );
          setCommunityPosts(postsWithComments);
        }
      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoading(false);
        setReqLoading(false);
        setCommunityLoading(false);
      }
    }
    load();
  }, []);

  async function handleAction(requestId, action) {
    try {
      setActingId(requestId);
      setError("");
      setMessage("");

      const stored = localStorage.getItem("ttg_user");
      const parsed = stored ? JSON.parse(stored) : null;
      const token = parsed?.token || parsed?.username || "";

      if (!token) {
        throw new Error("Not logged in.");
      }

      const resp = await fetch(
        `http://127.0.0.1:8000/api/accounts/dashboard/admin/verification-requests/${requestId}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Token": token,
          },
          body: JSON.stringify({ action }),
        }
      );

      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(body.detail || "Failed to update request");
      }

      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: body.status } : r
        )
      );
      setMessage(body.message || "Request updated.");
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setActingId(null);
    }
  }

  async function handleDeletePost(postId) {
    if (!window.confirm("Delete this post and all its comments?")) return;
    try {
      const stored = localStorage.getItem("ttg_user");
      const parsed = stored ? JSON.parse(stored) : null;
      const token = parsed?.token || parsed?.username || "";
      if (!token) throw new Error("Not logged in.");

      const resp = await fetch(
        `http://127.0.0.1:8000/api/community/admin/posts/${postId}/`,
        {
          method: "DELETE",
          headers: { "X-User-Token": token },
        }
      );
      if (!resp.ok && resp.status !== 204) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.detail || "Failed to delete post");
      }
      setCommunityPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (e) {
      console.error(e);
      setCommunityError(e.message);
    }
  }

  async function handleDeleteComment(commentId, postId) {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const stored = localStorage.getItem("ttg_user");
      const parsed = stored ? JSON.parse(stored) : null;
      const token = parsed?.token || parsed?.username || "";
      if (!token) throw new Error("Not logged in.");

      const resp = await fetch(
        `http://127.0.0.1:8000/api/community/admin/comments/${commentId}/`,
        {
          method: "DELETE",
          headers: { "X-User-Token": token },
        }
      );
      if (!resp.ok && resp.status !== 204) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.detail || "Failed to delete comment");
      }

      // remove comment locally
      setCommunityPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) }
            : p
        )
      );
    } catch (e) {
      console.error(e);
      setCommunityError(e.message);
    }
  }

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

  const { admin, stats } = data;

  return (
    <div className="dashboard-page flex justify-center p-4 min-h-screen bg-gray-50">
      <style>{`
        .dashboard-card {
          width: 100%;
          max-width: 980px;
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
          font-size: 1.2rem;
          font-weight: 700;
          color: #1f2937;
        }
        .primary-btn {
          padding: 0.35rem 0.8rem;
          border: none;
          border-radius: 0.5rem;
          background-color: #3b82f6;
          color: white;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.8rem;
        }
        .primary-btn:disabled {
          background-color: #93c5fd;
          cursor: not-allowed;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        .table th, .table td {
          border: 1px solid #e5e7eb;
          padding: 0.4rem 0.5rem;
          text-align: left;
        }
        .table th {
          background: #f3f4f6;
          font-weight: 600;
        }
        .badge {
          display: inline-block;
          padding: 0.1rem 0.4rem;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        .badge-pending { background: #fef3c7; color: #92400e; }
        .badge-approved { background: #d1fae5; color: #065f46; }
        .badge-rejected { background: #fee2e2; color: #b91c1c; }
      `}</style>

      <div className="dashboard-card">
        <TopBar />

        <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
        <p style={{ marginBottom: "0.75rem", color: "#4b5563" }}>
          {message}
        </p>

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

        {/* Admin info */}
        <section style={{ marginBottom: "1rem" }}>
          <p>
            <strong>Admin:</strong> {admin.username}
          </p>
          <p>
            <strong>Area:</strong> {admin.area}
          </p>
        </section>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <h3>Merchants in area</h3>
            <p>{stats.total_merchants_in_area}</p>
          </div>
          <div className="stat-card">
            <h3>Verified merchants</h3>
            <p>{stats.verified_merchants_in_area}</p>
          </div>
          <div className="stat-card">
            <h3>Unverified merchants</h3>
            <p>{stats.unverified_merchants_in_area}</p>
          </div>
        </div>

        {/* Verification requests */}
        <section style={{ marginBottom: "2rem" }}>
          <h3 className="text-xl font-semibold mb-2">
            Merchant verification requests
          </h3>
          {reqLoading ? (
            <p>Loading requests...</p>
          ) : requests.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              No verification requests for your area yet.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
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
                      <td>
                        <span
                          className={
                            "badge " +
                            (r.status === "PENDING"
                              ? "badge-pending"
                              : r.status === "APPROVED"
                              ? "badge-approved"
                              : "badge-rejected")
                          }
                        >
                          {r.status}
                        </span>
                      </td>
                      <td>{new Date(r.created_at).toLocaleString()}</td>
                      <td>
                        {r.status === "PENDING" ? (
                          <div style={{ display: "flex", gap: "0.25rem" }}>
                            <button
                              type="button"
                              className="primary-btn"
                              disabled={actingId === r.id}
                              onClick={() => handleAction(r.id, "APPROVE")}
                            >
                              {actingId === r.id ? "Working..." : "Approve"}
                            </button>
                            <button
                              type="button"
                              className="primary-btn"
                              style={{ backgroundColor: "#ef4444" }}
                              disabled={actingId === r.id}
                              onClick={() => handleAction(r.id, "REJECT")}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "#6b7280",
                            }}
                          >
                            No actions
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Community posts in admin area with comments */}
        <section>
          <h3 className="text-xl font-semibold mb-2">
            Community posts in your area
          </h3>
          {communityError && (
            <p style={{ color: "#b91c1c", fontSize: "0.85rem" }}>
              {communityError}
            </p>
          )}
          {communityLoading ? (
            <p>Loading community posts...</p>
          ) : communityPosts.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              No community posts for your area yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {communityPosts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    padding: "0.75rem",
                    backgroundColor: "#f9fafb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.title}</div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#6b7280",
                        }}
                      >
                        {p.category_label} · by {p.author} ·{" "}
                        {new Date(p.created_at).toLocaleString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="primary-btn"
                      style={{ backgroundColor: "#ef4444" }}
                      onClick={() => handleDeletePost(p.id)}
                    >
                      Delete post
                    </button>
                  </div>

                  <div style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                    {p.description}
                  </div>

                  <div style={{ fontSize: "0.8rem", color: "#4b5563" }}>
                    {p.comments?.length || 0} comments · {p.likes_count} likes ·{" "}
                    {p.dislikes_count} dislikes
                  </div>

                  {p.comments && p.comments.length > 0 && (
                    <div
                      style={{
                        marginTop: "0.5rem",
                        borderTop: "1px solid #e5e7eb",
                        paddingTop: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          marginBottom: "0.25rem",
                        }}
                      >
                        Comments
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {p.comments.map((c) => (
                          <div
                            key={c.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: "0.8rem",
                              backgroundColor: "#ffffff",
                              borderRadius: "0.25rem",
                              padding: "0.25rem 0.5rem",
                              border: "1px solid #e5e7eb",
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: 600 }}>{c.author}</span>
                              {": "}
                              <span>{c.text}</span>
                              <div
                                style={{
                                  fontSize: "0.7rem",
                                  color: "#9ca3af",
                                }}
                              >
                                {new Date(c.created_at).toLocaleString()}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="primary-btn"
                              style={{
                                backgroundColor: "#ef4444",
                                padding: "0.2rem 0.5rem",
                              }}
                              onClick={() => handleDeleteComment(c.id, p.id)}
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default AdminDashboard;
