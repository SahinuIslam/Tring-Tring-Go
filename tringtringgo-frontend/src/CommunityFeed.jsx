// src/CommunityFeed.jsx
import React, { useEffect, useState } from "react";

/* ---------- TopBar: same as dashboards ---------- */
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
  const role = parsed?.role || "TRAVELER";

  // Decide dashboard link by role
  const dashboardHref =
    role === "MERCHANT"
      ? "/merchant"
      : role === "ADMIN"
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

  const linkStyle = (name) => ({
    textDecoration: "none",
    fontSize: "0.95rem",
    color: isActive(name) ? "#1f2937" : "#4b5563",
    fontWeight: isActive(name) ? 700 : 500,
    borderBottom: isActive(name)
      ? "2px solid #1f2937"
      : "2px solid transparent",
    paddingBottom: "0.1rem",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "1rem",
        borderBottom: "1px solid #e5e7eb",
        paddingBottom: "1rem",
        paddingTop: "0.5rem",
        paddingInline: "1rem",
        flexWrap: "wrap",
        gap: "0.75rem",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#1f2937" }}>
        TringTringGo
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1.25rem",
          fontSize: "0.95rem",
          flexWrap: "wrap",
        }}
      >
        <nav style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
          <a href="/home" style={linkStyle("home")}>
            Home
          </a>
          <a href="/explore" style={linkStyle("explore")}>
            Explore
          </a>
          <a href="/community" style={linkStyle("community")}>
            Community
          </a>
          <a href="/services" style={linkStyle("services")}>
            Services
          </a>
          <a href={dashboardHref} style={linkStyle("dashboard")}>
            Dashboard
          </a>
        </nav>

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

/* ---------- Community feed ---------- */

const CATEGORY_OPTIONS = [
  { value: "ALL", label: "All Posts" },
  { value: "PRICE_ALERT", label: "Price Alerts" },
  { value: "TRAFFIC", label: "Traffic" },
  { value: "FOOD_TIPS", label: "Food Tips" },
  { value: "LOST_FOUND", label: "Lost & Found" },
];

