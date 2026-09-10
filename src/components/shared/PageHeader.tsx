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
}

export function PageHeader({
  title,
  breadcrumbs,
  actions,
  subtitle,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-4 border-b border-border-default pb-3.5 mb-5",
        className
      )}
    >
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-1.5 text-[0.8125rem] text-ink-tertiary">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="opacity-50">/</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="text-ink-secondary hover:text-accent transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-medium text-ink-primary">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="font-[family-name:var(--font-display)] text-[1.875rem] font-bold leading-[1.2] tracking-[-0.02em] text-ink-primary">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[0.875rem] text-ink-secondary">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
