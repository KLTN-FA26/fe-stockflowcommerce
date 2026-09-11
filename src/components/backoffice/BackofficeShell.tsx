"use client";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "cn";
import { useTheme } from "@/components/theme-provider";
import { SearchBar } from "@/components/shared/SearchBar";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  warehouses,
  staffUsers,
  purchaseOrders,
  invoices,
  pickTasks,
  packingTasks,
  shipments,
  putawayTasks,
  transferOrders,
  moveTasks,
  type Warehouse,
} from "@/lib/mock-data";
import {
  LayoutDashboard,
  Package,
  FileText,
  ShoppingCart,
  Receipt,
  Warehouse as WarehouseIcon,
  MapPin,
  Lightbulb,
  ArrowRightLeft,
  Move,
  ClipboardList,
  PackageCheck,
  Truck,
  Palette,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Warning dot counts — computed from mock data                             */
/* -------------------------------------------------------------------------- */

const WARNING_STATUSES: Record<string, string[]> = {
  "/admin/purchase-orders": ["Pending Approval"],
  "/admin/invoices": ["Exception", "Disputed"],
  "/admin/putaway": ["On Hold"],
  "/admin/picking": ["Short", "On Hold"],
  "/admin/packing": ["Verification Failed", "On Hold"],
  "/admin/shipments": ["Exception", "Delivery Failed"],
  "/admin/transfers": ["Partially Received"],
  "/admin/moves": ["On Hold", "Discrepancy"],
};

function computeWarningCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  counts["/admin/purchase-orders"] = purchaseOrders.filter((po) =>
    WARNING_STATUSES["/admin/purchase-orders"]!.includes(po.status)
  ).length;
  counts["/admin/invoices"] = invoices.filter((inv) =>
    WARNING_STATUSES["/admin/invoices"]!.includes(inv.status)
  ).length;
  counts["/admin/putaway"] = putawayTasks.filter((pt) =>
    WARNING_STATUSES["/admin/putaway"]!.includes(pt.status)
  ).length;
  counts["/admin/picking"] = pickTasks.filter((pk) =>
    WARNING_STATUSES["/admin/picking"]!.includes(pk.status)
  ).length;
  counts["/admin/packing"] = packingTasks.filter((pa) =>
    WARNING_STATUSES["/admin/packing"]!.includes(pa.status)
  ).length;
  counts["/admin/shipments"] = shipments.filter((sh) =>
    WARNING_STATUSES["/admin/shipments"]!.includes(sh.status)
  ).length;
  counts["/admin/transfers"] = transferOrders.filter((to) =>
    WARNING_STATUSES["/admin/transfers"]!.includes(to.status)
  ).length;
  counts["/admin/moves"] = moveTasks.filter((mv) =>
    WARNING_STATUSES["/admin/moves"]!.includes(mv.status)
  ).length;
  return counts;
}

/* -------------------------------------------------------------------------- */
/*  Sidebar nav config                                                       */
/* -------------------------------------------------------------------------- */

