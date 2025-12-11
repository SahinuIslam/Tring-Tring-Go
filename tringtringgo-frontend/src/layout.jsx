import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ChatPanel from "./ChatPanel";

function Layout({ children }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

  function handleLogout() {
    localStorage.removeItem("ttg_user");
    localStorage.removeItem("userToken");
    window.location.href = "/login";
  }

  return (
    <div className="app-layout">
      <header className="top-nav">
        <div className="logo">TringTringGo</div>

        <nav className="nav-links">
          <Link className={isActive("/home") ? "nav-link active" : "nav-link"} to="/home">
            Home
          </Link>
          <Link className={isActive("/explore") ? "nav-link active" : "nav-link"} to="/explore">
            Explore
          </Link>
          <Link className={isActive("/community") ? "nav-link active" : "nav-link"} to="/community">
            Community
          </Link>
          <Link className={isActive("/services") ? "nav-link active" : "nav-link"} to="/services">
            Services
          </Link>
          <Link
            className={
              isActive("/traveler") ||
              isActive("/merchant") ||
              isActive("/admin")
                ? "nav-link active"
                : "nav-link"
            }
            to="/traveler"
          >
            Dashboard
          </Link>

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
        </nav>
      </header>

      <main className="main-content">{children}</main>

      {isChatOpen && <ChatPanel onClose={() => setIsChatOpen(false)} />}
    </div>
  );
}

export default Layout;
