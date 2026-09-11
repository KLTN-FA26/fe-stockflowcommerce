"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "cn";
import { BarChart3, Eye, Package, PackageCheck, Clock, CheckCircle, ShoppingBag, XCircle, Archive, Plus, Tag, Barcode } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListStatsPanel } from "@/components/shared/ListStatsPanel";
import { ColumnFilterButton, ListToolbar, type ListSummaryItem } from "@/components/shared/ListToolbar";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { toast } from "@/components/shared/Toast";
import { Button } from "@/components/ui/button";
import { numberCell, moneyCell, statusCell, textCell } from "@/components/shared/column-helpers";
import { products as rawProducts, skus as rawSkus, categories, formatVND, type Product, type Sku, type Category } from "@/lib/mock-data";
import { STATUS_LABEL_VI } from "@/lib/status-map";

const categoryMap = new Map<string, string>(categories.map((c: Category) => [c.categoryId, c.name.vi]));
const skuCountMap = new Map<string, number>();
for (const s of rawSkus) skuCountMap.set(s.productId, (skuCountMap.get(s.productId) ?? 0) + 1);
const productNameMap = new Map<string, string>(rawProducts.map((p) => [p.productId, p.name]));

type TabKey = "products" | "skus";
type ProductStatusFilter = "all" | Product["status"];
type SkuStatusFilter = "all" | Sku["status"];
type ProductSearchField = "productId" | "name" | "category" | "type";
type SkuSearchField = "skuId" | "variantLabel" | "product" | "barcode";
type ProductColumnSearchKey = "productId" | "name" | "category";
type SkuColumnSearchKey = "skuId" | "variantLabel" | "product";
type ProductTableColumnKey = "productId" | "name" | "category" | "type" | "skuCount" | "status" | "actions";
type SkuTableColumnKey = "skuId" | "variantLabel" | "productId" | "uom" | "stockOnHand" | "stockAvailable" | "cost" | "status" | "actions";

interface TabConfig<Status extends string, Field extends string, ColumnSearch extends string, Column extends string> {
  showStats: boolean;
  statuses: Status[];
  globalSearch: { query: string; fields: Field[] };
  columnSearch: Partial<Record<ColumnSearch, string>>;
  visibleColumns: Column[];
}

interface ProductsPageConfig {
  products: TabConfig<ProductStatusFilter, ProductSearchField, ProductColumnSearchKey, ProductTableColumnKey>;
  skus: TabConfig<SkuStatusFilter, SkuSearchField, SkuColumnSearchKey, SkuTableColumnKey>;
}

const STORAGE_KEY = "stockflow:admin:products:config";
const PRODUCT_COLUMNS: ProductTableColumnKey[] = ["productId", "name", "category", "type", "skuCount", "status", "actions"];
const SKU_COLUMNS: SkuTableColumnKey[] = ["skuId", "variantLabel", "productId", "uom", "stockOnHand", "stockAvailable", "cost", "status", "actions"];
const DEFAULT_CONFIG: ProductsPageConfig = {
  products: { showStats: false, statuses: ["all"], globalSearch: { query: "", fields: ["productId", "name"] }, columnSearch: {}, visibleColumns: PRODUCT_COLUMNS },
  skus: { showStats: false, statuses: ["all"], globalSearch: { query: "", fields: ["skuId", "variantLabel", "barcode"] }, columnSearch: {}, visibleColumns: SKU_COLUMNS },
};

const TABS: { key: TabKey; label: string; icon: typeof Package }[] = [
  { key: "products", label: "Sản phẩm", icon: Package },
  { key: "skus", label: "SKU", icon: Barcode },
];

const PRODUCT_STATUS_OPTIONS = ["all", "Draft", "Pending Approval", "Approved", "Active", "Published", "Inactive", "Discontinued"].map((value) => ({ label: value === "all" ? "Tất cả" : STATUS_LABEL_VI[value] ?? value, value: value as ProductStatusFilter }));
const SKU_STATUS_OPTIONS = ["all", "Active", "Blocked", "Obsolete"].map((value) => ({ label: value === "all" ? "Tất cả" : STATUS_LABEL_VI[value] ?? value, value: value as SkuStatusFilter }));

