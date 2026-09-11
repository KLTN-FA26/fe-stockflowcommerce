/**
 * AuthGuard — client-side auth state watcher.
 *
 * Solves the dual-storage desync problem:
 *   - Next.js middleware reads `stockflow-auth-token` COOKIE (Edge).
 *   - Zustand auth-store persists to LOCALSTORAGE.
 *   - If a user clears localStorage (DevTools / another tab), the cookie
 *     survives → middleware still thinks user is authenticated → no redirect.
 *
 * This component:
 *   1. Watches `isAuthenticated` from zustand — when it becomes false,
 *      removes the cookie and redirects to /login.
 *   2. Listens for the `storage` event so cross-tab localStorage changes
 *      (clear / removeItem) are detected immediately.
 *
 * Wrap all /admin/* routes with this in the admin layout.
 */

"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { STORAGE_KEYS, PUBLIC_ROUTES } from "@/constants";

import { Skeleton } from "@/components/shared/Skeleton";

import { ROLES, type RoleName } from "../roles";
import { useAuthStore, type AuthTokens, type AuthUser } from "../auth-store";
import { removeAuthCookie, setAuthCookie } from "../auth-cookie";

const ROLE_SET = new Set<string>(ROLES);

interface PersistedAuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRoleName(value: unknown): value is RoleName {
  return typeof value === "string" && ROLE_SET.has(value);
}

function parsePersistedAuth(): PersistedAuthState | null {
  const raw = window.localStorage.getItem(STORAGE_KEYS.auth);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isRecord(parsed.state)) return null;

    const { user, tokens } = parsed.state;
    if (!isRecord(user) || !isRecord(tokens)) return null;
    if (
      typeof user.userId !== "string" ||
      typeof user.fullName !== "string" ||
      typeof user.email !== "string" ||
      !Array.isArray(user.roles) ||
      !user.roles.every(isRoleName) ||
      !Array.isArray(user.warehouseIds) ||
      !user.warehouseIds.every((id) => typeof id === "string") ||
      typeof tokens.accessToken !== "string" ||
      typeof tokens.refreshToken !== "string"
    ) {
      return null;
    }

    return {
      user: {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        roles: user.roles,
        warehouseIds: user.warehouseIds,
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  } catch {
    return null;
  }
}

function useAuthBootstrap(): boolean {
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const persisted = parsePersistedAuth();
      if (persisted?.user && persisted.tokens) {
        useAuthStore.setState({
          user: persisted.user,
          tokens: persisted.tokens,
          isAuthenticated: true,
          impersonatedRole: null,
        });
        setAuthCookie(persisted.tokens.accessToken);
      }
      setBootstrapped(true);
    });
  }, []);

  return bootstrapped;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const tokens = useAuthStore((s) => s.tokens);
  const bootstrapped = useAuthBootstrap();

  /** Clear cookie + redirect to login */
  const forceLogout = useCallback(() => {
    removeAuthCookie();
    router.replace(PUBLIC_ROUTES.login);
  }, [router]);

  /* ── React to auth state changes (only after local bootstrap) ───── */
  useEffect(() => {
    if (!bootstrapped) return;
    if (user && tokens) {
      setAuthCookie(tokens.accessToken);
      return;
    }
    forceLogout();
  }, [bootstrapped, user, tokens, forceLogout]);

  /* ── Cross-tab: listen for localStorage changes ─────────────────── */
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      // Zustand persist key was removed or cleared
      if (e.key === STORAGE_KEYS.auth || e.key === null) {
        // e.key === null means localStorage.clear() was called
        const current = useAuthStore.getState();
        if (!current.user || !current.tokens) {
          forceLogout();
        }
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [forceLogout]);

  // Show skeleton while local auth is bootstrapping from localStorage
  if (!bootstrapped) {
    return <AuthShellSkeleton />;
  }

  // After bootstrap: missing user/tokens → skeleton while redirect is in progress
  if (!user || !tokens) {
    return <AuthShellSkeleton />;
  }

  return <>{children}</>;
}

/* -------------------------------------------------------------------------- */
/*  Skeleton matching BackofficeShell shape (sidebar + topbar + content)      */
/* -------------------------------------------------------------------------- */

function AuthShellSkeleton() {
  return (
    <div className="bg-bg-base fixed inset-0 z-[9999] flex">
      {/* Sidebar skeleton — matches BackofficeShell 240px sidebar */}
      <div className="border-border-default bg-bg-subtle hidden w-[240px] shrink-0 flex-col border-r md:flex">
        {/* Logo area */}
        <div className="border-border-default flex h-12 shrink-0 items-center border-b px-3">
          <Skeleton className="h-5 w-36" />
        </div>
        {/* Nav items — mimic groups with separators */}
        <div className="flex flex-1 flex-col gap-1.5 overflow-hidden px-2 py-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full rounded-[var(--r-sm)]" />
          ))}
          <div className="border-border-default my-2 border-t" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`b-${i}`} className="h-7 w-full rounded-[var(--r-sm)]" />
          ))}
          <div className="border-border-default my-2 border-t" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={`c-${i}`} className="h-7 w-full rounded-[var(--r-sm)]" />
          ))}
        </div>
      </div>

      {/* Main area — fills remaining viewport */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar skeleton — h-12 matches BackofficeShell header */}
        <div className="border-border-default bg-bg-surface flex h-12 shrink-0 items-center gap-3 border-b px-4">
          <Skeleton className="h-4 w-24" />
          <div className="flex-1" />
          <Skeleton className="h-8 w-48 rounded-[var(--r-sm)]" />
          <Skeleton className="h-8 w-24 rounded-[var(--r-sm)]" />
          <Skeleton className="size-8 rounded-[var(--r-sm)]" />
          <Skeleton className="size-8 rounded-full" />
        </div>

        {/* Content skeleton — fills all remaining space */}
        <div className="bg-bg-base flex-1 p-4">
          {/* Page header placeholder */}
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-8 w-32 rounded-[var(--r-sm)]" />
          </div>
          {/* Table card placeholder */}
          <div className="border-border-default bg-bg-surface flex flex-col rounded-[var(--r-sm)] border">
            {/* Toolbar row */}
            <div className="border-border-default flex items-center gap-3 border-b px-4 py-3">
              <Skeleton className="h-8 w-56 rounded-[var(--r-sm)]" />
              <div className="flex-1" />
              <Skeleton className="size-8 rounded-[var(--r-sm)]" />
              <Skeleton className="size-8 rounded-[var(--r-sm)]" />
              <Skeleton className="h-8 w-20 rounded-[var(--r-sm)]" />
            </div>
            {/* Table rows */}
            <div className="flex flex-col">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="border-border-default flex items-center gap-4 border-b px-4 py-3 last:border-b-0"
                >
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-20" />
                  <div className="flex-1" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
            {/* Footer row */}
            <div className="border-border-default flex items-center justify-between border-t px-4 py-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-7 w-48" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
