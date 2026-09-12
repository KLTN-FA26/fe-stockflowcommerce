import { cn } from "cn";
import type { ReactNode } from "react";
import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  subtitle?: string;
  className?: string;
  hideTitle?: boolean;
}

export function PageHeader({
  title,
  breadcrumbs,
  actions,
  subtitle,
  className,
  hideTitle = false,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "border-border-default mb-5 flex flex-wrap items-end justify-between gap-4 border-b pb-3.5",
        className,
      )}
    >
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="text-ink-tertiary mb-1 flex items-center gap-1.5 text-[0.8125rem]"
          >
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="opacity-50">/</span>}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-ink-secondary hover:text-accent transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-ink-primary font-medium">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        {!hideTitle && (
          <>
            <h1 className="text-ink-primary font-[family-name:var(--font-display)] text-[1.875rem] leading-[1.2] font-bold tracking-[-0.02em]">
              {title}
            </h1>
            {subtitle && <p className="text-ink-secondary mt-1 text-[0.875rem]">{subtitle}</p>}
          </>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
