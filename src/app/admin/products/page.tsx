"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "cn";
import {
  Eye,
  Package,
  PackageCheck,
  Clock,
  CheckCircle,
  ShoppingBag,
  XCircle,
  Archive,
  Plus,
  Tag,
  Barcode,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatTile } from "@/components/shared/StatTile";
import { FilterBar } from "@/components/shared/FilterBar";
import { SearchBar } from "@/components/shared/SearchBar";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { toast } from "@/components/shared/Toast";
import {
  codeCell,
  textCell,
  numberCell,
  moneyCell,
  statusCell,
} from "@/components/shared/column-helpers";
import {
  products as rawProducts,
  skus as rawSkus,
  categories,
  formatVND,
  type Product,
  type ProductStatus,
  type Sku,
  type Category,
} from "@/lib/mock-data";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const categoryMap = new Map<string, string>(
  categories.map((c: Category) => [c.categoryId, c.name.vi])
);

const skuCountMap = new Map<string, number>();
for (const s of rawSkus) {
  skuCountMap.set(s.productId, (skuCountMap.get(s.productId) ?? 0) + 1);
}

/** Map productId → product name */
const productNameMap = new Map<string, string>(
  rawProducts.map((p) => [p.productId, p.name])
);

/* -------------------------------------------------------------------------- */
/*  Product stats                                                             */
/* -------------------------------------------------------------------------- */

function computeProductStats(list: Product[]) {
  const total = list.length;
  const draft = list.filter((p) => p.status === "Draft").length;
  const pending = list.filter((p) => p.status === "Pending Approval").length;
  const approved = list.filter((p) => p.status === "Approved").length;
  const active = list.filter((p) => p.status === "Active").length;
  const published = list.filter((p) => p.status === "Published").length;
  const inactive = list.filter((p) => p.status === "Inactive").length;
  const discontinued = list.filter((p) => p.status === "Discontinued").length;

  return [
    { label: "Tổng SP", value: total.toString(), icon: Package },
    { label: "Draft", value: draft.toString(), icon: Clock },
    { label: "Chờ duyệt", value: pending.toString(), icon: PackageCheck },
    { label: "Đã duyệt", value: approved.toString(), icon: CheckCircle },
    { label: "Đang hoạt động", value: active.toString(), icon: ShoppingBag },
    { label: "Đã xuất bản", value: published.toString(), icon: Archive },
    { label: "Ngừng KD", value: (inactive + discontinued).toString(), icon: XCircle },
  ];
}

/* -------------------------------------------------------------------------- */
/*  SKU stats                                                                 */
/* -------------------------------------------------------------------------- */

function computeSkuStats(list: Sku[]) {
  const total = list.length;
  const active = list.filter((s) => s.status === "Active").length;
  const blocked = list.filter((s) => s.status === "Blocked").length;
  const obsolete = list.filter((s) => s.status === "Obsolete").length;
  const totalStock = list.reduce((s, sk) => s + sk.stockOnHand, 0);
  const available = list.reduce((s, sk) => s + sk.stockAvailable, 0);
  const lowStock = list.filter((s) => s.stockAvailable <= s.reorderPoint && s.reorderPoint > 0).length;

  return [
    { label: "Tổng SKU", value: total.toString(), icon: Tag },
    { label: "Active", value: active.toString(), icon: CheckCircle },
    { label: "Blocked", value: blocked.toString(), icon: XCircle },
    { label: "Obsolete", value: obsolete.toString(), icon: Archive },
    { label: "Tồn kho", value: totalStock.toLocaleString("vi-VN"), icon: Package },
    { label: "Khả dụng", value: available.toLocaleString("vi-VN"), icon: ShoppingBag },
    { label: "Sắp hết", value: lowStock.toString(), icon: Clock },
  ];
}

/* -------------------------------------------------------------------------- */
/*  Filter chips                                                              */
/* -------------------------------------------------------------------------- */

const PRODUCT_STATUS_FILTERS = [
  { label: "Tất cả", value: "all" },
  { label: "Draft", value: "Draft" },
  { label: "Pending Approval", value: "Pending Approval" },
  { label: "Approved", value: "Approved" },
  { label: "Active", value: "Active" },
  { label: "Published", value: "Published" },
  { label: "Inactive", value: "Inactive" },
  { label: "Discontinued", value: "Discontinued" },
];

