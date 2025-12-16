import { Outlet } from "react-router-dom"; // unified topbar for all pages
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ChatPanel from "./ChatPanel";
import ChatWidget from "./chatbot/ChatWidget";

function Layout({ children }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const location = useLocation();

  const stored = localStorage.getItem("ttg_user");
  const parsed = stored ? JSON.parse(stored) : null;
  const isLoggedIn = !!parsed;
  const mode = parsed?.mode || ""; // "TRAVELER" / "MERCHANT" / "ADMIN"

  const isActive = (path) => location.pathname.startsWith(path);

  function handleLogout() {
    try {
      fetch("http://127.0.0.1:8000/api/accounts/logout/", {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
    } catch (_) {}
    localStorage.removeItem("ttg_user");
    localStorage.removeItem("userToken");
    window.location.href = "/login";
  }

  return (
    <div className="app-layout">
      <header className="top-nav">
        <div
          className="logo"
          style={{ cursor: "pointer" }}
          onClick={() => (window.location.href = "/home")}
        >
          TringTringGo
        </div>

        <nav className="nav-links">
          <Link
            className={isActive("/home") ? "nav-link active" : "nav-link"}
            to="/home"
          >
            Home
          </Link>
          <Link
            className={isActive("/explore") ? "nav-link active" : "nav-link"}
            to="/explore"
          >
            Explore
          </Link>
          <Link
            className={isActive("/community") ? "nav-link active" : "nav-link"}
            to="/community"
          >
            Community
          </Link>

          {/* Services link: admin -> /admin/services, others -> /services */}
          {parsed?.mode === "ADMIN" ? (
            <Link
              className={
                isActive("/admin/services") ? "nav-link active" : "nav-link"
              }
              to="/admin/services"
            >
              Services
            </Link>
          ) : (
            <Link
              className={isActive("/services") ? "nav-link active" : "nav-link"}
              to="/services"
            >
              Services
            </Link>
          )}

          <Link
            className={isActive("/settings") ? "nav-link active" : "nav-link"}
            to="/settings"
          >
            Settings
          </Link>

          {/* Dashboard link depends on mode */}
          {parsed?.mode === "MERCHANT" ? (
            <Link
              className={isActive("/merchant") ? "nav-link active" : "nav-link"}
              to="/merchant"
            >
              Dashboard
            </Link>
          ) : parsed?.mode === "ADMIN" ? (
            <Link
              className={isActive("/admin") ? "nav-link active" : "nav-link"}
              to="/admin"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              className={isActive("/traveler") ? "nav-link active" : "nav-link"}
              to="/traveler"
            >
              Dashboard
            </Link>
          )}

          {isLoggedIn ? (
            <>
              <button
                className="btn btn-outline-primary btn-sm"
                type="button"
                onClick={() => setIsChatOpen((p) => !p)}
              >
                Chat
              </button>
              <button
                className="btn btn-danger btn-sm"
                type="button"
                style={{ marginLeft: "0.5rem" }}
                onClick={handleLogout}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="btn btn-outline-primary btn-sm"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="btn btn-primary btn-sm"
                style={{ marginLeft: "0.5rem" }}
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      {isLoggedIn && isChatOpen && (
        <ChatPanel onClose={() => setIsChatOpen(false)} />
      )}

      {/* Floating chatbot: only for logged-in TRAVELER or MERCHANT */}
      {isLoggedIn && (mode === "TRAVELER" || mode === "MERCHANT") && (
        <ChatWidget />
      )}
    </div>
  );
}

export default Layout;
