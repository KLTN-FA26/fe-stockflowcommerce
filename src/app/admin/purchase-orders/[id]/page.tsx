"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { cn } from "cn";
import {
  ArrowLeft,
  FileText,
  Package,
  Truck,
  ClipboardCheck,
  RefreshCw,
  CircleDot,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { toast } from "@/components/shared/Toast";
import {
  purchaseOrders,
  suppliers,
  warehouses,
  skus,
  formatVND,
  type PurchaseOrder,
  type PoLine,
  type PoStatus,
  type Currency,
  CURRENCY_SYMBOL,
} from "@/lib/mock-data";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/** Format money based on currency */
function formatMoney(amount: number, currency: Currency): string {
  if (currency === "VND") return formatVND(amount);
  if (currency === "USD")
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  // CNY fallback
  return `${CURRENCY_SYMBOL[currency]}${amount.toLocaleString()}`;
}

/** PO lifecycle progression order */
const PO_LIFECYCLE: PoStatus[] = [
  "Draft",
  "Pending Approval",
  "Approved",
  "Confirmed",
  "Partially Received",
  "Received",
  "Closed",
];

/** Determine lifecycle step states based on current PO status */
function getLifecycleSteps(status: PoStatus) {
  if (status === "Cancelled") {
    // Cancelled is terminal — show all steps as not done, mark Cancelled separately
    return PO_LIFECYCLE.map((step) => ({
      label: step,
      done: false,
      current: false,
    }));
  }
  const idx = PO_LIFECYCLE.indexOf(status);
  return PO_LIFECYCLE.map((step, i) => ({
    label: step,
    done: i <= idx,
    current: i === idx,
  }));
}

/* -------------------------------------------------------------------------- */
/*  InfoRow                                                                   */
/* -------------------------------------------------------------------------- */

function InfoRow({
  label,
  value,
  mono,
  danger,
  children,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  danger?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between border-b border-border-default py-2 last:border-b-0">
      <span className="text-xs font-medium text-ink-tertiary">{label}</span>
      {children ? (
        <span className="text-[0.8125rem] text-ink-primary">{children}</span>
      ) : (
        <span
          className={cn(
            "text-[0.8125rem]",
            danger ? "font-medium text-danger" : "text-ink-primary",
            mono && "font-[family-name:var(--font-mono)] tabular-nums"
          )}
        >
          {value}
        </span>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Action buttons config                                                     */
/* -------------------------------------------------------------------------- */

interface ActionBtn {
  label: string;
  variant: "brand" | "danger" | "warning" | "outline";
}

const STATUS_ACTIONS: Partial<Record<PoStatus, ActionBtn[]>> = {
  Draft: [
    { label: "Gửi duyệt", variant: "brand" },
    { label: "Huỷ PO", variant: "danger" },
  ],
  "Pending Approval": [
    { label: "Phê duyệt", variant: "brand" },
    { label: "Từ chối", variant: "danger" },
  ],
  Approved: [
    { label: "Chốt PO", variant: "brand" },
    { label: "Huỷ PO", variant: "danger" },
  ],
  Confirmed: [
    { label: "Tạo phiếu nhận", variant: "brand" },
    { label: "Tạo Revision", variant: "outline" },
  ],
  "Partially Received": [
    { label: "Tạo phiếu nhận", variant: "brand" },
    { label: "Short-close", variant: "warning" },
  ],
  Received: [{ label: "Đóng PO", variant: "brand" }],
};

const VARIANT_CLASSES: Record<string, string> = {
  brand:
    "bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90",
  danger:
    "border-danger text-danger hover:bg-danger/10 bg-transparent",
  warning:
    "border-warning text-warning hover:bg-warning/10 bg-transparent",
  outline:
    "border-border-default text-ink-secondary hover:bg-bg-muted bg-transparent",
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);

  const po = useMemo(
    () => purchaseOrders.find((p) => p.poId === id) ?? null,
    [id]
  );

  const supplier = useMemo(
    () => (po ? suppliers.find((s) => s.supplierId === po.supplierId) : null),
    [po]
  );

  const warehouse = useMemo(
    () => (po ? warehouses.find((w) => w.warehouseId === po.warehouseId) : null),
    [po]
  );

  const lifecycleSteps = useMemo(
    () => (po ? getLifecycleSteps(po.status) : []),
    [po]
  );

  const actions = po ? STATUS_ACTIONS[po.status] ?? [] : [];

  /** Find revision PO (if another PO has revisionOf === po.poId) */
  const revisionPo = useMemo(
    () =>
      po
        ? purchaseOrders.find((p) => p.revisionOf === po.poId) ?? null
        : null,
    [po]
  );

  /* ---- Not found ---- */
  if (!po) {
    return (
      <>
        <PageHeader
          title="Không tìm thấy PO"
          breadcrumbs={[
            { label: "Back-office", href: "/admin" },
            { label: "Đơn đặt NCC", href: "/admin/purchase-orders" },
            { label: id },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 text-ink-tertiary">
          <FileText className="mb-3 size-12 opacity-40" />
          <p className="text-[0.9375rem]">
            Đơn đặt hàng{" "}
            <code className="font-[family-name:var(--font-mono)] text-accent">
              {id}
            </code>{" "}
            không tồn tại.
          </p>
          <Link
            href="/admin/purchase-orders"
            className="mt-4 text-[0.8125rem] text-accent hover:underline"
          >
            Quay lại danh sách
          </Link>
        </div>
      </>
    );
  }

  /* ---- PO Lines columns ---- */
  const lineColumns: ColumnDef<PoLine>[] = [
    {
      key: "skuId",
      header: "Mã SKU",
      sortable: true,
      compare: (a, b) => a.skuId.localeCompare(b.skuId),
      cell: (row) => (
        <span className="font-[family-name:var(--font-mono)] text-[0.8125rem] font-medium text-accent">
          {row.skuId}
        </span>
      ),
    },
    {
      key: "skuName",
      header: "Tên SKU",
      cell: (row) => (
        <span className="text-[0.8125rem] text-ink-primary">
          {skus.find((s) => s.skuId === row.skuId)?.variantLabel ?? row.skuId}
        </span>
      ),
    },
    {
      key: "orderedQty",
      header: "SL đặt",
      align: "right",
      sortable: true,
      compare: (a, b) => a.orderedQty - b.orderedQty,
      cell: (row) => (
        <span className="font-[family-name:var(--font-mono)] tabular-nums text-[0.8125rem] font-medium text-ink-primary">
          {row.orderedQty.toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      key: "unitPrice",
      header: "Đơn giá",
      align: "right",
      sortable: true,
      compare: (a, b) => a.unitPrice - b.unitPrice,
      cell: (row) => (
        <span className="font-[family-name:var(--font-mono)] tabular-nums text-[0.8125rem] font-medium text-ink-primary">
          {formatMoney(row.unitPrice, row.currency)}
        </span>
      ),
    },
    {
      key: "receivedQty",
      header: "SL đã nhận",
      align: "right",
      sortable: true,
      compare: (a, b) => a.receivedQty - b.receivedQty,
      cell: (row) => (
        <span className="font-[family-name:var(--font-mono)] tabular-nums text-[0.8125rem] font-medium text-ink-primary">
          {row.receivedQty.toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      key: "openQty",
      header: "Open qty",
      align: "right",
      sortable: true,
      compare: (a, b) =>
        a.orderedQty - a.receivedQty - (b.orderedQty - b.receivedQty),
      cell: (row) => {
        const open = row.orderedQty - row.receivedQty;
        return (
          <span
            className={cn(
              "font-[family-name:var(--font-mono)] tabular-nums text-[0.8125rem] font-medium",
              open > 0 ? "text-warning" : "text-ink-primary"
            )}
          >
            {open.toLocaleString("vi-VN")}
          </span>
        );
      },
    },
    {
      key: "lineTotal",
      header: "Thành tiền",
      align: "right",
      sortable: true,
      compare: (a, b) => a.lineTotal - b.lineTotal,
      cell: (row) => (
        <span className="font-[family-name:var(--font-mono)] tabular-nums text-[0.8125rem] font-medium text-ink-primary">
          {formatMoney(row.lineTotal, row.currency)}
        </span>
      ),
    },
  ];

  const handleAction = () => {
    toast.success("Mock action", "Hành động UI-only, không có API call.");
  };

  return (
    <>
      <PageHeader
        title={po.poNumber}
        subtitle={`Đơn đặt NCC — ${supplier?.name ?? po.supplierId}`}
        breadcrumbs={[
          { label: "Back-office", href: "/admin" },
          { label: "Đơn đặt NCC", href: "/admin/purchase-orders" },
          { label: po.poNumber },
        ]}
        actions={
          <Link
            href="/admin/purchase-orders"
            className="inline-flex items-center gap-1.5 rounded-[var(--r-sm)] border border-border-default bg-bg-surface px-3 py-1.5 text-[0.8125rem] font-medium text-ink-secondary transition-colors hover:bg-bg-muted hover:text-ink-primary"
          >
            <ArrowLeft className="size-3.5" />
            Quay lại
          </Link>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        {/* ================================================================ */}
        {/*  LEFT COLUMN                                                     */}
        {/* ================================================================ */}
        <div className="space-y-5">
          {/* ---- Header info: 2-column grid ---- */}
          <div className="grid gap-5 md:grid-cols-2">
            {/* Card 1: Thông tin chung */}
            <section className="rounded-[var(--card-radius)] border border-border-default bg-bg-surface p-[var(--card-pad)]">
              <h2 className="mb-3 flex items-center gap-2 text-[0.9375rem] font-semibold text-ink-primary">
                <FileText className="size-4 text-accent" />
                Thông tin chung
              </h2>
              <div>
                <InfoRow label="Số PO" value={po.poNumber} mono />
                <InfoRow label="Trạng thái">
                  <StatusBadge domain="po" status={po.status} size="sm" withIcon />
                </InfoRow>
                <InfoRow label="Ngày đặt" value={po.orderDate} mono />
                <InfoRow label="Ngày giao DK" value={po.expectedDate} mono />
                <InfoRow label="Người tạo" value={po.createdBy} />
                <InfoRow
                  label="Người duyệt"
                  value={po.approvedBy ?? "—"}
                />
                {po.notes && <InfoRow label="Ghi chú" value={po.notes} />}
                {po.rejectionReason && (
                  <InfoRow
                    label="Lý do từ chối"
                    value={po.rejectionReason}
                    danger
                  />
                )}
              </div>
            </section>

            {/* Card 2: Nhà cung cấp & Kho */}
            <section className="rounded-[var(--card-radius)] border border-border-default bg-bg-surface p-[var(--card-pad)]">
              <h2 className="mb-3 flex items-center gap-2 text-[0.9375rem] font-semibold text-ink-primary">
                <Truck className="size-4 text-accent" />
                Nhà cung cấp &amp; Kho
              </h2>
              <div>
                <InfoRow
                  label="NCC"
                  value={supplier?.name ?? po.supplierId}
                />
                <InfoRow label="Mã NCC" value={po.supplierId} mono />
                <InfoRow
                  label="Điều khoản"
                  value={supplier?.paymentTerms ?? "—"}
                />
                <InfoRow label="Đơn vị tiền tệ" value={po.currency} />
                <InfoRow
                  label="Kho nhận"
                  value={warehouse?.name ?? po.warehouseId}
                />
                <InfoRow label="Mã kho" value={po.warehouseId} mono />
              </div>
            </section>
          </div>

          {/* ---- PO Lines DataTable ---- */}
          <section className="rounded-[var(--card-radius)] border border-border-default bg-bg-surface p-[var(--card-pad)]">
            <h2 className="mb-3 flex items-center gap-2 text-[0.9375rem] font-semibold text-ink-primary">
              <Package className="size-4 text-accent" />
              Dòng hàng (PO Lines)
            </h2>
            <DataTable
              data={po.lines}
              columns={lineColumns}
              rowKey={(row) => row.lineId}
              caption={`${po.lines.length} dòng hàng — ${po.poNumber}`}
              pageSize={50}
            />
          </section>

          {/* ---- Totals Card ---- */}
          <section className="rounded-[var(--card-radius)] border border-border-default bg-bg-surface p-[var(--card-pad)]">
            <h2 className="mb-3 flex items-center gap-2 text-[0.9375rem] font-semibold text-ink-primary">
              <ClipboardCheck className="size-4 text-accent" />
              Tổng cộng
            </h2>
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between text-[0.8125rem]">
                <span className="text-ink-secondary">Tạm tính</span>
                <span className="font-[family-name:var(--font-mono)] font-medium tabular-nums text-ink-primary">
                  {formatMoney(po.subtotal, po.currency)}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-[0.8125rem]">
                <span className="text-ink-secondary">Thuế</span>
                <span className="font-[family-name:var(--font-mono)] font-medium tabular-nums text-ink-primary">
                  {formatMoney(po.taxTotal, po.currency)}
                </span>
              </div>
              <div className="flex items-baseline justify-between border-t border-border-default pt-2 text-[0.9375rem]">
                <span className="font-semibold text-ink-primary">
                  Tổng giá trị
                </span>
                <span className="font-[family-name:var(--font-mono)] text-base font-bold tabular-nums text-ink-primary">
                  {formatMoney(po.grandTotal, po.currency)}
                </span>
              </div>
            </div>
          </section>

          {/* ---- PO Timeline ---- */}
          <section className="rounded-[var(--card-radius)] border border-border-default bg-bg-surface p-[var(--card-pad)]">
            <h2 className="mb-4 flex items-center gap-2 text-[0.9375rem] font-semibold text-ink-primary">
              <CircleDot className="size-4 text-accent" />
              Vòng đời PO
            </h2>
            <div className="relative pl-6">
              <div className="absolute left-[6px] top-1 bottom-1 w-0.5 bg-border-default" />
              {lifecycleSteps.map((step) => (
                <div key={step.label} className="relative pb-5 last:pb-0">
                  <div
                    className={cn(
                      "absolute -left-[22.5px] top-[4px] size-[11px] rounded-full border-2 border-bg-surface",
                      step.current
                        ? "bg-accent ring-2 ring-accent/30"
                        : step.done
                          ? "bg-positive"
                          : "bg-bg-muted"
                    )}
                  />
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[0.8125rem] font-medium",
                        step.current
                          ? "text-accent"
                          : step.done
                            ? "text-ink-primary"
                            : "text-ink-tertiary"
                      )}
                    >
                      {step.label}
                    </span>
                    {step.current && (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[0.625rem] font-semibold text-accent">
                        Hiện tại
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Show Cancelled as separate terminal step if applicable */}
              {po.status === "Cancelled" && (
                <div className="relative pb-0">
                  <div className="absolute -left-[22.5px] top-[4px] size-[11px] rounded-full border-2 border-bg-surface bg-danger ring-2 ring-danger/30" />
                  <div className="flex items-center gap-2">
                    <span className="text-[0.8125rem] font-medium text-danger">
                      Cancelled
                    </span>
                    <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[0.625rem] font-semibold text-danger">
                      Hiện tại
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ---- PO Revision (conditional) ---- */}
          {po.revisionOf && (
            <section className="rounded-[var(--card-radius)] border border-border-default bg-bg-surface p-[var(--card-pad)]">
              <h2 className="mb-3 flex items-center gap-2 text-[0.9375rem] font-semibold text-ink-primary">
                <RefreshCw className="size-4 text-accent" />
                PO Revision
              </h2>
              <p className="text-[0.8125rem] text-ink-secondary">
                Đây là bản sửa đổi của PO{" "}
                <Link
                  href={`/admin/purchase-orders/${po.revisionOf}`}
                  className="font-[family-name:var(--font-mono)] font-medium text-accent hover:underline"
                >
                  {po.revisionOf}
                </Link>
                . Nội dung PO gốc đã được thay thế.
              </p>
            </section>
          )}

          {revisionPo && (
            <section className="rounded-[var(--card-radius)] border border-warning/30 bg-warning/5 p-[var(--card-pad)]">
              <h2 className="mb-3 flex items-center gap-2 text-[0.9375rem] font-semibold text-ink-primary">
                <RefreshCw className="size-4 text-warning" />
                Đã thay thế
              </h2>
              <p className="text-[0.8125rem] text-ink-secondary">
                PO này đã được thay thế bởi PO{" "}
                <Link
                  href={`/admin/purchase-orders/${revisionPo.poId}`}
                  className="font-[family-name:var(--font-mono)] font-medium text-accent hover:underline"
                >
                  {revisionPo.poNumber}
                </Link>
                .
              </p>
            </section>
          )}
        </div>

        {/* ================================================================ */}
        {/*  RIGHT COLUMN (sidebar)                                          */}
        {/* ================================================================ */}
        <div className="space-y-5">
          {/* ---- Action Card ---- */}
          <section className="rounded-[var(--card-radius)] border border-border-default bg-bg-surface p-[var(--card-pad)]">
            <div className="mb-4 flex justify-center">
              <StatusBadge
                domain="po"
                status={po.status}
                size="md"
                withIcon
              />
            </div>

            {actions.length > 0 && (
              <div className="space-y-2">
                {actions.map((act) => (
                  <button
                    key={act.label}
                    type="button"
                    onClick={handleAction}
                    className={cn(
                      "w-full rounded-[var(--r-sm)] border px-3 py-2 text-[0.8125rem] font-medium transition-colors",
                      VARIANT_CLASSES[act.variant]
                    )}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            )}

            {(po.status === "Closed" || po.status === "Cancelled") && (
              <p className="text-center text-xs text-ink-tertiary">
                Trạng thái kết thúc — không có hành động khả dụng.
              </p>
            )}
          </section>

          {/* ---- From Proposal (conditional) ---- */}
          {po.fromProposalId && (
            <section className="rounded-[var(--card-radius)] border border-border-default bg-bg-surface p-[var(--card-pad)]">
              <h2 className="mb-2 text-[0.9375rem] font-semibold text-ink-primary">
                Nguồn gốc
              </h2>
              <p className="text-[0.8125rem] text-ink-secondary">
                Từ đề xuất nhập hàng:{" "}
                <Link
                  href="/admin/replenishment"
                  className="font-[family-name:var(--font-mono)] font-medium text-accent hover:underline"
                >
                  {po.fromProposalId}
                </Link>
              </p>
            </section>
          )}

          {/* ---- Quick stats ---- */}
          <section className="rounded-[var(--card-radius)] border border-border-default bg-bg-surface p-[var(--card-pad)]">
            <h2 className="mb-3 text-[0.9375rem] font-semibold text-ink-primary">
              Tổng quan
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-[0.8125rem]">
                <span className="text-ink-secondary">Dòng hàng</span>
                <span className="font-[family-name:var(--font-mono)] font-medium text-ink-primary">
                  {po.lines.length}
                </span>
              </div>
              <div className="flex justify-between text-[0.8125rem]">
                <span className="text-ink-secondary">Tổng SL đặt</span>
                <span className="font-[family-name:var(--font-mono)] font-medium text-ink-primary">
                  {po.lines
                    .reduce((s, l) => s + l.orderedQty, 0)
                    .toLocaleString("vi-VN")}
                </span>
              </div>
              <div className="flex justify-between text-[0.8125rem]">
                <span className="text-ink-secondary">Tổng SL đã nhận</span>
                <span className="font-[family-name:var(--font-mono)] font-medium text-positive">
                  {po.lines
                    .reduce((s, l) => s + l.receivedQty, 0)
                    .toLocaleString("vi-VN")}
                </span>
              </div>
              <div className="flex justify-between text-[0.8125rem]">
                <span className="text-ink-secondary">SL còn lại</span>
                <span
                  className={cn(
                    "font-[family-name:var(--font-mono)] font-medium",
                    po.lines.reduce(
                      (s, l) => s + (l.orderedQty - l.receivedQty),
                      0
                    ) > 0
                      ? "text-warning"
                      : "text-ink-primary"
                  )}
                >
                  {po.lines
                    .reduce(
                      (s, l) => s + (l.orderedQty - l.receivedQty),
                      0
                    )
                    .toLocaleString("vi-VN")}
                </span>
              </div>
              <div className="border-t border-border-default pt-2">
                <div className="flex justify-between text-[0.8125rem]">
                  <span className="text-ink-secondary">Tiền tệ</span>
                  <span className="font-[family-name:var(--font-mono)] font-medium text-ink-primary">
                    {po.currency}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-[0.8125rem]">
                  <span className="font-medium text-ink-primary">
                    Tổng giá trị
                  </span>
                  <span className="font-[family-name:var(--font-mono)] font-bold text-ink-primary">
                    {formatMoney(po.grandTotal, po.currency)}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
