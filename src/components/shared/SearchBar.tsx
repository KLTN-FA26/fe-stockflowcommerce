"use client";

import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Tìm kiếm…",
  className,
  ...props
}: SearchBarProps) {
  return (
    <div className={cn("relative flex min-w-[200px] flex-1 items-center", className)}>
      <SearchIcon className="pointer-events-none absolute left-[11px] size-4 text-ink-tertiary" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="h-9 rounded-[var(--r-sm)] border-border-default bg-bg-surface pl-[34px] pr-3 text-[0.875rem] text-ink-primary shadow-none placeholder:text-ink-tertiary hover:border-border-strong focus-visible:border-accent focus-visible:ring-[3px] focus-visible:ring-accent/20"
        {...props}
      />
    </div>
  );
}
