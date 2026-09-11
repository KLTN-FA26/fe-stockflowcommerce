import {
  ArrowRight,
  Boxes,
  ChartNoAxesCombined,
  ClipboardCheck,
  ScanLine,
  ShieldCheck,
  Warehouse,
} from "lucide-react";
import Link from "next/link";

import { APP_ROUTES } from "@/constants";

import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";

const OPERATIONS = [
  {
    title: "Nhập hàng có kiểm soát",
    description: "Theo dõi đơn đặt nhà cung cấp, phiếu nhận, kiểm tra và cất hàng trên một luồng.",
    icon: ClipboardCheck,
  },
  {
    title: "Tồn kho theo vị trí",
    description: "Quan sát sức chứa, điều chuyển và bổ sung hàng theo từng khu vực kho.",
    icon: Boxes,
  },
  {
    title: "Hoàn tất đơn chính xác",
    description: "Điều phối lấy hàng, đóng gói và bàn giao vận chuyển với trạng thái rõ ràng.",
    icon: ScanLine,
  },
] as const;

export default function Home() {
  return (
    <div className="bg-bg-base text-ink-primary min-h-screen">
      <header className="border-border-default bg-bg-surface border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link
            href={APP_ROUTES.home}
            aria-label="StockFlowCommerce — trang chủ"
            className="focus-visible:ring-border-strong rounded-[var(--r-sm)] focus-visible:ring-2"
          >
            <Logo height={36} />
          </Link>
          <Button asChild variant="outline" className="rounded-[var(--r-sm)] px-4">
            <Link href={APP_ROUTES.login}>Đăng nhập</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="border-border-default bg-bg-surface border-b">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)] lg:px-8 lg:py-24">
            <div className="flex flex-col justify-center">
              <div className="border-border-default bg-bg-subtle text-ink-secondary mb-6 flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium">
                <ShieldCheck className="text-positive size-4" aria-hidden="true" />
                Cổng vận hành nội bộ
              </div>
              <h1 className="text-ink-primary max-w-3xl font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Kiểm soát dòng hàng từ nhập kho đến bàn giao.
              </h1>
              <p className="text-ink-secondary mt-6 max-w-[62ch] text-base leading-7 sm:text-lg">
                StockFlowCommerce tập trung dữ liệu mua hàng, tồn kho và hoàn tất đơn vào một không
                gian làm việc nhất quán cho đội ngũ vận hành.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="rounded-[var(--r-sm)] px-5">
                  <Link href={APP_ROUTES.login}>
                    Vào hệ thống
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <span className="text-ink-tertiary text-sm">Dành cho nhân sự được cấp quyền</span>
              </div>
            </div>

            <div className="border-border-default bg-bg-subtle relative overflow-hidden rounded-[var(--r-md)] border p-6 shadow-[var(--sh-md)]">
              <div className="bg-accent/10 absolute -top-16 -right-16 size-48 rounded-full" />
              <div className="relative">
                <div className="border-border-default flex items-center justify-between border-b pb-5">
                  <div>
                    <p className="text-ink-tertiary text-xs font-medium">Trung tâm vận hành</p>
                    <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold">
                      Một luồng dữ liệu thống nhất
                    </p>
                  </div>
                  <div className="bg-brand text-ink-inverse flex size-11 items-center justify-center rounded-[var(--r-sm)]">
                    <Warehouse className="size-5" aria-hidden="true" />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="border-border-default bg-bg-surface rounded-[var(--r-sm)] border p-4">
                    <ChartNoAxesCombined className="text-accent size-5" aria-hidden="true" />
                    <p className="mt-4 text-sm font-semibold">Theo dõi tức thời</p>
                    <p className="text-ink-tertiary mt-1 text-xs leading-5">
                      Trạng thái công việc và ngoại lệ được tổng hợp tại một nơi.
                    </p>
                  </div>
                  <div className="border-border-default bg-bg-surface rounded-[var(--r-sm)] border p-4">
                    <ShieldCheck className="text-positive size-5" aria-hidden="true" />
                    <p className="mt-4 text-sm font-semibold">Phân quyền rõ ràng</p>
                    <p className="text-ink-tertiary mt-1 text-xs leading-5">
                      Mỗi vai trò chỉ truy cập đúng tác vụ thuộc trách nhiệm.
                    </p>
                  </div>
                </div>

                <div className="border-border-default bg-bg-surface mt-3 flex items-center gap-3 rounded-[var(--r-sm)] border p-4">
                  <div className="bg-positive/10 text-positive flex size-9 shrink-0 items-center justify-center rounded-full">
                    <ClipboardCheck className="size-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Sẵn sàng cho ca làm việc</p>
                    <p className="text-ink-tertiary text-xs">
                      Đăng nhập để tiếp tục vào dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-accent text-sm font-semibold">Vận hành xuyên suốt</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
              Công cụ cho từng điểm chạm trong kho
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {OPERATIONS.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="border-border-default bg-bg-surface rounded-[var(--r-sm)] border p-5"
              >
                <div className="bg-bg-subtle text-accent flex size-10 items-center justify-center rounded-[var(--r-sm)]">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-base font-semibold">{title}</h3>
                <p className="text-ink-secondary mt-2 text-sm leading-6">{description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-border-default bg-bg-surface border-t">
        <div className="text-ink-tertiary mx-auto flex max-w-7xl flex-col gap-2 px-6 py-6 text-xs sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span>© 2026 StockFlowCommerce</span>
          <span>Hệ thống quản lý vận hành kho</span>
        </div>
      </footer>
    </div>
  );
}
