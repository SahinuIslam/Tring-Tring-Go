import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8002", // chatbot Django server
});

export const chatApi = (message) =>
  api.post("/api/chat/", { message }).then((res) => res.data);

export const topPlacesApi = () =>
  api.get("/api/top-places/").then((res) => res.data);

export const placesSearchApi = (q) =>
  api
    .get(`/api/places-search/?q=${encodeURIComponent(q)}`)
    .then((res) => res.data);
