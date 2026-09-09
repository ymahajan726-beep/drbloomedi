"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name?: string;
  role: "ADMIN" | "DOCTOR" | "RECEPTION" | "RECEPTIONIST" | "PATIENT";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Backend URL
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://drbloomedi-backend.onrender.com";

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [, startTransition] = useTransition();

  /*
   * Get the token for the CURRENT BROWSER TAB.
   *
   * sessionStorage is tab-specific.
   * This prevents Admin / Doctor / Reception tabs
   * from sharing the same active token.
   */
  const getSessionToken = () => {
    if (typeof window === "undefined") return null;

    return (
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("admin_token") ||
      sessionStorage.getItem("doctor_token") ||
      sessionStorage.getItem("reception_token") ||
      sessionStorage.getItem("patient_token")
    );
  };

  /*
   * Get cached user for the CURRENT TAB.
   */
  const getSessionUser = () => {
    if (typeof window === "undefined") return null;

    const sessionUser = sessionStorage.getItem("user");

    if (!sessionUser) return null;

    try {
      return JSON.parse(sessionUser) as User;
    } catch {
      console.warn("Failed to parse cached session user");
      return null;
    }
  };

  const refreshAuth = async () => {
    const token = getSessionToken();
    const cachedUser = getSessionUser();

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    /*
     * Use cached user first to avoid unnecessary
     * loading/flickering while auth is being verified.
     */
    if (cachedUser) {
      setUser(cachedUser);
    }

    try {
      const response = await fetch(`${BACKEND_URL}/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();

        setUser(data);

        // Save verified user only in CURRENT TAB
        sessionStorage.setItem("user", JSON.stringify(data));
        sessionStorage.setItem("userRole", data.role);

        const roleKey =
          data.role === "RECEPTIONIST"
            ? "RECEPTION"
            : data.role;

        sessionStorage.setItem("active_role", roleKey);

        // Keep role-specific tab token available
        sessionStorage.setItem(
          `${roleKey.toLowerCase()}_token`,
          token
        );
      } else if (response.status === 401) {
        /*
         * Token is invalid/expired.
         * Clear ONLY the current tab session.
         */
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("userRole");
        sessionStorage.removeItem("userEmail");
        sessionStorage.removeItem("active_role");
        sessionStorage.removeItem("admin_token");
        sessionStorage.removeItem("doctor_token");
        sessionStorage.removeItem("reception_token");
        sessionStorage.removeItem("patient_token");

        setUser(null);
      }
    } catch (err) {
      /*
       * Backend/network failure:
       * Do NOT logout the user if a valid token
       * is still available in the current tab.
       */
      console.warn(
        "Could not verify session with backend, continuing with local session",
        err
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const login = (token: string, userData: User) => {
    const roleKey =
      userData.role === "RECEPTIONIST"
        ? "RECEPTION"
        : userData.role;

    /*
     * CURRENT TAB SESSION
     */
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(userData));
    sessionStorage.setItem("userRole", userData.role);
    sessionStorage.setItem("userEmail", userData.email);
    sessionStorage.setItem("active_role", roleKey);

    sessionStorage.setItem(
      `${roleKey.toLowerCase()}_token`,
      token
    );

    sessionStorage.setItem(
      `${roleKey.toLowerCase()}_role`,
      userData.role
    );

    sessionStorage.setItem(
      `${roleKey.toLowerCase()}_email`,
      userData.email
    );

    sessionStorage.setItem(
      "session_started_at",
      Date.now().toString()
    );

    /*
     * Keep role-specific localStorage keys only as
     * compatibility with older parts of the application.
     *
     * The current AuthContext NEVER reads these first.
     */
    localStorage.setItem(
      `${roleKey.toLowerCase()}_token`,
      token
    );

    localStorage.setItem(
      `${roleKey.toLowerCase()}_role`,
      userData.role
    );

    localStorage.setItem(
      `${roleKey.toLowerCase()}_email`,
      userData.email
    );

    /*
     * Cookies are kept for compatibility with existing
     * application/backend behavior.
     */
    const isHttps =
      typeof window !== "undefined" &&
      window.location.protocol === "https:";

    const cookieConfig =
      "; path=/; max-age=86400; SameSite=Lax" +
      (isHttps ? "; Secure" : "");

    document.cookie = `access_token=${encodeURIComponent(
      token
    )}${cookieConfig}`;

    document.cookie = `user_role=${encodeURIComponent(
      userData.role
    )}${cookieConfig}`;

    /*
     * Update React state immediately.
     */
    setUser(userData);

    /*
     * Role-based navigation.
     */
    startTransition(() => {
      if (userData.role === "DOCTOR") {
        router.push("/doctor/dashboard");
      } else if (userData.role === "RECEPTION" || userData.role === "RECEPTIONIST") {
        router.push("/reception/dashboard");
      } else if (userData.role === "PATIENT") {
        router.push("/patient/dashboard");
      } else {
        router.push("/admin/dashboard");
      }
    });
  };

  const logout = () => {
    /*
     * Clear ONLY the current browser TAB.
     *
     * Do NOT remove another tab's session.
     */
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("active_role");
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("doctor_token");
    sessionStorage.removeItem("reception_token");
    sessionStorage.removeItem("patient_token");
    sessionStorage.removeItem("admin_role");
    sessionStorage.removeItem("doctor_role");
    sessionStorage.removeItem("reception_role");
    sessionStorage.removeItem("patient_role");
    sessionStorage.removeItem("admin_email");
    sessionStorage.removeItem("doctor_email");
    sessionStorage.removeItem("reception_email");
    sessionStorage.removeItem("patient_email");
    sessionStorage.removeItem("session_started_at");

    /*
     * Clear only compatibility cookies.
     *
     * Note:
     * Cookies are browser-wide, so middleware should NOT
     * use them for tab-specific authorization.
     */
    document.cookie = "access_token=; path=/; max-age=0;";
    document.cookie = "user_role=; path=/; max-age=0;";

    setUser(null);

    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
}