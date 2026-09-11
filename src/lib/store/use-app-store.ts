/**
 * Global app store — zustand.
 *
 * Persists warehouse selection across sessions.
 * `impersonatedRole` powers the "Xem với vai trò…" dropdown for demo.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { WarehouseId, RoleName } from "@/lib/mock-data";

export interface AppState {
  /* ── Warehouse ─────────────────────────────────────────────────────── */
  warehouseId: WarehouseId | null;
  setWarehouseId: (id: WarehouseId | null) => void;

  /* ── Sidebar ───────────────────────────────────────────────────────── */
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  /* ── Theme ─────────────────────────────────────────────────────────── */
  theme: "light" | "dark" | "system";
  setTheme: (t: "light" | "dark" | "system") => void;

  /* ── Locale ────────────────────────────────────────────────────────── */
  locale: "vi" | "en";
  setLocale: (l: "vi" | "en") => void;

  /* ── Sound ─────────────────────────────────────────────────────────── */
  muted: boolean;
  toggleMuted: () => void;

  /* ── Role impersonation (dev/demo) ─────────────────────────────────── */
  impersonatedRole: RoleName | null;
  setImpersonatedRole: (r: RoleName | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      warehouseId: null,
      setWarehouseId: (id) => set({ warehouseId: id }),

      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      theme: "light",
      setTheme: (theme) => set({ theme }),

      locale: "vi",
      setLocale: (locale) => set({ locale }),

      muted: false,
      toggleMuted: () => set((s) => ({ muted: !s.muted })),

      impersonatedRole: null,
      setImpersonatedRole: (r) => set({ impersonatedRole: r }),
    }),
    {
      name: "stockflow-app",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
      ),
      partialize: (state) => ({
        warehouseId: state.warehouseId,
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        locale: state.locale,
        muted: state.muted,
        impersonatedRole: state.impersonatedRole,
      }),
    },
  ),
);
