"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, CheckCircle, ClipboardCheck, Clock, Eye, PackageCheck, Plus, ReceiptText, ShoppingCart, Truck } from "lucide-react";
import { cn } from "cn";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListStatsPanel } from "@/components/shared/ListStatsPanel";
import { ColumnFilterButton, ListToolbar, type ListSummaryItem } from "@/components/shared/ListToolbar";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { toast } from "@/components/shared/Toast";
import { Button } from "@/components/ui/button";
import { dateCell, statusCell, textCell } from "@/components/shared/column-helpers";
import { purchaseOrders, suppliers, warehouses, formatVND, type PurchaseOrder } from "@/lib/mock-data";
import { STATUS_LABEL_VI } from "@/lib/status-map";

type PoStatusFilter = "all" | PurchaseOrder["status"];
type PoSearchField = "poNumber" | "supplier" | "warehouse" | "poId";
type PoColumnSearchKey = "poNumber" | "supplier" | "warehouse";
type PoTableColumnKey = "poNumber" | "supplier" | "warehouse" | "expectedDate" | "grandTotal" | "status" | "actions";

interface PurchaseOrdersPageConfig {
  showStats: boolean;
  statuses: PoStatusFilter[];
  globalSearch: { query: string; fields: PoSearchField[] };
  columnSearch: Partial<Record<PoColumnSearchKey, string>>;
  visibleColumns: PoTableColumnKey[];
}

const STORAGE_KEY = "stockflow:admin:purchase-orders:config";
const DEFAULT_VISIBLE_COLUMNS: PoTableColumnKey[] = ["poNumber", "supplier", "warehouse", "expectedDate", "grandTotal", "status", "actions"];
const DEFAULT_CONFIG: PurchaseOrdersPageConfig = {
  showStats: false,
  statuses: ["all"],
  globalSearch: { query: "", fields: ["poNumber", "supplier"] },
  columnSearch: {},
  visibleColumns: DEFAULT_VISIBLE_COLUMNS,
};

const STATUS_OPTIONS = ["all", "Draft", "Pending Approval", "Approved", "Confirmed", "Partially Received", "Received", "Closed", "Cancelled"].map((value) => ({
  label: value === "all" ? "Tất cả" : STATUS_LABEL_VI[value] ?? value,
  value: value as PoStatusFilter,
}));

const TABLE_COLUMN_LABELS: Record<PoTableColumnKey, string> = {
  poNumber: "Mã PO",
  supplier: "Nhà cung cấp",
  warehouse: "Kho nhận",
  expectedDate: "Ngày giao DK",
  grandTotal: "Tổng tiền",
  status: "Trạng thái",
  actions: "Thao tác",
};

const COLUMN_SEARCH_LABELS: Record<PoColumnSearchKey, string> = {
  poNumber: "Mã PO",
  supplier: "Nhà cung cấp",
  warehouse: "Kho nhận",
};

const formatUSD = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
const formatMoney = (amount: number, currency: string) => currency === "USD" ? formatUSD(amount) : formatVND(amount);

function formatCompactVND(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ ₫`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr ₫`;
  return formatVND(amount);
}

function supplierName(po: PurchaseOrder) {
  return suppliers.find((supplier) => supplier.supplierId === po.supplierId)?.name ?? "";
}

function warehouseName(po: PurchaseOrder) {
  return warehouses.find((warehouse) => warehouse.warehouseId === po.warehouseId)?.name ?? "";
}

const SEARCH_FIELDS: { label: string; value: PoSearchField; getValue: (po: PurchaseOrder) => string }[] = [
  { label: "Mã PO", value: "poNumber", getValue: (po) => po.poNumber },
  { label: "Nhà cung cấp", value: "supplier", getValue: supplierName },
  { label: "Kho nhận", value: "warehouse", getValue: warehouseName },
  { label: "PO ID", value: "poId", getValue: (po) => po.poId },
];

