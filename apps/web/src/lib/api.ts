export const BACKEND_URL = "https://drbloomedi-backend.onrender.com";

export async function getAuthHeaders(): Promise<HeadersInit> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}