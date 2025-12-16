// src/chatbot/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// logic-based chatbot endpoint
export const chatApi = (message) =>
  api.post("/api/chatbot/chat/", { message }).then((res) => res.data);