function computeStats(list: PurchaseOrder[]) {
  const total = list.length;
  const draft = list.filter((po) => po.status === "Draft").length;
  const pendingApproval = list.filter((po) => po.status === "Pending Approval").length;
  const confirmed = list.filter((po) => po.status === "Confirmed").length;
  const partiallyReceived = list.filter((po) => po.status === "Partially Received").length;
  const received = list.filter((po) => po.status === "Received").length;
  const totalValueVND = list.filter((po) => po.currency === "VND").reduce((s, po) => s + po.grandTotal, 0);

  return [
    { label: "Tổng PO", value: total.toString(), icon: ShoppingCart },
    { label: "Nháp", value: draft.toString(), icon: Clock },
    { label: "Chờ duyệt", value: pendingApproval.toString(), icon: ClipboardCheck },
    { label: "Đã xác nhận", value: confirmed.toString(), icon: CheckCircle },
    { label: "Đang nhận", value: partiallyReceived.toString(), icon: Truck },
    { label: "Đã nhận", value: received.toString(), icon: PackageCheck },
    { label: "Tổng giá trị", value: formatCompactVND(totalValueVND), icon: ReceiptText },
  ];
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function shouldFlag(row: PurchaseOrder): boolean {
  return ["Pending Approval", "Cancelled"].includes(row.status);
}

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [config, setConfig] = useState<PurchaseOrdersPageConfig>(DEFAULT_CONFIG);
  const [mounted, setMounted] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as Partial<PurchaseOrdersPageConfig>;
        setConfig({
          ...DEFAULT_CONFIG,
          ...stored,
          globalSearch: { ...DEFAULT_CONFIG.globalSearch, ...stored.globalSearch },
          columnSearch: stored.columnSearch ?? {},
          visibleColumns: stored.visibleColumns?.length ? stored.visibleColumns : DEFAULT_VISIBLE_COLUMNS,
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

  const updateConfig = (updater: (current: PurchaseOrdersPageConfig) => PurchaseOrdersPageConfig) => setConfig((current) => updater(current));
  const navigateToDetail = (po: PurchaseOrder) => router.push(`/admin/purchase-orders/${po.poId}`);

  const toggleStatus = (status: PoStatusFilter) => {
    updateConfig((current) => {
      if (status === "all") return { ...current, statuses: ["all"] };
      const withoutAll = current.statuses.filter((item) => item !== "all");
      const next = withoutAll.includes(status) ? withoutAll.filter((item) => item !== status) : [...withoutAll, status];
      return { ...current, statuses: next.length ? next : ["all"] };
    });
  };

  const toggleSearchField = (field: PoSearchField) => {
    updateConfig((current) => {
      const fields = current.globalSearch.fields.includes(field) ? current.globalSearch.fields.filter((item) => item !== field) : [...current.globalSearch.fields, field];
      return { ...current, globalSearch: { ...current.globalSearch, fields } };
    });
  };

  const toggleTableColumn = (column: PoTableColumnKey) => {
    if (column === "actions") return;
    updateConfig((current) => {
      const visibleColumns = current.visibleColumns.includes(column) ? current.visibleColumns.filter((item) => item !== column) : [...current.visibleColumns, column];
      return { ...current, visibleColumns: visibleColumns.includes("actions") ? visibleColumns : [...visibleColumns, "actions"] };
    });
  };

  const updateColumnSearch = (key: PoColumnSearchKey, value: string) => updateConfig((current) => ({ ...current, columnSearch: { ...current.columnSearch, [key]: value } }));
  const clearColumnSearch = () => updateConfig((current) => ({ ...current, columnSearch: {} }));
  const resetAll = () => setConfig(DEFAULT_CONFIG);

  const filtered = useMemo(() => {
    let list = purchaseOrders;
    if (!config.statuses.includes("all")) list = list.filter((po) => config.statuses.includes(po.status));

    const q = normalize(config.globalSearch.query);
    if (q && config.globalSearch.fields.length > 0) {
      const fieldMap = new Map(SEARCH_FIELDS.map((field) => [field.value, field.getValue]));
      list = list.filter((po) => config.globalSearch.fields.some((field) => normalize(fieldMap.get(field)?.(po) ?? "").includes(q)));
    }

    const poQuery = normalize(config.columnSearch.poNumber ?? "");
    if (poQuery) list = list.filter((po) => normalize(po.poNumber).includes(poQuery));
    const supplierQuery = normalize(config.columnSearch.supplier ?? "");
    if (supplierQuery) list = list.filter((po) => normalize(supplierName(po)).includes(supplierQuery));
    const warehouseQuery = normalize(config.columnSearch.warehouse ?? "");
    if (warehouseQuery) list = list.filter((po) => normalize(warehouseName(po)).includes(warehouseQuery));

    return list;
  }, [config]);

  const stats = useMemo(() => computeStats(filtered), [filtered]);
  const hasStatusFilter = !config.statuses.includes("all");
  const hasGlobalSearch = Boolean(config.globalSearch.query.trim());
  const activeColumnSearch = Object.entries(config.columnSearch).filter(([, value]) => value?.trim());
  const defaultSearchFields = DEFAULT_CONFIG.globalSearch.fields;
  const hasFieldConfig = config.globalSearch.fields.length !== defaultSearchFields.length || config.globalSearch.fields.some((field) => !defaultSearchFields.includes(field));
  const visibleColumnCount = config.visibleColumns.filter((column) => column !== "actions").length;
  const hasColumnConfig = visibleColumnCount !== DEFAULT_VISIBLE_COLUMNS.length - 1;
  const hasAnyConfig = hasStatusFilter || hasGlobalSearch || hasFieldConfig || activeColumnSearch.length > 0 || config.showStats || hasColumnConfig;

  const columns: (ColumnDef<PurchaseOrder> & { key: PoTableColumnKey })[] = [
    {
      key: "poNumber",
      header: "Mã PO",
      sortable: true,
      compare: (a, b) => a.poNumber.localeCompare(b.poNumber),
      headerFilter: <ColumnFilterButton value={config.columnSearch.poNumber ?? ""} label="Mã PO" placeholder="Lọc mã PO" onChange={(value) => updateColumnSearch("poNumber", value)} />,
      cell: (row) => (
        <Link
          href={`/admin/purchase-orders/${row.poId}`}
          className="font-[family-name:var(--font-mono)] text-[0.8125rem] font-medium text-accent hover:underline"
          onClick={(event) => {
            event.preventDefault();
            navigateToDetail(row);
          }}
        >
          {row.poNumber}
        </Link>
      ),
    },
    {
      ...textCell<PurchaseOrder>("supplier", "Nhà cung cấp", (row) => supplierName(row) || "—", {
        sortable: true,
        compare: (a, b) => supplierName(a).localeCompare(supplierName(b)),
        color: "primary",
      }),
      key: "supplier",
      headerFilter: <ColumnFilterButton value={config.columnSearch.supplier ?? ""} label="Nhà cung cấp" placeholder="Lọc NCC" onChange={(value) => updateColumnSearch("supplier", value)} />,
    },
    {
      ...textCell<PurchaseOrder>("warehouse", "Kho nhận", (row) => warehouseName(row) || "—", {
        sortable: true,
        compare: (a, b) => warehouseName(a).localeCompare(warehouseName(b)),
        color: "secondary",
      }),
      key: "warehouse",
      headerFilter: <ColumnFilterButton value={config.columnSearch.warehouse ?? ""} label="Kho nhận" placeholder="Lọc kho" onChange={(value) => updateColumnSearch("warehouse", value)} />,
    },
    dateCell<PurchaseOrder>("expectedDate", "Ngày giao DK", (row) => row.expectedDate, {
      sortable: true,
      compare: (a, b) => new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime(),
    }) as ColumnDef<PurchaseOrder> & { key: PoTableColumnKey },
    {
      key: "grandTotal",
      header: "Tổng tiền",
      align: "right",
      sortable: true,
      compare: (a, b) => a.grandTotal - b.grandTotal,
      cell: (row) => <span className="font-[family-name:var(--font-mono)] font-medium tabular-nums text-ink-primary">{formatMoney(row.grandTotal, row.currency)}</span>,
    },
    statusCell<PurchaseOrder>("status", "Trạng thái", (row) => row.status, "po", {
      sortable: true,
      compare: (a, b) => a.status.localeCompare(b.status),
      withIcon: true,
    }) as ColumnDef<PurchaseOrder> & { key: PoTableColumnKey },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={(event) => {
            event.stopPropagation();
            navigateToDetail(row);
          }}
          className="rounded-[var(--r-sm)] border-border-default bg-bg-surface text-ink-tertiary hover:bg-bg-muted hover:text-ink-primary"
          aria-label="Xem chi tiết"
        >
          <Eye className="size-3.5" />
        </Button>
      ),
    },
  ];

  const visibleColumns = columns.filter((column) => config.visibleColumns.includes(column.key));
  const summaryItems: ListSummaryItem[] = [
    { label: "Stats", value: config.showStats ? "Đang hiện" : "Đang ẩn" },
    { label: "Trạng thái", value: config.statuses.map((status) => STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status).join(", "), active: hasStatusFilter, onClear: () => updateConfig((current) => ({ ...current, statuses: ["all"] })) },
    { label: "Search chính", value: hasGlobalSearch ? `“${config.globalSearch.query}”` : "Chưa dùng", active: hasGlobalSearch, onClear: () => updateConfig((current) => ({ ...current, globalSearch: { ...current.globalSearch, query: "" } })) },
    { label: "Trường search", value: config.globalSearch.fields.map((field) => SEARCH_FIELDS.find((option) => option.value === field)?.label ?? field).join(", ") || "Chưa chọn", active: hasFieldConfig, onClear: () => updateConfig((current) => ({ ...current, globalSearch: { ...current.globalSearch, fields: DEFAULT_CONFIG.globalSearch.fields } })) },
    { label: "Search trong cột", value: activeColumnSearch.length ? activeColumnSearch.map(([key, value]) => `${COLUMN_SEARCH_LABELS[key as PoColumnSearchKey]} “${value}”`).join(", ") : "Chưa dùng", active: activeColumnSearch.length > 0, onClear: clearColumnSearch },
    { label: "Cột hiển thị", value: `${visibleColumnCount}/${DEFAULT_VISIBLE_COLUMNS.length - 1}`, active: hasColumnConfig, onClear: () => updateConfig((current) => ({ ...current, visibleColumns: DEFAULT_VISIBLE_COLUMNS })) },
  ];

  return (
    <>
      <PageHeader
        title="Đơn đặt NCC"
        breadcrumbs={[{ label: "Back-office", href: "/admin" }, { label: "Đơn đặt NCC" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={config.showStats ? "secondary" : "outline"}
              size="sm"
              onClick={() => updateConfig((current) => ({ ...current, showStats: !current.showStats }))}
              className={cn("rounded-[var(--r-sm)]", config.showStats && "border border-accent bg-accent/10 text-accent hover:bg-accent/10 hover:text-accent")}
            >
              <BarChart3 className="size-3.5" />
              {config.showStats ? "Ẩn thống kê" : "Hiện thống kê"}
            </Button>
            <Button variant="default" type="button" size="sm" onClick={() => router.push("/admin/purchase-orders/create")} className="rounded-[var(--r-sm)] bg-brand !text-ink-inverse hover:bg-brand-hover hover:!text-ink-inverse">
              <Plus className="size-3.5" />
              Tạo đơn đặt hàng
            </Button>
          </div>
        }
      />

      <ListStatsPanel stats={stats} open={config.showStats} gridClassName="lg:grid-cols-4 xl:grid-cols-7" />

      <ListToolbar
        search={config.globalSearch.query}
        onSearchChange={(value) => updateConfig((current) => ({ ...current, globalSearch: { ...current.globalSearch, query: value } }))}
        searchPlaceholder="Tìm PO theo mã, NCC, kho..."
        statusOptions={STATUS_OPTIONS}
        selectedStatuses={config.statuses}
        onToggleStatus={toggleStatus}
        onClearStatuses={() => updateConfig((current) => ({ ...current, statuses: ["all"] }))}
        hasStatusFilter={hasStatusFilter}
        fieldOptions={SEARCH_FIELDS}
        selectedFields={config.globalSearch.fields}
        defaultFields={DEFAULT_CONFIG.globalSearch.fields}
        onToggleField={toggleSearchField}
        onResetFields={() => updateConfig((current) => ({ ...current, globalSearch: { ...current.globalSearch, fields: DEFAULT_CONFIG.globalSearch.fields } }))}
        onSelectAllFields={() => updateConfig((current) => ({ ...current, globalSearch: { ...current.globalSearch, fields: SEARCH_FIELDS.map((field) => field.value) } }))}
        hasFieldConfig={hasFieldConfig}
        columnOptions={DEFAULT_VISIBLE_COLUMNS.map((column) => ({ label: TABLE_COLUMN_LABELS[column], value: column }))}
        selectedColumns={config.visibleColumns}
        defaultColumns={DEFAULT_VISIBLE_COLUMNS}
        lockedColumns={["actions"]}
        visibleColumnCount={visibleColumnCount}
        onToggleColumn={toggleTableColumn}
        onResetColumns={() => updateConfig((current) => ({ ...current, visibleColumns: DEFAULT_VISIBLE_COLUMNS }))}
        hasColumnConfig={hasColumnConfig}
        selectedCount={selectedKeys.size}
        onBulkDelete={() => {
          toast.info("Xoá PO", `Đã chọn ${selectedKeys.size} đơn đặt hàng. Chức năng này đang ở UI-only.`);
          setSelectedKeys(new Set());
        }}
        onExport={() => toast.success("Xuất file mock", `Sẵn sàng xuất ${filtered.length} đơn đặt hàng đang hiển thị.`)}
        summaryItems={summaryItems}
        onResetAll={resetAll}
        resetDisabled={!hasAnyConfig}
      />

      <DataTable
        data={filtered}
        columns={visibleColumns}
        rowKey={(row) => row.poId}
        caption={`Hiển thị ${filtered.length} đơn đặt hàng`}
        flagRow={shouldFlag}
        onRowClick={navigateToDetail}
        selectable
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        pageSize={15}
      />
    </>
  );
}
