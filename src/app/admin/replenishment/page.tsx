"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRightCircle, CheckCircle, ClipboardList, Clock, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatTile } from "@/components/shared/StatTile";
import { FilterBar } from "@/components/shared/FilterBar";
import { SearchBar } from "@/components/shared/SearchBar";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "@/components/shared/Toast";
import {
  textCell,
  numberCell,
  statusCell,
} from "@/components/shared/column-helpers";
import {
  replenishmentProposals,
  skus,
  purchaseOrders,
  type ReplenishmentProposal,
} from "@/lib/mock-data";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/** Compute incoming qty for a SKU: sum of (orderedQty - receivedQty) across
 *  all PO lines where PO status is "Confirmed" or "Partially Received". */
function computeIncoming(skuId: string): number {
  return purchaseOrders
    .filter((po) => po.status === "Confirmed" || po.status === "Partially Received")
    .flatMap((po) => po.lines)
    .filter((line) => line.skuId === skuId)
    .reduce((sum, line) => sum + (line.orderedQty - line.receivedQty), 0);
}

/* -------------------------------------------------------------------------- */
/*  Stats                                                                     */
/* -------------------------------------------------------------------------- */

function computeStats(list: ReplenishmentProposal[]) {
  const total = list.length;
  const draft = list.filter((p) => p.status === "Draft Proposal").length;
  const reviewed = list.filter((p) => p.status === "Reviewed").length;
  const converted = list.filter((p) => p.status === "Converted").length;

  return [
    { label: "Tổng đề xuất", value: total.toString(), icon: ClipboardList },
    { label: "Đề xuất nháp", value: draft.toString(), icon: Clock },
    { label: "Đã xem xét", value: reviewed.toString(), icon: CheckCircle },
    { label: "Đã chuyển PO", value: converted.toString(), icon: RefreshCw },
  ];
}

/* -------------------------------------------------------------------------- */
/*  Filter chips                                                              */
/* -------------------------------------------------------------------------- */

const STATUS_FILTERS = [
  { label: "Tất cả", value: "all" },
  { label: "Draft Proposal", value: "Draft Proposal" },
  { label: "Reviewed", value: "Reviewed" },
  { label: "Converted", value: "Converted" },
];

/* -------------------------------------------------------------------------- */
/*  Row flag — highlight rows where stock is critical                         */
/* -------------------------------------------------------------------------- */

