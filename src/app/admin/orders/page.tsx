"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle,
  ClipboardList,
  Clock,
  Eye,
  Package,
  ReceiptText,
  Truck,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatTile } from "@/components/shared/StatTile";
import { FilterBar } from "@/components/shared/FilterBar";
import { SearchBar } from "@/components/shared/SearchBar";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { OrderDetailPanel } from "@/components/backoffice/OrderDetailPanel";
import {
  textCell,
  dateCell,
  moneyCell,
  statusCell,
} from "@/components/shared/column-helpers";
import { orders, orderEvents, formatVND, type Order } from "@/lib/mock-data";

function formatCompactVND(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ ₫`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr ₫`;
  return formatVND(amount);
}

/* -------------------------------------------------------------------------- */
/*  Stats helpers                                                            */
/* -------------------------------------------------------------------------- */

function computeStats(list: Order[]) {
  const total = list.length;
  const pending = list.filter((o) => o.status === "Pending Payment").length;
  const processing = list.filter((o) =>
    ["Confirmed", "In Production", "Ready to Fulfill", "Picking", "Packed"].includes(o.status)
  ).length;
  const shipped = list.filter((o) => ["Shipped", "In Transit"].includes(o.status)).length;
  const delivered = list.filter((o) => o.status === "Delivered").length;
  const attention = list.filter((o) =>
    ["Payment Failed", "Delivery Failed", "On Hold", "Partially Fulfilled", "Cancelled"].includes(o.status)
  ).length;
  const revenue = list.reduce((s, o) => s + o.grandTotal, 0);

  return [
    { label: "Tổng đơn", value: total.toString(), icon: ClipboardList },
    { label: "Chờ thanh toán", value: pending.toString(), icon: Clock },
    { label: "Đang xử lý", value: processing.toString(), icon: Package },
    { label: "Đang giao", value: shipped.toString(), icon: Truck },
    { label: "Đã giao", value: delivered.toString(), icon: CheckCircle },
    { label: "Cần chú ý", value: attention.toString(), icon: AlertTriangle },
    { label: "Doanh thu", value: formatCompactVND(revenue), icon: ReceiptText },
  ];
}

/* -------------------------------------------------------------------------- */
/*  Filter chips                                                             */
/* -------------------------------------------------------------------------- */

const STATUS_FILTERS = [
  { label: "Tất cả", value: "all" },
  { label: "Pending Payment", value: "Pending Payment" },
  { label: "Confirmed", value: "Confirmed" },
  { label: "In Production", value: "In Production" },
  { label: "Ready to Fulfill", value: "Ready to Fulfill" },
  { label: "Picking", value: "Picking" },
  { label: "Packed", value: "Packed" },
  { label: "Shipped", value: "Shipped" },
  { label: "In Transit", value: "In Transit" },
  { label: "Delivered", value: "Delivered" },
  { label: "Completed", value: "Completed" },
  { label: "Cancelled", value: "Cancelled" },
  { label: "Returned", value: "Returned" },
  { label: "Refunded", value: "Refunded" },
  { label: "Partially Refunded", value: "Partially Refunded" },
  { label: "On Hold", value: "On Hold" },
  { label: "Partially Fulfilled", value: "Partially Fulfilled" },
  { label: "Payment Failed", value: "Payment Failed" },
  { label: "Delivery Failed", value: "Delivery Failed" },
  { label: "Return Requested", value: "Return Requested" },
  { label: "Closed", value: "Closed" },
];

/* -------------------------------------------------------------------------- */
/*  Row flag — highlight orders needing attention                            */
/* -------------------------------------------------------------------------- */

function shouldFlag(row: Order): boolean {
  return ["Payment Failed", "Delivery Failed", "On Hold", "Partially Fulfilled"].includes(row.status);
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                     */
/* -------------------------------------------------------------------------- */

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Filtered + searched data
  const filtered = useMemo(() => {
    let list = orders;
    if (statusFilter !== "all") {
      list = list.filter((o) => o.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((o) => o.orderNumber.toLowerCase().includes(q));
    }
    return list;
  }, [search, statusFilter]);

  const stats = useMemo(() => computeStats(filtered), [filtered]);

  // Events for selected order
  const selectedEvents = useMemo(() => {
    if (!selectedOrder) return [];
    return orderEvents.filter((e) => e.orderId === selectedOrder.orderId);
  }, [selectedOrder]);

  const openPanel = (order: Order) => {
    setSelectedOrder(order);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
  };

  // Columns
  const columns: ColumnDef<Order>[] = [
    {
      key: "orderNumber",
      header: "Mã đơn",
      sortable: true,
      compare: (a, b) => a.orderNumber.localeCompare(b.orderNumber),
      cell: (row) => (
        <Link
          href={`/admin/orders/${row.orderId}`}
          className="font-[family-name:var(--font-mono)] text-[0.8125rem] font-medium text-accent hover:underline"
          onClick={(e) => {
            e.preventDefault();
            openPanel(row);
          }}
        >
          {row.orderNumber}
        </Link>
      ),
    },
    textCell<Order>("recipientName", "Khách", (row) => row.recipientName, {
      sortable: true,
      compare: (a, b) => a.recipientName.localeCompare(b.recipientName),
      color: "primary",
    }),
    dateCell<Order>("placedAt", "Ngày đặt", (row) => row.placedAt, {
      sortable: true,
      compare: (a, b) => new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime(),
    }),
    moneyCell<Order>("grandTotal", "Tổng tiền", (row) => row.grandTotal, formatVND, {
      sortable: true,
      compare: (a, b) => a.grandTotal - b.grandTotal,
    }),
    statusCell<Order>("status", "Trạng thái", (row) => row.status, "order", {
      sortable: true,
      compare: (a, b) => a.status.localeCompare(b.status),
      withIcon: true,
    }),
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openPanel(row);
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
        title="Đơn hàng"
        breadcrumbs={[
          { label: "Back-office", href: "/admin" },
          { label: "Đơn hàng" },
        ]}
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
          placeholder="Tìm mã đơn..."
          value={search}
          onChange={setSearch}
          className="order-first basis-full lg:basis-[280px] lg:grow-0"
        />
      </FilterBar>

      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(row) => row.orderId}
        caption={`Hiển thị ${filtered.length} đơn hàng`}
        flagRow={shouldFlag}
        onRowClick={openPanel}
        selectable
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        pageSize={15}
      />

      <OrderDetailPanel order={selectedOrder} events={selectedEvents} open={panelOpen} onClose={closePanel} />
    </>
  );
}
