
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('drbloomedi-theme');

    const initialTheme: Theme =
      savedTheme === 'dark' ? 'dark' : 'light';

    setThemeState(initialTheme);

    document.documentElement.setAttribute(
      'data-theme',
      initialTheme,
    );

    document.documentElement.style.colorScheme = initialTheme;
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);

    document.documentElement.setAttribute(
      'data-theme',
      newTheme,
    );

    document.documentElement.style.colorScheme = newTheme;

    localStorage.setItem('drbloomedi-theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme must be used inside ThemeProvider',
    );
  }

  return context;

}