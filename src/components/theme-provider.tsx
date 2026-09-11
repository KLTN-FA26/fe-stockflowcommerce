"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type DesignMode = "A" | "B";
export type ColorTheme = "light" | "dark";

interface ThemeContextValue {
  mode: DesignMode;
  theme: ColorTheme;
  setMode: (m: DesignMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Inline script chạy trước paint để tránh flash-of-wrong-theme. */
const THEME_INIT_SCRIPT = `
(function(){
  try{
    document.documentElement.setAttribute('data-theme','light');
    document.documentElement.setAttribute('data-mode','A');
    document.documentElement.classList.remove('dark');
  }catch(e){}
})();
`;

/**
 * Tắt mọi CSS transition trên toàn trang, chạy callback, rồi bật lại sau 1 frame.
 * Tránh hiệu ứng lag khi chuyển theme (hàng trăm element animate cùng lúc).
 */
function disableTransitionsWhile(fn: () => void) {
  const el = document.documentElement;
  el.classList.add("no-transitions");
  fn();
  // Force reflow rồi gỡ class sau 1 frame
  void el.offsetHeight;
  requestAnimationFrame(() => {
    el.classList.remove("no-transitions");
  });
}

function initialTheme(): ColorTheme {
  if (typeof document === "undefined") return "light";
  return (document.documentElement.dataset.theme as ColorTheme) || "light";
}

function initialMode(): DesignMode {
  if (typeof document === "undefined") return "A";
  return (document.documentElement.dataset.mode as DesignMode) || "A";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<DesignMode>(initialMode);
  const [theme, setThemeState] = useState<ColorTheme>(initialTheme);

  useEffect(() => {
    disableTransitionsWhile(() => {
      const el = document.documentElement;
      el.dataset.mode = mode;
      el.dataset.theme = theme;
      if (theme === "dark") {
        el.classList.add("dark");
      } else {
        el.classList.remove("dark");
      }
    });
  }, [mode, theme]);

  const setMode = useCallback((m: DesignMode) => setModeState(m), []);
  const toggleTheme = useCallback(
    () => setThemeState((t) => (t === "light" ? "dark" : "light")),
    [],
  );

  return (
    <ThemeContext.Provider value={{ mode, theme, setMode, toggleTheme }}>
      {/* Script chống flash — render ngay trong head */}
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
