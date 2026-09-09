
// src/utils/session.ts

export const getActiveToken = () => {
  if (typeof window === "undefined") return null;

  const path = window.location.pathname;

  // Current browser TAB ka session sabse pehle use karo.
  // sessionStorage tab-specific hota hai, isliye parallel tabs
  // ek dusre ka token overwrite nahi karenge.
  if (path.includes("/admin")) {
    return (
      sessionStorage.getItem("admin_token") ||
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("token") ||
      localStorage.getItem("token")
    );
  }

  if (path.includes("/doctor")) {
    return (
      sessionStorage.getItem("doctor_token") ||
      localStorage.getItem("doctor_token") ||
      sessionStorage.getItem("token") ||
      localStorage.getItem("token")
    );
  }

  if (path.includes("/reception")) {
    return (
      sessionStorage.getItem("reception_token") ||
      localStorage.getItem("reception_token") ||
      sessionStorage.getItem("token") ||
      localStorage.getItem("token")
    );
  }

  // Login/public pages ke liye fallback
  return (
    sessionStorage.getItem("token") ||
    localStorage.getItem("token")
  );
};

export const getAuthHeaders = () => {
  const token = getActiveToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

