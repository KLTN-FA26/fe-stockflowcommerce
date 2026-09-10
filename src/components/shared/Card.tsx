import { cn } from "cn";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  /** flush = Mode A (border, no shadow), elevated = Mode B (shadow). Auto theo mode nếu omit. */
  variant?: "flush" | "elevated";
  className?: string;
}

export function Card({ children, variant, className }: CardProps) {
  return (
    <div
      className={cn(
        // Base: dùng CSS vars tự đổi theo mode
        "bg-bg-surface border-border-default transition-colors duration-200",
        // Radius + padding + shadow từ CSS vars (mode-dependent)
        "rounded-[var(--card-radius)] p-[var(--card-pad)] shadow-[var(--card-shadow)]",
        // Border luôn hiện (flush có border, elevated cũng có border nhẹ)
        "border",
        // Variant override
        variant === "flush" && "shadow-none",
        variant === "elevated" && "shadow-[var(--sh-md)]",
        className
      )}
    >
      {children}
    </div>
  );
}
