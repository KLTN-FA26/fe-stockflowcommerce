"use client";

import { useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "cn";
import {
  ArrowLeft,
  Palette,
  Pencil,
  Plus,
  Trash2,
  X,
  Pipette,
  Package,
  Box,
  Tag,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "@/components/shared/Toast";
import {
  products,
  skus,
  type Product,
  type ProductAttribute,
} from "@/lib/mock-data";

/* -------------------------------------------------------------------------- */
/*  Aggregate attribute from all products                                     */
/* -------------------------------------------------------------------------- */

interface AggregatedValue {
  value: string;
  swatch?: string;
  skuCount: number;
  productIds: string[];
}

interface AggregatedAttribute {
  attributeId: string;
  name: { vi: string; en: string };
  values: AggregatedValue[];
  hasSwatch: boolean;
  products: { productId: string; name: string; status: string; valuesUsed: string[] }[];
}

function findAttribute(attrId: string): AggregatedAttribute | null {
  const valuesMap = new Map<string, { swatch?: string; productIds: Set<string> }>();
  const productsUsing: Map<string, { product: Product; valuesUsed: string[] }> = new Map();
  let name: { vi: string; en: string } | null = null;
  let hasSwatch = false;

  for (const p of products) {
    for (const attr of p.attributes) {
      if (attr.attributeId !== attrId) continue;
      if (!name) name = attr.name;
      if (attr.swatch) hasSwatch = true;

      const valuesUsed: string[] = [];

      for (const v of attr.values) {
        valuesUsed.push(v);
        const existing = valuesMap.get(v);
        if (!existing) {
          valuesMap.set(v, {
            swatch: attr.swatch?.[v],
            productIds: new Set([p.productId]),
          });
        } else {
          existing.productIds.add(p.productId);
          if (attr.swatch?.[v]) existing.swatch = attr.swatch[v];
        }
      }

      productsUsing.set(p.productId, { product: p, valuesUsed });
    }
  }

  if (!name) return null;

  // Count SKUs per value
  const values: AggregatedValue[] = [];
  for (const [val, data] of valuesMap) {
    // Count SKUs that have this attribute value
    const skuCount = skus.filter((s) => {
      const attrVal = s.attributes[name!.en] ?? s.attributes[name!.vi];
      return attrVal === val && data.productIds.has(s.productId);
    }).length;

    values.push({
      value: val,
      swatch: data.swatch,
      skuCount,
      productIds: [...data.productIds],
    });
  }

  const productsList = [...productsUsing.values()].map((entry) => ({
    productId: entry.product.productId,
    name: entry.product.name,
    status: entry.product.status,
    valuesUsed: entry.valuesUsed,
  }));

  return { attributeId: attrId, name, values, hasSwatch, products: productsList };
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function VariantDetailPage() {
  const params = useParams<{ id: string }>();
  const attrId = params.id;

  const baseAttr = useMemo(() => findAttribute(attrId), [attrId]);

  /* State overrides */
  const [addedValues, setAddedValues] = useState<string[]>([]);
  const [removedValues, setRemovedValues] = useState<Set<string>>(new Set());

  const effectiveValues = useMemo(() => {
    if (!baseAttr) return [];
    const base = baseAttr.values.filter((v) => !removedValues.has(v.value));
    const added = addedValues.map((val) => ({
      value: val,
      swatch: undefined,
      skuCount: 0,
      productIds: [] as string[],
    }));
    return [...base, ...added];
  }, [baseAttr, addedValues, removedValues]);

  /* Inline add */
  const [addingValue, setAddingValue] = useState(false);
  const [newValue, setNewValue] = useState("");

  const handleAddValue = useCallback(() => {
    if (!newValue.trim()) return;
    if (effectiveValues.some((v) => v.value === newValue.trim())) {
      toast.warning("Trùng giá trị", `"${newValue.trim()}" đã tồn tại.`);
      return;
    }
    setAddedValues((prev) => [...prev, newValue.trim()]);
    toast.success("Thêm giá trị", `"${newValue.trim()}" đã thêm.`);
    setNewValue("");
    setAddingValue(false);
  }, [newValue, effectiveValues]);

  const handleRemoveValue = useCallback((val: string) => {
    // Check if it's mock-added
    setAddedValues((prev) => {
      if (prev.includes(val)) return prev.filter((v) => v !== val);
      return prev;
    });
    setRemovedValues((prev) => new Set(prev).add(val));
    toast.info("Xoá giá trị", `"${val}" đã được xoá.`);
  }, []);

  /* 404 */
  if (!baseAttr) {
    return (
      <>
        <PageHeader
          title="Không tìm thấy"
          breadcrumbs={[
            { label: "Back-office", href: "/admin" },
            { label: "Sản phẩm", href: "/admin/products" },
            { label: "Thuộc tính biến thể", href: "/admin/variants" },
            { label: attrId },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 text-ink-tertiary">
          <Box className="mb-3 size-12 opacity-40" />
          <p className="text-[0.9375rem]">
            Thuộc tính{" "}
            <code className="font-[family-name:var(--font-mono)] text-accent">{attrId}</code>{" "}
            không tồn tại.
          </p>
          <Link
            href="/admin/variants"
            className="mt-4 text-[0.8125rem] text-accent hover:underline"
          >
            Quay lại danh sách
          </Link>
        </div>
      </>
    );
  }

  /* Product columns */
  const productColumns: ColumnDef<(typeof baseAttr.products)[0]>[] = [
    {
      key: "productId",
      header: "Mã SP",
      sortable: true,
      compare: (a, b) => a.productId.localeCompare(b.productId),
      cell: (row) => (
        <Link
          href={`/admin/products/${row.productId}`}
          className="font-[family-name:var(--font-mono)] text-[0.8125rem] font-medium text-accent hover:underline"
        >
          {row.productId}
        </Link>
      ),
    },
    {
      key: "name",
      header: "Tên sản phẩm",
      sortable: true,
      compare: (a, b) => a.name.localeCompare(b.name),
      cell: (row) => (
        <Link
          href={`/admin/products/${row.productId}`}
          className="text-[0.8125rem] font-medium text-ink-primary hover:text-accent hover:underline"
        >
          {row.name}
        </Link>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      cell: (row) => <StatusBadge domain="product" status={row.status} size="sm" withIcon />,
    },
    {
      key: "valuesUsed",
      header: "Giá trị sử dụng",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.valuesUsed.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full border border-border-default bg-bg-subtle px-2 py-0.5 text-[0.6875rem] font-medium text-ink-secondary"
            >
              {baseAttr.hasSwatch && baseAttr.values.find((bv) => bv.value === v)?.swatch && (
                <span
                  className="size-2.5 rounded-full border border-border-default"
                  style={{
                    backgroundColor: baseAttr.values.find((bv) => bv.value === v)?.swatch,
                  }}
                />
              )}
              {v}
            </span>
          ))}
        </div>
      ),
    },
  ];

  const totalSkus = effectiveValues.reduce((s, v) => s + v.skuCount, 0);

  return (
    <>
      <PageHeader
        title={baseAttr.name.vi}
        subtitle={`${baseAttr.name.en} · ${baseAttr.attributeId}`}
        breadcrumbs={[
          { label: "Back-office", href: "/admin" },
          { label: "Sản phẩm", href: "/admin/products" },
          { label: "Thuộc tính biến thể", href: "/admin/variants" },
          { label: baseAttr.name.vi },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toast.info("Chỉnh sửa thuộc tính", "Chức năng đang phát triển.")}
              className="inline-flex items-center gap-1.5 rounded-[var(--r-sm)] border border-border-default bg-bg-surface px-3 py-1.5 text-[0.8125rem] font-medium text-ink-secondary transition-colors hover:bg-bg-muted hover:text-ink-primary"
            >
              <Pencil className="size-3.5" />
              Chỉnh sửa
            </button>
            <Link
              href="/admin/variants"
              className="inline-flex items-center gap-1.5 rounded-[var(--r-sm)] border border-border-default bg-bg-surface px-3 py-1.5 text-[0.8125rem] font-medium text-ink-secondary transition-colors hover:bg-bg-muted hover:text-ink-primary"
            >
              <ArrowLeft className="size-3.5" />
              Quay lại
            </Link>
          </div>
        }
      />

      {/* Summary bar */}
      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-[var(--r-sm)] border border-border-default bg-bg-subtle px-4 py-3">
        <div className="flex items-center gap-2">
          <Palette className="size-4 text-accent" />
          <span className="text-[0.8125rem] font-medium text-ink-primary">{baseAttr.name.vi}</span>
          <span className="text-xs text-ink-tertiary">({baseAttr.name.en})</span>
        </div>
        <span className="text-xs text-ink-tertiary">·</span>
        <span className="text-xs text-ink-secondary">
          <span className="font-[family-name:var(--font-mono)] font-medium">{effectiveValues.length}</span> giá trị
        </span>
        <span className="text-xs text-ink-tertiary">·</span>
        <span className="text-xs text-ink-secondary">
          <span className="font-[family-name:var(--font-mono)] font-medium">{baseAttr.products.length}</span> SP sử dụng
        </span>
        <span className="text-xs text-ink-tertiary">·</span>
        <span className="text-xs text-ink-secondary">
          <span className="font-[family-name:var(--font-mono)] font-medium">{totalSkus}</span> SKU liên quan
        </span>
        {baseAttr.hasSwatch && (
          <>
            <span className="text-xs text-ink-tertiary">·</span>
            <span className="inline-flex items-center gap-1 text-xs text-ink-secondary">
              <Pipette className="size-3 text-accent" />
              Có swatch
            </span>
          </>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* ============================================================== */}
        {/*  LEFT COLUMN                                                   */}
        {/* ============================================================== */}
        <div className="space-y-5">
          {/* Danh sách giá trị */}
          <section className="rounded-[var(--card-radius)] border border-border-default bg-bg-surface p-[var(--card-pad)]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[0.9375rem] font-semibold text-ink-primary">
                <Tag className="size-4 text-accent" />
                Danh sách giá trị ({effectiveValues.length})
              </h2>
              <button
                type="button"
                onClick={() => {
                  setAddingValue(true);
                  setNewValue("");
                }}
                className="inline-flex items-center gap-1 rounded-[var(--r-sm)] border border-border-default px-2 py-0.5 text-xs text-ink-tertiary hover:bg-bg-muted hover:text-ink-primary"
              >
                <Plus className="size-3" />
                Thêm giá trị
              </button>
            </div>

            <div className="divide-y divide-border-default rounded-[var(--r-sm)] border border-border-default">
              {effectiveValues.map((val) => (
                <div
                  key={val.value}
                  className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-bg-subtle"
                >
                  {/* Swatch */}
                  {baseAttr.hasSwatch && (
                    <span
                      className="size-6 shrink-0 rounded-full border border-border-default"
                      style={{ backgroundColor: val.swatch ?? "#CCCCCC" }}
                    />
                  )}

                  {/* Value name */}
                  <span className="flex-1 text-[0.8125rem] font-medium text-ink-primary">
                    {val.value}
                  </span>

                  {/* SKU count */}
                  <span className="text-xs text-ink-tertiary">
                    {val.skuCount > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <Package className="size-3" />
                        {val.skuCount} SKU
                      </span>
                    ) : (
                      "Chưa có SKU"
                    )}
                  </span>

                  {/* Product count */}
                  <span className="text-xs text-ink-tertiary">
                    {val.productIds.length} SP
                  </span>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => handleRemoveValue(val.value)}
                    className={cn(
                      "flex size-6 items-center justify-center rounded-[var(--r-sm)] border transition-colors",
                      val.skuCount > 0
                        ? "border-border-default text-ink-tertiary opacity-40 cursor-not-allowed"
                        : "border-danger/30 text-danger/60 hover:bg-danger/10 hover:text-danger"
                    )}
                    disabled={val.skuCount > 0}
                    title={val.skuCount > 0 ? "Không thể xoá — đã có SKU liên quan" : "Xoá giá trị"}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}

              {/* Inline add row */}
              {addingValue && (
                <div className="flex items-center gap-3 px-3 py-2.5 bg-accent/5">
                  {baseAttr.hasSwatch && (
                    <span className="size-6 shrink-0 rounded-full border border-dashed border-accent/40 bg-bg-muted" />
                  )}
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddValue();
                      if (e.key === "Escape") {
                        setAddingValue(false);
                        setNewValue("");
                      }
                    }}
                    placeholder="Nhập giá trị mới..."
                    className="flex-1 border-none bg-transparent text-[0.8125rem] text-ink-primary outline-none placeholder:text-ink-tertiary"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddValue}
                    className="rounded-[var(--r-sm)] bg-accent px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-accent/90"
                  >
                    Thêm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingValue(false);
                      setNewValue("");
                    }}
                    className="text-ink-tertiary hover:text-ink-primary"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Sản phẩm sử dụng */}
          <section className="rounded-[var(--card-radius)] border border-border-default bg-bg-surface p-[var(--card-pad)]">
            <h2 className="mb-3 flex items-center gap-2 text-[0.9375rem] font-semibold text-ink-primary">
              <Package className="size-4 text-accent" />
              Sản phẩm sử dụng ({baseAttr.products.length})
            </h2>
            {baseAttr.products.length > 0 ? (
              <DataTable
                data={baseAttr.products}
                columns={productColumns}
                rowKey={(row) => row.productId}
                caption={`${baseAttr.products.length} sản phẩm sử dụng thuộc tính ${baseAttr.name.vi}`}
                pageSize={10}
              />
            ) : (
              <div className="rounded-[var(--r-sm)] border border-border-default py-10 text-center text-[0.8125rem] text-ink-tertiary">
                Chưa có sản phẩm nào sử dụng thuộc tính này
              </div>
            )}
          </section>
        </div>

        {/* ============================================================== */}
        {/*  RIGHT COLUMN                                                  */}
        {/* ============================================================== */}
        <div className="space-y-5">
          {/* Thông tin thuộc tính */}
          <section className="rounded-[var(--card-radius)] border border-border-default bg-bg-surface p-[var(--card-pad)]">
            <h2 className="mb-4 flex items-center gap-2 text-[0.9375rem] font-semibold text-ink-primary">
              <Palette className="size-4 text-accent" />
              Thông tin
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-[0.8125rem]">
                <span className="text-ink-secondary">Mã thuộc tính</span>
                <span className="font-[family-name:var(--font-mono)] font-medium text-accent">
                  {baseAttr.attributeId}
                </span>
              </div>
              <div className="flex justify-between text-[0.8125rem]">
                <span className="text-ink-secondary">Tên tiếng Việt</span>
                <span className="font-medium text-ink-primary">{baseAttr.name.vi}</span>
              </div>
              <div className="flex justify-between text-[0.8125rem]">
                <span className="text-ink-secondary">Tên tiếng Anh</span>
                <span className="font-medium text-ink-primary">{baseAttr.name.en}</span>
              </div>
              <div className="flex justify-between text-[0.8125rem]">
                <span className="text-ink-secondary">Loại hiển thị</span>
                <span className="font-medium text-ink-primary">
                  {baseAttr.hasSwatch ? "Mẫu màu (Swatch)" : "Văn bản (Text)"}
                </span>
              </div>
              <div className="border-t border-border-default pt-2">
                <div className="flex justify-between text-[0.8125rem]">
                  <span className="text-ink-secondary">Số giá trị</span>
                  <span className="font-[family-name:var(--font-mono)] font-medium text-ink-primary">
                    {effectiveValues.length}
                  </span>
                </div>
                <div className="flex justify-between text-[0.8125rem]">
                  <span className="text-ink-secondary">SP sử dụng</span>
                  <span className="font-[family-name:var(--font-mono)] font-medium text-ink-primary">
                    {baseAttr.products.length}
                  </span>
                </div>
                <div className="flex justify-between text-[0.8125rem]">
                  <span className="text-ink-secondary">SKU liên quan</span>
                  <span className="font-[family-name:var(--font-mono)] font-medium text-ink-primary">
                    {totalSkus}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Preview swatch/giá trị */}
          <section className="rounded-[var(--card-radius)] border border-border-default bg-bg-surface p-[var(--card-pad)]">
            <h2 className="mb-3 text-[0.9375rem] font-semibold text-ink-primary">
              {baseAttr.hasSwatch ? "Bảng màu" : "Tất cả giá trị"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {effectiveValues.map((val) => (
                <span
                  key={val.value}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-bg-subtle px-2.5 py-1 text-xs font-medium text-ink-secondary"
                >
                  {val.swatch && (
                    <span
                      className="size-4 rounded-full border border-border-default"
                      style={{ backgroundColor: val.swatch }}
                    />
                  )}
                  {val.value}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
