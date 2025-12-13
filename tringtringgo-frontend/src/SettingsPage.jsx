import React, { useEffect, useState } from "react";

function SettingsPage() {
  const stored = localStorage.getItem("ttg_user");
  const parsed = stored ? JSON.parse(stored) : null;
  const token = parsed?.token || parsed?.username || "";
  const role = parsed?.role || parsed?.mode || "TRAVELER";

  const [settings, setSettings] = useState({
    notify_community: true,
    notify_chat: true,
    notify_merchant_updates: true,
    show_public_username: true,
  });

  const [profileForm, setProfileForm] = useState({
    username: parsed?.username || "",
    email: parsed?.email || "",
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [editingUsername, setEditingUsername] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // load settings
  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("You are not logged in.");
      return;
    }
    async function loadSettings() {
      try {
        setLoading(true);
        const resp = await fetch(
          "http://127.0.0.1:8000/api/accounts/settings/",
          {
            headers: { "X-User-Token": token },
          }
        );
        if (resp.ok) {
          const data = await resp.json();
          setSettings((prev) => ({ ...prev, ...data }));
        }
        setError("");
      } catch (e) {
        console.error(e);
        setError("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [token]);

  const handleToggle = (name) => {
    setSettings((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSettingsSave = async () => {
    if (!token) return;
    try {
      setSavingSettings(true);
      setMessage("");
      setError("");
      const resp = await fetch(
        "http://127.0.0.1:8000/api/accounts/settings/",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-User-Token": token,
          },
          body: JSON.stringify(settings),
        }
      );
      if (!resp.ok) {
        throw new Error("Failed to save settings.");
      }
      const data = await resp.json();
      setSettings(data);
      setMessage("Settings saved.");
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async () => {
    if (!token) return;
    setError("");
    setMessage("");

    // only validate password if user is actually changing it
    if (
      profileForm.new_password ||
      profileForm.confirm_password ||
      profileForm.old_password
    ) {
      if (!profileForm.new_password || !profileForm.old_password) {
        setError("Please fill old and new password.");
        return;
      }
      if (profileForm.new_password !== profileForm.confirm_password) {
        setError("New password and confirm password do not match.");
        return;
      }
    }

    try {
      setSavingProfile(true);
      const payload = {
        username: profileForm.username,
        email: profileForm.email,
      };

      if (profileForm.new_password) {
        payload.old_password = profileForm.old_password;
        payload.new_password = profileForm.new_password;
      }

      const resp = await fetch(
        "http://127.0.0.1:8000/api/accounts/profile/",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-User-Token": token,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to update profile.");
      }
      const data = await resp.json();

      const updated = {
        ...parsed,
        username: data.username,
        email: data.email,
        token: data.token,
      };
      localStorage.setItem("ttg_user", JSON.stringify(updated));

      setMessage(
        profileForm.new_password
          ? "Profile updated. Please log in again with your new credentials."
          : "Profile updated."
      );

      setProfileForm((prev) => ({
        ...prev,
        old_password: "",
        new_password: "",
        confirm_password: "",
      }));
      setShowPasswordSection(false);
      setEditingUsername(false);
      setEditingEmail(false);

      if (profileForm.new_password || data.token !== token) {
        localStorage.removeItem("ttg_user");
        localStorage.removeItem("userToken");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
      }
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!token) return;
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your account? This cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      const resp = await fetch(
        "http://127.0.0.1:8000/api/accounts/delete-account/",
        {
          method: "DELETE",
          headers: { "X-User-Token": token },
        }
      );
      if (!resp.ok && resp.status !== 204) {
        throw new Error("Failed to delete account.");
      }
      localStorage.removeItem("ttg_user");
      localStorage.removeItem("userToken");
      window.location.href = "/home";
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <h2>Settings</h2>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <h2>Settings</h2>
          <p>You need to log in to manage settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <h2>Settings</h2>
        {message && <p style={{ color: "green" }}>{message}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* Profile section */}
        <h3 style={{ marginTop: "1rem" }}>Profile</h3>
        <div style={{ maxWidth: "480px" }}>
          {/* Username row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              marginBottom: "0.75rem",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                Username
              </div>
              {!editingUsername ? (
                <div style={{ fontSize: "0.95rem", fontWeight: 500 }}>
                  {profileForm.username}
                </div>
              ) : (
                <input
                  type="text"
                  name="username"
                  value={profileForm.username}
                  onChange={handleProfileChange}
                  className="form-control"
                  style={{ marginTop: "0.25rem" }}
                />
              )}
            </div>
            {!editingUsername ? (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setEditingUsername(true)}
              >
                Change
              </button>
            ) : (
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleProfileSave}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-link btn-sm"
                  onClick={() => {
                    setEditingUsername(false);
                    setProfileForm((prev) => ({
                      ...prev,
                      username: parsed?.username || prev.username,
                    }));
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Email row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              marginBottom: "0.75rem",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                Email
              </div>
              {!editingEmail ? (
                <div style={{ fontSize: "0.95rem", fontWeight: 500 }}>
                  {profileForm.email}
                </div>
              ) : (
                <input
                  type="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  className="form-control"
                  style={{ marginTop: "0.25rem" }}
                />
              )}
            </div>
            {!editingEmail ? (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setEditingEmail(true)}
              >
                Change
              </button>
            ) : (
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleProfileSave}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-link btn-sm"
                  onClick={() => {
                    setEditingEmail(false);
                    setProfileForm((prev) => ({
                      ...prev,
                      email: parsed?.email || prev.email,
                    }));
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Password section */}
        <h4 style={{ marginTop: "1.5rem", fontSize: "1rem" }}>Password</h4>

        {!showPasswordSection ? (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setShowPasswordSection(true)}
          >
            Change password
          </button>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gap: "0.6rem",
                maxWidth: "420px",
                marginTop: "0.6rem",
              }}
            >
              <label style={{ fontSize: "0.9rem" }}>
                Current password
                <input
                  type="password"
                  name="old_password"
                  value={profileForm.old_password}
                  onChange={handleProfileChange}
                  className="form-control"
                  style={{ marginTop: "0.2rem" }}
                />
              </label>
              <label style={{ fontSize: "0.9rem" }}>
                New password
                <input
                  type="password"
                  name="new_password"
                  value={profileForm.new_password}
                  onChange={handleProfileChange}
                  className="form-control"
                  style={{ marginTop: "0.2rem" }}
                />
              </label>
              <label style={{ fontSize: "0.9rem" }}>
                Confirm new password
                <input
                  type="password"
                  name="confirm_password"
                  value={profileForm.confirm_password}
                  onChange={handleProfileChange}
                  className="form-control"
                  style={{ marginTop: "0.2rem" }}
                />
              </label>
            </div>
            <button
              type="button"
              className="btn btn-link btn-sm"
              onClick={() => {
                setShowPasswordSection(false);
                setProfileForm((prev) => ({
                  ...prev,
                  old_password: "",
                  new_password: "",
                  confirm_password: "",
                }));
              }}
              style={{ paddingLeft: 0, marginTop: "0.4rem" }}
            >
              Cancel password change
            </button>
          </>
        )}

        {showPasswordSection && (
          <button
            className="btn btn-primary btn-sm"
            style={{ marginTop: "0.8rem" }}
            onClick={handleProfileSave}
            disabled={savingProfile}
          >
            {savingProfile ? "Saving..." : "Save profile"}
          </button>
        )}

        {/* Notifications section */}
        <h3 style={{ marginTop: "1.5rem" }}>Notifications</h3>
        <div style={{ fontSize: "0.9rem" }}>
          <label style={{ display: "block", marginBottom: "0.4rem" }}>
            <input
              type="checkbox"
              checked={settings.notify_community}
              onChange={() => handleToggle("notify_community")}
              style={{ marginRight: "0.4rem" }}
            />
            Community posts in my area
          </label>

          <label style={{ display: "block", marginBottom: "0.4rem" }}>
            <input
              type="checkbox"
              checked={settings.notify_chat}
              onChange={() => handleToggle("notify_chat")}
              style={{ marginRight: "0.4rem" }}
            />
            Direct chat messages
          </label>

          {role === "MERCHANT" && (
            <label style={{ display: "block", marginBottom: "0.4rem" }}>
              <input
                type="checkbox"
                checked={settings.notify_merchant_updates}
                onChange={() => handleToggle("notify_merchant_updates")}
                style={{ marginRight: "0.4rem" }}
              />
              Merchant verification / status updates
            </label>
          )}
        </div>

        <h3 style={{ marginTop: "1.5rem" }}>Privacy</h3>
        <label style={{ fontSize: "0.9rem" }}>
          <input
            type="checkbox"
            checked={settings.show_public_username}
            onChange={() => handleToggle("show_public_username")}
            style={{ marginRight: "0.4rem" }}
          />
          Show my username publicly on reviews & community posts
        </label>

        <div style={{ marginTop: "1rem" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleSettingsSave}
            disabled={savingSettings}
          >
            {savingSettings ? "Saving..." : "Save notification settings"}
          </button>
        </div>

        <hr style={{ margin: "1.5rem 0" }} />

        <h3>Danger zone</h3>
        <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
          Deleting your account will remove your profile, saved places, and chat
          history. This cannot be undone.
        </p>
        <button
          className="btn btn-danger btn-sm"
          onClick={handleDeleteAccount}
        >
          Delete my account
        </button>
      </div>
    </div>
  );
}

export default SettingsPage;
