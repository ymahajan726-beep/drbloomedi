// src/utils/api.ts (Scratch Solution for Unified & Safe Fetching)

const BACKEND_URL = "https://drbloomedi-backend.onrender.com";

export async function secureFetch(endpoint: string, options: RequestInit = {}) {
  // 1. Determine role context dynamically from URL or localStorage
  let token = null;
  if (typeof window !== "undefined") {
    const path = window.location.pathname;
    if (path.includes("/admin")) {
      token = localStorage.getItem("admin_token") || localStorage.getItem("token");
    } else if (path.includes("/doctor")) {
      token = localStorage.getItem("doctor_token") || localStorage.getItem("token");
    } else if (path.includes("/reception")) {
      token = localStorage.getItem("reception_token") || localStorage.getItem("token");
    } else {
      token = localStorage.getItem("token");
    }
  }

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  return response;
}