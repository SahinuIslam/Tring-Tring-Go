// src/chatbot/Chatbot.js
import React, { useState, useRef, useEffect } from "react";
import { chatApi } from "./api";
import "./styles.css";

export default function Chatbot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [hasChatted, setHasChatted] = useState(false);
  const boxRef = useRef();

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;

    setInput("");
    setHasChatted(true);

    try {
      const res = await chatApi(text);
      const bot = typeof res.reply === "string" ? res.reply : "No reply from server";

      setMessages((prev) => [
        ...prev,
        { sender: "user", text },
        { sender: "bot", text: bot },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: "user", text },
        { sender: "bot", text: "Error contacting server" },
      ]);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") send();
  };

  return (
    <div className="chatbot-wrapper">
      <div className="chatbot-header">
        <div className="chatbot-title">TringTringGo Assistant</div>
        <div className="chatbot-status">Online</div>
      </div>

      <div className="chatbot-messages" ref={boxRef}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`chat-message ${m.sender === "user" ? "user" : "bot"}`}
          >
            <div className="chat-text">
              {m.text.split("\n").map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
            <span className="time">now</span>
          </div>
        ))}
      </div>

      <div className="chatbot-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={
            hasChatted ? "Type your message..." : "👋 Start by saying hi..."
          }
        />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}
