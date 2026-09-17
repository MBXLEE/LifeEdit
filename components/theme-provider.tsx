"use client";

import * as React from "react";

type Theme = "ocean" | "blush" | "sage" | "cream" | "midnight";

const storageKey = "life-edit-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const theme = (localStorage.getItem(storageKey) as Theme | null) ?? "ocean";
    document.documentElement.dataset.theme = theme;
  }, []);

  return children;
}

export function useTheme() {
  const [theme, setThemeState] = React.useState<Theme>("ocean");

  React.useEffect(() => {
    const current = (localStorage.getItem(storageKey) as Theme | null) ?? "ocean";
    setThemeState(current);
    document.documentElement.dataset.theme = current;
  }, []);

  const setTheme = (nextTheme: Theme) => {
    localStorage.setItem(storageKey, nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    setThemeState(nextTheme);
  };

  return { theme, setTheme };
}
