// src/utils/session.ts

export const getActiveToken = () => {
  if (typeof window === "undefined") return null;

  
  return sessionStorage.getItem("token") || localStorage.getItem("token") || localStorage.getItem("accessToken");
};

export const getAuthHeaders = () => {
  const token = getActiveToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};