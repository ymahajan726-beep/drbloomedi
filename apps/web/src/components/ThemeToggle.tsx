'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg text-slate-800 dark:text-slate-200 hover:scale-105 transition cursor-pointer"
      title="Toggle Theme"
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}