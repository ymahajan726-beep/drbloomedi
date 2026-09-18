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
        <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-top-5 duration-300">
          <div
            className={`px-4 py-3 rounded-lg shadow-2xl text-xs font-semibold flex items-center gap-2.5 border backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400'
                : toast.type === 'error'
                ? 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400'
                : 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400'
            }`}
          >
            <span className="text-xs">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '⚠️' : 'ℹ️'}
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