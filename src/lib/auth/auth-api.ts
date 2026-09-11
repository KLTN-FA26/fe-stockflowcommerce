/**
 * Auth API — calls to Spring Boot auth endpoints.
 *
 * These are raw axios calls (not through the main `api` instance)
 * because the auth interceptor depends on the auth store.
 */

import axios from "axios";
import type { AuthUser } from "./auth-store";

const authApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

/* ── Types ───────────────────────────────────────────────────────────── */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

/* ── API calls ───────────────────────────────────────────────────────── */

export async function loginApi(credentials: LoginRequest): Promise<LoginResponse> {
  const { data } = await authApi.post<LoginResponse>("/auth/login", credentials);
  return data;
}

export async function refreshTokenApi(refreshToken: string): Promise<RefreshResponse> {
  const { data } = await authApi.post<RefreshResponse>("/auth/refresh", { refreshToken });
  return data;
}

export async function logoutApi(refreshToken: string): Promise<void> {
  try {
    await authApi.post("/auth/logout", { refreshToken });
  } catch {
    // Ignore logout errors — token will expire anyway
  }
}

/* ── Mock login (NEXT_PUBLIC_USE_MOCK=true) ───────────────────────────── */

export async function mockLoginApi(userId: string): Promise<LoginResponse> {
  // Dynamic import to avoid bundling mock-data in production
  const { staffUsers } = await import("@/lib/mock-data");
  const user = staffUsers.find((u) => u.userId === userId);

  if (!user) throw new Error(`User ${userId} not found in mock data`);

  // Simulate delay
  await new Promise((r) => setTimeout(r, 300));

  return {
    accessToken: `mock-access-${user.userId}-${Date.now()}`,
    refreshToken: `mock-refresh-${user.userId}-${Date.now()}`,
    user: {
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      roles: user.roles,
      warehouseIds: user.warehouseIds,
    },
  };
}
