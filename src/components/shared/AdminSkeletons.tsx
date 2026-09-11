import { cn } from "cn";

import { Skeleton } from "@/components/shared/Skeleton";

interface AdminPageHeaderSkeletonProps {
  withActions?: boolean;
}

interface AdminStatsSkeletonProps {
  tiles?: number;
}

interface AdminTableSkeletonProps {
  columns?: number;
  rows?: number;
  showStats?: boolean;
  showConfigSummary?: boolean;
}

interface AdminFormSkeletonProps {
  sections?: number;
  fieldsPerSection?: number;
  withSidebar?: boolean;
}

interface AdminDetailSkeletonProps {
  sections?: number;
  withSidebar?: boolean;
  withTimeline?: boolean;
}

const columnWidths = ["w-28", "w-40", "w-32", "w-24", "w-36", "w-20", "w-28", "w-24", "w-16"];

function widths(count: number) {
  return Array.from({ length: count }, (_, index) => columnWidths[index % columnWidths.length]);
}

export function AdminPageHeaderSkeleton({ withActions = true }: AdminPageHeaderSkeletonProps) {
  return (
    <div className="border-border-default mb-5 flex flex-wrap items-end justify-between gap-4 border-b pb-3.5">
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-2" />
          <Skeleton className="h-3.5 w-28" />
        </div>
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      {withActions && (
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-[var(--r-sm)]" />
          <Skeleton className="h-8 w-32 rounded-[var(--r-sm)]" />
        </div>
      )}
    </div>
  );
}

export function AdminStatsSkeleton({ tiles = 4 }: AdminStatsSkeletonProps) {
  return (
    <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: tiles }).map((_, index) => (
        <div
          key={index}
          className="border-border-default bg-bg-surface rounded-[var(--r-sm)] border p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="size-9 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminToolbarSkeleton() {
  return (
    <div className="border-border-default bg-bg-subtle rounded-t-[var(--r-sm)] border px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 w-72 rounded-[var(--r-sm)]" />
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="size-9 rounded-[var(--r-sm)]" />
          <Skeleton className="size-9 rounded-[var(--r-sm)]" />
          <Skeleton className="size-9 rounded-[var(--r-sm)]" />
        </div>
        <div className="flex-1" />
        <Skeleton className="h-9 w-24 rounded-[var(--r-sm)]" />
      </div>
    </div>
  );
}

export function AdminConfigSummarySkeleton() {
  return (
    <div className="border-border-default bg-bg-subtle border-x px-3 pb-3">
      <div className="border-border-default bg-bg-surface flex flex-wrap items-center gap-2 rounded-[var(--r-sm)] border px-3 py-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-6 w-36 rounded-full" />
        <div className="flex-1" />
        <Skeleton className="h-6 w-14 rounded-[var(--r-sm)]" />
      </div>
    </div>
  );
}

function TableHeaderSkeleton({ columns }: { columns: number }) {
  return (
    <div className="border-border-default bg-bg-subtle grid grid-cols-[34px_repeat(var(--cols),minmax(0,1fr))_40px] border-b px-3 py-2 [--cols:6] lg:[--cols:var(--dynamic-cols)]">
      <Skeleton className="size-4 self-center rounded-[var(--r-sm)]" />
      {widths(columns).map((width, index) => (
        <Skeleton key={index} className={cn("mx-2 h-4 self-center", width)} />
      ))}
      <Skeleton className="size-5 justify-self-end rounded-[var(--r-sm)]" />
    </div>
  );
}

function TableRowSkeleton({ columns, index }: { columns: number; index: number }) {
  return (
    <div className="border-border-default grid grid-cols-[34px_repeat(var(--cols),minmax(0,1fr))_40px] items-center border-b px-3 py-3 [--cols:6] last:border-b-0 lg:[--cols:var(--dynamic-cols)]">
      <Skeleton className="size-4 rounded-[var(--r-sm)]" />
      {widths(columns).map((width, columnIndex) => (
        <Skeleton
          key={`${index}-${columnIndex}`}
          className={cn(
            "mx-2 h-4",
            columnIndex === columns - 2 ? "h-5 w-24 rounded-full" : width,
            columnIndex === columns - 1 && "justify-self-end",
          )}
        />
      ))}
      <Skeleton className="size-7 justify-self-end rounded-[var(--r-sm)]" />
    </div>
  );
}

export function AdminTableSkeleton({
  columns = 7,
  rows = 10,
  showStats = false,
  showConfigSummary = true,
}: AdminTableSkeletonProps) {
  const dynamicStyle = { "--dynamic-cols": columns } as React.CSSProperties;

  return (
    <div className="space-y-4" aria-busy="true" aria-label="Đang tải dữ liệu">
      <AdminPageHeaderSkeleton />
      {showStats && <AdminStatsSkeleton tiles={4} />}
      <div style={dynamicStyle}>
        <AdminToolbarSkeleton />
        {showConfigSummary && <AdminConfigSummarySkeleton />}
        <div className="border-border-default bg-bg-surface overflow-hidden rounded-b-[var(--r-sm)] border">
          <TableHeaderSkeleton columns={columns} />
          {Array.from({ length: rows }).map((_, index) => (
            <TableRowSkeleton key={index} columns={columns} index={index} />
          ))}
          <div className="border-border-default bg-bg-subtle flex flex-wrap items-center gap-3 border-t px-3 py-2">
            <Skeleton className="h-8 w-28 rounded-[var(--r-sm)]" />
            <Skeleton className="h-4 w-36" />
            <div className="flex-1" />
            <Skeleton className="h-8 w-32 rounded-[var(--r-sm)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FormSectionSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <section className="border-border-default bg-bg-surface rounded-[var(--r-sm)] border p-4">
      <div className="mb-4 space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3.5 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: fields }).map((_, index) => (
          <div
            key={index}
            className={cn("space-y-2", index === fields - 1 && fields > 3 && "md:col-span-2")}
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton
              className={cn(
                "h-9 w-full rounded-[var(--r-sm)]",
                index === fields - 1 && fields > 3 && "h-20",
              )}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function SidePanelSkeleton() {
  return (
    <aside className="space-y-4">
      <div className="border-border-default bg-bg-surface rounded-[var(--r-sm)] border p-4">
        <div className="mb-4 flex items-center gap-3">
          <Skeleton className="size-11 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-24" />
            </div>
          ))}
        </div>
      </div>
      <div className="border-border-default bg-bg-surface rounded-[var(--r-sm)] border p-4">
        <Skeleton className="mb-4 h-4 w-28" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-full rounded-[var(--r-sm)]" />
          <Skeleton className="h-8 w-full rounded-[var(--r-sm)]" />
        </div>
      </div>
    </aside>
  );
}

function TimelineSkeleton() {
  return (
    <div className="border-border-default bg-bg-surface rounded-[var(--r-sm)] border p-4">
      <Skeleton className="mb-4 h-5 w-36" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="grid grid-cols-[16px_1fr] gap-3">
            <div className="flex flex-col items-center">
              <Skeleton className="size-3 rounded-full" />
              {index < 4 && <div className="bg-border-default mt-1 h-10 w-px" />}
            </div>
            <div className="space-y-2 pb-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminFormSkeleton({
  sections = 3,
  fieldsPerSection = 4,
  withSidebar = false,
}: AdminFormSkeletonProps) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Đang tải biểu mẫu">
      <AdminPageHeaderSkeleton />
      <div className={cn("grid gap-4", withSidebar && "lg:grid-cols-[minmax(0,1fr)_320px]")}>
        <div className="space-y-4">
          {Array.from({ length: sections }).map((_, index) => (
            <FormSectionSkeleton key={index} fields={fieldsPerSection} />
          ))}
          <div className="border-border-default flex justify-end gap-2 border-t pt-4">
            <Skeleton className="h-9 w-24 rounded-[var(--r-sm)]" />
            <Skeleton className="h-9 w-32 rounded-[var(--r-sm)]" />
          </div>
        </div>
        {withSidebar && <SidePanelSkeleton />}
      </div>
    </div>
  );
}

