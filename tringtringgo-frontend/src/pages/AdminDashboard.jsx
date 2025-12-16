// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";

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
          // IMPORTANT FIX: include X-User-Token when loading each post detail
          const postsWithComments = await Promise.all(
            commBody.map(async (p) => {
              try {
                const detailResp = await fetch(
                  `http://127.0.0.1:8000/api/community/posts/${p.id}/`,
                  {
                    method: "GET",
                    headers: {
                      "X-User-Token": token,
                    },
                  }
                );
                const detailBody = await detailResp
                  .json()
                  .catch(() => ({ ...p, comments: [] }));
                if (!detailResp.ok)
                  return { ...p, comments: [] };
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
                <h2 className="h4 mb-1">Admin Dashboard</h2>
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
              <h2 className="h4 mb-3">Admin Dashboard</h2>
              <div className="alert alert-danger mb-0" role="alert">
                {error || "No data"}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { admin, stats } = data;

  return (
    <div className={outerBgClass + " min-vh-100 py-4"}>
      <div className="container">
        <div
          className={
            "card shadow-lg border-0 rounded-4 overflow-hidden " + cardBgClass
          }
        >
          {/* Hero header */}
          <div className={"px-4 pt-4 pb-3 bg-gradient bg-danger text-white"}>
            <div className="d-flex flex-wrap align-items-center justify-content-between">
              <div className="mb-3 mb-lg-0">
                <h1 className="h3 mb-1 text-white">Admin Dashboard</h1>
                <p className="mb-1 small text-white-50">
                  Manage verification requests and community content for your
                  area
                </p>
                <div className="d-flex align-items-center gap-2 mt-1">
                  <span className="badge rounded-pill bg-light text-dark">
                    {admin.username}
                  </span>
                  <span className="badge rounded-pill bg-light text-dark">
                    {admin.area}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="card-body p-4">
            {message && (
              <div
                className="alert alert-success py-2 small mb-3"
                role="alert"
              >
                {message}
              </div>
            )}
            {error && (
              <div className="alert alert-danger py-2 small mb-3" role="alert">
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
                        <i className="bi bi-shop" />
                      </span>
                    </div>
                    <div>
                      <div
                        className={
                          "small text-uppercase " +
                          (isDark ? "text-secondary" : "text-muted")
                        }
                      >
                        Merchants in area
                      </div>
                      <div className="fw-bold text-dark">
                        {stats.total_merchants_in_area}
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
                        <i className="bi bi-check-circle-fill" />
                      </span>
                    </div>
                    <div>
                      <div
                        className={
                          "small text-uppercase " +
                          (isDark ? "text-secondary" : "text-muted")
                        }
                      >
                        Verified merchants
                      </div>
                      <div className="fw-bold text-dark">
                        {stats.verified_merchants_in_area}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 bg-warning-subtle h-100">
                  <div className="card-body d-flex align-items-center">
                    <div className="me-3">
                      <span className="badge bg-warning text-dark rounded-circle p-3">
                        <i className="bi bi-x-circle-fill" />
                      </span>
                    </div>
                    <div>
                      <div
                        className={
                          "small text-uppercase " +
                          (isDark ? "text-secondary" : "text-muted")
                        }
                      >
                        Unverified merchants
                      </div>
                      <div className="fw-bold text-dark">
                        {stats.unverified_merchants_in_area}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification requests table */}
            <div className="mb-5">
              <h3
                className={
                  "h6 text-uppercase mb-3 " +
                  (isDark ? "text-light" : "text-muted")
                }
              >
                Merchant verification requests
              </h3>
              {reqLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary mb-2" />
                  <p className="small mb-0 text-muted">Loading requests...</p>
                </div>
              ) : requests.length === 0 ? (
                <p
                  className={
                    "small mb-0 " +
                    (isDark ? "text-secondary" : "text-muted")
                  }
                >
                  No verification requests for your area yet.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Shop name</th>
                        <th>Type</th>
                        <th>Address</th>
                        <th>Phone</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((r) => (
                        <tr key={r.id}>
                          <td className="fw-semibold">{r.shop_name}</td>
                          <td>{r.business_type || "-"}</td>
                          <td className="small">{r.address || "-"}</td>
                          <td className="small">{r.phone || "-"}</td>
                          <td>
                            <span
                              className={
                                "badge " +
                                (r.status === "PENDING"
                                  ? "bg-warning text-dark"
                                  : r.status === "APPROVED"
                                  ? "bg-success"
                                  : "bg-danger")
                              }
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="small">
                            {new Date(r.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            {r.status === "PENDING" ? (
                              <div
                                className="btn-group btn-group-sm"
                                role="group"
                              >
                                <button
                                  type="button"
                                  className="btn btn-success"
                                  disabled={actingId === r.id}
                                  onClick={() =>
                                    handleAction(r.id, "APPROVE")
                                  }
                                >
                                  {actingId === r.id ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-1" />
                                      Approve
                                    </>
                                  ) : (
                                    "Approve"
                                  )}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-danger"
                                  disabled={actingId === r.id}
                                  onClick={() =>
                                    handleAction(r.id, "REJECT")
                                  }
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span
                                className={
                                  "small " +
                                  (isDark ? "text-secondary" : "text-muted")
                                }
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
            </div>

            {/* Community posts */}
            <div>
              <h3
                className={
                  "h6 text-uppercase mb-3 " +
                  (isDark ? "text-light" : "text-muted")
                }
              >
                Community posts in your area
              </h3>
              {communityError && (
                <div
                  className="alert alert-danger py-2 small mb-3"
                  role="alert"
                >
                  {communityError}
                </div>
              )}
              {communityLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary mb-2" />
                  <p className="small mb-0 text-muted">
                    Loading community posts...
                  </p>
                </div>
              ) : communityPosts.length === 0 ? (
                <p
                  className={
                    "small mb-0 " +
                    (isDark ? "text-secondary" : "text-muted")
                  }
                >
                  No community posts for your area yet.
                </p>
              ) : (
                <div className="row g-3">
                  {communityPosts.map((p) => (
                    <div className="col-lg-6" key={p.id}>
                      <div
                        className={
                          "card h-100 border-0 " +
                          (isDark ? "bg-secondary" : "bg-light")
                        }
                      >
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="card-title mb-1 fw-semibold">
                                {p.title}
                              </h6>
                              <p
                                className={
                                  "small mb-1 " +
                                  (isDark
                                    ? "text-light opacity-75"
                                    : "text-muted")
                                }
                              >
                                {p.category_label} · by {p.author} ·{" "}
                                {new Date(
                                  p.created_at
                                ).toLocaleString()}
                              </p>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeletePost(p.id)}
                            >
                              Delete post
                            </button>
                          </div>
                          <p className="small mb-2">{p.description}</p>
                          <p
                            className={
                              "small mb-0 " +
                              (isDark
                                ? "text-light opacity-75"
                                : "text-muted")
                            }
                          >
                            {p.comments?.length || 0} comments ·{" "}
                            {p.likes_count} likes · {p.dislikes_count} dislikes
                          </p>
                          {p.comments && p.comments.length > 0 && (
                            <div className="mt-2 pt-2 border-top">
                              <small className="fw-semibold d-block mb-1">
                                Comments:
                              </small>
                              {p.comments.slice(0, 3).map((c) => (
                                <div
                                  key={c.id}
                                  className="d-flex justify-content-between align-items-start py-1"
                                >
                                  <div className="flex-grow-1">
                                    <small className="fw-semibold">
                                      {c.author}:
                                    </small>
                                    <span className="ms-1">{c.text}</span>
                                    <div
                                      className={
                                        "small " +
                                        (isDark
                                          ? "text-light opacity-50"
                                          : "text-muted")
                                      }
                                    >
                                      {new Date(
                                        c.created_at
                                      ).toLocaleString()}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger py-0 px-1"
                                    onClick={() =>
                                      handleDeleteComment(c.id, p.id)
                                    }
                                  >
                                    Delete
                                  </button>
                                </div>
                              ))}
                              {p.comments.length > 3 && (
                                <small className="text-muted">
                                  ... and {p.comments.length - 3} more
                                </small>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
