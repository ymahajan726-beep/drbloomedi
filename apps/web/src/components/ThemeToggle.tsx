
'use client';

import { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Change theme"
        className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-700 flex items-center justify-center shadow-sm"
      >
        ☀️
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        theme === 'light'
          ? 'Switch to dark mode'
          : 'Switch to light mode'
      }
      title={
        theme === 'light'
          ? 'Switch to dark mode'
          : 'Switch to light mode'
      }
      className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-all duration-200 flex items-center justify-center shadow-sm"
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}

