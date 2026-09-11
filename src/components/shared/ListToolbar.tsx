"use client";

import type { ReactNode } from "react";
import { cn } from "cn";
import { Columns3, FileDown, Filter, ListFilter, RotateCcw, Search, Settings2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface ListOption<T extends string> {
  label: string;
  value: T;
}

export interface ListSummaryItem {
  label: string;
  value: ReactNode;
  active?: boolean;
  onClear?: () => void;
  clearLabel?: string;
}

export interface ListToolbarProps<Status extends string, Field extends string, Column extends string> {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  statusOptions?: ListOption<Status>[];
  selectedStatuses?: Status[];
  onToggleStatus?: (status: Status) => void;
  onClearStatuses?: () => void;
  hasStatusFilter?: boolean;
  fieldOptions?: ListOption<Field>[];
  selectedFields?: Field[];
  defaultFields?: Field[];
  onToggleField?: (field: Field) => void;
  onResetFields?: () => void;
  onSelectAllFields?: () => void;
  hasFieldConfig?: boolean;
  columnOptions?: ListOption<Column>[];
  selectedColumns?: Column[];
  defaultColumns?: Column[];
  lockedColumns?: Column[];
  visibleColumnCount?: number;
  onToggleColumn?: (column: Column) => void;
  onResetColumns?: () => void;
  hasColumnConfig?: boolean;
  selectedCount?: number;
  bulkDeleteLabel?: string;
  onBulkDelete?: () => void;
  exportLabel?: string;
  onExport: () => void;
  summaryItems: ListSummaryItem[];
  onResetAll: () => void;
  resetDisabled?: boolean;
}

function commandItemClassName() {
  return "data-selected:bg-transparent data-selected:text-ink-secondary hover:bg-bg-muted/60 hover:text-ink-primary";
}

export function ListToolbar<Status extends string, Field extends string, Column extends string>({
  search,
  onSearchChange,
  searchPlaceholder,
  statusOptions,
  selectedStatuses = [],
  onToggleStatus,
  onClearStatuses,
  hasStatusFilter = false,
  fieldOptions,
  selectedFields = [],
  defaultFields = [],
  onToggleField,
  onResetFields,
  onSelectAllFields,
  hasFieldConfig = false,
  columnOptions,
  selectedColumns = [],
  defaultColumns = [],
  lockedColumns = [],
  visibleColumnCount,
  onToggleColumn,
  onResetColumns,
  hasColumnConfig = false,
  selectedCount = 0,
  bulkDeleteLabel = "Xoá đã chọn",
  onBulkDelete,
  exportLabel = "Xuất Excel",
  onExport,
  summaryItems,
  onResetAll,
  resetDisabled = false,
}: ListToolbarProps<Status, Field, Column>) {
  const canUseStatus = Boolean(statusOptions?.length && onToggleStatus);
  const canUseFields = Boolean(fieldOptions?.length && onToggleField);
  const canUseColumns = Boolean(columnOptions?.length && onToggleColumn);

  return (
    <TooltipProvider>
      <div className="mb-3 rounded-[var(--r-sm)] border border-border-default bg-bg-surface px-3 py-2 shadow-[var(--card-shadow)]">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[280px] flex-1 lg:max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-accent" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 rounded-[var(--r-sm)] border-border-default bg-bg-surface pl-9 text-[0.8125rem] shadow-none focus-visible:border-accent focus-visible:ring-accent/20"
            />
          </div>

          <div className="flex items-center gap-2">
            {canUseStatus && (
              <Popover>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Lọc trạng thái"
                        className={cn(
                          "rounded-[var(--r-sm)] border-border-default bg-bg-surface text-ink-tertiary hover:bg-bg-muted hover:text-ink-primary focus-visible:ring-0",
                          hasStatusFilter && "border-info bg-info/10 text-info hover:bg-info/10 hover:text-info"
                        )}
                      >
                        <Filter className={cn("size-4 text-info", hasStatusFilter && "text-current")} />
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Lọc trạng thái</TooltipContent>
                </Tooltip>
                <PopoverContent align="end" className="w-80 p-0">
                  <PopoverHeader className="border-b border-border-default p-3">
                    <PopoverTitle>Lọc trạng thái</PopoverTitle>
                    <PopoverDescription>Search và chọn trạng thái cần hiển thị.</PopoverDescription>
                  </PopoverHeader>
                  <Command>
                    <CommandInput placeholder="Tìm trạng thái..." />
                    <CommandList>
                      <CommandEmpty>Không có trạng thái phù hợp.</CommandEmpty>
                      <CommandGroup>
                        {statusOptions!.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => onToggleStatus!(option.value)}
                            className={commandItemClassName()}
                          >
                            <Checkbox checked={selectedStatuses.includes(option.value)} />
                            <span>{option.label}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                  <div className="flex justify-between gap-2 border-t border-border-default p-2">
                    <Button type="button" variant="outline" size="sm" onClick={onClearStatuses}>
                      Xoá lọc
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {canUseFields && (
              <Popover>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Chọn trường search"
                        className={cn(
                          "rounded-[var(--r-sm)] border-border-default bg-bg-surface text-ink-tertiary hover:bg-special/5 hover:text-special focus-visible:border-border-default focus-visible:ring-0 data-[state=open]:border-border-default data-[state=open]:bg-bg-surface data-[state=open]:text-ink-tertiary",
                          hasFieldConfig && "border-special bg-special/10 text-special hover:border-special hover:bg-special/10 hover:text-special data-[state=open]:border-special data-[state=open]:bg-special/10 data-[state=open]:text-special"
                        )}
                      >
                        <ListFilter className={cn("size-4 text-special", hasFieldConfig && "text-current")} />
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Trường tìm kiếm</TooltipContent>
                </Tooltip>
                <PopoverContent align="end" className="w-[25rem] p-0">
                  <PopoverHeader className="border-b border-border-default p-3">
                    <PopoverTitle>Trường tìm kiếm</PopoverTitle>
                    <PopoverDescription>Chọn fields cho thanh search chính.</PopoverDescription>
                  </PopoverHeader>
                  <Command>
                    <CommandInput placeholder="Tìm field..." />
                    <CommandList>
                      <CommandEmpty>Không có field phù hợp.</CommandEmpty>
                      <CommandGroup>
                        {fieldOptions!.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => onToggleField!(option.value)}
                            className={commandItemClassName()}
                          >
                            <Checkbox checked={selectedFields.includes(option.value)} />
                            <span>{option.label}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                  <div className="flex justify-between gap-2 border-t border-border-default p-2">
                    <Button type="button" variant="outline" size="sm" onClick={onResetFields} disabled={defaultFields.length === 0}>
                      Mặc định
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={onSelectAllFields}>
                      Chọn tất cả
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {canUseColumns && (
              <Popover>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Ẩn hiện cột"
                        className={cn(
                          "rounded-[var(--r-sm)] border-border-default bg-bg-surface text-ink-tertiary hover:bg-bg-muted hover:text-ink-primary focus-visible:ring-0",
                          hasColumnConfig && "border-warning bg-warning/10 text-warning hover:bg-warning/10 hover:text-warning"
                        )}
                      >
                        <Columns3 className={cn("size-4 text-warning", hasColumnConfig && "text-current")} />
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Ẩn hiện cột</TooltipContent>
                </Tooltip>
                <PopoverContent align="end" className="w-80 p-0">
                  <PopoverHeader className="border-b border-border-default p-3">
                    <PopoverTitle>Ẩn hiện cột</PopoverTitle>
                    <PopoverDescription>Chọn các cột muốn thấy trên table.</PopoverDescription>
                  </PopoverHeader>
                  <Command>
                    <CommandInput placeholder="Tìm cột..." />
                    <CommandList>
                      <CommandEmpty>Không có cột phù hợp.</CommandEmpty>
                      <CommandGroup>
                        {columnOptions!.map((option) => {
                          const locked = lockedColumns.includes(option.value);
                          const checked = selectedColumns.includes(option.value);
                          const disabled = locked || (checked && (visibleColumnCount ?? selectedColumns.length) <= 1);
                          return (
                            <CommandItem
                              key={option.value}
                              value={option.label}
                              disabled={disabled}
                              onSelect={() => onToggleColumn!(option.value)}
                              className={commandItemClassName()}
                            >
                              <Checkbox checked={checked} disabled={disabled} />
                              <span>{option.label}</span>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                  <div className="flex justify-between gap-2 border-t border-border-default p-2">
                    <Button type="button" variant="outline" size="sm" onClick={onResetColumns} disabled={defaultColumns.length === 0}>
                      Hiện tất cả
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {selectedCount > 0 && onBulkDelete && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onBulkDelete}
                className="rounded-[var(--r-sm)] border-danger/20 bg-danger/5 text-danger hover:bg-danger/10 hover:text-danger"
              >
                <X className="size-4" />
                {bulkDeleteLabel}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onExport}
              className="rounded-[var(--r-sm)] border-positive/20 bg-positive/5 text-positive hover:bg-positive/10 hover:text-positive"
            >
              <FileDown className="size-4" />
              {exportLabel}
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[var(--r-sm)] border border-border-default bg-bg-subtle/70 px-3 py-2 text-[0.8125rem]">
        <div className="mr-1 flex items-center gap-2 font-medium text-ink-primary">
          <Settings2 className="size-3.5 text-accent" />
          Cấu hình
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          {summaryItems.map((item) => (
            <Badge key={item.label} variant="outline" className="gap-1 bg-bg-subtle text-ink-secondary">
              {item.label}: {item.value}
              {item.active && item.onClear && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={item.onClear}
                  aria-label={item.clearLabel ?? `Xoá ${item.label}`}
                  className="size-4 rounded-full p-0 text-ink-tertiary hover:bg-bg-muted hover:text-ink-primary"
                >
                  <X className="size-3" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onResetAll}
          disabled={resetDisabled}
          className="ml-auto rounded-[var(--r-sm)] text-ink-tertiary hover:bg-bg-muted hover:text-ink-primary"
        >
          <RotateCcw className="size-3" />
          Đặt lại
        </Button>
      </div>
    </TooltipProvider>
  );
}

interface ColumnFilterButtonProps {
  value: string;
  label: string;
  placeholder: string;
  onChange: (value: string) => void;
}

export function ColumnFilterButton({ value, label, placeholder, onChange }: ColumnFilterButtonProps) {
  const active = Boolean(value.trim());

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`Lọc ${label}`}
          className={cn(
            "size-6 rounded-[var(--r-sm)] text-ink-tertiary hover:bg-bg-muted hover:text-ink-primary focus-visible:ring-0",
            active && "bg-info/10 text-info hover:bg-info/10 hover:text-info"
          )}
        >
          <Filter className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        <div className="mb-2 text-xs font-medium text-ink-primary">Lọc {label}</div>
        <Input
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 rounded-[var(--r-sm)] bg-bg-surface text-[0.75rem]"
        />
        <div className="mt-2 flex justify-end">
          <Button type="button" variant="outline" size="xs" onClick={() => onChange("")} disabled={!active}>
            Xoá
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
