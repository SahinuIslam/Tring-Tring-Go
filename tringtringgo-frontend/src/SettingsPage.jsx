// src/pages/SettingsPage.jsx
import React, { useEffect, useState } from "react";

function getInitialTheme() {
  const stored = localStorage.getItem("ttg_theme");
  return stored === "dark" || stored === "light" ? stored : "light";
}

function SettingsPage() {
  const storedUser = localStorage.getItem("ttg_user");
  const parsed = storedUser ? JSON.parse(storedUser) : null;
  const token = parsed?.token || parsed?.username || "";
  const role = parsed?.role || parsed?.mode || "TRAVELER";

  // global theme state for this page
  const [theme, setTheme] = useState(getInitialTheme);
  const isDark = theme === "dark";

  const [settings, setSettings] = useState({
    notify_community: true,
    notify_chat: true,
    notify_merchant_updates: true,
    show_public_username: true,
    theme: getInitialTheme(), // start from global
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

  // keep localStorage in sync when theme state changes
  useEffect(() => {
    localStorage.setItem("ttg_theme", theme);
  }, [theme]);

  // load settings, including theme
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
          setSettings((prev) => ({
            ...prev,
            ...data,
            theme: data.theme || prev.theme,
          }));
          if (data.theme === "dark" || data.theme === "light") {
            setTheme(data.theme);
          }
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
      if (data.theme === "dark" || data.theme === "light") {
        setTheme(data.theme); // update page theme immediately
        localStorage.setItem("ttg_theme", data.theme);
      }
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

  const outerBgClass = isDark ? "bg-black bg-gradient" : "bg-body-tertiary";
  const cardBgClass = isDark ? "bg-dark text-light" : "bg-white text-dark";
  const headerClass =
    "card-header border-0 py-3 px-4 " +
    (isDark ? "bg-primary text-light" : "bg-primary text-white");

  if (loading) {
    return (
      <div className={outerBgClass + " min-vh-100 py-4"}>
        <div className="container">
          <div className={"card shadow-lg border-0 rounded-4 " + cardBgClass}>
            <div className="card-body p-4">
              <h2 className="h4 mb-2">Settings</h2>
              <p className="mb-0 small text-muted">Loading settings…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className={outerBgClass + " min-vh-100 py-4"}>
        <div className="container">
          <div className={"card shadow-lg border-0 rounded-4 " + cardBgClass}>
            <div className="card-body p-4">
              <h2 className="h4 mb-2">Settings</h2>
              <p className="mb-0 small text-muted">
                You need to log in to manage settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={outerBgClass + " min-vh-100 py-4"}>
      <div className="container">
        <div className={"card shadow-lg border-0 rounded-4 " + cardBgClass}>
          <div className={headerClass}>
            <h1 className="h4 mb-1">Settings</h1>
            <p className="small mb-0" style={{ opacity: 0.8 }}>
              Manage your profile, notifications, privacy, and app appearance.
            </p>
          </div>

          <div className="card-body p-4">
            {message && (
              <p className="small mb-2" style={{ color: "lightgreen" }}>
                {message}
              </p>
            )}
            {error && (
              <p className="small mb-2" style={{ color: "#f87171" }}>
                {error}
              </p>
            )}

            {/* Profile section */}
            <h3 className="h6 text-uppercase mb-3 text-muted">Profile</h3>
            <div style={{ maxWidth: "520px" }}>
              {/* Username row */}
              <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
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
                      className="form-control form-control-sm mt-1"
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
                  <div className="d-flex gap-1">
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
              <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
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
                      className="form-control form-control-sm mt-1"
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
                  <div className="d-flex gap-1">
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
            <h4 className="h6 text-uppercase mt-4 mb-2 text-muted">
              Password
            </h4>

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
                      className="form-control form-control-sm mt-1"
                    />
                  </label>
                  <label style={{ fontSize: "0.9rem" }}>
                    New password
                    <input
                      type="password"
                      name="new_password"
                      value={profileForm.new_password}
                      onChange={handleProfileChange}
                      className="form-control form-control-sm mt-1"
                    />
                  </label>
                  <label style={{ fontSize: "0.9rem" }}>
                    Confirm new password
                    <input
                      type="password"
                      name="confirm_password"
                      value={profileForm.confirm_password}
                      onChange={handleProfileChange}
                      className="form-control form-control-sm mt-1"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  className="btn btn-link btn-sm ps-0 mt-2"
                  onClick={() => {
                    setShowPasswordSection(false);
                    setProfileForm((prev) => ({
                      ...prev,
                      old_password: "",
                      new_password: "",
                      confirm_password: "",
                    }));
                  }}
                >
                  Cancel password change
                </button>
              </>
            )}

            {showPasswordSection && (
              <button
                className="btn btn-primary btn-sm mt-2"
                onClick={handleProfileSave}
                disabled={savingProfile}
              >
                {savingProfile ? "Saving..." : "Save profile"}
              </button>
            )}

            {/* Notifications & theme / privacy */}
            <div className="row mt-4 g-4">
              <div className="col-lg-6">
                <div className="border rounded-3 p-3 h-100">
                  <h3 className="h6 text-uppercase mb-2 text-muted">
                    Notifications
                  </h3>
                  <div style={{ fontSize: "0.9rem" }}>
                    <label className="d-block mb-2">
                      <input
                        type="checkbox"
                        checked={settings.notify_community}
                        onChange={() => handleToggle("notify_community")}
                        style={{ marginRight: "0.4rem" }}
                      />
                      Community posts in my area
                    </label>

                    <label className="d-block mb-2">
                      <input
                        type="checkbox"
                        checked={settings.notify_chat}
                        onChange={() => handleToggle("notify_chat")}
                        style={{ marginRight: "0.4rem" }}
                      />
                      Direct chat messages
                    </label>

                    {role === "MERCHANT" && (
                      <label className="d-block mb-2">
                        <input
                          type="checkbox"
                          checked={settings.notify_merchant_updates}
                          onChange={() =>
                            handleToggle("notify_merchant_updates")
                          }
                          style={{ marginRight: "0.4rem" }}
                        />
                        Merchant verification / status updates
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="border rounded-3 p-3 h-100">
                  <h3 className="h6 text-uppercase mb-2 text-muted">
                    Appearance & privacy
                  </h3>
                  <div style={{ fontSize: "0.9rem" }}>
                    <div className="mb-2">
                      <span className="d-block mb-1">Theme</span>
                      <label style={{ marginRight: "1rem" }}>
                        <input
                          type="radio"
                          name="theme"
                          value="light"
                          checked={settings.theme === "light"}
                          onChange={() => {
                            setSettings((prev) => ({
                              ...prev,
                              theme: "light",
                            }));
                            setTheme("light");
                          }}
                          style={{ marginRight: "0.35rem" }}
                        />
                        Light mode
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="theme"
                          value="dark"
                          checked={settings.theme === "dark"}
                          onChange={() => {
                            setSettings((prev) => ({
                              ...prev,
                              theme: "dark",
                            }));
                            setTheme("dark");
                          }}
                          style={{ marginRight: "0.35rem" }}
                        />
                        Dark mode
                      </label>
                    </div>

                    <label style={{ fontSize: "0.9rem" }}>
                      <input
                        type="checkbox"
                        checked={settings.show_public_username}
                        onChange={() => handleToggle("show_public_username")}
                        style={{ marginRight: "0.4rem" }}
                      />
                      Show my username publicly on reviews & community posts
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleSettingsSave}
                disabled={savingSettings}
              >
                {savingSettings
                  ? "Saving..."
                  : "Save notification & theme settings"}
              </button>
            </div>

            <hr className="my-4" />

            <h3 className="h6 text-uppercase mb-2 text-danger">Danger zone</h3>
            <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
              Deleting your account will remove your profile, saved places, and
              chat history. This cannot be undone.
            </p>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleDeleteAccount}
            >
              Delete my account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;




