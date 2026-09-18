'use client';

import React from 'react';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            DASH
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              Admin Dashboard
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              DrBlooMedi Hospital Management System
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-6 space-y-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Welcome, Admin 👋
          </h2>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
            Welcome to the DrBlooMedi Admin Panel.
          </p>
        </div>
      </main>
    </div>
  );
}