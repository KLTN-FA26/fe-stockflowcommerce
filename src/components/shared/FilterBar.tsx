"use client";

import { cn } from "cn";

interface FilterChip {
  label: string;
  value: string;
}

interface FilterBarProps {
  chips: FilterChip[];
  active?: string;
  onChange?: (value: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function FilterBar({
  chips,
  active,
  onChange,
  className,
  children,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-[var(--r-sm)] border border-border-default bg-bg-subtle p-3",
        className
      )}
    >
      {chips.map((chip) => {
        const isActive = chip.value === active;
        return (
          <button
            key={chip.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange?.(chip.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.8125rem] transition-colors duration-150",
              isActive
                ? "border-brand bg-brand text-ink-inverse font-medium"
                : "border-border-default bg-bg-surface text-ink-secondary hover:border-accent"
            )}
          >
            {chip.label}
          </button>
        );
      })}
      {children}
    </div>
  );
}
