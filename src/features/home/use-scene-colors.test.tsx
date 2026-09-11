import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ThemeProvider, useTheme } from "@/components/theme-provider";

import { SCENE_COLOR_FALLBACK, useSceneColors } from "./use-scene-colors";

import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

/**
 * Hook test kết hợp `useSceneColors` + `toggleTheme` để mô phỏng đúng kịch bản
 * người dùng bấm đổi theme — dùng cho test "toggle theme đổi đúng màu".
 */
function useSceneColorsAndToggle() {
  const { toggleTheme } = useTheme();
  const colors = useSceneColors();
  return { colors, toggleTheme };
}

afterEach(() => {
  document.documentElement.style.cssText = "";
  delete document.documentElement.dataset.theme;
  document.documentElement.classList.remove("dark");
  document.head.querySelectorAll("style[data-test-theme]").forEach((el) => el.remove());
});

/**
 * jsdom không nạp `globals.css`, nên phải tự khai báo rule `:root` / `.dark` để
 * `getComputedStyle` trả giá trị khác nhau theo class `dark` — đúng cơ chế CSS
 * variable thật mà `ThemeProvider` dựa vào (toggle class trên `<html>`).
 */
function injectThemeStylesheet() {
  const style = document.createElement("style");
  style.dataset.testTheme = "true";
  style.textContent = `
    :root { --ink-primary: #123456; --accent: #1e88e5; }
    .dark { --ink-primary: #abcdef; --accent: #4ea6f0; }
  `;
  document.head.appendChild(style);
}

describe("useSceneColors", () => {
  it("đọc màu từ CSS variable của document", () => {
    document.documentElement.style.setProperty("--ink-primary", "#123456");
    document.documentElement.style.setProperty("--accent", "#1e88e5");

    const { result } = renderHook(() => useSceneColors(), { wrapper });

    expect(result.current.ink).toBe("#123456");
    expect(result.current.accent).toBe("#1e88e5");
  });

  it("dùng fallback khi CSS variable chưa được định nghĩa (jsdom không nạp globals.css)", () => {
    const { result } = renderHook(() => useSceneColors(), { wrapper });

    expect(result.current.ink).toBe(SCENE_COLOR_FALLBACK.ink);
    expect(result.current.accent).toBe(SCENE_COLOR_FALLBACK.accent);
  });

  it("trả về đủ năm vai trò màu mà scene cần", () => {
    const { result } = renderHook(() => useSceneColors(), { wrapper });

    expect(Object.keys(result.current).sort()).toEqual([
      "accent",
      "border",
      "ink",
      "subtle",
      "surface",
    ]);
  });

  it("mọi giá trị là chuỗi không rỗng để THREE.Color parse được", () => {
    const { result } = renderHook(() => useSceneColors(), { wrapper });

    for (const value of Object.values(result.current)) {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it("toggle theme (light → dark) qua toggleTheme() thì đổi đúng màu theo class .dark", async () => {
    // Bug đã fix: hook cũ dùng useMemo(() => readSceneColors(theme), [theme]) — chạy
    // trong render phase, TRƯỚC khi effect của ThemeProvider kịp set class "dark" lên
    // <html>, nên luôn trả màu của theme cũ (lệch một nhịp). Test này phải fail trên
    // bản cũ và pass trên bản dùng MutationObserver.
    injectThemeStylesheet();

    const { result } = renderHook(() => useSceneColorsAndToggle(), { wrapper });

    // Trạng thái ban đầu: light — đọc từ :root.
    await waitFor(() => {
      expect(result.current.colors.ink).toBe("#123456");
      expect(result.current.colors.accent).toBe("#1e88e5");
    });

    act(() => {
      result.current.toggleTheme();
    });

    // MutationObserver bắt thay đổi class "dark" là microtask/callback bất đồng bộ
    // → dùng waitFor thay vì assert ngay.
    await waitFor(() => {
      expect(result.current.colors.ink).toBe("#abcdef");
      expect(result.current.colors.accent).toBe("#4ea6f0");
    });
  });
});