const PRODUCT_COLUMN_LABELS: Record<ProductTableColumnKey, string> = { productId: "Mã SP", name: "Tên sản phẩm", category: "Danh mục", type: "Loại", skuCount: "SKU", status: "Trạng thái", actions: "Thao tác" };
const SKU_COLUMN_LABELS: Record<SkuTableColumnKey, string> = { skuId: "Mã SKU", variantLabel: "Biến thể", productId: "Sản phẩm", uom: "UoM", stockOnHand: "Tồn kho", stockAvailable: "Khả dụng", cost: "Giá vốn", status: "Trạng thái", actions: "Thao tác" };
const PRODUCT_COLUMN_SEARCH_LABELS: Record<ProductColumnSearchKey, string> = { productId: "Mã SP", name: "Tên sản phẩm", category: "Danh mục" };
const SKU_COLUMN_SEARCH_LABELS: Record<SkuColumnSearchKey, string> = { skuId: "Mã SKU", variantLabel: "Biến thể", product: "Sản phẩm" };

const PRODUCT_SEARCH_FIELDS: { label: string; value: ProductSearchField; getValue: (row: Product) => string }[] = [
  { label: "Mã SP", value: "productId", getValue: (row) => row.productId },
  { label: "Tên sản phẩm", value: "name", getValue: (row) => row.name },
  { label: "Danh mục", value: "category", getValue: (row) => categoryMap.get(row.categoryId) ?? "" },
  { label: "Loại", value: "type", getValue: (row) => row.type },
];
const SKU_SEARCH_FIELDS: { label: string; value: SkuSearchField; getValue: (row: Sku) => string }[] = [
  { label: "Mã SKU", value: "skuId", getValue: (row) => row.skuId },
  { label: "Biến thể", value: "variantLabel", getValue: (row) => row.variantLabel },
  { label: "Sản phẩm", value: "product", getValue: (row) => productNameMap.get(row.productId) ?? row.productId },
  { label: "Barcode", value: "barcode", getValue: (row) => row.barcode },
];

function computeProductStats(list: Product[]) {
  const total = list.length;
  const draft = list.filter((p) => p.status === "Draft").length;
  const pending = list.filter((p) => p.status === "Pending Approval").length;
  const approved = list.filter((p) => p.status === "Approved").length;
  const active = list.filter((p) => p.status === "Active").length;
  const published = list.filter((p) => p.status === "Published").length;
  const inactive = list.filter((p) => p.status === "Inactive" || p.status === "Discontinued").length;
  return [
    { label: "Tổng SP", value: total.toString(), icon: Package },
    { label: "Draft", value: draft.toString(), icon: Clock },
    { label: "Chờ duyệt", value: pending.toString(), icon: PackageCheck },
    { label: "Đã duyệt", value: approved.toString(), icon: CheckCircle },
    { label: "Đang hoạt động", value: active.toString(), icon: ShoppingBag },
    { label: "Đã xuất bản", value: published.toString(), icon: Archive },
    { label: "Ngừng KD", value: inactive.toString(), icon: XCircle },
  ];
}

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

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function shouldFlagProduct(row: Product): boolean {
  return ["Draft", "Pending Approval", "Inactive"].includes(row.status);
}

function shouldFlagSku(row: Sku): boolean {
  return row.status === "Blocked" || (row.stockAvailable <= row.reorderPoint && row.reorderPoint > 0);
}

