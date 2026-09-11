"use client";

import { useRouter } from "next/navigation";
import { ShoppingBag, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/shared/Toast";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-base px-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/6 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 size-[400px] rounded-full bg-[#A9682F]/5 blur-[100px]" />
      </div>

      <div className="relative z-10 flex max-w-2xl flex-col items-center text-center">
        {/* Logo */}
        <div className="mb-8">
          <span className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-ink-primary sm:text-5xl">
            StockFlow<span className="text-accent">Commerce</span>
          </span>
        </div>

        {/* Description */}
        <p className="mb-3 text-lg leading-8 text-ink-secondary sm:text-xl">
          UI/UX Prototype
        </p>
        <p className="mb-12 max-w-lg text-[0.9375rem] leading-7 text-ink-tertiary">
          Hệ thống quản lý kho vận &amp; sàn thương mại điện tử tích hợp.
          Đây là bản demo giao diện sử dụng mock data, không kết nối backend.
        </p>

        {/* Mode cards */}
        <div className="grid w-full max-w-lg gap-4 sm:grid-cols-2">
          {/* Mode A — Back-office */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/admin")}
            className="group relative h-auto flex-col items-center gap-4 overflow-hidden rounded-2xl border border-border-default bg-bg-surface px-6 py-8 text-center transition-all duration-300 hover:border-accent/50 hover:bg-bg-surface hover:shadow-[0_0_40px_color-mix(in_srgb,var(--accent)_12%,transparent)]"
          >
            <div className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-accent/8 transition-transform duration-300 group-hover:scale-150" />
            <div className="relative flex size-14 items-center justify-center rounded-xl bg-accent text-ink-inverse shadow-[0_10px_24px_color-mix(in_srgb,var(--accent)_30%,transparent)]">
              <Warehouse className="size-7" />
            </div>
            <div>
              <div className="font-[family-name:var(--font-display)] text-lg font-bold text-ink-primary">
                Mode A
              </div>
              <div className="mt-0.5 text-xs font-medium uppercase tracking-wider text-accent">
                Back-office
              </div>
            </div>
            <p className="text-[0.8125rem] leading-5 text-ink-tertiary">
              Quản lý kho vận, đơn hàng NCC, nhập/xuất hàng. Data-dense, desktop-first.
            </p>
          </Button>

          {/* Mode B — Storefront */}
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              toast.info(
                "Đang phát triển",
                "Storefront (Mode B) chưa được dựng trong tiến trình hiện tại. Sẽ bổ sung sau."
              )
            }
            className="group relative h-auto flex-col items-center gap-4 overflow-hidden rounded-2xl border border-border-default bg-bg-surface px-6 py-8 text-center transition-all duration-300 hover:border-[#A9682F]/50 hover:bg-bg-surface hover:shadow-[0_0_40px_color-mix(in_srgb,#A9682F_12%,transparent)]"
          >
            <div className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-[#A9682F]/8 transition-transform duration-300 group-hover:scale-150" />
            <div className="relative flex size-14 items-center justify-center rounded-xl bg-[#A9682F] text-white shadow-[0_10px_24px_color-mix(in_srgb,#A9682F_30%,transparent)]">
              <ShoppingBag className="size-7" />
            </div>
            <div>
              <div className="font-[family-name:var(--font-display)] text-lg font-bold text-ink-primary">
                Mode B
              </div>
              <div className="mt-0.5 text-xs font-medium uppercase tracking-wider text-[#A9682F]">
                Storefront
              </div>
            </div>
            <p className="text-[0.8125rem] leading-5 text-ink-tertiary">
              Sàn TMĐT, catalog, giỏ hàng, thanh toán. Airy, mobile-first.
            </p>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-border-default bg-bg-subtle px-2.5 py-0.5 text-[0.6875rem] font-medium text-ink-tertiary">
              Đang phát triển
            </span>
          </Button>
        </div>

        {/* Footer */}
        <p className="mt-12 text-xs text-ink-tertiary">
          StockFlowCommerce &copy; 2026 · UI/UX Prototype · Mock Data Only
        </p>
      </div>
    </div>
  );
}
