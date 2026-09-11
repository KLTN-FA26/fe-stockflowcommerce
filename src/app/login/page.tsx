/**
 * Login page — /login
 *
 * Two modes:
 *  - Mock mode (NEXT_PUBLIC_USE_MOCK=true): user picker dropdown from staffUsers
 *  - Real mode: email + password form → POST /auth/login (Spring Boot)
 */

"use client";

import React, { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/auth/auth-store";
import { loginApi, mockLoginApi } from "@/lib/auth/auth-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const IS_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

/* ── Default export wraps with Suspense (required by useSearchParams) ── */

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-bg-base flex min-h-screen items-center justify-center">
          <p className="text-text-muted text-sm">Loading...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

/* ── Mock user list (loaded dynamically) ─────────────────────────────── */

interface MockUser {
  userId: string;
  fullName: string;
  email: string;
  roles: string[];
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  const login = useAuthStore((s) => s.login);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Mock mode state
  const [mockUsers, setMockUsers] = useState<MockUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [mockLoaded, setMockLoaded] = useState(false);

  // Real mode state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Load mock users on first render (mock mode only)
  React.useEffect(() => {
    if (!IS_MOCK || mockLoaded) return;
    import("@/lib/mock-data").then((mod) => {
      const users = mod.staffUsers.map((u) => ({
        userId: u.userId,
        fullName: u.fullName,
        email: u.email,
        roles: u.roles as string[],
      }));
      setMockUsers(users);
      if (users.length > 0) setSelectedUserId(users[0].userId);
      setMockLoaded(true);
    });
  }, [mockLoaded]);

  /* ── Mock login ──────────────────────────────────────────────────── */
  function handleMockLogin() {
    if (!selectedUserId) return;
    setError(null);

    startTransition(async () => {
      try {
        const res = await mockLoginApi(selectedUserId);
        login(res.user, {
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
        });
        router.push(callbackUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
      }
    });
  }

  /* ── Real login ──────────────────────────────────────────────────── */
  function handleRealLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);

    startTransition(async () => {
      try {
        const res = await loginApi({ email, password });
        login(
          {
            userId: res.user.userId,
            fullName: res.user.fullName,
            email: res.user.email,
            roles: res.user.roles,
            warehouseIds: res.user.warehouseIds,
          },
          {
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
          },
        );
        router.push(callbackUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
      }
    });
  }

  const selectedUser = mockUsers.find((u) => u.userId === selectedUserId);

  return (
    <div className="bg-bg-base flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-text-primary text-2xl font-bold tracking-tight">StockFlow</h1>
          <p className="text-text-muted mt-1 text-sm">
            {IS_MOCK
              ? "Chọn tài khoản để đăng nhập (Mock Mode)"
              : "Đăng nhập vào hệ thống quản lý kho"}
          </p>
        </div>

        {/* Card */}
        <div className="border-border-default bg-bg-surface rounded-lg border p-6 shadow-sm">
          {error && (
            <div className="bg-danger/10 text-danger mb-4 rounded-md px-3 py-2 text-sm">
              {error}
            </div>
          )}

          {IS_MOCK ? (
            /* ── Mock mode: user picker ─────────────────────────────── */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mock-user">Chọn tài khoản</Label>
                <select
                  id="mock-user"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="border-border-default bg-bg-surface text-text-primary focus:border-accent focus:ring-accent h-9 w-full rounded-[var(--r-sm)] border px-3 text-sm focus:ring-1 focus:outline-none"
                >
                  {mockUsers.map((u) => (
                    <option key={u.userId} value={u.userId}>
                      {u.fullName} — {u.roles.join(", ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected user info */}
              {selectedUser && (
                <div className="bg-bg-subtle rounded-md p-3">
                  <p className="text-text-primary text-xs font-medium">{selectedUser.fullName}</p>
                  <p className="text-text-muted text-xs">{selectedUser.email}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {selectedUser.roles.map((role) => (
                      <span
                        key={role}
                        className="bg-accent/10 text-accent inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleMockLogin}
                disabled={isPending || !selectedUserId}
              >
                {isPending ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>

              <p className="text-text-muted text-center text-[10px]">
                🔧 Mock Mode — Dữ liệu mẫu, không cần backend
              </p>
            </div>
          ) : (
            /* ── Real mode: email + password ────────────────────────── */
            <form onSubmit={handleRealLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@stockflow.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
