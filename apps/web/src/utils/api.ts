// src/utils/api.ts
import toast from 'react-hot-toast';

const BACKEND_URL = "https://drbloomedi-backend.onrender.com";

export async function secureFetch(endpoint: string, options: RequestInit = {}) {
  let token = null;
  if (typeof window !== "undefined") {
    const path = window.location.pathname;
    if (path.includes("/admin")) {
      token = sessionStorage.getItem("admin_active_token") || sessionStorage.getItem("admin_token") || sessionStorage.getItem("token");
    } else if (path.includes("/doctor")) {
      token = sessionStorage.getItem("doctor_active_token") || sessionStorage.getItem("doctor_token") || sessionStorage.getItem("token");
    } else if (path.includes("/reception")) {
      token = sessionStorage.getItem("reception_active_token") || sessionStorage.getItem("reception_token") || sessionStorage.getItem("token");
    } else {
      token = sessionStorage.getItem("token");
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

    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.message || `Error: ${response.statusText}`;
      toast.error(errorMsg);
      return response;
    }

    const method = (options.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
      if (method === 'POST') toast.success('Created successfully');
      if (method === 'PUT') toast.success('Updated successfully');
      if (method === 'DELETE') toast.success('Deleted successfully');
    }

    return response;
  } catch (error: any) {
    toast.error(error.message || 'Network error or server unreachable');
    throw error;
  }
}