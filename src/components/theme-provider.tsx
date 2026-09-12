"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useIsClient } from "usehooks-ts";

export type ColorTheme = "light" | "dark";

interface ThemeContextValue {
  theme: ColorTheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ColorTheme>(() =>
    typeof document === "undefined"
      ? "dark"
      : (document.documentElement.dataset.theme as ColorTheme) || "dark",
  );
  const isClient = useIsClient();

  // Sync DOM attributes on change — chỉ chạy trên client
  useEffect(() => {
    if (!isClient) return;
    disableTransitionsWhile(() => {
      const el = document.documentElement;
      el.dataset.theme = theme;
      if (theme === "dark") {
        el.classList.add("dark");
      } else {
        el.classList.remove("dark");
      }
    });
  }, [theme, isClient]);

  const toggleTheme = useCallback(
    () => setThemeState((t) => (t === "light" ? "dark" : "light")),
    [],
  );

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
