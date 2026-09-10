"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  ClipboardCheck,
  Clock,
  Eye,
  PackageCheck,
  Plus,
  ReceiptText,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatTile } from "@/components/shared/StatTile";
import { FilterBar } from "@/components/shared/FilterBar";
import { SearchBar } from "@/components/shared/SearchBar";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import {
  textCell,
  dateCell,
  statusCell,
} from "@/components/shared/column-helpers";
import {
  purchaseOrders,
  suppliers,
  warehouses,
  formatVND,
  type PurchaseOrder,
} from "@/lib/mock-data";

/* -------------------------------------------------------------------------- */
/*  Currency formatter                                                        */
/* -------------------------------------------------------------------------- */

const formatUSD = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount,
  );

function formatMoney(amount: number, currency: string): string {
  return currency === "USD" ? formatUSD(amount) : formatVND(amount);
}

function formatCompactVND(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ ₫`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr ₫`;
  return formatVND(amount);
}

/* -------------------------------------------------------------------------- */
/*  Stats helpers                                                             */
/* -------------------------------------------------------------------------- */

function computeStats(list: PurchaseOrder[]) {
  const total = list.length;
  const draft = list.filter((po) => po.status === "Draft").length;
  const pendingApproval = list.filter(
    (po) => po.status === "Pending Approval",
  ).length;
  const confirmed = list.filter((po) => po.status === "Confirmed").length;
  const partiallyReceived = list.filter(
    (po) => po.status === "Partially Received",
  ).length;
  const received = list.filter((po) => po.status === "Received").length;
  const totalValueVND = list
    .filter((po) => po.currency === "VND")
    .reduce((s, po) => s + po.grandTotal, 0);

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

/* -------------------------------------------------------------------------- */
/*  Filter chips                                                              */
/* -------------------------------------------------------------------------- */

const STATUS_FILTERS = [
  { label: "Tất cả", value: "all" },
  { label: "Draft", value: "Draft" },
  { label: "Pending Approval", value: "Pending Approval" },
  { label: "Approved", value: "Approved" },
  { label: "Confirmed", value: "Confirmed" },
  { label: "Partially Received", value: "Partially Received" },
  { label: "Received", value: "Received" },
  { label: "Closed", value: "Closed" },
  { label: "Cancelled", value: "Cancelled" },
];

/* -------------------------------------------------------------------------- */
/*  Row flag — highlight POs needing attention                                */
/* -------------------------------------------------------------------------- */

function shouldFlag(row: PurchaseOrder): boolean {
  return ["Pending Approval", "Cancelled"].includes(row.status);
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Filtered + searched data
  const filtered = useMemo(() => {
    let list = purchaseOrders;
    if (statusFilter !== "all") {
      list = list.filter((po) => po.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((po) => {
        const supplierName =
          suppliers
            .find((s) => s.supplierId === po.supplierId)
            ?.name.toLowerCase() ?? "";
        return (
          po.poNumber.toLowerCase().includes(q) || supplierName.includes(q)
        );
      });
    }
    return list;
  }, [search, statusFilter]);

  const stats = useMemo(() => computeStats(filtered), [filtered]);

  const navigateToDetail = (po: PurchaseOrder) =>
    router.push(`/admin/purchase-orders/${po.poId}`);

  // Columns
  const columns: ColumnDef<PurchaseOrder>[] = [
    {
      key: "poNumber",
      header: "Mã PO",
      sortable: true,
      compare: (a, b) => a.poNumber.localeCompare(b.poNumber),
      cell: (row) => (
        <Link
          href={`/admin/purchase-orders/${row.poId}`}
          className="font-[family-name:var(--font-mono)] text-[0.8125rem] font-medium text-accent hover:underline"
          onClick={(e) => {
            e.preventDefault();
            navigateToDetail(row);
          }}
        >
          {row.poNumber}
        </Link>
      ),
    },
    textCell<PurchaseOrder>(
      "supplier",
      "Nhà cung cấp",
      (row) =>
        suppliers.find((s) => s.supplierId === row.supplierId)?.name ?? "—",
      {
        sortable: true,
        compare: (a, b) => {
          const nameA =
            suppliers.find((s) => s.supplierId === a.supplierId)?.name ?? "";
          const nameB =
            suppliers.find((s) => s.supplierId === b.supplierId)?.name ?? "";
          return nameA.localeCompare(nameB);
        },
        color: "primary",
      },
    ),
    textCell<PurchaseOrder>(
      "warehouse",
      "Kho nhận",
      (row) =>
        warehouses.find((w) => w.warehouseId === row.warehouseId)?.name ?? "—",
      {
        sortable: true,
        compare: (a, b) => {
          const nameA =
            warehouses.find((w) => w.warehouseId === a.warehouseId)?.name ?? "";
          const nameB =
            warehouses.find((w) => w.warehouseId === b.warehouseId)?.name ?? "";
          return nameA.localeCompare(nameB);
        },
        color: "secondary",
      },
    ),
    dateCell<PurchaseOrder>(
      "expectedDate",
      "Ngày giao DK",
      (row) => row.expectedDate,
      {
        sortable: true,
        compare: (a, b) =>
          new Date(a.expectedDate).getTime() -
          new Date(b.expectedDate).getTime(),
      },
    ),
    {
      key: "grandTotal",
      header: "Tổng tiền",
      align: "right" as const,
      sortable: true,
      compare: (a, b) => a.grandTotal - b.grandTotal,
      cell: (row) => (
        <span className="font-[family-name:var(--font-mono)] font-medium tabular-nums text-ink-primary">
          {formatMoney(row.grandTotal, row.currency)}
        </span>
      ),
    },
    statusCell<PurchaseOrder>(
      "status",
      "Trạng thái",
      (row) => row.status,
      "po",
      {
        sortable: true,
        compare: (a, b) => a.status.localeCompare(b.status),
        withIcon: true,
      },
    ),
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigateToDetail(row);
          }}
          className="flex size-7 items-center justify-center rounded-[var(--r-sm)] border border-border-default bg-bg-surface text-ink-tertiary transition-colors hover:bg-bg-muted hover:text-ink-primary"
          aria-label="Xem chi tiết"
        >
          <Eye className="size-3.5" />
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Đơn đặt NCC"
        breadcrumbs={[
          { label: "Back-office", href: "/admin" },
          { label: "Đơn đặt NCC" },
        ]}
        actions={
          <button
            type="button"
            onClick={() => router.push("/admin/purchase-orders/create")}
            className="inline-flex items-center gap-1.5 rounded-[var(--r-sm)] bg-brand px-3 py-1.5 text-[0.8125rem] font-medium text-ink-inverse transition-colors hover:bg-brand-hover"
          >
            <Plus className="size-3.5" />
            Tạo đơn đặt hàng
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {stats.map((s) => (
          <StatTile key={s.label} label={s.label} value={s.value} icon={s.icon} />
        ))}
      </div>

      <FilterBar
        chips={STATUS_FILTERS}
        active={statusFilter}
        onChange={setStatusFilter}
        className="mb-4"
      >
        <SearchBar
          placeholder="Tìm mã PO / NCC..."
          value={search}
          onChange={setSearch}
          className="order-first basis-full lg:basis-[280px] lg:grow-0"
        />
      </FilterBar>

      <DataTable
        data={filtered}
        columns={columns}
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
