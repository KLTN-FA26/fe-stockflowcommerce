"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Barcode, Weight, Package, RotateCcw, Layers } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "@/components/shared/Toast";
import { formatVND, type Sku, type SkuStatus } from "@/lib/mock-data";

/* -------------------------------------------------------------------------- */
/*  SKU status actions                                                        */
/* -------------------------------------------------------------------------- */

const SKU_STATUS_ACTIONS: Record<string, { label: string; next: SkuStatus; tone: string }[]> = {
  Active: [
    { label: "Khoá SKU", next: "Blocked", tone: "warning" },
    { label: "Ngừng sử dụng", next: "Obsolete", tone: "danger" },
  ],
  Blocked: [
    { label: "Mở khoá", next: "Active", tone: "positive" },
    { label: "Ngừng sử dụng", next: "Obsolete", tone: "danger" },
  ],
  Obsolete: [],
};

const ACTION_TONE_CLASSES: Record<string, string> = {
  positive: "bg-positive text-white hover:bg-positive/90",
  warning: "bg-warning text-white hover:bg-warning/90",
  danger: "border-danger text-danger hover:bg-danger/10 bg-transparent",
};

/* -------------------------------------------------------------------------- */
/*  Info row                                                                  */
/* -------------------------------------------------------------------------- */

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-xs font-medium text-ink-tertiary">{label}</span>
      <span className="text-right text-[0.8125rem] text-ink-primary">{children}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Props                                                                     */
/* -------------------------------------------------------------------------- */

interface SkuDetailPanelProps {
  sku: Sku | null;
  open: boolean;
  onClose: () => void;
  onStatusChange?: (skuId: string, newStatus: SkuStatus) => void;
}

/* -------------------------------------------------------------------------- */
/*  Panel                                                                     */
/* -------------------------------------------------------------------------- */

