"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Plus,
  Star,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatTile } from "@/components/shared/StatTile";
import { FilterBar } from "@/components/shared/FilterBar";
import { SearchBar } from "@/components/shared/SearchBar";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { suppliers, type Supplier } from "@/lib/mock-data";

const STATUS_FILTERS = [
  { label: "Tất cả", value: "all" },
  { label: "Đang hoạt động", value: "active" },
  { label: "Tạm ngưng", value: "inactive" },
];

function computeStats(list: Supplier[]) {
  const active = list.filter((supplier) => supplier.active).length;
  const inactive = list.length - active;
  const avgRating = list.length
    ? (list.reduce((sum, supplier) => sum + supplier.rating, 0) / list.length).toFixed(1)
    : "0.0";
  const avgLeadTime = list.length
    ? Math.round(list.reduce((sum, supplier) => sum + supplier.leadTimeDays, 0) / list.length)
    : 0;

  return [
    { label: "Tổng NCC", value: list.length.toString(), icon: Building2 },
    { label: "Đang hoạt động", value: active.toString(), icon: CheckCircle },
    { label: "Tạm ngưng", value: inactive.toString(), icon: FileText },
    { label: "Rating TB", value: avgRating, icon: Star },
    { label: "Lead time TB", value: `${avgLeadTime} ngày`, icon: Clock },
  ];
}

function fullAddress(supplier: Supplier) {
  const { street, ward, district, province } = supplier.address;
  return [street, ward, district, province].filter(Boolean).join(", ");
}

export default function SuppliersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    let list = suppliers;
    if (statusFilter === "active") list = list.filter((supplier) => supplier.active);
    if (statusFilter === "inactive") list = list.filter((supplier) => !supplier.active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((supplier) =>
        [
          supplier.supplierId,
          supplier.name,
          supplier.taxCode,
          supplier.contactName,
          supplier.contactEmail,
          supplier.contactPhone,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    return list;
  }, [search, statusFilter]);

  const stats = useMemo(() => computeStats(filtered), [filtered]);

  const columns: ColumnDef<Supplier>[] = [
    {
      key: "supplierId",
      header: "Mã NCC",
      sortable: true,
      compare: (a, b) => a.supplierId.localeCompare(b.supplierId),
      cell: (row) => (
        <span className="font-[family-name:var(--font-mono)] text-[0.8125rem] font-medium text-accent">
          {row.supplierId}
        </span>
      ),
    },
    {
      key: "name",
      header: "Nhà cung cấp",
      sortable: true,
      compare: (a, b) => a.name.localeCompare(b.name),
      cell: (row) => (
        <div className="min-w-[220px]">
          <div className="font-medium text-ink-primary">{row.name}</div>
          <div className="mt-0.5 text-xs text-ink-tertiary">MST {row.taxCode}</div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Liên hệ",
      cell: (row) => (
        <div className="min-w-[190px] text-[0.8125rem] text-ink-secondary">
          <div>{row.contactName}</div>
          <div className="mt-0.5 text-xs text-ink-tertiary">{row.contactPhone}</div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (row) => <span className="text-[0.8125rem] text-ink-secondary">{row.contactEmail}</span>,
    },
    {
      key: "terms",
      header: "Terms",
      sortable: true,
      compare: (a, b) => a.paymentTerms.localeCompare(b.paymentTerms),
      cell: (row) => <span className="font-[family-name:var(--font-mono)] text-xs text-ink-secondary">{row.paymentTerms}</span>,
    },
    {
      key: "currency",
      header: "Tiền tệ",
      cell: (row) => <span className="font-[family-name:var(--font-mono)] text-xs text-ink-secondary">{row.currency}</span>,
    },
    {
      key: "leadTimeDays",
      header: "Lead time",
      align: "right",
      sortable: true,
      compare: (a, b) => a.leadTimeDays - b.leadTimeDays,
      cell: (row) => (
        <span className="font-[family-name:var(--font-mono)] text-[0.8125rem] font-medium tabular-nums text-ink-primary">
          {row.leadTimeDays} ngày
        </span>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      align: "right",
      sortable: true,
      compare: (a, b) => a.rating - b.rating,
      cell: (row) => (
        <span className="inline-flex items-center justify-end gap-1 font-[family-name:var(--font-mono)] text-[0.8125rem] font-medium tabular-nums text-ink-primary">
          <Star className="size-3 text-warning" />
          {row.rating.toFixed(1)}
        </span>
      ),
    },
    {
      key: "active",
      header: "Trạng thái",
      sortable: true,
      compare: (a, b) => Number(a.active) - Number(b.active),
      cell: (row) => (
        <span className={row.active ? "inline-flex items-center gap-1.5 rounded-full border border-positive/25 bg-positive/10 px-2.5 py-0.5 text-xs font-medium text-positive" : "inline-flex items-center gap-1.5 rounded-full border border-muted-tone/25 bg-muted-tone/10 px-2.5 py-0.5 text-xs font-medium text-muted-tone"}>
          <span className="size-1.5 rounded-full bg-current" />
          {row.active ? "Đang hoạt động" : "Tạm ngưng"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <button
          type="button"
          onClick={() => router.push(`/admin/suppliers/${row.supplierId}`)}
          className="flex size-7 items-center justify-center rounded-[var(--r-sm)] border border-border-default bg-bg-surface text-ink-tertiary transition-colors hover:bg-bg-muted hover:text-ink-primary"
          aria-label="Xem chi tiết NCC"
        >
          <Eye className="size-3.5" />
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Nhà cung cấp"
        subtitle="Quản lý hồ sơ NCC dùng cho Replenishment, Purchase Order và Supplier Invoice."
        breadcrumbs={[
          { label: "Back-office", href: "/admin" },
          { label: "Nhà cung cấp" },
        ]}
        actions={
          <button
            type="button"
            onClick={() => router.push("/admin/suppliers/create")}
            className="inline-flex items-center gap-1.5 rounded-[var(--r-sm)] bg-brand px-3 py-1.5 text-[0.8125rem] font-medium text-ink-inverse transition-colors hover:bg-brand-hover"
          >
            <Plus className="size-3.5" />
            Tạo nhà cung cấp
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
          placeholder="Tìm mã NCC / tên / MST / liên hệ..."
          value={search}
          onChange={setSearch}
          className="order-first basis-full lg:basis-[320px] lg:grow-0"
        />
      </FilterBar>

      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(row) => row.supplierId}
        caption={`Hiển thị ${filtered.length} nhà cung cấp`}
        flagRow={(row) => !row.active || row.rating < 4}
        pageSize={15}
      />

      {filtered.length > 0 && (
        <div className="mt-4 rounded-[var(--r-sm)] border border-border-default bg-bg-surface px-4 py-3 text-[0.8125rem] text-ink-secondary">
          <div className="font-medium text-ink-primary">Địa chỉ NCC đang hiển thị</div>
          <div className="mt-2 grid gap-2 lg:grid-cols-2">
            {filtered.map((supplier) => (
              <div key={supplier.supplierId} className="rounded-[var(--r-sm)] border border-border-default bg-bg-subtle px-3 py-2">
                <div className="font-[family-name:var(--font-mono)] text-xs text-accent">{supplier.supplierId}</div>
                <div className="mt-1 line-clamp-1 text-xs text-ink-secondary">{fullAddress(supplier)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