function CommunityFeed() {
  const [posts, setPosts] = useState([]);
  const [areas, setAreas] = useState([]);
  const [category, setCategory] = useState("ALL");
  const [areaId, setAreaId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  const token = (() => {
    const stored = localStorage.getItem("ttg_user");
    const parsed = stored ? JSON.parse(stored) : null;
    return parsed?.token || parsed?.username || "";
  })();

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

  const handleLikeDislike = async (postId, reaction) => {
    try {
      if (!token) {
        alert("Log in as traveler to react.");
        return;
      }
      const resp = await fetch(
        `http://127.0.0.1:8000/api/community/posts/${postId}/react/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Token": token,
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

  const openPostDetail = async (postId) => {
    try {
      const resp = await fetch(
        `http://127.0.0.1:8000/api/community/posts/${postId}/`
      );
      const body = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(body?.detail || "Failed to load post");
      if (!Array.isArray(body.comments)) body.comments = [];
      setSelectedPost(body);
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  };

  return (
    <div className="dashboard-page flex justify-center p-4 min-h-screen bg-gray-50">
      <style>{`
        .dashboard-card {
          width: 100%;
          max-width: 900px;
          background: white;
          padding: 2rem;
          border-radius: 0.75rem;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1),
                      0 2px 4px -2px rgba(0,0,0,0.1);
        }
        .community-container {
          margin-top: 0.5rem;
        }
        /* rest of your community styles unchanged */
        .feed-header {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-bottom: 0.75rem;
        }
        .feed-header h2 {
          font-size: 1.4rem;
          font-weight: 700;
          color: #111827;
        }
        .feed-header p {
          font-size: 0.9rem;
          color: #6b7280;
        }
        .filter-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        .filter-chip {
          padding: 0.3rem 0.75rem;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          font-size: 0.8rem;
          cursor: pointer;
          background: #fff;
          color: #4b5563;
        }
        .filter-chip.active {
          background: #111827;
          color: white;
          border-color: #111827;
        }
        .area-select {
          margin-left: auto;
          min-width: 140px;
        }
        .area-select select {
          width: 100%;
          font-size: 0.8rem;
          padding: 0.25rem 0.4rem;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          color: #374151;
          background: #fff;
        }
        .post-card {
          border-bottom: 1px solid #e5e7eb;
          padding: 0.75rem 0;
        }
        .post-card:hover {
          background: #f9fafb;
        }
        .post-title {
          font-weight: 600;
          font-size: 0.95rem;
          color: #111827;
          cursor: pointer;
        }
        .post-meta {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0.15rem 0;
        }
        .post-desc {
          font-size: 0.85rem;
          color: #4b5563;
        }
        .post-footer {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 0.35rem;
          font-size: 0.75rem;
          color: #6b7280;
          align-items: center;
        }
        .reaction-btn {
          border: none;
          background: none;
          padding: 0;
          font-size: 0.75rem;
          color: #2563eb;
          cursor: pointer;
        }
        .reaction-btn:hover {
          text-decoration: underline;
        }
        .primary-btn {
          padding: 0.35rem 0.75rem;
          border: none;
          border-radius: 999px;
          background: #111827;
          color: white;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
        }
        .primary-btn-outline {
          padding: 0.3rem 0.7rem;
          border-radius: 999px;
          border: 1px solid #111827;
          background: white;
          color: #111827;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
        }
        .new-post-form {
          margin-top: 0.75rem;
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
        }
        .new-post-form label {
          display: block;
          font-size: 0.8rem;
          margin-bottom: 0.15rem;
          color: #4b5563;
        }
        .new-post-form input,
        .new-post-form select,
        .new-post-form textarea {
          width: 100%;
          font-size: 0.8rem;
          padding: 0.3rem 0.4rem;
          border-radius: 0.375rem;
          border: 1px solid #d1d5db;
          margin-bottom: 0.5rem;
        }
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 40;
        }
        .modal {
          background: white;
          max-width: 640px;
          width: 100%;
          padding: 1rem;
          border-radius: 0.75rem;
          max-height: 90vh;
          overflow-y: auto;
        }
      `}</style>

      <div className="dashboard-card">
        <TopBar />

        <div className="community-container">
          <div className="feed-header">
            <h2>Community Feed</h2>
            <p>Stay updated with the latest from Dhaka&apos;s community</p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
              marginBottom: "0.5rem",
            }}
          >
            <FilterBar category={category} onChange={setCategory} />
            <div className="area-select">
              <select
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
              >
                <option value="">All Areas</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

<div style={{ marginBottom: "0.75rem" }}>
  <button
    type="button"
    className={showNewPost ? "primary-btn-outline" : "primary-btn"}
    onClick={() => {
      if (!token) {
        alert("You must be logged in as traveler to post.");
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
              areas={areas}
              onCreated={handlePostCreated}
            />
          )}

          {error && (
            <p style={{ color: "#b91c1c", fontSize: "0.85rem" }}>{error}</p>
          )}
          {loading ? (
            <p style={{ fontSize: "0.85rem" }}>Loading posts...</p>
          ) : posts.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
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
              onClose={() => setSelectedPost(null)}
              onReact={handleLikeDislike}
              onUpdate={setSelectedPost}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* --- rest of components (same as you have) --- */

function FilterBar({ category, onChange }) {
  return (
    <div className="filter-bar">
      {CATEGORY_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={
            "filter-chip" + (category === opt.value ? " active" : "")
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
  return (
    <div className="post-card">
      <div className="post-title" onClick={onOpen}>
        {renderCategoryIcon(post.category)} {post.title}
      </div>
      <div className="post-meta">
        {post.author} • {new Date(post.created_at).toLocaleString()}{" "}
        {post.area ? `• ${post.area}` : ""}
      </div>
      <div className="post-desc">
        {post.description.length > 140
          ? post.description.slice(0, 140) + "…"
          : post.description}
      </div>
      <div className="post-footer">
        <button type="button" className="reaction-btn" onClick={onOpen}>
          💬 {post.comments_count} comments
        </button>
        <span>
          • 👍 {post.likes_count} • 👎 {post.dislikes_count}
        </span>
        <button
          type="button"
          className="reaction-btn"
          onClick={() => onReact(post.id, "LIKE")}
        >
          Like
        </button>
        <button
          type="button"
          className="reaction-btn"
          onClick={() => onReact(post.id, "DISLIKE")}
        >
          Dislike
        </button>
      </div>
    </div>
  );
}

function NewPostForm({ token, areas, onCreated }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("PRICE_ALERT");
  const [areaId, setAreaId] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("You must be logged in as traveler to post.");
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
    <form className="new-post-form" onSubmit={handleSubmit}>
      <h4
        style={{
          fontSize: "0.9rem",
          fontWeight: 600,
          marginBottom: "0.35rem",
        }}
      >
        Create a community post
      </h4>
      {error && (
        <p
          style={{
            color: "#b91c1c",
            fontSize: "0.8rem",
            marginBottom: "0.4rem",
          }}
        >
          {error}
        </p>
      )}
      <label>Title</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. 🚨 Price Alert: Nanna Biryani now ৳180"
      />
      <label>Category</label>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        {CATEGORY_OPTIONS.filter((c) => c.value !== "ALL").map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <label>Area</label>
      <select
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
      <label>Description</label>
      <textarea
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe what happened, price, location details, etc."
      />
      <button type="submit" className="primary-btn" disabled={saving}>
        {saving ? "Posting..." : "Post"}
      </button>
    </form>
  );
}

function PostDetailModal({ post, token, onClose, onReact, onUpdate }) {
  const [commentText, setCommentText] = useState("");
  const [savingComment, setSavingComment] = useState(false);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("Log in as traveler to comment.");
      return;
    }
    if (!commentText.trim()) return;

    setSavingComment(true);
    try {
      const resp = await fetch(
        `http://127.0.0.1:8000/api/community/posts/${post.id}/comments/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Token": token,
          },
          body: JSON.stringify({ text: commentText }),
        }
      );
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(body.detail || "Failed to add comment");

      const newComment = {
        id: body.id,
        author: body.author,
        text: body.text,
        created_at: body.created_at,
      };

      onUpdate({
        ...post,
        comments: [...post.comments, newComment],
        comments_count: body.comments_count,
      });

      setCommentText("");
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setSavingComment(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "0.5rem",
          }}
        >
          <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>
            {renderCategoryIcon(post.category)} {post.title}
          </h3>
          <button
            type="button"
            className="reaction-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div
          style={{
            fontSize: "0.8rem",
            color: "#6b7280",
            marginBottom: "0.3rem",
          }}
        >
          {post.author} • {new Date(post.created_at).toLocaleString()}{" "}
          {post.area ? `• ${post.area}` : ""}
        </div>
        <p
          style={{
            fontSize: "0.9rem",
            color: "#374151",
            marginBottom: "0.5rem",
          }}
        >
          {post.description}
        </p>
        <div className="post-footer" style={{ marginBottom: "0.5rem" }}>
          <span>
            💬 {post.comments_count} comments • 👍 {post.likes_count} • 👎{" "}
            {post.dislikes_count}
          </span>
          <button
            type="button"
            className="reaction-btn"
            onClick={() => onReact(post.id, "LIKE")}
          >
            Like
          </button>
          <button
            type="button"
            className="reaction-btn"
            onClick={() => onReact(post.id, "DISLIKE")}
          >
            Dislike
          </button>
        </div>

        <h4
          style={{
            fontSize: "0.9rem",
            fontWeight: 600,
            marginBottom: "0.25rem",
          }}
        >
          Comments
        </h4>
        {post.comments.length === 0 ? (
          <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            No comments yet.
          </p>
        ) : (
          <div style={{ marginBottom: "0.5rem" }}>
            {post.comments.map((c) => (
              <div key={c.id} style={{ marginBottom: "0.3rem" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                  {c.author}{" "}
                  <span
                    style={{ fontWeight: 400, color: "#9ca3af", marginLeft: 4 }}
                  >
                    • {new Date(c.created_at).toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "#374151" }}>
                  {c.text}
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleComment}>
          <textarea
            rows={2}
            style={{
              width: "100%",
              fontSize: "0.8rem",
              padding: "0.3rem 0.4rem",
              borderRadius: "0.375rem",
              border: "1px solid #d1d5db",
              marginBottom: "0.35rem",
            }}
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <button
            type="submit"
            className="primary-btn"
            disabled={savingComment}
          >
            {savingComment ? "Posting..." : "Comment"}
          </button>
        </form>
      </div>
    </div>
  );
}

function renderCategoryIcon(cat) {
  switch (cat) {
    case "PRICE_ALERT":
      return "🚨";
    case "TRAFFIC":
      return "🚗";
    case "FOOD_TIPS":
      return "🍽️";
    case "LOST_FOUND":
      return "🧭";
    default:
      return "📌";
  }
}

export default CommunityFeed;
