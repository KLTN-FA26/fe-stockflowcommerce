"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "cn";

import { PUBLIC_ROUTES } from "@/constants";

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
import { useAuthStore } from "@/lib/auth/auth-store";
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
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Warning dot counts — loaded dynamically from mock data (mock mode only)  */
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

interface WarehouseData {
  warehouseId: string;
  code: string;
  name: string;
}

/**
 * Dynamically load warning counts and warehouses from mock-data.
 * This avoids a top-level import of mock-data.ts (which violates CLAUDE.md).
 * In production, these would come from API calls via React Query.
 */
function useShellData() {
  const [warningCounts, setWarningCounts] = useState<Record<string, number>>({});
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_MOCK !== "true") return;

    import("@/lib/mock-data").then((mod) => {
      // Compute warning counts
      const counts: Record<string, number> = {};
      counts["/admin/purchase-orders"] = mod.purchaseOrders.filter(
        (po) => WARNING_STATUSES["/admin/purchase-orders"]?.includes(po.status) ?? false,
      ).length;
      counts["/admin/invoices"] = mod.invoices.filter(
        (inv) => WARNING_STATUSES["/admin/invoices"]?.includes(inv.status) ?? false,
      ).length;
      counts["/admin/putaway"] = mod.putawayTasks.filter(
        (pt) => WARNING_STATUSES["/admin/putaway"]?.includes(pt.status) ?? false,
      ).length;
      counts["/admin/picking"] = mod.pickTasks.filter(
        (pk) => WARNING_STATUSES["/admin/picking"]?.includes(pk.status) ?? false,
      ).length;
      counts["/admin/packing"] = mod.packingTasks.filter(
        (pa) => WARNING_STATUSES["/admin/packing"]?.includes(pa.status) ?? false,
      ).length;
      counts["/admin/shipments"] = mod.shipments.filter(
        (sh) => WARNING_STATUSES["/admin/shipments"]?.includes(sh.status) ?? false,
      ).length;
      counts["/admin/transfers"] = mod.transferOrders.filter(
        (to) => WARNING_STATUSES["/admin/transfers"]?.includes(to.status) ?? false,
      ).length;
      counts["/admin/moves"] = mod.moveTasks.filter(
        (mv) => WARNING_STATUSES["/admin/moves"]?.includes(mv.status) ?? false,
      ).length;
      setWarningCounts(counts);

      // Load warehouses
      setWarehouses(
        mod.warehouses.map((wh) => ({
          warehouseId: wh.warehouseId,
          code: wh.code,
          name: wh.name,
        })),
      );
    });
  }, []);

  return { warningCounts, warehouses };
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
    items: [{ label: "Tổng quan", tooltip: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    title: "MASTER DATA",
    items: [
      {
        label: "Sản phẩm & SKU",
        tooltip: "Products & SKUs",
        href: "/admin/products",
        icon: Package,
      },
      {
        label: "Thuộc tính biến thể",
        tooltip: "Variant Attributes",
        href: "/admin/variants",
        icon: Palette,
      },
      { label: "Nhà cung cấp", tooltip: "Suppliers", href: "/admin/suppliers", icon: Users },
    ],
  },
  {
    title: "MUA HÀNG",
    items: [
      {
        label: "Đề xuất nhập hàng",
        tooltip: "Replenishment",
        href: "/admin/replenishment",
        icon: Lightbulb,
      },
      {
        label: "Đơn đặt NCC",
        tooltip: "Purchase Orders",
        href: "/admin/purchase-orders",
        icon: ShoppingCart,
      },
      {
        label: "Hoá đơn NCC",
        tooltip: "Supplier Invoices",
        href: "/admin/invoices",
        icon: Receipt,
      },
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
      {
        label: "Kho map & slotting",
        tooltip: "Warehouse Map",
        href: "/admin/warehouse-map",
        icon: MapPin,
      },
      {
        label: "Gợi ý vị trí",
        tooltip: "Slotting Suggestions",
        href: "/admin/slotting",
        icon: Lightbulb,
      },
      {
        label: "Chuyển kho liên kho",
        tooltip: "Inter-warehouse Transfers",
        href: "/admin/transfers",
        icon: ArrowRightLeft,
      },
      {
        label: "Di chuyển nội bộ",
        tooltip: "Intra-warehouse Moves",
        href: "/admin/moves",
        icon: Move,
      },
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

function BackofficeSidebar({ warningCounts }: { warningCounts: Record<string, number> }) {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar
      collapsible="icon"
      className="border-border-default [&_[data-slot=sidebar-inner]]:bg-bg-subtle border-r"
    >
      {/* Logo + nút thu nhỏ */}
      <SidebarHeader
        className={cn(
          "border-border-default h-12 shrink-0 flex-row items-center border-b p-0",
          collapsed ? "justify-center px-0" : "gap-1.5 px-3",
        )}
      >
        {!collapsed && (
          <span className="text-ink-primary truncate font-[family-name:var(--font-display)] text-[1.05rem] font-bold tracking-tight">
            StockFlow<span className="text-accent">Commerce</span>
          </span>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          className={cn(
            "text-ink-tertiary hover:bg-bg-muted hover:text-ink-primary size-7 shrink-0 rounded-[var(--r-sm)] bg-transparent",
            !collapsed && "ml-auto",
          )}
          aria-label={collapsed ? "Mở rộng sidebar" : "Thu nhỏ sidebar"}
          title={collapsed ? "Mở rộng sidebar" : "Thu nhỏ sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </SidebarHeader>

      {/* Nav groups */}
      <SidebarContent className="gap-0 px-2 py-2">
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.title} className="mb-1.5 gap-0 p-0">
            {collapsed ? (
              <div className="border-border-default mx-auto my-1.5 w-8 border-t" />
            ) : (
              <SidebarGroupLabel className="text-ink-tertiary h-auto px-2.5 pt-3 pb-0.5 text-[0.625rem] font-semibold tracking-[0.08em] uppercase">
                {group.title}
              </SidebarGroupLabel>
            )}

            <SidebarGroupContent>
              <SidebarMenu className={cn("gap-0.5", collapsed && "items-center")}>
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  const warnCount = warningCounts[item.href] ?? 0;

                  return (
                    <SidebarMenuItem key={item.href} className={cn(collapsed && "w-8")}>
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
                            ? "bg-brand text-ink-inverse hover:bg-brand hover:text-ink-inverse data-active:bg-brand data-active:text-ink-inverse font-medium"
                            : "text-ink-secondary hover:bg-bg-muted hover:text-ink-primary",
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
                          <span className="bg-positive ring-bg-subtle pointer-events-none absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[0.5625rem] leading-none font-bold text-white ring-2">
                            {warnCount}
                          </span>
                        ) : (
                          <SidebarMenuBadge className="bg-positive inset-y-0 my-auto size-[18px] min-w-0 justify-center rounded-full px-0 text-[0.5625rem] leading-none font-bold text-white peer-hover/menu-button:text-white peer-data-active/menu-button:text-white peer-data-[size=default]/menu-button:top-0">
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
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [whMenuOpen, setWhMenuOpen] = useState(false);

  // Read current user from auth store (not hardcoded mock data)
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // Load mock data dynamically (warning counts + warehouses)
  const { warningCounts, warehouses } = useShellData();

  const handleLogout = useCallback(() => {
    setUserMenuOpen(false);
    logout();
    router.replace(PUBLIC_ROUTES.login);
  }, [logout, router]);

  const selectedWhLabel = useMemo(() => {
    if (selectedWarehouse === "all") return "Tất cả kho";
    const wh = warehouses.find((w) => w.warehouseId === selectedWarehouse);
    return wh ? wh.code : selectedWarehouse;
  }, [selectedWarehouse, warehouses]);

  const currentPageLabel = pathToBreadcrumb(pathname);

  // Derive user initials for avatar
  const userInitials = useMemo(() => {
    if (!user) return "??";
    return user.fullName
      .split(" ")
      .slice(-2)
      .map((w) => w[0])
      .join("");
  }, [user]);

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
        <BackofficeSidebar warningCounts={warningCounts} />

        {/* ================================================================== */}
        {/*  Main area                                                        */}
        {/* ================================================================== */}
        <SidebarInset className="bg-bg-surface flex min-h-0 min-w-0 flex-col">
          {/* Topbar */}
          <header className="border-border-default bg-bg-surface flex h-12 shrink-0 items-center gap-2 border-b px-4">
            {/* Mobile sidebar trigger */}
            <SidebarTrigger className="text-ink-secondary hover:bg-bg-muted hover:text-ink-primary size-8 shrink-0 md:hidden" />

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1 text-[0.8125rem]">
              <Link
                href="/admin"
                className="text-ink-tertiary hover:text-ink-primary transition-colors"
              >
                Back-office
              </Link>
              {currentPageLabel !== "Tổng quan" && (
                <>
                  <span className="text-ink-tertiary">/</span>
                  <span className="text-ink-primary font-medium">{currentPageLabel}</span>
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
                className="border-border-default bg-bg-subtle text-ink-secondary hover:bg-bg-muted hover:text-ink-primary rounded-[var(--r-sm)] px-2.5 py-1 text-xs font-medium transition-colors"
              >
                <WarehouseIcon className="size-3.5" />
                <span>{selectedWhLabel}</span>
                <ChevronDown className="size-3" />
              </Button>
              {whMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[800]" onClick={() => setWhMenuOpen(false)} />
                  <div className="border-border-default bg-bg-surface absolute top-full right-0 z-[801] mt-1 w-56 rounded-[var(--r-md)] border py-1 shadow-[var(--sh-lg)]">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setSelectedWarehouse("all");
                        setWhMenuOpen(false);
                      }}
                      className={cn(
                        "hover:bg-bg-muted h-auto w-full justify-start gap-2 rounded-none bg-transparent px-3 py-1.5 text-left text-[0.8125rem] transition-colors",
                        selectedWarehouse === "all"
                          ? "text-accent font-medium"
                          : "text-ink-secondary",
                      )}
                    >
                      Tất cả kho
                    </Button>
                    {warehouses.map((wh) => (
                      <Button
                        key={wh.warehouseId}
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setSelectedWarehouse(wh.warehouseId);
                          setWhMenuOpen(false);
                        }}
                        className={cn(
                          "hover:bg-bg-muted h-auto w-full justify-start gap-2 rounded-none bg-transparent px-3 py-1.5 text-left text-[0.8125rem] transition-colors",
                          selectedWarehouse === wh.warehouseId
                            ? "text-accent font-medium"
                            : "text-ink-secondary",
                        )}
                      >
                        <span className="text-ink-tertiary font-[family-name:var(--font-mono)] text-xs">
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
              className="border-border-default bg-bg-surface text-ink-secondary hover:bg-bg-muted hover:text-ink-primary rounded-[var(--r-sm)] transition-colors"
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
                className="hover:bg-bg-muted h-auto gap-2 rounded-[var(--r-sm)] bg-transparent px-1 py-0.5 transition-colors"
              >
                <div className="bg-accent flex size-8 items-center justify-center rounded-full text-xs font-bold text-white">
                  {userInitials}
                </div>
              </Button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[800]" onClick={() => setUserMenuOpen(false)} />
                  <div className="border-border-default bg-bg-surface absolute top-full right-0 z-[801] mt-1 w-64 rounded-[var(--r-md)] border py-1 shadow-[var(--sh-lg)]">
                    {/* User info header */}
                    <div className="border-border-default border-b px-3 py-2">
                      <div className="text-ink-primary text-[0.8125rem] font-semibold">
                        {user?.fullName ?? "—"}
                      </div>
                      <div className="text-ink-tertiary text-xs">{user?.email ?? "—"}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {user?.roles.map((role) => (
                          <span
                            key={role}
                            className="bg-bg-subtle text-ink-secondary rounded-full px-2 py-0.5 text-[0.625rem] font-medium"
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
                      className="text-ink-secondary hover:bg-bg-muted hover:text-ink-primary h-auto w-full justify-start gap-2 rounded-none bg-transparent px-3 py-1.5 text-[0.8125rem] transition-colors"
                    >
                      <User className="size-3.5" />
                      Hồ sơ cá nhân
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setUserMenuOpen(false)}
                      className="text-ink-secondary hover:bg-bg-muted hover:text-ink-primary h-auto w-full justify-start gap-2 rounded-none bg-transparent px-3 py-1.5 text-[0.8125rem] transition-colors"
                    >
                      <Settings className="size-3.5" />
                      Cài đặt
                    </Button>
                    <div className="border-border-default my-1 border-t" />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleLogout}
                      className="text-danger hover:bg-bg-muted hover:text-danger h-auto w-full justify-start gap-2 rounded-none bg-transparent px-3 py-1.5 text-[0.8125rem] transition-colors"
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
