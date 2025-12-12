import React, { useState } from "react";
import Chatbot from "./Chatbot";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen((v) => !v);

  return (
    <>
      {open && (
        <div
          style={{
            position: "fixed",
            right: "1.5rem",
            bottom: "5rem", // raised so it doesn’t touch the button
            zIndex: 50,
          }}
        >
          <Chatbot />
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        style={{
          position: "fixed",
          right: "1.5rem",
          bottom: "1.5rem",
          borderRadius: "999px",
          padding: "0.6rem 1.4rem",
          background: "#2563eb",
          color: "white",
          border: "none",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 10px 25px rgba(37, 99, 235, 0.4)",
          zIndex: 51,
        }}
      >
        {open ? "Close chat" : "Chat"}
      </button>
    </>
  );
}