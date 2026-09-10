'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const PENDING_TOAST_KEY = 'drbloomedi-pending-toast';

export function queueToast(message: string, type: ToastType = 'success') {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(PENDING_TOAST_KEY, JSON.stringify({ message, type }));
  }
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    const pendingToast = sessionStorage.getItem(PENDING_TOAST_KEY);
    if (!pendingToast) return;

    sessionStorage.removeItem(PENDING_TOAST_KEY);
    try {
      const parsed = JSON.parse(pendingToast);
      if (parsed?.message) setToast(parsed);
    } catch {
      sessionStorage.removeItem(PENDING_TOAST_KEY);
    }
  }, []);

  useEffect(() => {
    if (!toast) return;

    const dismissTimer = setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => clearTimeout(dismissTimer);
  }, [toast]);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-5 py-3.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-3 border backdrop-blur-xl ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200 shadow-emerald-950/50'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200 shadow-rose-950/50'
                : 'bg-blue-950/90 border-blue-500/40 text-blue-200 shadow-blue-950/50'
            }`}
          >
            <span className="text-sm">
              {toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : 'ℹ️'}
            </span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}