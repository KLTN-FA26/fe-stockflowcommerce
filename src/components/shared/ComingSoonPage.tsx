import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/shared/Card";

interface ComingSoonPageProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
}

export function ComingSoonPage({ title, subtitle, icon: Icon }: ComingSoonPageProps) {
  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle ?? "Module đang được phát triển, dữ liệu sẽ dùng mock khi hoàn thiện UI."}
        breadcrumbs={[
          { label: "Back-office", href: "/admin" },
          { label: title },
        ]}
        actions={
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-[var(--r-sm)] border border-border-default bg-bg-surface px-3 py-1.5 text-[0.8125rem] font-medium text-ink-secondary transition-colors hover:bg-bg-muted hover:text-ink-primary"
          >
            <ArrowLeft className="size-3.5" />
            Về tổng quan
          </Link>
        }
      />

      <Card className="flex min-h-[360px] flex-col items-center justify-center text-center" variant="flush">
        <div className="relative mb-5">
          <div className="absolute -inset-5 rounded-full bg-accent/8" />
          <div className="relative flex size-16 items-center justify-center rounded-full bg-accent text-ink-inverse shadow-[0_14px_32px_color-mix(in_srgb,var(--accent)_24%,transparent)]">
            <Icon className="size-7" />
          </div>
        </div>
        <div className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.02em] text-ink-primary">
          Đang phát triển
        </div>
        <p className="mt-2 max-w-md text-[0.8125rem] leading-6 text-ink-secondary">
          Trang {title.toLowerCase()} chưa được dựng trong các tiến trình trước. UI sẽ được bổ sung theo đúng Mode A và mock data khi triển khai module này.
        </p>
      </Card>
    </>
  );
}