function shouldFlag(row: ReplenishmentProposal): boolean {
  const sku = skus.find((s) => s.skuId === row.skuId);
  if (!sku) return false;
  return sku.stockOnHand === 0 || sku.stockAvailable < sku.reorderPoint;
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function ReplenishmentPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [convertTarget, setConvertTarget] = useState<ReplenishmentProposal | null>(null);

  // Filtered + searched data
  const filtered = useMemo(() => {
    let list = replenishmentProposals;
    if (statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => {
        const sku = skus.find((s) => s.skuId === p.skuId);
        return (
          p.skuId.toLowerCase().includes(q) ||
          (sku?.variantLabel ?? "").toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [search, statusFilter]);

  const stats = useMemo(() => computeStats(filtered), [filtered]);

  const handleConvertClick = (row: ReplenishmentProposal) => {
    setConvertTarget(row);
    setConfirmOpen(true);
  };

  const handleConfirmConvert = () => {
    toast.success("Mock action", "Đề xuất đã chuyển thành Draft PO (UI-only).");
    setConvertTarget(null);
  };

  // Columns
  const columns: ColumnDef<ReplenishmentProposal>[] = [
    {
      key: "skuId",
      header: "SKU",
      sortable: true,
      compare: (a, b) => a.skuId.localeCompare(b.skuId),
      cell: (row) => (
        <span className="font-[family-name:var(--font-mono)] text-[0.8125rem] font-medium text-accent">
          {row.skuId}
        </span>
      ),
    },
    textCell<ReplenishmentProposal>("variantLabel", "Tên SKU", (row) => {
      const sku = skus.find((s) => s.skuId === row.skuId);
      return sku?.variantLabel ?? "—";
    }, {
      sortable: true,
      compare: (a, b) => {
        const aLabel = skus.find((s) => s.skuId === a.skuId)?.variantLabel ?? "";
        const bLabel = skus.find((s) => s.skuId === b.skuId)?.variantLabel ?? "";
        return aLabel.localeCompare(bLabel);
      },
      color: "primary",
    }),
    numberCell<ReplenishmentProposal>("stockOnHand", "Tồn hiện tại", (row) => {
      const sku = skus.find((s) => s.skuId === row.skuId);
      return sku?.stockOnHand ?? 0;
    }, {
      sortable: true,
      compare: (a, b) => {
        const aVal = skus.find((s) => s.skuId === a.skuId)?.stockOnHand ?? 0;
        const bVal = skus.find((s) => s.skuId === b.skuId)?.stockOnHand ?? 0;
        return aVal - bVal;
      },
    }),
    {
      key: "incoming",
      header: "Hàng đang về",
      align: "right" as const,
      sortable: true,
      compare: (a, b) => computeIncoming(a.skuId) - computeIncoming(b.skuId),
      cell: (row) => (
        <span className="font-[family-name:var(--font-mono)] tabular-nums text-[0.8125rem] font-medium text-ink-primary">
          {computeIncoming(row.skuId).toLocaleString("vi-VN")}
        </span>
      ),
    },
    numberCell<ReplenishmentProposal>("stockReserved", "Hàng chờ xuất", (row) => {
      const sku = skus.find((s) => s.skuId === row.skuId);
      return sku?.stockReserved ?? 0;
    }, {
      sortable: true,
      compare: (a, b) => {
        const aVal = skus.find((s) => s.skuId === a.skuId)?.stockReserved ?? 0;
        const bVal = skus.find((s) => s.skuId === b.skuId)?.stockReserved ?? 0;
        return aVal - bVal;
      },
    }),
    numberCell<ReplenishmentProposal>("reorderPoint", "Reorder point", (row) => {
      const sku = skus.find((s) => s.skuId === row.skuId);
      return sku?.reorderPoint ?? 0;
    }, {
      sortable: true,
      compare: (a, b) => {
        const aVal = skus.find((s) => s.skuId === a.skuId)?.reorderPoint ?? 0;
        const bVal = skus.find((s) => s.skuId === b.skuId)?.reorderPoint ?? 0;
        return aVal - bVal;
      },
    }),
    {
      key: "suggestedQty",
      header: "SL đề xuất",
      align: "right" as const,
      sortable: true,
      compare: (a, b) => a.suggestedQty - b.suggestedQty,
      cell: (row) => (
        <span className="font-[family-name:var(--font-mono)] tabular-nums text-[0.8125rem] font-bold text-accent">
          {row.suggestedQty.toLocaleString("vi-VN")}
        </span>
      ),
    },
    textCell<ReplenishmentProposal>("reason", "Lý do", (row) => row.reason, {
      color: "secondary",
    }),
    statusCell<ReplenishmentProposal>("status", "Trạng thái", (row) => row.status, "proposal", {
      sortable: true,
      compare: (a, b) => a.status.localeCompare(b.status),
      withIcon: true,
    }),
    {
      key: "actions",
      header: "",
      cell: (row) => {
        if (row.status === "Reviewed") {
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleConvertClick(row);
              }}
              className="inline-flex items-center gap-1 rounded-[var(--r-sm)] border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
            >
              <ArrowRightCircle className="size-3.5" />
              Convert
            </button>
          );
        }
        if (row.status === "Converted" && row.convertedToPoId) {
          return (
            <Link
              href={`/admin/purchase-orders/${row.convertedToPoId}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              {row.convertedToPoId}
            </Link>
          );
        }
        return null;
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Đề xuất nhập hàng"
        breadcrumbs={[
          { label: "Back-office", href: "/admin" },
          { label: "Đề xuất nhập hàng" },
        ]}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
          placeholder="Tìm SKU ID hoặc tên..."
          value={search}
          onChange={setSearch}
          className="order-first basis-full lg:basis-[280px] lg:grow-0"
        />
      </FilterBar>

      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(row) => row.proposalId}
        caption={`Hiển thị ${filtered.length} đề xuất nhập hàng`}
        flagRow={shouldFlag}
        pageSize={15}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Chuyển thành Draft PO"
        description={`Xác nhận chuyển đề xuất ${convertTarget?.proposalId ?? ""} thành Draft PO?`}
        confirmLabel="Chuyển PO"
        variant="default"
        onConfirm={handleConfirmConvert}
      />
    </>
  );
}
