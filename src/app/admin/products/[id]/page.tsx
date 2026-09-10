"use client";

import { useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "cn";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Box,
  Layers,
  Ruler,
  Palette,
  Printer,
  CuboidIcon as Cube,
  Tag,
  ChevronRight,
  ChevronDown,
  Pencil,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { toast } from "@/components/shared/Toast";
import { SkuDetailPanel } from "@/components/backoffice/SkuDetailPanel";
import {
  codeCell,
  textCell,
  numberCell,
  moneyCell,
  statusCell,
} from "@/components/shared/column-helpers";
import {
  products,
  skus,
  categories,
  formatVND,
  type Product,
  type ProductStatus,
  type SkuStatus,
  type Sku,
  type Category,
  type PrintArea,
} from "@/lib/mock-data";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const categoryMap = new Map<string, string>(
  categories.map((c: Category) => [c.categoryId, c.name.vi])
);

const LIFECYCLE_ORDER: ProductStatus[] = [
  "Draft",
  "Pending Approval",
  "Approved",
  "Active",
  "Published",
  "Inactive",
  "Discontinued",
];

/** Các action có thể thực hiện theo trạng thái hiện tại */
const STATUS_ACTIONS: Record<string, { label: string; next: ProductStatus; tone: string }[]> = {
  Draft: [{ label: "Gửi duyệt", next: "Pending Approval", tone: "info" }],
  "Pending Approval": [
    { label: "Phê duyệt", next: "Approved", tone: "positive" },
    { label: "Từ chối", next: "Draft", tone: "danger" },
  ],
  Approved: [{ label: "Kích hoạt", next: "Active", tone: "positive" }],
  Active: [
    { label: "Xuất bản", next: "Published", tone: "positive" },
    { label: "Tạm ngừng", next: "Inactive", tone: "warning" },
  ],
  Published: [
    { label: "Ẩn khỏi catalog", next: "Active", tone: "warning" },
    { label: "Tạm ngừng", next: "Inactive", tone: "danger" },
  ],
  Inactive: [
    { label: "Kích hoạt lại", next: "Active", tone: "positive" },
    { label: "Ngừng vĩnh viễn", next: "Discontinued", tone: "danger" },
  ],
  Discontinued: [],
};

const ACTION_TONE_CLASSES: Record<string, string> = {
  positive: "bg-positive text-white hover:bg-positive/90",
  info: "bg-info text-white hover:bg-info/90",
  warning: "bg-warning text-white hover:bg-warning/90",
  danger: "border-danger text-danger hover:bg-danger/10 bg-transparent",
};

/* -------------------------------------------------------------------------- */
/*  Collapsible section                                                       */
/* -------------------------------------------------------------------------- */

function Section({
  title,
  icon: Icon,
  defaultOpen = true,
  actions,
  children,
}: {
  title: string;
  icon?: typeof Layers;
  defaultOpen?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-[var(--card-radius)] border border-border-default bg-bg-surface p-[var(--card-pad)]">
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-2 text-left text-[0.9375rem] font-semibold text-ink-primary hover:text-accent"
        >
          {Icon && <Icon className="size-4 text-accent" />}
          {title}
          {open ? (
            <ChevronDown className="size-3.5 text-ink-tertiary" />
          ) : (
            <ChevronRight className="size-3.5 text-ink-tertiary" />
          )}
        </button>
        {actions && open && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

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
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = params.id;

  // Mock status override
  const [statusOverride, setStatusOverride] = useState<ProductStatus | null>(null);

  const baseProduct = useMemo(
    () => products.find((p) => p.productId === productId) ?? null,
    [productId]
  );

  const product: Product | null = useMemo(
    () => (baseProduct && statusOverride ? { ...baseProduct, status: statusOverride } : baseProduct),
    [baseProduct, statusOverride]
  );

  const productSkus = useMemo(
    () => (product ? skus.filter((s) => s.productId === product.productId) : []),
    [product]
  );

  const lifecycleSteps = useMemo(() => {
    if (!product) return [];
    const idx = LIFECYCLE_ORDER.indexOf(product.status);
    return LIFECYCLE_ORDER.map((step, i) => ({
      label: step,
      done: i <= idx,
      current: i === idx,
    }));
  }, [product]);

  const actions = product ? STATUS_ACTIONS[product.status] ?? [] : [];

  const handleStatusChange = useCallback(
    (newStatus: ProductStatus) => {
      setStatusOverride(newStatus);
      toast.success("Cập nhật trạng thái", `${productId} chuyển sang ${newStatus}.`);
    },
    [productId]
  );

  /* SKU panel state */
  const [selectedSku, setSelectedSku] = useState<Sku | null>(null);
  const [skuPanelOpen, setSkuPanelOpen] = useState(false);
  const [skuOverrides, setSkuOverrides] = useState<Map<string, SkuStatus>>(new Map());

  const openSkuPanel = useCallback((sku: Sku) => {
    // Apply override if exists
    const override = skuOverrides.get(sku.skuId);
    setSelectedSku(override ? { ...sku, status: override } : sku);
    setSkuPanelOpen(true);
  }, [skuOverrides]);

  const closeSkuPanel = useCallback(() => {
    setSkuPanelOpen(false);
  }, []);

  const handleSkuStatusChange = useCallback(
    (skuId: string, newStatus: SkuStatus) => {
      setSkuOverrides((prev) => {
        const next = new Map(prev);
        next.set(skuId, newStatus);
        return next;
      });
      setSelectedSku((prev) => (prev && prev.skuId === skuId ? { ...prev, status: newStatus } : prev));
      toast.success("Cập nhật SKU", `${skuId} chuyển sang ${newStatus}.`);
    },
    []
  );

  /** SKUs with status overrides applied */
  const effectiveSkus = useMemo(() => {
    if (skuOverrides.size === 0) return productSkus;
    return productSkus.map((s) => {
      const override = skuOverrides.get(s.skuId);
      return override ? { ...s, status: override } : s;
    });
  }, [productSkus, skuOverrides]);

  /* 404 */
  if (!product) {
    return (
      <>
        <PageHeader
          title="Không tìm thấy sản phẩm"
          breadcrumbs={[
            { label: "Back-office", href: "/admin" },
            { label: "Sản phẩm", href: "/admin/products" },
            { label: productId },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 text-ink-tertiary">
          <Box className="mb-3 size-12 opacity-40" />
          <p className="text-[0.9375rem]">
            Sản phẩm{" "}
            <code className="font-[family-name:var(--font-mono)] text-accent">{productId}</code>{" "}
            không tồn tại.
          </p>
          <Link href="/admin/products" className="mt-4 text-[0.8125rem] text-accent hover:underline">
            Quay lại danh sách
          </Link>
        </div>
      </>
    );
  }

  /* SKU columns */
  const skuColumns: ColumnDef<Sku>[] = [
    {
      key: "skuId",
      header: "Mã SKU",
      sortable: true,
      compare: (a, b) => a.skuId.localeCompare(b.skuId),
      cell: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openSkuPanel(row);
          }}
          className="font-[family-name:var(--font-mono)] text-[0.8125rem] font-medium text-accent hover:underline"
        >
          {row.skuId}
        </button>
      ),
    },
    textCell<Sku>("variantLabel", "Biến thể", (row) => row.variantLabel, {
      sortable: true,
      compare: (a, b) => a.variantLabel.localeCompare(b.variantLabel),
      color: "primary",
    }),
    textCell<Sku>("uom", "UoM", (row) => row.uom, { color: "secondary" }),
    {
      key: "weightKg",
      header: "Trọng lượng",
      align: "right",
      sortable: true,
      compare: (a, b) => a.weightKg - b.weightKg,
      cell: (row) => (
        <span className="font-[family-name:var(--font-mono)] text-[0.8125rem] tabular-nums text-ink-secondary">
          {row.weightKg} kg
        </span>
      ),
    },
    numberCell<Sku>("stockOnHand", "Tồn kho", (row) => row.stockOnHand, {
      sortable: true,
      compare: (a, b) => a.stockOnHand - b.stockOnHand,
    }),
    numberCell<Sku>("stockReserved", "Đã đặt", (row) => row.stockReserved, {
      sortable: true,
      compare: (a, b) => a.stockReserved - b.stockReserved,
    }),
    numberCell<Sku>("stockAvailable", "Khả dụng", (row) => row.stockAvailable, {
      sortable: true,
      compare: (a, b) => a.stockAvailable - b.stockAvailable,
    }),
    moneyCell<Sku>("cost", "Giá vốn", (row) => row.cost, formatVND, {
      sortable: true,
      compare: (a, b) => a.cost - b.cost,
    }),
    statusCell<Sku>("status", "Trạng thái", (row) => row.status, "sku", {
      sortable: true,
      compare: (a, b) => a.status.localeCompare(b.status),
      withIcon: true,
    }),
  ];

  return (
    <>
      <PageHeader
        title={product.name}
        subtitle={product.nameEn}
        breadcrumbs={[
          { label: "Back-office", href: "/admin" },
          { label: "Sản phẩm", href: "/admin/products" },
          { label: product.productId },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toast.info("Chỉnh sửa sản phẩm", "Chức năng đang phát triển.")}
              className="inline-flex items-center gap-1.5 rounded-[var(--r-sm)] border border-border-default bg-bg-surface px-3 py-1.5 text-[0.8125rem] font-medium text-ink-secondary transition-colors hover:bg-bg-muted hover:text-ink-primary"
            >
              <Pencil className="size-3.5" />
              Chỉnh sửa
            </button>
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
          <StatusBadge domain="product" status={product.status} size="md" withIcon />
          <span className="text-xs text-ink-tertiary">→</span>
          {actions.map((act) => (
            <button
              key={act.next}
              type="button"
              onClick={() => handleStatusChange(act.next)}
              className={cn(
                "rounded-[var(--r-sm)] border px-3 py-1.5 text-[0.8125rem] font-medium transition-colors",
                ACTION_TONE_CLASSES[act.tone] ?? "border-border-default text-ink-secondary hover:bg-bg-muted"
              )}
            >
              {act.label}
            </button>
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
            icon={Layers}
            actions={
              <button
                type="button"
                onClick={() => toast.info("Chỉnh sửa thông tin", "Chức năng đang phát triển.")}
                className="rounded-[var(--r-sm)] border border-border-default px-2 py-0.5 text-xs text-ink-tertiary hover:bg-bg-muted hover:text-ink-primary"
              >
                <Pencil className="inline size-3" />
              </button>
            }
          >
            <div className="divide-y divide-border-default">
              <InfoRow label="Mã sản phẩm">
                <span className="font-[family-name:var(--font-mono)] font-medium text-accent">{product.productId}</span>
              </InfoRow>
              <InfoRow label="Loại">{product.type === "Customizable" ? "Tùy chỉnh / In ấn" : "Tiêu chuẩn"}</InfoRow>
              <InfoRow label="Danh mục">{categoryMap.get(product.categoryId) ?? product.categoryId}</InfoRow>
              <InfoRow label="Thương hiệu">{product.brand}</InfoRow>
              <InfoRow label="Đơn vị tính">{product.uom}</InfoRow>
              <InfoRow label="Thuế">{product.taxClass}</InfoRow>
              <InfoRow label="Trạng thái">
                <StatusBadge domain="product" status={product.status} size="sm" withIcon />
              </InfoRow>
              <InfoRow label="Người tạo">{product.createdBy}</InfoRow>
              <InfoRow label="Ngày tạo">
                <span className="tabular-nums">{new Date(product.createdAt).toLocaleDateString("vi-VN")}</span>
              </InfoRow>
              {product.approvedBy && (
                <InfoRow label="Người duyệt">{product.approvedBy}</InfoRow>
              )}
              {product.approvedAt && (
                <InfoRow label="Ngày duyệt">
                  <span className="tabular-nums">{new Date(product.approvedAt).toLocaleDateString("vi-VN")}</span>
                </InfoRow>
              )}
            </div>
          </Section>

          {/* Mô tả */}
          <Section title="Mô tả" defaultOpen={false}>
            <p className="text-[0.8125rem] leading-relaxed text-ink-secondary">{product.description}</p>
            <p className="mt-1.5 text-xs italic text-ink-tertiary">{product.descriptionEn}</p>
          </Section>

          {/* Thuộc tính biến thể */}
          {product.attributes.length > 0 && (
            <Section
              title="Thuộc tính biến thể"
              icon={Palette}
              actions={
                <Link
                  href="/admin/variants"
                  className="inline-flex items-center gap-1 rounded-[var(--r-sm)] border border-border-default px-2 py-0.5 text-xs text-ink-tertiary hover:bg-bg-muted hover:text-ink-primary"
                >
                  Quản lý biến thể →
                </Link>
              }
            >
              <div className="space-y-3">
                {product.attributes.map((attr) => (
                  <div key={attr.attributeId}>
                    <div className="mb-1.5 text-xs font-medium text-ink-tertiary">
                      {attr.name.vi} <span className="opacity-60">({attr.name.en})</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {attr.values.map((val) => (
                        <span
                          key={val}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-bg-subtle px-2.5 py-0.5 text-xs font-medium text-ink-secondary"
                        >
                          {attr.swatch?.[val] && (
                            <span
                              className="size-3 rounded-full border border-border-default"
                              style={{ backgroundColor: attr.swatch[val] }}
                            />
                          )}
                          {val}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Bảng SKU */}
          <Section
            title={`SKU (${productSkus.length})`}
            icon={Tag}
            actions={
              <Link
                href="/admin/products?tab=skus"
                className="inline-flex items-center gap-1 rounded-[var(--r-sm)] border border-border-default px-2 py-0.5 text-xs text-ink-tertiary hover:bg-bg-muted hover:text-ink-primary"
              >
                Quản lý SKU →
              </Link>
            }
          >
            {productSkus.length > 0 ? (
              <DataTable
                data={effectiveSkus}
                columns={skuColumns}
                rowKey={(row) => row.skuId}
                caption={`${effectiveSkus.length} SKU thuộc ${product.productId}`}
                onRowClick={openSkuPanel}
                pageSize={10}
              />
            ) : (
              <div className="rounded-[var(--r-sm)] border border-border-default py-10 text-center text-[0.8125rem] text-ink-tertiary">
                Chưa có SKU nào
              </div>
            )}
          </Section>

          {/* Cấu hình tùy chỉnh */}
          {product.type === "Customizable" && product.printAreas && product.printAreas.length > 0 && (
            <Section title="Cấu hình tùy chỉnh (Print Areas)" icon={Printer}>
              <div className="space-y-3">
                {product.printAreas.map((area: PrintArea) => (
                  <div
                    key={area.printAreaId}
                    className="rounded-[var(--r-sm)] border border-border-default bg-bg-subtle p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[0.8125rem] font-semibold text-ink-primary">
                        {area.name.vi}
                        <span className="ml-1.5 text-xs font-normal text-ink-tertiary">({area.name.en})</span>
                      </span>
                      <span className="rounded-full border border-border-default bg-bg-surface px-2 py-0.5 text-xs font-medium text-ink-secondary">
                        {area.position}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-ink-secondary sm:grid-cols-3">
                      <div>
                        <span className="text-ink-tertiary">Kích thước: </span>
                        <span className="font-medium tabular-nums">{area.widthMm}×{area.heightMm} mm</span>
                      </div>
                      <div>
                        <span className="text-ink-tertiary">Min DPI: </span>
                        <span className="font-medium tabular-nums">{area.minDpi}</span>
                      </div>
                      <div>
                        <span className="text-ink-tertiary">Bleed: </span>
                        <span className="font-medium tabular-nums">{area.bleedMm} mm</span>
                      </div>
                      <div>
                        <span className="text-ink-tertiary">Safe margin: </span>
                        <span className="font-medium tabular-nums">{area.safeMarginMm} mm</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-ink-tertiary">Kỹ thuật: </span>
                        <span className="font-medium">{area.allowedTechniques.join(", ")}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {product.model3dUrl && (
                <div className="mt-3 flex items-center gap-2 rounded-[var(--r-sm)] border border-border-default bg-bg-subtle p-3">
                  <Cube className="size-4 text-accent" />
                  <div>
                    <div className="text-xs font-medium text-ink-secondary">3D Preview Model</div>
                    <div className="font-[family-name:var(--font-mono)] text-xs text-ink-tertiary">{product.model3dUrl}</div>
                  </div>
                </div>
              )}

              {product.pricingFormula && (
                <div className="mt-3 rounded-[var(--r-sm)] border border-border-default bg-bg-subtle p-3">
                  <div className="mb-2 text-xs font-medium text-ink-secondary">Công thức giá in</div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-ink-secondary sm:grid-cols-3">
                    <div>
                      <span className="text-ink-tertiary">Giá in cơ bản: </span>
                      <span className="font-[family-name:var(--font-mono)] font-medium">{formatVND(product.pricingFormula.basePrintPrice)}</span>
                    </div>
                    <div>
                      <span className="text-ink-tertiary">Giá/cm²: </span>
                      <span className="font-[family-name:var(--font-mono)] font-medium">{product.pricingFormula.perSquareCmPrice}đ</span>
                    </div>
                    <div>
                      <span className="text-ink-tertiary">Phụ thu màu: </span>
                      <span className="font-[family-name:var(--font-mono)] font-medium">{formatVND(product.pricingFormula.colorCountSurcharge)}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs text-ink-tertiary">Hệ số kỹ thuật: </span>
                    <span className="text-xs text-ink-secondary">
                      {Object.entries(product.pricingFormula.techniqueMultiplier)
                        .map(([tech, mult]) => `${tech} ×${mult}`)
                        .join(" · ")}
                    </span>
                  </div>
                </div>
              )}
            </Section>
          )}
        </div>

        {/* ============================================================== */}
        {/*  RIGHT COLUMN                                                  */}
        {/* ============================================================== */}
        <div className="space-y-5">
          {/* Lifecycle timeline */}
          <section className="rounded-[var(--card-radius)] border border-border-default bg-bg-surface p-[var(--card-pad)]">
            <h2 className="mb-4 flex items-center gap-2 text-[0.9375rem] font-semibold text-ink-primary">
              <Ruler className="size-4 text-accent" />
              Vòng đời sản phẩm
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
            </div>
          </section>

          {/* Hình ảnh */}
          <section className="rounded-[var(--card-radius)] border border-border-default bg-bg-surface p-[var(--card-pad)]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[0.9375rem] font-semibold text-ink-primary">Hình ảnh ({product.images.length})</h2>
              <button
                type="button"
                onClick={() => toast.info("Thêm hình ảnh", "Chức năng đang phát triển.")}
                className="inline-flex items-center gap-1 rounded-[var(--r-sm)] border border-border-default px-2 py-0.5 text-xs text-ink-tertiary hover:bg-bg-muted hover:text-ink-primary"
              >
                <Plus className="size-3" />
                Thêm
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {product.images.map((img, i) => (
                <div
                  key={i}
                  className="group relative flex aspect-square cursor-pointer items-center justify-center rounded-[var(--r-sm)] border border-border-default bg-bg-subtle text-xs text-ink-tertiary transition-colors hover:border-accent/40 hover:bg-accent/5"
                >
                  {img.split("/").pop()}
                </div>
              ))}
            </div>
          </section>

          {/* Quick stats */}
          <section className="rounded-[var(--card-radius)] border border-border-default bg-bg-surface p-[var(--card-pad)]">
            <h2 className="mb-3 text-[0.9375rem] font-semibold text-ink-primary">Tổng quan SKU</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-[0.8125rem]">
                <span className="text-ink-secondary">Tổng SKU</span>
                <span className="font-[family-name:var(--font-mono)] font-medium text-ink-primary">{effectiveSkus.length}</span>
              </div>
              <div className="flex justify-between text-[0.8125rem]">
                <span className="text-ink-secondary">Active</span>
                <span className="font-[family-name:var(--font-mono)] font-medium text-positive">
                  {effectiveSkus.filter((s) => s.status === "Active").length}
                </span>
              </div>
              <div className="flex justify-between text-[0.8125rem]">
                <span className="text-ink-secondary">Blocked</span>
                <span className="font-[family-name:var(--font-mono)] font-medium text-warning">
                  {effectiveSkus.filter((s) => s.status === "Blocked").length}
                </span>
              </div>
              <div className="flex justify-between text-[0.8125rem]">
                <span className="text-ink-secondary">Obsolete</span>
                <span className="font-[family-name:var(--font-mono)] font-medium text-danger">
                  {effectiveSkus.filter((s) => s.status === "Obsolete").length}
                </span>
              </div>
              <div className="border-t border-border-default pt-2">
                <div className="flex justify-between text-[0.8125rem]">
                  <span className="text-ink-secondary">Tổng tồn kho</span>
                  <span className="font-[family-name:var(--font-mono)] font-medium text-ink-primary">
                    {effectiveSkus.reduce((s, sk) => s + sk.stockOnHand, 0).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="flex justify-between text-[0.8125rem]">
                  <span className="text-ink-secondary">Khả dụng</span>
                  <span className="font-[family-name:var(--font-mono)] font-medium text-positive">
                    {effectiveSkus.reduce((s, sk) => s + sk.stockAvailable, 0).toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <SkuDetailPanel
        sku={selectedSku}
        open={skuPanelOpen}
        onClose={closeSkuPanel}
        onStatusChange={handleSkuStatusChange}
      />
    </>
  );
}
