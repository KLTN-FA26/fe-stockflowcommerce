"use client";

import { useEffect, useState } from "react";

export interface SceneColors {
  /** Màu khối hàng và khung kệ. */
  ink: string;
  /** Màu highlight của scan sweep. */
  accent: string;
  /** Màu mặt nền nhận bóng. */
  surface: string;
  /** Màu bin rỗng. */
  subtle: string;
  /** Màu cạnh viền. */
  border: string;
}

/**
 * CSS variable tương ứng từng vai trò màu. Đọc từ `globals.css` lúc runtime nên
 * không có hex trần trong tsx (design-tokens.md cấm).
 */
const COLOR_VARS: Record<keyof SceneColors, string> = {
  ink: "--ink-primary",
  accent: "--scene-accent",
  surface: "--bg-surface",
  subtle: "--bg-subtle",
  border: "--border-default",
};

/**
 * Giá trị dự phòng khi `getComputedStyle` trả rỗng: lần render đầu trên server, hoặc
 * trong jsdom (test không nạp `globals.css`). Dùng tên màu CSS chứ không hex —
 * design-tokens.md cấm hex trần trong `src/features`.
 */
export const SCENE_COLOR_FALLBACK: SceneColors = {
  ink: "dimgray",
  accent: "dodgerblue",
  surface: "white",
  subtle: "whitesmoke",
  border: "gainsboro",
};

/**
 * Đọc màu tại đúng thời điểm gọi — nguồn sự thật là DOM (`document.documentElement`),
 * không phải React state. Không nhận tham số theme: hàm này không cần biết theme là
 * gì, chỉ cần đọc `getComputedStyle` sau khi `ThemeProvider` đã mutate DOM xong.
 */
function readSceneColors(): SceneColors {
  if (typeof window === "undefined") return SCENE_COLOR_FALLBACK;

  const computed = getComputedStyle(document.documentElement);
  const entries = Object.entries(COLOR_VARS).map(([role, cssVar]) => {
    const value =
      computed.getPropertyValue(cssVar).trim() ||
      (role === "accent" ? computed.getPropertyValue("--accent").trim() : "");
    return [role, value || SCENE_COLOR_FALLBACK[role as keyof SceneColors]] as const;
  });

  return Object.fromEntries(entries) as unknown as SceneColors;
}

/**
 * Màu của scene 3D, đồng bộ với design token hiện hành.
 *
 * Không dùng `useTheme()` để suy luận thời điểm đổi màu: `ThemeProvider` set React
 * state `theme` TRƯỚC, rồi effect riêng của nó mới set `class="dark"` /
 * `data-theme` lên `<html>` SAU (xem `theme-provider.tsx`). Nếu hook này chạy lại
 * theo `theme` (render phase, vd qua `useMemo`), nó đọc `getComputedStyle` trước khi
 * class kịp đổi → luôn lệch một nhịp so với theme thật.
 *
 * Thay vào đó, quan sát trực tiếp nguồn sự thật là DOM bằng `MutationObserver` trên
 * `document.documentElement` (`class` / `data-theme`). `setState` trong effect ở đây
 * hợp lệ theo đúng ngoại lệ của rule `react-hooks/set-state-in-effect`: effect này
 * subscribe để nhận update từ external system (DOM bị `ThemeProvider` mutate), không
 * phải tính state từ props/state khác.
 */
export function useSceneColors(): SceneColors {
  // Lazy initializer — đọc ngay trong render lần đầu, giống pattern ThemeProvider
  // đọc `data-theme` ở dòng 45-49 của theme-provider.tsx. Không setState trong effect
  // cho lần render đầu tiên.
  const [colors, setColors] = useState<SceneColors>(() => readSceneColors());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const observer = new MutationObserver(() => {
      setColors(readSceneColors());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return colors;
}
