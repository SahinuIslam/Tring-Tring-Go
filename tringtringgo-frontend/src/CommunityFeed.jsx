// src/pages/CommunityPage.jsx
import React, { useEffect, useState } from "react";

/* ---------- shared auth helper ---------- */

function getAuthMode() {
  const stored = localStorage.getItem("ttg_user");
  const parsed = stored ? JSON.parse(stored) : null;
  const role = parsed?.role || null;
  const mode = parsed?.mode || role || null;
  return { parsed, role, mode };
}

/* ---------- global theme helper ---------- */

function getInitialTheme() {
  const stored = localStorage.getItem("ttg_theme");
  return stored === "dark" || stored === "light" ? stored : "light";
}

/* ---------- TopBar (same style as Merchant/Traveler) ---------- */

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

  const path = window.location.pathname;
  const stored = localStorage.getItem("ttg_user");
  const parsed = stored ? JSON.parse(stored) : null;
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
    (isActive(name) ? " fw-semibold text-white bg-primary" : " text-light");

  return (
    <nav className="navbar navbar-expand-lg mb-3 topbar-bordered navbar-dark">
      <div className="container-fluid">
        <span className="navbar-brand brand-glow brand-glow-dark">
          TringTringGo
        </span>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#communityTopbarNav"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="communityTopbarNav">
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

/* ---------- constants ---------- */

const CATEGORY_OPTIONS = [
  { value: "ALL", label: "All Posts" },
  { value: "PRICE_ALERT", label: "Price Alerts" },
  { value: "TRAFFIC", label: "Traffic" },
  { value: "FOOD_TIPS", label: "Food Tips" },
  { value: "LOST_FOUND", label: "Lost & Found" },
];

/* ---------- main page wrapper with global theme ---------- */

function CommunityPage() {
  const [theme, setTheme] = useState(getInitialTheme);
  const isDark = theme === "dark";

  useEffect(() => {
    localStorage.setItem("ttg_theme", theme);
  }, [theme]);

  const outerBgClass = isDark ? "bg-black bg-gradient" : "bg-body-tertiary";
  const cardBgClass = isDark ? "bg-dark text-light" : "bg-white text-dark";

  const handleTopBarToggle = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

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
            <TopBar isDark={isDark} onToggleTheme={handleTopBarToggle} />
            <div className="d-flex flex-wrap align-items-center justify-content-between">
              <div className="mb-3 mb-lg-0">
                <h1
                  className={
                    "h3 mb-1 " + (isDark ? "text-light" : "text-white")
                  }
                >
                  Community Feed
                </h1>
                <p
                  className={
                    "mb-1 small " +
                    (isDark ? "text-light opacity-75" : "text-white-50")
                  }
                >
                  See real-time tips, alerts, and updates from travelers in your
                  city.
                </p>
              </div>
            </div>
          </div>

          <div className="card-body p-4">
            <CommunityFeed isDark={isDark} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- CommunityFeed ---------- */

function CommunityFeed({ isDark }) {
  const { parsed: parsedUser, mode } = getAuthMode();
  const isLoggedIn = !!parsedUser;
  const isTravelerMode = isLoggedIn && mode === "TRAVELER";
  const token = parsedUser?.token || parsedUser?.username || "";

  const [posts, setPosts] = useState([]);
  const [areas, setAreas] = useState([]);
  const [category, setCategory] = useState("ALL");
  const [areaId, setAreaId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // Load areas
  useEffect(() => {
    async function loadAreas() {
      try {
        const resp = await fetch("http://127.0.0.1:8000/api/travel/areas/");
        if (resp.ok) {
          const data = await resp.json();
          setAreas(data);
        }
      } catch (e) {
        console.error("Area load error:", e);
      }
    }
    loadAreas();
  }, []);

  // Load posts
  useEffect(() => {
    async function loadPosts() {
      try {
        setLoading(true);
        setError("");
        let url = "http://127.0.0.1:8000/api/community/posts/";
        const params = [];
        if (category && category !== "ALL") params.push(`category=${category}`);
        if (areaId) params.push(`area_id=${areaId}`);
        if (params.length) url += "?" + params.join("&");

        const resp = await fetch(url);
        const data = await resp.json().catch(() => []);
        if (!resp.ok) throw new Error(data.detail || "Failed to load posts");
        setPosts(data);
      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, [category, areaId]);

  // Like / dislike
  const handleLikeDislike = async (postId, reaction) => {
    try {
      if (!isLoggedIn) {
        alert("You must log in to react.");
        return;
      }
      if (!isTravelerMode) {
        alert("Switch to traveler mode to react.");
        return;
      }

      const resp = await fetch(
        `http://127.0.0.1:8000/api/community/posts/${postId}/react/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Token": token,
            "X-User-Mode": mode,
          },
          body: JSON.stringify({ reaction }),
        }
      );
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(body.detail || "Failed to react");

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likes_count: body.likes_count,
                dislikes_count: body.dislikes_count,
              }
            : p
        )
      );
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost((prev) => ({
          ...prev,
          likes_count: body.likes_count,
          dislikes_count: body.dislikes_count,
        }));
      }
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
    setShowNewPost(false);
  };

  // Load a single post with comments
  const openPostDetail = async (postId) => {
    try {
      const resp = await fetch(
        `http://127.0.0.1:8000/api/community/posts/${postId}/`
      );
      const body = await resp.json().catch(() => null);

      if (!resp.ok) throw new Error(body?.detail || "Failed to load post");

      const comments = Array.isArray(body?.comments) ? body.comments : [];

      const safePost = {
        id: body?.id ?? postId,
        title: body?.title || "",
        description: body?.description || "",
        category: body?.category || "PRICE_ALERT",
        author: body?.author || "Unknown",
        area: body?.area || "",
        created_at: body?.created_at || new Date().toISOString(),
        likes_count: body?.likes_count ?? 0,
        dislikes_count: body?.dislikes_count ?? 0,
        comments,
        comments_count: body?.comments_count ?? comments.length,
      };

      setSelectedPost(safePost);
    } catch (e) {
      console.error("openPostDetail error", e);
      alert(e.message);
    }
  };

  const mutedTextClass = isDark ? "text-secondary" : "text-muted";

  return (
    <>
      <style>{`
        .ttg-filter-chip {
          padding: 0.3rem 0.75rem;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          font-size: 0.8rem;
          cursor: pointer;
          background: #fff;
          color: #4b5563;
        }
        .ttg-filter-chip.active {
          background: #111827;
          color: white;
          border-color: #111827;
        }
        .ttg-post-card {
          border-bottom: 1px solid #e5e7eb;
          padding: 0.75rem 0;
        }
        .ttg-post-card:hover {
          background: #f9fafb;
        }
        .ttg-post-title {
          font-weight: 600;
          font-size: 0.95rem;
          color: #111827;
          cursor: pointer;
        }
        .ttg-post-meta {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0.15rem 0;
        }
        .ttg-post-desc {
          font-size: 0.85rem;
          color: #4b5563;
        }
        .ttg-post-footer {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 0.35rem;
          font-size: 0.75rem;
          color: #6b7280;
          align-items: center;
        }
        .ttg-reaction-btn {
          border: none;
          background: none;
          padding: 0;
          font-size: 0.75rem;
          color: #2563eb;
          cursor: pointer;
        }
        .ttg-reaction-btn:hover {
          text-decoration: underline;
        }
        .ttg-primary-pill {
          padding: 0.35rem 0.75rem;
          border: none;
          border-radius: 999px;
          background: #111827;
          color: white;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
        }
        .ttg-primary-pill-outline {
          padding: 0.3rem 0.7rem;
          border-radius: 999px;
          border: 1px solid #111827;
          background: white;
          color: #111827;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>

      <div className="mb-3">
        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
          <FilterBar category={category} onChange={setCategory} />
          <div className="ms-auto" style={{ minWidth: 160 }}>
            <select
              className="form-select form-select-sm"
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
            >
              <option value="">All areas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          className={showNewPost ? "ttg-primary-pill-outline" : "ttg-primary-pill"}
          onClick={() => {
            if (!isLoggedIn) {
              alert("You must log in to create posts.");
              return;
            }
            if (!isTravelerMode) {
              alert("Switch to traveler mode to create posts.");
              return;
            }
            setShowNewPost((p) => !p);
          }}
        >
          {showNewPost ? "Cancel" : "Create a post"}
        </button>
      </div>

      {showNewPost && (
        <NewPostForm
          token={token}
          mode={mode}
          isLoggedIn={isLoggedIn}
          isTravelerMode={isTravelerMode}
          areas={areas}
          onCreated={handlePostCreated}
        />
      )}

      {error && <p className={"small mb-2 text-danger"}>{error}</p>}

      {loading ? (
        <p className={"small mb-0 " + mutedTextClass}>Loading posts…</p>
      ) : posts.length === 0 ? (
        <p className={"small mb-0 " + mutedTextClass}>
          No posts yet for this filter.
        </p>
      ) : (
        posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            onOpen={() => openPostDetail(p.id)}
            onReact={handleLikeDislike}
          />
        ))
      )}

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          token={token}
          mode={mode}
          isLoggedIn={isLoggedIn}
          isTravelerMode={isTravelerMode}
          onClose={() => setSelectedPost(null)}
          onReact={handleLikeDislike}
          onUpdate={setSelectedPost}
        />
      )}
    </>
  );
}

/* ---------- components ---------- */

function FilterBar({ category, onChange }) {
  return (
    <div className="d-flex flex-wrap gap-2">
      {CATEGORY_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={
            "ttg-filter-chip" + (category === opt.value ? " active" : "")
          }
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function PostCard({ post, onOpen, onReact }) {
  const createdAt = post.created_at
    ? new Date(post.created_at).toLocaleString()
    : "";
  const commentsCount = post.comments_count ?? 0;
  const likesCount = post.likes_count ?? 0;
  const dislikesCount = post.dislikes_count ?? 0;

  return (
    <div className="ttg-post-card">
      <div className="ttg-post-title" onClick={onOpen}>
        {renderCategoryIcon(post.category)} {post.title}
      </div>
      <div className="ttg-post-meta">
        {post.author} • {createdAt} {post.area ? `• ${post.area}` : ""}
      </div>
      <div className="ttg-post-desc">
        {post.description && post.description.length > 140
          ? post.description.slice(0, 140) + "…"
          : post.description}
      </div>
      <div className="ttg-post-footer">
        <button type="button" className="ttg-reaction-btn" onClick={onOpen}>
          💬 {commentsCount} comments
        </button>
        <span>
          • 👍 {likesCount} • 👎 {dislikesCount}
        </span>
        <button
          type="button"
          className="ttg-reaction-btn"
          onClick={() => onReact(post.id, "LIKE")}
        >
          Like
        </button>
        <button
          type="button"
          className="ttg-reaction-btn"
          onClick={() => onReact(post.id, "DISLIKE")}
        >
          Dislike
        </button>
      </div>
    </div>
  );
}

function NewPostForm({
  token,
  mode,
  isLoggedIn,
  isTravelerMode,
  areas,
  onCreated,
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("PRICE_ALERT");
  const [areaId, setAreaId] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setError("You must log in to create posts.");
      return;
    }
    if (!isTravelerMode) {
      setError("Switch to traveler mode to create posts.");
      return;
    }
    if (!areaId) {
      setError("Please select an area.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const resp = await fetch("http://127.0.0.1:8000/api/community/posts/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Token": token,
          "X-User-Mode": mode,
        },
        body: JSON.stringify({
          title,
          category,
          area_id: areaId,
          description,
        }),
      });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(body.detail || "Failed to create post");
      onCreated(body);
      setTitle("");
      setCategory("PRICE_ALERT");
      setAreaId("");
      setDescription("");
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="border rounded-3 p-3 mb-3 bg-body-secondary"
      onSubmit={handleSubmit}
    >
      <h4 className="h6 mb-2">Create a community post</h4>
      {error && <p className="text-danger small mb-2">{error}</p>}
      <div className="mb-2">
        <label className="form-label small">Title</label>
        <input
          className="form-control form-control-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. 🚨 Price Alert: Nanna Biryani now ৳180"
        />
      </div>
      <div className="row g-2">
        <div className="col-md-4">
          <label className="form-label small">Category</label>
          <select
            className="form-select form-select-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORY_OPTIONS.filter((c) => c.value !== "ALL").map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-8">
          <label className="form-label small">Area</label>
          <select
            className="form-select form-select-sm"
            value={areaId}
            onChange={(e) => setAreaId(e.target.value)}
          >
            <option value="">Select area…</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-2 mb-2">
        <label className="form-label small">Description</label>
        <textarea
          className="form-control form-control-sm"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what happened, price, location details, etc."
        />
      </div>
      <button
        type="submit"
        className="btn btn-primary btn-sm rounded-pill"
        disabled={saving}
      >
        {saving ? "Posting..." : "Post"}
      </button>
    </form>
  );
}

function PostDetailModal({
  post,
  token,
  mode,
  isLoggedIn,
  isTravelerMode,
  onClose,
  onReact,
  onUpdate,
}) {
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const safePost = post || {};
  const comments = Array.isArray(safePost.comments) ? safePost.comments : [];
  const commentsCount = safePost.comments_count ?? comments.length ?? 0;
  const likesCount = safePost.likes_count ?? 0;
  const dislikesCount = safePost.dislikes_count ?? 0;
  const createdAt = safePost.created_at
    ? new Date(safePost.created_at).toLocaleString()
    : "";

  const handleAddComment = async () => {
    if (!isLoggedIn) {
      alert("You must log in to comment.");
      return;
    }
    if (!isTravelerMode) {
      alert("Switch to traveler mode to comment.");
      return;
    }
    if (!commentText.trim()) return;

    try {
      setSubmitting(true);

      const res = await fetch(
        `http://127.0.0.1:8000/api/community/posts/${safePost.id}/comments/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Token": token,
            "X-User-Mode": mode,
          },
          body: JSON.stringify({ text: commentText.trim() }),
        }
      );

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.detail || "Failed to add comment");

      onUpdate((prev) => {
        const prevPost = prev || {};
        const prevComments = Array.isArray(prevPost.comments)
          ? prevPost.comments
          : [];
        const prevCount =
          prevPost.comments_count ?? prevComments.length ?? 0;

        return {
          ...prevPost,
          comments: [body, ...prevComments],
          comments_count: prevCount + 1,
        };
      });

      setCommentText("");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={onClose}
      >
        <div
          style={{
            backgroundColor: "white",
            maxWidth: "640px",
            width: "90%",
            maxHeight: "80vh",
            overflowY: "auto",
            borderRadius: "12px",
            padding: "24px",
            zIndex: 10000,
            position: "relative",
            margin: "20px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#6b7280",
              zIndex: 10001,
            }}
            type="button"
          >
            ✕
          </button>

          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              marginTop: 0,
              marginRight: "30px",
            }}
          >
            {renderCategoryIcon(safePost.category)} {safePost.title}
          </h2>

          <p
            style={{
              color: "#4b5563",
              marginTop: "0.5rem",
              lineHeight: 1.5,
            }}
          >
            {safePost.description}
          </p>

          <p
            style={{
              fontSize: "0.75rem",
              marginTop: "0.5rem",
              color: "#6b7280",
            }}
          >
            {safePost.author} • {createdAt}{" "}
            {safePost.area ? `• ${safePost.area}` : ""}
          </p>

          <hr style={{ margin: "1rem 0", borderColor: "#e5e7eb" }} />

          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <button
              type="button"
              style={{
                background: "none",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                padding: "6px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.875rem",
              }}
              onClick={() => onReact(safePost.id, "LIKE")}
            >
              <span>👍</span>
              <span>{likesCount}</span>
            </button>
            <button
              type="button"
              style={{
                background: "none",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                padding: "6px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.875rem",
              }}
              onClick={() => onReact(safePost.id, "DISLIKE")}
            >
              <span>👎</span>
              <span>{dislikesCount}</span>
            </button>
          </div>

          <h3 style={{ fontWeight: 600, marginBottom: "0.75rem" }}>
            Comments ({commentsCount})
          </h3>

          <div style={{ marginBottom: "1.5rem" }}>
            <textarea
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{
                width: "100%",
                minHeight: "80px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                padding: "12px",
                fontSize: "0.875rem",
                resize: "vertical",
                fontFamily: "inherit",
              }}
              rows={3}
            />
            <button
              type="button"
              onClick={handleAddComment}
              disabled={submitting}
              style={{
                marginTop: "0.75rem",
                padding: "8px 16px",
                border: "none",
                borderRadius: "6px",
                background: "#111827",
                color: "white",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? "Posting..." : "Post Comment"}
            </button>
          </div>

          <div style={{ marginTop: "1rem" }}>
            {comments.length === 0 ? (
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  textAlign: "center",
                  padding: "20px",
                }}
              >
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <div
                      style={{ fontSize: "0.875rem", fontWeight: 600 }}
                    >
                      {c.author}
                    </div>
                    <div
                      style={{ fontSize: "0.7rem", color: "#6b7280" }}
                    >
                      {c.created_at
                        ? new Date(c.created_at).toLocaleString()
                        : ""}
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    {c.text}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------- icon helper ---------- */

function renderCategoryIcon(cat) {
  switch (cat) {
    case "PRICE_ALERT":
      return "💲";
    case "TRAFFIC":
      return "🚦";
    case "FOOD_TIPS":
      return "🍔";
    case "LOST_FOUND":
      return "🔎";
    default:
      return "📌";
  }
}

export default CommunityPage;
