"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { cn } from "cn";
import {
  Palette,
  Plus,
  Pencil,
  Trash2,
  Package,
  Hash,
  Pipette,
  Eye,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatTile } from "@/components/shared/StatTile";
import { SearchBar } from "@/components/shared/SearchBar";
import { toast } from "@/components/shared/Toast";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  products,
  type Product,
  type ProductAttribute,
} from "@/lib/mock-data";

/* -------------------------------------------------------------------------- */
/*  Aggregate unique attributes from all products                             */
/* -------------------------------------------------------------------------- */

interface AggregatedAttribute {
  attributeId: string;
  name: { vi: string; en: string };
  values: string[];
  swatch?: Record<string, string>;
  productCount: number;
  productIds: string[];
}

function aggregateAttributes(productList: Product[]): AggregatedAttribute[] {
  const map = new Map<
    string,
    {
      attr: ProductAttribute;
      valuesSet: Set<string>;
      swatchMerged: Record<string, string>;
      productIds: Set<string>;
    }
  >();

  for (const p of productList) {
    for (const attr of p.attributes) {
      const existing = map.get(attr.attributeId);
      if (!existing) {
        map.set(attr.attributeId, {
          attr: { ...attr },
          valuesSet: new Set(attr.values),
          swatchMerged: attr.swatch ? { ...attr.swatch } : {},
          productIds: new Set([p.productId]),
        });
      } else {
        for (const v of attr.values) existing.valuesSet.add(v);
        if (attr.swatch) Object.assign(existing.swatchMerged, attr.swatch);
        existing.productIds.add(p.productId);
      }
    }
  }

  return Array.from(map.values()).map((entry) => ({
    attributeId: entry.attr.attributeId,
    name: entry.attr.name,
    values: [...entry.valuesSet],
    swatch: Object.keys(entry.swatchMerged).length > 0 ? entry.swatchMerged : undefined,
    productCount: entry.productIds.size,
    productIds: [...entry.productIds],
  }));
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function VariantAttributesPage() {
  const baseAttributes = useMemo(() => aggregateAttributes(products), []);

  /* State overrides for CRUD mock */
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [addedAttrs, setAddedAttrs] = useState<AggregatedAttribute[]>([]);
  const [addedValues, setAddedValues] = useState<Map<string, string[]>>(new Map());
  const [removedValues, setRemovedValues] = useState<Map<string, Set<string>>>(new Map());

  /* Search */
  const [search, setSearch] = useState("");

  /* Create dialog */
  const [createOpen, setCreateOpen] = useState(false);
  const [newNameVi, setNewNameVi] = useState("");
  const [newNameEn, setNewNameEn] = useState("");
  const [newValues, setNewValues] = useState("");
  const [newHasSwatch, setNewHasSwatch] = useState(false);

  /* Delete dialog */
  const [deleteTarget, setDeleteTarget] = useState<AggregatedAttribute | null>(null);

  /* Effective attributes list */
  const effectiveAttributes = useMemo(() => {
    let list = baseAttributes
      .filter((a) => !deletedIds.has(a.attributeId))
      .map((a) => {
        const extra = addedValues.get(a.attributeId) ?? [];
        const removed = removedValues.get(a.attributeId) ?? new Set<string>();
        const merged = [...a.values.filter((v) => !removed.has(v)), ...extra];
        return { ...a, values: merged };
      });
    list = [...list, ...addedAttrs];
    return list;
  }, [baseAttributes, deletedIds, addedAttrs, addedValues, removedValues]);

  /* Filtered */
  const filtered = useMemo(() => {
    if (!search.trim()) return effectiveAttributes;
    const q = search.toLowerCase();
    return effectiveAttributes.filter(
      (a) =>
        a.name.vi.toLowerCase().includes(q) ||
        a.name.en.toLowerCase().includes(q) ||
        a.attributeId.toLowerCase().includes(q)
    );
  }, [effectiveAttributes, search]);

  /* Stats */
  const stats = useMemo(() => {
    const total = effectiveAttributes.length;
    const totalValues = effectiveAttributes.reduce((s, a) => s + a.values.length, 0);
    const withSwatch = effectiveAttributes.filter((a) => a.swatch).length;
    const usedByProducts = new Set(effectiveAttributes.flatMap((a) => a.productIds)).size;
    return [
      { label: "Thuộc tính", value: total.toString(), icon: Palette },
      { label: "Tổng giá trị", value: totalValues.toString(), icon: Hash },
      { label: "Có swatch", value: withSwatch.toString(), icon: Pipette },
      { label: "SP sử dụng", value: usedByProducts.toString(), icon: Package },
    ];
  }, [effectiveAttributes]);

  /* Handlers */
  const handleCreate = useCallback(() => {
    if (!newNameVi.trim() || !newNameEn.trim()) {
      toast.warning("Thiếu thông tin", "Vui lòng nhập tên thuộc tính tiếng Việt và tiếng Anh.");
      return;
    }
    const values = newValues
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (values.length === 0) {
      toast.warning("Thiếu giá trị", "Nhập ít nhất 1 giá trị, cách nhau bằng dấu phẩy.");
      return;
    }
    const id = `ATTR-${newNameEn.toUpperCase().replace(/\s+/g, "-")}`;
    const newAttr: AggregatedAttribute = {
      attributeId: id,
      name: { vi: newNameVi.trim(), en: newNameEn.trim() },
      values,
      swatch: newHasSwatch ? Object.fromEntries(values.map((v) => [v, "#CCCCCC"])) : undefined,
      productCount: 0,
      productIds: [],
    };
    setAddedAttrs((prev) => [...prev, newAttr]);
    setCreateOpen(false);
    setNewNameVi("");
    setNewNameEn("");
    setNewValues("");
    setNewHasSwatch(false);
    toast.success("Tạo thuộc tính", `${newNameVi.trim()} đã được tạo.`);
  }, [newNameVi, newNameEn, newValues, newHasSwatch]);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    // Check if it's a mock-added attr
    if (addedAttrs.some((a) => a.attributeId === deleteTarget.attributeId)) {
      setAddedAttrs((prev) => prev.filter((a) => a.attributeId !== deleteTarget.attributeId));
    } else {
      setDeletedIds((prev) => new Set(prev).add(deleteTarget.attributeId));
    }
    toast.success("Xoá thuộc tính", `${deleteTarget.name.vi} đã được xoá.`);
    setDeleteTarget(null);
  }, [deleteTarget, addedAttrs]);

  const handleRemoveValue = useCallback((attrId: string, value: string) => {
    setRemovedValues((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(attrId) ?? []);
      set.add(value);
      next.set(attrId, set);
      return next;
    });
    toast.info("Xoá giá trị", `"${value}" đã được xoá.`);
  }, []);

  /* Inline add value */
  const [addingValueFor, setAddingValueFor] = useState<string | null>(null);
  const [inlineValue, setInlineValue] = useState("");

  const handleAddValue = useCallback(
    (attrId: string) => {
      if (!inlineValue.trim()) return;
      setAddedValues((prev) => {
        const next = new Map(prev);
        const arr = [...(next.get(attrId) ?? []), inlineValue.trim()];
        next.set(attrId, arr);
        return next;
      });
      toast.success("Thêm giá trị", `"${inlineValue.trim()}" đã thêm.`);
      setInlineValue("");
      setAddingValueFor(null);
    },
    [inlineValue]
  );

  return (
    <>
      <PageHeader
        title="Thuộc tính biến thể"
        breadcrumbs={[
          { label: "Back-office", href: "/admin" },
          { label: "Sản phẩm", href: "/admin/products" },
          { label: "Thuộc tính biến thể" },
        ]}
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-[var(--r-sm)] bg-brand px-3 py-1.5 text-[0.8125rem] font-medium text-ink-inverse transition-colors hover:bg-brand-hover"
          >
            <Plus className="size-3.5" />
            Tạo thuộc tính
          </button>
        }
      />

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <StatTile key={s.label} label={s.label} value={s.value} icon={s.icon} />
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchBar
          placeholder="Tìm thuộc tính (tên vi/en, mã)..."
          value={search}
          onChange={setSearch}
          className="max-w-[320px]"
        />
      </div>

      {/* Attribute cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[var(--card-radius)] border border-border-default bg-bg-surface py-16 text-ink-tertiary">
          <Palette className="mb-3 size-10 opacity-40" />
          <p className="text-[0.9375rem]">Không tìm thấy thuộc tính nào.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((attr) => (
            <div
              key={attr.attributeId}
              className="rounded-[var(--card-radius)] border border-border-default bg-bg-surface p-[var(--card-pad)] transition-shadow hover:shadow-[var(--sh-sm)]"
            >
              {/* Card header */}
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/admin/variants/${attr.attributeId}`}
                    className="text-[0.9375rem] font-semibold text-ink-primary hover:text-accent"
                  >
                    {attr.name.vi}
                  </Link>
                  <p className="text-xs text-ink-tertiary">
                    {attr.name.en} · <span className="font-[family-name:var(--font-mono)]">{attr.attributeId}</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    href={`/admin/variants/${attr.attributeId}`}
                    className="flex size-7 items-center justify-center rounded-[var(--r-sm)] border border-border-default bg-bg-surface text-ink-tertiary transition-colors hover:bg-bg-muted hover:text-ink-primary"
                    aria-label="Xem chi tiết"
                  >
                    <Eye className="size-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => toast.info("Chỉnh sửa", "Chức năng đang phát triển.")}
                    className="flex size-7 items-center justify-center rounded-[var(--r-sm)] border border-border-default bg-bg-surface text-ink-tertiary transition-colors hover:bg-bg-muted hover:text-ink-primary"
                    aria-label="Chỉnh sửa"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(attr)}
                    className="flex size-7 items-center justify-center rounded-[var(--r-sm)] border border-danger/30 bg-bg-surface text-danger/70 transition-colors hover:bg-danger/10 hover:text-danger"
                    aria-label="Xoá"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Values */}
              <div className="mb-3 flex flex-wrap gap-1.5">
                {attr.values.map((val) => (
                  <span
                    key={val}
                    className="group inline-flex items-center gap-1 rounded-full border border-border-default bg-bg-subtle px-2 py-0.5 text-xs font-medium text-ink-secondary"
                  >
                    {attr.swatch?.[val] && (
                      <span
                        className="size-3 rounded-full border border-border-default"
                        style={{ backgroundColor: attr.swatch[val] }}
                      />
                    )}
                    {val}
                    <button
                      type="button"
                      onClick={() => handleRemoveValue(attr.attributeId, val)}
                      className="ml-0.5 hidden size-3.5 items-center justify-center rounded-full text-ink-tertiary hover:bg-danger/10 hover:text-danger group-hover:inline-flex"
                      aria-label={`Xoá ${val}`}
                    >
                      <X className="size-2.5" />
                    </button>
                  </span>
                ))}

                {/* Inline add value */}
                {addingValueFor === attr.attributeId ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/5 px-1.5 py-0.5">
                    <input
                      type="text"
                      value={inlineValue}
                      onChange={(e) => setInlineValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddValue(attr.attributeId);
                        if (e.key === "Escape") {
                          setAddingValueFor(null);
                          setInlineValue("");
                        }
                      }}
                      placeholder="Giá trị..."
                      className="w-16 border-none bg-transparent text-xs text-ink-primary outline-none placeholder:text-ink-tertiary"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleAddValue(attr.attributeId)}
                      className="text-xs font-medium text-accent hover:underline"
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingValueFor(null);
                        setInlineValue("");
                      }}
                      className="text-xs text-ink-tertiary hover:text-ink-primary"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAddingValueFor(attr.attributeId);
                      setInlineValue("");
                    }}
                    className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-border-strong px-2 py-0.5 text-xs text-ink-tertiary transition-colors hover:border-accent hover:text-accent"
                  >
                    <Plus className="size-3" />
                    Thêm
                  </button>
                )}
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 text-xs text-ink-tertiary">
                <span>{attr.values.length} giá trị</span>
                <span>·</span>
                <span>{attr.productCount} SP sử dụng</span>
                {attr.swatch && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Pipette className="size-3" />
                      Có swatch
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      {createOpen && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-xs"
            onClick={() => setCreateOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-[var(--r-md)] border border-border-default bg-bg-surface p-6 shadow-[var(--sh-lg)]">
            <h2 className="mb-4 text-[0.9375rem] font-semibold text-ink-primary">
              Tạo thuộc tính mới
            </h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-secondary">
                  Tên tiếng Việt <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={newNameVi}
                  onChange={(e) => setNewNameVi(e.target.value)}
                  placeholder="Chất liệu"
                  className="w-full rounded-[var(--r-sm)] border border-border-default bg-bg-surface px-3 py-1.5 text-[0.8125rem] text-ink-primary outline-none transition-colors focus:border-accent placeholder:text-ink-tertiary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-secondary">
                  Tên tiếng Anh <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={newNameEn}
                  onChange={(e) => setNewNameEn(e.target.value)}
                  placeholder="Material"
                  className="w-full rounded-[var(--r-sm)] border border-border-default bg-bg-surface px-3 py-1.5 text-[0.8125rem] text-ink-primary outline-none transition-colors focus:border-accent placeholder:text-ink-tertiary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-secondary">
                  Giá trị (cách nhau dấu phẩy) <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={newValues}
                  onChange={(e) => setNewValues(e.target.value)}
                  placeholder="Cotton, Polyester, Linen"
                  className="w-full rounded-[var(--r-sm)] border border-border-default bg-bg-surface px-3 py-1.5 text-[0.8125rem] text-ink-primary outline-none transition-colors focus:border-accent placeholder:text-ink-tertiary"
                />
              </div>
              <label className="flex items-center gap-2 text-[0.8125rem] text-ink-secondary">
                <input
                  type="checkbox"
                  checked={newHasSwatch}
                  onChange={(e) => setNewHasSwatch(e.target.checked)}
                  className="size-4 rounded border-border-default accent-accent"
                />
                Có mẫu màu (swatch)
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-[var(--r-sm)] border border-border-default px-3 py-1.5 text-[0.8125rem] font-medium text-ink-secondary transition-colors hover:bg-bg-muted"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="rounded-[var(--r-sm)] bg-brand px-3 py-1.5 text-[0.8125rem] font-medium text-ink-inverse transition-colors hover:bg-brand-hover"
              >
                Tạo thuộc tính
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="Xoá thuộc tính"
        description={
          deleteTarget
            ? deleteTarget.productCount > 0
              ? `"${deleteTarget.name.vi}" đang được ${deleteTarget.productCount} sản phẩm sử dụng. Xoá sẽ ảnh hưởng tới các sản phẩm này.`
              : `Xác nhận xoá thuộc tính "${deleteTarget.name.vi}"?`
            : ""
        }
        confirmLabel="Xoá"
        variant="danger"
      />
    </>
  );
}
