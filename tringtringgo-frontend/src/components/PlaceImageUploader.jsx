// src/components/PlaceImageUploader.jsx
import React, { useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

function PlaceImageUploader({ placeId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const storedUser = localStorage.getItem("ttg_user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    const token = parsedUser?.token || parsedUser?.username || "";

    const formData = new FormData();
    formData.append("image", file);

    setSaving(true);
    setError("");
    try {
      const resp = await fetch(
        `${API_BASE}/api/travel/places/${placeId}/upload-image/`,
        {
          method: "PATCH",
          headers: { "X-User-Token": token },
          body: formData,
        }
      );
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setError(body.detail || "Failed to upload image");
        return;
      }
      if (onUploaded) onUploaded(body);
    } catch (err) {
      console.error(err);
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <input
        type="file"
        accept="image/*"
        className="form-control form-control-sm mb-2"
        onChange={(e) => setFile(e.target.files[0] || null)}
      />
      <button
        type="submit"
        className="btn btn-sm btn-outline-primary rounded-pill"
        disabled={saving || !file}
      >
        {saving ? "Uploading..." : "Upload image"}
      </button>
      {error && <div className="small text-danger mt-1">{error}</div>}
    </form>
  );
}

export default PlaceImageUploader;
