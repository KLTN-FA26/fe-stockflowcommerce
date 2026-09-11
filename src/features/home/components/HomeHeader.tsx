"use client";

import { Moon, Sun } from "lucide-react";
import Link from "next/link";

import { APP_ROUTES } from "@/constants";

import { Logo } from "@/components/shared/Logo";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

import { HOME_COPY } from "../constants";

export function HomeHeader() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="border-border-default bg-bg-surface shrink-0 border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link
          href={APP_ROUTES.home}
          aria-label="StockFlowCommerce — trang chủ"
          className="focus-visible:ring-border-strong rounded-[var(--r-sm)] focus-visible:ring-2"
        >
          <Logo height={36} />
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Chuyển sang Light" : "Chuyển sang Dark"}
            className="rounded-[var(--r-sm)]"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <Button asChild variant="outline" className="rounded-[var(--r-sm)] px-4">
            <Link href={APP_ROUTES.login}>{HOME_COPY.loginLabel}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
