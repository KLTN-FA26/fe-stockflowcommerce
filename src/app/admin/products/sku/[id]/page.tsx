"use client";

import { useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "cn";
import {
  ArrowLeft,
  Barcode,
  Weight,
  Package,
  RotateCcw,
  Layers,
  Pencil,
  Box,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "@/components/shared/Toast";
import {
  skus,
  products,
  formatVND,
  type Sku,
  type SkuStatus,
} from "@/lib/mock-data";

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
    <div className="flex items-start gap-3 py-2">
      <span className="w-[140px] shrink-0 text-xs font-medium text-ink-tertiary">{label}</span>
      <span className="text-[0.8125rem] text-ink-primary">{children}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Collapsible section                                                       */
/* -------------------------------------------------------------------------- */

function Section({
  title,
  icon: Icon,
  actions,
  children,
}: {
  title: string;
  icon?: typeof Layers;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--card-radius)] border border-border-default bg-bg-surface p-[var(--card-pad)]">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 text-[0.9375rem] font-semibold text-ink-primary">
          {Icon && <Icon className="size-4 text-accent" />}
          {title}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function SkuDetailPage() {
  const params = useParams<{ id: string }>();
  const skuId = params.id;

  const [statusOverride, setStatusOverride] = useState<SkuStatus | null>(null);

  const baseSku = useMemo(
    () => skus.find((s) => s.skuId === skuId) ?? null,
    [skuId]
  );

  const sku: Sku | null = useMemo(
    () => (baseSku && statusOverride ? { ...baseSku, status: statusOverride } : baseSku),
    [baseSku, statusOverride]
  );

  const parentProduct = useMemo(
    () => (sku ? products.find((p) => p.productId === sku.productId) ?? null : null),
    [sku]
  );

  const actions = sku ? SKU_STATUS_ACTIONS[sku.status] ?? [] : [];

  const handleStatusChange = useCallback(
    (newStatus: SkuStatus) => {
      setStatusOverride(newStatus);
      toast.success("Cập nhật trạng thái", `${skuId} chuyển sang ${newStatus}.`);
    },
    [skuId]
  );

  /* 404 */
  if (!sku) {
    return (
      <>
        <PageHeader
          title="Không tìm thấy SKU"
          breadcrumbs={[
            { label: "Back-office", href: "/admin" },
            { label: "Sản phẩm", href: "/admin/products" },
            { label: skuId },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 text-ink-tertiary">
          <Box className="mb-3 size-12 opacity-40" />
          <p className="text-[0.9375rem]">
            SKU{" "}
            <code className="font-[family-name:var(--font-mono)] text-accent">{skuId}</code>{" "}
            không tồn tại.
          </p>
          <Link href="/admin/products" className="mt-4 text-[0.8125rem] text-accent hover:underline">
            Quay lại danh sách
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={sku.skuId}
        subtitle={sku.variantLabel}
        breadcrumbs={[
          { label: "Back-office", href: "/admin" },
          { label: "Sản phẩm", href: "/admin/products" },
          ...(parentProduct
            ? [{ label: parentProduct.name, href: `/admin/products/${parentProduct.productId}` }]
            : []),
          { label: sku.skuId },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost"
              type="button"
              onClick={() => toast.info("Chỉnh sửa SKU", "Chức năng đang phát triển.")}
              className="inline-flex items-center gap-1.5 rounded-[var(--r-sm)] border border-border-default bg-bg-surface px-3 py-1.5 text-[0.8125rem] font-medium text-ink-secondary transition-colors hover:bg-bg-muted hover:text-ink-primary"
            >
              <Pencil className="size-3.5" />
              Chỉnh sửa
            </Button>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1.5 rounded-[var(--r-sm)] border border-border-default bg-bg-surface px-3 py-1.5 text-[0.8125rem] font-medium text-ink-secondary transition-colors hover:bg-bg-muted hover:text-ink-primary"
            >
              <ArrowLeft className="size-3.5" />
              Quay lại
            </Link>
          </div>
        }
      />

      {/* Status action bar */}
      {actions.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-[var(--r-sm)] border border-border-default bg-bg-subtle px-4 py-3">
          <StatusBadge domain="sku" status={sku.status} size="md" withIcon />
          <span className="text-xs text-ink-tertiary">→</span>
          {actions.map((act) => (
            <Button variant="ghost"
              key={act.next}
              type="button"
              onClick={() => handleStatusChange(act.next)}
              className={cn(
                "rounded-[var(--r-sm)] border px-3 py-1.5 text-[0.8125rem] font-medium transition-colors",
                ACTION_TONE_CLASSES[act.tone] ?? "border-border-default text-ink-secondary hover:bg-bg-muted"
              )}
            >
              {act.label}
            </Button>
          ))}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* ============================================================== */}
        {/*  LEFT COLUMN                                                   */}
        {/* ============================================================== */}
        <div className="space-y-5">
          {/* Thông tin chung */}
          <Section
            title="Thông tin chung"
            icon={Barcode}
            actions={
              <Button variant="ghost"
                type="button"
                onClick={() => toast.info("Chỉnh sửa thông tin", "Chức năng đang phát triển.")}
                className="rounded-[var(--r-sm)] border border-border-default px-2 py-0.5 text-xs text-ink-tertiary hover:bg-bg-muted hover:text-ink-primary"
              >
                <Pencil className="inline size-3" />
              </Button>
            }
          >
            <div className="divide-y divide-border-default">
              <InfoRow label="Mã SKU">
                <span className="font-[family-name:var(--font-mono)] font-medium text-accent">{sku.skuId}</span>
              </InfoRow>
              <InfoRow label="Barcode">
                <span className="font-[family-name:var(--font-mono)] tabular-nums">{sku.barcode}</span>
              </InfoRow>
              <InfoRow label="Biến thể">{sku.variantLabel}</InfoRow>
              <InfoRow label="Sản phẩm">
                {parentProduct ? (
                  <Link
                    href={`/admin/products/${parentProduct.productId}`}
                    className="text-accent hover:underline"
                  >
                    {parentProduct.name}
                    <span className="ml-1.5 font-[family-name:var(--font-mono)] text-xs text-ink-tertiary">
                      ({parentProduct.productId})
                    </span>
                  </Link>
                ) : (
                  <span className="text-ink-tertiary">{sku.productId}</span>
                )}
              </InfoRow>
              <InfoRow label="Đơn vị tính">{sku.uom}</InfoRow>
              <InfoRow label="Trạng thái">
                <StatusBadge domain="sku" status={sku.status} size="sm" withIcon />
              </InfoRow>
            </div>
          </Section>

          {/* Tổ hợp biến thể */}
          <Section title="Tổ hợp biến thể" icon={Tag}>
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
          </Section>

          {/* Giá */}
          <Section title="Giá" icon={Layers}>
            <div className="divide-y divide-border-default">
              <InfoRow label="Giá vốn">
                <span className="font-[family-name:var(--font-mono)] font-medium">{formatVND(sku.cost)}</span>
              </InfoRow>
            </div>
          </Section>

          {/* Thông số vật lý */}
          <Section title="Thông số vật lý" icon={Weight}>
            <div className="divide-y divide-border-default">
              <InfoRow label="Trọng lượng">
                <span className="font-[family-name:var(--font-mono)] tabular-nums">{sku.weightKg} kg</span>
              </InfoRow>
            </div>
          </Section>
        </div>

        {/* ============================================================== */}
        {/*  RIGHT COLUMN                                                  */}
        {/* ============================================================== */}
        <div className="space-y-5">
          {/* Tồn kho */}
          <section className="rounded-[var(--card-radius)] border border-border-default bg-bg-surface p-[var(--card-pad)]">
            <h2 className="mb-4 flex items-center gap-2 text-[0.9375rem] font-semibold text-ink-primary">
              <Package className="size-4 text-accent" />
              Tồn kho
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-[0.8125rem]">
                <span className="text-ink-secondary">Tồn kho (on-hand)</span>
                <span className="font-[family-name:var(--font-mono)] font-medium text-ink-primary">
                  {sku.stockOnHand.toLocaleString("vi-VN")}
                </span>
              </div>
              <div className="flex justify-between text-[0.8125rem]">
                <span className="text-ink-secondary">Đã đặt (reserved)</span>
                <span className="font-[family-name:var(--font-mono)] font-medium text-warning">
                  {sku.stockReserved.toLocaleString("vi-VN")}
                </span>
              </div>
              <div className="flex justify-between text-[0.8125rem]">
                <span className="text-ink-secondary">Khả dụng (available)</span>
                <span
                  className={cn(
                    "font-[family-name:var(--font-mono)] font-medium",
                    sku.stockAvailable <= sku.reorderPoint ? "text-danger" : "text-positive"
                  )}
                >
                  {sku.stockAvailable.toLocaleString("vi-VN")}
                </span>
              </div>
              <div className="border-t border-border-default pt-2">
                <div className="flex justify-between text-[0.8125rem]">
                  <span className="text-ink-secondary">Điểm đặt lại (reorder)</span>
                  <span className="font-[family-name:var(--font-mono)] font-medium text-ink-primary">
                    {sku.reorderPoint.toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>
              {sku.stockAvailable <= sku.reorderPoint && sku.reorderPoint > 0 && (
                <div className="mt-2 rounded-[var(--r-sm)] bg-danger/10 px-2.5 py-1.5 text-xs font-medium text-danger">
                  Tồn kho dưới ngưỡng đặt lại — cần bổ sung
                </div>
              )}
            </div>
          </section>

          {/* Kiểm soát tồn kho */}
          <section className="rounded-[var(--card-radius)] border border-border-default bg-bg-surface p-[var(--card-pad)]">
            <h2 className="mb-4 flex items-center gap-2 text-[0.9375rem] font-semibold text-ink-primary">
              <RotateCcw className="size-4 text-accent" />
              Kiểm soát tồn kho
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-[0.8125rem]">
                <span className="text-ink-secondary">Theo dõi lô (Lot)</span>
                <span className={cn("text-xs font-medium", sku.lotTracking ? "text-positive" : "text-ink-tertiary")}>
                  {sku.lotTracking ? "Có" : "Không"}
                </span>
              </div>
              <div className="flex justify-between text-[0.8125rem]">
                <span className="text-ink-secondary">Theo dõi serial</span>
                <span className={cn("text-xs font-medium", sku.serialTracking ? "text-positive" : "text-ink-tertiary")}>
                  {sku.serialTracking ? "Có" : "Không"}
                </span>
              </div>
              <div className="flex justify-between text-[0.8125rem]">
                <span className="text-ink-secondary">Theo dõi hạn dùng</span>
                <span className={cn("text-xs font-medium", sku.expiryTracking ? "text-positive" : "text-ink-tertiary")}>
                  {sku.expiryTracking ? "Có" : "Không"}
                </span>
              </div>
            </div>
          </section>

          {/* Hình ảnh */}
          {sku.imageUrl && (
            <section className="rounded-[var(--card-radius)] border border-border-default bg-bg-surface p-[var(--card-pad)]">
              <h2 className="mb-3 text-[0.9375rem] font-semibold text-ink-primary">Hình ảnh</h2>
              <div className="flex aspect-square items-center justify-center rounded-[var(--r-sm)] border border-border-default bg-bg-subtle text-xs text-ink-tertiary">
                {sku.imageUrl.split("/").pop()}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
