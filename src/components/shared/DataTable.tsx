"use client";

import { useState, useMemo } from "react";
import { cn } from "cn";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/*  Column config                                                            */
/* -------------------------------------------------------------------------- */

export interface ColumnDef<T> {
  key: string;
  header: string;
  /** Render cell content. Return ReactNode. */
  cell: (row: T) => ReactNode;
  /** Enable sorting by this column. */
  sortable?: boolean;
  /** Custom sort comparator. Default: localeCompare / numeric compare. */
  compare?: (a: T, b: T) => number;
  /** Align right for numbers. */
  align?: "left" | "right" | "center";
  /** Fixed width class. */
  className?: string;
  /** Header extra class */
  headerClassName?: string;
}

/* -------------------------------------------------------------------------- */
/*  DataTable                                                                */
/* -------------------------------------------------------------------------- */

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  /** Unique row key extractor. */
  rowKey: (row: T) => string;
  caption?: string;
  /** Row gets `flag` left-border warning when true. */
  flagRow?: (row: T) => boolean;
  /** Click handler on row. */
  onRowClick?: (row: T) => void;
  /** Enable bulk-select checkbox column. */
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  /** Page size. Default 10. */
  pageSize?: number;
  className?: string;
}

type SortDir = "asc" | "desc";

export function DataTable<T>({
  data,
  columns,
  rowKey,
  caption,
  flagRow,
  onRowClick,
  selectable = false,
  selectedKeys,
  onSelectionChange,
  pageSize = 10,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortable) return data;
    const arr = [...data];
    if (col.compare) {
      arr.sort((a, b) => (sortDir === "asc" ? col.compare!(a, b) : col.compare!(b, a)));
    }
    return arr;
  }, [data, columns, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageData = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Selection helpers
  const allSelected = pageData.length > 0 && pageData.every((r) => selectedKeys?.has(rowKey(r)));
  const toggleAll = () => {
    if (!onSelectionChange || !selectedKeys) return;
    const next = new Set(selectedKeys);
    if (allSelected) {
      pageData.forEach((r) => next.delete(rowKey(r)));
    } else {
      pageData.forEach((r) => next.add(rowKey(r)));
    }
    onSelectionChange(next);
  };

  const toggleOne = (key: string) => {
    if (!onSelectionChange || !selectedKeys) return;
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectionChange(next);
  };

  return (
    <div className={cn("overflow-hidden rounded-[var(--r-sm)] border border-border-default bg-bg-surface", className)}>
      <Table>
        {caption && <TableCaption>{caption}</TableCaption>}
        <TableHeader>
          <TableRow className="border-border-default bg-bg-subtle hover:bg-bg-subtle">
            {selectable && (
              <TableHead className="w-[34px]">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Chọn tất cả" />
              </TableHead>
            )}
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn(
                  "text-xs font-semibold text-ink-secondary",
                  col.sortable && "cursor-pointer select-none hover:text-ink-primary",
                  col.align === "right" && "text-right",
                  col.headerClassName
                )}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <span className="text-ink-tertiary">
                      {sortKey === col.key ? (
                        sortDir === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />
                      ) : (
                        <ChevronsUpDown className="size-3 opacity-40" />
                      )}
                    </span>
                  )}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + (selectable ? 1 : 0)} className="py-8 text-center text-ink-tertiary">
                Không có dữ liệu
              </TableCell>
            </TableRow>
          ) : (
            pageData.map((row) => {
              const key = rowKey(row);
              const isFlag = flagRow?.(row) ?? false;
              return (
                <TableRow
                  key={key}
                  data-state={selectedKeys?.has(key) ? "selected" : undefined}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-border-default transition-colors",
                    onRowClick && "cursor-pointer",
                    isFlag && "shadow-[inset_2px_0_0_var(--warning)]"
                  )}
                >
                  {selectable && (
                    <TableCell className="w-[34px]">
                      <Checkbox
                        checked={selectedKeys?.has(key) ?? false}
                        onCheckedChange={() => toggleOne(key)}
                        aria-label={`Chọn ${key}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        "text-[0.8125rem]",
                        col.align === "right" && "text-right tabular-nums",
                        col.className
                      )}
                    >
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Pagination footer */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-default bg-bg-subtle px-3.5 py-2 text-xs text-ink-secondary">
          <span>
            Hiển thị {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, sorted.length)} / {sorted.length}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={safePage === 0}
              onClick={() => setPage((p) => p - 1)}
              className="flex size-7 items-center justify-center rounded-[var(--r-sm)] border border-border-default bg-bg-surface text-ink-secondary hover:text-ink-primary disabled:opacity-40"
              aria-label="Trước"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-current={i === safePage ? "true" : undefined}
                onClick={() => setPage(i)}
                className={cn(
                  "flex min-w-7 size-7 items-center justify-center rounded-[var(--r-sm)] border text-xs",
                  i === safePage
                    ? "border-brand bg-brand text-ink-inverse font-medium"
                    : "border-border-default bg-bg-surface text-ink-secondary hover:text-ink-primary"
                )}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="flex size-7 items-center justify-center rounded-[var(--r-sm)] border border-border-default bg-bg-surface text-ink-secondary hover:text-ink-primary disabled:opacity-40"
              aria-label="Sau"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