export function AdminDetailSkeleton({
  sections = 3,
  withSidebar = false,
  withTimeline = false,
}: AdminDetailSkeletonProps) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Đang tải chi tiết">
      <AdminPageHeaderSkeleton />
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="border-border-default bg-bg-surface rounded-[var(--r-sm)] border p-4"
          >
            <Skeleton className="mb-2 h-3.5 w-24" />
            <Skeleton className="mb-3 h-6 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>
      <div
        className={cn(
          "grid gap-4",
          (withSidebar || withTimeline) && "lg:grid-cols-[minmax(0,1fr)_320px]",
        )}
      >
        <div className="space-y-4">
          {Array.from({ length: sections }).map((_, index) => (
            <section
              key={index}
              className="border-border-default bg-bg-surface rounded-[var(--r-sm)] border p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-7 w-24 rounded-[var(--r-sm)]" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {Array.from({ length: 4 }).map((__, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="border-border-default flex items-center justify-between gap-3 border-b py-2 last:border-b-0"
                  >
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3.5 w-36" />
                  </div>
                ))}
              </div>
            </section>
          ))}
          <div className="border-border-default bg-bg-surface rounded-[var(--r-sm)] border">
            <TableHeaderSkeleton columns={5} />
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRowSkeleton key={index} columns={5} index={index} />
            ))}
          </div>
        </div>
        {(withSidebar || withTimeline) && (
          <div className="space-y-4">
            {withSidebar && <SidePanelSkeleton />}
            {withTimeline && <TimelineSkeleton />}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Đang tải tổng quan">
      <AdminPageHeaderSkeleton />
      <AdminStatsSkeleton tiles={6} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <div className="border-border-default bg-bg-surface rounded-[var(--r-sm)] border">
          <div className="border-border-default border-b px-4 py-3">
            <Skeleton className="h-5 w-44" />
          </div>
          <TableHeaderSkeleton columns={5} />
          {Array.from({ length: 6 }).map((_, index) => (
            <TableRowSkeleton key={index} columns={5} index={index} />
          ))}
        </div>
        <TimelineSkeleton />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="border-border-default bg-bg-surface rounded-[var(--r-sm)] border p-4"
          >
            <Skeleton className="mb-4 h-5 w-36" />
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-[var(--r-sm)]" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
