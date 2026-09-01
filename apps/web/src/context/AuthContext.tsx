
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

const API_URL = "http://localhost:4000";

type User = {
  id: number;
  email: string;
  role: string;
  isActive: boolean;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  refreshAuth: () => Promise<User | null>;
  logout: () => Promise<void>;
};

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined,
  );

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  async function refreshAuth(): Promise<
    User | null
  > {
    try {
      const response = await fetch(
        `${API_URL}/auth/me`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        setUser(null);
        return null;
      }

      const data = await response.json();

      const currentUser =
        data.user ?? null;

      setUser(currentUser);

      return currentUser;
    } catch (error) {
      console.error(
        "AUTH CHECK ERROR:",
        error,
      );

      setUser(null);

      return null;
    }
  }

  useEffect(() => {
    async function checkAuth() {
      setLoading(true);

      await refreshAuth();

      setLoading(false);
    }

    checkAuth();
  }, []);

  async function logout() {
    try {
      await fetch(
        `${API_URL}/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        },
      );
    } catch (error) {
      console.error(
        "LOGOUT ERROR:",
        error,
      );
    }

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refreshAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}

