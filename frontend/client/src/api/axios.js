import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

const normalizeApiPath = (url) => {
  if (!url || typeof url !== "string") return url;

  if (url.startsWith("http://localhost:5000/api/")) {
    return `/${url.replace("http://localhost:5000/api/", "")}`;
  }

  if (url.startsWith("/api/")) {
    return url.replace("/api/", "/");
  }

  return url;
};

API.interceptors.request.use((req) => {
  req.url = normalizeApiPath(req.url);

  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default API;