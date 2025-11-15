// src/contexts/ThemeContext.tsx

import React, { createContext, useState, useEffect, useContext } from 'react';

type Theme = 'light' | 'dark' | 'bw';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    // On initial load, check for saved theme in localStorage or user's OS preference
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const userPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
      setTheme(savedTheme);
    } else if (userPrefersDark) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'bw');

    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.add('dark');
      if (theme === 'bw') {
        root.classList.add('bw');
      }
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : prevTheme === 'dark' ? 'bw' : 'light'));
  };

  const setThemeValue = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const value = { theme, toggleTheme, setTheme: setThemeValue };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};