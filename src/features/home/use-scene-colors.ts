"use client";

import { useMemo } from "react";

import { useTheme } from "@/components/theme-provider";

import type { ColorTheme } from "@/components/theme-provider";

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
  accent: "--accent",
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
 * @param _theme — không đọc trực tiếp; tham số này chỉ để `useMemo` ở dưới khai báo
 * đúng dependency (đổi theme → class `dark` trên `<html>` đổi → CSS variable đổi).
 */
function readSceneColors(_theme: ColorTheme): SceneColors {
  if (typeof window === "undefined") return SCENE_COLOR_FALLBACK;

  const computed = getComputedStyle(document.documentElement);
  const entries = Object.entries(COLOR_VARS).map(([role, cssVar]) => {
    const value = computed.getPropertyValue(cssVar).trim();
    return [role, value || SCENE_COLOR_FALLBACK[role as keyof SceneColors]] as const;
  });

  return Object.fromEntries(entries) as unknown as SceneColors;
}

/**
 * Màu của scene 3D, đồng bộ với design token hiện hành.
 *
 * Phụ thuộc `useTheme()` nên khi người dùng đổi light/dark, hook tính lại và đọc giá trị
 * CSS variable mới — material đổi màu tại chỗ, Canvas KHÔNG remount.
 *
 * Đọc trực tiếp trong render qua `useMemo` (khoá theo `theme`) thay vì `useEffect` +
 * `setState`: tránh vi phạm `react-hooks/set-state-in-effect` (cascading render) —
 * xem lý do tương tự ở `use-page-config.ts`. `getComputedStyle` chỉ đọc, không ghi DOM,
 * nên an toàn khi gọi trong lúc render.
 */
export function useSceneColors(): SceneColors {
  const { theme } = useTheme();

  return useMemo(() => readSceneColors(theme), [theme]);
}