const SKU_STATUS_FILTERS = [
  { label: "Tất cả", value: "all" },
  { label: "Active", value: "Active" },
  { label: "Blocked", value: "Blocked" },
  { label: "Obsolete", value: "Obsolete" },
];

/* -------------------------------------------------------------------------- */
/*  Row flags                                                                 */
/* -------------------------------------------------------------------------- */

function shouldFlagProduct(row: Product): boolean {
  return ["Draft", "Pending Approval", "Inactive"].includes(row.status);
}

function shouldFlagSku(row: Sku): boolean {
  return row.status === "Blocked" || (row.stockAvailable <= row.reorderPoint && row.reorderPoint > 0);
}

/* -------------------------------------------------------------------------- */
/*  Tabs                                                                      */
/* -------------------------------------------------------------------------- */

type TabKey = "products" | "skus";

const TABS: { key: TabKey; label: string; icon: typeof Package }[] = [
  { key: "products", label: "Sản phẩm", icon: Package },
  { key: "skus", label: "SKU", icon: Barcode },
];

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function ProductsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("products");

  /* --- Product tab state --- */
  const [prodSearch, setProdSearch] = useState("");
  const [prodFilter, setProdFilter] = useState("all");
  const [prodSelectedKeys, setProdSelectedKeys] = useState<Set<string>>(new Set());

  /* --- SKU tab state --- */
  const [skuSearch, setSkuSearch] = useState("");
  const [skuFilter, setSkuFilter] = useState("all");
  const [skuSelectedKeys, setSkuSelectedKeys] = useState<Set<string>>(new Set());

  /* --- Product filtered --- */
  const filteredProducts = useMemo(() => {
    let list: Product[] = rawProducts;
    if (prodFilter !== "all") {
      list = list.filter((p) => p.status === prodFilter);
    }
    if (prodSearch.trim()) {
      const q = prodSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.productId.toLowerCase().includes(q)
      );
    }
    return list;
  }, [prodSearch, prodFilter]);

  const productStats = useMemo(() => computeProductStats(rawProducts), []);

  const navigateToDetail = useCallback(
    (product: Product) => {
      router.push(`/admin/products/${product.productId}`);
    },
    [router]
  );

  /* --- SKU filtered --- */
  const filteredSkus = useMemo(() => {
    let list: Sku[] = rawSkus;
    if (skuFilter !== "all") {
      list = list.filter((s) => s.status === skuFilter);
    }
    if (skuSearch.trim()) {
      const q = skuSearch.toLowerCase();
      list = list.filter(
        (s) =>
          s.skuId.toLowerCase().includes(q) ||
          s.variantLabel.toLowerCase().includes(q) ||
          s.barcode.includes(q)
      );
    }
    return list;
  }, [skuSearch, skuFilter]);

  const skuStats = useMemo(() => computeSkuStats(rawSkus), []);

  const navigateToSkuDetail = useCallback(
    (sku: Sku) => {
      router.push(`/admin/products/sku/${sku.skuId}`);
    },
    [router]
  );

  /* --- Product columns --- */
  const productColumns: ColumnDef<Product>[] = [
    {
      key: "productId",
      header: "Mã SP",
      sortable: true,
      compare: (a, b) => a.productId.localeCompare(b.productId),
      cell: (row) => (
        <Link
          href={`/admin/products/${row.productId}`}
          onClick={(e) => e.stopPropagation()}
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
          onClick={(e) => e.stopPropagation()}
          className="text-[0.8125rem] font-medium text-ink-primary hover:text-accent hover:underline"
        >
          {row.name}
        </Link>
      ),
    },
    textCell<Product>("category", "Danh mục", (row) => categoryMap.get(row.categoryId) ?? "—", {
      sortable: true,
      compare: (a, b) =>
        (categoryMap.get(a.categoryId) ?? "").localeCompare(categoryMap.get(b.categoryId) ?? ""),
      color: "secondary",
    }),
    {
      key: "type",
      header: "Loại",
      sortable: true,
      compare: (a, b) => a.type.localeCompare(b.type),
      cell: (row) => (
        <span className="text-[0.8125rem] text-ink-secondary">
          {row.type === "Customizable" ? "Tùy chỉnh" : "Tiêu chuẩn"}
        </span>
      ),
    },
    {
      key: "skuCount",
      header: "SKU",
      align: "right",
      sortable: true,
      compare: (a, b) =>
        (skuCountMap.get(a.productId) ?? 0) - (skuCountMap.get(b.productId) ?? 0),
      cell: (row) => (
        <span className="font-[family-name:var(--font-mono)] text-[0.8125rem] font-medium tabular-nums text-ink-primary">
          {skuCountMap.get(row.productId) ?? 0}
        </span>
      ),
    },
    statusCell<Product>("status", "Trạng thái", (row) => row.status, "product", {
      sortable: true,
      compare: (a, b) => a.status.localeCompare(b.status),
      withIcon: true,
    }),
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <Link
          href={`/admin/products/${row.productId}`}
          onClick={(e) => e.stopPropagation()}
          className="flex size-7 items-center justify-center rounded-[var(--r-sm)] border border-border-default bg-bg-surface text-ink-tertiary transition-colors hover:bg-bg-muted hover:text-ink-primary"
          aria-label="Xem chi tiết"
        >
          <Eye className="size-3.5" />
        </Link>
      ),
    },
  ];

  /* --- SKU columns --- */
  const skuColumns: ColumnDef<Sku>[] = [
    {
      key: "skuId",
      header: "Mã SKU",
      sortable: true,
      compare: (a, b) => a.skuId.localeCompare(b.skuId),
      cell: (row) => (
        <Link
          href={`/admin/products/sku/${row.skuId}`}
          onClick={(e) => e.stopPropagation()}
          className="font-[family-name:var(--font-mono)] text-[0.8125rem] font-medium text-accent hover:underline"
        >
          {row.skuId}
        </Link>
      ),
    },
    textCell<Sku>("variantLabel", "Biến thể", (row) => row.variantLabel, {
      sortable: true,
      compare: (a, b) => a.variantLabel.localeCompare(b.variantLabel),
      color: "primary",
    }),
    {
      key: "productId",
      header: "Sản phẩm",
      sortable: true,
      compare: (a, b) => a.productId.localeCompare(b.productId),
      cell: (row) => (
        <Link
          href={`/admin/products/${row.productId}`}
          onClick={(e) => e.stopPropagation()}
          className="text-[0.8125rem] text-ink-secondary hover:text-accent hover:underline"
        >
          {productNameMap.get(row.productId) ?? row.productId}
        </Link>
      ),
    },
    textCell<Sku>("uom", "UoM", (row) => row.uom, { color: "secondary" }),
    numberCell<Sku>("stockOnHand", "Tồn kho", (row) => row.stockOnHand, {
      sortable: true,
      compare: (a, b) => a.stockOnHand - b.stockOnHand,
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
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <Link
          href={`/admin/products/sku/${row.skuId}`}
          onClick={(e) => e.stopPropagation()}
          className="flex size-7 items-center justify-center rounded-[var(--r-sm)] border border-border-default bg-bg-surface text-ink-tertiary transition-colors hover:bg-bg-muted hover:text-ink-primary"
          aria-label="Xem chi tiết"
        >
          <Eye className="size-3.5" />
        </Link>
      ),
    },
  ];

  /* Bulk selection label */
  const bulkLabel = activeTab === "products" ? "sản phẩm" : "SKU";
  const currentSelectedKeys = activeTab === "products" ? prodSelectedKeys : skuSelectedKeys;
  const setCurrentSelectedKeys = activeTab === "products" ? setProdSelectedKeys : setSkuSelectedKeys;

  return (
    <>
      <PageHeader
        title="Sản phẩm & SKU"
        breadcrumbs={[
          { label: "Back-office", href: "/admin" },
          { label: "Sản phẩm" },
        ]}
        actions={
          activeTab === "products" ? (
            <button
              type="button"
              onClick={() => router.push("/admin/products/create")}
              className="inline-flex items-center gap-1.5 rounded-[var(--r-sm)] bg-brand px-3 py-1.5 text-[0.8125rem] font-medium text-ink-inverse transition-colors hover:bg-brand-hover"
            >
              <Plus className="size-3.5" />
              Tạo sản phẩm
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-[var(--r-sm)] border border-border-default bg-bg-subtle px-3 py-1.5 text-xs text-ink-tertiary">
              SKU tự sinh từ tổ hợp biến thể
            </span>
          )
        }
      />

      {/* ================================================================ */}
      {/*  Tabs                                                            */}
      {/* ================================================================ */}
      <div className="mb-4 flex gap-0 border-b border-border-default">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "inline-flex items-center gap-1.5 border-b-2 px-4 py-2 text-[0.8125rem] font-medium transition-colors",
                isActive
                  ? "border-accent text-accent"
                  : "border-transparent text-ink-tertiary hover:text-ink-primary"
              )}
            >
              <Icon className="size-3.5" />
              {tab.label}
              <span
                className={cn(
                  "ml-1 rounded-full px-1.5 py-0.5 text-[0.625rem] font-semibold tabular-nums",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "bg-bg-muted text-ink-tertiary"
                )}
              >
                {tab.key === "products" ? rawProducts.length : rawSkus.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bulk action bar */}
      {currentSelectedKeys.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-[var(--r-sm)] border border-accent/30 bg-accent/5 px-4 py-2.5">
          <span className="text-[0.8125rem] font-medium text-accent">
            Đã chọn {currentSelectedKeys.size} {bulkLabel}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                toast.success("Xuất Excel", `Đã xuất ${currentSelectedKeys.size} ${bulkLabel}.`)
              }
              className="rounded-[var(--r-sm)] border border-border-default bg-bg-surface px-2.5 py-1 text-xs font-medium text-ink-secondary transition-colors hover:bg-bg-muted hover:text-ink-primary"
            >
              Xuất Excel
            </button>
            <button
              type="button"
              onClick={() => {
                toast.warning("Xóa", `Đã xóa ${currentSelectedKeys.size} ${bulkLabel} (mock).`);
                setCurrentSelectedKeys(new Set());
              }}
              className="rounded-[var(--r-sm)] border border-danger/30 px-2.5 py-1 text-xs font-medium text-danger transition-colors hover:bg-danger/10"
            >
              Xóa
            </button>
          </div>
          <button
            type="button"
            onClick={() => setCurrentSelectedKeys(new Set())}
            className="ml-auto text-xs text-ink-tertiary hover:text-ink-primary"
          >
            Bỏ chọn
          </button>
        </div>
      )}

      {/* ================================================================ */}
      {/*  Tab: Sản phẩm                                                   */}
      {/* ================================================================ */}
      {activeTab === "products" && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {productStats.map((s) => (
              <StatTile key={s.label} label={s.label} value={s.value} icon={s.icon} />
            ))}
          </div>

          <FilterBar
            chips={PRODUCT_STATUS_FILTERS}
            active={prodFilter}
            onChange={setProdFilter}
            className="mb-4"
          >
            <SearchBar
              placeholder="Tìm tên/mã SP..."
              value={prodSearch}
              onChange={setProdSearch}
              className="order-first basis-full lg:basis-[280px] lg:grow-0"
            />
          </FilterBar>

          <DataTable
            data={filteredProducts}
            columns={productColumns}
            rowKey={(row) => row.productId}
            caption={`Hiển thị ${filteredProducts.length} sản phẩm`}
            flagRow={shouldFlagProduct}
            onRowClick={navigateToDetail}
            selectable
            selectedKeys={prodSelectedKeys}
            onSelectionChange={setProdSelectedKeys}
            pageSize={15}
          />
        </>
      )}

      {/* ================================================================ */}
      {/*  Tab: SKU                                                        */}
      {/* ================================================================ */}
      {activeTab === "skus" && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {skuStats.map((s) => (
              <StatTile key={s.label} label={s.label} value={s.value} icon={s.icon} />
            ))}
          </div>

          <FilterBar
            chips={SKU_STATUS_FILTERS}
            active={skuFilter}
            onChange={setSkuFilter}
            className="mb-4"
          >
            <SearchBar
              placeholder="Tìm mã SKU/biến thể/barcode..."
              value={skuSearch}
              onChange={setSkuSearch}
              className="order-first basis-full lg:basis-[300px] lg:grow-0"
            />
          </FilterBar>

          <DataTable
            data={filteredSkus}
            columns={skuColumns}
            rowKey={(row) => row.skuId}
            caption={`Hiển thị ${filteredSkus.length} SKU`}
            flagRow={shouldFlagSku}
            onRowClick={navigateToSkuDetail}
            selectable
            selectedKeys={skuSelectedKeys}
            onSelectionChange={setSkuSelectedKeys}
            pageSize={15}
          />
        </>
      )}
    </>
  );
}
