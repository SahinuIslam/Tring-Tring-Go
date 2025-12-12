import React, { useEffect, useState } from "react";

const CHAT_API = "http://127.0.0.1:8000/api/chat";
const ACC_API = "http://127.0.0.1:8000/api/accounts";

function ChatPanel({ onClose }) {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  // search related
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const token = localStorage.getItem("userToken") || "";

  const authHeaders = token
    ? { "X-User-Token": token, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };

  // load threads
  useEffect(() => {
    if (!token) return;

    fetch(`${CHAT_API}/threads/`, {
      headers: authHeaders,
    })
      .then((res) => res.json())
      .then(setThreads)
      .catch((err) => console.error("Error loading threads", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // load messages for selected thread
  useEffect(() => {
    if (!selectedThread || !token) return;

    fetch(`${CHAT_API}/threads/${selectedThread.id}/messages/`, {
      headers: authHeaders,
    })
      .then((res) => res.json())
      .then(setMessages)
      .catch((err) => console.error("Error loading messages", err));
  }, [selectedThread, token]); // authHeaders stable enough

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !selectedThread || !token) return;

    try {
      const resp = await fetch(
        `${CHAT_API}/threads/${selectedThread.id}/messages/`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ text }),
        }
      );
      if (resp.ok) {
        const msg = await resp.json();
        setMessages((prev) => [...prev, msg]);
        setText("");
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ---- USER SEARCH + START CHAT ----

  async function handleSearch(e) {
    e.preventDefault();
    setSearchError("");
    setSearchResults([]);
    if (!searchQuery.trim()) return;
    if (!token) {
      setSearchError("Please log in first.");
      return;
    }

    try {
      setSearchLoading(true);
      const resp = await fetch(
        `${ACC_API}/users/search/?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: authHeaders,
        }
      );
      if (!resp.ok) {
        setSearchError("Search failed.");
        return;
      }
      const data = await resp.json();
      setSearchResults(data);
    } catch (err) {
      console.error(err);
      setSearchError("Search error.");
    } finally {
      setSearchLoading(false);
    }
  }

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

      // add to thread list if new
      setThreads((prev) => {
        const exists = prev.some((t) => t.id === thread.id);
        if (exists) return prev;
        return [thread, ...prev];
      });
      setSelectedThread(thread);
      setMessages([]); // reload by effect
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <strong>Chat</strong>
        <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="chat-body">
        {/* left side: search + threads */}
        <div className="chat-threads">
          <h6>Your chats</h6>

          {/* search box */}
          <form onSubmit={handleSearch} style={{ marginBottom: "0.5rem" }}>
            <input
              className="form-control form-control-sm"
              placeholder="Search user by name/email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {searchError && (
            <div style={{ color: "red", fontSize: "0.8rem" }}>
              {searchError}
            </div>
          )}

          {searchLoading && <div>Searching...</div>}

          {searchResults.length > 0 && (
            <ul style={{ maxHeight: "120px", overflowY: "auto" }}>
              {searchResults.map((u) => (
                <li key={u.id} style={{ fontSize: "0.85rem" }}>
                  {u.username} ({u.email}){" "}
                  <button
                    className="btn btn-link btn-sm p-0"
                    onClick={() => handleStartChat(u.id)}
                  >
                    Start chat
                  </button>
                </li>
              ))}
            </ul>
          )}

          <hr />

          <ul>
            {threads.map((t) => (
              <li
                key={t.id}
                onClick={() => setSelectedThread(t)}
                style={{
                  cursor: "pointer",
                  fontWeight: selectedThread?.id === t.id ? "bold" : "normal",
                  fontSize: "0.9rem",
                }}
              >
                Thread #{t.id} – {t.status}
              </li>
            ))}
            {threads.length === 0 && <li>No chats yet.</li>}
          </ul>
        </div>

        {/* right side: messages */}
        <div className="chat-window">
          {selectedThread ? (
            <>
              <div className="chat-messages">
                {messages.map((m) => (
                  <div key={m.id} className="chat-message">
                    <strong>{m.sender?.username ?? "User"}:</strong>{" "}
                    {m.text}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSend} className="chat-input">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..."
                  className="form-control"
                />
                <button className="btn btn-primary btn-sm" type="submit">
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="chat-empty">Select or start a chat.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