interface NavItem {
  label: string;
  tooltip: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "TỔNG QUAN",
    items: [
      { label: "Tổng quan", tooltip: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    title: "MASTER DATA",
    items: [
      { label: "Sản phẩm & SKU", tooltip: "Products & SKUs", href: "/admin/products", icon: Package },
      { label: "Thuộc tính biến thể", tooltip: "Variant Attributes", href: "/admin/variants", icon: Palette },
      { label: "Nhà cung cấp", tooltip: "Suppliers", href: "/admin/suppliers", icon: Users },
    ],
  },
  {
    title: "MUA HÀNG",
    items: [
      { label: "Đề xuất nhập hàng", tooltip: "Replenishment", href: "/admin/replenishment", icon: Lightbulb },
      { label: "Đơn đặt NCC", tooltip: "Purchase Orders", href: "/admin/purchase-orders", icon: ShoppingCart },
      { label: "Hoá đơn NCC", tooltip: "Supplier Invoices", href: "/admin/invoices", icon: Receipt },
    ],
  },
  {
    title: "NHẬP HÀNG",
    items: [
      { label: "Phiếu nhận", tooltip: "Receipts", href: "/admin/receipts", icon: FileText },
      { label: "Cất hàng", tooltip: "Putaway", href: "/admin/putaway", icon: PackageCheck },
    ],
  },
  {
    title: "KHO",
    items: [
      { label: "Kho map & slotting", tooltip: "Warehouse Map", href: "/admin/warehouse-map", icon: MapPin },
      { label: "Gợi ý vị trí", tooltip: "Slotting Suggestions", href: "/admin/slotting", icon: Lightbulb },
      { label: "Chuyển kho liên kho", tooltip: "Inter-warehouse Transfers", href: "/admin/transfers", icon: ArrowRightLeft },
      { label: "Di chuyển nội bộ", tooltip: "Intra-warehouse Moves", href: "/admin/moves", icon: Move },
    ],
  },
  {
    title: "THỰC HIỆN ĐƠN",
    items: [
      { label: "Đơn hàng", tooltip: "Orders", href: "/admin/orders", icon: ClipboardList },
      { label: "Lấy hàng", tooltip: "Picking", href: "/admin/picking", icon: WarehouseIcon },
      { label: "Đóng gói", tooltip: "Packing", href: "/admin/packing", icon: PackageCheck },
      { label: "Vận đơn", tooltip: "Shipments", href: "/admin/shipments", icon: Truck },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Current user                                                             */
/* -------------------------------------------------------------------------- */

const currentUser = staffUsers[0]!; // Trần Minh Quang

/* -------------------------------------------------------------------------- */
/*  Breadcrumb helper                                                        */
/* -------------------------------------------------------------------------- */

function pathToBreadcrumb(pathname: string): string {
  // find matching nav item
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (pathname === item.href || pathname.startsWith(item.href + "/")) {
        return item.label;
      }
    }
  }
  return "Back-office";
}

/* -------------------------------------------------------------------------- */
/*  Sidebar nội dung — dùng shadcn primitives, giữ nguyên style StockFlow     */
/* -------------------------------------------------------------------------- */

function BackofficeSidebar() {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  const warningCounts = useMemo(() => computeWarningCounts(), []);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border-default [&_[data-slot=sidebar-inner]]:bg-bg-subtle"
    >
      {/* Logo + nút thu nhỏ */}
      <SidebarHeader
        className={cn(
          "h-12 shrink-0 flex-row items-center border-b border-border-default p-0",
          collapsed ? "justify-center px-0" : "gap-1.5 px-3"
        )}
      >
        {!collapsed && (
          <span className="truncate font-[family-name:var(--font-display)] text-[1.05rem] font-bold tracking-tight text-ink-primary">
            StockFlow<span className="text-accent">Commerce</span>
          </span>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          className={cn(
            "size-7 shrink-0 rounded-[var(--r-sm)] bg-transparent text-ink-tertiary hover:bg-bg-muted hover:text-ink-primary",
            !collapsed && "ml-auto"
          )}
          aria-label={collapsed ? "Mở rộng sidebar" : "Thu nhỏ sidebar"}
          title={collapsed ? "Mở rộng sidebar" : "Thu nhỏ sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
      </SidebarHeader>

      {/* Nav groups */}
      <SidebarContent className="gap-0 px-2 py-2">
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.title} className="mb-1.5 gap-0 p-0">
            {collapsed ? (
              <div className="mx-auto my-1.5 w-8 border-t border-border-default" />
            ) : (
              <SidebarGroupLabel className="h-auto px-2.5 pt-3 pb-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-ink-tertiary">
                {group.title}
              </SidebarGroupLabel>
            )}

            <SidebarGroupContent>
              <SidebarMenu
                className={cn("gap-0.5", collapsed && "items-center")}
              >
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  const warnCount = warningCounts[item.href] ?? 0;

                  return (
                    <SidebarMenuItem
                      key={item.href}
                      className={cn(collapsed && "w-8")}
                    >
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.tooltip}
                        className={cn(
                          "h-auto rounded-[var(--r-sm)] transition-colors duration-150",
                          collapsed
                            ? "justify-center gap-0 group-data-[collapsible=icon]:overflow-visible"
                            : "gap-2.5 px-2.5 py-1.5 text-[0.8125rem]",
                          isActive
                            ? "bg-brand font-medium text-ink-inverse hover:bg-brand hover:text-ink-inverse data-active:bg-brand data-active:text-ink-inverse"
                            : "text-ink-secondary hover:bg-bg-muted hover:text-ink-primary"
                        )}
                      >
                        <Link href={item.href}>
                          <Icon className="size-4 shrink-0" />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </Link>
                      </SidebarMenuButton>

                      {/* Warning dot */}
                      {warnCount > 0 &&
                        (collapsed ? (
                          <span className="pointer-events-none absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-positive text-[0.5625rem] font-bold leading-none text-white ring-2 ring-bg-subtle">
                            {warnCount}
                          </span>
                        ) : (
                          <SidebarMenuBadge className="inset-y-0 my-auto size-[18px] min-w-0 justify-center rounded-full bg-positive px-0 text-[0.5625rem] font-bold leading-none text-white peer-data-[size=default]/menu-button:top-0 peer-hover/menu-button:text-white peer-data-active/menu-button:text-white">
                            {warnCount}
                          </SidebarMenuBadge>
                        ))}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

    </Sidebar>
  );
}

/* -------------------------------------------------------------------------- */
/*  Shell                                                                    */
/* -------------------------------------------------------------------------- */

export function BackofficeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [whMenuOpen, setWhMenuOpen] = useState(false);

  const selectedWhLabel = useMemo(() => {
    if (selectedWarehouse === "all") return "Tất cả kho";
    const wh = warehouses.find((w: Warehouse) => w.warehouseId === selectedWarehouse);
    return wh ? wh.code : selectedWarehouse;
  }, [selectedWarehouse]);

  const currentPageLabel = pathToBreadcrumb(pathname);

  return (
    <TooltipProvider>
      <SidebarProvider
        data-mode="A"
        className="bg-bg-surface"
        style={
          {
            "--sidebar-width": "240px",
            "--sidebar-width-icon": "60px",
          } as React.CSSProperties
        }
      >
        <BackofficeSidebar />

        {/* ================================================================== */}
        {/*  Main area                                                        */}
        {/* ================================================================== */}
        <SidebarInset className="flex min-h-0 min-w-0 flex-col bg-bg-surface">
          {/* Topbar */}
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border-default bg-bg-surface px-4">
            {/* Mobile sidebar trigger */}
            <SidebarTrigger className="size-8 shrink-0 text-ink-secondary hover:bg-bg-muted hover:text-ink-primary md:hidden" />

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1 text-[0.8125rem]">
              <Link href="/admin" className="text-ink-tertiary transition-colors hover:text-ink-primary">
                Back-office
              </Link>
              {currentPageLabel !== "Tổng quan" && (
                <>
                  <span className="text-ink-tertiary">/</span>
                  <span className="font-medium text-ink-primary">{currentPageLabel}</span>
                </>
              )}
            </nav>

            <div className="flex-1" />

            {/* Global search */}
            <SearchBar
              placeholder="Tìm nhanh (⌘K)"
              className="max-w-[240px]"
              aria-label="Tìm toàn cục"
            />

            {/* Warehouse selector dropdown */}
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setWhMenuOpen((o) => !o);
                  setUserMenuOpen(false);
                }}
                className="rounded-[var(--r-sm)] border-border-default bg-bg-subtle px-2.5 py-1 text-xs font-medium text-ink-secondary transition-colors hover:bg-bg-muted hover:text-ink-primary"
              >
                <WarehouseIcon className="size-3.5" />
                <span>{selectedWhLabel}</span>
                <ChevronDown className="size-3" />
              </Button>
              {whMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[800]" onClick={() => setWhMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-[801] mt-1 w-56 rounded-[var(--r-md)] border border-border-default bg-bg-surface py-1 shadow-[var(--sh-lg)]">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setSelectedWarehouse("all");
                        setWhMenuOpen(false);
                      }}
                      className={cn(
                        "h-auto w-full justify-start gap-2 rounded-none bg-transparent px-3 py-1.5 text-left text-[0.8125rem] transition-colors hover:bg-bg-muted",
                        selectedWarehouse === "all"
                          ? "font-medium text-accent"
                          : "text-ink-secondary"
                      )}
                    >
                      Tất cả kho
                    </Button>
                    {warehouses.map((wh: Warehouse) => (
                      <Button
                        key={wh.warehouseId}
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setSelectedWarehouse(wh.warehouseId);
                          setWhMenuOpen(false);
                        }}
                        className={cn(
                          "h-auto w-full justify-start gap-2 rounded-none bg-transparent px-3 py-1.5 text-left text-[0.8125rem] transition-colors hover:bg-bg-muted",
                          selectedWarehouse === wh.warehouseId
                            ? "font-medium text-accent"
                            : "text-ink-secondary"
                        )}
                      >
                        <span className="font-[family-name:var(--font-mono)] text-xs text-ink-tertiary">
                          {wh.code}
                        </span>
                        <span className="truncate">{wh.name}</span>
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Theme toggle */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="rounded-[var(--r-sm)] border-border-default bg-bg-surface text-ink-secondary transition-colors hover:bg-bg-muted hover:text-ink-primary"
              aria-label={theme === "dark" ? "Chuyển sang Light" : "Chuyển sang Dark"}
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>

            {/* User menu */}
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setUserMenuOpen((o) => !o);
                  setWhMenuOpen(false);
                }}
                className="h-auto gap-2 rounded-[var(--r-sm)] bg-transparent px-1 py-0.5 transition-colors hover:bg-bg-muted"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                  {currentUser.fullName
                    .split(" ")
                    .slice(-2)
                    .map((w) => w[0])
                    .join("")}
                </div>
              </Button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[800]" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-[801] mt-1 w-64 rounded-[var(--r-md)] border border-border-default bg-bg-surface py-1 shadow-[var(--sh-lg)]">
                    {/* User info header */}
                    <div className="border-b border-border-default px-3 py-2">
                      <div className="text-[0.8125rem] font-semibold text-ink-primary">
                        {currentUser.fullName}
                      </div>
                      <div className="text-xs text-ink-tertiary">{currentUser.email}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {currentUser.roles.map((role) => (
                          <span
                            key={role}
                            className="rounded-full bg-bg-subtle px-2 py-0.5 text-[0.625rem] font-medium text-ink-secondary"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Menu items */}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setUserMenuOpen(false)}
                      className="h-auto w-full justify-start gap-2 rounded-none bg-transparent px-3 py-1.5 text-[0.8125rem] text-ink-secondary transition-colors hover:bg-bg-muted hover:text-ink-primary"
                    >
                      <User className="size-3.5" />
                      Hồ sơ cá nhân
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setUserMenuOpen(false)}
                      className="h-auto w-full justify-start gap-2 rounded-none bg-transparent px-3 py-1.5 text-[0.8125rem] text-ink-secondary transition-colors hover:bg-bg-muted hover:text-ink-primary"
                    >
                      <Settings className="size-3.5" />
                      Cài đặt
                    </Button>
                    <div className="my-1 border-t border-border-default" />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setUserMenuOpen(false)}
                      className="h-auto w-full justify-start gap-2 rounded-none bg-transparent px-3 py-1.5 text-[0.8125rem] text-danger transition-colors hover:bg-bg-muted hover:text-danger"
                    >
                      <LogOut className="size-3.5" />
                      Đăng xuất
                    </Button>
                  </div>
                </>
              )}
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-auto p-4">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
