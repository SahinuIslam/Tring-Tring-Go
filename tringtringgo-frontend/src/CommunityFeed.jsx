import React, { useEffect, useState } from "react";

/* ---------- helpers ---------- */

function getAuthMode() {
  const stored = localStorage.getItem("ttg_user");
  const parsed = stored ? JSON.parse(stored) : null;
  const role = parsed?.role || null;
  const mode = parsed?.mode || role || null;
  return { parsed, role, mode };
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
  const { parsed: parsedUser, role: userRole, mode: userMode } = getAuthMode();
  const isLoggedIn = !!parsedUser;
  const isTravelerMode = isLoggedIn && userMode === "TRAVELER";
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
  const handleReact = async (postId, reaction) => {
    if ((userRole === 'MERCHANT' || userRole === 'ADMIN') && userMode !== 'TRAVELER') {
      if (userRole === 'ADMIN') {
        alert("Admins cannot react to posts. Only travelers can react.");
      } else {
        alert("Switch to traveler mode from your merchant dashboard to react");
      }
      return;
    }

    try {
      const resp = await fetch(
        `http://127.0.0.1:8000/api/community/posts/${postId}/react/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Token": token,
            "X-User-Mode": userMode,
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
      `}</style>

      <div className="dashboard-card">
        <div className="community-container">
          <div className="feed-header">
            <h2>Community Feed</h2>
            {(userRole === 'MERCHANT' || userRole === 'ADMIN') && userMode !== 'TRAVELER' && (
  <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "1rem" }}>
    {userRole === 'ADMIN' ? "Admins cannot post/react" : "Switch to traveler mode to post/react"}
  </p>
)}

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
                if (!isLoggedIn) {
                  alert("You must log in to create posts.");
                  return;
                }
                if ((userRole === 'MERCHANT' || userRole === 'ADMIN') && userMode !== 'TRAVELER') {
                  alert(userRole === 'ADMIN' ? "Admins cannot create posts. Only travelers can post." : "Switch to traveler mode from your merchant dashboard to create posts.");
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
              mode={userMode}
              isLoggedIn={isLoggedIn}
              isTravelerMode={isTravelerMode}
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
                onReact={handleReact}
                />
            ))
          )}

          {selectedPost && (
            <PostDetailModal
              post={selectedPost}
              token={token}
              mode={userMode}
              isLoggedIn={isLoggedIn}
              isTravelerMode={isTravelerMode}
              onClose={() => setSelectedPost(null)}
              onReact={handleReact}
              onUpdate={setSelectedPost}
            />
          )}
        </div>
      </div>
    </div>
  );

}


/* ---------- components ---------- */

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
  const createdAt = post.created_at
    ? new Date(post.created_at).toLocaleString()
    : "";
  const commentsCount = post.comments_count ?? 0;
  const likesCount = post.likes_count ?? 0;
  const dislikesCount = post.dislikes_count ?? 0;

  return (
    <div className="post-card">
      <div className="post-title" onClick={onOpen}>
        {renderCategoryIcon(post.category)} {post.title}
      </div>
      <div className="post-meta">
        {post.author} • {createdAt} {post.area ? `• ${post.area}` : ""}
      </div>
      <div className="post-desc">
        {post.description && post.description.length > 140
          ? post.description.slice(0, 140) + "…"
          : post.description}
      </div>
      <div className="post-footer">
        <button type="button" className="reaction-btn" onClick={onOpen}>
          💬 {commentsCount} comments
        </button>
        <span>
          • 👍 {likesCount} • 👎 {dislikesCount}
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
    // Check if user is a merchant/admin and NOT in traveler mode
    const { role } = getAuthMode();
    if ((role === 'MERCHANT' || role === 'ADMIN') && mode !== 'TRAVELER') {
      setError(role === 'ADMIN' ? "Admins cannot create posts. Only travelers can post." : "Switch to traveler mode to create posts.");
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
    const { role } = getAuthMode();
    if ((role === 'MERCHANT' || role === 'ADMIN') && mode !== 'TRAVELER') {
      alert(role === 'ADMIN' ? "Admins cannot comment on posts. Only travelers can comment." : "Switch to traveler mode from your merchant dashboard to comment.");
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

export default CommunityFeed;
