import { cn } from "cn";

type SkeletonProps = React.ComponentProps<"div">;

/**
 * Shimmer skeleton — dùng thay cho ui/skeleton khi cần shimmer gradient
 * theo design system (preview .sk class). Tôn trọng prefers-reduced-motion.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-[var(--r-sm)] bg-[linear-gradient(90deg,var(--bg-muted)_25%,var(--bg-subtle)_37%,var(--bg-muted)_63%)] bg-[length:400%_100%]",
        "motion-reduce:bg-bg-muted motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}