export function SkuDetailPanel({ sku, open, onClose, onStatusChange }: SkuDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const actions = sku ? SKU_STATUS_ACTIONS[sku.status] ?? [] : [];

  return (
    <AnimatePresence>
      {open && sku && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[900] bg-black/20 backdrop-blur-xs"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 z-[1100] flex h-full w-full max-w-md flex-col border-l border-border-default bg-bg-surface shadow-[var(--sh-lg)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-default px-5 py-4">
              <div className="min-w-0">
                <h2 className="font-[family-name:var(--font-mono)] text-sm font-semibold text-accent">
                  {sku.skuId}
                </h2>
                <p className="mt-0.5 truncate text-xs text-ink-secondary">{sku.variantLabel}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge domain="sku" status={sku.status} size="sm" withIcon />
                <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Đóng">
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Actions */}
              {actions.length > 0 && (
                <div className="flex flex-wrap gap-2 rounded-[var(--r-sm)] border border-border-default bg-bg-subtle p-3">
                  <span className="self-center text-xs font-medium text-ink-tertiary">Hành động:</span>
                  {actions.map((act) => (
                    <Button
                      key={act.next}
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => onStatusChange?.(sku.skuId, act.next)}
                      className={cn(
                        "rounded-[var(--r-sm)] text-xs font-medium",
                        ACTION_TONE_CLASSES[act.tone] ?? "border-border-default text-ink-secondary hover:bg-bg-muted"
                      )}
                    >
                      {act.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* Biến thể */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">
                  Tổ hợp biến thể
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(sku.attributes).map(([key, val]) => (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-bg-subtle px-2.5 py-0.5 text-xs font-medium text-ink-secondary"
                    >
                      <span className="text-ink-tertiary">{key}:</span> {val}
                    </span>
                  ))}
                </div>
              </section>

              {/* Định danh */}
              <section>
                <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">
                  <Barcode className="size-3.5 text-accent" />
                  Định danh
                </h3>
                <div className="divide-y divide-border-default rounded-[var(--r-sm)] border border-border-default bg-bg-subtle px-3">
                  <InfoRow label="Mã SKU">
                    <span className="font-[family-name:var(--font-mono)] font-medium text-accent">{sku.skuId}</span>
                  </InfoRow>
                  <InfoRow label="Barcode">
                    <span className="font-[family-name:var(--font-mono)] tabular-nums">{sku.barcode}</span>
                  </InfoRow>
                  <InfoRow label="Đơn vị tính">{sku.uom}</InfoRow>
                </div>
              </section>

              {/* Giá */}
              <section>
                <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">
                  <Layers className="size-3.5 text-accent" />
                  Giá
                </h3>
                <div className="divide-y divide-border-default rounded-[var(--r-sm)] border border-border-default bg-bg-subtle px-3">
                  <InfoRow label="Giá vốn">
                    <span className="font-[family-name:var(--font-mono)] font-medium">{formatVND(sku.cost)}</span>
                  </InfoRow>
                </div>
              </section>

              {/* Thông số vật lý */}
              <section>
                <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">
                  <Weight className="size-3.5 text-accent" />
                  Thông số vật lý
                </h3>
                <div className="divide-y divide-border-default rounded-[var(--r-sm)] border border-border-default bg-bg-subtle px-3">
                  <InfoRow label="Trọng lượng">
                    <span className="font-[family-name:var(--font-mono)] tabular-nums">{sku.weightKg} kg</span>
                  </InfoRow>
                </div>
              </section>

              {/* Tồn kho */}
              <section>
                <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">
                  <Package className="size-3.5 text-accent" />
                  Tồn kho
                </h3>
                <div className="divide-y divide-border-default rounded-[var(--r-sm)] border border-border-default bg-bg-subtle px-3">
                  <InfoRow label="Tồn kho (on-hand)">
                    <span className="font-[family-name:var(--font-mono)] font-medium tabular-nums">
                      {sku.stockOnHand.toLocaleString("vi-VN")}
                    </span>
                  </InfoRow>
                  <InfoRow label="Đã đặt (reserved)">
                    <span className="font-[family-name:var(--font-mono)] tabular-nums text-warning">
                      {sku.stockReserved.toLocaleString("vi-VN")}
                    </span>
                  </InfoRow>
                  <InfoRow label="Khả dụng (available)">
                    <span className={cn(
                      "font-[family-name:var(--font-mono)] font-medium tabular-nums",
                      sku.stockAvailable <= sku.reorderPoint ? "text-danger" : "text-positive"
                    )}>
                      {sku.stockAvailable.toLocaleString("vi-VN")}
                    </span>
                  </InfoRow>
                  <InfoRow label="Điểm đặt lại (reorder)">
                    <span className="font-[family-name:var(--font-mono)] tabular-nums">
                      {sku.reorderPoint.toLocaleString("vi-VN")}
                    </span>
                  </InfoRow>
                  {sku.stockAvailable <= sku.reorderPoint && sku.reorderPoint > 0 && (
                    <div className="py-2">
                      <div className="rounded-[var(--r-sm)] bg-danger/10 px-2.5 py-1.5 text-xs font-medium text-danger">
                        Tồn kho dưới ngưỡng đặt lại — cần bổ sung
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Kiểm soát tồn kho */}
              <section>
                <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">
                  <RotateCcw className="size-3.5 text-accent" />
                  Kiểm soát tồn kho
                </h3>
                <div className="divide-y divide-border-default rounded-[var(--r-sm)] border border-border-default bg-bg-subtle px-3">
                  <InfoRow label="Theo dõi lô (Lot)">
                    <span className={cn("text-xs font-medium", sku.lotTracking ? "text-positive" : "text-ink-tertiary")}>
                      {sku.lotTracking ? "Có" : "Không"}
                    </span>
                  </InfoRow>
                  <InfoRow label="Theo dõi serial">
                    <span className={cn("text-xs font-medium", sku.serialTracking ? "text-positive" : "text-ink-tertiary")}>
                      {sku.serialTracking ? "Có" : "Không"}
                    </span>
                  </InfoRow>
                  <InfoRow label="Theo dõi hạn dùng">
                    <span className={cn("text-xs font-medium", sku.expiryTracking ? "text-positive" : "text-ink-tertiary")}>
                      {sku.expiryTracking ? "Có" : "Không"}
                    </span>
                  </InfoRow>
                </div>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
