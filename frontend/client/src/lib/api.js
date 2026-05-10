import axios from "axios"
import { getAuthToken } from "@/lib/auth"

const envBaseUrl = import.meta.env.VITE_API_BASE_URL
const baseURL = typeof envBaseUrl === "string" && envBaseUrl.trim() ? envBaseUrl.trim() : "/api"

function normalizeApiPath(url) {
  if (!url || typeof url !== "string") return url
  if (url.startsWith("/api/")) return url.replace("/api/", "/")
  return url
}

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use((config) => {
  config.url = normalizeApiPath(config.url)

  const token = getAuthToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function extractErrorMessage(err) {
  const fallback = "Something went wrong. Please try again."
  if (!err) return fallback

  // Axios-style
  const msg =
    err?.response?.data?.message ??
    err?.response?.data?.error ??
    err?.message ??
    null

  return typeof msg === "string" && msg.trim() ? msg : fallback
}