export default function ProductsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("products");
  const [config, setConfig] = useState<ProductsPageConfig>(DEFAULT_CONFIG);
  const [mounted, setMounted] = useState(false);
  const [prodSelectedKeys, setProdSelectedKeys] = useState<Set<string>>(new Set());
  const [skuSelectedKeys, setSkuSelectedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as Partial<ProductsPageConfig>;
        setConfig({
          products: { ...DEFAULT_CONFIG.products, ...stored.products, globalSearch: { ...DEFAULT_CONFIG.products.globalSearch, ...stored.products?.globalSearch }, columnSearch: stored.products?.columnSearch ?? {}, visibleColumns: stored.products?.visibleColumns?.length ? stored.products.visibleColumns : PRODUCT_COLUMNS },
          skus: { ...DEFAULT_CONFIG.skus, ...stored.skus, globalSearch: { ...DEFAULT_CONFIG.skus.globalSearch, ...stored.skus?.globalSearch }, columnSearch: stored.skus?.columnSearch ?? {}, visibleColumns: stored.skus?.visibleColumns?.length ? stored.skus.visibleColumns : SKU_COLUMNS },
        });
      }
    } catch {
      setConfig(DEFAULT_CONFIG);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config, mounted]);

  const updateProductsConfig = (updater: (current: ProductsPageConfig["products"]) => ProductsPageConfig["products"]) => setConfig((current) => ({ ...current, products: updater(current.products) }));
  const updateSkusConfig = (updater: (current: ProductsPageConfig["skus"]) => ProductsPageConfig["skus"]) => setConfig((current) => ({ ...current, skus: updater(current.skus) }));
  const navigateToDetail = useCallback((product: Product) => router.push(`/admin/products/${product.productId}`), [router]);
  const navigateToSkuDetail = useCallback((sku: Sku) => router.push(`/admin/products/sku/${sku.skuId}`), [router]);

  const filteredProducts = useMemo(() => {
    let list = rawProducts;
    const pageConfig = config.products;
    if (!pageConfig.statuses.includes("all")) list = list.filter((p) => pageConfig.statuses.includes(p.status));
    const q = normalize(pageConfig.globalSearch.query);
    if (q && pageConfig.globalSearch.fields.length > 0) {
      const fieldMap = new Map(PRODUCT_SEARCH_FIELDS.map((field) => [field.value, field.getValue]));
      list = list.filter((product) => pageConfig.globalSearch.fields.some((field) => normalize(fieldMap.get(field)?.(product) ?? "").includes(q)));
    }
    const idQuery = normalize(pageConfig.columnSearch.productId ?? "");
    if (idQuery) list = list.filter((product) => normalize(product.productId).includes(idQuery));
    const nameQuery = normalize(pageConfig.columnSearch.name ?? "");
    if (nameQuery) list = list.filter((product) => normalize(product.name).includes(nameQuery));
    const categoryQuery = normalize(pageConfig.columnSearch.category ?? "");
    if (categoryQuery) list = list.filter((product) => normalize(categoryMap.get(product.categoryId) ?? "").includes(categoryQuery));
    return list;
  }, [config.products]);

  const filteredSkus = useMemo(() => {
    let list = rawSkus;
    const pageConfig = config.skus;
    if (!pageConfig.statuses.includes("all")) list = list.filter((sku) => pageConfig.statuses.includes(sku.status));
    const q = normalize(pageConfig.globalSearch.query);
    if (q && pageConfig.globalSearch.fields.length > 0) {
      const fieldMap = new Map(SKU_SEARCH_FIELDS.map((field) => [field.value, field.getValue]));
      list = list.filter((sku) => pageConfig.globalSearch.fields.some((field) => normalize(fieldMap.get(field)?.(sku) ?? "").includes(q)));
    }
    const skuQuery = normalize(pageConfig.columnSearch.skuId ?? "");
    if (skuQuery) list = list.filter((sku) => normalize(sku.skuId).includes(skuQuery));
    const variantQuery = normalize(pageConfig.columnSearch.variantLabel ?? "");
    if (variantQuery) list = list.filter((sku) => normalize(sku.variantLabel).includes(variantQuery));
    const productQuery = normalize(pageConfig.columnSearch.product ?? "");
    if (productQuery) list = list.filter((sku) => normalize(productNameMap.get(sku.productId) ?? sku.productId).includes(productQuery));
    return list;
  }, [config.skus]);

  const productStats = useMemo(() => computeProductStats(filteredProducts), [filteredProducts]);
  const skuStats = useMemo(() => computeSkuStats(filteredSkus), [filteredSkus]);

  const toggleProductStatus = (status: ProductStatusFilter) => updateProductsConfig((current) => {
    if (status === "all") return { ...current, statuses: ["all"] };
    const withoutAll = current.statuses.filter((item) => item !== "all");
    const next = withoutAll.includes(status) ? withoutAll.filter((item) => item !== status) : [...withoutAll, status];
    return { ...current, statuses: next.length ? next : ["all"] };
  });
  const toggleSkuStatus = (status: SkuStatusFilter) => updateSkusConfig((current) => {
    if (status === "all") return { ...current, statuses: ["all"] };
    const withoutAll = current.statuses.filter((item) => item !== "all");
    const next = withoutAll.includes(status) ? withoutAll.filter((item) => item !== status) : [...withoutAll, status];
    return { ...current, statuses: next.length ? next : ["all"] };
  });

  const productColumns: (ColumnDef<Product> & { key: ProductTableColumnKey })[] = [
    { key: "productId", header: "Mã SP", sortable: true, compare: (a, b) => a.productId.localeCompare(b.productId), headerFilter: <ColumnFilterButton value={config.products.columnSearch.productId ?? ""} label="Mã SP" placeholder="Lọc mã SP" onChange={(value) => updateProductsConfig((current) => ({ ...current, columnSearch: { ...current.columnSearch, productId: value } }))} />, cell: (row) => <Link href={`/admin/products/${row.productId}`} onClick={(e) => e.stopPropagation()} className="font-[family-name:var(--font-mono)] text-[0.8125rem] font-medium text-accent hover:underline">{row.productId}</Link> },
    { key: "name", header: "Tên sản phẩm", sortable: true, compare: (a, b) => a.name.localeCompare(b.name), headerFilter: <ColumnFilterButton value={config.products.columnSearch.name ?? ""} label="Tên sản phẩm" placeholder="Lọc tên" onChange={(value) => updateProductsConfig((current) => ({ ...current, columnSearch: { ...current.columnSearch, name: value } }))} />, cell: (row) => <Link href={`/admin/products/${row.productId}`} onClick={(e) => e.stopPropagation()} className="text-[0.8125rem] font-medium text-ink-primary hover:text-accent hover:underline">{row.name}</Link> },
    { ...textCell<Product>("category", "Danh mục", (row) => categoryMap.get(row.categoryId) ?? "—", { sortable: true, compare: (a, b) => (categoryMap.get(a.categoryId) ?? "").localeCompare(categoryMap.get(b.categoryId) ?? ""), color: "secondary" }), key: "category", headerFilter: <ColumnFilterButton value={config.products.columnSearch.category ?? ""} label="Danh mục" placeholder="Lọc danh mục" onChange={(value) => updateProductsConfig((current) => ({ ...current, columnSearch: { ...current.columnSearch, category: value } }))} /> },
    { key: "type", header: "Loại", sortable: true, compare: (a, b) => a.type.localeCompare(b.type), cell: (row) => <span className="text-[0.8125rem] text-ink-secondary">{row.type === "Customizable" ? "Tùy chỉnh" : "Tiêu chuẩn"}</span> },
    { key: "skuCount", header: "SKU", align: "right", sortable: true, compare: (a, b) => (skuCountMap.get(a.productId) ?? 0) - (skuCountMap.get(b.productId) ?? 0), cell: (row) => <span className="font-[family-name:var(--font-mono)] text-[0.8125rem] font-medium tabular-nums text-ink-primary">{skuCountMap.get(row.productId) ?? 0}</span> },
    statusCell<Product>("status", "Trạng thái", (row) => row.status, "product", { sortable: true, compare: (a, b) => a.status.localeCompare(b.status), withIcon: true }) as ColumnDef<Product> & { key: ProductTableColumnKey },
    { key: "actions", header: "", cell: (row) => <Link href={`/admin/products/${row.productId}`} onClick={(e) => e.stopPropagation()} className="flex size-7 items-center justify-center rounded-[var(--r-sm)] border border-border-default bg-bg-surface text-ink-tertiary transition-colors hover:bg-bg-muted hover:text-ink-primary" aria-label="Xem chi tiết"><Eye className="size-3.5" /></Link> },
  ];

  const skuColumns: (ColumnDef<Sku> & { key: SkuTableColumnKey })[] = [
    { key: "skuId", header: "Mã SKU", sortable: true, compare: (a, b) => a.skuId.localeCompare(b.skuId), headerFilter: <ColumnFilterButton value={config.skus.columnSearch.skuId ?? ""} label="Mã SKU" placeholder="Lọc SKU" onChange={(value) => updateSkusConfig((current) => ({ ...current, columnSearch: { ...current.columnSearch, skuId: value } }))} />, cell: (row) => <Link href={`/admin/products/sku/${row.skuId}`} onClick={(e) => e.stopPropagation()} className="font-[family-name:var(--font-mono)] text-[0.8125rem] font-medium text-accent hover:underline">{row.skuId}</Link> },
    { ...textCell<Sku>("variantLabel", "Biến thể", (row) => row.variantLabel, { sortable: true, compare: (a, b) => a.variantLabel.localeCompare(b.variantLabel), color: "primary" }), key: "variantLabel", headerFilter: <ColumnFilterButton value={config.skus.columnSearch.variantLabel ?? ""} label="Biến thể" placeholder="Lọc biến thể" onChange={(value) => updateSkusConfig((current) => ({ ...current, columnSearch: { ...current.columnSearch, variantLabel: value } }))} /> },
    { key: "productId", header: "Sản phẩm", sortable: true, compare: (a, b) => a.productId.localeCompare(b.productId), headerFilter: <ColumnFilterButton value={config.skus.columnSearch.product ?? ""} label="Sản phẩm" placeholder="Lọc sản phẩm" onChange={(value) => updateSkusConfig((current) => ({ ...current, columnSearch: { ...current.columnSearch, product: value } }))} />, cell: (row) => <Link href={`/admin/products/${row.productId}`} onClick={(e) => e.stopPropagation()} className="text-[0.8125rem] text-ink-secondary hover:text-accent hover:underline">{productNameMap.get(row.productId) ?? row.productId}</Link> },
    textCell<Sku>("uom", "UoM", (row) => row.uom, { color: "secondary" }) as ColumnDef<Sku> & { key: SkuTableColumnKey },
    numberCell<Sku>("stockOnHand", "Tồn kho", (row) => row.stockOnHand, { sortable: true, compare: (a, b) => a.stockOnHand - b.stockOnHand }) as ColumnDef<Sku> & { key: SkuTableColumnKey },
    numberCell<Sku>("stockAvailable", "Khả dụng", (row) => row.stockAvailable, { sortable: true, compare: (a, b) => a.stockAvailable - b.stockAvailable }) as ColumnDef<Sku> & { key: SkuTableColumnKey },
    moneyCell<Sku>("cost", "Giá vốn", (row) => row.cost, formatVND, { sortable: true, compare: (a, b) => a.cost - b.cost }) as ColumnDef<Sku> & { key: SkuTableColumnKey },
    statusCell<Sku>("status", "Trạng thái", (row) => row.status, "sku", { sortable: true, compare: (a, b) => a.status.localeCompare(b.status), withIcon: true }) as ColumnDef<Sku> & { key: SkuTableColumnKey },
    { key: "actions", header: "", cell: (row) => <Link href={`/admin/products/sku/${row.skuId}`} onClick={(e) => e.stopPropagation()} className="flex size-7 items-center justify-center rounded-[var(--r-sm)] border border-border-default bg-bg-surface text-ink-tertiary transition-colors hover:bg-bg-muted hover:text-ink-primary" aria-label="Xem chi tiết"><Eye className="size-3.5" /></Link> },
  ];

  const renderToolbar = () => {
    if (activeTab === "products") {
      const pageConfig = config.products;
      const hasStatusFilter = !pageConfig.statuses.includes("all");
      const hasGlobalSearch = Boolean(pageConfig.globalSearch.query.trim());
      const activeColumnSearch = Object.entries(pageConfig.columnSearch).filter(([, value]) => value?.trim());
      const hasFieldConfig = pageConfig.globalSearch.fields.length !== DEFAULT_CONFIG.products.globalSearch.fields.length || pageConfig.globalSearch.fields.some((field) => !DEFAULT_CONFIG.products.globalSearch.fields.includes(field));
      const visibleColumnCount = pageConfig.visibleColumns.filter((column) => column !== "actions").length;
      const hasColumnConfig = visibleColumnCount !== PRODUCT_COLUMNS.length - 1;
      const hasAnyConfig = hasStatusFilter || hasGlobalSearch || hasFieldConfig || activeColumnSearch.length > 0 || pageConfig.showStats || hasColumnConfig;
      const summaryItems: ListSummaryItem[] = [
        { label: "Stats", value: pageConfig.showStats ? "Đang hiện" : "Đang ẩn" },
        { label: "Trạng thái", value: pageConfig.statuses.map((status) => PRODUCT_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status).join(", "), active: hasStatusFilter, onClear: () => updateProductsConfig((current) => ({ ...current, statuses: ["all"] })) },
        { label: "Search chính", value: hasGlobalSearch ? `“${pageConfig.globalSearch.query}”` : "Chưa dùng", active: hasGlobalSearch, onClear: () => updateProductsConfig((current) => ({ ...current, globalSearch: { ...current.globalSearch, query: "" } })) },
        { label: "Trường search", value: pageConfig.globalSearch.fields.map((field) => PRODUCT_SEARCH_FIELDS.find((option) => option.value === field)?.label ?? field).join(", ") || "Chưa chọn", active: hasFieldConfig, onClear: () => updateProductsConfig((current) => ({ ...current, globalSearch: { ...current.globalSearch, fields: DEFAULT_CONFIG.products.globalSearch.fields } })) },
        { label: "Search trong cột", value: activeColumnSearch.length ? activeColumnSearch.map(([key, value]) => `${PRODUCT_COLUMN_SEARCH_LABELS[key as ProductColumnSearchKey]} “${value}”`).join(", ") : "Chưa dùng", active: activeColumnSearch.length > 0, onClear: () => updateProductsConfig((current) => ({ ...current, columnSearch: {} })) },
        { label: "Cột hiển thị", value: `${visibleColumnCount}/${PRODUCT_COLUMNS.length - 1}`, active: hasColumnConfig, onClear: () => updateProductsConfig((current) => ({ ...current, visibleColumns: PRODUCT_COLUMNS })) },
      ];
      return <ListToolbar search={pageConfig.globalSearch.query} onSearchChange={(value) => updateProductsConfig((current) => ({ ...current, globalSearch: { ...current.globalSearch, query: value } }))} searchPlaceholder="Tìm sản phẩm theo mã, tên, danh mục..." statusOptions={PRODUCT_STATUS_OPTIONS} selectedStatuses={pageConfig.statuses} onToggleStatus={toggleProductStatus} onClearStatuses={() => updateProductsConfig((current) => ({ ...current, statuses: ["all"] }))} hasStatusFilter={hasStatusFilter} fieldOptions={PRODUCT_SEARCH_FIELDS} selectedFields={pageConfig.globalSearch.fields} defaultFields={DEFAULT_CONFIG.products.globalSearch.fields} onToggleField={(field) => updateProductsConfig((current) => ({ ...current, globalSearch: { ...current.globalSearch, fields: current.globalSearch.fields.includes(field) ? current.globalSearch.fields.filter((item) => item !== field) : [...current.globalSearch.fields, field] } }))} onResetFields={() => updateProductsConfig((current) => ({ ...current, globalSearch: { ...current.globalSearch, fields: DEFAULT_CONFIG.products.globalSearch.fields } }))} onSelectAllFields={() => updateProductsConfig((current) => ({ ...current, globalSearch: { ...current.globalSearch, fields: PRODUCT_SEARCH_FIELDS.map((field) => field.value) } }))} hasFieldConfig={hasFieldConfig} columnOptions={PRODUCT_COLUMNS.map((column) => ({ label: PRODUCT_COLUMN_LABELS[column], value: column }))} selectedColumns={pageConfig.visibleColumns} defaultColumns={PRODUCT_COLUMNS} lockedColumns={["actions"]} visibleColumnCount={visibleColumnCount} onToggleColumn={(column) => column !== "actions" && updateProductsConfig((current) => ({ ...current, visibleColumns: current.visibleColumns.includes(column) ? current.visibleColumns.filter((item) => item !== column) : [...current.visibleColumns, column] }))} onResetColumns={() => updateProductsConfig((current) => ({ ...current, visibleColumns: PRODUCT_COLUMNS }))} hasColumnConfig={hasColumnConfig} selectedCount={prodSelectedKeys.size} onBulkDelete={() => { toast.info("Xoá sản phẩm", `Đã chọn ${prodSelectedKeys.size} sản phẩm. Chức năng này đang ở UI-only.`); setProdSelectedKeys(new Set()); }} onExport={() => toast.success("Xuất file mock", `Sẵn sàng xuất ${filteredProducts.length} sản phẩm đang hiển thị.`)} summaryItems={summaryItems} onResetAll={() => updateProductsConfig(() => DEFAULT_CONFIG.products)} resetDisabled={!hasAnyConfig} />;
    }

    const pageConfig = config.skus;
    const hasStatusFilter = !pageConfig.statuses.includes("all");
    const hasGlobalSearch = Boolean(pageConfig.globalSearch.query.trim());
    const activeColumnSearch = Object.entries(pageConfig.columnSearch).filter(([, value]) => value?.trim());
    const hasFieldConfig = pageConfig.globalSearch.fields.length !== DEFAULT_CONFIG.skus.globalSearch.fields.length || pageConfig.globalSearch.fields.some((field) => !DEFAULT_CONFIG.skus.globalSearch.fields.includes(field));
    const visibleColumnCount = pageConfig.visibleColumns.filter((column) => column !== "actions").length;
    const hasColumnConfig = visibleColumnCount !== SKU_COLUMNS.length - 1;
    const hasAnyConfig = hasStatusFilter || hasGlobalSearch || hasFieldConfig || activeColumnSearch.length > 0 || pageConfig.showStats || hasColumnConfig;
    const summaryItems: ListSummaryItem[] = [
      { label: "Stats", value: pageConfig.showStats ? "Đang hiện" : "Đang ẩn" },
      { label: "Trạng thái", value: pageConfig.statuses.map((status) => SKU_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status).join(", "), active: hasStatusFilter, onClear: () => updateSkusConfig((current) => ({ ...current, statuses: ["all"] })) },
      { label: "Search chính", value: hasGlobalSearch ? `“${pageConfig.globalSearch.query}”` : "Chưa dùng", active: hasGlobalSearch, onClear: () => updateSkusConfig((current) => ({ ...current, globalSearch: { ...current.globalSearch, query: "" } })) },
      { label: "Trường search", value: pageConfig.globalSearch.fields.map((field) => SKU_SEARCH_FIELDS.find((option) => option.value === field)?.label ?? field).join(", ") || "Chưa chọn", active: hasFieldConfig, onClear: () => updateSkusConfig((current) => ({ ...current, globalSearch: { ...current.globalSearch, fields: DEFAULT_CONFIG.skus.globalSearch.fields } })) },
      { label: "Search trong cột", value: activeColumnSearch.length ? activeColumnSearch.map(([key, value]) => `${SKU_COLUMN_SEARCH_LABELS[key as SkuColumnSearchKey]} “${value}”`).join(", ") : "Chưa dùng", active: activeColumnSearch.length > 0, onClear: () => updateSkusConfig((current) => ({ ...current, columnSearch: {} })) },
      { label: "Cột hiển thị", value: `${visibleColumnCount}/${SKU_COLUMNS.length - 1}`, active: hasColumnConfig, onClear: () => updateSkusConfig((current) => ({ ...current, visibleColumns: SKU_COLUMNS })) },
    ];
    return <ListToolbar search={pageConfig.globalSearch.query} onSearchChange={(value) => updateSkusConfig((current) => ({ ...current, globalSearch: { ...current.globalSearch, query: value } }))} searchPlaceholder="Tìm SKU theo mã, biến thể, barcode..." statusOptions={SKU_STATUS_OPTIONS} selectedStatuses={pageConfig.statuses} onToggleStatus={toggleSkuStatus} onClearStatuses={() => updateSkusConfig((current) => ({ ...current, statuses: ["all"] }))} hasStatusFilter={hasStatusFilter} fieldOptions={SKU_SEARCH_FIELDS} selectedFields={pageConfig.globalSearch.fields} defaultFields={DEFAULT_CONFIG.skus.globalSearch.fields} onToggleField={(field) => updateSkusConfig((current) => ({ ...current, globalSearch: { ...current.globalSearch, fields: current.globalSearch.fields.includes(field) ? current.globalSearch.fields.filter((item) => item !== field) : [...current.globalSearch.fields, field] } }))} onResetFields={() => updateSkusConfig((current) => ({ ...current, globalSearch: { ...current.globalSearch, fields: DEFAULT_CONFIG.skus.globalSearch.fields } }))} onSelectAllFields={() => updateSkusConfig((current) => ({ ...current, globalSearch: { ...current.globalSearch, fields: SKU_SEARCH_FIELDS.map((field) => field.value) } }))} hasFieldConfig={hasFieldConfig} columnOptions={SKU_COLUMNS.map((column) => ({ label: SKU_COLUMN_LABELS[column], value: column }))} selectedColumns={pageConfig.visibleColumns} defaultColumns={SKU_COLUMNS} lockedColumns={["actions"]} visibleColumnCount={visibleColumnCount} onToggleColumn={(column) => column !== "actions" && updateSkusConfig((current) => ({ ...current, visibleColumns: current.visibleColumns.includes(column) ? current.visibleColumns.filter((item) => item !== column) : [...current.visibleColumns, column] }))} onResetColumns={() => updateSkusConfig((current) => ({ ...current, visibleColumns: SKU_COLUMNS }))} hasColumnConfig={hasColumnConfig} selectedCount={skuSelectedKeys.size} onBulkDelete={() => { toast.info("Xoá SKU", `Đã chọn ${skuSelectedKeys.size} SKU. Chức năng này đang ở UI-only.`); setSkuSelectedKeys(new Set()); }} onExport={() => toast.success("Xuất file mock", `Sẵn sàng xuất ${filteredSkus.length} SKU đang hiển thị.`)} summaryItems={summaryItems} onResetAll={() => updateSkusConfig(() => DEFAULT_CONFIG.skus)} resetDisabled={!hasAnyConfig} />;
  };

  return (
    <>
      <PageHeader
        title="Sản phẩm & SKU"
        breadcrumbs={[{ label: "Back-office", href: "/admin" }, { label: "Sản phẩm" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button type="button" variant={(activeTab === "products" ? config.products.showStats : config.skus.showStats) ? "secondary" : "outline"} size="sm" onClick={() => activeTab === "products" ? updateProductsConfig((current) => ({ ...current, showStats: !current.showStats })) : updateSkusConfig((current) => ({ ...current, showStats: !current.showStats }))} className={cn("rounded-[var(--r-sm)]", (activeTab === "products" ? config.products.showStats : config.skus.showStats) && "border border-accent bg-accent/10 text-accent hover:bg-accent/10 hover:text-accent")}><BarChart3 className="size-3.5" />{(activeTab === "products" ? config.products.showStats : config.skus.showStats) ? "Ẩn thống kê" : "Hiện thống kê"}</Button>
            {activeTab === "products" ? <Button variant="default" type="button" size="sm" onClick={() => router.push("/admin/products/create")} className="rounded-[var(--r-sm)] bg-brand !text-ink-inverse hover:bg-brand-hover hover:!text-ink-inverse"><Plus className="size-3.5" />Tạo sản phẩm</Button> : <span className="inline-flex items-center gap-1.5 rounded-[var(--r-sm)] border border-border-default bg-bg-subtle px-3 py-1.5 text-xs text-ink-tertiary">SKU tự sinh từ tổ hợp biến thể</span>}
          </div>
        }
      />

      <div className="mb-4 flex gap-0 border-b border-border-default">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return <Button key={tab.key} type="button" variant="ghost" onClick={() => setActiveTab(tab.key)} className={cn("h-auto rounded-none border-b-2 bg-transparent px-4 py-2 text-[0.8125rem] font-medium transition-colors hover:bg-bg-muted/60", isActive ? "border-accent text-accent hover:text-accent" : "border-transparent text-ink-tertiary hover:text-ink-primary")}><Icon className="size-3.5" />{tab.label}<span className={cn("ml-1 rounded-full px-1.5 py-0.5 text-[0.625rem] font-semibold tabular-nums", isActive ? "bg-accent/10 text-accent" : "bg-bg-muted text-ink-tertiary")}>{tab.key === "products" ? rawProducts.length : rawSkus.length}</span></Button>;
        })}
      </div>

      {activeTab === "products" ? (
        <>
          <ListStatsPanel stats={productStats} open={config.products.showStats} gridClassName="lg:grid-cols-4 xl:grid-cols-7" />
          {renderToolbar()}
          <DataTable data={filteredProducts} columns={productColumns.filter((column) => config.products.visibleColumns.includes(column.key))} rowKey={(row) => row.productId} caption={`Hiển thị ${filteredProducts.length} sản phẩm`} flagRow={shouldFlagProduct} onRowClick={navigateToDetail} selectable selectedKeys={prodSelectedKeys} onSelectionChange={setProdSelectedKeys} pageSize={15} />
        </>
      ) : (
        <>
          <ListStatsPanel stats={skuStats} open={config.skus.showStats} gridClassName="lg:grid-cols-4 xl:grid-cols-7" />
          {renderToolbar()}
          <DataTable data={filteredSkus} columns={skuColumns.filter((column) => config.skus.visibleColumns.includes(column.key))} rowKey={(row) => row.skuId} caption={`Hiển thị ${filteredSkus.length} SKU`} flagRow={shouldFlagSku} onRowClick={navigateToSkuDetail} selectable selectedKeys={skuSelectedKeys} onSelectionChange={setSkuSelectedKeys} pageSize={15} />
        </>
      )}
    </>
  );
}
