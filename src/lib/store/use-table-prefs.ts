/**
 * Table preferences store — zustand + persist.
 *
 * Stores column visibility and table density per-table (keyed by table id).
 * This is NOT filter/sort/page state (that goes on the URL via nuqs).
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type TableDensity = "compact" | "normal" | "comfortable";

export interface TablePrefs {
  hiddenColumns: string[];
  density: TableDensity;
}

interface TablePrefsState {
  prefs: Record<string, TablePrefs>;
  getPrefs: (tableId: string) => TablePrefs;
  setHiddenColumns: (tableId: string, cols: string[]) => void;
  toggleColumn: (tableId: string, colKey: string) => void;
  setDensity: (tableId: string, density: TableDensity) => void;
  resetPrefs: (tableId: string) => void;
}

const DEFAULT_PREFS: TablePrefs = { hiddenColumns: [], density: "normal" };

export const useTablePrefs = create<TablePrefsState>()(
  persist(
    (set, get) => ({
      prefs: {},

      getPrefs: (tableId) => get().prefs[tableId] ?? DEFAULT_PREFS,

      setHiddenColumns: (tableId, cols) =>
        set((s) => ({
          prefs: {
            ...s.prefs,
            [tableId]: { ...(s.prefs[tableId] ?? DEFAULT_PREFS), hiddenColumns: cols },
          },
        })),

      toggleColumn: (tableId, colKey) =>
        set((s) => {
          const current = s.prefs[tableId] ?? DEFAULT_PREFS;
          const hidden = current.hiddenColumns.includes(colKey)
            ? current.hiddenColumns.filter((c) => c !== colKey)
            : [...current.hiddenColumns, colKey];
          return {
            prefs: { ...s.prefs, [tableId]: { ...current, hiddenColumns: hidden } },
          };
        }),

      setDensity: (tableId, density) =>
        set((s) => ({
          prefs: {
            ...s.prefs,
            [tableId]: { ...(s.prefs[tableId] ?? DEFAULT_PREFS), density },
          },
        })),

      resetPrefs: (tableId) =>
        set((s) => {
          const { [tableId]: _, ...rest } = s.prefs;
          return { prefs: rest };
        }),
    }),
    {
      name: "stockflow-table-prefs",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? localStorage
          : { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      ),
    },
  ),
);
