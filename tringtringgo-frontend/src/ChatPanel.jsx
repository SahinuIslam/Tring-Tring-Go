// src/components/ChatPanel.jsx
import React, { useEffect, useState } from "react";

const CHAT_API = "http://127.0.0.1:8000/api/chat";
const ACC_API = "http://127.0.0.1:8000/api/accounts";

function getCurrentUser() {
  const stored = localStorage.getItem("ttg_user");
  const parsed = stored ? JSON.parse(stored) : null;
  return parsed;
}

function ChatPanel({ onClose }) {
  const currentUser = getCurrentUser();
  const token = currentUser?.token || currentUser?.username || "";

  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");

  const authHeaders = token
    ? { "X-User-Token": token, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };

  // load threads
  useEffect(() => {
    if (!token) {
      setLoadingThreads(false);
      setError("Please log in to use chat.");
      return;
    }
    async function loadThreads() {
      try {
        setLoadingThreads(true);
        const res = await fetch(`${CHAT_API}/threads/`, {
          headers: authHeaders,
        });
        if (!res.ok) throw new Error("Failed to load chats.");
        const data = await res.json();
        setThreads(data);
        setError("");
      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoadingThreads(false);
      }
    }
    loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // load messages for selected thread + simple polling
  useEffect(() => {
    if (!selectedThread || !token) return;

    async function loadMessages() {
      try {
        setLoadingMessages(true);
        const res = await fetch(
          `${CHAT_API}/threads/${selectedThread.id}/messages/`,
          { headers: authHeaders }
        );
        if (!res.ok) throw new Error("Failed to load messages.");
        const data = await res.json();
        setMessages(data);
      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoadingMessages(false);
      }
    }

    loadMessages();
    const interval = setInterval(loadMessages, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThread, token]);

  const canSend =
    selectedThread && selectedThread.status === "active" && !!token;

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !selectedThread || !token || !canSend) return;

    try {
      const resp = await fetch(
        `${CHAT_API}/threads/${selectedThread.id}/messages/`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ text }),
        }
      );
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to send message.");
      }
      const msg = await resp.json();
      setMessages((prev) => [...prev, msg]);
      setText("");
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  // ----- accept / reject chat -----
  async function handleThreadAction(action) {
    if (!selectedThread || !token) return;
    try {
      const resp = await fetch(
        `${CHAT_API}/threads/${selectedThread.id}/accept/`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ action }), // "accept" or "reject"
        }
      );
      if (!resp.ok) return;
      const updated = await resp.json();
      setThreads((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
      setSelectedThread(updated);
    } catch (e) {
      console.error(e);
    }
  }

  // ----- smarter search: debounce + suggestions -----

  // debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    if (!token) return;

    const handle = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const resp = await fetch(
          `${ACC_API}/users/search/?q=${encodeURIComponent(searchQuery)}`,
          { headers: authHeaders }
        );
        if (!resp.ok) {
          setSearchError("Search failed.");
          return;
        }
        const data = await resp.json();
        setSearchResults(data);
        setSearchError("");
      } catch (err) {
        console.error(err);
        setSearchError("Search error.");
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, token]);

  // recent contacts from existing threads
  const recentUsersFromThreads = Array.from(
    new Map(
      threads
        .flatMap((t) => t.participants || [])
        .filter((p) => p.username !== currentUser?.username)
        .map((u) => [u.id, u])
    ).values()
  );

  async function handleStartChat(userId) {
    if (!token) return;
    try {
      const resp = await fetch(`${CHAT_API}/threads/request/`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ user_id: userId }),
      });
      if (!resp.ok) return;
      const thread = await resp.json();

      setThreads((prev) => {
        const exists = prev.some((t) => t.id === thread.id);
        if (exists) return prev;
        return [thread, ...prev];
      });
      setSelectedThread(thread);
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  }

  function renderThreadTitle(thread) {
    const others = (thread.participants || []).filter(
      (p) => p.username !== currentUser?.username
    );
    const name =
      others[0]?.username ||
      thread.participants?.map((p) => p.username).join(", ") ||
      `Thread ${thread.id}`;
    const status =
      thread.status === "pending"
        ? "Pending"
        : thread.status === "closed"
        ? "Closed"
        : "Active";
    return `${name} · ${status}`;
  }

  if (!token) {
    return (
      <div className="chat-panel">
        <div className="chat-header">
          <strong>Chat</strong>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="chat-body" style={{ padding: "0.75rem" }}>
          You need to log in to use chat.
        </div>
      </div>
    );
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <strong>Chat</strong>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="chat-body">
        {/* LEFT: search + threads */}
        <div className="chat-threads">
          <h6 className="mb-2">Your chats</h6>

          <div style={{ position: "relative", marginBottom: "0.5rem" }}>
            <input
              className="form-control form-control-sm"
              placeholder="Search user by name/email"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />

            {showSuggestions && (
              <div
                className="border rounded-2 bg-white mt-1"
                style={{
                  position: "absolute",
                  zIndex: 10,
                  width: "100%",
                  maxHeight: "180px",
                  overflowY: "auto",
                  fontSize: "0.85rem",
                }}
                onMouseLeave={() => setShowSuggestions(false)}
              >
                {searchLoading && (
                  <div className="px-2 py-1 text-muted">Searching…</div>
                )}

                {!searchQuery.trim() &&
                  !searchLoading &&
                  recentUsersFromThreads.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-muted">
                        Recent contacts
                      </div>
                      {recentUsersFromThreads.map((u) => (
                        <div
                          key={u.id}
                          className="px-2 py-1"
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setSearchQuery(u.username);
                            setShowSuggestions(false);
                            handleStartChat(u.id);
                          }}
                        >
                          {u.username} ({u.email})
                        </div>
                      ))}
                    </>
                  )}

                {searchQuery.trim() &&
                  !searchLoading &&
                  searchResults.map((u) => (
                    <div
                      key={u.id}
                      className="px-2 py-1"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setSearchQuery(u.username);
                        setShowSuggestions(false);
                        handleStartChat(u.id);
                      }}
                    >
                      {u.username} ({u.email})
                    </div>
                  ))}

                {searchQuery.trim() &&
                  !searchLoading &&
                  searchResults.length === 0 && (
                    <div className="px-2 py-1 text-muted">
                      No users found.
                    </div>
                  )}
              </div>
            )}
          </div>

          {searchError && (
            <div style={{ color: "red", fontSize: "0.8rem" }}>
              {searchError}
            </div>
          )}

          <hr className="my-2" />

          {loadingThreads && <div className="small">Loading chats…</div>}

          <ul className="list-unstyled chat-thread-list">
            {threads.map((t) => (
              <li
                key={t.id}
                onClick={() => setSelectedThread(t)}
                style={{
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  padding: "0.35rem 0.25rem",
                  borderRadius: "0.35rem",
                  backgroundColor:
                    selectedThread?.id === t.id ? "#e5e7eb" : "transparent",
                  marginBottom: "0.15rem",
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  {renderThreadTitle(t)}
                </div>
                {t.last_message && (
                  <div
                    style={{
                      fontSize: "0.75rem",
                      opacity: 0.8,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t.last_message.sender.username}: {t.last_message.text}
                  </div>
                )}
              </li>
            ))}
            {!loadingThreads && threads.length === 0 && (
              <li className="small text-muted">No chats yet.</li>
            )}
          </ul>
        </div>

        {/* RIGHT: messages */}
        <div className="chat-window">
          {error && (
            <div className="small text-danger mb-1">
              {error}
            </div>
          )}

          {selectedThread ? (
            <>
              {selectedThread.status === "pending" && (
                <div
                  className="mb-2"
                  style={{
                    fontSize: "0.8rem",
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <span>
                    This chat is pending. Accept to start messaging.
                  </span>
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => handleThreadAction("accept")}
                  >
                    Accept
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleThreadAction("reject")}
                  >
                    Reject
                  </button>
                </div>
              )}

              {selectedThread.requested_by && (
                <div
                  className="small text-muted mb-1"
                  style={{ fontSize: "0.75rem" }}
                >
                  Started by: {selectedThread.requested_by.username}
                </div>
              )}

              <div className="chat-messages">
                {loadingMessages && (
                  <div className="small mb-1">Loading messages…</div>
                )}
                {messages.length === 0 && !loadingMessages && (
                  <div className="small text-muted">
                    No messages yet. Say hi!
                  </div>
                )}
                {messages.map((m) => {
                  const mine =
                    m.sender?.username === currentUser?.username;
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        justifyContent: mine ? "flex-end" : "flex-start",
                        marginBottom: "0.3rem",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "70%",
                          padding: "0.3rem 0.55rem",
                          borderRadius: "0.75rem",
                          fontSize: "0.8rem",
                          backgroundColor: mine ? "#3b82f6" : "#e5e7eb",
                          color: mine ? "white" : "black",
                        }}
                      >
                        {!mine && (
                          <div
                            style={{
                              fontSize: "0.7rem",
                              opacity: 0.8,
                              marginBottom: "0.1rem",
                            }}
                          >
                            {m.sender?.username ?? "User"}
                          </div>
                        )}
                        <div>{m.text}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSend} className="chat-input">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={
                    canSend
                      ? "Type a message..."
                      : "You can send messages after accepting this chat."
                  }
                  className="form-control form-control-sm"
                  disabled={!canSend}
                />
                <button
                  className="btn btn-primary btn-sm ms-1"
                  type="submit"
                  disabled={!canSend}
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="chat-empty">
              Select or start a chat from the left.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
