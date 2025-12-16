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
            bottom: "5rem",
            zIndex: 50,
          }}
        >
          <Chatbot />
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-label="Chat assistant"
        style={{
          position: "fixed",
          right: "1.5rem",
          bottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.65rem 1.25rem",
          borderRadius: "9999px",
          backgroundColor: "#2563eb",
          color: "#ffffff",
          border: "none",
          fontSize: "0.875rem",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 12px 30px rgba(37, 99, 235, 0.35)",
          transition: "all 0.25s ease",
          zIndex: 51,
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#1d4ed8")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "#2563eb")
        }
        onMouseDown={(e) =>
          (e.currentTarget.style.transform = "scale(0.96)")
        }
        onMouseUp={(e) =>
          (e.currentTarget.style.transform = "scale(1)")
        }
      >
        {/* Simple SVG icon (no library needed) */}
        {open ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 6L18 18M6 18L18 6"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"
              stroke="white"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        )}

        {open ? "Close" : "Chatbot"}
      </button>
    </>
  );
}
