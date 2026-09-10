"use client";

import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import type { ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/*  Custom toast renderer — match components-preview.html §Feedback           */
/*  .toast: border-left 3px solid tone, bg-surface, shadow-lg, r-md          */
/* -------------------------------------------------------------------------- */

const TONE_STYLES = {
  success: { borderColor: "var(--positive)", icon: <CheckCircle className="size-4 shrink-0 text-positive" /> },
  error: { borderColor: "var(--danger)", icon: <XCircle className="size-4 shrink-0 text-danger" /> },
  warning: { borderColor: "var(--warning)", icon: <AlertTriangle className="size-4 shrink-0 text-warning" /> },
  info: { borderColor: "var(--info)", icon: <Info className="size-4 shrink-0 text-info" /> },
} as const;

type ToastTone = keyof typeof TONE_STYLES;

function ToastContent({
  tone,
  title,
  description,
}: {
  tone: ToastTone;
  title: string;
  description?: string;
}) {
  const { borderColor, icon } = TONE_STYLES[tone];
  return (
    <div
      className="flex items-start gap-2.5 rounded-[var(--r-md)] border border-border-default bg-bg-surface px-3.5 py-3 shadow-[var(--sh-lg)]"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      {icon}
      <div>
        <div className="text-[0.8125rem] font-semibold text-ink-primary">{title}</div>
        {description && (
          <div className="mt-0.5 text-xs text-ink-secondary">{description}</div>
        )}
      </div>
    </div>
  );
}

/**
 * Toast system — wraps sonner. Render <ToastProvider /> once in root layout.
 * Toast style matches components-preview.html: left-border tone, icon, title + message.
 */
export function ToastProvider() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        unstyled: true,
        className: "w-full",
        duration: 4000,
      }}
    />
  );
}

function fireToast(tone: ToastTone, title: string, description?: string) {
  sonnerToast.custom(() => (
    <ToastContent tone={tone} title={title} description={description} />
  ));
}

export const toast = {
  success: (title: string, description?: string) => fireToast("success", title, description),
  error: (title: string, description?: string) => fireToast("error", title, description),
  warning: (title: string, description?: string) => fireToast("warning", title, description),
  info: (title: string, description?: string) => fireToast("info", title, description),
};
