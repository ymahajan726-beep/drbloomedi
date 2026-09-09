// src/utils/session.ts
export const getActiveToken = () => {
  if (typeof window === "undefined") return null;
  const path = window.location.pathname;
  
  if (path.includes("/admin")) {
    return localStorage.getItem("admin_token") || localStorage.getItem("token");
  } else if (path.includes("/doctor")) {
    return localStorage.getItem("doctor_token") || localStorage.getItem("token");
  } else if (path.includes("/reception")) {
    return localStorage.getItem("reception_token") || localStorage.getItem("token");
  }
  return localStorage.getItem("token");
};

export const getAuthHeaders = () => {
  const token = getActiveToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};