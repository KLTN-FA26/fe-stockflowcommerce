/**
 * Axios HTTP client — single instance for the entire app.
 *
 * Interceptors:
 *  - Request: attach warehouse header (X-Warehouse-Id) from app store.
 *  - Response: normalise errors into ApiError.
 *
 * When NEXT_PUBLIC_USE_MOCK=true the mock adapter (mock-adapter.ts) replaces
 * the default adapter so every call resolves against mock-data — component
 * code stays identical.
 */

import axios, { type AxiosError } from "axios";
import { ApiError, type ApiErrorBody } from "./error";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

/* ── Request interceptor ─────────────────────────────────────────────── */

api.interceptors.request.use((cfg) => {
  // Warehouse header — injected lazily to avoid circular import at module
  // load time.  The store is created synchronously so getState() is safe.
  try {
    // Dynamic import resolved at runtime; tree-shaken in tests.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useAppStore } = require("@/lib/store/use-app-store");
    const wh = useAppStore.getState().warehouseId;
    if (wh) cfg.headers.set("X-Warehouse-Id", wh);
  } catch {
    // Store not initialised yet (SSR / test) — skip.
  }
  return cfg;
});

/* ── Response interceptor ────────────────────────────────────────────── */

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<ApiErrorBody>) => Promise.reject(ApiError.from(err)),
);
