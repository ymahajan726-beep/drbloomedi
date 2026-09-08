'use client';

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name?: string;
  role: 'ADMIN' | 'DOCTOR' | 'RECEPTION' | 'PATIENT';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Ensure correct Backend URL (port 4000)
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://drbloomedi-backend.onrender.com';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const refreshAuth = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const localUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Use cached user data first to avoid flickering/loops
    if (localUserStr) {
      try {
        const parsed = JSON.parse(localUserStr);
        setUser(parsed);
      } catch (e) {
        console.warn('Failed to parse cached user');
      }
    }

    try {
      const response = await fetch(`${BACKEND_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      } else if (response.status === 401) {
        // Invalid or expired token
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        document.cookie = 'access_token=; path=/; max-age=0;';
        document.cookie = 'user_role=; path=/; max-age=0;';
        setUser(null);
      }
    } catch (err) {
      // Network failure / Backend offline: Do NOT force logout if token exists in localStorage
      console.warn('Could not verify session with backend, continuing with local session', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    document.cookie = `access_token=${token}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `user_role=${userData.role}; path=/; max-age=86400; SameSite=Lax`;
    setUser(userData);

    // Smooth navigation according to role
    startTransition(() => {
      if (userData.role === 'DOCTOR') router.push('/doctor/dashboard');
      else if (userData.role === 'RECEPTION') router.push('/reception/dashboard');
      else if (userData.role === 'PATIENT') router.push('/patient/dashboard');
      else router.push('/admin/dashboard');
    });
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    document.cookie = 'access_token=; path=/; max-age=0;';
    document.cookie = 'user_role=; path=/; max-age=0;';
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}