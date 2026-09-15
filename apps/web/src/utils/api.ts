// src/utils/api.ts
import toast from 'react-hot-toast';

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

  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });

    // HTTP Error handling (jaise 400, 401, 403, 500)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.message || `Error: ${response.statusText}`;
      toast.error(errorMsg);
      return response;
    }

    // Success Toast handling for CRUD methods (POST, PUT, DELETE)
    const method = (options.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
      if (method === 'POST') toast.success('Created successfully');
      if (method === 'PUT') toast.success('Updated successfully');
      if (method === 'DELETE') toast.success('Deleted successfully');
    }

    return response;
  } catch (error: any) {
    // Network ya unexpected errors ke liye
    toast.error(error.message || 'Network error or server unreachable');
    throw error;
  }
}