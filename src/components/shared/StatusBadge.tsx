import { cn } from "cn";
import { toneOf, STATUS_LABEL_VI } from "@/lib/status-map";
import type { StatusDomain, SemanticTone } from "@/lib/mock-data";

interface StatusBadgeProps {
  domain: StatusDomain;
  status: string;
  size?: "sm" | "md";
  withIcon?: boolean;
  className?: string;
}

const TONE_CLASSES: Record<SemanticTone, string> = {
  positive:
    "text-positive bg-[color-mix(in_srgb,var(--positive)_12%,transparent)] border-[color-mix(in_srgb,var(--positive)_26%,transparent)]",
  info: "text-info bg-[color-mix(in_srgb,var(--info)_12%,transparent)] border-[color-mix(in_srgb,var(--info)_26%,transparent)]",
  warning:
    "text-warning bg-[color-mix(in_srgb,var(--warning)_14%,transparent)] border-[color-mix(in_srgb,var(--warning)_28%,transparent)]",
  danger:
    "text-danger bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] border-[color-mix(in_srgb,var(--danger)_26%,transparent)]",
  neutral:
    "text-neutral bg-[color-mix(in_srgb,var(--neutral)_12%,transparent)] border-[color-mix(in_srgb,var(--neutral)_24%,transparent)]",
  muted:
    "text-muted-tone bg-[color-mix(in_srgb,var(--muted)_14%,transparent)] border-[color-mix(in_srgb,var(--muted)_26%,transparent)]",
  special:
    "text-special bg-[color-mix(in_srgb,var(--special)_12%,transparent)] border-[color-mix(in_srgb,var(--special)_26%,transparent)]",
};

export function StatusBadge({
  domain,
  status,
  size = "sm",
  withIcon = false,
  className,
}: StatusBadgeProps) {
  void domain;
  const tone = toneOf(status);
  const labelVi = STATUS_LABEL_VI[status];
  const title = labelVi ? `${labelVi} — ${status}` : status;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border leading-[1.4] font-medium whitespace-nowrap",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        TONE_CLASSES[tone],
        className,
      )}
      title={title}
    >
      {withIcon && <span className="size-1.5 shrink-0 rounded-full bg-current" />}
      {labelVi ?? status}
    </span>
  );
}
