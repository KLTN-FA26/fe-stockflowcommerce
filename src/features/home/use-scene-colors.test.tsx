import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ThemeProvider } from "@/components/theme-provider";

import { SCENE_COLOR_FALLBACK, useSceneColors } from "./use-scene-colors";

import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

afterEach(() => {
  document.documentElement.style.cssText = "";
  delete document.documentElement.dataset.theme;
});

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
});
